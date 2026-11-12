// 보라다방 음반장: 앨범·곡·영상 데이터를 검색엔진이 읽을 수 있는 완성된 HTML로 굽는다 (주인장 방·다시 굽기 도구 공용)
import { SITE, esc, abs, head, bar, foot } from './notes-render.js';

export const AKINDS = [['album', '정규'], ['ep', 'EP'], ['single', '싱글']];
export const ALINKS = [['melon', '멜론'], ['genie', '지니'], ['vibe', '바이브'], ['spotify', '스포티파이'], ['apple', '애플 뮤직'], ['ytm', '유튜브 뮤직']];
const kindName = k => (AKINDS.find(x => x[0] === k) || AKINDS[0])[1];
const year = a => String(a.date || '').slice(0, 4);
const T = '어른아이의 음반장';
const DESC = '어른아이가 2000년부터 불러 온 노래들. 앨범마다 이야기와 가사, 뮤직비디오.';
const paras = t => String(t || '').split(/\n\s*\n+/).map(x => x.trim()).filter(Boolean).map(x => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('\n');
const lyr = t => String(t || '').split(/\n\s*\n+/).map(x => x.trim()).filter(Boolean).map(x => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('\n');
const gainOf = (tracks, f) => { const t = (tracks || []).find(x => x.f === f); return t && t.g ? t.g : 1; };
// 곡 페이지는 가사나 곡 이야기가 있을 때만 만든다(빈 페이지는 검색에 도움이 안 되니까)
export const hasSongPage = t => !!(t && (t.lyr || t.story));
export const visibleAlbums = albums => (albums || []).filter(a => !a.hide && a.t).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
export const theaterVideos = videos => (videos || []).filter(v => !v.hide && (v.kind === 'mv' || v.kind === 'live'));
const ytThumb = id => `https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg`;
const css = root => `<link rel="stylesheet" href="${root}assets/music.css?v=${SITE.v}">\n`;
const ld = o => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>\n`;
const artist = { '@type': 'MusicGroup', name: SITE.author };
const disc = '<span class="disc" aria-hidden="true"></span>';
const sleeve = (a, root, big) => `<div class="sleeve${big ? ' big' : ''}">${disc}${a.cover ? `<img class="cover" src="${root}${esc(a.cover)}" alt="${esc(a.t)} 앨범 커버" width="1200" height="1200"${big ? '' : ' loading="lazy"'} decoding="async">` : `<span class="cover nocover"><b>${esc(a.t)}</b></span>`}</div>`;
const yt = (id, title) => `<a class="yt" href="https://youtu.be/${esc(id)}" data-yt="${esc(id)}" target="_blank" rel="noopener" aria-label="${esc(title)} 영상 보기"><img src="${ytThumb(id)}" alt="" loading="lazy" decoding="async"><span class="ytp" aria-hidden="true"></span></a>`;

export function renderMusic(albums, videos, who) {
  const root = '../', url = `${SITE.base}/music/`, A = visibleAlbums(albums), V = theaterVideos(videos), first = A[0], bio = who && who.bio && !who.draft ? who : null;
  const data = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: T, url, inLanguage: 'ko', about: bio ? { ...artist, description: bio.bio, ...(bio.photo ? { image: abs(bio.photo) } : {}) } : artist,
    hasPart: A.map(a => ({ '@type': 'MusicAlbum', name: a.t, url: `${SITE.base}/music/${a.slug}/`, datePublished: a.date || undefined, byArtist: artist })) };
  return head({ title: `${T} | ${SITE.name}`, desc: DESC, url, image: first && first.cover ? abs(first.cover) : '', type: 'website', root, extra: css(root) + ld(data) }) + `
<body class="music">
${bar(root, 'music')}
<div class="band" aria-hidden="true"></div>
<main class="wrap mwrap">
  <p class="mk">어른아이의 노래들</p>
  <h1 class="lt">음반장</h1>
  ${bio ? `<section class="who">${bio.photo ? `<img src="${root}${esc(bio.photo)}" alt="어른아이" width="160" height="160">` : ''}<div>${paras(bio.bio)}</div></section>` : ''}
  ${first ? `<a class="newest" href="${esc(first.slug)}/">${sleeve(first, root, true)}<span class="nw"><small>가장 최근 음반</small><b>${esc(first.t)}</b><span>${kindName(first.kind)}${year(first) ? ` · <i>${year(first)}</i>` : ''}</span></span></a>` : ''}
  ${A.length ? `<ul class="shelf">${A.map(a => `<li><a href="${esc(a.slug)}/">${sleeve(a, root)}<b>${esc(a.t)}</b><span>${kindName(a.kind)}${year(a) ? ` · <i>${year(a)}</i>` : ''}</span></a></li>`).join('')}</ul>`
    : '<p class="empty">어른아이의 노래를 한 장씩 꽂는 중이에요.<br>그동안 방에서 턴테이블을 틀어 보세요.</p>'}
  ${V.length ? `<a class="th-link" href="videos/"><span class="th-img">${V[0].id ? `<img src="${ytThumb(V[0].id)}" alt="" loading="lazy">` : ''}</span><span><small>상영관</small><b>뮤직비디오와 무대 ${V.length}편</b></span><em>보러 가기</em></a>` : ''}
  <a class="door" href="${root}"><span>방에 들어가기</span><small>비 오는 창가, 오래된 노래가 있는 작은 다방</small></a>
</main>
<script src="${root}assets/music.js?v=${SITE.v}" defer></script>
${foot(root)}`;
}

export function renderAlbum(a, { prev, next, tracks } = {}) {
  const root = '../../', url = `${SITE.base}/music/${a.slug}/`, desc = a.intro || `${SITE.author} ${kindName(a.kind)} ‘${a.t}’${year(a) ? ` (${year(a)})` : ''}. 수록곡과 가사, 앨범 이야기.`;
  const tr = a.tracks || [], links = ALINKS.filter(([k]) => a.links && a.links[k]);
  const data = { '@context': 'https://schema.org', '@type': 'MusicAlbum', name: a.t, url, byArtist: artist, datePublished: a.date || undefined, image: a.cover ? abs(a.cover) : undefined, description: desc, numTracks: tr.length,
    albumReleaseType: a.kind === 'single' ? 'SingleRelease' : a.kind === 'ep' ? 'EPRelease' : 'AlbumRelease',
    track: tr.map((t, i) => ({ '@type': 'MusicRecording', position: i + 1, name: t.t, byArtist: artist, ...(hasSongPage(t) ? { url: `${url}${i + 1}/` } : {}) })) };
  const row = (t, i) => `<li class="trk"${t.f ? ` data-f="${root}${esc(t.f)}" data-g="${gainOf(tracks, t.f)}"` : ''}>
      <div class="trow"><span class="no">${i + 1}</span><span class="tt">${hasSongPage(t) ? `<a href="${i + 1}/">${esc(t.t)}</a>` : esc(t.t)}</span>${t.mv ? '<span class="tag">영상</span>' : ''}${t.f ? `<button class="play" type="button" aria-label="${esc(t.t)} 듣기"><i aria-hidden="true"></i></button>` : ''}</div>
      ${t.lyr || t.story ? `<details class="tdet"><summary>${t.lyr ? '가사' : '곡 이야기'}${t.lyr && t.story ? ' · 곡 이야기' : ''}</summary>${t.story ? `<p class="lab2">곡 이야기</p><div class="story">${paras(t.story)}</div>` : ''}${t.lyr ? `<p class="lab2">가사</p><div class="lyr">${lyr(t.lyr)}</div>` : ''}${hasSongPage(t) ? `<a class="more" href="${i + 1}/">곡 페이지에서 보기</a>` : ''}</details>` : ''}
    </li>`;
  const pn = (q, cls, label) => q ? `<a class="${cls}" href="${root}music/${esc(q.slug)}/"><small>${label}</small><span>${esc(q.t)}</span></a>` : '<span></span>';
  return head({ title: `${a.t} — ${SITE.author} | ${SITE.name}`, desc, url, image: a.cover ? abs(a.cover) : '', type: 'music.album', root, extra: css(root) + ld(data) }) + `
<body class="music m-one">
${bar(root, 'music')}
<div class="band" aria-hidden="true"></div>
<main class="wrap mwrap">
  <p class="kicker"><a href="${root}music/">음반장</a></p>
  <div class="alb">
    <aside class="alb-a">${sleeve(a, root, true)}
      ${links.length ? `<nav class="listen" aria-label="듣는 곳">${links.map(([k, n]) => `<a href="${esc(a.links[k])}" target="_blank" rel="noopener">${n}</a>`).join('')}</nav>` : ''}
    </aside>
    <div class="alb-b">
      <p class="akind">${kindName(a.kind)}${year(a) ? ` · <i>${year(a)}</i>` : ''}</p>
      <h1>${esc(a.t)}</h1>
      ${a.intro ? `<p class="aintro">${esc(a.intro)}</p>` : ''}
      <div class="acts">${tr.some(t => t.f) ? `<a class="btn lamp" href="${root}?album=${encodeURIComponent(a.id)}">방에서 이 앨범 듣기</a>` : ''}<button class="btn" type="button" data-mshare="${esc(url)}" data-title="${esc(a.t)}">나누기</button></div>
      ${a.story ? `<section class="astory"><h2 class="lab">앨범 이야기</h2>${paras(a.story)}</section>` : ''}
      ${tr.length ? `<section class="tracks"><h2 class="lab">수록곡</h2><ol>${tr.map(row).join('')}</ol></section>` : ''}
      ${a.credits ? `<section class="credits"><h2 class="lab">만든 사람들</h2><p>${esc(a.credits).replace(/\n/g, '<br>')}</p></section>` : ''}
    </div>
  </div>
  <nav class="pn" aria-label="다른 음반">${pn(next, 'prev', '더 최근 음반')}${pn(prev, 'next', '이전 음반')}</nav>
  <a class="door" href="${root}"><span>방에 들어가기</span><small>비 오는 창가, 오래된 노래가 있는 작은 다방</small></a>
</main>
<script src="${root}assets/music.js?v=${SITE.v}" defer></script>
${foot(root)}`;
}

export function renderSong(a, i, { tracks } = {}) {
  const t = a.tracks[i], root = '../../../', url = `${SITE.base}/music/${a.slug}/${i + 1}/`, first = String(t.lyr || t.story || '').replace(/\s+/g, ' ').trim();
  const desc = `${SITE.author} ‘${t.t}’ ${t.lyr ? '가사' : '이야기'} · ${a.t}${year(a) ? ` (${year(a)})` : ''}. ${first.slice(0, 70)}${first.length > 70 ? '…' : ''}`;
  const data = { '@context': 'https://schema.org', '@type': 'MusicRecording', name: t.t, url, byArtist: artist, inAlbum: { '@type': 'MusicAlbum', name: a.t, url: `${SITE.base}/music/${a.slug}/` },
    datePublished: a.date || undefined, image: a.cover ? abs(a.cover) : undefined, ...(t.lyr ? { recordingOf: { '@type': 'MusicComposition', name: t.t, lyrics: { '@type': 'CreativeWork', text: t.lyr } } } : {}) };
  const songs = a.tracks.map((x, k) => [x, k]).filter(([x]) => hasSongPage(x)), at = songs.findIndex(([, k]) => k === i), pv = songs[at - 1], nx = songs[at + 1];
  const pn = (q, cls, label) => q ? `<a class="${cls}" href="../${q[1] + 1}/"><small>${label}</small><span>${esc(q[0].t)}</span></a>` : '<span></span>';
  return head({ title: `${t.t} 가사 — ${SITE.author} | ${SITE.name}`, desc, url, image: a.cover ? abs(a.cover) : '', type: 'music.song', root, extra: css(root) + ld(data) }) + `
<body class="music m-one m-song">
${bar(root, 'music')}
<div class="band" aria-hidden="true"></div>
<main class="wrap mwrap">
  <p class="kicker"><a href="${root}music/">음반장</a> · <a href="../">${esc(a.t)}</a></p>
  <header class="sh">${a.cover ? `<img class="scov" src="${root}${esc(a.cover)}" alt="" width="120" height="120">` : ''}<div><h1>${esc(t.t)}</h1><p>${SITE.author} · ${esc(a.t)}${year(a) ? ` · <i>${year(a)}</i>` : ''}</p></div></header>
  ${t.f ? `<div class="player trk" data-f="${root}${esc(t.f)}" data-g="${gainOf(tracks, t.f)}"><button class="play big" type="button" aria-label="${esc(t.t)} 듣기"><i aria-hidden="true"></i></button><span class="pbar"><i></i></span><a class="toroom" href="${root}?album=${encodeURIComponent(a.id)}&amp;n=${i + 1}">방에서 듣기</a></div>` : ''}
  ${t.story ? `<section class="sstory"><h2 class="lab">곡 이야기</h2>${paras(t.story)}</section>` : ''}
  ${t.lyr ? `<section class="slyr"><h2 class="lab">가사</h2><div class="lyr">${lyr(t.lyr)}</div></section>` : ''}
  ${t.mv ? `<section class="smv"><h2 class="lab">영상</h2>${yt(t.mv, t.t)}</section>` : ''}
  ${t.credit ? `<p class="scredit">${esc(t.credit)}</p>` : ''}
  <div class="stamps" data-k="song:${esc(a.id)}/${i + 1}" data-t="more,comfort" data-q="이 노래가 마음에 닿았다면 도장 하나 남겨 주세요" hidden></div>
  <nav class="pn" aria-label="다른 곡">${pn(pv, 'prev', '앞 곡')}${pn(nx, 'next', '다음 곡')}</nav>
  <a class="door" href="${root}"><span>방에 들어가기</span><small>비 오는 창가, 오래된 노래가 있는 작은 다방</small></a>
</main>
<script src="${root}assets/music.js?v=${SITE.v}" defer></script>
<script src="${root}assets/stamps.js?v=${SITE.v}" defer></script>
${foot(root)}`;
}

export function renderTheater(videos) {
  const root = '../../', url = `${SITE.base}/music/videos/`, V = theaterVideos(videos), f = V[0];
  const nm = v => v.t || `${SITE.author} 영상`, kind = v => v.kind === 'live' ? '무대' : '뮤직비디오';
  return head({ title: `상영관 — ${T} | ${SITE.name}`, desc: `${SITE.author}의 뮤직비디오와 무대 영상.`, url, image: f ? `https://i.ytimg.com/vi/${f.id}/hqdefault.jpg` : '', type: 'website', root, extra: css(root) }) + `
<body class="music m-one m-theater">
${bar(root, 'music')}
<div class="band" aria-hidden="true"></div>
<main class="wrap mwrap">
  <p class="kicker"><a href="${root}music/">음반장</a></p>
  <h1 class="lt">상영관</h1>
  <p class="ls">뮤직비디오와 무대</p>
  ${f ? `<article class="feat">${yt(f.id, nm(f))}<p class="vm"><span class="tag lamp">${kind(f)}</span>${f.y ? `<i>${esc(f.y)}</i>` : ''}</p><h2>${esc(nm(f))}</h2>${f.line ? `<p class="vl">${esc(f.line)}</p>` : ''}<div class="acts"><a class="btn lamp" href="${root}?mv=${esc(f.id)}">방 프로젝터로 보기</a></div></article>` : '<p class="empty">아직 걸린 영상이 없어요.</p>'}
  ${V.length > 1 ? `<ul class="vlist">${V.slice(1).map(v => `<li>${yt(v.id, nm(v))}<div><b>${esc(nm(v))}</b><span><span class="tag">${kind(v)}</span>${v.y ? ` ${esc(v.y)}` : ''}</span>${v.line ? `<small>${esc(v.line)}</small>` : ''}<a href="${root}?mv=${esc(v.id)}">방 프로젝터로 보기</a></div></li>`).join('')}</ul>` : ''}
  <a class="door" href="${root}"><span>방에 들어가기</span><small>비 오는 창가, 오래된 노래가 있는 작은 다방</small></a>
</main>
<script src="${root}assets/music.js?v=${SITE.v}" defer></script>
${foot(root)}`;
}

export function renderMusicSitemap(albums, videos) {
  const A = visibleAlbums(albums), V = theaterVideos(videos), u = loc => `  <url><loc>${esc(loc)}</loc></url>`;
  const rows = [];
  if (A.length) rows.push(u(`${SITE.base}/music/`));
  A.forEach(a => { rows.push(`  <url><loc>${SITE.base}/music/${esc(a.slug)}/</loc>${a.cover ? `<image:image><image:loc>${esc(abs(a.cover))}</image:loc></image:image>` : ''}</url>`);
    (a.tracks || []).forEach((t, i) => { if (hasSongPage(t)) rows.push(u(`${SITE.base}/music/${a.slug}/${i + 1}/`)); }); });
  if (V.length) rows.push(u(`${SITE.base}/music/videos/`));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${rows.join('\n')}
</urlset>
`;
}

// 앨범 주소 이름을 정한다(비어 있으면 연도로). 한 번 정하면 바꾸지 않는다
export function ensureSlugs(albums) {
  const used = new Set((albums || []).filter(a => a.slug).map(a => a.slug));
  for (const a of albums || []) { if (a.slug) continue; const base = (year(a) || 'album'); let s = base, n = 2; while (used.has(s) || s === 'videos') s = `${base}-${n++}`; a.slug = s; used.add(s); }
  return albums;
}

// 음반장 전체 파일 목록: [{path, text}] (지울 앨범 페이지는 del)
export function musicFiles(albums, videos, tracks, before = [], who = null) {
  ensureSlugs(albums);
  const A = visibleAlbums(albums), out = [{ path: 'music/index.html', text: renderMusic(albums, videos, who) }, { path: 'music/videos/index.html', text: renderTheater(videos) }, { path: 'sitemap-music.xml', text: renderMusicSitemap(albums, videos) }];
  A.forEach((a, i) => { out.push({ path: `music/${a.slug}/index.html`, text: renderAlbum(a, { prev: A[i + 1] || null, next: A[i - 1] || null, tracks }) });
    (a.tracks || []).forEach((t, k) => { if (hasSongPage(t)) out.push({ path: `music/${a.slug}/${k + 1}/index.html`, text: renderSong(a, k, { tracks }) }); }); });
  const keep = new Set(out.map(f => f.path));
  for (const p of before) if (!keep.has(p)) out.push({ path: p, del: true });
  return out;
}
// 지금 데이터로 생기는 음반 페이지 경로들(지울 것을 찾을 때)
export const musicPaths = (albums) => { const A = visibleAlbums(albums), out = []; A.forEach(a => { if (!a.slug) return; out.push(`music/${a.slug}/index.html`); (a.tracks || []).forEach((t, k) => { if (hasSongPage(t)) out.push(`music/${a.slug}/${k + 1}/index.html`); }); }); return out; };
