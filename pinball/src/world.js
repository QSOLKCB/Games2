// SPDX-License-Identifier: Apache-2.0
export const HZ = 120;
export const WIDTH = 360, HEIGHT = 494, RADIUS = 6;
export const BUMPERS = [
  {x: 102, y: 133, r: 23, label: 'I'},
  {x: 210, y: 103, r: 23, label: 'II'},
  {x: 182, y: 212, r: 24, label: 'III'},
];
// The lower returns extend over the flipper pivots so the rubber cannot form a pocket.
export const RAILS = [
  [12, 128, 24, 69], [24, 69, 64, 32], [64, 32, 124, 18], [124, 18, 266, 18],
  [266, 18, 309, 29], [309, 29, 350, 70], [350, 70, 350, 477],
  [12, 128, 12, 338], [12, 338, 40, 393], [40, 393, 111, 415],
  [309, 112, 309, 477], [309, 340, 283, 392], [283, 392, 230, 414],
  [30, 289, 79, 351], [79, 351, 43, 331], [43, 331, 30, 289],
  [285, 287, 248, 353], [248, 353, 281, 328], [281, 328, 285, 287],
];
const PIVOTS = [96, 246], FLIP_Y = 415, LENGTH = 65, RUBBER = 6;
const SUBSTEPS = 3, DT = 1 / SUBSTEPS;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function flipper(side, lift) {
  const direction = side === 0 ? 1 : -1;
  const angle = .46 - lift * 1.03;
  return [PIVOTS[side], FLIP_Y, PIVOTS[side] + direction * LENGTH * Math.cos(angle), FLIP_Y + LENGTH * Math.sin(angle)];
}

export function newRun() {
  return {phase: 'playing', tick: 0, ball: {x: 331, y: 455, vx: 0, vy: 0},
    serving: true, charge: 0, charging: false, inShooter: true,
    stock: 3, score: 0, bank: 0, banks: 0, lifts: [0, 0], lastHits: [-100, -100, -100],
    launches: 0, flips: 0, event: '', notice: 'Hold launch, then release', noticeTime: 240};
}

function signal(s, name, message) {
  s.event = name;
  s.notice = message;
  s.noticeTime = 115;
}

function rebound(ball, nx, ny, restitution, surfaceX = 0, surfaceY = 0) {
  const approach = (ball.vx - surfaceX) * nx + (ball.vy - surfaceY) * ny;
  if (approach >= 0) return false;
  ball.vx -= (1 + restitution) * approach * nx;
  ball.vy -= (1 + restitution) * approach * ny;
  return true;
}

function capsule(ball, [x, y, tx, ty], thickness, previous) {
  const dx = tx - x, dy = ty - y;
  const t = clamp(((ball.x - x) * dx + (ball.y - y) * dy) / (dx*dx + dy*dy), 0, 1);
  const rx = ball.x - (x + t*dx), ry = ball.y - (y + t*dy);
  const distance = Math.hypot(rx, ry), reach = RADIUS + thickness;
  if (distance >= reach) return false;
  const nx = distance ? rx / distance : 0, ny = distance ? ry / distance : -1;
  ball.x += nx * (reach - distance);
  ball.y += ny * (reach - distance);
  const surfaceX = previous ? t * (tx - previous[2]) / DT : 0;
  const surfaceY = previous ? t * (ty - previous[3]) / DT : 0;
  return rebound(ball, nx, ny, previous ? .69 : .81, surfaceX, surfaceY);
}

function bumper(s, post, i) {
  const b = s.ball;
  const dx = b.x - post.x, dy = b.y - post.y, d = Math.hypot(dx, dy), limit = RADIUS + post.r;
  if (d >= limit) return;
  const nx = d ? dx / d : 0, ny = d ? dy / d : -1;
  b.x = post.x + nx * limit;
  b.y = post.y + ny * limit;
  if (!rebound(b, nx, ny, 1) || s.tick - s.lastHits[i] < 8) return;
  b.vx += nx * 2.2;
  b.vy += ny * 2.2;
  s.lastHits[i] = s.tick;
  s.score += 100;
  s.bank |= 1 << i;
  signal(s, 'bumper', 'Beacon ' + post.label);
  if (s.bank === 7) {
    s.bank = 0;
    s.banks++;
    s.score += 750;
    signal(s, 'bank', 'Relay online · +750');
  }
}

function drain(s) {
  s.stock--;
  s.phase = s.stock ? 'playing' : 'over';
  s.serving = Boolean(s.stock);
  s.inShooter = true;
  s.charging = false;
  s.charge = 0;
  s.ball = {x: 331, y: 455, vx: 0, vy: 0};
  signal(s, 'drain', s.stock ? 'Ball drained · serve again' : 'Out of balls');
}

export function step(s, {left = false, right = false, launch = false} = {}) {
  if (s.phase !== 'playing') return;
  s.tick++;
  s.event = '';
  if (s.noticeTime) s.noticeTime--;
  if (s.serving) {
    if (launch) { s.charge = Math.min(100, s.charge + 2); s.charging = true; }
    else if (s.charging) {
      s.ball.vy = -6.6 - .035*s.charge;
      s.serving = false;
      s.charging = false;
      s.charge = 0;
      s.launches++;
      signal(s, 'launch', 'Probe launched');
    }
  }
  const b = s.ball;
  for (let n = 0; n < SUBSTEPS; n++) {
    if (!s.serving) {
      b.vy += .033 * DT;
      b.x += b.vx * DT;
      b.y += b.vy * DT;
      for (const rail of RAILS) capsule(b, rail, 2);
      if (s.inShooter && b.x < 299) s.inShooter = false;
      if (!s.inShooter) capsule(b, [309, 29, 309, 112], 1);
      for (let i = 0; i < BUMPERS.length; i++) bumper(s, BUMPERS[i], i);
    }
    for (let i = 0; i < 2; i++) {
      const old = s.lifts[i], held = i === 0 ? left : right;
      if (held && old === 0) s.flips++;
      s.lifts[i] = clamp(old + (held ? .18 : -.085)*DT, 0, 1);
      if (!s.serving) capsule(b, flipper(i, s.lifts[i]), RUBBER, flipper(i, old));
    }
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 11) { b.vx *= 11/speed; b.vy *= 11/speed; }
    if (!s.serving && b.y > HEIGHT + RADIUS) { drain(s); break; }
  }
}
