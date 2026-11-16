// SPDX-License-Identifier: Apache-2.0
// Strike Pixel match rules. Engine code is consumed unchanged at the vendor pin.
import {Combat3D,defineWeapon3D} from '../vendor/vanillajs/modules/combat3d/index.js';
import {createCharacter,characterConfig,stepCharacter} from '../vendor/vanillajs/modules/character/index.js';
import {seededRandom} from '../vendor/vanillajs/modules/math/index.js';
import {ARENA} from './arena.js';
import {DIFFICULTIES,makeNavigation,createBrain,botIntent,aimDirection} from './bots.js';
export {ARENA,DIFFICULTIES};
export const TICK_RATE=60;
export const WEAPON_NAMES=Object.freeze(['Lancet','Rivet','Comet']);
export const WEAPONS=Object.freeze([
  defineWeapon3D({id:'lancet',archetype:'precision',damage:43,headMultiplier:2.4,range:64,falloff:.78,spread:0,recoil:.022,interval:.48,reload:1.3,magazine:8,reserve:48,speed:40,radius:0,penetration:1}),
  defineWeapon3D({id:'rivet',archetype:'automatic',damage:15,headMultiplier:1.5,range:42,falloff:.7,spread:.009,recoil:.008,interval:.12,reload:1.4,magazine:24,reserve:144,speed:40,radius:0,penetration:0}),
  defineWeapon3D({id:'comet',archetype:'projectile',damage:100,headMultiplier:1,range:55,falloff:1,spread:0,recoil:.035,interval:.8,reload:1.8,magazine:4,reserve:20,speed:22,radius:2.6,penetration:0})
]);
const COLORS=[[.98,.43,.36],[.91,.31,.43],[.72,.55,.96]],RESPAWN=150;
function record(value,allowed){
  if(!value||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new TypeError('Expected a plain data object');
  const descriptors=Object.getOwnPropertyDescriptors(value);
  for(const key of Reflect.ownKeys(value))if(!allowed.includes(key)||!Object.hasOwn(descriptors[key],'value'))throw new TypeError('Unknown or accessor field');
  return value;
}
function bounded(value,min,max,integer=false){if(!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isSafeInteger(value)))throw new RangeError('Number outside supported bounds');return value;}
function options(value){record(value,['seed','difficulty','scoreLimit','durationTicks']);const o={seed:2468,difficulty:'casual',scoreLimit:8,durationTicks:10800,...value};bounded(o.seed,0,0xffffffff,true);bounded(o.scoreLimit,1,25,true);bounded(o.durationTicks,60,18000,true);if(typeof o.difficulty!=='string'||!Object.hasOwn(DIFFICULTIES,o.difficulty))throw new RangeError('Unknown difficulty');return Object.freeze(o);}
function command(value,character,weapon){
  record(value,['moveX','moveZ','yaw','pitch','fire','reload','jump','sprint','weapon']);
  const c={moveX:0,moveZ:0,yaw:character.yaw,pitch:character.pitch,fire:false,reload:false,jump:false,sprint:false,weapon,...value};
  for(const key of ['moveX','moveZ'])bounded(c[key],-1,1);
  bounded(c.yaw,-Math.PI*100,Math.PI*100);bounded(c.pitch,-1.5,1.5);bounded(c.weapon,0,2,true);
  for(const key of ['fire','reload','jump','sprint'])if(typeof c[key]!=='boolean')throw new TypeError('Expected boolean '+key);
  return c;
}
export class StrikeMatch {
  #options;#combat;#characters;#brains;#random;#phase='ready';#tick=0;#events=[];#weapon=0;#outcome=null;#navigation;#solids;#boxes;#pickups;#jumpHeld=false;#fireReady=true;#playerConfig;#botConfig;
  constructor(value={}){this.#options=options(value);this.#navigation=makeNavigation(ARENA);this.#solids=ARENA.solids.map(({id,box,material})=>({id,box,material}));this.#boxes=this.#solids.map(s=>s.box);this.#initialize();}
  #initialize(){
    const cfg=DIFFICULTIES[this.#options.difficulty];this.#random=seededRandom(this.#options.seed);this.#phase='ready';this.#tick=0;this.#weapon=0;this.#outcome=null;this.#events=[];this.#jumpHeld=false;this.#fireReady=true;
    this.#playerConfig=characterConfig({walkSpeed:5.8,sprintSpeed:8.4,stepHeight:.3});this.#botConfig=characterConfig({walkSpeed:cfg.speed,sprintSpeed:cfg.speed,stepHeight:.3});
    const actors=[{id:'player',team:0,position:[...ARENA.playerSpawn],health:cfg.playerHealth,armour:cfg.playerArmour},...ARENA.botSpawns.map((position,i)=>({id:'bot-'+(i+1),team:1,position:[...position],health:cfg.health,armour:0}))];
    this.#combat=new Combat3D({actors,weapons:[...WEAPONS],solids:this.#solids,friendlyFire:false,selfDamage:true});
    this.#characters=new Map(actors.map(a=>[a.id,createCharacter({position:a.position,yaw:a.id==='player'?ARENA.playerYaw:Math.PI})]));
    this.#brains=new Map(actors.slice(1).map((a,i)=>[a.id,createBrain(i)]));this.#pickups=ARENA.pickups.map(p=>({...p,position:[...p.position],remaining:0}));
    // Contact discovery uses the real controller, without advancing the match clock.
    for(const c of this.#characters.values())stepCharacter(c,{move:[0,0]},1/60,this.#playerConfig,this.#boxes);
    this.#publishPoses();
  }
  get arena(){return ARENA;}
  start(){if(this.#phase==='ready')this.#phase='playing';return this.snapshot();}
  pause(){if(this.#phase==='playing'){this.#phase='paused';this.#combat.cancelTriggers();this.#fireReady=false;this.#jumpHeld=false;this.#events=[];}return this.snapshot();}
  resume(){if(this.#phase==='paused')this.#phase='playing';return this.snapshot();}
  restart(){this.#initialize();return this.start();}
  #publishPoses(){this.#combat.setPoses([...this.#characters].map(([id,c])=>({id,position:[...c.position],height:c.halfExtents[1]*2})));}
  #respawns(){
    for(const actor of this.#combat.snapshot().actors){
      if(actor.health>0||this.#tick-actor.deadAt<RESPAWN)continue;
      const index=actor.id==='player'?-1:Number(actor.id.slice(4))-1;
      const candidates=index<0?[ARENA.playerSpawn,[-14,0,14],[14,0,14]]:ARENA.botSpawns;
      const enemies=this.#combat.snapshot().actors.filter(a=>a.team!==actor.team&&a.health>0);
      let spawn=candidates[0],best=-1;
      for(const point of candidates){const nearest=Math.min(...enemies.map(a=>Math.hypot(a.position[0]-point[0],a.position[2]-point[2])),100);if(nearest>best){spawn=point;best=nearest;}}
      this.#combat.respawn(actor.id,[...spawn]);this.#characters.set(actor.id,createCharacter({position:[...spawn],yaw:index<0?ARENA.playerYaw:Math.PI}));
      if(index>=0)this.#brains.set(actor.id,createBrain(index));else{this.#weapon=0;this.#fireReady=false;this.#jumpHeld=false;}
      this.#events.push({type:'respawn',tick:this.#tick,actor:actor.id,position:[...spawn]});
    }
  }
  step(value={}){
    const player=this.#characters.get('player'),input=command(value,player,this.#weapon);
    // Admission completes before clocks, RNG, movement or combat state can change.
    if(this.#phase!=='playing')return this.snapshot();
    this.#events=[];this.#respawns();const pc=this.#characters.get('player');
    this.#weapon=input.weapon;pc.yaw=((input.yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;pc.pitch=input.pitch;
    const playerActor=this.#combat.actor('player');
    if(!input.fire)this.#fireReady=true;
    if(playerActor.health>0)stepCharacter(pc,{move:[input.moveX,-input.moveZ],jump:input.jump&&!this.#jumpHeld,sprint:input.sprint},1/60,this.#playerConfig,this.#boxes);
    this.#jumpHeld=input.jump;
    const commands=[],weapon=WEAPONS[this.#weapon],spread=input.fire&&this.#fireReady?weapon.spread:0;
    const yaw=pc.yaw+(spread?(this.#random()-.5)*spread*2:0),pitch=pc.pitch+(spread?(this.#random()-.5)*spread*2:0);
    commands.push({actor:'player',weapon:weapon.id,origin:[pc.position[0],pc.position[1]+pc.eyeHeight,pc.position[2]],direction:aimDirection(yaw,pitch),fire:input.fire&&this.#fireReady,reload:input.reload});
    const weaponState=this.#combat.snapshot().weapons;
    for(const [id,brain]of this.#brains){
      const actor=this.#combat.actor(id);if(actor.health<=0)continue;const c=this.#characters.get(id);
      const intent=botIntent({brain,character:c,actor,player:pc,playerAlive:playerActor.health>0,tick:this.#tick,difficulty:this.#options.difficulty,navigation:this.#navigation,solids:this.#solids,random:this.#random});
      c.yaw=intent.yaw;c.pitch=intent.pitch;stepCharacter(c,{move:intent.move},1/60,this.#botConfig,this.#boxes);
      const timer=weaponState.find(w=>w.actor===id).timers.find(w=>w.id==='rivet');
      commands.push({actor:id,weapon:'rivet',origin:[c.position[0],c.position[1]+1.55,c.position[2]],direction:intent.direction,fire:intent.fire,reload:timer.ammo===0});
    }
    this.#publishPoses();this.#events.push(...this.#combat.step(commands));this.#tick++;
    // Recoil is part of authoritative aim; a caller may counter it in later ticks.
    if(this.#events.some(e=>e.type==='shot'&&e.source==='player'))pc.pitch=Math.min(1.5,pc.pitch+weapon.recoil);
    for(const pickup of this.#pickups){
      if(pickup.remaining>0){pickup.remaining--;continue;}
      if(this.#combat.actor('player').health>0&&Math.hypot(...pc.position.map((v,i)=>v-pickup.position[i]))<1.15){
        const amount=this.#combat.pickup('player',pickup.kind,pickup.amount);
        if(amount>0){pickup.remaining=pickup.cooldown;this.#events.push({type:'pickup',tick:this.#tick,actor:'player',kind:pickup.kind,amount,position:[...pickup.position]});}
      }
    }
    const actors=this.#combat.snapshot().actors,p=actors.find(a=>a.id==='player').kills,b=actors.filter(a=>a.team===1).reduce((n,a)=>n+a.kills,0);
    if(p>=this.#options.scoreLimit||b>=this.#options.scoreLimit||this.#tick>=this.#options.durationTicks){this.#phase='ended';this.#outcome=p>b?'victory':b>p?'defeat':'draw';this.#combat.cancelTriggers();this.#events.push({type:'match-end',tick:this.#tick,outcome:this.#outcome});}
    return this.snapshot();
  }
  snapshot(){
    const state=this.#combat.snapshot();
    const pose=actor=>{const c=this.#characters.get(actor.id),w=state.weapons.find(w=>w.actor===actor.id),timer=w.timers.find(t=>t.id===w.selected);return {...actor,alive:actor.health>0,position:[...c.position],velocity:[...c.velocity],yaw:c.yaw,pitch:c.pitch,height:c.halfExtents[1]*2,eyeHeight:c.eyeHeight,grounded:c.grounded,weapon:WEAPONS.findIndex(def=>def.id===w.selected),weaponId:w.selected,weapons:w.timers,ammo:timer.ammo,reserve:timer.reserve,reloadRemaining:timer.reloadRemaining,respawnTicks:actor.health>0?0:Math.max(0,RESPAWN-(this.#tick-actor.deadAt))};};
    const player=pose(state.actors.find(a=>a.id==='player')),bots=state.actors.filter(a=>a.team===1).map((a,i)=>({...pose(a),mode:this.#brains.get(a.id).mode,color:COLORS[i]}));
    return structuredClone({phase:this.#phase,tick:this.#tick,timeRemaining:Math.max(0,(this.#options.durationTicks-this.#tick)/60),scoreLimit:this.#options.scoreLimit,difficulty:this.#options.difficulty,score:{player:player.kills,bots:bots.reduce((n,a)=>n+a.kills,0)},outcome:this.#outcome,player,bots,projectiles:state.projectiles,events:this.#events,pickups:this.#pickups.map(p=>({...p,active:p.remaining===0})),work:{routeExpanded:[...this.#brains.values()].reduce((n,b)=>n+b.routeExpanded,0),coverQueries:[...this.#brains.values()].reduce((n,b)=>n+b.coverQueries,0)}});
  }
}
