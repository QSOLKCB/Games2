// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {StrikeMatch,ARENA,WEAPONS} from '../src/world.js';
import {aimAngles,visible,makeNavigation,createBrain,botIntent} from '../src/bots.js';
import {createCharacter,characterConfig,stepCharacter} from '../vendor/vanillajs/modules/character/index.js';
import {Combat3D} from '../vendor/vanillajs/modules/combat3d/index.js';
import {seededRandom} from '../vendor/vanillajs/modules/math/index.js';
const start=options=>{const m=new StrikeMatch(options);m.start();return m;};
const frames=(m,n,c={})=>{let s;for(let i=0;i<n;i++)s=m.step(c);return s;};
const eye=p=>[p.position[0],p.position[1]+p.eyeHeight,p.position[2]];

test('original arena collision blocks walls and six real steps reach the elevated deck',()=>{
  const m=start();const s=frames(m,180,{yaw:0,moveZ:-1});
  assert.ok(s.player.position[2]>16.5&&s.player.position[2]<16.66);
  assert.ok(Math.abs(s.player.velocity[2])<1e-6);
  const c=createCharacter({position:[-9.5,0,4.5]});
  for(let i=0;i<100;i++)stepCharacter(c,{move:[0,-1]},1/60,characterConfig(),ARENA.solids.map(s=>s.box));
  assert.ok(c.grounded);assert.ok(c.position[1]>1.49&&c.position[1]<1.51);assert.ok(c.position[2]<-2);
});
test('jump leaves the floor and returns, sprint moves faster, diagonal movement remains bounded',()=>{
  const m=start(),initial=m.snapshot();let s=m.step({jump:true});assert.ok(s.player.position[1]>initial.player.position[1]);
  let high=s.player.position[1];for(let i=0;i<65;i++){s=m.step({jump:true});high=Math.max(high,s.player.position[1]);}
  assert.ok(high>1);assert.ok(s.player.grounded,'held jump does not retrigger after landing');
  const walk=start(),sprint=start();frames(walk,30,{moveX:-1,yaw:0});frames(sprint,30,{moveX:-1,yaw:0,sprint:true});
  assert.ok(Math.abs(sprint.snapshot().player.position[0])>Math.abs(walk.snapshot().player.position[0]));
  const d=start();frames(d,15,{moveX:1,moveZ:1,yaw:0});assert.ok(Math.hypot(d.snapshot().player.velocity[0],d.snapshot().player.velocity[2])<=5.8+1e-9);
});
test('Lancet performs real head/body hits, trigger latches and ammunition/reload transitions',()=>{
  const head=start(),hs=head.step({fire:true});
  assert.ok(hs.events.some(e=>e.type==='damage'&&e.part==='head'&&e.target==='bot-1'));
  assert.equal(hs.score.player,1);assert.equal(hs.player.ammo,7);
  assert.equal(frames(head,40,{fire:true}).player.ammo,7,'holding precision trigger never repeats');
  head.step({fire:false});assert.equal(head.step({fire:true,yaw:0}).player.ammo,6);
  const reload=head.step({reload:true});assert.ok(reload.events.some(e=>e.type==='reload-start'));assert.ok(reload.player.reloadRemaining>0);
  const loaded=frames(head,90);assert.equal(loaded.player.ammo,8);assert.equal(loaded.player.reserve,46);
  const body=start(),state=body.snapshot(),target=state.bots[0],aim=aimAngles(eye(state.player),[target.position[0],1,target.position[2]]);
  const bs=body.step({...aim,fire:true});assert.ok(bs.events.some(e=>e.type==='damage'&&e.part==='body'));assert.equal(bs.score.player,0);assert.ok(bs.bots[0].health>0&&bs.bots[0].health<40);
  assert.equal(body.step({}).bots[0].mode,'cover','hurt bot makes a real cover decision');
});
test('automatic weapon repeats at its timer cadence; Comet travels before damage and cannot pass stone',()=>{
  const m=start(),one=m.step({weapon:1,fire:true,yaw:Math.PI});assert.equal(one.player.ammo,23);
  const burst=frames(m,30,{weapon:1,fire:true,yaw:Math.PI});assert.ok(burst.player.ammo<22&&burst.player.ammo>15);
  const combat=new Combat3D({actors:[{id:'player',team:0,position:[0,0,12],health:100,armour:0},{id:'target',team:1,position:[0,0,6],health:100,armour:0}],weapons:[...WEAPONS],solids:ARENA.solids.map(({id,box,material})=>({id,box,material}))});
  const command={actor:'player',weapon:'comet',origin:[0,1,12],direction:[0,0,-1],fire:true,reload:false};
  const first=combat.step([command]);assert.ok(first.some(e=>e.type==='shot'));assert.equal(first.some(e=>e.type==='damage'),false);assert.equal(combat.snapshot().projectiles.length,1);
  assert.ok(combat.snapshot().projectiles[0].position[2]<12);
  let explosion=false,hit=false;for(let i=0;i<35;i++){const events=combat.step([]);explosion||=events.some(e=>e.type==='explosion');hit||=events.some(e=>e.type==='damage'&&e.target==='target');}
  assert.ok(explosion&&hit);assert.ok(combat.actor('target').health<100);assert.equal(combat.snapshot().projectiles.length,0);
  assert.equal(visible([0,1,6],[0,1,-8],ARENA.solids),false,'relay tower occludes actual sight rays');
  const blocked=new Combat3D({actors:[{id:'player',team:0,position:[0,0,6],health:100,armour:0},{id:'target',team:1,position:[0,0,-8],health:100,armour:0}],weapons:[...WEAPONS],solids:ARENA.solids.map(({id,box,material})=>({id,box,material}))});
  blocked.step([{...command,origin:[0,1,6]}]);let wall=false;
  for(let i=0;i<60;i++){const events=blocked.step([]);wall||=events.some(e=>e.type==='impact'&&e.part==='wall');}
  assert.ok(wall);assert.equal(blocked.actor('target').health,100,'tower blocks both direct projectile and splash');
});
test('bots acquire, remember, route and seek actual occluding cover with bounded work',()=>{
  const navigation=makeNavigation(ARENA),brain=createBrain(0),character=createCharacter({position:[6,0,4]}),player=createCharacter({position:[0,0,12]});
  const params={brain,character,actor:{health:30,maxHealth:70},player,playerAlive:true,tick:0,difficulty:'casual',navigation,solids:ARENA.solids,random:seededRandom(1)};
  const first=botIntent(params);assert.equal(first.fire,false,'reaction delay');assert.equal(brain.mode,'cover');assert.ok(brain.cover);assert.ok(brain.routeExpanded<=256&&brain.coverQueries<=24);
  assert.equal(visible([0,1.1,12],[brain.cover[0],1,brain.cover[1]],ARENA.solids),false);
  params.actor.health=70;params.player.position=[-4,0,-6];assert.equal(visible([6,1.55,4],[-4,1.1,-6],ARENA.solids),false);params.tick=20;botIntent(params);assert.equal(brain.mode,'pursue');assert.ok(brain.lastSeen);
  params.tick=220;botIntent(params);assert.equal(brain.lastSeen,null);assert.equal(brain.mode,'patrol');
});
test('bot damage comes from real shots; player dies, team scores and delayed respawn restores state',()=>{
  const m=start({scoreLimit:25});let death=false,respawn=false,hits=0,shots=new Set();
  for(let i=0;i<1800;i++){
    const s=m.step({});for(const e of s.events){if(e.type==='shot')shots.add(e.shot);if(e.type==='damage'&&e.target==='player'){assert.ok(shots.has(e.shot));hits++;}if(e.type==='death'&&e.target==='player')death=true;if(e.type==='respawn'&&e.actor==='player'){respawn=true;assert.ok(s.player.health>0);}}
  }
  assert.ok(hits>3&&death&&respawn);assert.ok(m.snapshot().score.bots>=1);assert.ok(m.snapshot().work.routeExpanded>0);
});
test('score and time limits produce victory, defeat and draw; ended worlds never advance',()=>{
  const victory=start({scoreLimit:1});const v=victory.step({fire:true});assert.equal(v.phase,'ended');assert.equal(v.outcome,'victory');assert.deepEqual(victory.step({fire:true}),v);
  const draw=start({durationTicks:60});assert.equal(frames(draw,60).outcome,'draw');
  const defeat=start({scoreLimit:1});let s;for(let i=0;i<2400&&defeat.snapshot().phase!=='ended';i++)s=defeat.step({});assert.equal(s.outcome,'defeat');
});
test('ammo pickup is a real bounded resource change and cooldown prevents repeat collection',()=>{
  const m=start();frames(m,31,{moveX:-1,yaw:0});let collected=null;
  for(let i=0;i<28;i++){const s=m.step({moveZ:1,yaw:0});if(s.events.some(e=>e.type==='pickup'))collected=s;}
  assert.ok(collected);assert.equal(collected.events.find(e=>e.type==='pickup').kind,'ammo');assert.ok(collected.player.reserve>48);
  const reserve=m.snapshot().player.reserve,s=frames(m,30);assert.equal(s.player.reserve,reserve);assert.ok(s.pickups.find(p=>p.id==='south-ammo').remaining>0);
});
test('pause stops clocks, resume neutral-gates held fire, restart and seeded play are reproducible',()=>{
  const m=start();m.step({weapon:1,fire:true});m.pause();const paused=m.snapshot();assert.deepEqual(frames(m,50,{weapon:1,fire:true}),paused);
  m.resume();const before=m.snapshot().player.ammo;frames(m,20,{weapon:1,fire:true});assert.equal(m.snapshot().player.ammo,before);
  m.step({fire:false});assert.equal(m.step({fire:true,weapon:1}).player.ammo,before-1);
  const restarted=m.restart(),fresh=start().snapshot();assert.deepEqual(restarted,fresh);
  const a=start({seed:42}),b=start({seed:42});for(let i=0;i<180;i++){const c={weapon:1,fire:i%17<8,moveX:Math.sin(i/35),yaw:0};a.step(c);b.step(c);}assert.deepEqual(a.snapshot(),b.snapshot());
  const detached=a.snapshot();detached.player.position[0]=999;detached.bots[0].health=999;assert.notEqual(a.snapshot().player.position[0],999);assert.notEqual(a.snapshot().bots[0].health,999);
});
test('invalid commands and options reject atomically before RNG, combat or clocks change',()=>{
  const m=start();const before=m.snapshot();let called=false;
  const accessor={};Object.defineProperty(accessor,'fire',{enumerable:true,get(){called=true;return true;}});
  for(const c of [null,[],{unknown:1},{moveX:NaN},{moveZ:2},{pitch:2},{yaw:Infinity},{weapon:3},{fire:1},accessor]){assert.throws(()=>m.step(c));assert.deepEqual(m.snapshot(),before);}
  assert.equal(called,false);
  for(const o of [{seed:-1},{seed:1.1},{difficulty:'impossible'},{scoreLimit:0},{durationTicks:36001},{extra:1}])assert.throws(()=>new StrikeMatch(o));
  const good=start();assert.deepEqual(m.step({fire:true}),good.step({fire:true}));
});
