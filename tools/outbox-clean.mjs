// 배포가 끝난 뒤: 처리한 outbox 묶음과, 그 시각까지의 pending(반영 대기 사본)을 지운다
import admin from 'firebase-admin'; import fs from 'node:fs';
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')) });
const db = admin.firestore(), done = JSON.parse(fs.readFileSync('.outbox-done.json', 'utf8') || '[]');
let last = 0;
for (const d of done) { const ref = db.collection('outbox').doc(d.id); for (const p of (await ref.collection('parts').get()).docs) await p.ref.delete(); await ref.delete(); last = Math.max(last, d.at || 0); }
if (last) for (const p of (await db.collection('pending').get()).docs) { const at = p.get('at'); if (!at || at.toMillis() <= last) await p.ref.delete(); }
console.log('cleaned', done.length);
