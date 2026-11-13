#!/usr/bin/env python3
"""R-002 바이노럴 반송파 정밀 검사: 지정한 구간에서 좌/우 채널의 각 반송파 레벨과 반대쪽 채널로 샌 양(누화)을 잰다.
사용: python3 -I binaural_carrier_check.py <wav> <시작초> <끝초> <좌Hz> <우Hz>
출력: 반송파별 L/R 레벨(dBFS, 사인 진폭 기준), 누화(dB), 그 구간에서 가장 큰 성분 5개(채널별),
      스피커 합산(L+R)의 포락선에서 비트 주파수 성분의 상대 크기."""
import sys, json, wave, numpy as np
p,t0,t1,fl,fr=sys.argv[1],float(sys.argv[2]),float(sys.argv[3]),float(sys.argv[4]),float(sys.argv[5])
with wave.open(p,'rb') as w: sr,ch,n,sw=w.getframerate(),w.getnchannels(),w.getnframes(),w.getsampwidth(); raw=w.readframes(n)
b=np.frombuffer(raw,dtype=np.uint8).reshape(-1,3); x=(b[:,0].astype(np.int32)|(b[:,1].astype(np.int32)<<8)|(b[:,2].astype(np.int32)<<16)); x=np.where(x>=1<<23,x-(1<<24),x)/float(1<<23); x=x.reshape(-1,ch)
seg=x[int(t0*sr):int(t1*sr)]; N=len(seg); w=np.hanning(N); cg=w.sum()/2
def amp(sig,f):
    S=np.fft.rfft(sig*w); fq=np.fft.rfftfreq(N,1/sr); i=np.argmin(abs(fq-f)); a=np.abs(S[max(0,i-2):i+3]).max()/cg; return 20*np.log10(a+1e-12)
def top(sig,k=5):
    S=np.abs(np.fft.rfft(sig*w))/cg; fq=np.fft.rfftfreq(N,1/sr); S[fq<40]=0; idx=[]
    for i in np.argsort(S)[::-1]:
        if all(abs(fq[i]-fq[j])>3 for j in idx): idx.append(i)
        if len(idx)==k: break
    return [(round(float(fq[i]),1),round(float(20*np.log10(S[i]+1e-12)),1)) for i in idx]
L,R=seg[:,0],seg[:,1]
res=dict(file=p.split('/')[-1],window=[t0,t1],carriers=dict(
  left_carrier=dict(hz=fl,in_L_dbfs=round(amp(L,fl),1),in_R_dbfs=round(amp(R,fl),1)),
  right_carrier=dict(hz=fr,in_R_dbfs=round(amp(R,fr),1),in_L_dbfs=round(amp(L,fr),1))),
  top5_L=top(L),top5_R=top(R))
res['crosstalk_db']=dict(left_into_R=round(res['carriers']['left_carrier']['in_R_dbfs']-res['carriers']['left_carrier']['in_L_dbfs'],1),
                         right_into_L=round(res['carriers']['right_carrier']['in_L_dbfs']-res['carriers']['right_carrier']['in_R_dbfs'],1))
# 스피커 합산 포락선에서 비트 성분
m=(L+R)/2; env=np.abs(m); k=int(sr/400); env=env[:len(env)//k*k].reshape(-1,k).mean(axis=1); fs=sr/k; env=env-env.mean()
S=np.abs(np.fft.rfft(env*np.hanning(len(env)))); f=np.fft.rfftfreq(len(env),1/fs); beat=abs(fr-fl)
ib=np.argmin(abs(f-beat)); band=(f>=1)&(f<=100)
res['speaker_sum_envelope']=dict(beat_hz=beat,beat_component_vs_median_db=round(float(20*np.log10(S[max(0,ib-1):ib+2].max()/np.median(S[band]))),1),
   strongest_mod_hz=round(float(f[band][np.argmax(S[band])]),2))
# 헤드폰(좌우 분리) 각 채널 포락선에는 비트가 없어야 함
eL=np.abs(L); eL=eL[:len(eL)//k*k].reshape(-1,k).mean(axis=1); eL=eL-eL.mean(); SL=np.abs(np.fft.rfft(eL*np.hanning(len(eL))))
res['left_only_envelope_beat_vs_median_db']=round(float(20*np.log10(SL[max(0,ib-1):ib+2].max()/np.median(SL[band]))),1)
print(json.dumps(res,ensure_ascii=False))
