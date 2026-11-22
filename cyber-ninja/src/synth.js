// SPDX-License-Identifier: Apache-2.0
// Glassline Foundry: an eight-beat press-room ostinato, written for this stage.
const phrase = [110, 0, 165, 130.81, 0, 146.83, 98, 0];
const cues = {start:550, cut:350, block:160, hit:240, parry:800, hurt:95, gate:650, dash:440, riposte:990};

export class FoundryAudio {
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
  cue(event) { this.note(cues[event], 'triangle', .14, .075, event === 'riposte' ? 1.6 : .58); }
  tick(s) {
    this.cue(s.event);
    if (s.tick % 14 === 0) {
      const beat = Math.floor(s.tick / 14);
      this.note(phrase[beat % 8] * (1 + s.sector * .125), 'triangle', .16, .036);
      if (beat % 2 === 0) this.note(68, 'sine', .085, .055, .4);
    }
  }
}
