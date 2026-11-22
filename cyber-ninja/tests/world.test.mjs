// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun, step, EXIT, ROUTE} from '../src/world.js';

function crossing() {
  const s = newRun();
  while (s.phase === 'playing' && s.tick < 2000) {
    const target = s.foes.find(f => f.hp), gap = target ? target.x - s.body.x : 100;
    step(s, {attack:true, right: gap > 38, left: gap < -12});
  }
  return s;
}
test('input replay clears three guarded lines, reaches the lift and locks the result', () => {
  const s = crossing();
  assert.equal(s.phase, 'won'); assert.equal(s.body.x, EXIT); assert.equal(s.sector, 2);
  assert.ok(s.score > 1000); assert.deepEqual(crossing(), s);
  const locked = structuredClone(s); step(s, {left:true}); assert.deepEqual(s, locked);
  assert.equal(newRun().score, 0);
});
test('a live warden seals the line and an undefended chassis can lose', () => {
  const s = newRun();
  for (let i = 0; i < 3000 && s.phase === 'playing'; i++) step(s, {right:true});
  assert.ok(s.body.x <= ROUTE[0].gate); assert.equal(s.sector, 0); assert.equal(s.phase, 'lost');
});
test('facing and timing distinguish a parry from sustained guard and rear exposure', () => {
  for (const [age, face, hp, stunned] of [[0,1,8,true],[20,1,8,false],[0,-1,7,false]]) {
    const s = newRun(), f = s.foes[0];
    s.guardAge = age; s.face = face; f.x = s.body.x + 16; f.face = -1; f.wind = 1;
    step(s, {guard:true});
    assert.equal(s.hp, hp); assert.equal(f.stun > 0, stunned);
  }
});
test('opposed movement cancels; pausing freezes a pending wind-up', () => {
  const s = newRun(); step(s,{left:true,right:true}); assert.equal(s.body.x,32);
  s.phase='paused'; const saved=structuredClone(s);
  step(s,{right:true,attack:true}); assert.deepEqual(s,saved);
});
