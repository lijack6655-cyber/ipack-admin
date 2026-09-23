import assert from 'node:assert/strict';
import { articleInput, articlePublishIssues, emptyArticle } from '../src/lib/articles/model.ts';
import { renderMarkdown } from '../src/lib/articles/markdown.ts';

assert.deepEqual(articlePublishIssues(emptyArticle), ['文章标题', 'Slug', '文章摘要', '正文']);
assert.equal(articleInput.safeParse({ ...emptyArticle, title: '展会文章', slug: 'automechanika-shanghai-2025', excerpt: '摘要', content_markdown: '正文', featured_image_path: '/assets/images/automechanika-shanghai-2025.jpg' }).success, true);
assert.equal(articleInput.safeParse({ ...emptyArticle, title: 'x', slug: 'Bad Slug', excerpt: 'x', content_markdown: 'x' }).success, false);
assert.equal(articleInput.safeParse({ ...emptyArticle, title: 'x', slug: 'safe-slug', excerpt: 'x', content_markdown: 'x', featured_image_path: 'javascript:alert(1)' }).success, false);

const markdown = '## Highlights\n\nSafe text <script>alert(1)</script>.\n\n- First point\n- Second point\n\n![Poster](/assets/images/poster.jpg)';
const html = renderMarkdown(markdown);
assert.match(html, /<h2>Highlights<\/h2>/);
assert.match(html, /<ul><li>First point<\/li><li>Second point<\/li><\/ul>/);
assert.doesNotMatch(html, /<script/i);
assert.match(html, /&lt;script&gt;/);
assert.match(html, /src="\/assets\/images\/poster\.jpg"/);

console.log('article CMS checks passed');
