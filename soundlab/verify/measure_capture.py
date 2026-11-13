#!/usr/bin/env python3
"""C-2 캡처 측정: capture_synth.js가 만든 *.f32(스테레오 float32)를 WAV로 바꾸고 잰다.
사용: python3 -I measure_capture.py <캡처 폴더> <결과.json>
측정 (R-001·G-1에서 합의한 지표):
- LUFS-I, LRA, True Peak (ffmpeg ebur128)
- 단기(3s) LUFS 분포 p10/p50/p95, 순간(400ms) 최댓값, 돌발성 = M_max - S_p50 (ffmpeg ebur128 framelog)
- 표본 피크, RMS, 스펙트럼 중심, 옥타브 대역(전체 대비 dB)
- 반복 간 차이: 같은 장면 r1과 r2의 S_p50 차, 대역 차 최대값 (난수 소리라 표본 단위 일치는 기대하지 않음)
미측정: sharpness·roughness (MOSQITO 미설치), 청취 평가
"""
import sys, json, glob, os, re, subprocess
import numpy as np
D,OUT=sys.argv[1],sys.argv[2]
meta=json.load(open(os.path.join(D,'capture_meta.json')))
BANDS=[31.5,63,125,250,500,1000,2000,4000,8000,16000]
def to_wav(f32,sr):
    w=f32[:-4]+'.wav'
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(sr),'-ac','2','-i',f32,'-c:a','pcm_f32le',w],check=True); return w
def ebu(w):
    e=subprocess.run(['ffmpeg','-hide_banner','-nostats','-v','verbose','-i',w,'-af','ebur128=peak=true:framelog=verbose','-f','null','-'],capture_output=True,text=True).stderr
    M,S=[],[]
    for l in e.splitlines():
        m=re.search(r't:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+|-inf)\s+S:\s*(-?[\d.]+|-inf)',l)
        if m:
            t=float(m.group(1))
            if m.group(2)!='-inf': M.append(float(m.group(2)))
            if m.group(3)!='-inf' and t>=3.0: S.append(float(m.group(3)))
    t=e[e.rfind('Summary:'):]; g=lambda r:(lambda m: float(m.group(1)) if m else None)(re.search(r,t))
    S=np.array(S) if S else np.array([np.nan]); M=np.array(M) if M else np.array([np.nan])
    r=dict(lufs_i=g(r'I:\s+(-?[\d.]+) LUFS'),lra=g(r'LRA:\s+(-?[\d.]+) LU'),true_peak_dbtp=g(r'Peak:\s+(-?[\d.]+) dBFS'),
           s_p10=round(float(np.nanpercentile(S,10)),1),s_p50=round(float(np.nanpercentile(S,50)),1),s_p95=round(float(np.nanpercentile(S,95)),1),m_max=round(float(np.nanmax(M)),1))
    r['burst_db']=round(r['m_max']-r['s_p50'],1); return r
def spec(x,sr):
    m=x.mean(axis=1); n=8192; w=np.hanning(n); acc=np.zeros(n//2+1); k=0
    for i in range(0,len(m)-n,n//2): acc+=np.abs(np.fft.rfft(m[i:i+n]*w))**2; k+=1
    acc/=max(k,1); f=np.fft.rfftfreq(n,1/sr); tot=acc.sum()+1e-30
    return round(float((f*acc).sum()/tot)), {str(b): round(float(10*np.log10(max(acc[(f>=b/2**.5)&(f<b*2**.5)].sum()/tot,1e-12))),1) for b in BANDS}
res=[]
for s in meta['scenarios']:
    f=os.path.join(D,f"{s['id']}_r{s['rep']}.f32"); x=np.fromfile(f,dtype='<f4').reshape(-1,2); w=to_wav(f,s['sr'])
    c,b=spec(x,s['sr']); pk=float(np.abs(x).max()); rms=float(np.sqrt((x**2).mean()))
    res.append(dict(id=s['id'],name=s['name'],rep=s['rep'],sr=s['sr'],seconds=round(len(x)/s['sr'],2),wav_sha256=subprocess.run(['sha256sum',w],capture_output=True,text=True).stdout.split()[0],
        **ebu(w),sample_peak_dbfs=round(20*np.log10(pk+1e-12),1),rms_dbfs=round(20*np.log10(rms+1e-12),1),centroid_hz=c,octave_db=b,
        silent=bool(rms<1e-6),errors=s['errors']))
# 반복 간 차이
rep={}
for r in res: rep.setdefault(r['id'],[]).append(r)
consistency={k:dict(s_p50_diff=round(abs(v[0]['s_p50']-v[1]['s_p50']),2),max_band_diff_db=round(max(abs(v[0]['octave_db'][b]-v[1]['octave_db'][b]) for b in v[0]['octave_db']),1)) for k,v in rep.items() if len(v)>=2}
json.dump(dict(source=meta['url'],browser=meta['ua'],method='realtime master tap (ScriptProcessor) in headless Chromium',not_measured=['sharpness','roughness','listening test','Safari/iOS'],results=res,repeat_consistency=consistency),open(OUT,'w'),ensure_ascii=False,indent=1)
for r in res: print(f"{r['id']:16} r{r['rep']} I={r['lufs_i']} S50={r['s_p50']} S95={r['s_p95']} Mmax={r['m_max']} burst={r['burst_db']} TP={r['true_peak_dbtp']} cen={r['centroid_hz']}")
print(json.dumps(consistency,ensure_ascii=False))
