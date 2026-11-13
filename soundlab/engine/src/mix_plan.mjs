/**
 * BORA deterministic mix-planning kernel v0.1 (research prototype).
 * No DOM, side effects, network, randomness, health claims or DSP safety guarantees.
 * This calculates a preliminary plan; the renderer must enforce its own calibrated
 * limiter, measure the final waveform, and document perceptual tests.
 */
const MODE = new Set(['sleep','focus','rest','free','stimulus']);
const DEVICE = new Set(['phone','headphones','desk','subwoofer']);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
export const ENGINE_VERSION='0.1.0';

function incompatible(a,b,mode){
  // Product goals may conflict even when spectra do not.
  const goalA=new Set(a.goals??[]),goalB=new Set(b.goals??[]);
  if((goalA.has('sleep')&&goalB.has('energy'))||(goalB.has('sleep')&&goalA.has('energy'))) return 'sleep_energy';
  if(mode==='sleep'&&(a.category==='event'||b.category==='event'||a.speech_present||b.speech_present))return 'sleep_distraction';
  if(mode==='focus'&&(a.speech_present||b.speech_present))return 'focus_speech';
  // For simultaneously rhythmic foregrounds, do not sum distinct metronomes.
  if(a.category==='music'&&b.category==='music'&&finite(a.tempo_bpm)&&finite(b.tempo_bpm)&&Math.abs(a.tempo_bpm-b.tempo_bpm)>3)return 'conflicting_tempo';
  return null;
}
function modeWarnings(item,device,mode){
  const w=[];
  if(item.binaural&&device!=='headphones')w.push({id:'BINAURAL_REQUIRES_HEADPHONES',item:item.id,level:'warning'});
  if(device==='phone'&&item.low_bass_reliance)w.push({id:'BASS_REPRODUCTION_UNCERTAIN',item:item.id,level:'warning'});
  if(mode==='sleep'&&item.transient_risk==='high')w.push({id:'TRANSIENT_SLEEP_RISK',item:item.id,level:'warning'});
  if(item.category==='external')w.push({id:'EXTERNAL_SOURCE_NOT_ON_AUDIO_BUS',item:item.id,level:'error'});
  if(item.measurement_status!=='measured')w.push({id:'UNMEASURED_SOURCE',item:item.id,level:'warning'});
  return w;
}
/**
 * @param {{catalog:Array<object>,selected:string[],purpose:string,device:string,userLevelsDb?:Record<string,number>,preference?:'prefer_sequence'|'prefer_mix'}} x
 * @returns {object} A deterministic plan; NOT a validated output signal.
 */
export function planMix(x){
  if(!x||!Array.isArray(x.catalog)||!Array.isArray(x.selected))throw Error('catalog and selected required');
  const purpose=x.purpose??'rest',device=x.device??'headphones';
  if(!MODE.has(purpose)||!DEVICE.has(device))throw Error('invalid purpose/device');
  if(x.selected.length<1||x.selected.length>3||new Set(x.selected).size!==x.selected.length)throw Error('select 1 to 3 distinct ids');
  const map=new Map(x.catalog.map(a=>[a.id,a]));
  const src=x.selected.map(id=>{if(!map.has(id))throw Error(`unknown source ${id}`);return map.get(id)});
  const warnings=src.flatMap(a=>modeWarnings(a,device,purpose));
  let sequenceReason=null;
  if(src.filter(a=>a.binaural).length>1)sequenceReason='multiple_binaural';
  for(let i=0;i<src.length;i++)for(let j=i+1;j<src.length;j++)sequenceReason??=incompatible(src[i],src[j],purpose);
  if(src.some(a=>a.category==='external'))sequenceReason??='external_bus_not_controllable';
  const strategy=sequenceReason?'sequential':'simultaneous';
  // Use log gain units but DO NOT claim perceived ratios. Conservative non-calibrated pilot values.
  // Allow the user to request -60..0 dB attenuation, never amplification.
  const levels=x.userLevelsDb??{};
  const perSource=src.map(a=>{
    let userGainDb=finite(levels[a.id])?clamp(levels[a.id],-60,0):0;
    const tentativeHeadroomDb=strategy==='simultaneous'?-3*Math.max(0,src.length-1):0;
    const roleCorrectionDb=a.category==='event'?-9:a.category==='speech'?-4:0;
    const safetyDisabled=(a.binaural&&device!=='headphones')||a.category==='external';
    return {id:a.id,kind:a.category,gain_db:clamp(userGainDb+tentativeHeadroomDb+roleCorrectionDb,-80,0),enabled:!safetyDisabled,
      reason:safetyDisabled?'device_or_bus_limit':'heuristic_gain_no_calibrated_target',
      binaural:a.binaural?{...a.binaural}:null};
  });
  if(perSource.some(a=>!a.enabled))warnings.push({id:'SOME_SOURCES_DISABLED',level:'warning'});
  let stages=strategy==='simultaneous'?[{items:perSource}]:perSource.map(a=>({items:[a]}));
  return {engine_version:ENGINE_VERSION,purpose,device,strategy,sequence_reason:sequenceReason,
    stages,warnings,verified:{metadata_invariants_only:true,physical_audio_tests:false,perceptual_tests:false,health_effects:false},
    required_renderer_checks:['measure_complete_mix_peak','check_transients','check_loop_click','check_channel_separation','measure_device_output_before_claims']};
}
