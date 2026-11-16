// SPDX-License-Identifier: Apache-2.0
import {StrikeMatch,ARENA,WEAPON_NAMES} from './world.js';
import {ArenaRenderer} from './render.js';
import {StrikeAudio} from './audio.js';
import {registerOffline} from './offline.js';
import {findCabinet} from './cabinet.js';
import {SETTINGS_KEY,DEFAULT_SETTINGS,parseSettings,validateSettings} from './settings.js';
import {Actions,attachKeyboard,attachMouseLook,fpsBindings,FlightGamepad} from '../vendor/vanillajs/modules/input/index.js';
import {FixedClock} from '../vendor/vanillajs/modules/time/index.js';

export async function startGame(){
  const $=id=>document.getElementById(id),canvas=$('game');
  let settings={...DEFAULT_SETTINGS},storageAvailable=true;
  let saved=null;
  try{saved=localStorage.getItem(SETTINGS_KEY);}
  catch{storageAvailable=false;$('settings-status').textContent='Saved settings were unavailable. Safe defaults are in use.';}
  if(saved)try{settings=parseSettings(saved);}catch{$('settings-status').textContent='Saved settings were invalid. Safe defaults are in use.';}
  function showSettings(){
    $('match-length').value=settings.match;$('difficulty').value=settings.difficulty;
    $('music').checked=settings.music;$('effects').checked=settings.effects;$('invert-y').checked=settings.invertY;
    $('sensitivity').value=settings.sensitivity;$('sensitivity-value').textContent=settings.sensitivity.toFixed(1)+'×';
  }
  showSettings();
  const options=()=>({difficulty:settings.difficulty,scoreLimit:settings.match==='quick'?3:8,durationTicks:settings.match==='quick'?7200:10800});
  let match=new StrikeMatch(options()),state=match.snapshot(),weapon=0,yaw=state.player.yaw,pitch=state.player.pitch;
  let previousTime=null,stopped=false,contextLost=false,hitUntil=0,hurtUntil=0,noticeUntil=0;
  const actions=new Actions(),pad=new FlightGamepad(),padButtons=new Set();
  const clock=new FixedClock({step:1/60,maxFrame:.1,maxSteps:6});clock.setPaused(true);
  const audio=new StrikeAudio();audio.setMusic(settings.music);audio.setEffects(settings.effects);
  const counters={shots:0,hits:0,botShots:0,playerDeaths:0,respawns:0,explosions:0};
  const log=[];
  const keyboard=attachKeyboard(window,actions,{bindings:fpsBindings,enabled:()=>state.phase==='playing'});
  const mouse=attachMouseLook(canvas,{enabled:()=>state.phase==='playing',
    onUnlock:()=>pause('Mouse released. Resume when ready.'),
    onError:()=>notice('Mouse capture unavailable. Drag to look; F fires.',240)});
  const renderer=new ArenaRenderer(canvas,ARENA,{
    onContextLost:()=>{contextLost=true;pause('Graphics paused. Waiting for the browser to restore the arena.');$('start').disabled=true;},
    onContextRestored:()=>{contextLost=false;$('start').disabled=false;$('boot-message').textContent='Graphics restored. Resume when ready.';}
  });
  function cancelInput(){keyboard.clear();mouse.release();pad.reset();padButtons.clear();previousTime=null;}
  function notice(text,duration=120){$('combat-notice').textContent=text;noticeUntil=state.tick+duration;}
  function addLog(text){log.unshift(text);log.splice(3);$('feed').replaceChildren(...log.map(text=>{const p=document.createElement('p');p.textContent=text;return p;}));}
  function syncPhase(){
    const playing=state.phase==='playing',paused=state.phase==='paused',ended=state.phase==='ended';
    document.body.dataset.phase=state.phase;
    $('briefing').hidden=playing||ended;$('hud').hidden=state.phase==='ready';$('end-screen').hidden=!ended;
    $('pause').disabled=!playing;$('match-length').disabled=paused;$('difficulty').disabled=paused;
    $('briefing-title').innerHTML=paused?'TAKE A<br><span>BREATHER.</span>':'MAKE EVERY<br><span>PIXEL COUNT.</span>';
    $('start').textContent=paused?'RESUME MATCH ↗':'ENTER THE YARD ↗';
    document.querySelectorAll('[data-weapon]').forEach(button=>{button.disabled=!playing;});
    if(ended){
      $('outcome').textContent=state.outcome==='victory'?'YARD SECURED':state.outcome==='defeat'?'CREW TAKES THE YARD':'EVENLY MATCHED';
      $('end-description').textContent=state.outcome==='victory'?'Good movement. Better aim. The relay is yours.':state.outcome==='defeat'?'Find cover, keep moving, and take another run.':'The clock ran out with both sides level.';
      $('end-player').textContent=state.score.player;$('end-bots').textContent=state.score.bots;
      $('end-stats').textContent=state.player.kills+' eliminations · '+state.player.deaths+' deaths · '+Math.ceil(state.tick/60)+' seconds';
    }
  }
  function pause(reason='Match paused. No time passes while you are away.'){
    if(state.phase!=='playing')return;
    state=match.pause();clock.setPaused(true);cancelInput();void audio.suspend();syncPhase();
    $('boot-message').textContent=reason;$('start').focus({preventScroll:true});
  }
  function end(){clock.setPaused(true);cancelInput();void audio.suspend();syncPhase();$('restart').focus({preventScroll:true});}
  function activateAudio(){void audio.enable().catch(()=>{$('settings-status').textContent='Audio is unavailable. The match remains playable without sound.';});}
  function begin(){
    if(contextLost||stopped)return;
    cancelInput();
    if(state.phase==='paused')state=match.resume();
    else{
      // Construct and validate the next match before replacing accepted state.
      const next=new StrikeMatch(options());match=next;state=match.start();
      weapon=0;log.length=0;$('feed').replaceChildren();Object.keys(counters).forEach(key=>counters[key]=0);
      hitUntil=hurtUntil=noticeUntil=0;$('combat-notice').textContent='';clock.reset();
    }
    yaw=state.player.yaw;pitch=state.player.pitch;clock.setPaused(false);syncPhase();canvas.focus({preventScroll:true});
    activateAudio();
  }
  function readPad(){
    let pads=[];try{pads=navigator.getGamepads?.()??[];}catch{}
    const sample=pad.sample(pads),device=Array.from(pads).find(p=>p&&p.connected!==false&&p.mapping==='standard');
    const held=index=>pad.armed&&Number(device?.buttons[index]?.value??Number(!!device?.buttons[index]?.pressed))>.5;
    const edge=index=>{const down=held(index),pressed=down&&!padButtons.has(index);if(down)padButtons.add(index);else padButtons.delete(index);return pressed;};
    return {sample,held,edge};
  }
  function step(){
    const {sample,held,edge}=readPad();
    if(sample.pause){pause('Controller paused. Resume from the menu.');return;}
    const look=mouse.consume(),invert=settings.invertY?-1:1;
    yaw+=look.yaw*settings.sensitivity+(actions.axis('yawRight','yawLeft')+sample.turn[1])*2.1/60;
    yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));
    pitch=Math.max(-1.5,Math.min(1.5,pitch+look.pitch*settings.sensitivity*invert+(actions.axis('pitchDown','pitchUp')+sample.turn[0]*invert)*1.7/60));
    const previousWeapon=edge(4),nextWeapon=edge(5);if(previousWeapon)weapon=(weapon+2)%3;if(nextWeapon)weapon=(weapon+1)%3;
    state=match.step({moveX:Math.max(-1,Math.min(1,actions.axis('left','right')+sample.thrust[0])),
      moveZ:Math.max(-1,Math.min(1,actions.axis('backward','forward')-sample.thrust[2])),yaw,pitch,
      fire:!!actions.value('fire')||look.primary||look.pressed||held(7),reload:actions.consume('reload')||edge(2),
      jump:!!actions.value('jump')||held(0),sprint:!!actions.value('sprint')||held(10),weapon});
    yaw=state.player.yaw;pitch=state.player.pitch;weapon=state.player.weapon;
    renderer.playEvents(state.events,state.tick);audio.playEvents(state.events,state.tick);audio.updateTick(state.tick);
    for(const event of state.events){
      if(event.type==='shot'){if(event.source==='player')counters.shots++;else counters.botShots++;}
      if(event.type==='damage'&&event.source==='player'&&event.target!=='player'){counters.hits++;hitUntil=state.tick+10;}
      if(event.type==='damage'&&event.target==='player')hurtUntil=state.tick+16;
      if(event.type==='explosion')counters.explosions++;
      if(event.type==='elimination')addLog(event.source==='player'?'CREW DOWN · +1':'CREW SCORES · +1');
      if(event.type==='death'&&event.target==='player'){counters.playerDeaths++;notice('DOWN — returning to the yard in 2.5 seconds',150);}
      if(event.type==='respawn'&&event.actor==='player'){counters.respawns++;cancelInput();notice('BACK IN — release fire, then press again',120);}
      if(event.type==='pickup')notice(event.kind==='health'?'INTEGRITY RESTORED':'AMMUNITION COLLECTED');
    }
    if(state.phase==='ended')end();
  }
  function updateHud(){
    $('score-player').textContent=state.score.player;$('score-bots').textContent=state.score.bots;
    $('match-goal').textContent='FIRST TO '+state.scoreLimit;
    const remaining=Math.ceil(state.timeRemaining);$('timer').textContent=Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0');
    $('health').textContent=Math.ceil(state.player.health);$('armour').textContent=Math.ceil(state.player.armour);
    $('health-fill').style.width=(100*state.player.health/state.player.maxHealth)+'%';$('ammo').textContent=state.player.ammo;$('reserve').textContent=state.player.reserve;
    $('weapon-name').textContent=WEAPON_NAMES[weapon];
    $('reload-status').textContent=!state.player.alive?'RETURNING IN '+(state.player.respawnTicks/60).toFixed(1)+'s':state.player.reloadRemaining>0?'RELOADING…':state.player.ammo===0?'EMPTY · PRESS R':weapon===1?'AUTOMATIC · HOLD FIRE':weapon===2?'PROJECTILE · MIND THE SPLASH':'PRECISION · PRESS TO FIRE';
    $('hit-marker').classList.toggle('active',state.tick<hitUntil);$('damage-vignette').classList.toggle('active',state.tick<hurtUntil);
    if(state.tick>=noticeUntil)$('combat-notice').textContent='';
    document.querySelectorAll('[data-weapon]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.weapon)===weapon)));
  }
  function frame(time){
    if(stopped)return;
    try{
      const elapsed=previousTime===null?0:(time-previousTime)/1000;previousTime=time;
      clock.advance(elapsed,step);if(!contextLost)renderer.render(state);updateHud();
    }catch(error){
      pause('The match stopped safely. Reload to try again.');$('error').hidden=false;$('error-message').textContent='The arena could not continue: '+error.message;stopped=true;$('start').disabled=true;$('restart').disabled=true;
    }
    if(!stopped)requestAnimationFrame(frame);
  }
  $('start').addEventListener('click',begin);$('restart').addEventListener('click',begin);
  $('back').addEventListener('click',()=>{cancelInput();match=new StrikeMatch(options());state=match.snapshot();yaw=state.player.yaw;pitch=state.player.pitch;weapon=0;syncPhase();$('boot-message').textContent='Ready for another run.';$('start').focus();});
  $('pause').addEventListener('click',()=>pause());
  $('cabinet-return').addEventListener('click',()=>pause('Returning to the arcade.'));
  window.addEventListener('blur',()=>pause('Focus lost. Resume when ready.'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause('Tab hidden. Resume when ready.');});
  window.addEventListener('gamepaddisconnected',()=>pause('Controller disconnected. Reconnect or use the keyboard, then resume.'));
  window.addEventListener('pagehide',()=>{pause('Page left. Resume when ready.');void audio.suspend();});
  window.addEventListener('keydown',event=>{
    if(event.code==='Escape'&&state.phase==='playing'){event.preventDefault();pause();return;}
    if(event.target.closest?.('button,input,select,textarea')||event.repeat)return;
    if(event.key==='?'){event.preventDefault();$('help-toggle').click();return;}
    if(state.phase==='playing'&&/^Digit[123]$/.test(event.code)){weapon=Number(event.code.slice(-1))-1;event.preventDefault();}
  });
  document.querySelectorAll('[data-weapon]').forEach(button=>button.addEventListener('click',()=>{if(state.phase==='playing'){weapon=Number(button.dataset.weapon);canvas.focus({preventScroll:true});}}));
  $('help-toggle').addEventListener('click',()=>{
    if(state.phase==='playing')pause('Controls are open. Resume when ready.');
    $('controls').hidden=!$('controls').hidden;$('help-toggle').setAttribute('aria-expanded',String(!$('controls').hidden));
  });
  $('fullscreen').addEventListener('click',async()=>{
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch{$('settings-status').textContent='Full screen is unavailable. Windowed play remains available.';}
  });
  for(const id of ['music','effects','invert-y','sensitivity','match-length','difficulty'])$(id).addEventListener('change',()=>{
    try{
      const next=validateSettings({kind:SETTINGS_KEY,sensitivity:Number($('sensitivity').value),invertY:$('invert-y').checked,
        music:$('music').checked,effects:$('effects').checked,difficulty:$('difficulty').value,match:$('match-length').value});
      settings=next;showSettings();audio.setMusic(settings.music);audio.setEffects(settings.effects);
      try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));storageAvailable=true;$('settings-status').textContent='Field settings saved on this device.';}
      catch{storageAvailable=false;$('settings-status').textContent='Settings work for this visit; browser storage is unavailable.';}
    }catch{showSettings();$('settings-status').textContent='Invalid setting rejected. Your previous settings remain active.';}
  });
  // Read-only diagnostics: browser verification observes actual input-driven state.
  Object.defineProperty(window,'strikePixel',{value:Object.freeze({inspect:()=>structuredClone({state,counters,
    audio:audio.snapshot(),graphics:renderer.snapshot(),settings,storageAvailable,pointerLocked:mouse.locked,controllerArmed:pad.armed})}),configurable:false,writable:false});
  syncPhase();$('start').disabled=false;$('boot-message').textContent='Ready. Three weapons, one yard, your move.';
  document.documentElement.dataset.ready='true';
  void registerOffline({onStatus:({state:status,message})=>{$('offline-status').dataset.state=status;$('offline-status').textContent=message;}});
  void findCabinet($('cabinet-return'));
  requestAnimationFrame(frame);
}
