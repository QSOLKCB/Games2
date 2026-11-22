// SPDX-License-Identifier: Apache-2.0
const cues = {start:360, pulse:480, echo:720, recover:960, hurt:130, dock:810, loss:145, harmonic:1120, deflect:243};
const stationNotes=[130.81,146.83,174.61,196],intervals=[1,1.5,1.125,1.875,1.25,1.5];

export class ArrayAudio {
  voices = new Set();
  enabled = false;
  async toggle() {
    if (this.enabled) { this.enabled = false; this.quiet(); return; }
    this.context ??= new AudioContext();
    await this.context.resume();
    this.enabled = true;
    this.cue('start');
  }
  quiet() {
    for (const osc of this.voices) { osc.disconnect(); try { osc.stop(); } catch {} }
    this.voices.clear();
  }
  note(pitch, type, duration, volume, slide = 1) {
    if (!pitch || !this.enabled || this.context?.state !== 'running' || this.voices.size >= 8) return;
    const a = this.context, now = a.currentTime, osc = a.createOscillator(), gain = a.createGain();
    osc.type = type; osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * slide, now + duration);
    gain.gain.setValueAtTime(.0001, now); gain.gain.linearRampToValueAtTime(volume, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(a.destination); this.voices.add(osc);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); this.voices.delete(osc); };
    osc.start(); osc.stop(now + duration + .01);
  }
  cue(event) { this.note(cues[event], 'sine', .26, .085, event === 'hurt' ? .48 : 1.65); }
  tick(s) {
    if(!this.enabled)return;
    if(s.event)this.cue(s.event);
    if(s.phase!=='playing' || s.tick%30)return;
    const beat=Math.floor(s.tick/30),root=stationNotes[s.recovered];
    this.note(root*intervals[beat%6],'sine',.41,.023,1.006);
    if(beat%4===0)this.note(root*.5,'triangle',.63,.021);
    if(s.shielding)this.note(root*2,'sine',.17,.015,.8);
  }
}
