// SPDX-License-Identifier: Apache-2.0
import {createBody2D, stepBody2D} from '../vendor/vanillajs/modules/motion2d/index.js';

export const ROUTE = [
  {name: 'Intake', gate: 380, posts: [245, 350]},
  {name: 'Annealing hall', gate: 790, posts: [625, 755]},
  {name: 'Lift station', gate: 1170, posts: [1050]},
];
export const EXIT = 1240;
export const HZ = 60;
export const DASH_RECHARGE = 62;
const bounds = {minX: 0, maxX: EXIT, minY: -1, maxY: 1};

function patrol(sector) {
  return ROUTE[sector].posts.map((x, i) => {
    const boss = sector === 2, guard = boss || i === 1;
    const hp = boss ? 9 : guard ? 4 : 3;
    return {x, hp, maxHP: hp, guard, boss, face: -1, wind: 0, rest: 25 + 32*i, stun: 0, flash: 0};
  });
}

export function newRun() {
  return {phase: 'playing', tick: 0, body: createBody2D({x: 32}), face: 1,
    hp: 8, sector: 0, foes: patrol(0), score: 0, combo: 0, comboTime: 0,
    dash: 0, dashFace: 1, dashHeld: false, cooldown: 0, riposte: 0, impact: null,
    cut: 0, recovery: 0, guardAge: 0, invulnerable: 0, notice: '', noticeTime: 0, event: ''};
}

function signal(s, event, notice) {
  s.event = event;
  s.notice = notice;
  s.noticeTime = 35;
}

function slash(s) {
  s.combo = s.comboTime ? (s.combo % 3) + 1 : 1;
  s.cut = 11;
  s.recovery = 16;
  s.comboTime = 39;
  s.event = 'cut';
  const counter = s.riposte > 0;
  for (const foe of s.foes) {
    const ahead = (foe.x - s.body.x) * s.face;
    if (!foe.hp || ahead < -6 || ahead > 55) continue;
    if (!counter && foe.guard && !foe.stun && !foe.wind && s.combo < 3) {
      signal(s, 'block', 'Armor held');
      continue;
    }
    foe.hp = Math.max(0, foe.hp - (counter ? 3 : s.combo === 3 ? 2 : 1));
    foe.flash = 9;
    if (s.combo === 3) { foe.stun = 18; foe.wind = 0; }
    s.impact = {x: foe.x, tick: s.tick, face: s.face};
    s.score += (foe.hp ? 20 : 120) + (counter ? 60 : 0);
    if (counter) s.riposte = 0;
    signal(s, counter ? 'riposte' : 'hit', counter ? 'Riposte · +60' : s.combo === 3 ? 'Guard break' : 'Contact');
  }
}

function updateFoe(s, foe) {
  if (!foe.hp) return;
  if (foe.flash) foe.flash--;
  if (foe.stun) { foe.stun--; return; }
  const gap = s.body.x - foe.x, distance = Math.abs(gap);
  if (foe.wind) {
    if (--foe.wind) return;
    foe.rest = foe.boss ? 45 : 66;
    if (gap * foe.face < -5 || distance > 52 || s.invulnerable) return;
    if (s.guardAge && (foe.x - s.body.x) * s.face >= -5) {
      if (s.guardAge <= 10) {
        foe.stun = 37;
        s.riposte = 34;
        s.recovery = 0;
        s.score += 45;
        signal(s, 'parry', 'Perfect guard');
      } else signal(s, 'block', 'Guard held');
    } else {
      s.hp = Math.max(0, s.hp - (foe.boss ? 2 : 1));
      s.invulnerable = 38;
      signal(s, 'hurt', 'Hull hit');
      if (!s.hp) s.phase = 'lost';
    }
    return;
  }
  foe.face = Math.sign(gap) || foe.face;
  if (foe.rest) foe.rest--;
  if (distance > 32 && distance < 200) foe.x += foe.face;
  if (distance <= 46 && !foe.rest) foe.wind = foe.boss ? 19 : 26;
}

export function step(s, {left = false, right = false, attack = false, guard = false, dash = false} = {}) {
  if (s.phase !== 'playing') return;
  s.tick++;
  s.event = '';
  for (const key of ['cut', 'recovery', 'comboTime', 'invulnerable', 'noticeTime', 'cooldown', 'riposte']) if (s[key]) s[key]--;
  const axis = Number(Boolean(right)) - Number(Boolean(left));
  if (axis && !s.dash) s.face = axis;
  if (dash && !s.dashHeld && !s.cooldown) {
    s.dash = 7;
    s.dashFace = s.face;
    s.cooldown = DASH_RECHARGE;
    s.invulnerable = Math.max(s.invulnerable, 5);
    signal(s, 'dash', 'Slip drive');
  }
  s.dashHeld = Boolean(dash);
  s.guardAge = guard && !s.dash ? Math.min(99, s.guardAge + 1) : 0;
  const gate = s.foes.some(foe => foe.hp) ? ROUTE[s.sector].gate : EXIT;
  const speed = s.dash ? 9 : guard ? 1 : 3;
  s.body = stepBody2D(s.body, {x: s.dash ? s.dashFace : axis},
    {profile: 'shmup', bounds: {...bounds, maxX: gate}, motor: {speed}});
  if (attack && !guard && !s.recovery && !s.dash) slash(s);
  if (s.dash) s.dash--;
  for (const foe of s.foes) {
    updateFoe(s, foe);
    if (s.phase === 'lost') return;
  }
  if (!s.foes.some(foe => foe.hp) && s.body.x >= ROUTE[s.sector].gate) {
    if (s.sector < ROUTE.length - 1) {
      s.foes = patrol(++s.sector);
      s.hp = Math.min(8, s.hp + 1);
      signal(s, 'gate', 'Line open');
    } else if (s.body.x >= EXIT) {
      s.phase = 'won';
      s.score += 300 + s.hp * 25;
      signal(s, 'gate', 'Lift reached');
    }
  }
}
