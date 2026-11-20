// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {ARENA} from '../src/arena.js';
import {arenaVisuals,robotVisual,weaponAccents,pickupVisual,projectileVisual,place,ART_ENGINE_PIN} from '../src/forge-art.js';
const check=mesh=>{assert.ok(mesh instanceof Float32Array&&mesh.length>0&&mesh.length%18===0);
  assert.ok(mesh.every(Number.isFinite));return mesh.length/18;};
test('latest pinned VANILLAJS CAD creates original bounded arena assets',()=>{
  assert.equal(ART_ENGINE_PIN.commit,'e9121ea7297b0aeca1da131b695e7c3371a98745');
  assert.ok(check(arenaVisuals(ARENA))>100);
  assert.throws(()=>arenaVisuals({id:'unknown'}),TypeError);
});
test('rounded robot, weapon, projectile and pickup assets stay finite',()=>{
  for(const name of ['lancet','rivet','comet'])assert.ok(check(weaponAccents(name))>20);
  assert.throws(()=>weaponAccents('unknown'),RangeError);
  assert.ok(check(robotVisual({height:1.8,color:[.9,.3,.2],velocity:[3,0,0]},10))>70);
  assert.ok(check(pickupVisual({kind:'health',position:[0,0,0]},50))>30);
  assert.ok(check(projectileVisual({position:[2,1,3],velocity:[2,0,-5]}))>10);
});
test('CAD display transforms do not mutate source and reject invalid translations',()=>{
  const src=weaponAccents('lancet'),before=new Float32Array(src),out=place(src,[1,2,3]);
  assert.deepEqual(src,before);assert.ok(Math.abs(out[0]-(src[0]+1))<1e-6,'Float32 translation rounding stays bounded');
  assert.throws(()=>place(src,[NaN,0,0]),TypeError);
});
test('original authoritative arena data remain unchanged',()=>{
  assert.equal(ARENA.id,'sunrelay-yard');
  assert.equal(ARENA.botSpawns.length,3);
  assert.equal(ARENA.pickups.length,4);
  assert.ok(Object.isFrozen(ARENA.solids));
});
