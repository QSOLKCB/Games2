// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {FINISH,HZ,ROAD,SPLITS,newRun,step} from '../src/world.js';

function race(){
  const s=newRun();
  while(s.phase==='playing'){
    const steer=ROAD.sample(s.distance)*s.car.speed*s.car.speed*.07+(3.7-s.car.offset)*2;
    step(s,{throttle:true,left:steer<-.7,right:steer>.7});
  }
  return s;
}
test('a driven line wins against three independently paced rivals and records three ordered splits',()=>{
  const s=race();assert.equal(s.phase,'won');assert.equal(s.distance,FINISH);assert.equal(s.place,1);
  assert.equal(s.splits.length,3);assert.ok(s.splits[0]<s.splits[1] && s.splits[1]<s.splits[2]);
  assert.deepEqual(race(),s);
  const finished=structuredClone(s);step(s,{brake:true});assert.deepEqual(s,finished);
});
test('brake brings the car to rest, expiry locks the loss and restart clears contact history',()=>{
  const s=newRun();while(s.phase==='playing')step(s,{brake:true,right:true});
  assert.equal(s.time,0);assert.equal(s.phase,'lost');assert.equal(s.car.speed,0);
  assert.deepEqual(s.splits,[]);assert.equal(newRun().contacts,0);
});
test('a checkpoint on the last tick awards time once and the finish beats expiry',()=>{
  const s=newRun();s.distance=SPLITS[0]-.01;s.time=1;step(s,{throttle:true});
  assert.equal(s.phase,'playing');assert.equal(s.sector,1);assert.equal(s.time,13*HZ);
  step(s);assert.equal(s.time,13*HZ-1);
  s.sector=2;s.distance=FINISH-.01;s.time=1;step(s);
  assert.equal(s.phase,'won');assert.equal(s.distance,FINISH);
});
test('same-lane contact costs speed once throughout an overlap and an adjacent car stays clear',()=>{
  for(const [lane,hits] of [[0,1],[3.8,0]]){
    const s=newRun(),r=s.rivals[0];r.distance=1;r.lane=lane;r.offset=lane;
    step(s,{throttle:true});assert.equal(s.contacts,hits);
    step(s,{throttle:true});assert.equal(s.contacts,hits);
  }
});
test('opposing steering cancels; roadside movement respects the motor bounds',()=>{
  const s=newRun();step(s,{left:true,right:true});assert.equal(s.car.steering,0);
  for(let i=0;i<480;i++)step(s,{right:true,throttle:true});
  assert.ok(Math.abs(s.car.offset)<=7.601);assert.ok(Number.isFinite(s.car.speed));
  s.phase='paused';const p=structuredClone(s);step(s);assert.deepEqual(s,p);
});
