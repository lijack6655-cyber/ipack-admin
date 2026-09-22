import type { Tables } from '../../types/database';
import shell from '../products/shell.json';
import type { ArticleInput } from './model';
import { escapeHtml, renderMarkdown } from './markdown';
export { escapeHtml, renderMarkdown } from './markdown';

export function renderArticle(article: Pick<Tables<'articles'>, 'title' | 'slug' | 'excerpt' | 'content_markdown' | 'seo_title' | 'seo_description' | 'featured_image_path' | 'author_name' | 'category' | 'published_at'>, preview = false): string {
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || article.title;
  const canonical = `https://www.ipackautoparts.com/news/${encodeURIComponent(article.slug)}`;
  const imagePath = article.featured_image_path && (article.featured_image_path.startsWith('/assets/') && !article.featured_image_path.includes('..') || /^https:\/\//.test(article.featured_image_path)) ? article.featured_image_path : null;
  const image = imagePath ? (imagePath.startsWith('/') ? `https://www.ipackautoparts.com${imagePath}` : imagePath) : null;
  const schema = {
    '@context': 'https://schema.org', '@type': 'Article', headline: article.title,
    description, url: canonical, image: image ? [image] : undefined,
    author: { '@type': 'Organization', name: article.author_name || 'I-Pack Auto Parts' },
    articleSection: article.category || undefined,
    datePublished: article.published_at || undefined,
  };
  const body = renderMarkdown(article.content_markdown || '');
  const header = shell.header.replace('<a href="/products">Products</a>', '<a href="/product">Product</a><a href="/products">Search</a>');
  const footerBase = shell.footer.replace('<a href="/products">Product Catalog</a>', '<a href="/product">Product Catalog</a>');
  const footer = preview ? footerBase.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '') : footerBase.replace(/main\.js\?v=20260908-leads/g, 'main.js?v=20260922-news');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | I-PACK Auto Parts</title><meta name="description" content="${escapeHtml(description)}">
${preview ? '<meta name="robots" content="noindex,nofollow">' : `<link rel="canonical" href="${escapeHtml(canonical)}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`}
<link rel="stylesheet" href="https://www.ipackautoparts.com/assets/css/styles.css"><style>.content{line-height:1.75}.content h2{margin:2rem 0 .75rem}.content p{margin:0 0 1rem}.content ul{margin:0 0 1rem;padding-left:1.5rem}.content img{max-width:100%;height:auto;border-radius:8px}</style></head>${header}
${preview ? '<div style="padding:12px;background:#fff3cd;text-align:center">Draft preview — not published</div>' : ''}
<main><section class="page-hero"><div class="container"><div class="breadcrumb"><a href="/">Home</a> / <a href="/blog">Blog</a></div><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.excerpt || '')}</p></div></section>
<section class="section"><div class="container"><article class="content" style="max-width:880px;margin:0 auto">${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(article.title)}" loading="eager" decoding="async" style="width:100%;max-height:480px;object-fit:contain;border-radius:12px;margin-bottom:24px">` : ''}<p class="text-sm" style="color:#64748b">${escapeHtml(article.author_name || 'I-Pack Auto Parts')}${article.category ? ` · ${escapeHtml(article.category)}` : ''}</p>${body}</article></div></section></main>${footer}</body></html>`;
}

export function toArticleInput(article: Tables<'articles'>, draft?: Record<string, unknown> | null): ArticleInput {
  const source = draft || article;
  return {
    title: String(source.title || ''), slug: String(source.slug || ''), category: String(source.category || ''),
    author_name: String(source.author_name || ''), excerpt: String(source.excerpt || ''),
    content_markdown: String(source.content_markdown || ''), seo_title: String(source.seo_title || ''),
    seo_description: String(source.seo_description || ''), featured_image_path: String(source.featured_image_path || ''),
  };
}
