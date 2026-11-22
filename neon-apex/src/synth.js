// SPDX-License-Identifier: Apache-2.0
const cues = {start:440, contact:96, gate:740, finish:880, loss:125};

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
  tick(s) { if (s.event) this.cue(s.event); }
}
