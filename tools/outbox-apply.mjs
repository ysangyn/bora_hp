// 주인장 방·노트 쓰기에서 Firebase 'outbox'에 넣은 저장 묶음을 저장소 파일로 옮긴다(깃허브 액션에서 돈다)
import admin from 'firebase-admin';
import fs from 'node:fs'; import path from 'node:path';
const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore(), root = process.cwd();
const jobs = (await db.collection('outbox').orderBy('at').limit(50).get()).docs.filter(d => d.get('ready'));
const msgs = [], done = [];
for (const j of jobs) {
  const parts = await j.ref.collection('parts').get(), P = {}; parts.docs.forEach(d => P[d.id] = d.get('d'));
  for (const f of j.get('files') || []) {
    const fp = path.join(root, f.path); if (!fp.startsWith(root + path.sep) || f.path.includes('..')) continue;   // 저장소 밖으로는 못 쓴다
    if (f.del) { fs.rmSync(fp, { force: true }); continue; }
    fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, Buffer.from((f.parts || []).map(id => P[id] || '').join(''), 'base64'));
  }
  msgs.push(j.get('msg') || '주인장 방에서 고침'); done.push({ ref: j.ref, parts: parts.docs.map(d => d.ref), at: j.get('at') });
}
fs.writeFileSync(path.join(root, '.outbox-msg'), msgs.join('\n'));
fs.writeFileSync(path.join(root, '.outbox-done.json'), JSON.stringify(done.map(d => ({ id: d.ref.id, at: d.at && d.at.toMillis() }))));
console.log('jobs', done.length);
