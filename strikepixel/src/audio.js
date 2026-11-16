// SPDX-License-Identifier: Apache-2.0
// Original SUNRELAY score and effects, synthesized by the pinned engine.
// Audio device time never changes simulation. No context exists before enable().
import {createSound2D,AUDIO2D_RATE} from '../vendor/vanillajs/modules/audio2d/index.js';
import {createSoundtrack} from '../vendor/vanillajs/modules/soundtrack/index.js';
import {createSoundtrackPlayer,createEffectPlayer} from '../vendor/vanillajs/api/audio/index.js';

export function createSunrelayScore(){
  // Six bars at 96 BPM. Each 2.5-second bar is exactly 150 simulation ticks.
  // The small integer gains leave the foreground effects clearly audible.
  const roots=[147,175,196,165,147,131],melody=[[294,440,392,330],[349,440,523,440],
    [392,494,440,330],[330,392,440,392],[294,349,440,330],[262,330,392,294]];
  const phrases=roots.map((root,bar)=>{
    const events=[];let id=1;
    for(let beat=0;beat<4;beat++){
      events.push({id:id++,sample:beat*30000,duration:25000,channel:0,wave:'triangle',frequency:root,gain:1250,seed:0});
      events.push({id:id++,sample:beat*30000+7500,duration:19000,channel:1,wave:'triangle',frequency:melody[bar][beat],gain:700,seed:0});
      events.push({id:id++,sample:beat*30000,duration:1800,channel:2,wave:'noise',frequency:80,gain:320,seed:71+bar});
      events.push({id:id++,sample:beat*30000+15000,duration:900,channel:2,wave:'noise',frequency:120,gain:150,seed:19+bar});
    }
    return {frames:120000,events};
  });
  return createSoundtrack({phrases,tickRate:60});
}
export function createStrikeEffects(){
  const make=(frames,notes)=>createSound2D({frames,events:notes.map((n,i)=>({id:i+1,sample:n.sample??0,
    duration:n.duration??frames,channel:n.channel??i,wave:n.wave??'triangle',frequency:n.frequency??220,gain:n.gain??4000,seed:n.seed??41}))});
  return {
    lancet:make(4800,[{wave:'noise',gain:6500,duration:2200},{frequency:660,gain:4300,duration:3400}]),
    rivet:make(2400,[{wave:'noise',gain:4300,duration:1600},{wave:'square',frequency:185,gain:2300,duration:2100}]),
    comet:make(14400,[{wave:'saw',frequency:76,gain:4200},{wave:'noise',gain:2700,duration:10000}]),
    impact:make(2400,[{wave:'triangle',frequency:1200,gain:2500},{wave:'noise',gain:1800,duration:900}]),
    damage:make(7200,[{wave:'noise',gain:3300},{wave:'triangle',frequency:104,gain:3200}]),
    explosion:make(19200,[{wave:'noise',gain:6200},{wave:'triangle',frequency:55,gain:4600}]),
    elimination:make(13200,[{frequency:440,duration:4400,channel:0},{sample:4400,frequency:587,duration:4400,channel:0},{sample:8800,frequency:880,duration:4400,channel:0}]),
    reload:make(6000,[{wave:'noise',gain:1600,duration:1100,channel:0},{sample:4000,wave:'noise',gain:2200,duration:1200,channel:0}]),
    pickup:make(12000,[{frequency:523,gain:3100,duration:4000,channel:0},{sample:4000,frequency:659,gain:3100,duration:4000,channel:0},{sample:8000,frequency:784,gain:3100,duration:4000,channel:0}]),
    empty:make(1600,[{wave:'noise',gain:1400,duration:800}])
  };
}

