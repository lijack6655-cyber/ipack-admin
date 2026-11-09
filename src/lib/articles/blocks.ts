import { articleVideoEmbedUrl, isSafeArticleImagePath } from './model.ts';

export type ArticleBlock = (
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string; caption: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'quote' | 'tip'; text: string }
  | { type: 'faq'; question: string; answer: string }
  | { type: 'cta'; label: string; url: string }
  | { type: 'video'; src: string }
  | { type: 'raw'; source: string }) & { source?: string };

const tableRow = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());

function parseDirective(lines: string[], start: number, kind: string) {
  const offset = lines.slice(start + 1).findIndex(line => line.trim() === ':::');
  if (offset < 0) return { end: lines.length, block: null as ArticleBlock | null };
  const end = start + offset + 2, content = lines.slice(start + 1, end - 1);
  if (kind === 'video') return { end, block: content.length ? { type: 'video', src: content.join('\n').trim() } as ArticleBlock : null };
  if (kind === 'faq') {
    const question = content.find(line => /^Q:\s*/i.test(line.trim()))?.replace(/^\s*Q:\s*/i, '') || '';
    const answer = content.filter(line => !/^Q:\s*/i.test(line.trim())).join('\n').replace(/^\s*A:\s*/i, '').trim();
    return { end, block: question && answer ? { type: 'faq', question, answer } as ArticleBlock : null };
  }
  if (kind === 'cta') {
    const match = content.join(' ').trim().match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    return { end, block: match ? { type: 'cta', label: match[1], url: match[2] } as ArticleBlock : null };
  }
  return { end, block: content.length ? { type: 'tip', text: content.join('\n') } as ArticleBlock : null };
}

export function parseArticleBlocks(markdown: string): ArticleBlock[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n'), blocks: ArticleBlock[] = [];
  const push = (block: ArticleBlock, start: number, end = start + 1) => blocks.push({ ...block, source: lines.slice(start, end).join('\n') });
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    if (heading) { push({ type: 'heading', level: heading[1].length as 2 | 3, text: heading[2] }, i); i++; continue; }
    const image = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (image) { push({ type: 'image', src: image[2], alt: image[1], caption: image[3] || '' }, i); i++; continue; }
    const directive = line.match(/^:::\s*(video|tip|faq|cta)\s*$/i);
    if (directive) {
      const parsed = parseDirective(lines, i, directive[1].toLowerCase());
      push(parsed.block || { type: 'raw', source: lines.slice(i, parsed.end).join('\n') }, i, parsed.end); i = parsed.end; continue;
    }
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i + 1].trim())) {
      const start = i, headers = tableRow(line), rows: string[][] = []; i += 2;
      while (i < lines.length && /^\|/.test(lines[i].trim())) rows.push(tableRow(lines[i++]));
      push({ type: 'table', headers, rows }, start, i); continue;
    }
    if (/^\|/.test(line)) { const start = i; while (i < lines.length && /^\|/.test(lines[i].trim())) i++; push({ type: 'raw', source: lines.slice(start, i).join('\n') }, start, i); continue; }
    const listItem = line.match(/^([-*]|\d+\.)\s+(.+)$/);
    if (listItem) {
      const start = i;
      const ordered = /^\d/.test(listItem[1]), items: string[] = [];
      while (i < lines.length) { const item = lines[i].trim().match(/^([-*]|\d+\.)\s+(.+)$/); if (!item || /^\d/.test(item[1]) !== ordered) break; items.push(item[2]); i++; }
      push({ type: 'list', ordered, items }, start); continue;
    }
    if (/^>\s?/.test(line)) {
      const start = i, quote: string[] = []; while (i < lines.length && /^>\s?/.test(lines[i].trim())) { quote.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      push({ type: 'quote', text: quote.join('\n') }, start, i); continue;
    }
    if (/^:::\s*[a-z]/i.test(line)) {
      const start = i, offset = lines.slice(i + 1).findIndex(item => item.trim() === ':::'); i = offset < 0 ? lines.length : i + offset + 2;
      push({ type: 'raw', source: lines.slice(start, i).join('\n') }, start, i); continue;
    }
    if (/^<\/?[a-z][^>]*>/i.test(line)) { push({ type: 'raw', source: lines[i] }, i); i++; continue; }
    const start = i, paragraph: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      const current = lines[i].trim();
      if (paragraph.length && (/^(#{2,3})\s+/.test(current) || /^!\[/.test(current) || /^:::\s*/.test(current) || /^\|/.test(current) || /^([-*]|\d+\.)\s+/.test(current) || /^>\s?/.test(current))) break;
      paragraph.push(current); i++;
    }
    push({ type: 'paragraph', text: paragraph.join('\n') }, start, i);
  }
  return blocks;
}

function toMarkdown(block: ArticleBlock): string {
  switch (block.type) {
    case 'paragraph': return block.text;
    case 'heading': return `${'#'.repeat(block.level)} ${block.text}`;
    case 'list': return block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : '-'} ${item}`).join('\n');
    case 'image': return `![${block.alt}](${block.src}${block.caption ? ` "${block.caption}"` : ''})`;
    case 'table': return [`| ${block.headers.join(' | ')} |`, `| ${block.headers.map(() => '---').join(' | ')} |`, ...block.rows.map(row => `| ${row.join(' | ')} |`)].join('\n');
    case 'quote': return block.text.split('\n').map(line => `> ${line}`).join('\n');
    case 'tip': return `:::tip\n${block.text}\n:::`;
    case 'faq': return `:::faq\nQ: ${block.question}\nA: ${block.answer}\n:::`;
    case 'cta': return `:::cta\n[${block.label}](${block.url})\n:::`;
    case 'video': return `:::video\n${block.src}\n:::`;
    case 'raw': return block.source;
  }
}

export function serializeArticleBlocks(blocks: ArticleBlock[]): string { return blocks.map(block => block.source ?? toMarkdown(block)).filter(Boolean).join('\n\n').trim(); }

export function inspectArticleBlocks(blocks: ArticleBlock[]): { errors: string[]; warnings: string[] } {
  const errors: string[] = [], warnings: string[] = [];
  blocks.forEach((block, index) => {
    const label = `第 ${index + 1} 个模块`;
    if (block.type === 'image') { if (!block.src.trim() || !isSafeArticleImagePath(block.src.trim())) errors.push(`${label}的图片地址不安全或为空`); if (!block.alt.trim()) warnings.push(`${label}缺少图片 Alt 文本`); }
    if (block.type === 'video' && !articleVideoEmbedUrl(block.src.trim())) errors.push(`${label}的视频地址不受支持，请使用 HTTPS MP4、YouTube 或 Vimeo 地址`);
    if (block.type === 'table' && !block.headers.length) errors.push(`${label}缺少表头`);
    if (block.type === 'raw') warnings.push(`${label}保留为源码，未进行可视化编辑`);
  });
  return { errors, warnings };
}
