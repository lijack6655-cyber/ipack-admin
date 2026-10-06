import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = dirname(dirname(fileURLToPath(import.meta.url)));
require.extensions['.ts'] = (module, filename) => {
  const source = require('node:fs').readFileSync(filename, 'utf8');
  const { outputText, diagnostics = [] } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    reportDiagnostics: true,
  });
  const errors = diagnostics.filter(item => item.category === ts.DiagnosticCategory.Error);
  if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, { getCurrentDirectory: () => root, getCanonicalFileName: value => value, getNewLine: () => '\n' }));
  module._compile(outputText, filename);
};

const { renderArticle } = require(join(root, 'src/lib/articles/render.ts'));
const image = 'https://www.ipackautoparts.com/assets/images/headlights.webp';
const article = {
  title: 'Sample Article Layout Preview', slug: 'sample-article-layout-preview', excerpt: 'Synthetic content for checking the CMS article layout.',
  seo_title: '', seo_description: '', category: 'Buyer Guide', author_name: 'I-Pack Auto Parts', published_at: '2026-10-06T00:00:00Z',
  featured_image_path: image,
  content_markdown: [
    '## Overview',
    'A sample paragraph with **bold emphasis** and a [product directory link](/product).',
    '### What to compare',
    ['| Option | Fitment notes | Buyer check |', '| --- | --- | --- |',
      '| Standard | Confirm exact OE reference and housing shape before ordering. | Compare the supplied photos and dimensions. |',
      '| Variant | Confirm the connector, lens finish, and mounting tabs against the vehicle. | Ask for the vehicle year and market. |'].join('\n'),
    '## What buyers should prepare',
    ['- Vehicle make, model, and year', '- OE or replacement reference'].join('\n'),
    ['1. Share a clear product photo', '2. Confirm required quantity and destination'].join('\n'),
    [':::tip', 'Fitment and availability should be confirmed for each inquiry.', ':::'].join('\n'),
    '> Use the OE reference and a clear photo to reduce fitment ambiguity.',
    `![Automotive headlamp product example](${image} "Product image example")`,
    '## What to compare', 'This duplicate heading checks that TOC anchors stay unique.',
    [':::faq', 'Q: What details help confirm fitment?', 'A: Share the vehicle make, model, year,', 'market, and OE reference.', ':::'].join('\n'),
    [':::faq', 'Q: Can I request a sample?', 'A: Use the contact form to share your requirement.', ':::'].join('\n'),
    [':::cta', '[Browse the product directory](/product)', ':::'].join('\n'),
  ].join('\n\n'),
};

const outputPath = join(root, '..', '..', '04_验证记录', 'article-cms-20261006', 'article-render-preview.html');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, renderArticle(article), 'utf8');
process.stdout.write(`${outputPath}\n`);
