/* 손님 도장: 마음에 닿은 글·노래·책에 도장 하나를 남긴다.
   - 도장은 주인장에게만 간다(Firestore에 쓰기만 되고, 읽기는 주인장 계정만). 숫자는 어디에도 보이지 않는다.
   - data/firebase.json(공개 설정값)이 없으면 아무것도 보이지 않는다.
   - 같은 기기에서 같은 곳·같은 도장은 한 번만, 하루 30번까지. */
(function () {
  'use strict';
  const me = document.currentScript, ROOT = new URL('..', me && me.src ? me.src : location.href).href;
  const LBL = { read: '잘 읽었어요', comfort: '위로가 됐어요', more: '더 듣고 싶어요' };
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let cfgP = null;
  const getCfg = () => cfgP || (cfgP = fetch(ROOT + 'data/firebase.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : null).then(j => (j && j.apiKey && j.projectId) ? j : null).catch(() => null));
  const rid = () => { const a = new Uint8Array(16); crypto.getRandomValues(a); return Array.from(a, b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join(''); };

  async function send(k, t) {
    const c = await getCfg(); if (!c) throw new Error('nocfg');
    const db = `projects/${c.projectId}/databases/(default)/documents`;
    const body = { writes: [{
      update: { name: `${db}/stamps/${rid()}`, fields: { k: { stringValue: k }, t: { stringValue: t } } },
      updateTransforms: [{ fieldPath: 'at', setToServerValue: 'REQUEST_TIME' }],
      currentDocument: { exists: false }
    }] };
    const r = await fetch(`https://firestore.googleapis.com/v1/${db}:commit?key=${encodeURIComponent(c.apiKey)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  }

  function style() {
    if (document.getElementById('stampsCss')) return;
    const s = document.createElement('style'); s.id = 'stampsCss';
    s.textContent = `.stamps{margin:44px 0 8px;padding:20px 0 4px;border-top:1px solid color-mix(in srgb,currentColor 14%,transparent);text-align:center}
.stamps .st-q{margin:0 0 12px;font-size:14px;opacity:.78}
.stamps .st-row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.stamps .st-b{min-height:42px;padding:0 18px;border-radius:999px;border:1px solid color-mix(in srgb,currentColor 32%,transparent);background:none;color:inherit;font:inherit;font-size:14px;cursor:pointer;transition:background .25s}
.stamps .st-b:hover{background:color-mix(in srgb,currentColor 7%,transparent)}
.stamps .st-b[aria-pressed=true]{background:color-mix(in srgb,currentColor 13%,transparent);cursor:default}
.stamps .st-b[aria-pressed=true]::before{content:'✓ '}
.stamps .st-b:disabled{opacity:.6}
.stamps .st-n,.stamps .st-say{margin:10px 0 0;font-size:12px;opacity:.58}`;
    document.head.appendChild(s);
  }

  function say(el, m) { let s = el.querySelector('.st-say'); if (!s) { s = document.createElement('p'); s.className = 'st-say'; s.setAttribute('role', 'status'); el.appendChild(s); } s.textContent = m; }

  function mount(el) {
    if (!el || el.dataset.ready) return; el.dataset.ready = '1';
    const k = el.dataset.k, types = String(el.dataset.t || 'read,comfort').split(',').filter(t => LBL[t]);
    if (!k || !types.length) return;
    getCfg().then(c => {
      if (!c) return;
      style();
      const done = LS.get('bora_stamps', {});
      el.innerHTML = `<p class="st-q">${esc(el.dataset.q || '마음에 닿았다면 도장 하나 남겨 주세요')}</p>`
        + `<div class="st-row">${types.map(t => `<button type="button" class="st-b" data-st="${t}" aria-pressed="${!!done[k + '|' + t]}">${LBL[t]}</button>`).join('')}</div>`
        + `<p class="st-n">도장은 주인장에게만 가요. 숫자는 어디에도 보이지 않아요.</p>`;
      el.hidden = false;
      el.querySelectorAll('[data-st]').forEach(b => b.onclick = async () => {
        const t = b.dataset.st, key = k + '|' + t, D = LS.get('bora_stamps', {});
        if (D[key] || b.disabled) return;
        const day = new Date().toISOString().slice(0, 10), cnt = LS.get('bora_stamps_day', {});
        if ((cnt[day] || 0) >= 30) { say(el, '오늘은 도장을 많이 찍었어요. 내일 또 남겨 주세요.'); return; }
        b.disabled = true;
        try {
          await send(k, t);
          D[key] = Date.now(); LS.set('bora_stamps', D); LS.set('bora_stamps_day', { [day]: (cnt[day] || 0) + 1 });
          b.setAttribute('aria-pressed', 'true'); say(el, '주인장에게 전했어요.');
        } catch (e) { say(el, '지금은 전하지 못했어요. 잠시 뒤 다시 눌러 주세요.'); }
        b.disabled = false;
      });
    });
  }

  window.boraStamps = { mount };
  const scan = () => document.querySelectorAll('.stamps[data-k]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
