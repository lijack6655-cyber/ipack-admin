import type { Tables } from '../../types/database';
import shell from '../products/shell.json';
import { isSafeArticleImagePath, type ArticleInput } from './model';
import { articleHeadings, articleMediaPaths, escapeHtml, renderMarkdown } from './markdown';
export { escapeHtml, renderMarkdown } from './markdown';

export function renderArticle(article: Pick<Tables<'articles'>, 'title' | 'slug' | 'excerpt' | 'content_markdown' | 'seo_title' | 'seo_description' | 'featured_image_path' | 'author_name' | 'category' | 'published_at'>, preview = false, signedUrls: Record<string, string> = {}): string {
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || article.title;
  const canonical = `https://www.ipackautoparts.com/news/${encodeURIComponent(article.slug)}`;
  const imagePath = article.featured_image_path && isSafeArticleImagePath(article.featured_image_path) ? article.featured_image_path : null;
  const image = imagePath ? (signedUrls[imagePath] || (imagePath.startsWith('/') ? `https://www.ipackautoparts.com${imagePath}` : imagePath)) : null;
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: article.title,
    description, url: canonical, image: image ? [image] : undefined,
    author: { '@type': 'Organization', name: article.author_name || 'I-Pack Auto Parts' },
    articleSection: article.category || undefined,
    datePublished: article.published_at || undefined,
  };
  const markdown = article.content_markdown || '';
  const bodyUrls = Object.fromEntries(articleMediaPaths(markdown).map(path => [path, signedUrls[path] || `https://www.ipackautoparts.com${path}`]));
  const body = renderMarkdown(markdown, { ...bodyUrls, ...signedUrls });
  const headings = articleHeadings(article.content_markdown || '');
  const toc = headings.length ? `<nav class="article-toc" aria-label="Table of contents"><strong>Contents</strong><ol>${headings.map(item => `<li class="level-${item.level}"><a href="#${encodeURIComponent(item.id)}">${escapeHtml(item.title)}</a></li>`).join('')}</ol></nav>` : '';
  const words = (article.content_markdown || '').match(/[\p{L}\p{N}]+/gu)?.length || 0;
  const readingTime = Math.max(1, Math.ceil(words / 220));
  const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '';
  const header = shell.header.replace('<a href="/products">Products</a>', '<a href="/product">Product</a><a href="/products">Search</a>');
  const footerBase = shell.footer.replace('<a href="/products">Product Catalog</a>', '<a href="/product">Product Catalog</a>');
  const footer = preview ? footerBase.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') : footerBase.replace(/main\.js\?v=20260908-leads/g, 'main.js?v=20260922-news') + '<script src="/assets/js/product-menu.js?v=20260922-menu"></script>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | I-PACK Auto Parts</title><meta name="description" content="${escapeHtml(description)}"><link rel="stylesheet" href="https://www.ipackautoparts.com/assets/css/product-menu.css?v=20260922-menu">
${preview ? '<meta name="robots" content="noindex,nofollow">' : `<link rel="canonical" href="${escapeHtml(canonical)}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`}
<link rel="stylesheet" href="https://www.ipackautoparts.com/assets/css/styles.css"><style>.content{line-height:1.75}.content h2,.content h3{margin:2rem 0 .75rem}.content p{margin:0 0 1rem}.content ul,.content ol{margin:0 0 1rem;padding-left:1.5rem}.content img{max-width:100%;height:auto;border-radius:8px}.content figure{margin:1.5rem 0}.content figcaption{color:#64748b;text-align:center;font-size:.875rem;margin-top:.5rem}.article-table-wrap{overflow-x:auto;margin:1.5rem 0}.content table{border-collapse:collapse;min-width:100%;white-space:nowrap}.content th,.content td{border:1px solid #cbd5e1;padding:.65rem .8rem;text-align:left}.content blockquote,.article-tip{margin:1rem 0;padding:1rem 1.25rem;border-left:4px solid #94a3b8;background:#f8fafc}.article-faq{margin:.75rem 0;padding:.75rem 1rem;border:1px solid #cbd5e1;border-radius:.5rem}.article-faq summary{cursor:pointer;font-weight:600}.article-cta a{display:inline-block;background:#1d4ed8;color:white;border-radius:.5rem;padding:.75rem 1rem;text-decoration:none}.article-toc{border:1px solid #cbd5e1;border-radius:.75rem;padding:1rem 1.25rem;margin:1.5rem 0}.article-toc ol{margin:.5rem 0 0;padding-left:1.5rem}.article-toc .level-3{margin-left:1rem;font-size:.95em}</style></head>${header}
${preview ? '<div style="padding:12px;background:#fff3cd;text-align:center">Draft preview — not published</div>' : ''}
<main><section class="page-hero"><div class="container"><div class="breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a>${article.category ? ` / ${escapeHtml(article.category)}` : ''}</div><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.excerpt || '')}</p><p class="text-sm" style="color:#cbd5e1">${escapeHtml(article.author_name || 'I-Pack Auto Parts')}${publishedDate ? ` · Updated ${escapeHtml(publishedDate)}` : ''} · ${readingTime} min read</p></div></section>
<section class="section"><div class="container"><article class="content" style="max-width:880px;margin:0 auto">${image ? `<figure><img src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}" loading="eager" decoding="async" style="width:100%;max-height:480px;object-fit:contain;border-radius:12px"></figure>` : ''}${toc}${body}<p class="text-sm" style="color:#64748b">Written by ${escapeHtml(article.author_name || 'I-Pack Auto Parts')}${article.category ? ` · ${escapeHtml(article.category)}` : ''}</p></article></div></section></main>${footer}</body></html>`;
}

export { articleMediaPaths };

export function toArticleInput(article: Tables<'articles'>, draft?: Record<string, unknown> | null): ArticleInput {
  const source = draft || article;
  return {
    title: String(source.title || ''), slug: String(source.slug || ''), category: String(source.category || ''),
    author_name: String(source.author_name || ''), excerpt: String(source.excerpt || ''),
    content_markdown: String(source.content_markdown || ''), seo_title: String(source.seo_title || ''),
    seo_description: String(source.seo_description || ''), featured_image_path: String(source.featured_image_path || ''),
  };
}
