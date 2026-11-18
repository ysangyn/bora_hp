
const PRESETS={
bath:{rpm:2300,blades:5,hum:.010,humHz:120,flow:1,bodyHz:[310,780],bodyQ:3.2,body:.45,lp:2600,hp:110,tilt:-1.0,whirr:.035,drift:.35},
dohm:{rpm:1600,blades:7,hum:0,humHz:120,flow:1,bodyHz:[420,1150],bodyQ:2.2,body:.35,lp:5200,hp:90,tilt:-.6,whirr:.018,drift:.25},
bath_home:{rpm:950,blades:5,hum:.004,humHz:120,flow:1,bodyHz:[400,980],bodyQ:2.6,body:.38,lp:1400,hp:190,hp2:true,tilt:-.8,whirr:.004,drift:.12,width:.18,room:.5},
dohm_home:{rpm:720,blades:7,hum:0,humHz:120,flow:1,bodyHz:[480,1100],bodyQ:1.6,body:.28,lp:2100,hp:150,hp2:true,tilt:-.5,whirr:.002,drift:.08,width:.25,room:.3},
};
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296*2-1}}
class Biquad{constructor(){this.b0=1;this.b1=0;this.b2=0;this.a1=0;this.a2=0;this.x1=this.x2=this.y1=this.y2=0}
set(type,sr,f,Q,gainDb=0){const w=2*Math.PI*Math.min(f,sr*.45)/sr,c=Math.cos(w),a=Math.sin(w)/(2*Q),A=10**(gainDb/40);let b0,b1,b2,a0,a1,a2;
if(type==='lp'){b0=(1-c)/2;b1=1-c;b2=b0;a0=1+a;a1=-2*c;a2=1-a}else if(type==='hp'){b0=(1+c)/2;b1=-(1+c);b2=b0;a0=1+a;a1=-2*c;a2=1-a}
else if(type==='bp'){b0=a;b1=0;b2=-a;a0=1+a;a1=-2*c;a2=1-a}else{b0=1+a*A;b1=-2*c;b2=1-a*A;a0=1+a/A;a1=-2*c;a2=1-a/A}
this.b0=b0/a0;this.b1=b1/a0;this.b2=b2/a0;this.a1=a1/a0;this.a2=a2/a0}
p(x){const y=this.b0*x+this.b1*this.x1+this.b2*this.x2-this.a1*this.y1-this.a2*this.y2;this.x2=this.x1;this.x1=x;this.y2=this.y1;this.y1=y;return y}}
class Pink{constructor(r){this.r=r;this.b=[0,0,0,0,0,0,0]}n(){const w=this.r(),b=this.b;b[0]=.99886*b[0]+w*.0555179;b[1]=.99332*b[1]+w*.0750759;b[2]=.969*b[2]+w*.153852;b[3]=.8665*b[3]+w*.3104856;b[4]=.55*b[4]+w*.5329522;b[5]=-.7616*b[5]-w*.016898;const o=b[0]+b[1]+b[2]+b[3]+b[4]+b[5]+b[6]+w*.5362;b[6]=w*.115926;return o*.11}}
const XF=.06; 
function chk(c,m){if(!c)throw new RangeError(m)}
class Chain{constructor(sr,name,tone,speed){const P=PRESETS[name],k=tone;this.P=P;
const lpf=P.lp*(.55+.9*k)*(speed===2?1.18:1);this.lp=[0,1,2].map(()=>{const b=new Biquad();b.set('lp',sr,lpf,.6);return b});
this.hp=[0,1,2,3].map(()=>{const b=new Biquad();b.set('hp',sr,P.hp,.7);return b});this.hp2=!!P.hp2;this.w=P.width??1;
this.room=P.room||0;if(this.room){this.dl=new Float32Array(Math.ceil(sr*.03)+2);this.dr=new Float32Array(this.dl.length);this.di=0;this.taps=[[.0031,.0047],[.0073,.0061],[.0119,.0137],[.0173,.0191]].map(([a,b],j)=>[Math.round(a*sr),Math.round(b*sr),.55*.7**j]);this.rlp=[new Biquad(),new Biquad()];this.rlp.forEach(b=>b.set('lp',sr,1800,.7))}
this.body=P.bodyHz.map(f=>{const L=new Biquad(),R=new Biquad(),ff=f*(.85+.3*k);L.set('bp',sr,ff,P.bodyQ);R.set('bp',sr,ff*1.03,P.bodyQ);return [L,R]});
this.rpm=P.rpm*(speed===2?1.25:1);this.bpf=this.rpm/60*P.blades;
this.blade=[1,2,1.01,2.02].map(m=>{const b=new Biquad();b.set('bp',sr,this.bpf*m,9);return b});
this.shelf=[0,1].map(()=>{const b=new Biquad();b.set('hs',sr,2500,.7,P.tilt*4*(1-k));return b});this.lvl=speed===2?1.25:1}
tick(c,l,r,bn,ph,hph,o){const P=this.P,wh=1+P.whirr*Math.sin(ph*this.rpm/2300)+P.whirr*.4*Math.sin(2*ph*this.rpm/2300+.7);
const w=this.w,cw=.72+.48*(1-w),own=.48*w;let xl=(cw*c+own*l)*P.flow*wh,xr=(cw*c+own*r)*P.flow*wh;
xl+=(this.blade[0].p(bn)*.9+this.blade[1].p(bn)*.35)*.55*wh;xr+=(this.blade[2].p(bn)*.9+this.blade[3].p(bn)*.35)*.55*wh;
let bL=0,bR=0;for(const [A,B] of this.body){bL+=A.p(xl);bR+=B.p(xr)}xl+=bL*P.body;xr+=bR*P.body;
if(P.hum){const h=P.hum*(Math.sin(hph)+.5*Math.sin(2*hph+.3)+.25*Math.sin(3*hph+1.1));xl+=h;xr+=h}
let yl=this.shelf[0].p(this.hp[0].p(this.lp[0].p(this.lp[2].p(xl)))),yr=this.shelf[1].p(this.hp[1].p(this.lp[1].p(xr)));
if(this.hp2){yl=this.hp[2].p(yl);yr=this.hp[3].p(yr)}
if(this.room){const D=this.dl.length,i=this.di;this.dl[i]=yl;this.dr[i]=yr;let el=0,er=0;for(const [a,b,g] of this.taps){el+=this.dr[(i-a+D)%D]*g;er+=this.dl[(i-b+D)%D]*g}
this.di=(i+1)%D;yl+=this.rlp[0].p(el)*this.room;yr+=this.rlp[1].p(er)*this.room}
o[0]=yl*this.lvl;o[1]=yr*this.lvl}}
class FanVoice{
constructor({sr=44100,preset='bath',seed=1,tone=.5,speed=1}={}){
chk(Number.isFinite(sr)&&sr>=8000&&sr<=192000,`sr must be 8000..192000, got ${sr}`);chk(Number.isInteger(seed),`seed must be an integer, got ${seed}`);
this.sr=sr;this.seed=seed;this.R=rng(seed);this.Rl=rng(seed*7+1);this.Rr=rng(seed*13+5);this.pc=new Pink(this.R);this.pl=new Pink(this.Rl);this.pr=new Pink(this.Rr);
this.t=0;this.ph=0;this.hph=0;this.drift=0;this.driftT=0;this.rpmJ=0;this.old=null;this.xf=0;this.o1=[0,0];this.o2=[0,0];this.setPreset(preset,tone,speed);this.old=null;this.xf=0}
setPreset(name,tone=this.tone??.5,speed=this.speed??1){
chk(Object.hasOwn(PRESETS,name),`unknown preset ${name}`);chk(Number.isFinite(tone)&&tone>=0&&tone<=1,`tone must be 0..1, got ${tone}`);chk(speed===1||speed===2,`speed must be 1 or 2, got ${speed}`);
const next=new Chain(this.sr,name,tone,speed);
if(this.cur){this.old=this.cur;this.xf=Math.round(XF*this.sr);this.xfN=this.xf}
this.cur=next;this.P=next.P;this.name=name;this.tone=tone;this.speed=speed;this.rpm=next.rpm;this.bpf=next.bpf}
render(L,R,n,gain=1,off=0){
chk(Number.isInteger(n)&&n>=0,`n must be a non-negative integer, got ${n}`);chk(Number.isInteger(off)&&off>=0,`off must be a non-negative integer, got ${off}`);
chk(Number.isFinite(gain)&&gain>=0,`gain must be finite and >= 0, got ${gain}`);chk(L&&R&&L.length>=off+n&&R.length>=off+n,`L/R too short for off+n=${off+n}`);
const sr=this.sr,dt=1/sr,o1=this.o1,o2=this.o2;
for(let i=0;i<n;i++){const P=this.P;
if(this.t>=this.driftT){this.d0=this.drift;this.d1=this.R()*P.drift;this.driftT=this.t+3+Math.abs(this.R())*6;this.dStart=this.t}
const u=Math.min(1,(this.t-this.dStart)/(this.driftT-this.dStart)),sm=u*u*(3-2*u);this.drift=this.d0+(this.d1-this.d0)*sm;const amp=10**(this.drift/20);
this.rpmJ+=(this.R()*.002-this.rpmJ*.0005);
this.ph+=2*Math.PI*(2300/60)*(1+this.rpmJ)*dt;this.hph+=2*Math.PI*120*dt;
const c=this.pc.n(),l=this.pl.n(),r=this.pr.n(),bn=this.R();
this.cur.tick(c,l,r,bn,this.ph,this.hph,o1);let yl=o1[0],yr=o1[1];
if(this.old){this.old.tick(c,l,r,bn,this.ph,this.hph,o2);const a=this.xf/this.xfN,ga=Math.sin(a*Math.PI/2),gb=Math.cos(a*Math.PI/2);yl=yl*gb+o2[0]*ga;yr=yr*gb+o2[1]*ga;if(--this.xf<=0)this.old=null}
const g=gain*amp*1.6;L[off+i]+=yl*g;R[off+i]+=yr*g;this.t+=dt}}}

class FanProc extends AudioWorkletProcessor{constructor(o){super();const p=o.processorOptions||{};this.v=new FanVoice({sr:sampleRate,preset:p.preset||'bath_home',tone:p.tone??.4,seed:(Math.random()*2**31)|0});
this.port.onmessage=e=>{const d=e.data||{};try{if(d.preset||d.tone!=null)this.v.setPreset(d.preset||this.v.name,d.tone??this.v.tone,1)}catch(_){}}}
process(_,out){const o=out[0];if(!o||!o[0])return true;const L=o[0],R=o[1]||o[0];L.fill(0);if(R!==L)R.fill(0);this.v.render(L,R,L.length,1,0);if(R===L){for(let i=0;i<L.length;i++)L[i]*=.5}return true}}
registerProcessor('bora-fan',FanProc);
