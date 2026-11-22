// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {newRun, step, BUMPERS, flipper} from '../src/world.js';

function serve(s, ticks) { for(let i=0;i<ticks;i++) step(s,{launch:true}); step(s); }
test('charging is bounded, release launches once and the physical shooter feeds the playfield',()=>{
  const s=newRun(); for(let i=0;i<1000;i++)step(s,{launch:true});
  assert.equal(s.charge,100); assert.equal(s.launches,0); step(s);
  for(let i=0;i<160;i++)step(s);
  assert.equal(s.launches,1); assert.equal(s.inShooter,false); assert.ok(s.ball.x<309);
});
test('a real launch lights a full beacon bank, drains three balls and locks the score',()=>{
  function play(){const s=newRun();while(s.phase==='playing'&&s.tick<10000){
    if(s.serving)serve(s,25);else step(s);
  }return s;}
  const s=play(); assert.equal(s.phase,'over'); assert.equal(s.stock,0);assert.ok(s.banks>=1);
  assert.ok(s.score>=1050);assert.deepEqual(play(),s);
  const final=structuredClone(s);step(s,{launch:true});assert.deepEqual(s,final);
  assert.equal(newRun().score,0);
});
test('rising flippers drive the ball up with mirrored horizontal impulse',()=>{
  for(const side of [0,1]){
    const s=newRun();const arm=flipper(side,0);s.serving=false;s.inShooter=false;
    Object.assign(s.ball,{x:(arm[0]+arm[2])/2,y:(arm[1]+arm[3])/2-10,vx:0,vy:1});
    step(s,side?{right:true}:{left:true});assert.ok(s.ball.vy<-1);assert.equal(s.flips,1);
    assert.ok(side?s.ball.vx<0:s.ball.vx>0);
  }
});
test('resting contact scores once and both flippers release independently',()=>{
  const s=newRun();s.serving=false;s.inShooter=false;
  const p=BUMPERS[0];Object.assign(s.ball,{x:p.x-p.r-6,y:p.y,vx:2,vy:0});
  step(s,{right:true,left:true});assert.equal(s.score,100);
  for(let i=0;i<8;i++)step(s,{left:true});
  assert.equal(s.score,100);assert.equal(s.lifts[0],1);assert.equal(s.lifts[1],0);
});
