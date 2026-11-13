#!/usr/bin/env node
/* 보라다방 자동 점검
   보는 것: 스크립트 오류, 없는 파일(404), 그리고 화면 — 누르기 크기, 작은 글씨, 잘린 글, 화면 밖으로 나간 단추, 낮은 대비, 글자끼리 겹침, 가로 넘침.
   사용:   저장소 폴더에서  python3 -m http.server 8765 &   →   node tools/check-site.cjs [결과 폴더]
   결과:   <폴더>/report.md, report.json, 화면 사진. '꼭 고칠 것'이 있으면 종료 코드 1.
   한계:   헤드리스 크롬(갤럭시 S9+ 크기, 데스크톱)에서 잰 것. 소리가 어떻게 들리는지, 그림이 어울리는지는 사람이 봐야 한다. */
const { chromium, devices } = require('playwright'); const fs = require('fs');
const D = process.argv[2] || 'check-out'; fs.mkdirSync(D, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:8765/';

const LINT = () => { const out = [];
  const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > .05; };
  const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return { L: .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]), a: m[3] == null ? 1 : m[3] }; };
  const bgOf = e => { let n = e; while (n && n !== document.documentElement) { const l = lum(getComputedStyle(n).backgroundColor); if (l.a > .6) return l.L; n = n.parentElement; } return null; };
  const intro = document.querySelector('#intro:not(.out)'); const root = intro || document.querySelector('.panel:not([hidden])') || document.body;   // 덮개가 떠 있으면 덮개만, 패널이 열려 있으면 패널만 본다
  const name = e => (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ' "' + (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 18) + '"';
  root.querySelectorAll('button,a,input,[role=button],summary').forEach(e => { if (!vis(e) || e.closest('.hs,.scene,#stage .layer')) return; const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight * 3) return;
    if ((r.width < 40 || r.height < 36) && e.type !== 'range') out.push(['누르기 작음', name(e), Math.round(r.width) + '×' + Math.round(r.height)]);
    if (r.right > innerWidth + 2 || r.left < -2) out.push(['화면 밖', name(e), Math.round(r.left) + '~' + Math.round(r.right)]); });
  root.querySelectorAll('p,small,span,b,label,button,a,h2,h3,li,div').forEach(e => { if (!vis(e) || e.closest('#stage .layer')) return; const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) return; const cs = getComputedStyle(e), fs2 = parseFloat(cs.fontSize);
    if (fs2 < 11) out.push(['글씨 작음', name(e), fs2 + 'px']);
    if (cs.textOverflow !== 'ellipsis' && cs.overflow === 'hidden' && e.scrollWidth > e.clientWidth + 2) out.push(['글 잘림', name(e), e.scrollWidth + '>' + e.clientWidth]);
    const bg = bgOf(e); if (bg != null) { const t = lum(cs.color), L1 = Math.max(t.L, bg), L2 = Math.min(t.L, bg), cr = (L1 + .05) / (L2 + .05) * (t.a < 1 ? t.a : 1); if (cr < 3) out.push(['대비 낮음', name(e), cr.toFixed(1)]); } });
  const tr = e => { const rg = document.createRange(); rg.selectNodeContents(e); const rs = [...rg.getClientRects()].filter(r => r.width > 1 && r.height > 1); if (!rs.length) return e.getBoundingClientRect(); return { left: Math.min(...rs.map(r => r.left)), right: Math.max(...rs.map(r => r.right)), top: Math.min(...rs.map(r => r.top)), bottom: Math.max(...rs.map(r => r.bottom)), get width() { return this.right - this.left; }, get height() { return this.bottom - this.top; } }; };   // 상자가 아니라 실제 글자가 차지한 자리
  const T = [...root.querySelectorAll('button,a,small,p,h1,h2,h3,label')].filter(e => vis(e) && !e.closest('#stage .layer,.hs') && (e.textContent || '').trim().length > 1 && !e.querySelector('button,a,p,small,h1,h2,h3,label,input')).map(e => ({ e, r: tr(e) })).filter(x => x.r.bottom > 0 && x.r.top < innerHeight);
  for (let a = 0; a < T.length; a++) for (let b = a + 1; b < T.length; b++) { const A = T[a], B = T[b]; if (A.e.contains(B.e) || B.e.contains(A.e)) continue;
    const w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left), h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
    if (w > 6 && h > 6 && w * h > .25 * Math.min(A.r.width * A.r.height, B.r.width * B.r.height)) out.push(['겹침', name(A.e) + ' ↔ ' + name(B.e), Math.round(w) + '×' + Math.round(h)]); }
  return out; };

