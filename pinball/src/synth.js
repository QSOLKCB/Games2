// SPDX-License-Identifier: Apache-2.0
// Asterion Relay: a twelve-note bell pattern for an original orbital table.
const phrase = [220, 0, 329.63, 0, 392, 293.66, 0, 246.94, 0, 369.99, 293.66, 0];
const cues = {start:440, launch:330, bank:880, bumper:659, drain:130, save:550, nudge:196, skill:1047};

export class RelayAudio {
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
  cue(event) { this.note(cues[event], 'sine', .21, .09, event === 'drain' ? .45 : 1.4); }
  tick(s) {
    this.cue(s.event);
    if (!s.serving && s.tick % 30 === 0) {
      const beat = Math.floor(s.tick / 30);
      this.note(phrase[beat % phrase.length], 'sine', .28, .032);
      if (beat % 4 === 0) this.note(82.41, 'triangle', .36, .035);
    }
  }
}
