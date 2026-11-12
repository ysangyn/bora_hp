// 보라다방 사진첩: 피드 ↔ 코르크보드, 분류 거르기, 넘겨 보기 점, 크게 보기와 뒷면 메모
(() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const sets = $$('.pset'), feed = $('.feed'), board = $('.board');
  const c = new URLSearchParams(location.search).get('c') || '';
  if (c) sets.forEach(s => s.hidden = s.dataset.c !== c);

  // 넘겨 보기 점
  sets.forEach(s => { const st = s.querySelector('.strip'), dots = [...s.querySelectorAll('.dots i')]; if (!st || !dots.length) return;
    st.addEventListener('scroll', () => { const i = Math.round(st.scrollLeft / st.clientWidth); dots.forEach((d, k) => d.classList.toggle('on', k === i)); }, { passive: true }); });

  // 크게 보기: 누르면 앞면, 한 번 더 누르면 뒤집혀 메모
  let lb = null;
  function open(img, set) {
    if (!lb) { lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
      lb.innerHTML = '<button class="card" type="button" aria-label="사진 뒤집기"><span class="face front"><img alt=""><span></span></span><span class="face back"><p></p><small></small></span></button><div class="tools"><a class="go" href="#">이 묶음 보기</a><button type="button" class="x">닫기</button></div><span class="hint">사진을 누르면 뒷면의 메모가 보여요</span>';
      document.body.appendChild(lb);
      lb.querySelector('.card').onclick = e => { e.stopPropagation(); lb.querySelector('.card').classList.toggle('flip'); };
      lb.querySelector('.x').onclick = close; lb.addEventListener('click', e => { if (e.target === lb) close(); });
      addEventListener('keydown', e => { if (e.key === 'Escape' && lb && !lb.hidden) close(); }); }
    const card = lb.querySelector('.card'), w = +img.getAttribute('width') || 4, h = +img.getAttribute('height') || 5;
    card.classList.remove('flip'); card.style.setProperty('--ar', Math.max(.6, Math.min(1.6, w / h)).toFixed(3));
    lb.querySelector('.front img').src = img.currentSrc || img.src; lb.querySelector('.front img').alt = img.alt;
    lb.querySelector('.front span').textContent = set.dataset.title;
    lb.querySelector('.back p').textContent = img.dataset.memo || set.dataset.caption || set.dataset.title;
    lb.querySelector('.back small').textContent = '— ' + set.dataset.date + ', 어른아이';
    const go = lb.querySelector('.go'), link = set.querySelector('h2 a'); go.hidden = !link; if (link) go.href = link.href;
    lb.hidden = false; card.focus();
  }
  function close() { lb.hidden = true; }
  sets.forEach(s => s.querySelectorAll('.strip img').forEach(im => im.addEventListener('click', () => open(im, s))));

  // 코르크보드: 묶음마다 첫 사진을 핀으로 꽂는다
  const PINS = ['#c0564a', '#d9b45a', '#5a7ac0', '#5aa07a'];
  function buildBoard() {
    if (!board || board.dataset.built) return; board.dataset.built = 1;
    sets.filter(s => !s.hidden).forEach((s, i) => { const im = s.querySelector('.strip img'); if (!im) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pol'; b.setAttribute('aria-label', s.dataset.title + ' 크게 보기');
      b.style.setProperty('--r', (((i * 37) % 9) - 4) + 'deg'); b.style.setProperty('--pin', PINS[i % PINS.length]);
      b.innerHTML = `<img src="${im.currentSrc || im.src}" alt=""><span></span>`; b.querySelector('span').textContent = s.dataset.title;
      b.onclick = () => open(im, s); board.appendChild(b); });
  }
  function view(v) {
    if (!board || !feed) return; const isB = v === 'board'; if (isB) buildBoard();
    board.hidden = !isB; feed.hidden = isB; $$('.pview button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); LS.set('bora_pview', v);
  }
  $$('.pview button').forEach(b => b.onclick = () => view(b.dataset.v));
  if (LS.get('bora_pview') === 'board' && sets.length) view('board');
})();
