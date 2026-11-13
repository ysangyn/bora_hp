"""Render two representative preliminary mixes from existing v0.4 MP3 for engineering inspection.
NOT proof of any physiological effect; does NOT implement a calibrated device limiter.
Usage: python tests/render_check.py --audio-dir /path/to/v04/audio
"""
from __future__ import annotations
import argparse, csv, json, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

ROOT=Path(__file__).resolve().parents[1]
SR=32000

def decode(path,secs=12,offset=3):
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-ss',str(offset),'-i',str(path),'-t',str(secs),'-f','f32le','-ar',str(SR),'-ac','2','pipe:1']
    raw=subprocess.check_output(cmd)
    data=np.frombuffer(raw,dtype='<f4').copy().reshape(-1,2)
    n=int(SR*secs)
    if len(data)<n: data=np.pad(data,((0,n-len(data)),(0,0)))
    return data[:n]

def fade(x,seconds=.3):
    n=min(round(SR*seconds),len(x)//4)
    y=x.copy()
    if n>0:
        y[:n]*=np.linspace(0,1,n,dtype=np.float32)[:,None]
        y[-n:]*=np.linspace(1,0,n,dtype=np.float32)[:,None]
    return y

def measures(x):
    peak=float(np.max(np.abs(x)))
    rms=float(np.sqrt(np.mean(x*x)))
    xp=resample_poly(x,4,1,axis=0)
    approx_true_peak=float(np.max(np.abs(xp)))
    todb=lambda a:(20*np.log10(max(a,1e-12)))
    return {'sample_peak_dbfs':round(todb(peak),2),'true_peak_4x_approx_dbtp':round(todb(approx_true_peak),2),'rms_dbfs':round(todb(rms),2),
            'clipped_samples':int(np.count_nonzero(np.abs(x)>=1.0)),'clip_count':len(x),'test_basis':'decoded MP3 sections only; 4x resampling is not certified BS.1770 true-peak'}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--audio-dir',required=True)
    args=parser.parse_args()
    d=Path(args.audio_dir)
    out=ROOT/'demo';out.mkdir(parents=True,exist_ok=True)
    cases=[
      ('rest_simultaneous',['calm_balance','nature_recovery','head_reset'],'simultaneous'),
      ('binaural_sequential',['body_relax','mind_focus'],'sequential'),
    ]
    stats={}
    for key,names,strategy in cases:
        decoded=[decode(d/f'{name}.mp3') for name in names]
        if strategy=='simultaneous':
            x=np.zeros_like(decoded[0]);
            for a in decoded:x+=a*(10**((-6*max(0,len(decoded)-1))/20))
        else:
            x=np.concatenate([fade(a) for a in decoded],axis=0)
        stat=measures(x); stats[key]={'inputs':names,'strategy':strategy,**stat}
        if stat['clipped_samples']>0:raise RuntimeError(f'{key} clipping detected: {stat}')
        sf.write(out/f'{key}.wav',x,SR,subtype='PCM_24')
    (ROOT/'reports'/'render_test.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2))
    for k,v in stats.items():print(k,v)
if __name__=='__main__':main()
