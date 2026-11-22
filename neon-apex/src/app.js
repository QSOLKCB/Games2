// SPDX-License-Identifier: Apache-2.0
import {FixedClock} from '../vendor/vanillajs/modules/time/index.js';
import {HZ, newRun, step, SPLITS, BOOST_COST} from './world.js';
import {CoastAudio} from './synth.js';
import {draw} from './view.js';
import {registerOffline} from './offline.js';

const field = document.querySelector('#field'), pen = field.getContext('2d');
const start = document.querySelector('#start'), pause = document.querySelector('#pause');
const restart = document.querySelector('#restart'), sound = document.querySelector('#sound');
const message = document.querySelector('#message');
const stats = [0, 1, 2].map(i => document.querySelector('#stat' + i));
const controls = [...document.querySelectorAll('[data-control]')];
const bindings = {KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'throttle', ArrowUp: 'throttle', KeyS: 'brake', ArrowDown: 'brake', Space: 'boost'};
const clock = new FixedClock({step: 1 / HZ, maxFrame: .1, maxSteps: HZ / 10});
const sources = new Map(), taps = new Set();
let state = newRun(), previous = null, dirty = true;
const motion=document.querySelector('#motion'), preference=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=preference.matches, customMotion=false;
function updateMotion() {
  motion.setAttribute('aria-pressed',String(reduced));
  motion.textContent=reduced?'Motion reduced':'Reduce motion'; dirty=true;
}
motion.addEventListener('click',()=>{
  customMotion=true;reduced=!reduced;updateMotion();
  if(state.phase==='playing')field.focus({preventScroll:true});
});
preference.addEventListener('change',()=>{if(!customMotion){reduced=preference.matches;updateMotion();}});
updateMotion();
const reserve=document.querySelector('#reserve'), power=document.querySelector('#power');
function show(node,value){if(node.textContent!==value)node.textContent=value;}
const synth = new CoastAudio();
state.phase = 'ready';
sound.addEventListener('click', async () => {
  sound.disabled = true;
  try {
    await synth.toggle();
    sound.setAttribute('aria-pressed', String(synth.enabled));
    sound.textContent = synth.enabled ? 'Sound on' : 'Sound off';
  } catch { sound.textContent = 'Audio unavailable'; }
  finally { sound.disabled = false; }
  if (state.phase === 'playing') field.focus({preventScroll:true});
});

function clearControls() {
  sources.clear(); taps.clear();
  controls.forEach(button => button.classList.remove('active'));
}
function press(id, action) {
  if (state.phase !== 'playing' || sources.has(id)) return;
  sources.set(id, action); taps.add(action);
}
function changePhase(phase) {
  state.phase = phase;
  if(phase==='won')record(state.tick);
  if (phase !== 'playing') synth.quiet();
  clearControls(); previous = null; clock.setPaused(phase !== 'playing'); dirty = true;
  start.hidden = phase !== 'ready'; restart.hidden = phase === 'ready';
  pause.disabled = !['playing', 'paused'].includes(phase);
  pause.textContent = phase === 'paused' ? 'Resume' : 'Pause';
  document.documentElement.dataset.phase = phase;
  if (phase === 'playing') field.focus({preventScroll: true});
}
function begin() {
  synth.quiet(); state = newRun(); clock.reset(); changePhase('playing'); synth.cue('start');
}
function togglePause() {
  if (state.phase === 'playing') changePhase('paused');
  else if (state.phase === 'paused') changePhase('playing');
}
start.addEventListener('click', begin);
restart.addEventListener('click', begin);
pause.addEventListener('click', togglePause);
window.addEventListener('blur', () => { if (state.phase === 'playing') changePhase('paused'); });
document.addEventListener('visibilitychange', () => { if (document.hidden && state.phase === 'playing') changePhase('paused'); });
window.addEventListener('pagehide', () => { if (state.phase === 'playing') changePhase('paused'); });
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.code === 'Escape' || e.code === 'KeyP') { if (!e.repeat) togglePause(); return; }
  const action = bindings[e.code];
  if (!action || state.phase !== 'playing') return;
  if (e.code === 'Space' && e.target.closest?.('button,a')) return;
  e.preventDefault();
  if (!e.repeat) press(e.code, action);
});
window.addEventListener('keyup', e => sources.delete(e.code));
for (const button of controls) {
  const action = button.dataset.control;
  button.addEventListener('pointerdown', e => {
    if (e.button !== 0 || state.phase !== 'playing') return;
    e.preventDefault(); button.setPointerCapture(e.pointerId); press(e.pointerId, action);
  });
  button.addEventListener('pointerup', e => sources.delete(e.pointerId));
  const cancel = e => {
    if (!sources.delete(e.pointerId) || [...sources.values()].includes(action)) return;
    taps.delete(action);
  };
  button.addEventListener('pointercancel', cancel);
  button.addEventListener('lostpointercapture', cancel);
  button.addEventListener('click', e => { if (e.detail === 0 && state.phase === 'playing') taps.add(action); });
}

