import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {planMix} from '../src/mix_plan.mjs';
const catalog=JSON.parse(readFileSync(new URL('../config/catalog10.json',import.meta.url)));
const ids=catalog.map(a=>a.id), records=[];
function combos(arr,k,start=0,b=[]){if(b.length===k){records.push([...b]);return};for(let i=start;i<=arr.length-(k-b.length);i++)combos(arr,k,i+1,[...b,arr[i]])}
for(const k of [1,2,3])combos(ids,k);
assert.equal(records.length,175);
let nSequential=0,nSimultaneous=0;
const out=[];
for(const selected of records){
 const x={catalog,selected,purpose:'rest',device:'headphones'};
 const p=planMix(x),p2=planMix(x);
 assert.deepEqual(p,p2);assert.equal(p.stages.flatMap(s=>s.items).length,selected.length);
 assert.ok(p.stages.every(s=>s.items.filter(i=>i.binaural).length<=1),'never two binaural signals simultaneously');
 assert.ok(p.stages.flatMap(s=>s.items).every(i=>Number.isFinite(i.gain_db) && i.gain_db<=0));
 if(p.strategy==='sequential')nSequential++;else nSimultaneous++;
 out.push({selected,strategy:p.strategy,reason:p.sequence_reason,stages:p.stages.length,warnings:p.warnings.map(w=>w.id)});
}
// 40 Hz binaural must not be relabeled as effectiveness, no device equivalence.
assert.equal(planMix({catalog,selected:['mind_focus'],device:'phone'}).stages[0].items[0].enabled,false);
assert.equal(planMix({catalog,selected:['body_relax','mind_focus']}).strategy,'sequential');
assert.throws(()=>planMix({catalog,selected:['a','a']}));
// Incompatible music tempos should be sequenced, not layered.
assert.equal(planMix({catalog,selected:['vita_boost','active_energy']}).strategy,'sequential');
writeFileSync(new URL('../reports/all_175_plans.json',import.meta.url),JSON.stringify(out,null,2));
writeFileSync(new URL('../reports/test_summary.json',import.meta.url),JSON.stringify({total:out.length,simultaneous:nSimultaneous,sequential:nSequential,checks:['determinism','one_binaural_per_stage','headroom_finite','phone_disables_binaural','incompatible_tempo_sequenced'],scope:'metadata plan only; no audio waveform generated or inspected'},null,2));
console.log('PASS',out.length,'combinations;',nSimultaneous,'simultaneous;',nSequential,'sequential');
