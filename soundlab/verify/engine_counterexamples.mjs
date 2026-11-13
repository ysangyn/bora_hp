// R-002 반례 재현: node soundlab/verify/engine_counterexamples.mjs
// 각 사례는 "기대(설계 의도)"와 "실제"를 출력한다. 실패 = 의도와 다름. 실패해도 종료 코드는 0 (기록용).
import {readFileSync} from 'node:fs';
import {planMix} from '../engine/src/mix_plan.mjs';
const catalog=JSON.parse(readFileSync(new URL('../engine/config/catalog10.json',import.meta.url)));
const P=x=>planMix({catalog,...x});
const on=p=>p.stages.map(s=>s.items.filter(i=>i.enabled).map(i=>i.id));
const R=[];
const t=(id,desc,ok,actual)=>R.push({id,desc,result:ok?'AS_INTENDED':'COUNTEREXAMPLE',actual});

// CE-1 수면 목적에서 '방해 요소(event)'는 순차로 돌려져 결국 혼자 재생된다
let p=P({selected:['sleep_balance','eye_refresh'],purpose:'sleep',device:'headphones'});
t('CE-1','sleep: event(차임)는 빠지거나 경고되어야 함',!on(p).flat().includes('eye_refresh'),{strategy:p.strategy,reason:p.sequence_reason,enabled_by_stage:on(p),warnings:p.warnings.map(w=>w.id)});

// CE-2 수면 목적인데 에너지 제품을 골라도 경고가 없다
p=P({selected:['active_energy'],purpose:'sleep',device:'headphones'});
t('CE-2','sleep: energy 목표 제품은 경고/차단',p.warnings.some(w=>!/UNMEASURED/.test(w.id)),{strategy:p.strategy,warnings:p.warnings.map(w=>w.id)});

// CE-3 수면 목적의 순차 재생에서 마지막 단계가 에너지 음악이 될 수 있다 (선택 순서 그대로)
p=P({selected:['sleep_balance','active_energy'],purpose:'sleep',device:'headphones'});
t('CE-3','sleep: 마지막 단계는 잠에 맞는 제품',!on(p).at(-1).includes('active_energy'),{reason:p.sequence_reason,order:on(p)});

// CE-4 휴대폰에서 바이노럴 둘을 고르면 모든 단계가 꺼진 '빈 계획'이 오류 없이 나온다
p=P({selected:['body_relax','mind_focus'],purpose:'focus',device:'phone'});
t('CE-4','재생할 것이 없으면 오류 또는 명시적 상태',on(p).flat().length>0||p.warnings.some(w=>w.id==='NOTHING_TO_PLAY'),{strategy:p.strategy,reason:p.sequence_reason,enabled_by_stage:on(p),warnings:p.warnings.map(w=>w.id)});

// CE-5 꺼진 소스가 섞인 순차 계획에 '빈 단계'가 남는다
p=P({selected:['body_relax','calm_balance','mind_focus'],purpose:'rest',device:'desk'});
t('CE-5','빈 단계는 계획에서 빠져야 함',p.stages.every(s=>s.items.some(i=>i.enabled)),{stages:p.stages.map(s=>s.items.map(i=>i.id+(i.enabled?'':'(off)')))});

// CE-6 동시 재생 헤드룸: 엔진은 -3dB×(n-1), 데모 렌더(render_check.py)는 -6dB×(n-1) → 데모가 엔진 출력을 시험하지 않음
p=P({selected:['calm_balance','nature_recovery','head_reset'],purpose:'rest',device:'headphones'});
t('CE-6','데모 렌더 게인 = 엔진 게인',p.stages[0].items.every(i=>i.gain_db===-12),{engine_gain_db:p.stages[0].items.map(i=>i.gain_db),render_check_gain_db:-12});

// CE-7 순차 계획에 길이·크로스페이드·순서 근거가 없어 재생기가 실행할 수 없다
p=P({selected:['body_relax','mind_focus'],purpose:'rest',device:'headphones'});
t('CE-7','단계마다 길이/전환 정보',p.stages.every(s=>'duration_s' in s||'crossfade_s' in s),{stage_keys:Object.keys(p.stages[0])});

// CE-8 여러 이유가 겹쳐도 첫 이유 하나만 남는다
p=P({selected:['sleep_balance','vita_boost','body_relax'],purpose:'sleep',device:'phone'});
t('CE-8','모든 순차 사유 기록',Array.isArray(p.sequence_reason),{reason:p.sequence_reason});

// CE-9 'stimulus' 목적은 다른 목적과 구별되는 규칙이 없다
const a=JSON.stringify(P({selected:['body_relax','calm_balance'],purpose:'stimulus',device:'headphones'}).stages), b=JSON.stringify(P({selected:['body_relax','calm_balance'],purpose:'free',device:'headphones'}).stages);
t('CE-9','stimulus 목적 고유 규칙',a!==b,{same_as_free:a===b});

for(const r of R) console.log(r.result.padEnd(15),r.id,r.desc,'\n   ',JSON.stringify(r.actual));
console.log('\n반례',R.filter(r=>r.result!=='AS_INTENDED').length,'/',R.length);