const tow=document.querySelector('#tow'), bestNode=document.querySelector('#best');
const splitNodes=[...document.querySelectorAll('#splits li span')];
const recordKey='games2.neon-apex.coast.best-ticks.v1';
function readBest(){
  try{
    const n=Number(localStorage.getItem(recordKey));
    return Number.isSafeInteger(n) && n>0 && n<=47*HZ ? n : null;
  }catch{return null;}
}
let best=readBest();
const elapsed=ticks=>(ticks/HZ).toFixed(2)+' s';
function record(ticks){
  const previous=readBest();
  best=Math.min(ticks,previous??Infinity,best??Infinity);
  try{localStorage.setItem(recordKey,String(best));}catch{}
}
function ui() {
  reserve.value=state.charge;show(power,state.charge+' / 100');
  show(tow,state.burst?'Turbo active':state.drafting?'Slipstream · '+state.drafting:
    state.charge>=BOOST_COST?'Ready to boost':'Draft a rival to recharge');
  splitNodes.forEach((node,i)=>show(node,state.splits.length>i?elapsed(state.splits[i]-(state.splits[i-1]??0)):'—'));
  show(bestNode,best===null?'—':elapsed(best));
  const values = [Math.round(state.car.speed*3.6) + ' km/h', (state.time/HZ).toFixed(1)+' s', state.place+' / 4'];
  values.forEach((value, i) => { if (stats[i].textContent !== value) stats[i].textContent = value; });
  const info = state.phase === 'won' ? 'Finish · place '+state.place+' of 4 · '+(state.tick/HZ).toFixed(2)+' s' : PHRASES[state.phase] ?? (state.noticeTime ? state.notice : 'Next gate · '+SPLITS[state.sector]+' m');
  if (message.textContent !== info) message.textContent = info;
}
const PHRASES = {ready:'On the starting grid', paused:'Race paused', lost:'Out of time · restart the race'};

function frame(now) {
  if (state.phase === 'playing') {
    clock.advance(previous === null ? 0 : Math.max(0, (now - previous) / 1000), () => {
      const input = {};
      for (const action of sources.values()) input[action] = true;
      for (const action of taps) input[action] = true;
      taps.clear();
      step(state, input);
      if (state.phase !== 'playing') changePhase(state.phase);
      synth.tick(state);
    });
    for (const button of controls) button.classList.toggle('active', [...sources.values()].includes(button.dataset.control));
    dirty = true;
  }
  if (dirty) { draw(pen, state, reduced); ui(); dirty = false; }
  previous = now;
  requestAnimationFrame(frame);
}
window.neonApex = Object.freeze({inspect: () => structuredClone(state)});
changePhase('ready');
registerOffline({onStatus: ({state, message}) => {
  const node = document.querySelector('#offline');
  node.textContent = message; node.dataset.state = state;
}});
document.documentElement.dataset.ready = 'true';
requestAnimationFrame(frame);
