// SPDX-License-Identifier: Apache-2.0
import {FixedClock} from '../vendor/vanillajs/modules/time/index.js';
import {HZ, newRun, step} from './world.js';
import {draw} from './view.js';
import {registerOffline} from './offline.js';

const field = document.querySelector('#field'), pen = field.getContext('2d');
const start = document.querySelector('#start'), pause = document.querySelector('#pause');
const restart = document.querySelector('#restart'), sound = document.querySelector('#sound');
const message = document.querySelector('#message');
const stats = [0, 1, 2].map(i => document.querySelector('#stat' + i));
const controls = [...document.querySelectorAll('[data-control]')];
const bindings = {KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyJ: 'attack', KeyK: 'guard'};
const clock = new FixedClock({step: 1 / HZ, maxFrame: .1, maxSteps: HZ / 10});
const sources = new Map(), taps = new Set();
let state = newRun(), previous = null, dirty = true;
let audio, voice, enabled = false;
state.phase = 'ready';

function tone(event) {
  if (!enabled || audio?.state !== 'running') return;
  const pitch = TONES[event];
  if (!pitch) return;
  if (voice) { try { voice.stop(); } catch {} }
  const osc = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
  osc.type = 'triangle'; osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(pitch * .65, now + .11);
  gain.gain.setValueAtTime(.07, now); gain.gain.exponentialRampToValueAtTime(.0001, now + .12);
  osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(now + .13);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); if (voice === osc) voice = null; };
  voice = osc;
}
const TONES = {start: 550, cut: 350, block: 160, hit: 240, parry: 800, hurt: 95, gate: 650};
sound.addEventListener('click', async () => {
  try {
    enabled = !enabled;
    if (enabled) { audio ??= new AudioContext(); await audio.resume(); }
    else if (voice) voice.stop();
    sound.setAttribute('aria-pressed', String(enabled));
    sound.textContent = enabled ? 'Sound on' : 'Sound off';
    if (enabled) tone('start');
  } catch { enabled = false; sound.textContent = 'Audio unavailable'; sound.setAttribute('aria-pressed', 'false'); }
});

function clearControls() {
  sources.clear(); taps.clear();
  controls.forEach(button => button.classList.remove('active'));
  state.guardAge = 0;
}
function press(id, action) {
  if (state.phase !== 'playing' || sources.has(id)) return;
  sources.set(id, action); taps.add(action);
}
function changePhase(phase) {
  state.phase = phase;
  clearControls(); previous = null; clock.setPaused(phase !== 'playing'); dirty = true;
  start.hidden = phase !== 'ready'; restart.hidden = phase === 'ready';
  pause.disabled = !['playing', 'paused'].includes(phase);
  pause.textContent = phase === 'paused' ? 'Resume' : 'Pause';
  document.documentElement.dataset.phase = phase;
  if (phase === 'playing') field.focus({preventScroll: true});
}
function begin() {
  state = newRun(); clock.reset(); changePhase('playing'); tone('start');
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

function ui() {
  const values = [state.hp + ' / 8', (state.sector + 1) + ' / 3', String(state.score).padStart(6, '0')];
  values.forEach((value, i) => { if (stats[i].textContent !== value) stats[i].textContent = value; });
  const info = PHRASES[state.phase] ?? (state.noticeTime ? state.notice : state.foes.some(foe => foe.hp) ? 'Clear the wardens' : 'Move right to the lift');
  if (message.textContent !== info) message.textContent = info;
}
const PHRASES = {ready: 'At the intake gate', paused: 'Run paused', won: 'Foundry cleared · lift secured', lost: 'Chassis offline · restart the run'};

function frame(now) {
  if (state.phase === 'playing') {
    clock.advance(previous === null ? 0 : Math.max(0, (now - previous) / 1000), () => {
      const input = {};
      for (const action of sources.values()) input[action] = true;
      for (const action of taps) input[action] = true;
      taps.clear();
      step(state, input);
      if (state.event) tone(state.event);
      if (state.phase !== 'playing') changePhase(state.phase);
    });
    for (const button of controls) button.classList.toggle('active', [...sources.values()].includes(button.dataset.control));
    dirty = true;
  }
  if (dirty) { draw(pen, state); ui(); dirty = false; }
  previous = now;
  requestAnimationFrame(frame);
}
window.bladeCircuit = Object.freeze({inspect: () => structuredClone(state)});
changePhase('ready');
registerOffline({onStatus: ({state, message}) => {
  const node = document.querySelector('#offline');
  node.textContent = message; node.dataset.state = state;
}});
document.documentElement.dataset.ready = 'true';
requestAnimationFrame(frame);
