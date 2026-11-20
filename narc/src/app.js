// SPDX-License-Identifier: Apache-2.0
import {FixedClock} from '../vendor/vanillajs/modules/time/index.js';
import {createSound2D} from '../vendor/vanillajs/modules/audio2d/index.js';
import {ViceMission} from './world.js';
import {ViceView} from './view.js';
import {registerOffline} from './offline.js';
const $=id=>document.getElementById(id);
const keys=new Set();
// A lost keyup is possible if the player releases a key in another window.
// Browser keydown.repeat is the source of truth: only a new non-repeat press
// can re-arm a canceled control, even after an off-window release.
function cancelHeld(){keys.clear();}
const controls={left:['a','arrowleft'],right:['d','arrowright'],up:['w','arrowup'],down:['s','arrowdown'],
  fire:['f',' ','mouse'],stun:['j'],interact:['e'],dodge:['shift'],reload:['r']};
const pressed=names=>names.some(key=>keys.has(key));
function input(){return {
  moveX:Number(pressed(controls.right))-Number(pressed(controls.left)),
  moveY:Number(pressed(controls.down))-Number(pressed(controls.up)),
  fire:pressed(controls.fire),stun:pressed(controls.stun),interact:pressed(controls.interact),
  dodge:pressed(controls.dodge),reload:pressed(controls.reload)
};}
const sounds=Object.freeze({
  shot:{wave:'square',frequency:380,duration:1800},
  stun:{wave:'triangle',frequency:780,duration:5200},
  rescue:{wave:'triangle',frequency:1175,duration:6200},
  capture:{wave:'triangle',frequency:880,duration:4300},
  impact:{wave:'noise',frequency:590,duration:2200},
  hurt:{wave:'saw',frequency:120,duration:5600},
  down:{wave:'saw',frequency:70,duration:7200},
  switch:{wave:'triangle',frequency:990,duration:6500},
  victory:{wave:'triangle',frequency:1320,duration:6500},
  'enemy-shot':{wave:'square',frequency:210,duration:1800},
  threat:{wave:'saw',frequency:185,duration:3800},
  strike:{wave:'noise',frequency:480,duration:3400},
  reload:{wave:'triangle',frequency:260,duration:2500},
  dodge:{wave:'noise',frequency:670,duration:1900},
  lost:{wave:'saw',frequency:100,duration:6800}
});
function wavCue(recipe){
  const frames=Math.max(8000,recipe.duration+1);
  const sound=createSound2D({frames,events:[{id:1,sample:0,duration:recipe.duration,
    channel:0,wave:recipe.wave,frequency:recipe.frequency,gain:3500,seed:7}]});
  return sound.wav();
}
/** Original two-second, sample-indexed, three-layer score. No streaming or web fetch. */
export function createViceScore(){
  const events=[],notes=[110,146,130,174];
  let id=1;
  for(let i=0;i<4;i++){
    events.push({id:id++,sample:i*24000,duration:9500,channel:0,
      wave:'triangle',frequency:notes[i],gain:2400,seed:11});
  }
  for(let i=0;i<8;i++){
    events.push({id:id++,sample:i*12000,duration:1700,channel:1,
      wave:'noise',frequency:390,gain:i%2?650:1250,seed:99+i});
    events.push({id:id++,sample:i*12000+3000,duration:5200,channel:2,
      wave:'triangle',frequency:[440,523,392,587][i%4],gain:750,seed:1});
  }
  return createSound2D({frames:96000,events});
}
export class ViceAudio{
  constructor(){this.context=null;this.buffers=new Map();this.muted=false;
    this.musicOn=true;this.musicSource=null;this.last=-1;this.lastBeat=-1;}
  // Simulation ticks restart at zero; decoded PCM buffers remain reusable.
  resetCursor(){
    this.last=-1;this.lastBeat=-1;
    try{this.musicSource?.stop?.();}catch{}
    this.musicSource=null;
  }
  setMusic(value){
    this.musicOn=Boolean(value);
    if(!this.musicOn){
      try{this.musicSource?.stop?.();}catch{}
      this.musicSource=null;
    }
  }
  async unlock(){
    if(this.context){await this.context.resume();return;}
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    const context=new C();this.context=context;
    try{
      for(const [name,recipe]of Object.entries(sounds)){
        const bytes=wavCue(recipe);
        const buffer=await context.decodeAudioData(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
        this.buffers.set(name,buffer);
      }
      const score=createViceScore().wav();
      this.buffers.set('score',await context.decodeAudioData(score.buffer.slice(
        score.byteOffset,score.byteOffset+score.byteLength)));
      await context.resume();
    }catch{this.dispose();}
  }
  play(events,tick){
    // Advance cursor even while audio is muted, disabled, or still decoding.
    // Otherwise unmuting would replay stale combat cues.
    const fresh=events.filter(e=>e.tick>this.last&&e.tick<=tick);
    this.last=Math.max(this.last,...events.map(e=>e.tick),0);
    if(!this.context||this.context.state!=='running'||this.muted)return;
    for(const e of fresh){
      const buffer=this.buffers.get(e.type);if(!buffer)continue;
      const source=this.context.createBufferSource(),gain=this.context.createGain();
      source.buffer=buffer;gain.gain.value=.23;
      source.connect(gain).connect(this.context.destination);source.start();
    }
    // One bounded two-second voice, scheduled from logical ticks, not rAF time.
    if(this.musicOn&&(tick===1||tick%120===0)&&tick!==this.lastBeat){
      this.lastBeat=tick;
      const buffer=this.buffers.get('score');
      if(buffer){
        const source=this.context.createBufferSource(),gain=this.context.createGain();
        source.buffer=buffer;gain.gain.value=.17;
        source.connect(gain).connect(this.context.destination);
        source.start();this.musicSource=source;
      }
    }
  }
  pause(){void this.context?.suspend().catch(()=>{});}
  dispose(){
    this.resetCursor();
    if(this.context)void this.context.close().catch(()=>{});
    this.context=null;this.buffers.clear();
  }
}
export function startGame(){
  const world=new ViceMission(),view=new ViceView($('game')),audio=new ViceAudio();
  const clock=new FixedClock({step:1/60,maxFrame:.1,maxSteps:6});
  clock.setPaused(true);let state=world.snapshot(),lastTime=null,frameCount=0;
  document.documentElement.dataset.ready='true';
  function readout(){
    $('health').textContent=state.player.hp+' / 100';
    $('ammo').textContent=state.player.ammo+' / '+state.player.reserve;
    $('score').textContent=String(state.score);
    $('timer').textContent=String(Math.floor(state.remaining/60))+':'+String(state.remaining%60).padStart(2,'0');
    $('captured').textContent=String(state.counters.captures);
    $('rescued').textContent=state.civilian.state==='rescued'?'SAFE':state.civilian.state==='lost'?'LOST':'AWAITING';
    $('relay').textContent=state.switch.disabled?'OFFLINE':'ACTIVE';
    $('boss').textContent=state.exitOpen?'DEFEATED':'AT LARGE';
    $('mission-status').textContent=state.phase==='playing'?'MISSION LIVE':state.phase.toUpperCase();
    $('weapon-status').textContent=state.player.reload>0?'RELOADING '+(state.player.reload/60).toFixed(1)+'s':
      state.player.ammo===0?'EMPTY · R':state.player.cooldown>0?'RECOVERING':'READY';
    $('stun-status').textContent=state.player.stunCooldown>0?
      (state.player.stunCooldown/60).toFixed(1)+'s':'READY';
    const boss=state.enemies.find(e=>e.kind==='boss');
    $('boss').textContent=state.exitOpen?'DEFEATED':'ACTIVE '+Math.ceil(boss.hp/boss.maxHp*100)+'%';
    const event=state.events.at(-1);
    $('notice').textContent=event&&state.tick-event.tick<50&&event.type!=='shot'?
      event.type.replaceAll('-',' ').toUpperCase():'RESPOND · RESCUE · CONTAIN';
  }
  function panel(message='',reveal=true){
    $('panel').hidden=!reveal;
    if(reveal){
      $('panel-title').textContent=state.phase==='victory'?'DISTRICT SECURED':
        state.phase==='defeat'?'MISSION FAILED':state.phase==='paused'?'MISSION PAUSED':'CIRCUIT VICE';
      $('panel-message').textContent=message||(state.phase==='victory'?
        'Final score '+state.score+' · '+state.counters.captures+' arrests · '+
        state.counters.rescues+' rescues · '+state.counters.eliminations+' eliminations':
        state.phase==='defeat'?(state.endReason??'Response terminated')+
          ' · Score '+state.score+' · '+state.counters.captures+' arrests':
        'The grid is live. Rescue the operator, disable the relay and stop the sentinel.');
      $('start').textContent=state.phase==='paused'?'RESUME MISSION':'DEPLOY / PLAY';
      $('start').hidden=['defeat','victory'].includes(state.phase);
      $('restart').hidden=state.phase==='ready';
    }
  }
  function pause(reason='Mission paused.'){
    if(state.phase!=='playing')return;
    state=world.pause();clock.setPaused(true);cancelHeld();lastTime=null;audio.pause();panel(reason);readout();
  }
  function begin(){
    if(state.phase==='defeat'||state.phase==='victory')return;
    cancelHeld();state=world.start();clock.setPaused(false);lastTime=null;
    panel('',false);void audio.unlock().catch(()=>{});$('game').focus({preventScroll:true});readout();
  }
  function reset(){
    cancelHeld();clock.reset();lastTime=null;audio.pause();audio.resetCursor();
    state=world.reset();clock.setPaused(true);panel();readout();$('start').focus();
  }
  const onKeyDown=e=>{
    const key=e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(key))e.preventDefault();
    if((key==='escape'||key==='p')&&!e.repeat){
      e.preventDefault();if(state.phase==='playing')pause();
      else if(state.phase==='paused')begin();return;
    }
    if(key==='m'&&!e.repeat){audio.muted=!audio.muted;$('sound').textContent=audio.muted?'SOUND OFF':'SOUND ON';}
    if(key==='n'&&!e.repeat){audio.setMusic(!audio.musicOn);$('music').textContent=audio.musicOn?'MUSIC ON':'MUSIC OFF';}
    // Focus loss clears held state. Ignore repeats, but accept any fresh
    // non-repeat keydown: its preceding keyup might have occurred off-window.
    if(state.phase==='playing'&&!e.repeat&&
       !(e.ctrlKey||e.altKey||e.metaKey))keys.add(key);
  };
  const onKeyUp=e=>keys.delete(e.key.toLowerCase());
  window.addEventListener('keydown',onKeyDown);
  window.addEventListener('keyup',onKeyUp);
  window.addEventListener('blur',()=>pause('Focus lost — mission safely paused.'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Tab hidden — mission safely paused.');});
  $('game').addEventListener('pointerdown',e=>{if(state.phase==='playing'&&e.button===0){keys.add('mouse');}});
  window.addEventListener('pointerup',()=>keys.delete('mouse'));
  $('start').addEventListener('click',begin);
  $('restart').addEventListener('click',reset);
  $('sound').addEventListener('click',()=>{audio.muted=!audio.muted;$('sound').textContent=audio.muted?'SOUND OFF':'SOUND ON';});
  $('music').addEventListener('click',()=>{audio.setMusic(!audio.musicOn);
    $('music').textContent=audio.musicOn?'MUSIC ON':'MUSIC OFF';});
  let rendering=true,frameGeneration=0;
  const scheduleFrame=()=>{const generation=frameGeneration;
    requestAnimationFrame(now=>frame(now,generation));};
  window.addEventListener('pagehide',event=>{
    pause('Page suspended — resume when ready.');
    cancelHeld();rendering=false;frameGeneration++;lastTime=null;
    // A bfcache document keeps its decoded sounds and can be resumed.
    if(!event.persisted)audio.dispose();
  });
  window.addEventListener('pageshow',event=>{
    if(!event.persisted||rendering)return;
    rendering=true;frameGeneration++;lastTime=null;
    panel(state.phase==='paused'?'Page restored — press Resume.':'',true);
    readout();scheduleFrame();
  });
  function frame(now,generation){
    if(!rendering||generation!==frameGeneration)return;
    const elapsed=lastTime===null?0:Math.max(0,(now-lastTime)/1000);lastTime=now;
    if(state.phase==='playing'){
      clock.advance(elapsed,()=>{state=world.step(input());audio.play(state.events,state.tick);});
      if(state.phase!=='playing'){
        clock.setPaused(true);cancelHeld();audio.pause();panel();lastTime=null;
      }
    }
    view.draw(state);if(frameCount++%6===0||state.phase!=='playing')readout();
    scheduleFrame();
  }
  panel();readout();scheduleFrame();
  const inspector=()=>structuredClone({state,graphics:view.lastFrame,clock:{ticks:clock.ticks},
    audio:{enabled:audio.context!==null,muted:audio.muted,musicOn:audio.musicOn}});
  Object.defineProperty(window,'circuitVice',{value:Object.freeze({inspect:inspector}),configurable:false});
  void registerOffline({onStatus:status=>{$('offline').textContent=status.message;}}).catch(()=>{});
}
