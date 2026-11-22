// SPDX-License-Identifier: Apache-2.0
const cues = {start:440, contact:96, gate:740, finish:880, loss:125, boost:247};
const bass=[1,1.5,1,1.2,1.6,1.2,1.5,1.125], roots=[55,65.41,73.42];

export class CoastAudio {
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
  cue(event) { this.note(cues[event], 'triangle', .18, .075, event === 'contact' ? .48 : 1.25); }
  tick(s) {
    if(!this.enabled)return;
    if(s.event)this.cue(s.event);
    if(s.phase!=='playing' || s.tick%12)return;
    const beat=Math.floor(s.tick/12),root=roots[s.sector];
    this.note(root*bass[beat%8],'triangle',.13,.032);
    if(beat%4===0)this.note(112,'sine',.1,.052,.27);
    if(s.car.speed>42 && beat%2)this.note(root*(s.burst?8:4)*bass[(beat+3)%8],'square',.065,.009);
  }
}
