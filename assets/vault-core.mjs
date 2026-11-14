/* 보라다방 잠금 보관함 — 공통 부분 (브라우저와 Node 양쪽에서 같은 코드)
   비밀값(문자열) → PBKDF2-SHA256 → AES-256-GCM 열쇠. 파일마다 새 12바이트 IV, 파일 경로를 AAD로 묶는다.
   이 파일에는 비밀이 없다. 공개돼도 된다. 비밀값은 저장소·이슈·대화 어디에도 적지 않는다. */
const C = globalThis.crypto, te = new TextEncoder(), td = new TextDecoder();
export const SALT = 'bora-vault-v1', ITER = 600000;
export async function keyFrom(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('비밀값은 32자 이상이어야 합니다');
  const base = await C.subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return C.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: te.encode(SALT), iterations: ITER }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
/* 보관함 안의 파일 이름: 경로가 드러나지 않게 HMAC으로 만든다 (열쇠 없이는 어떤 파일인지 알 수 없다) */
export async function nameOf(secret, path) {
  const k = await C.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await C.subtle.sign('HMAC', k, te.encode('name:' + path))).slice(0, 32) + '.bin';
}
export async function seal(key, path, bytes) {
  const iv = C.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await C.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: te.encode(path) }, key, bytes));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return out;
}
export async function open(key, path, sealed) {
  const u = new Uint8Array(sealed);
  return C.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(0, 12), additionalData: te.encode(path) }, key, u.subarray(12));
}
/* 여는 쪽: get(name) → ArrayBuffer 를 주면 경로로 꺼낼 수 있는 보관함을 돌려준다 */
export async function vault(secret, get) {
  const key = await keyFrom(secret), cache = new Map();
  const bytes = async path => { if (!cache.has(path)) cache.set(path, get(await nameOf(secret, path)).then(b => open(key, path, b))); return cache.get(path); };
  const index = JSON.parse(td.decode(await bytes('index.json')));
  return { index, bytes: p => { if (!index.files[p]) throw new Error('보관함에 없는 파일: ' + p); return bytes(p); }, text: async p => td.decode(await bytes(p)) };
}
