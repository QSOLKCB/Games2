// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {StrikeAudio,createSunrelayScore,createStrikeEffects} from '../src/audio.js';

const digest=pcm=>createHash('sha256').update(new Uint8Array(pcm.buffer,pcm.byteOffset,pcm.byteLength)).digest('hex');
const shot=(weapon='lancet')=>({type:'shot',source:'player',weapon});

// A device stub only: the actual vendored synthesis, sequencing, voice limits,
// effect deduplication and cleanup implementations run unmodified in these tests.
class AudioDevice{
  state='suspended';currentTime=0;destination={};sources=[];resumes=[];defer=false;rejectResume=false;
  createBuffer(channels,frames,rate){
    assert.equal(channels,1);assert.equal(rate,48000);
    const data=new Float32Array(frames);return {getChannelData(index){assert.equal(index,0);return data;}};
  }
  createBufferSource(){
    const source={buffer:null,loop:false,onended:null,started:false,stopped:false,disconnected:false,
      connect(){},disconnect(){this.disconnected=true;},
      start(when,offset){assert.ok(Number.isFinite(when)&&Number.isFinite(offset));this.started=true;},
      stop(){this.stopped=true;}};
    this.sources.push(source);return source;
  }
  createGain(){return {gain:{value:1},connect(){},disconnect(){}};}
  createStereoPanner(){return {pan:{value:0},connect(){},disconnect(){}};}
  resume(){
    if(this.rejectResume)return Promise.reject(new Error('device resume denied'));
    if(this.defer)return new Promise((resolve,reject)=>this.resumes.push({resolve,reject}));
    this.state='running';return Promise.resolve();
  }
  finishResume(){this.state='running';this.resumes.shift().resolve();}
  async suspend(){this.state='suspended';}
  async close(){this.state='closed';}
  get active(){return this.sources.filter(s=>s.started&&!s.stopped&&!s.disconnected).length;}
}

test('original six-bar score and weapon cues produce deterministic bounded non-silent PCM',()=>{
  const first=createSunrelayScore(),second=createSunrelayScore(),phrases=new Set();
  assert.equal(first.phraseCount,6);assert.equal(first.loopTicks,900);assert.equal(first.frames,15*48000);
  for(let bar=0;bar<6;bar++){
    const pcm=first.renderPhrase(bar);
    assert.equal(pcm.length,120000);assert.deepEqual(pcm,second.renderPhrase(bar));
    assert.ok(pcm.some(x=>x!==0));assert.ok(pcm.every(x=>Number.isFinite(x)&&Math.abs(x)<5000));
    phrases.add(digest(pcm));
  }
  assert.equal(phrases.size,6,'all six bars have distinct original note patterns');
  assert.deepEqual(first.renderRange(119200,1600),new Int16Array([
    ...first.renderPhrase(0).subarray(119200),...first.renderPhrase(1).subarray(0,800)
  ]),'phrase boundary is sample-continuous, with no dropped or repeated frames');
  assert.deepEqual(first.position(900),first.position(0),'music loops at a simulation tick boundary');
  const effects=createStrikeEffects(),again=createStrikeEffects();
  for(const [name,effect] of Object.entries(effects)){
    const pcm=effect.renderAll();assert.deepEqual(pcm,again[name].renderAll());
    assert.ok(pcm.length>0&&pcm.length<=19200,name);
    assert.ok(pcm.some(x=>x!==0),name);
    assert.ok(pcm.every(x=>Number.isFinite(x)&&Math.abs(x)<12000),'unclipped effect '+name);
  }
  assert.equal(new Set(['lancet','rivet','comet'].map(id=>digest(effects[id].renderAll()))).size,3);
});

