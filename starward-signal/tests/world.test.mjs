// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun,step,position,target,RELAYS,PORT,SCALE} from '../src/world.js';

function expedition(){
  const s=newRun();
  while(s.phase==='playing'){
    const pt=position(s),t=target(s),dx=t.x-pt.x,dy=t.y-pt.y;
    step(s,{left:dx< -8,right:dx>8,up:dy< -8,down:dy>8,ping:true});
  }
  return s;
}
test('a repeatable flight recovers exactly three transmissions and returns to Port Lumen',()=>{
  const s=expedition();assert.equal(s.recovered,3);assert.equal(s.phase,'won');assert.ok(s.cleared>0);
  assert.ok(Math.hypot(position(s).x-PORT.x,position(s).y-PORT.y)<=55);
  assert.deepEqual(expedition(),s);const done=structuredClone(s);step(s,{ping:true});assert.deepEqual(s,done);
});
test('a pulse samples the current relay at emission, enforces range and requires a second cast',()=>{
  const s=newRun();step(s,{ping:true});assert.equal(s.echoes,0);
  s.ship={...s.ship,x:RELAYS[0].x*SCALE,y:RELAYS[0].y*SCALE};
  while(s.cooldown)step(s);assert.equal(s.echoes,0);
  step(s,{ping:true});assert.equal(s.echoes,1);for(let i=0;i<12;i++)step(s,{ping:true});
  assert.equal(s.casts,2);assert.equal(s.recovered,0);
  while(s.cooldown)step(s);step(s,{ping:true});assert.equal(s.recovered,1);assert.equal(s.echoes,0);
});
test('hull loss, timeout and pause have distinct stable outcomes',()=>{
  const s=newRun();s.hull=1;s.ship={...s.ship,x:444*SCALE,y:338*SCALE};step(s);
  assert.equal(s.phase,'lost');assert.equal(s.hull,0);
  const idle=newRun();idle.time=1;step(idle);assert.equal(idle.phase,'lost');assert.equal(idle.hull,5);
  const p=newRun();p.phase='paused';const copy=structuredClone(p);step(p,{up:true});assert.deepEqual(p,copy);
});
test('the final delivery wins on the last tick and inactive relays cannot be decoded out of order',()=>{
  const s=newRun();s.ship={...s.ship,x:RELAYS[2].x*SCALE,y:RELAYS[2].y*SCALE};step(s,{ping:true});
  assert.equal(s.echoes,0);const final=newRun();final.recovered=3;final.time=1;step(final);assert.equal(final.phase,'won');
});
test('opposed thrusters cancel and the survey cutter stays within its chart',()=>{
  const s=newRun();step(s,{left:true,right:true,up:true,down:true});assert.deepEqual(position(s),{x:PORT.x,y:PORT.y});
  for(let i=0;i<350;i++)step(s,{left:true,up:true});assert.deepEqual(position(s),{x:0,y:0});
});
