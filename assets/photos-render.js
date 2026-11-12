// 보라다방 사진첩: 사진 묶음 데이터를 검색엔진이 읽을 수 있는 완성된 HTML로 굽는다 (주인장 방·다시 굽기 도구 공용)
import { SITE, esc, ymd, abs, head, bar, foot } from './notes-render.js';

export const PCATS = [['stage', '무대'], ['studio', '작업실'], ['day', '일상'], ['travel', '여행']];
export const pcatName = k => (PCATS.find(c => c[0] === k) || [k, '사진'])[1];
const T = '어른아이의 사진첩';
const DESC = '어른아이가 보라다방 코르크보드에 꽂아 두는 사진들. 무대, 작업실, 일상, 여행.';

const fig = (it, root, i, n, set) => `<figure class="ph" data-i="${i}">
      <img src="${root}${esc(it.src)}" alt="${esc(it.alt || set.title + (n > 1 ? ` ${i + 1}` : ''))}" width="${it.w || ''}" height="${it.h || ''}" loading="${i ? 'lazy' : 'eager'}" decoding="async" data-memo="${esc(it.memo || '')}">
    </figure>`;

const ar = it => { const r = it && it.w && it.h ? it.w / it.h : 1; return Math.max(.8, Math.min(1.91, r)).toFixed(3); };
function card(set, root, linkTitle) {
  const n = set.items.length;
  return `<article class="pset" data-c="${esc(set.cat)}" data-id="${esc(set.id)}" data-title="${esc(set.title)}" data-date="${ymd(set.date)}" data-caption="${esc(set.caption || '')}">
  <header class="ph-h"><span class="av" aria-hidden="true">보</span><div><b>어른아이</b>${set.place ? `<small>${esc(set.place)}</small>` : ''}</div><span class="pc">${esc(pcatName(set.cat))}</span></header>
  <div class="strip" tabindex="0" aria-label="${esc(set.title)} 사진 ${n}장" style="--ar:${ar(set.items[0])}">
    ${set.items.map((it, i) => fig(it, root, i, n, set)).join('\n    ')}
  </div>
  ${n > 1 ? `<div class="dots" aria-hidden="true">${set.items.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}
  <div class="ph-b">
    <h2>${linkTitle ? `<a href="${root}photos/${esc(set.slug)}/">${esc(set.title)}</a>` : esc(set.title)}</h2>
    ${set.caption ? `<p>${esc(set.caption)}</p>` : ''}
    <time datetime="${esc(set.date)}">${ymd(set.date)}</time>
  </div>
</article>`;
}

const switcher = `<div class="pview" role="group" aria-label="보기 방식"><button type="button" data-v="feed" aria-pressed="true">피드</button><button type="button" data-v="board" aria-pressed="false">코르크보드</button></div>`;

export function renderFeed(sets) {
  const root = '../', url = `${SITE.base}/photos/`, cover = sets[0] && sets[0].items[0] ? abs(sets[0].items[0].src) : '';
  const ld = { '@context': 'https://schema.org', '@type': 'ImageGallery', name: T, url, inLanguage: 'ko', author: { '@type': 'Person', name: SITE.author },
    hasPart: sets.slice(0, 20).map(s => ({ '@type': 'ImageGallery', name: s.title, url: `${SITE.base}/photos/${s.slug}/`, datePublished: s.date })) };
  return head({ title: `${T} | ${SITE.name}`, desc: DESC, url, image: cover, type: 'website', root, extra: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap">
<link rel="stylesheet" href="${root}assets/photos.css?v=${SITE.v}">\n<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n` }) + `
<body class="photos">
${bar(root, 'photos')}
<main class="wrap pwrap">
  <div class="phead"><div><h1 class="lt">사진첩</h1><p class="ls">코르크보드에 꽂아 두는 어른아이의 사진들</p></div>${switcher}</div>
  <nav class="cats" aria-label="분류"><a href="./" data-c="">전체</a>${PCATS.map(([k, n]) => `<a href="?c=${k}" data-c="${k}">${n}</a>`).join('')}</nav>
  <div class="feed">
${sets.length ? sets.map(s => card(s, root, true)).join('\n') : '<p class="empty">첫 사진을 기다리는 중이에요.</p>'}
  </div>
  <div class="board" hidden></div>
  <a class="door" href="${root}"><span>방에 들어가기</span><small>비 오는 창가, 오래된 노래가 있는 작은 다방</small></a>
</main>
<script src="${root}assets/photos.js?v=${SITE.v}" defer></script>
${foot(root)}`;
}

export function renderSet(set, { prev, next } = {}) {
  const root = '../../', url = `${SITE.base}/photos/${set.slug}/`, desc = set.caption || `${set.title} · ${pcatName(set.cat)} · ${ymd(set.date)}`;
  const ld = { '@context': 'https://schema.org', '@type': 'ImageGallery', name: set.title, description: desc, url, datePublished: set.date, inLanguage: 'ko',
    author: { '@type': 'Person', name: SITE.author }, image: set.items.map(it => abs(it.src)) };
  const pn = (q, cls, label) => q ? `<a class="${cls}" href="${root}photos/${esc(q.slug)}/"><small>${label}</small><span>${esc(q.title)}</span></a>` : '<span></span>';
  return head({ title: `${set.title} — ${T} | ${SITE.name}`, desc, url, image: set.items[0] ? abs(set.items[0].src) : '', type: 'article', root,
    extra: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap">
<link rel="stylesheet" href="${root}assets/photos.css?v=${SITE.v}">\n<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n` }) + `
<body class="photos one">
${bar(root, 'photos')}
<main class="wrap pwrap">
  <p class="kicker" style="margin-top:28px"><a href="${root}photos/">사진첩</a></p>
  <div class="feed">
${card(set, root, false)}
  </div>
  <nav class="pn" aria-label="다른 사진">${pn(prev, 'prev', '이전 사진')}${pn(next, 'next', '다음 사진')}</nav>
  <a class="door" href="${root}"><span>방에 들어가기</span><small>비 오는 창가, 오래된 노래가 있는 작은 다방</small></a>
</main>
<script src="${root}assets/photos.js?v=${SITE.v}" defer></script>
${foot(root)}`;
}

export function renderPhotoSitemap(sets) {
  const u = (loc, lm) => `  <url><loc>${esc(loc)}</loc>${lm ? `<lastmod>${lm.slice(0, 10)}</lastmod>` : ''}</url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${u(SITE.base + '/photos/', sets[0] ? (sets[0].updated || sets[0].date) : '')}
${sets.map(s => `  <url><loc>${SITE.base}/photos/${esc(s.slug)}/</loc><lastmod>${(s.updated || s.date).slice(0, 10)}</lastmod>${s.items.map(it => `<image:image><image:loc>${esc(abs(it.src))}</image:loc></image:image>`).join('')}</url>`).join('\n')}
</urlset>
`;
}

// 방 코르크보드용 최신 사진 3장
export const boardPicks = sets => sets.flatMap(s => s.items.slice(0, 1).map(it => ({ src: it.src, title: s.title, slug: s.slug }))).slice(0, 3);