export class StrikeAudio{
  constructor({contextFactory}={}){
    this.contextFactory=contextFactory??(()=>{
      const Context=globalThis.AudioContext??globalThis.webkitAudioContext;
      if(!Context)throw new Error('Web Audio is unavailable; the match remains playable without sound.');
      return new Context();
    });
    this.track=createSunrelayScore();this.scores=createStrikeEffects();this.context=null;this.musicPlayer=null;this.effectsPlayer=null;
    this.muted=false;this.music=true;this.effects=true;this.paused=true;this.disposed=false;this.generation=0;
    this.tick=0;this.eventTick=-1;this.playerId='player';
  }
  async enable(){
    if(this.disposed)throw new Error('Audio disposed');
    if(!this.context){
      const context=this.contextFactory();
      try{
        this.musicPlayer=createSoundtrackPlayer(context,this.track);
        this.effectsPlayer=createEffectPlayer(context,{maxVoices:16,maxBuffers:16});
        this.context=context;
      }catch(error){this.musicPlayer?.dispose();this.effectsPlayer?.dispose();context.close?.();throw error;}
    }
    return this.resume();
  }
  async resume(){
    if(this.disposed)throw new Error('Audio disposed');
    if(!this.context)return false;
    this.paused=false;const generation=++this.generation;
    try{await this.context.resume();}
    catch(error){if(generation===this.generation){this.paused=true;this.stop();}throw error;}
    if(this.disposed||this.paused){
      this.stop();if(this.context.state==='running')await this.context.suspend().catch(()=>{});return false;
    }
    if(generation!==this.generation)return false;
    this.updateTick(this.tick);return this.context.state==='running';
  }
  stop(){this.musicPlayer?.stop();this.effectsPlayer?.stopAll();}
  suspend(){
    ++this.generation;this.paused=true;this.eventTick=-1;this.stop();
    return this.context?.state==='running'?this.context.suspend().catch(()=>false):Promise.resolve(false);
  }
  setMuted(value){this.muted=!!value;if(this.muted)this.stop();}
  setMusic(value){this.music=!!value;if(!this.music)this.musicPlayer?.stop();}
  setEffects(value){this.effects=!!value;if(!this.effects)this.effectsPlayer?.stopAll();}
  updateTick(tick){
    if(!Number.isSafeInteger(tick)||tick<0)throw new RangeError('Audio requires a nonnegative simulation tick');
    this.tick=tick;if(this.disposed||!this.musicPlayer)return;
    this.musicPlayer.sync(tick,!this.paused&&!this.muted&&this.music);
  }
  playEvents(events,tick,playerId='player'){
    if(!Number.isSafeInteger(tick)||tick<0)throw new RangeError('Audio requires a nonnegative simulation tick');
    if(tick===this.eventTick)return;
    this.eventTick=tick;this.playerId=playerId;
    if(this.disposed||this.paused||this.muted||!this.effects||this.context?.state!=='running')return;
    // One tick may report many pellet/impact events. Dedup cue categories and
    // cap admissions; the engine separately enforces sixteen concurrent voices.
    const heard=new Set();let budget=12;
    for(const event of (events??[]).slice(0,256)){
      let cue=null,gain=1;
      if(event.type==='shot'){cue=event.weapon;gain=event.source===playerId ? .8 : .25;}
      else if(event.type==='damage'){
        cue=event.target===playerId?'damage':event.source===playerId?'impact':null;
      }else if(event.type==='explosion'){cue='explosion';gain=event.source===playerId ? .8 : .4;}
      else if(event.type==='elimination'&&event.source===playerId)cue='elimination';
      else if(event.type==='pickup'&&event.actor===playerId)cue='pickup';
      else if(['reload-start','reload-complete','reload'].includes(event.type)&&event.actor===playerId)cue='reload';
      else if(['empty','dry-fire'].includes(event.type)&&event.actor===playerId)cue='empty';
      if(!cue||!this.scores[cue]||heard.has(cue)||budget===0)continue;
      heard.add(cue);budget--;this.effectsPlayer.play(this.scores[cue],{gain});
    }
  }
  snapshot(){return {enabled:!!this.context,paused:this.paused,muted:this.muted,music:this.music,effects:this.effects,
    state:this.context?.state??'disabled',sampleRate:AUDIO2D_RATE,loopTicks:this.track.loopTicks,
    voices:this.effectsPlayer?.snapshot().voices??0,musicVoices:this.musicPlayer?.snapshot().voices??0};}
  async dispose(){
    if(this.disposed)return;++this.generation;this.disposed=true;this.paused=true;
    this.musicPlayer?.dispose();this.effectsPlayer?.dispose();
    if(this.context&&this.context.state!=='closed')await this.context.close().catch(()=>{});
  }
}
