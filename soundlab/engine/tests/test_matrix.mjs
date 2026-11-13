import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {planMix} from '../src/mix_plan.mjs';
const catalog=JSON.parse(readFileSync(new URL('../config/catalog10.json',import.meta.url)));
const combos=JSON.parse(readFileSync(new URL('../reports/all_175_plans.json',import.meta.url))).map(x=>x.selected);
const modes=['sleep','focus','rest','free','stimulus'],devices=['phone','headphones','desk','subwoofer'];
let count=0; const summary={};
for(const mode of modes)for(const device of devices){
 let simultaneous=0,sequential=0,disabled=0;
 for(const selected of combos){
  const p=planMix({catalog,selected,purpose:mode,device});
  assert.equal(p.stages.flatMap(s=>s.items).length,selected.length);
  assert.ok(p.stages.every(s=>s.items.filter(x=>x.enabled&&x.binaural).length<=1));
  assert.ok(p.stages.flatMap(s=>s.items).every(x=>x.gain_db<=0 && x.gain_db>=-80));
  assert.equal(p.verified.health_effects,false);
  if(p.strategy==='sequential')sequential++;else simultaneous++;
  disabled+=p.stages.flatMap(s=>s.items).filter(a=>!a.enabled).length;
  count++;
 }
 summary[`${mode}/${device}`]={simultaneous,sequential,disabled_source_instances:disabled};
}
assert.equal(count,3500);
writeFileSync(new URL('../reports/3500_plan_matrix.json',import.meta.url),JSON.stringify({test_count:count,summary,scope:'metadata path only; not acoustic signal or health benefit validation'},null,2));
console.log('PASS',count,'mode-device-combination plans (metadata only)');
