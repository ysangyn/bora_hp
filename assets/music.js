// 보라다방 음반장: 곡 미리 듣기(한 번에 한 곡, 곡마다 소리 크기 맞춤), 영상은 누를 때만 불러오기, 나누기
(() => {
  const $$ = s => [...document.querySelectorAll(s)];
  let au = null, curEl = null, raf = 0;
  const stop = () => { if (au) { au.pause(); au = null; } if (curEl) curEl.classList.remove('on'); curEl = null; cancelAnimationFrame(raf); };
  const tick = () => { if (!au || !curEl) return; const bar = curEl.querySelector('.pbar i'); if (bar && au.duration) bar.style.width = (au.currentTime / au.duration * 100).toFixed(2) + '%'; raf = requestAnimationFrame(tick); };
  $$('.trk[data-f] .play').forEach(b => b.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation(); const el = b.closest('.trk');
    if (curEl === el) { stop(); return; } stop();
    au = new Audio(el.dataset.f); au.volume = Math.max(0, Math.min(1, +el.dataset.g || 1)); curEl = el; el.classList.add('on');
    au.addEventListener('ended', () => { const next = [...document.querySelectorAll('.trk[data-f]')]; const i = next.indexOf(el); stop(); if (i >= 0 && next[i + 1] && !el.classList.contains('player')) next[i + 1].querySelector('.play').click(); });
    au.play().then(tick).catch(stop);
  }));
  // 영상: 처음엔 그림만, 누르면 그 자리에서 재생
  $$('.yt[data-yt]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); stop(); const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${a.dataset.yt}?autoplay=1&rel=0&playsinline=1`; f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; f.title = a.getAttribute('aria-label') || '영상';
    const d = document.createElement('div'); d.className = 'yt'; d.appendChild(f); a.replaceWith(d);
  }));
  $$('[data-mshare]').forEach(b => b.addEventListener('click', async () => {
    const url = b.dataset.mshare, title = b.dataset.title || document.title;
    if (navigator.share) { try { await navigator.share({ title, url }); } catch (e) {} return; }
    try { await navigator.clipboard.writeText(url); b.textContent = '링크를 복사했어요'; setTimeout(() => b.textContent = '나누기', 2000); } catch (e) { prompt('이 주소를 복사해 주세요', url); }
  }));
})();
