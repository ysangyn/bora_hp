// 보라다방 노트: 글 데이터를 검색엔진이 바로 읽을 수 있는 완성된 HTML로 굽는다.
// 쓰기 화면(브라우저)과 다시 굽기 도구(Node)가 같은 이 파일을 쓴다. DOM을 쓰지 않는다.

export const SITE = {
  base: 'https://ysangyn.github.io/bora_hp',   // 전용 도메인이 생기면 여기만 바꾸고 전체 다시 굽기
  name: '보라다방',
  author: '어른아이',
  notesTitle: '어른아이의 노트',
  notesDesc: '어른아이가 보라다방에서 쓰는 밤의 기록. 노래 이야기, 작업 노트, 일상, 손님에게 쓰는 편지.',
  v: '1'
};
export const CATS = [['song', '노래 이야기'], ['work', '작업 노트'], ['day', '일상'], ['letter', '손님에게']];
export const catName = k => (CATS.find(c => c[0] === k) || [k, '노트'])[1];

export const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const plain = html => String(html || '').replace(/<(br|\/p|\/div|\/h[23]|\/blockquote|\/li|\/figcaption)[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
export const autoSummary = html => { const t = plain(html).replace(/\s+/g, ' ').trim(); return t.length > 110 ? t.slice(0, 108).replace(/\s\S*$/, '') + '…' : t; };
export const ymd = iso => { const d = new Date(iso); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`; };
export const abs = p => p ? (/^https?:/.test(p) ? p : `${SITE.base}/${p.replace(/^\.?\//, '')}`) : '';
// 본문 속 사진 주소는 저장할 때 'img/notes/…'(사이트 뿌리 기준) → 페이지 위치에 맞게 바꿔 끼운다
export const fixSrc = (html, root) => String(html || '').replace(/(<img\b[^>]*?\bsrc=")(img\/)/g, `$1${root}$2`);
const readMin = html => Math.max(1, Math.round(plain(html).replace(/\s/g, '').length / 500));

export function head({ title, desc, url, image, type, root, extra = '' }) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image || abs('img/icon/icon-1024.png'))}">
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="#0e0b13">
<link rel="alternate" type="application/rss+xml" title="${SITE.notesTitle}" href="${root}rss.xml">
<link rel="icon" type="image/png" sizes="32x32" href="${root}img/icon/icon-32.png">
<link rel="apple-touch-icon" href="${root}img/icon/icon-180.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="${root}assets/notes.css?v=${SITE.v}">
<script>try{if(localStorage.getItem('bora_theme')==='paper')document.documentElement.dataset.theme='paper'}catch(e){}</script>
${extra}</head>`;
}

export const bar = (root, here) => `<header class="bar">
  <a class="logo" href="${root}" aria-label="보라다방 방으로">보라다방</a>
  <nav aria-label="메뉴"><a href="${root}notes/"${here === 'notes' ? ' aria-current="page"' : ''}>노트</a><a href="${root}photos/"${here === 'photos' ? ' aria-current="page"' : ''}>사진첩</a><button class="theme" type="button" aria-label="밤·종이 화면 바꾸기"><i></i></button></nav>
</header>`;

export const foot = root => `<footer class="foot"><a href="${root}">보라다방</a> · 어른아이 · <a href="${root}rss.xml">RSS</a></footer>
<script src="${root}assets/notes.js?v=${SITE.v}" defer></script>
</body>
</html>
`;

const songCard = (p, tracks, root) => {
  const t = (tracks || []).find(x => x.f === p.song);
  if (!t) return '';
  return `<aside class="song" aria-label="이 글과 함께 들을 곡">
  <button class="sp" type="button" data-src="${root}${esc(t.f)}" data-g="${t.g || 1}" aria-label="${esc(t.t)} 재생"><i class="rec"></i><span class="pl"></span></button>
  <div><small>이 글과 함께 들을 곡</small><b>${esc(t.t)}</b><span>어른아이</span></div>
</aside>`;
};

// ── 글 한 편 ──────────────────────────────────────────
export function renderPost(p, { prev, next, tracks } = {}) {
  const root = '../../', url = `${SITE.base}/notes/${p.slug}/`, desc = p.summary || autoSummary(p.body);
  const ld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: desc,
    datePublished: p.date, dateModified: p.updated || p.date, inLanguage: 'ko',
    author: { '@type': 'Person', name: SITE.author, url: SITE.base + '/' },
    publisher: { '@type': 'Organization', name: SITE.name, logo: { '@type': 'ImageObject', url: abs('img/icon/icon-512.png') } },
    mainEntityOfPage: url, articleSection: catName(p.cat), ...(p.cover ? { image: abs(p.cover) } : {})
  };
  const extra = `<meta property="article:published_time" content="${esc(p.date)}">
<meta property="article:modified_time" content="${esc(p.updated || p.date)}">
<meta property="article:section" content="${esc(catName(p.cat))}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
`;
  const place = p.place && p.place.name ? ` · 그날 창밖 ${esc(p.place.name)}${p.place.w ? ', ' + esc(p.place.w) : ''}` : '';
  const pn = (q, cls, label) => q ? `<a class="${cls}" href="${root}notes/${esc(q.slug)}/"><small>${label}</small><span>${esc(q.title)}</span></a>` : '<span></span>';
  return head({ title: `${p.title} — ${SITE.notesTitle} | ${SITE.name}`, desc, url, image: p.cover ? abs(p.cover) : '', type: 'article', root, extra }) + `
<body class="post" data-id="${esc(p.id)}">
${bar(root, 'notes')}
<main class="wrap">
<article class="note">
  <p class="kicker"><a href="${root}notes/?c=${esc(p.cat)}">${esc(catName(p.cat))}</a></p>
  <h1>${esc(p.title)}</h1>
  <p class="meta"><time datetime="${esc(p.date)}">${ymd(p.date)}</time>${place} · ${readMin(p.body)}분</p>
  ${songCard(p, tracks, root)}
  <div class="body">
${fixSrc(p.body, root)}
  </div>
  <div class="share" aria-label="나누기">
    <button type="button" data-share="native">공유하기</button>
    <button type="button" data-share="copy">링크 복사</button>
    <a data-share="naver" href="https://share.naver.com/web/shareView?url=${encodeURIComponent(url)}&amp;title=${encodeURIComponent(p.title)}" target="_blank" rel="noopener">네이버로 보내기</a>
  </div>
  <div class="owner" hidden>
    <p>주인장만 보이는 칸 · 네이버 블로그에 그대로 옮기기</p>
    <button type="button" data-own="title">제목 복사</button><button type="button" data-own="body">본문 복사 (사진·원문 링크 포함)</button><button type="button" data-own="photos">사진 모두 저장</button><a href="${root}notes/write/#edit=${esc(p.id)}">고치기</a>
  </div>
</article>
<nav class="pn" aria-label="다른 글">${pn(prev, 'prev', '이전 글')}${pn(next, 'next', '다음 글')}</nav>
<a class="door" href="${root}"><span>방에 들어가기</span><small>비 오는 창가, 오래된 노래가 있는 작은 다방</small></a>
</main>
${foot(root)}`;
}

// ── 노트 목록 ──────────────────────────────────────────
export function renderList(posts) {
  const root = '../', url = `${SITE.base}/notes/`;
  const items = posts.map(p => `  <li data-c="${esc(p.cat)}"><a class="item" href="${esc(p.slug)}/">
    <div class="t"><p class="d"><time datetime="${esc(p.date)}">${ymd(p.date)}</time> · ${esc(catName(p.cat))}</p><h2>${esc(p.title)}</h2><p class="s">${esc(p.summary)}</p></div>
    ${p.cover ? `<img src="${root}${esc(p.cover)}" alt="" loading="lazy" decoding="async">` : ''}
  </a></li>`).join('\n');
  const ld = { '@context': 'https://schema.org', '@type': 'Blog', name: SITE.notesTitle, url, inLanguage: 'ko', author: { '@type': 'Person', name: SITE.author } };
  return head({ title: `${SITE.notesTitle} | ${SITE.name}`, desc: SITE.notesDesc, url, type: 'website', root, extra: `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n` }) + `
<body class="list">
${bar(root, 'notes')}
<main class="wrap">
  <h1 class="lt">노트</h1>
  <p class="ls">어른아이가 보라다방에서 쓰는 밤의 기록</p>
  <nav class="cats" aria-label="분류"><a href="./" data-c="">전체</a>${CATS.map(([k, n]) => `<a href="?c=${k}" data-c="${k}">${n}</a>`).join('')}</nav>
  ${posts.length ? `<ol class="items">\n${items}\n  </ol>` : '<p class="empty">첫 노트를 기다리는 중이에요.</p>'}
  <a class="door" href="${root}"><span>방에 들어가기</span><small>비 오는 창가, 오래된 노래가 있는 작은 다방</small></a>
</main>
${foot(root)}`;
}

// ── 검색엔진용 목록 ──────────────────────────────────────
export function renderSitemap(posts) {
  const u = (loc, lm) => `  <url><loc>${esc(loc)}</loc>${lm ? `<lastmod>${lm.slice(0, 10)}</lastmod>` : ''}</url>`;
  const last = posts[0] ? (posts[0].updated || posts[0].date) : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[u(SITE.base + '/', ''), u(SITE.base + '/notes/', last), ...posts.map(p => u(`${SITE.base}/notes/${p.slug}/`, p.updated || p.date))].join('\n')}
</urlset>
`;
}
export function renderRss(posts) {
  const items = posts.slice(0, 30).map(p => `  <item>
    <title>${esc(p.title)}</title>
    <link>${SITE.base}/notes/${esc(p.slug)}/</link>
    <guid isPermaLink="true">${SITE.base}/notes/${esc(p.slug)}/</guid>
    <pubDate>${new Date(p.date).toUTCString()}</pubDate>
    <category>${esc(catName(p.cat))}</category>
    <description>${esc(p.summary)}</description>
  </item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${SITE.notesTitle} | ${SITE.name}</title>
  <link>${SITE.base}/notes/</link>
  <description>${esc(SITE.notesDesc)}</description>
  <language>ko</language>
${items}
</channel>
</rss>
`;
}

// 네이버 블로그로 그대로 옮길 본문: 사진은 절대 주소, 끝에 원문 링크
export function blogCopyHtml(p, tracks) {
  const url = `${SITE.base}/notes/${p.slug}/`, t = (tracks || []).find(x => x.f === p.song);
  const body = String(p.body || '').replace(/(<img\b[^>]*?\bsrc=")(img\/)/g, `$1${SITE.base}/$2`);
  return `${body}
<p><br></p>
<p>${t ? `이 글과 함께 들을 곡: ${esc(t.t)} — 어른아이<br>` : ''}원문과 노래는 보라다방에서: <a href="${url}">${url}</a></p>`;
}
