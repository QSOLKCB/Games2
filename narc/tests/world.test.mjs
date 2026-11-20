// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {ViceMission,RATE,TIME_LIMIT,HAZARD_LIMIT,STREET_PROPS,streetPropBounds} from '../src/world.js';
import {createBody2D} from '../vendor/vanillajs/modules/motion2d/index.js';
import {generateViceSprites} from '../src/art.js';
import {createProjection25D,projectScene25D} from '../vendor/vanillajs/modules/projection25d/index.js';
import {projectedStreetFootprints} from '../src/view.js';
import {createSound2D} from '../vendor/vanillajs/modules/audio2d/index.js';
test('fixed-tick mission starts paused, rejects malformed controls before mutation',()=>{
  const game=new ViceMission(),start=game.snapshot();
  assert.equal(start.phase,'ready');assert.equal(start.tick,0);
  assert.deepEqual(game.step({}),start);assert.equal(game.start().phase,'playing');
  for(const bad of [{moveX:2},{fire:1},{cheat:true},{moveY:NaN},Object.create({fire:true})]){
    const before=game.snapshot();
    assert.throws(()=>game.step(bad),/bounded|invalid/);
    assert.deepEqual(game.snapshot(),before);
  }
});
test('seedless integer motion and combat produces repeatable snapshots',()=>{
  const a=new ViceMission(),b=new ViceMission();a.start();b.start();
  for(let n=0;n<140;n++){
    const command={moveX:n<80?1:0,moveY:n>=80&&n<100?-1:0,fire:n%9<3,stun:n===105,reload:n===111};
    assert.deepEqual(a.step(command),b.step(command));
  }
  assert.ok(a.snapshot().player.body.x>75);
  assert.ok(a.snapshot().player.shots>0);
  assert.ok(a.snapshot().tick===140);
});
test('projectiles have swept contacts with actual moving enemy hurtboxes',()=>{
  const game=new ViceMission();game.start();
  const foe=game.enemies[0];foe.x=160;foe.y=345;foe.cooldown=200;
  const starting=foe.hp;
  game.step({fire:true});for(let n=0;n<9;n++)game.step({});
  assert.ok(foe.hp<starting||!game.snapshot().enemies.find(e=>e.id===1)?.hp);
  assert.ok(game.snapshot().player.hits>0);
  assert.ok(game.snapshot().player.ammo<18);
});
test('stun + nearby arrest rewards capture while elimination scores differently',()=>{
  const game=new ViceMission();game.start();
  const enemy=game.enemies[0];enemy.x=200;enemy.y=345;enemy.stunned=70;
  game.player.body=createBody2D({x:198,y:345});
  const snap=game.step({interact:true});
  assert.equal(snap.counters.captures,1);assert.equal(snap.score,125);
  assert.equal(enemy.captured,true);
  assert.equal(snap.counters.eliminations,0);
  assert.equal(game.step({interact:true}).counters.captures,1,'held E cannot repeatedly arrest');
});
test('the operator and electric grid switch are distinct rescue and hazard objectives',()=>{
  const game=new ViceMission();game.start();
  game.player.body=createBody2D({x:593,y:295});
  let snap=game.step({interact:true});assert.equal(snap.civilian.state,'rescued');assert.equal(snap.score,300);
  game.step({interact:false});
  game.player.body=createBody2D({x:744,y:354});
  snap=game.step({interact:true});assert.equal(snap.switch.disabled,true);assert.equal(snap.score,400);
  assert.equal(snap.counters.rescues,1);
});
test('timed rescue deadline, boss victory and player failure have explicit outcomes',()=>{
  const deadline=new ViceMission();deadline.start();deadline.tick=HAZARD_LIMIT-1;
  assert.equal(deadline.step({}).civilian.state,'lost');
  const winning=new ViceMission();winning.start();
  winning.enemies.at(-1).hp=0;
  winning.player.body=createBody2D({x:1261,y:345});
  const won=winning.step({});
  assert.equal(won.exitOpen,true);assert.equal(won.phase,'victory');assert.equal(won.endReason,'District secured');
  assert.equal(winning.step({moveX:1}).tick,won.tick,'ended missions cannot advance');
  const defeated=new ViceMission();defeated.start();defeated.tick=TIME_LIMIT-1;
  const failed=defeated.step({});assert.equal(failed.phase,'defeat');
  assert.equal(failed.endReason,'Evacuation window expired');
});
test('game-owned sprite recipes and native oblique scene are bounded original data',()=>{
  const sprites=generateViceSprites();assert.equal(Object.keys(sprites).length,5);
  for(const project of Object.values(sprites)){
    assert.equal(project.license,'Apache-2.0');assert.equal(project.frames.length,4);
    assert.equal(project.recipe.size,16);
  }
  const camera=createProjection25D({viewport:[960,540],origin:[20,9.3],
    pixelsPerUnit:32,heightRise:.85,heightShear:.08,shadowDirection:[.55,.3]});
  assert.equal(projectScene25D(camera,[{id:'original',x:3,z:4,width:4,depth:2,height:2}]).solids.length,1);
  const cue=createSound2D({frames:2400,events:[{id:1,sample:0,duration:2000,channel:0,
    wave:'square',frequency:410,gain:4000,seed:0}]});
  assert.equal(cue.wav().byteLength,44+4800);
});

// World obstruction and visible floor patches must share the same extents.
test('every visible street-prop ground footprint matches authoritative collision',()=>{
  const projection=createProjection25D({viewport:[960,540],origin:[15,9.3],
    pixelsPerUnit:32,heightRise:.85,heightShear:.08,shadowDirection:[.55,.3]});
  const drawings=projectedStreetFootprints(projection);
  assert.equal(drawings.length,STREET_PROPS.length);
  for(let i=0;i<drawings.length;i++){
    const bounds=streetPropBounds(STREET_PROPS[i]),drawing=drawings[i];
    assert.deepEqual(drawing.bounds,bounds);
    assert.equal(drawing.width,bounds.maxX-bounds.minX);
    assert.equal(drawing.height,bounds.maxY-bounds.minY);
  }
  const mission=new ViceMission();mission.start();
  mission.player.body=createBody2D({x:300,y:400});
  const before=mission.player.body.y;
  mission.step({moveY:-1});
  assert.equal(mission.player.body.y,before,
    'ground rectangle contains the formerly invisible blocked northward step');
});
