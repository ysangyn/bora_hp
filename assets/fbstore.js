/* 주인장 방·노트 쓰기의 저장 통로 (Firebase)
   - 구글 계정으로 한 번 들어가면 이 기기에서 계속 들어가 있다.
   - 저장하면 Firestore 'outbox'에 파일 묶음을 넣고, 깃허브 액션이 몇 분마다 가져가 사이트에 반영·배포한다.
   - 반영되기 전 내용은 'pending'에 두고, 읽을 때 사이트 파일보다 먼저 본다(저장 직후 다시 열어도 새 내용). */
const V = '10.12.2', G = `https://www.gstatic.com/firebasejs/${V}/`;
const ROOT = new URL('..', import.meta.url).href;
let A, F, auth, db, cfgP;
const cfg = () => cfgP || (cfgP = fetch(ROOT + 'data/firebase.json', { cache: 'no-cache' }).then(r => r.json()));
async function init() {
  if (db) return;
  const [app, au, fs] = await Promise.all([import(G + 'firebase-app.js'), import(G + 'firebase-auth.js'), import(G + 'firebase-firestore.js')]);
  A = au; F = fs;
  const c = await cfg(), ap = app.getApps().find(x => x.name === 'bora') || app.initializeApp(c, 'bora');
  auth = au.getAuth(ap); db = fs.getFirestore(ap);
  await auth.authStateReady();
}
export async function currentUser() { await init(); return auth.currentUser; }
export async function signIn() { await init(); const r = await A.signInWithPopup(auth, new A.GoogleAuthProvider()); return r.user; }
export async function signOut() { await init(); await A.signOut(auth); }
const key = p => p.replace(/\//g, '|');
/* 주인장 계정으로 쓸 수 있는지(규칙이 준비됐는지) 확인 */
export async function canWrite() {
  await init();
  try { await F.setDoc(F.doc(db, 'pending', '_probe'), { path: '_probe', at: F.serverTimestamp() }); return true; }
  catch (e) { if (e.code === 'permission-denied') return false; throw e; }
}
export async function getText(path) {
  await init();
  try { const s = await F.getDoc(F.doc(db, 'pending', key(path))); if (s.exists()) { const d = s.data(); return d.del ? null : d.text; } } catch (e) { if (e.code !== 'permission-denied') throw e; }
  const r = await fetch(ROOT + path.split('/').map(encodeURIComponent).join('/') + '?t=' + Date.now(), { cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) { const e = new Error('읽지 못했어요 (' + r.status + ')'); e.status = r.status; throw e; }
  return r.text();
}
export async function getJSON(path, d) { const t = await getText(path); return t == null ? d : JSON.parse(t); }
const b64 = blob => new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result).split(',')[1]); f.onerror = rej; f.readAsDataURL(blob); });
const utf8b64 = s => { const u = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(bin); };
const CH = 700000;   // Firestore 문서 하나는 1MB까지라 70만 글자씩 나눈다
/* files: [{path, text} | {path, blob} | {path, del:true}] */
export async function commit(files, msg) {
  await init();
  const u = auth.currentUser; if (!u) { const e = new Error('구글 계정으로 다시 들어가 주세요.'); e.status = 401; throw e; }
  const job = F.doc(F.collection(db, 'outbox')), list = []; let n = 0;
  for (const f of files) {
    if (f.del) { list.push({ path: f.path, del: true }); continue; }
    const data = f.blob ? await b64(f.blob) : utf8b64(f.text), parts = [];
    for (let i = 0; i < data.length; i += CH) { const id = String(n++).padStart(4, '0'); await F.setDoc(F.doc(db, 'outbox', job.id, 'parts', id), { d: data.slice(i, i + CH) }); parts.push(id); }
    list.push({ path: f.path, parts });
  }
  await F.setDoc(job, { msg: String(msg || '주인장 방에서 고침'), files: list, by: u.email || '', at: F.serverTimestamp(), ready: true });
  for (const f of files) {
    if (f.del) await F.setDoc(F.doc(db, 'pending', key(f.path)), { path: f.path, del: true, at: F.serverTimestamp() });
    else if (!f.blob && f.text.length < 900000) await F.setDoc(F.doc(db, 'pending', key(f.path)), { path: f.path, text: f.text, at: F.serverTimestamp() });
  }
}
/* 아직 사이트에 반영되지 않은 저장이 몇 건인지 */
export async function waiting() { await init(); try { const q = await F.getDocs(F.query(F.collection(db, 'outbox'), F.limit(20))); return q.size; } catch (e) { return 0; } }
/* 초대받은 계정인지: 규칙의 owner()만 읽을 수 있는 곳을 읽어 본다 */
export async function isOwner() {
  await init();
  try { await F.getDoc(F.doc(db, 'pending', '_gate')); return true; }
  catch (e) { if (e.code === 'permission-denied') return false; throw e; }
}
/* ids: 계정 번호(uid) 또는 구글 메일 주소. 메일 주소는 규칙 글에만 들어가고 이 저장소에는 남지 않는다 */
export function rulesFor(ids) {
  const q = a => a.map(x => `'${x.replace(/[^A-Za-z0-9@._+-]/g, '')}'`).join(', ');
  const U = q(ids.filter(x => x && !x.includes('@'))), M = q(ids.filter(x => x && x.includes('@')).map(x => x.toLowerCase()));
  return `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function owner() { return request.auth != null && (request.auth.uid in [${U}]${M ? ` || (request.auth.token.email_verified == true && request.auth.token.email in [${M}])` : ''}); }
    match /stamps/{id} {
      allow create: if request.resource.data.keys().hasOnly(['k', 't', 'at'])
        && request.resource.data.k is string && request.resource.data.k.size() <= 120
        && request.resource.data.t in ['more', 'comfort', 'read']
        && request.resource.data.at == request.time;
      allow get: if true;
      allow list: if request.query.limit <= 3000;
      allow delete: if owner();
    }
    match /outbox/{id} {
      allow read, write: if owner();
      match /parts/{p} { allow read, write: if owner(); }
    }
    match /pending/{id} { allow read, write: if owner(); }
  }
}`;
}