const PANELS = [['소리 섞기', "document.getElementById('bMix').click()"], ['설정', "document.getElementById('bGear').click()"], ['창밖 바꾸기', "document.getElementById('memo').click()"],
  ['라디오', "document.querySelector('.hs[data-a=radio],.hs[data-p=radio]').click()"], ['차 한 잔', "document.querySelector('.hs[data-a=kettle]').click()"], ['잠들기', "document.querySelector('.hs[data-a=sleep]').click()"],
  ['집중 모드', "document.querySelector('.hs[data-p=focus]').click()"], ['레코드장', "document.querySelector('.hs[data-p=records]').click()"], ['걱정 맡기기', "document.querySelector('.hs[data-p=drawer]').click()"], ['숨 고르기', "document.querySelector('.hs[data-p=plant]').click()"]];
const PAGES = ['song.html', 'books/?embed=1', 'notes/', 'photos/', 'music/'];
const SEV = { '겹침': 1, '가로 넘침': 1, '열기 실패': 1, '화면 밖': 2, '글 잘림': 2, '누르기 작음': 3, '글씨 작음': 3, '대비 낮음': 3 };

(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const R = {};
  for (const [tag, opt] of [['휴대폰', { ...devices['Galaxy S9+'] }], ['데스크톱', { viewport: { width: 1366, height: 820 } }]]) { const ctx = await b.newContext(opt);
    const open = async (key, url) => { const p = await ctx.newPage(); const r = R[key] = { 오류: [], 없는파일: [], 화면: [] };
      p.on('pageerror', e => r.오류.push(e.message.slice(0, 160))); p.on('response', x => { const u = x.url(); if (u.startsWith(BASE) && x.status() >= 400) r.없는파일.push(x.status() + ' ' + u.slice(BASE.length)); });
      await p.goto(BASE + url); await p.waitForTimeout(2800); return [p, r]; };
    const add = async (p, r, where, shot) => { const ox = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ox > 2) r.화면.push([where, '가로 넘침', '', ox + 'px']);
      (await p.evaluate(LINT)).forEach(x => r.화면.push([where, ...x])); if (shot) await p.screenshot({ path: `${D}/${tag}_${shot}.jpg`, type: 'jpeg', quality: 60 }); };
    { const [p, r] = await open(tag + ' · 방', 'index.html'); await add(p, r, '들어오는 화면', 'intro');
      await p.evaluate(() => { const x = [...document.querySelectorAll('button')].find(e => e.textContent.includes('조용히 들어가기')); x && x.click(); }); await p.waitForTimeout(3500); await add(p, r, '방', 'room');
      for (const [nm, js] of PANELS) { try { await p.evaluate(js); await p.waitForTimeout(1000); await add(p, r, nm, nm.replace(/\s/g, '')); await p.evaluate(() => { const x = document.querySelector('.panel .x'); x && x.click(); }); await p.waitForTimeout(400); } catch (e) { r.화면.push([nm, '열기 실패', '', e.message.slice(0, 60)]); } }
      await p.close(); }
    for (const u of PAGES) { const [p, r] = await open(tag + ' · ' + u, u); await add(p, r, u, u.replace(/\W/g, '_')); await p.close(); }
    await ctx.close(); }
  await b.close(); fs.writeFileSync(D + '/report.json', JSON.stringify(R, null, 1));
  let md = '# 보라다방 자동 점검\n\n', bad = 0;
  for (const [k, r] of Object.entries(R)) { const uniq = [...new Map(r.화면.map(x => [x.slice(0, 3).join('|'), x])).values()].sort((a, c) => SEV[a[1]] - SEV[c[1]]); const nf = [...new Set(r.없는파일)];
    const hard = r.오류.length + nf.length + uniq.filter(x => SEV[x[1]] === 1).length; bad += hard;
    md += `## ${k} — 꼭 고칠 것 ${hard}, 그 밖의 지적 ${uniq.length - uniq.filter(x => SEV[x[1]] === 1).length}\n`;
    r.오류.slice(0, 5).forEach(e => md += `- 오류: ${e}\n`); nf.forEach(e => md += `- 없는 파일: ${e}\n`); uniq.slice(0, 40).forEach(x => md += `- [${x[1]}] ${x[0]} · ${x[2]} · ${x[3]}\n`); md += '\n'; }
  fs.writeFileSync(D + '/report.md', md); console.log(md.split('\n').filter(l => l.startsWith('## ') || /오류|없는 파일|\[겹침|\[가로|\[열기/.test(l)).join('\n')); console.log('꼭 고칠 것:', bad); process.exit(bad ? 1 : 0); })();
