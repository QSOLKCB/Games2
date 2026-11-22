// SPDX-License-Identifier: Apache-2.0
const cues = {start:360, pulse:480, echo:720, recover:960, hurt:130, dock:810, loss:145};

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
  tick(s) { if (s.event) this.cue(s.event); }
}
