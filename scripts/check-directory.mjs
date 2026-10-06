import assert from 'node:assert/strict';
import { categoryPath,categoryOptions,directoryMove } from '../src/lib/products/categories.ts';
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
// Exercise the actual page's confirmation/cancel/failure handlers without a DOM or network.
const fixtures=[{id:'product',title:'Product',slug:'product',status:'published',category_id:'root',revision:3,has_draft:false,draft_category_id:null}];
let state=[nodes.map(c=>({...c,count:0})),fixtures,null,{},'', 'child',['product'],'',null,false,false,'',''];
let hook=0,calls=[],fail=false;
const pagePath=fileURLToPath(new URL('../src/pages/admin/categories/index.tsx',import.meta.url));
const page=new Module(pagePath);page.filename=pagePath;page.paths=createRequire(pagePath).resolve.paths('react');
page.require=(name)=>({
  react:{useState:()=>{const index=hook++;return[state[index],value=>{state[index]=typeof value==='function'?value(state[index]):value;}];},useCallback:f=>f,useEffect:()=>{},useRef:()=>({current:null})},
  'next/link':{__esModule:true,default:'a'},'next/router':{useRouter:()=>({push:()=>{}})},
  '@/components/layout/AdminLayout':{__esModule:true,default:'main'},'@/components/auth/withAuth':{withAuth:f=>f},
  '@/lib/auth/store':{useAuthStore:()=>({user:{role:{name:'operator'}},logout:async()=>{}})},'@/lib/auth/permissions':{hasPermission:()=>true},
  '@/lib/products/categories':{categoryOptions,directoryMove},
  '@/lib/products/client':{productRequest:async(url,options)=>{if(options){calls.push(JSON.parse(options.body));if(fail)throw new Error('Revision conflict');return{moved:1};}return{categories:state[0],products:fixtures};}},
}[name] || createRequire(pagePath)(name));
page._compile(ts.transpileModule(readFileSync(pagePath,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,pagePath);
const render=()=>{hook=0;return page.exports.default();};
const elements=(node)=>Array.isArray(node)?node.flatMap(elements):node&&typeof node==='object'&&node.props?[node,...elements(node.props.children)]:[];
const text=(node)=>Array.isArray(node)?node.map(text).join(''):node&&typeof node==='object'?text(node.props?.children):String(node??'');
const button=(tree,label)=>elements(tree).find(node=>node.type==='button'&&text(node).startsWith(label));
button(render(),'移动选中产品').props.onClick();
assert.equal(calls.length,0,'Opening confirmation must not move products');
assert.equal(state[8].label,'Renamed root / Renamed child');
const pending=state[8];fixtures[0].revision=9;state[6]=[];state[5]='empty';
assert.deepEqual(pending.payload,{action:'move',category_id:'child',products:[{id:'product',revision:3}]},'Confirmation must retain its original revision/category snapshot');
let tree=render();assert.ok(elements(tree).filter(node=>node.type==='fieldset').every(node=>node.props.disabled));
assert.match(text(tree),/确认移动 1 个产品到“Renamed root \/ Renamed child”/);
button(tree,'取消').props.onClick();assert.equal(state[8],null);assert.equal(calls.length,0);
state[8]=pending;fail=true;button(render(),'确认移动').props.onClick();await new Promise(setImmediate);
assert.deepEqual(calls,[pending.payload]);assert.equal(state[8],pending,'Failure retains confirmation for cancel/reload');assert.equal(state[9],false);assert.equal(state[11],'Revision conflict');
fail=false;button(render(),'确认移动').props.onClick();await new Promise(setImmediate);assert.equal(state[8],null,'Successful move reloads and clears confirmation');assert.deepEqual(state[6],[]);
assert.equal(directoryMove(fixtures,[],{id:'child',label:'Child'}),null);
assert.equal(directoryMove(fixtures,['missing'],{id:'child',label:'Child'}),null);
assert.equal(directoryMove(fixtures,['product'],undefined),null);
console.log('Directory paths/options checks passed. DB boundary checks: database/directory-workflow-check.sql (rollback).');
