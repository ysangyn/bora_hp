#!/usr/bin/env python3
"""보라다방 음원 측정 스크립트 (재현용)
사용: python3 measure_audio.py <저장소 루트> <결과.json>
필요: ffmpeg, ffprobe, numpy
측정: 길이·채널·표본화율·비트레이트(ffprobe), 통합 LUFS·LRA·트루피크(ffmpeg ebur128),
      RMS·샘플 피크·크레스트(직접 계산), 옥타브 대역 에너지(FFT), 좌우 상관, 돌발음 지표, 앞뒤 0.5초 RMS.
미측정: 말소리 유무, 템포·리듬, 루프 이음매의 청감 품질.
"""
import sys, json, subprocess, re, os, glob
import numpy as np
root, outp = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(os.path.join(root,'sound','*.mp3')) + glob.glob(os.path.join(root,'music','*.mp3')))
BANDS=[31.5,63,125,250,500,1000,2000,4000,8000,16000]
def probe(f):
    j=json.loads(subprocess.run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',f],capture_output=True,text=True).stdout)
    s=[x for x in j['streams'] if x['codec_type']=='audio'][0]
    return dict(codec=s['codec_name'],sr=int(s['sample_rate']),ch=int(s['channels']),dur=round(float(j['format']['duration']),2),kbps=round(int(j['format']['bit_rate'])/1000),bytes=int(j['format']['size']))
def ebu(f):
    e=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',f,'-af','ebur128=peak=true','-f','null','-'],capture_output=True,text=True).stderr
    t=e[e.rfind('Summary:'):]
    g=lambda p:(lambda m: float(m.group(1)) if m else None)(re.search(p,t))
    return dict(lufs_i=g(r'I:\s+(-?[\d.]+) LUFS'),lra=g(r'LRA:\s+(-?[\d.]+) LU'),true_peak_dbfs=g(r'Peak:\s+(-?[\d.]+) dBFS'))
def pcm(f,sr,ch):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-f','f32le','-ac',str(ch),'-ar',str(sr),'-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.float32).reshape(-1,ch)
db=lambda x: round(float(20*np.log10(max(x,1e-12))),1)
res=[]
for f in files:
    p=probe(f); x=pcm(f,p['sr'],p['ch']); m=x.mean(axis=1); sr=p['sr']
    rms=float(np.sqrt(np.mean(m**2))); pk=float(np.abs(x).max())
    # 옥타브 대역 에너지 (Welch, 전체 대비 dB)
    n=8192; hop=n//2; w=np.hanning(n); acc=np.zeros(n//2+1); k=0
    for i in range(0,len(m)-n,hop):
        acc+=np.abs(np.fft.rfft(m[i:i+n]*w))**2; k+=1
    acc/=max(k,1); fr=np.fft.rfftfreq(n,1/sr); tot=acc.sum()
    bands={str(b): round(float(10*np.log10(max(acc[(fr>=b/2**.5)&(fr<b*2**.5)].sum()/tot,1e-12))),1) for b in BANDS}
    centroid=round(float((fr*acc).sum()/tot))
    # 돌발음: 50ms 프레임 RMS가 직전 1초 중앙값보다 12dB 넘게 큰 프레임 수
    fl=int(sr*.05); nf=len(m)//fl; fr_rms=np.sqrt((m[:nf*fl].reshape(nf,fl)**2).mean(axis=1))+1e-9; fdb=20*np.log10(fr_rms)
    jumps=0
    for i in range(20,nf):
        if fdb[i]-np.median(fdb[i-20:i])>12: jumps+=1
    p10,p95=np.percentile(fdb,[10,95])
    corr=None
    if p['ch']==2:
        L,R=x[:,0],x[:,1]; d=np.sqrt((L**2).mean()*(R**2).mean()); corr=round(float((L*R).mean()/d),2) if d>0 else None
    h=int(sr*.5)
    res.append(dict(file=os.path.relpath(f,root),**p,**ebu(f),rms_dbfs=db(rms),sample_peak_dbfs=db(pk),crest_db=round(db(pk)-db(rms),1),
        octave_band_db_rel_total=bands,spectral_centroid_hz=centroid,lr_correlation=corr,
        transient_frames_gt12db=jumps,transient_per_min=round(jumps/(p['dur']/60),1),frame_level_p10_db=round(float(p10),1),frame_level_p95_db=round(float(p95),1),
        head_0p5s_rms_dbfs=db(float(np.sqrt((m[:h]**2).mean()))),tail_0p5s_rms_dbfs=db(float(np.sqrt((m[-h:]**2).mean())))))
    print(res[-1]['file'],res[-1]['lufs_i'],file=sys.stderr)
json.dump(dict(tool='ffmpeg ebur128 + numpy',note='말소리·템포·루프 청감은 미측정',files=res),open(outp,'w'),ensure_ascii=False,indent=1)
