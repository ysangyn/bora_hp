/* 보라다방 문 — 지금은 초대받은 구글 계정만 들어온다.
   한 번 들어오면 이 기기에서는 계속 들어와 있다(30일마다 조용히 다시 확인).
   알아 둘 것: 이 문은 화면을 가린다. 파일 주소를 직접 아는 사람까지 막지는 못한다.
   초대 명단은 Firestore 규칙의 owner()에 있다(주인장 방 → admin/?rules=1 에서 만든다). 이 파일에는 명단도 비밀도 없다. */
(function () {
  if (/^\/(admin|notes\/write)(\/|$)/.test(location.pathname)) return;          // 주인장 방·노트 쓰기는 제 문이 따로 있다
  var K = 'bora_gate', D = document.documentElement, ROOT = new URL('..', document.currentScript.src).href, MONTH = 30 * 864e5;
  var c = null; try { c = JSON.parse(localStorage.getItem(K)); } catch (e) {}
  var fresh = !!(c && c.u && Date.now() - c.t < MONTH), fb = null, box = null;
  var st = document.createElement('style');
  st.textContent = 'html.gate-lock,html.gate-lock body{overflow:hidden!important}html.gate-lock body>*:not(#gate){visibility:hidden!important}' +
    '#gate{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:#120d16 url(' + ROOT + 'img/b_room_off.webp) center/cover no-repeat;color:#efe6da;font-family:"Noto Serif KR","Nanum Myeongjo",serif;visibility:visible}' +
    '#gate:before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(14,10,18,.25) 0%,rgba(14,10,18,.55) 45%,rgba(14,10,18,.94) 78%)}' +
    '#gate .gin{position:relative;width:100%;max-width:460px;box-sizing:border-box;padding:0 28px max(44px,env(safe-area-inset-bottom));text-align:left;word-break:keep-all}' +
    '#gate h1{font-weight:400;font-size:30px;letter-spacing:.06em;margin:0 0 10px}#gate p{font-size:15.5px;line-height:1.8;margin:0 0 6px;color:#d9cdbf;font-weight:300}' +
    '#gate .gs{font-size:13px;color:#a99c90;margin-top:14px}#gate .gb{display:block;width:100%;margin-top:22px;padding:15px 18px;border:1px solid rgba(239,230,218,.45);border-radius:3px;background:rgba(239,230,218,.08);color:#efe6da;font:inherit;font-size:16px;letter-spacing:.04em;text-align:center;cursor:pointer}' +
    '#gate .gb:active{background:rgba(239,230,218,.18)}#gate .gl{display:inline-block;margin-top:16px;padding:10px 0;background:none;border:0;color:#a99c90;font:inherit;font-size:13.5px;text-decoration:underline;text-underline-offset:4px;cursor:pointer}' +
    '#gate .gm{font-size:13.5px;color:#e2b9a0;min-height:1.6em;margin-top:12px}';
  document.head.appendChild(st);
  if (!fresh) D.classList.add('gate-lock');
  function mount() { if (box) return box; box = document.createElement('div'); box.id = 'gate'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '보라다방 들어가기'); (document.body || D).appendChild(box); return box; }
  function show(html) { D.classList.add('gate-lock'); mount().innerHTML = '<div class="gin">' + html + '</div>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function open(u) { try { localStorage.setItem(K, JSON.stringify({ u: u.uid, t: Date.now() })); } catch (e) {} D.classList.remove('gate-lock'); if (box) { box.remove(); box = null; } }
  function forget() { try { localStorage.removeItem(K); } catch (e) {} }
  function load() { return fb ? Promise.resolve(fb) : import(ROOT + 'assets/fbstore.js').then(function (m) { return (fb = m); }); }
  function door(msg) {
    show('<h1>보라다방</h1><p>지금은 초대받은 사람만 들어오는 방이에요.</p><p>처음 한 번만 구글 계정으로 들어오면, 다음부터는 바로 열려요.</p>' +
      '<button class="gb" id="gIn" type="button">구글 계정으로 들어가기</button><div class="gm" id="gM">' + esc(msg || '') + '</div>' +
      '<p class="gs">카카오톡이나 인스타그램 안에서 열었다면, 크롬이나 삼성 인터넷으로 다시 열어 주세요.</p>');
    document.getElementById('gIn').onclick = function () { var m = document.getElementById('gM'); m.textContent = '구글 계정 확인 중…';
      load().then(function (f) { return f.signIn(); }).then(check, function (e) { var c = e && e.code || '';
        m.textContent = c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request' ? '창이 닫혔어요. 다시 눌러 주세요.' : c === 'auth/popup-blocked' ? '로그인 창이 막혔어요. 팝업을 허용하고 다시 눌러 주세요.' : '들어가지 못했어요. 잠시 뒤 다시 눌러 주세요.'; }); };
  }
  function denied(u) { forget();
    show('<h1>보라다방</h1><p>이 계정은 아직 초대받지 않았어요.</p><p class="gs">' + esc(u.email || '') + '</p>' +
      '<button class="gb" id="gSw" type="button">다른 계정으로 들어가기</button><div class="gm"></div>');
    document.getElementById('gSw').onclick = function () { fb.signOut().then(function () { door(); }); };
  }
  function check() {
    return load().then(function (f) { return f.currentUser().then(function (u) {
      if (!u) { forget(); door(); return; }
      return f.isOwner().then(function (ok) { ok ? open(u) : denied(u); }); }); })
      .catch(function () { if (fresh) return;                                     // 전에 들어온 기기에서 연결만 안 되는 것이면 그대로 둔다
        show('<h1>보라다방</h1><p>문을 확인하지 못했어요. 인터넷 연결을 살펴 주세요.</p><button class="gb" id="gRe" type="button">다시 확인</button>'); document.getElementById('gRe').onclick = function () { wait(); check(); }; });
  }
  function wait() { show('<h1>보라다방</h1><p>문을 확인하고 있어요…</p>'); }
  function start() { if (!fresh) wait(); check(); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
