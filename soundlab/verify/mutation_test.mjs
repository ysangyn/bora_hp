// R-002 변이 시험: GPT 테스트가 규칙을 실제로 지키는지 본다.
// mix_plan.mjs의 규칙을 하나씩 망가뜨린 사본을 만들고, GPT의 두 테스트가 실패(=변이 잡음)하는지 확인한다.
// 실행: node soundlab/verify/mutation_test.mjs
import {readFileSync,writeFileSync,mkdirSync,cpSync,rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const E=new URL('../engine/',import.meta.url).pathname, T='/tmp/bora_mut/';
const src=readFileSync(E+'src/mix_plan.mjs','utf8');
const M=[
 ['M1 수면+event 규칙 제거',"if(mode==='sleep'&&(a.category==='event'||b.category==='event'||a.speech_present||b.speech_present))return 'sleep_distraction';",''],
 ['M2 수면↔에너지 규칙 제거',"if((goalA.has('sleep')&&goalB.has('energy'))||(goalB.has('sleep')&&goalA.has('energy'))) return 'sleep_energy';",''],
 ['M3 말소리(집중) 규칙 제거',"if(mode==='focus'&&(a.speech_present||b.speech_present))return 'focus_speech';",''],
 ['M4 템포 충돌 규칙 제거',"&&Math.abs(a.tempo_bpm-b.tempo_bpm)>3)return 'conflicting_tempo';","&&false)return 'conflicting_tempo';"],
 ['M5 바이노럴 여럿 → 순차 규칙 제거',"if(src.filter(a=>a.binaural).length>1)sequenceReason='multiple_binaural';",''],
 ['M6 헤드폰 아니면 바이노럴 끄기 제거',"const safetyDisabled=(a.binaural&&device!=='headphones')||a.category==='external';","const safetyDisabled=a.category==='external';"],
 ['M7 동시 재생 헤드룸 제거',"strategy==='simultaneous'?-3*Math.max(0,src.length-1):0","0"],
 ['M8 event -9dB 보정 제거',"a.category==='event'?-9:",""],
 ['M9 헤드룸을 +6dB로(증폭)',"strategy==='simultaneous'?-3*Math.max(0,src.length-1):0","6"],
];
const out=[];
for(const [name,a,b] of M){
  if(!src.includes(a)){ out.push([name,'PATCH_NOT_FOUND']); continue; }
  rmSync(T,{recursive:true,force:true}); mkdirSync(T); cpSync(E,T,{recursive:true});
  writeFileSync(T+'src/mix_plan.mjs',src.replace(a,b));
  let killed=false, why='';
  for(const t of ['tests/test_all_175.mjs','tests/test_matrix.mjs']){
    try{ execFileSync('node',[T+t],{stdio:'pipe'}); }catch(e){ killed=true; why=t+': '+String(e.stderr).split('\n').find(l=>/Assertion|Error/.test(l))?.slice(0,90); break; }
  }
  out.push([name,killed?'KILLED (테스트가 잡음)':'SURVIVED (테스트가 못 잡음)',why]);
}
rmSync(T,{recursive:true,force:true});
for(const r of out) console.log(r.join(' | '));
console.log('\n잡힌 변이',out.filter(r=>r[1].startsWith('KILLED')).length,'/',out.length);
