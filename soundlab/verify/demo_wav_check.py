#!/usr/bin/env python3
"""R-002 데모 WAV 독립 검사 (GPT render_check.py와 다른 방법)
사용: python3 -I demo_wav_check.py <wav> [<wav> ...]  →  JSON 출력
- 형식: 표본화율, 채널, 길이 (WAV 헤더 직접 읽기)
- 음량: ffmpeg ebur128 (LUFS-I, LRA, True Peak)
- 바이노럴: 2초 창마다 좌·우 채널의 최대 스펙트럼 봉우리(100~1000Hz, 0.5Hz 분해능 보간), 좌우 차이
- 스피커 합산(L+R) 시 생기는 맥놀이: 합산 신호 포락선의 변조 스펙트럼(1~60Hz) 최대 성분
- 이음매: 10ms 창 RMS가 직전 대비 12dB 넘게 튀는 지점
"""
import sys, json, wave, subprocess, re
import numpy as np
def load(p):
    with wave.open(p,'rb') as w:
        sr,ch,n,sw=w.getframerate(),w.getnchannels(),w.getnframes(),w.getsampwidth(); raw=w.readframes(n)
    if sw==3:
        b=np.frombuffer(raw,dtype=np.uint8).reshape(-1,3); x=(b[:,0].astype(np.int32)|(b[:,1].astype(np.int32)<<8)|(b[:,2].astype(np.int32)<<16)); x=np.where(x>=1<<23,x-(1<<24),x)/float(1<<23)
    elif sw==2: x=np.frombuffer(raw,dtype='<i2')/32768.0
    else: x=np.frombuffer(raw,dtype='<f4').astype(float)
    return sr,ch,x.reshape(-1,ch)
def ebu(p):
    e=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',p,'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True).stderr; t=e[e.rfind('Summary:'):]
    g=lambda r:(lambda m: float(m.group(1)) if m else None)(re.search(r,t))
    return dict(lufs_i=g(r'I:\s+(-?[\d.]+) LUFS'),lra=g(r'LRA:\s+(-?[\d.]+) LU'),true_peak_dbtp=g(r'Peak:\s+(-?[\d.]+) dBFS'))
def peak_hz(sig,sr,lo=100,hi=1000):
    n=len(sig); w=np.hanning(n); S=np.abs(np.fft.rfft(sig*w,n*4)); f=np.fft.rfftfreq(n*4,1/sr)
    m=(f>=lo)&(f<=hi); i=np.argmax(S*m); 
    if 0<i<len(S)-1:
        a,b,c=np.log(S[i-1]+1e-12),np.log(S[i]+1e-12),np.log(S[i+1]+1e-12); d=.5*(a-c)/(a-2*b+c)
    else: d=0
    return float(f[i]+d*(f[1]-f[0])), float(20*np.log10(S[i]/S[m].mean()+1e-12))
def env_mod(sig,sr):
    # 합산 신호의 포락선 변조 주파수 (1~60Hz)
    from numpy.fft import rfft,rfftfreq
    env=np.abs(sig); k=int(sr/200); env=env[:len(env)//k*k].reshape(-1,k).mean(axis=1); fs=sr/k
    env=env-env.mean(); S=np.abs(rfft(env*np.hanning(len(env)))); f=rfftfreq(len(env),1/fs); m=(f>=1)&(f<=60)
    i=np.argmax(S*m); return float(f[i]), float(20*np.log10(S[i]/np.median(S[m])+1e-12))
out=[]
for p in sys.argv[1:]:
    sr,ch,x=load(p); r=dict(file=p.split('/')[-1],sr=sr,ch=ch,dur_s=round(len(x)/sr,2),**ebu(p))
    win=int(sr*2); rows=[]
    for s in range(0,len(x)-win,win):
        L,Rr=x[s:s+win,0],x[s:s+win,1]
        if np.sqrt((L**2).mean())<1e-5: rows.append(None); continue
        fl,pl=peak_hz(L,sr); fr,pr=peak_hz(Rr,sr); fm,pm=env_mod((L+Rr)/2,sr)
        rows.append(dict(t=round(s/sr,1),L_hz=round(fl,1),R_hz=round(fr,1),diff_hz=round(fr-fl,2),peak_prom_db=round(min(pl,pr),1),sum_env_mod_hz=round(fm,2),sum_env_mod_prom_db=round(pm,1)))
    r['windows_2s']=rows
    m=x.mean(axis=1); k=int(sr*.01); e=np.sqrt((m[:len(m)//k*k].reshape(-1,k)**2).mean(axis=1))+1e-9; d=20*np.log10(e)
    r['jumps_gt12db_10ms']=[round(i*.01,2) for i in range(1,len(d)) if d[i]-d[i-1]>12 and d[i]>-60]
    r['lr_corr']=round(float(np.corrcoef(x[:,0],x[:,1])[0,1]),3) if ch==2 else None
    out.append(r)
print(json.dumps(out,ensure_ascii=False,indent=1))
