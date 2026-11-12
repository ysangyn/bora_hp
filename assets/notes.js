// 보라다방 노트 페이지: 밤·종이 화면, 함께 들을 곡, 나누기, 주인장 퍼가기, 분류 거르기
(() => {
  const ME = (document.currentScript && document.currentScript.src) || '';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  let tt = 0;
  const toast = msg => { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2200); };

  // 밤 ↔ 종이
  const th = $('.theme');
  if (th) th.onclick = () => { const r = document.documentElement, p = r.dataset.theme !== 'paper'; if (p) r.dataset.theme = 'paper'; else delete r.dataset.theme; LS.set('bora_theme', p ? 'paper' : 'night'); };

  // 함께 들을 곡: 레코드를 누르면 돈다
  let au = null;
  $$('.sp').forEach(b => b.onclick = () => {
    if (!au) { au = new Audio(b.dataset.src); au.preload = 'auto'; au.volume = Math.min(1, +(b.dataset.g || 1)); au.onended = () => b.classList.remove('on'); }
    if (au.paused) { au.play().then(() => b.classList.add('on')).catch(() => toast('재생하지 못했어요')); } else { au.pause(); b.classList.remove('on'); }
  });

  // 나누기
  const url = (document.querySelector('link[rel=canonical]') || {}).href || location.href, title = ($('h1') || {}).textContent || document.title;
  async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) {
    const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (_) {} a.remove(); return ok; } }
  $$('[data-share]').forEach(b => b.addEventListener('click', async e => {
    const k = b.dataset.share;
    if (k === 'native') { if (navigator.share) { try { await navigator.share({ title, url }); } catch (_) {} } else { await copyText(url); toast('링크를 복사했어요'); } }
    if (k === 'copy') { toast(await copyText(url) ? '링크를 복사했어요' : '복사하지 못했어요'); }
  }));

  // 주인장(쓰기 열쇠가 있는 기기)만: 네이버 블로그에 그대로 옮기기
  const own = $('.owner');
  if (own && LS.get('bora_wkey')) {
    own.hidden = false;
    const id = document.body.dataset.id;
    let mod = null, post = null;
    const load = async () => {
      if (!mod) mod = await import(new URL('notes-render.js', ME || location.href).href);
      if (!post) { const base = location.pathname.replace(/notes\/.*$/, ''); post = await (await fetch(base + 'data/notes/' + id + '.json', { cache: 'no-store' })).json(); post._tracks = await (await fetch(base + 'data/tracks.json', { cache: 'no-store' })).json(); }
      return post;
    };
    $$('[data-own]').forEach(b => b.onclick = async () => {
      const k = b.dataset.own;
      if (k === 'title') { toast(await copyText(title) ? '제목을 복사했어요. 블로그 제목 칸에 붙여 넣어요' : '복사하지 못했어요'); return; }
      if (k === 'photos') { $$('.body img').forEach((im, i) => { const a = document.createElement('a'); a.href = im.currentSrc || im.src; a.download = (document.body.dataset.id || 'note') + '-' + (i + 1) + '.' + ((im.src.match(/\.(\w+)$/) || [, 'webp'])[1]); document.body.appendChild(a); a.click(); a.remove(); }); toast('사진을 저장했어요'); return; }
      if (k === 'body') {
        try { const p = await load(), html = mod.blogCopyHtml(p, p._tracks), text = mod.plain(html);
          if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
          } else { const d = document.createElement('div'); d.contentEditable = 'true'; d.innerHTML = html; d.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(d);
            const r = document.createRange(); r.selectNodeContents(d); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.execCommand('copy'); sel.removeAllRanges(); d.remove(); }
          toast('본문을 복사했어요. 블로그 본문에 붙여 넣어요');
        } catch (e) { toast('복사하지 못했어요'); }
      }
    });
  }

  // 목록: 분류 거르기 (?c=song)
  const items = $$('.items li');
  if (items.length || $('.cats')) {
    const c = new URLSearchParams(location.search).get('c') || '';
    $$('.cats a').forEach(a => a.classList.toggle('on', (a.dataset.c || '') === c));
    if (c) { items.forEach(li => li.hidden = li.dataset.c !== c); if (items.length && items.every(li => li.hidden)) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = '이 분류의 노트는 아직 없어요.'; $('.items').after(p); } }
  }
})();

// 방 위에 덮어 열렸을 때(사진첩·노트를 방에서 열면): 방으로 가는 링크(로고·문)는 덮개만 닫는다 → 방의 노래·빗소리가 끊기지 않게
(() => {
  let host = null; try { if (window.parent !== window && window.parent.location.origin === location.origin) host = window.parent; } catch (e) {}
  if (!host) return;
  document.documentElement.classList.add('in-room');
  const dir = host.location.pathname.replace(/[^/]*$/, ''), rooms = [dir, dir + 'index.html', dir + 'a.html'];
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey) return;
    let u; try { u = new URL(a.href, location.href); } catch (er) { return; }
    if (u.origin === location.origin && rooms.includes(u.pathname)) { e.preventDefault(); host.postMessage({ bora: 'page-close' }, location.origin); }
  }, true);
})();
