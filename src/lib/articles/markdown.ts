import { isSafeArticleImagePath } from './model.ts';

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

function safeUrl(value: string, image = false): string | null {
  if (/^[\u0000-\u0020]|[\\\u0000-\u001f<>"']/.test(value)) return null;
  if (image && isSafeArticleImagePath(value)) return value;
  if (!image && value.startsWith('/assets/') && isSafeArticleImagePath(value)) return value;
  if (!image && /^\/(?:product|products|contact|news)(?:[/?#]|$)/.test(value)) {
    try { if (!decodeURIComponent(value.split(/[?#]/, 1)[0]).split('/').includes('..')) return value; } catch { return null; }
  }
  if (image) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null; } catch { return null; }
}

const token = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\*\*(.+?)\*\*/g;
function inline(value: string, signedUrls: Record<string, string>): string {
  let html = '', last = 0;
  for (const match of value.matchAll(token)) {
    const start = match.index ?? 0;
    html += escapeHtml(value.slice(last, start));
    if (match[5] !== undefined) html += `<strong>${escapeHtml(match[5])}</strong>`;
    else {
      const rawUrl = match[3], isImage = Boolean(match[1]), url = safeUrl(rawUrl, isImage);
      if (!url) html += escapeHtml(match[0]);
      else if (isImage) html += `<img src="${escapeHtml(signedUrls[rawUrl] || url)}" alt="${escapeHtml(match[2])}" loading="lazy" decoding="async">`;
      else html += `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(match[2])}</a>`;
    }
    last = start + match[0].length;
  }
  return html + escapeHtml(value.slice(last));
}

function headingId(value: string): string {
  return value.replace(/\*\*(.*?)\*\*/g, '$1').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
}

export function articleHeadings(markdown: string) {
  return [...renderMarkdown(markdown).matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map(match => ({
    level: Number(match[1]), id: match[2], title: match[3].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
  }));
}

export function articleMediaPaths(markdown: string): string[] {
  const paths = new Set<string>();
  const rendered = renderMarkdown(markdown);
  for (const match of rendered.matchAll(/<img\b[^>]*\bsrc="(\/api\/product-media\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})"/gi)) paths.add(match[1]);
  return [...paths];
}

export function hasPublishedArticleMediaReference(articles: { status: string; source_type: string | null; featured_image_path: string | null; content_markdown: string | null }[], path: string): boolean {
  return articles.some(article => article.status === 'published' && ['admin_created', 'cms'].includes(article.source_type || '')
    && (article.featured_image_path === path || articleMediaPaths(article.content_markdown || '').includes(path)));
}

export function renderMarkdown(markdown: string, signedUrls: Record<string, string> = {}): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n'), output: string[] = [], used = new Set<string>();
  let list: string[] = [], listTag = 'ul', paragraph: string[] = [];
  const flushList = () => { if (list.length) { output.push(`<${listTag}>${list.join('')}</${listTag}>`); list = []; } };
  const flushParagraph = () => { if (paragraph.length) { output.push(`<p>${paragraph.map(line => inline(line, signedUrls)).join('<br>')}</p>`); paragraph = []; } };
  const flush = () => { flushList(); flushParagraph(); };
  for (let i = 0; i < lines.length;) {
    const trimmed = lines[i].trim();
    if (!trimmed) { flush(); i++; continue; }
    const heading = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flush(); const title = heading[2], base = headingId(title); let id = base, suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
      used.add(id);
      output.push(`<h${heading[1].length} id="${id}">${inline(title, signedUrls)}</h${heading[1].length}>`); i++; continue;
    }
    const image = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (image) {
      flush(); const url = safeUrl(image[2], true);
      if (url) output.push(`<figure><img src="${escapeHtml(signedUrls[image[2]] || url)}" alt="${escapeHtml(image[1])}" loading="lazy" decoding="async">${image[3] ? `<figcaption>${escapeHtml(image[3])}</figcaption>` : ''}</figure>`);
      else output.push(`<p>${escapeHtml(trimmed)}</p>`);
      i++; continue;
    }
    const directive = trimmed.match(/^:::(tip|faq|cta)\s*$/i);
    if (directive) {
      flush(); const kind = directive[1].toLowerCase(), content: string[] = []; i++;
      while (i < lines.length && lines[i].trim() !== ':::') content.push(lines[i++]);
      if (i < lines.length) i++;
      if (kind === 'faq') {
        const question = content.find(line => /^Q:\s*/i.test(line.trim()))?.replace(/^\s*Q:\s*/i, '') || '';
        const answerIndex = content.findIndex(line => /^A:\s*/i.test(line.trim()));
        const answer = answerIndex < 0 ? [] : content.slice(answerIndex).filter(line => !/^Q:\s*/i.test(line.trim())).map((line, index) => index ? line : line.replace(/^\s*A:\s*/i, ''));
        if (question && answer.some(line => line.trim())) output.push(`<details class="article-faq"><summary>${inline(question, signedUrls)}</summary>${answer.map(line => `<p>${inline(line, signedUrls)}</p>`).join('')}</details>`);
      } else if (kind === 'cta') {
        const link = content.join(' ').trim().match(/^\[([^\]]+)\]\(([^)\s]+)\)$/), url = link && safeUrl(link[2]);
        if (link && url) output.push(`<p class="article-cta"><a href="${escapeHtml(url)}" rel="noopener noreferrer">${inline(link[1], signedUrls)}</a></p>`);
      } else if (content.length) output.push(`<aside class="article-tip">${content.map(line => `<p>${inline(line.trim(), signedUrls)}</p>`).join('')}</aside>`);
      continue;
    }
    if (/^\|/.test(trimmed) && i + 1 < lines.length && /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i + 1].trim())) {
      flush(); const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
      const heads = cells(trimmed), rows = []; i += 2;
      while (i < lines.length && /^\|/.test(lines[i].trim())) rows.push(cells(lines[i++]));
      output.push(`<div class="article-table-wrap"><table><thead><tr>${heads.map(cell => `<th>${inline(cell, signedUrls)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${heads.map((_, index) => `<td>${inline(row[index] || '', signedUrls)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) { flush(); const quoteLines = [quote[1]]; i++; while (i < lines.length && /^>\s?/.test(lines[i].trim())) quoteLines.push(lines[i++].trim().replace(/^>\s?/, '')); output.push(`<blockquote>${quoteLines.map(line => `<p>${inline(line, signedUrls)}</p>`).join('')}</blockquote>`); continue; }
    const item = trimmed.match(/^([-*]|\d+\.)\s+(.+)$/);
    if (item) { flushParagraph(); const nextTag = /^\d/.test(item[1]) ? 'ol' : 'ul'; if (list.length && listTag !== nextTag) flushList(); listTag = nextTag; list.push(`<li>${inline(item[2], signedUrls)}</li>`); i++; continue; }
    flushList(); paragraph.push(trimmed); i++;
  }
  flush();
  return output.join('\n');
}
