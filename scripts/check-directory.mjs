import assert from 'node:assert/strict';
import { categoryPath,categoryOptions } from '../src/lib/products/categories.ts';
import { readFileSync } from 'node:fs';
import { createRequire,Module } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const nodes = [
  {id:'child',name:'Renamed child',slug:'stable-child',parent_id:'root',sort_order:2},
  {id:'empty',name:'Empty',slug:'empty',parent_id:null,sort_order:2},
  {id:'root',name:'Renamed root',slug:'stable-root',parent_id:null,sort_order:1},
  {id:'first',name:'First child',slug:'first-child',parent_id:'root',sort_order:1},
];
assert.deepEqual(categoryPath(nodes,'child'),[{id:'root',name:'Renamed root',slug:'stable-root'},{id:'child',name:'Renamed child',slug:'stable-child'}]);
assert.deepEqual(categoryPath(nodes,'root'),[{id:'root',name:'Renamed root',slug:'stable-root'}]);
assert.deepEqual(categoryPath(nodes,null),[]);
assert.deepEqual(categoryPath(nodes,'removed'),[]);
assert.deepEqual(categoryOptions(nodes).map(c=>[c.id,c.label]),[['root','Renamed root'],['first','Renamed root / First child'],['child','Renamed root / Renamed child'],['empty','Empty']]);
assert.equal(nodes[0].name,'Renamed child');
// Compile only the existing renderer in memory so its JSON import works under Node.
const rendererPath=fileURLToPath(new URL('../src/lib/products/render.ts',import.meta.url));
const renderer=new Module(rendererPath);renderer.filename=rendererPath;renderer.paths=createRequire(rendererPath).resolve.paths('typescript');
renderer._compile(ts.transpileModule(readFileSync(rendererPath,'utf8').replace("from './model'","from './model.ts'"),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,rendererPath);
const {productBreadcrumb,breadcrumbSchema}=renderer.exports;
const path=categoryPath(nodes,'child');
assert.match(productBreadcrumb('Test <product>',path),/href="\/product\?category=stable-root">Renamed root/);
assert.match(productBreadcrumb('Test <product>',path),/href="\/product\?category=stable-child">Renamed child/);
assert.match(productBreadcrumb('Test <product>',path),/aria-current="page">Test &lt;product&gt;/);
const schema=JSON.parse(breadcrumbSchema('Test <product>',path,'https://www.ipackautoparts.com/products/stable').replace(/^<script[^>]*>|<\/script>$/g,''));
assert.deepEqual(schema.itemListElement.map(item=>item.name),['Home','Product','Renamed root','Renamed child','Test <product>']);
assert.equal(schema.itemListElement.at(-1).item,'https://www.ipackautoparts.com/products/stable');
console.log('Directory paths/options checks passed. DB boundary checks: database/directory-workflow-check.sql (rollback).');
