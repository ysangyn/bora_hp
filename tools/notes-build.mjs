// 노트 전체 다시 굽기: node tools/notes-build.mjs  (디자인을 바꾼 뒤 한 번 돌리면 모든 글 페이지가 새로 만들어진다)
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = await import(pathToFileURL(path.join(ROOT, 'assets/notes-render.js')).href);
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const wr = (p, t) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), t); };
const list = rd('data/notes.json').sort((a, b) => b.date.localeCompare(a.date)), tracks = rd('data/tracks.json');
list.forEach((e, i) => { const p = rd(`data/notes/${e.id}.json`); wr(`notes/${p.slug}/index.html`, R.renderPost(p, { prev: list[i + 1] || null, next: list[i - 1] || null, tracks })); });
wr('notes/index.html', R.renderList(list)); wr('sitemap-notes.xml', R.renderSitemap(list)); wr('rss.xml', R.renderRss(list));
console.log('notes:', list.length);
// 사진첩도 함께
const P = await import(pathToFileURL(path.join(ROOT, 'assets/photos-render.js')).href);
const sets = rd('data/photos.json').filter(s => !s.hide && s.items && s.items.length).sort((a, b) => b.date.localeCompare(a.date));
sets.forEach((s, i) => wr(`photos/${s.slug}/index.html`, P.renderSet(s, { prev: sets[i + 1] || null, next: sets[i - 1] || null })));
wr('photos/index.html', P.renderFeed(sets)); wr('sitemap-photos.xml', P.renderPhotoSitemap(sets));
console.log('photo sets:', sets.length);
