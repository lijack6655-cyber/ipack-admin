import assert from 'node:assert/strict';
import { inspectArticleBlocks, parseArticleBlocks, serializeArticleBlocks } from '../src/lib/articles/blocks.ts';
import { renderMarkdown } from '../src/lib/articles/markdown.ts';

const source = `## Existing content\n\nA paragraph with **formatting**.\n\n![Event photo](/assets/images/event.webp "Event")\n\n| Part | Fit | Extra |\n| --- | --- | --- |\n| Lamp | SUV | Keep this cell |\n\n:::video\nhttps://youtu.be/example\n:::\n\n:::custom-block\nKeep this unknown block exactly.\n:::`;
const blocks = parseArticleBlocks(source);
const roundTrip = serializeArticleBlocks(blocks);
assert.equal(blocks.filter(block => block.type === 'raw').length, 1);
assert.match(roundTrip, /Keep this unknown block exactly/);
assert.match(roundTrip, /Keep this cell/);
const moved = [...blocks]; [moved[0], moved[1]] = [moved[1], moved[0]];
const movedText = serializeArticleBlocks(moved);
assert.match(movedText, /Existing content/);
assert.match(movedText, /Event photo/);
const edited = blocks.map(block => block.type === 'paragraph' ? { ...block, text: `${block.text} Edited`, source: undefined } : block);
assert.match(serializeArticleBlocks(edited), /Edited/);
assert.match(serializeArticleBlocks(edited), /Keep this unknown block exactly/);
assert.equal(inspectArticleBlocks([{ type: 'video', src: 'https://evil.example/page' }]).errors.length, 1);
assert.equal(inspectArticleBlocks([{ type: 'video', src: 'https://www.youtube.com/watch?v=abc123' }]).errors.length, 0);
console.log('article block round-trip, move, sibling edit: PASS');
const list = '- First\n- Second\n- Third';
const siblingEdit = parseArticleBlocks(`${list}\n\nOther paragraph`).map(block => block.type === 'paragraph' ? { ...block, text: 'Changed', source: undefined } : block);
assert(serializeArticleBlocks(siblingEdit).includes(list));
for (const complex of ['Q: One\nA: First\nQ: Two\nA: Second', 'Intro\nQ: One\nA: Answer']) {
  const raw = `:::faq\n${complex}\n:::`;
  assert.equal(parseArticleBlocks(raw)[0].type, 'raw');
  assert.equal(serializeArticleBlocks(parseArticleBlocks(raw)), raw);
}
const hostileVideo = renderMarkdown(':::video\nhttps://evil.example/player.vimeo.com/video/payload.mp4\n:::');
assert(!hostileVideo.includes('<iframe'));
assert(hostileVideo.includes('<video'));
assert(renderMarkdown(':::video\nhttps://vimeo.com/123456\n:::').includes('<iframe'));
console.log('List siblings, complex FAQ preservation and exact video host regressions: PASS');
