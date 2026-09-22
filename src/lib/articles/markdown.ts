export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

function safeUrl(value: string): string | null {
  if (value.startsWith('/assets/')) return value.includes('..') ? null : value;
  try { return new URL(value).protocol === 'https:' ? new URL(value).toString() : null; } catch { return null; }
}

function inline(value: string): string {
  const pattern = /(!?)\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  let html = '';
  let last = 0;
  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;
    html += escapeHtml(value.slice(last, start));
    const url = safeUrl(match[3]);
    if (!url) html += escapeHtml(match[0]);
    else if (match[1]) html += `<img src="${escapeHtml(url)}" alt="${escapeHtml(match[2])}" loading="lazy" decoding="async">`;
    else html += `<a href="${escapeHtml(url)}" rel="noopener noreferrer">${escapeHtml(match[2])}</a>`;
    last = start + match[0].length;
  }
  return html + escapeHtml(value.slice(last));
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const output: string[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { output.push(`<ul>${list.join('')}</ul>`); list = []; } };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flush(); continue; }
    const heading = trimmed.match(/^##\s+(.+)$/);
    if (heading) { flush(); output.push(`<h2>${inline(heading[1])}</h2>`); continue; }
    const item = trimmed.match(/^[-*]\s+(.+)$/);
    if (item) { list.push(`<li>${inline(item[1])}</li>`); continue; }
    flush(); output.push(`<p>${inline(trimmed)}</p>`);
  }
  flush();
  return output.join('\n');
}
