import assert from 'node:assert/strict';
import { articleInput, articlePublishIssues, emptyArticle } from '../src/lib/articles/model.ts';
import { articleHeadings, articleMediaPaths, hasPublishedArticleMediaReference, renderMarkdown } from '../src/lib/articles/markdown.ts';

assert.deepEqual(articlePublishIssues(emptyArticle), ['文章标题', 'Slug', '文章摘要', '正文']);
assert.equal(articleInput.safeParse({ ...emptyArticle, title: '展会文章', slug: 'automechanika-shanghai-2025', excerpt: '摘要', content_markdown: '正文', featured_image_path: '/assets/images/automechanika-shanghai-2025.jpg' }).success, true);
assert.equal(articleInput.safeParse({ ...emptyArticle, title: 'x', slug: 'Bad Slug', excerpt: 'x', content_markdown: 'x' }).success, false);
assert.equal(articleInput.safeParse({ ...emptyArticle, title: 'x', slug: 'safe-slug', excerpt: 'x', content_markdown: 'x', featured_image_path: 'javascript:alert(1)' }).success, false);
assert.equal(articleInput.safeParse({ ...emptyArticle, title: 'x', slug: 'safe-slug', excerpt: 'x', content_markdown: 'x', featured_image_path: '/assets/images/%2e%2e/private.jpg' }).success, false);

const markdown = '## Highlights\n\nSafe text <script>alert(1)</script>.\n\n- First point\n- Second point\n\n![Poster](/assets/images/poster.jpg)';
const html = renderMarkdown(markdown);
assert.match(html, /<h2 id="highlights">Highlights<\/h2>/);
assert.match(html, /<ul><li>First point<\/li><li>Second point<\/li><\/ul>/);
assert.doesNotMatch(html, /<script/i);
assert.match(html, /&lt;script&gt;/);
assert.match(html, /src="\/assets\/images\/poster\.jpg"/);

const mediaPath = '/api/product-media/123e4567-e89b-42d3-a456-426614174000';
const blocks = renderMarkdown([
  '### Compare', '**Bold** text', '- One', '1. First', '| Item | Value |', '| --- | --- |', '| A | B |',
  '> Buyer note', ':::tip', 'Check fitment.', ':::', ':::faq', 'Q: What fits?', 'A: Confirm the OE number.', ':::',
  ':::cta', '[Browse products](/product)', ':::', `![Part](${mediaPath} "Sample part")`,
  '[bad](javascript:alert(1))', '![bad](data:text/html,attack)', '<img src=x onerror=alert(1)>',
].join('\n'));
assert.match(blocks, /<h3 id="compare">Compare<\/h3>/);
assert.deepEqual(articleHeadings('## Steps\n### Detail').map(item => item.id), ['steps', 'detail']);
assert.deepEqual(articleHeadings(':::tip\n## Hidden heading\n:::\n## Visible heading').map(item => item.title), ['Visible heading']);
assert.deepEqual(articleHeadings('## A\n## A\n## A-2').map(item => item.id), ['a', 'a-2', 'a-2-2']);
assert.match(blocks, /<strong>Bold<\/strong>/);
assert.match(blocks, /<ol><li>First<\/li><\/ol>/);
assert.match(blocks, /<div class="article-table-wrap"><table>/);
assert.match(blocks, /<blockquote>/);
assert.match(blocks, /<details class="article-faq">/);
assert.match(renderMarkdown(':::faq\nQ: Question\nA: First answer line\nSecond answer line\n:::') , /<p>Second answer line<\/p>/);
assert.match(blocks, /href="\/product"/);
assert.match(blocks, /<figcaption>Sample part<\/figcaption>/);
assert.doesNotMatch(blocks, /href="javascript:|src="data:/i);
assert.doesNotMatch(renderMarkdown('[traversal](/product/%2e%2e/admin)'), /href="\/product\/%2e%2e\/admin"/i);
assert.match(blocks, /&lt;img src=x onerror=alert\(1\)&gt;/i);
assert.deepEqual(articleMediaPaths(`caption ${mediaPath} ![image](${mediaPath}) ![spoof](${mediaPath}-extra)`), [mediaPath]);
assert.deepEqual(articleMediaPaths(`:::cta\n![discarded](${mediaPath})\n:::\n\n:::faq\nQ: No answer\n![discarded](${mediaPath})\n:::`), []);
assert.equal(hasPublishedArticleMediaReference([
  { status: 'published', source_type: 'cms', featured_image_path: null, content_markdown: `![image](${mediaPath})` },
], mediaPath), true);
assert.equal(hasPublishedArticleMediaReference([
  { status: 'draft', source_type: 'cms', featured_image_path: mediaPath, content_markdown: '' },
  { status: 'published', source_type: 'front_blog_html', featured_image_path: mediaPath, content_markdown: '' },
], mediaPath), false);
assert.equal(hasPublishedArticleMediaReference([
  { status: 'published', source_type: 'cms', featured_image_path: `${mediaPath}-spoof`, content_markdown: '' },
], mediaPath), false);
console.log('article CMS checks passed');