test('audio is opt-in; music and effects toggle independently and mute stops every voice',async()=>{
  const device=new AudioDevice();let created=0;
  const sound=new StrikeAudio({contextFactory:()=>{created++;return device;}});
  try{
    sound.updateTick(0);sound.playEvents([shot()],0);assert.equal(created,0);assert.equal(device.active,0);
    assert.equal(await sound.enable(),true);assert.equal(created,1);assert.ok(sound.snapshot().musicVoices>0);
    sound.setMusic(false);assert.equal(sound.snapshot().musicVoices,0);
    sound.playEvents([shot()],1);assert.equal(sound.snapshot().voices,1);
    sound.setEffects(false);assert.equal(sound.snapshot().voices,0);
    sound.playEvents([shot()],2);assert.equal(sound.snapshot().voices,0);
    sound.setMusic(true);sound.updateTick(3);assert.ok(sound.snapshot().musicVoices>0);
    sound.setEffects(true);sound.playEvents([shot('rivet')],3);assert.equal(sound.snapshot().voices,1);
    sound.setMuted(true);assert.equal(device.active,0);
    sound.updateTick(4);sound.playEvents([shot()],4);assert.equal(device.active,0);
    sound.setMuted(false);sound.updateTick(5);assert.ok(sound.snapshot().musicVoices>0);
    sound.playEvents([shot()],5);assert.equal(sound.snapshot().voices,1);
  }finally{await sound.dispose();}
  assert.equal(device.active,0);assert.equal(device.state,'closed');
});

test('actual engine enforces sixteen effect voices, cue deduplication and immediate pause cleanup',async()=>{
  const device=new AudioDevice(),sound=new StrikeAudio({contextFactory:()=>device});
  sound.setMusic(false);
  try{
    await sound.enable();
    const events=Array.from({length:240},(_,i)=>shot(['lancet','rivet','comet'][i%3]));
    sound.playEvents(events,1);assert.equal(sound.snapshot().voices,3,'repeated cues within a tick are coalesced');
    const started=device.sources.length;sound.playEvents([shot()],1);assert.equal(device.sources.length,started,'same snapshot cannot sound twice');
    for(let tick=2;tick<=40;tick++){
      sound.playEvents(events,tick);assert.ok(sound.snapshot().voices<=16);assert.ok(device.active<=16);
    }
    assert.equal(sound.snapshot().voices,16,'exercise the actual eviction boundary');
    await sound.suspend();assert.equal(device.active,0);assert.equal(sound.snapshot().voices,0);
    sound.playEvents([shot()],41);assert.equal(device.active,0,'paused simulation events are silent');
    sound.updateTick(0);await sound.resume();sound.playEvents([shot()],1);
    assert.equal(sound.snapshot().voices,1,'new match first shot survives tick reset');
    await sound.suspend();sound.updateTick(0);await sound.resume();sound.playEvents([shot()],1);
    assert.equal(sound.snapshot().voices,1,'restart at the same previous event tick must not suppress the first shot');
  }finally{await sound.dispose();}
});

test('pending gesture enable cannot create voices after pause, and may resume later',async()=>{
  const device=new AudioDevice();device.defer=true;
  const sound=new StrikeAudio({contextFactory:()=>device});
  try{
    const pending=sound.enable();assert.equal(device.resumes.length,1);
    await sound.suspend();device.finishResume();assert.equal(await pending,false);
    assert.equal(device.state,'suspended');assert.equal(device.active,0);assert.equal(sound.snapshot().paused,true);
    device.defer=false;assert.equal(await sound.resume(),true);assert.ok(sound.snapshot().musicVoices>0);
    await sound.suspend();assert.equal(device.active,0);
  }finally{await sound.dispose();}
});

test('failed resume is silent, invalid ticks are rejected and disposal is final',async()=>{
  const device=new AudioDevice();device.rejectResume=true;
  const sound=new StrikeAudio({contextFactory:()=>device});
  await assert.rejects(sound.enable(),/resume denied/);assert.equal(sound.snapshot().paused,true);assert.equal(device.active,0);
  for(const tick of [-1,.5,NaN,Infinity]){
    assert.throws(()=>sound.updateTick(tick),/nonnegative simulation tick/);
    assert.throws(()=>sound.playEvents([shot()],tick),/nonnegative simulation tick/);
  }
  await sound.dispose();await sound.dispose();assert.equal(device.active,0);
  await assert.rejects(sound.enable(),/disposed/);await assert.rejects(sound.resume(),/disposed/);
});
