// C-2 1차: 운영 index.html의 합성음을 브라우저 마스터 출력에서 그대로 받아 적는다 (사이트 코드는 고치지 않음).
// 방법: 페이지가 뜨기 전에 AudioNode.connect를 감싸서, 무엇이든 AudioDestination에 연결될 때
//       같은 신호를 ScriptProcessor 탭에도 연결해 float32 PCM을 모은다.
// 사용: node capture_synth.js <사이트 주소> <출력 폴더> [초=20] [반복=2]
// 한계: 헤드리스 Chromium 기준. Safari·iOS와 컴프레서 동작이 다를 수 있다. <audio>(노래·라디오)는 잡지 않는다.
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
const [,,URL='http://localhost:8791/R/index.html',OUT='captures',SEC='20',REP='2',ONLY='']=process.argv;
// 사이트 함수는 스크립트 안쪽에 있어 직접 부를 수 없으므로, 손님이 쓰는 '소리 섞기' 화면의 막대와 단추를 그대로 누른다.
const SET=(v,extra='')=>`(async()=>{ document.getElementById('bMix').click(); await new Promise(r=>setTimeout(r,400));
  const v=${JSON.stringify(v)}; for(const k of Object.keys(v)){ const r=document.querySelector('[data-mx="'+k+'"]'); r.value=v[k]; r.dispatchEvent(new Event('input',{bubbles:true})); r.dispatchEvent(new Event('change',{bubbles:true})); await new Promise(z=>setTimeout(z,300)); }
  ${extra} })()`;
const CLICK=sel=>`await new Promise(r=>setTimeout(r,500)); const b=document.querySelector('${sel}'); b&&b.click();`;
const SCEN=[
 ['rain_l0','부슬비',       SET({rain:1},CLICK('[data-rl="0"]'))],
 ['rain_l1','보통 비',      SET({rain:1},CLICK('[data-rl="1"]'))],
 ['rain_l2','장대비',       SET({rain:1},CLICK('[data-rl="2"]'))],
 ['kettle','주전자',        SET({boil:1})],
 ['brown','브라운 노이즈',  SET({noise:1},CLICK('[data-nz="brown"]'))],
 ['pink','핑크 노이즈',     SET({noise:1},CLICK('[data-nz="pink"]'))],
 ['wave','숨 고르기 바람',  SET({noise:1},CLICK('[data-nz="wave"]'))],
 ['tick','시계',            SET({tick:1})],
 ['mix_rain_kettle','비 0.6 + 주전자 1', SET({rain:.6,boil:1},CLICK('[data-rl="0"]'))],
];
(async()=>{ fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']}); const meta=[];
 for(const [id,name,js] of SCEN.filter(s=>!ONLY||ONLY.split(',').includes(s[0]))) for(let rep=1;rep<=+REP;rep++){
  const p=await b.newPage({viewport:{width:900,height:600}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{ const orig=AudioNode.prototype.connect; window.__cap={chunks:[],on:false,sr:0};
    AudioNode.prototype.connect=function(dest,...a){ const r=orig.call(this,dest,...a);
      if(dest instanceof AudioDestinationNode){ const c=dest.context; if(!c.__tap){ const sp=c.createScriptProcessor(4096,2,2); sp.onaudioprocess=e=>{ if(!window.__cap.on) return; const L=e.inputBuffer.getChannelData(0), R=e.inputBuffer.getChannelData(1); const f=new Float32Array(L.length*2); for(let i=0;i<L.length;i++){ f[2*i]=L[i]; f[2*i+1]=R[i]; } window.__cap.chunks.push(f); }; orig.call(sp,c.destination); c.__tap=sp; window.__cap.sr=c.sampleRate; }
        if(this!==c.__tap) orig.call(this,c.__tap); }
      return r; }; });
  await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ try{ localStorage.clear(); }catch(e){} });
  await p.reload({waitUntil:'load'}); await p.waitForTimeout(1500);
  await p.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('소리와 함께'));b&&b.click()});
  await p.waitForTimeout(2500);
  // 창밖 비·바람 등 상황 소리가 섞이지 않게: 창 닫힘, 날씨는 '모름'으로 고정, 노래·라디오 끔
  await p.evaluate(()=>{ window.__setWin({name:'서울',lat:37.56,lon:126.97},false); });
  await p.evaluate(js); await p.waitForTimeout(8000);   // 서서히 올라오는 시간
  await p.evaluate(()=>{ window.__cap.chunks=[]; window.__cap.on=true; });
  await p.waitForTimeout(+SEC*1000);
  const res=await p.evaluate(()=>{ window.__cap.on=false; const n=window.__cap.chunks.reduce((a,c)=>a+c.length,0), all=new Float32Array(n); let o=0; for(const c of window.__cap.chunks){ all.set(c,o); o+=c.length; } let s=''; const u=new Uint8Array(all.buffer); for(let i=0;i<u.length;i+=0x8000) s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000)); return {sr:window.__cap.sr,b64:btoa(s),state:window.__snd()}; });
  const f=path.join(OUT,`${id}_r${rep}.f32`); fs.writeFileSync(f,Buffer.from(res.b64,'base64'));
  meta.push({id,name,rep,sr:res.sr,seconds:+SEC,bytes:fs.statSync(f).size,state:res.state,errors:errs});
  console.log(id,rep,res.sr,fs.statSync(f).size,errs.length?errs:''); await p.close(); }
 fs.writeFileSync(path.join(OUT,'capture_meta.json'),JSON.stringify({url:URL,ua:await b.version(),scenarios:meta},null,1)); await b.close(); })();
