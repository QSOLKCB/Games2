// SPDX-License-Identifier: Apache-2.0
// Circuit Vice NC-001. Fixed 60-Hz integer-coordinate game authority.
// Rendering and audio NEVER change this simulation state.
import {createBody2D,stepBody2D} from '../vendor/vanillajs/modules/motion2d/index.js';
import {sweepContact2D} from '../vendor/vanillajs/modules/combat2d/index.js';
export const RATE=60,WIDTH=1320,TIME_LIMIT=10800,HAZARD_LIMIT=7200;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const danger={minX:779,maxX:834,minY:280,maxY:390};
// Physical rectangles are +X/+Y ground coordinates; no raised artwork enters collision.
export const PROP_MARGIN=12;
export const STREET_PROPS=Object.freeze([
  Object.freeze({x:275,y:354,w:56,h:32}),Object.freeze({x:480,y:270,w:38,h:34}),
  Object.freeze({x:980,y:405,w:52,h:24})
]);
export function streetPropBounds(prop){
  return {minX:prop.x-PROP_MARGIN,maxX:prop.x+prop.w+PROP_MARGIN,
    minY:prop.y-PROP_MARGIN,maxY:prop.y+prop.h+PROP_MARGIN};
}
// Attack warning and recovery budgets are fixed tick counts, never wall time.
export const ENEMY_BALANCE=Object.freeze({
  striker:Object.freeze({windup:18,recovery:84,range:42,damage:8}),
  shooter:Object.freeze({windup:24,recovery:108,range:315,damage:9}),
  boss:Object.freeze({windup:36,recovery:72,range:325,damage:13})
});
const enemyDefinitions=Object.freeze([
  {id:1,kind:'striker',x:312,y:340,hp:38},
  {id:2,kind:'shooter',x:485,y:385,hp:38},
  {id:3,kind:'striker',x:625,y:382,hp:38},
  {id:4,kind:'shooter',x:744,y:260,hp:38},
  {id:5,kind:'striker',x:928,y:310,hp:38},
  {id:6,kind:'shooter',x:1038,y:397,hp:38},
  {id:7,kind:'boss',x:1156,y:350,hp:144}
]);
const plain=c=>c&&Object.getPrototypeOf(c)===Object.prototype;
const allowed=['moveX','moveY','fire','stun','interact','dodge','reload'];
function commands(c){
  if(!plain(c)||Reflect.ownKeys(c).some(k=>!allowed.includes(k)))throw TypeError('bounded input record required');
  const o={moveX:0,moveY:0,fire:false,stun:false,interact:false,dodge:false,reload:false,...c};
  for(const k of ['moveX','moveY'])if(!Number.isSafeInteger(o[k])||o[k]<-1||o[k]>1)throw RangeError('invalid movement axis');
  for(const k of allowed.slice(2))if(typeof o[k]!=='boolean')throw TypeError('invalid button '+k);
  return o;
}
function obstruction(x,y){
  return STREET_PROPS.some(prop=>{
    const b=streetPropBounds(prop);
    return x>=b.minX&&x<=b.maxX&&y>=b.minY&&y<=b.maxY;
  });
}
// Integer sample spacing < 24 world units, narrower than any physical prop.
// Used only for enemy LOS; player projectile collision remains swept by VANILLAJS.
export function unobstructedEnemyLane(from,to){
  const dx=to.x-from.x,dy=to.y-from.y;
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/16));
  for(let i=1;i<steps;i++){
    const x=from.x+Math.trunc(dx*i/steps),y=from.y+Math.trunc(dy*i/steps);
    if(obstruction(x,y))return false;
  }
  return true;
}
function bounds(x,y,size=11){return {minX:x-size,maxX:x+size,minY:y-28,maxY:y+8};}
const alive=e=>e.hp>0&&!e.captured;
export class ViceMission {
  constructor(){this.reset();}
  reset(){
    this.phase='ready';this.tick=0;this.score=0;this.events=[];
    this.player={body:createBody2D({x:75,y:345}),face:1,hp:100,ammo:18,reserve:90,
      cooldown:0,stunCooldown:0,reload:0,dodge:0,dodgeCooldown:0,invulnerable:0,shots:0,hits:0};
    this.enemies=enemyDefinitions.map(e=>({...e,maxHp:e.hp,stunned:0,
      cooldown:20+e.id*14,captured:false,face:-1,windup:0,moving:false}));
    this.civilian={x:593,y:295,state:'waiting'};
    this.switch={x:744,y:354,disabled:false};this.bullets=[];
    this.last={stun:false,interact:false,dodge:false,reload:false};
    this.counters={captures:0,eliminations:0,rescues:0,damageTaken:0};
    this.endReason=null;
    return this.snapshot();
  }
  start(){if(this.phase==='ready'||this.phase==='paused')this.phase='playing';return this.snapshot();}
  pause(){if(this.phase==='playing')this.phase='paused';return this.snapshot();}
  #event(type,x,y){this.events.push({type,x,y,tick:this.tick});if(this.events.length>48)this.events.shift();}
  #hurt(amount){
    const p=this.player;
    if(p.invulnerable>0||p.dodge>0)return;
    p.hp=Math.max(0,p.hp-amount);p.invulnerable=48;this.counters.damageTaken+=amount;
    this.#event('hurt',p.body.x,p.body.y);
  }
  #spawn(owner,x,y,vx,vy,stun=false,damage=0){
    if(this.bullets.length>=96)return false;
    this.bullets.push({owner,x,y,vx,vy,ttl:95,stun,damage});return true;
  }
  #fire(stun){
    const p=this.player;
    if(p.reload>0)return;
    if(stun?p.stunCooldown>0:p.cooldown>0)return;
    if(!stun&&p.ammo===0){this.#reload();return;}
    if(this.#spawn('player',p.body.x+p.face*20,p.body.y-10,p.face*(stun?10:16),0,stun)){
      if(stun)p.stunCooldown=28;else {p.ammo--;p.cooldown=12;}
      p.shots++;this.#event(stun?'stun':'shot',p.body.x,p.body.y);
    }
  }
  #reload(){
    const p=this.player;if(p.reload||p.ammo===18||p.reserve===0)return;
    p.reload=65;this.#event('reload',p.body.x,p.body.y);
  }
  #interact(){
    const p=this.player,position=p.body;
    if(this.civilian.state==='waiting'&&distance(position,this.civilian)<57){
      this.civilian.state='rescued';this.counters.rescues++;this.score+=300;
      this.#event('rescue',this.civilian.x,this.civilian.y);return;
    }
    if(!this.switch.disabled&&distance(position,this.switch)<63){
      this.switch.disabled=true;this.score+=100;this.#event('switch',this.switch.x,this.switch.y);return;
    }
    const e=this.enemies.filter(e=>alive(e)&&e.stunned>0&&distance(position,e)<54)
      .sort((a,b)=>distance(position,a)-distance(position,b)||a.id-b.id)[0];
    if(e){e.captured=true;e.stunned=0;this.counters.captures++;this.score+=125;
      this.#event('capture',e.x,e.y);}
  }
  #enemyStep(){
    const p=this.player;
    for(const e of this.enemies){
      if(!alive(e))continue;
      e.moving=false;
      if(e.stunned>0){e.stunned--;e.windup=0;continue;}
      const d=distance(e,p.body);
      if(d>400){e.windup=0;continue;}
      if(e.cooldown>0)e.cooldown--;
      const horizontal=p.body.x-e.x,vertical=p.body.y-e.y;
      e.face=horizontal<0?-1:1;
      const desired=e.kind==='shooter'?175:e.kind==='boss'?120:24;
      const mx=Math.abs(horizontal)>desired?Math.sign(horizontal):0;
      const my=Math.abs(vertical)>19?Math.sign(vertical):0;
      const x0=e.x,y0=e.y;
      // Wind-up is a fair, committed attack stance: no pursuing through the
      // telegraph, but a player who moves out of range can still evade.
      if(e.windup===0){
        if(e.kind!=='boss'&&this.tick%2===0){
          const x=clamp(e.x+mx*(e.kind==='shooter'?2:3),25,WIDTH-45);
          const y=clamp(e.y+my*2,245,423);
          if(!obstruction(x,e.y))e.x=x;
          if(!obstruction(e.x,y))e.y=y;
        }else if(e.kind==='boss'&&this.tick%3===0){
          e.y=clamp(e.y+my*2,265,415);
        }
      }
      e.moving=x0!==e.x||y0!==e.y;
      const rule=ENEMY_BALANCE[e.kind],
        close=e.kind==='striker'?distance(e,p.body)<rule.range:
          distance(e,p.body)<rule.range&&Math.abs(p.body.y-e.y)<72&&
            unobstructedEnemyLane({x:e.x,y:e.y-13},{x:p.body.x,y:p.body.y-12});
      if(e.windup>0){
        e.windup--;
        if(e.windup>0)continue;
        if(close){
          if(e.kind==='striker'){this.#hurt(rule.damage);this.#event('strike',e.x,e.y);}
          else{
            const vy=clamp(Math.trunc((p.body.y-e.y)/24),-5,5);
            this.#spawn('enemy',e.x+e.face*14,e.y-13,
              e.face*(e.kind==='boss'?12:9),vy,false,rule.damage);
            this.#event('enemy-shot',e.x,e.y);
          }
        }
        e.cooldown=rule.recovery;
        continue;
      }
      if(e.cooldown===0&&close){
        e.windup=rule.windup;
        this.#event('threat',e.x,e.y);
      }
    }
  }
  #projectiles(){
    const survivors=[];
    for(const b of this.bullets){
      let hit=null,ratio=Infinity;
      const targets=b.owner==='player'?this.enemies.filter(alive):[this.player];
      for(const e of targets){
        const pos=e===this.player?e.body:e;
        const box=bounds(pos.x,pos.y,e.kind==='boss'?25:12);
        const contact=sweepContact2D({x:b.x,y:b.y,dx:b.vx,dy:b.vy,radius:3},box);
        if(contact!==null){
          const t=contact.n/contact.d;
          if(t<ratio){hit=e;ratio=t;}
        }
      }
      if(hit){
        if(b.owner==='player'){
          if(b.stun){
            hit.stunned=hit.kind==='boss'?52:240;
            hit.hp=Math.max(0,hit.hp-(hit.kind==='boss'?7:3));
          }else hit.hp=Math.max(0,hit.hp-(hit.kind==='boss'?14:20));
          this.player.hits++;
          this.#event('impact',hit.x,hit.y);
          if(hit.hp===0){this.counters.eliminations++;this.score+=hit.kind==='boss'?500:45;this.#event('down',hit.x,hit.y);}
         }else this.#hurt(b.damage??ENEMY_BALANCE.shooter.damage);
        continue;
      }
      b.x+=b.vx;b.y+=b.vy;b.ttl--;
      if(b.ttl>0&&b.x>5&&b.x<WIDTH-5&&b.y>=230&&b.y<=435)survivors.push(b);
    }
    this.bullets=survivors;
  }
  step(value={}){
    const c=commands(value);if(this.phase!=='playing')return this.snapshot();
    this.tick++;
    const p=this.player;
    for(const key of ['cooldown','stunCooldown','reload','dodge','dodgeCooldown','invulnerable'])
      if(p[key]>0)p[key]--;
    if(p.reload===0&&p.ammo<18&&p.reloadPending){
      const count=Math.min(18-p.ammo,p.reserve);p.ammo+=count;p.reserve-=count;p.reloadPending=false;
    }
    if(c.moveX!==0)p.face=c.moveX;
    if(c.dodge&&!this.last.dodge&&p.dodgeCooldown===0){p.dodge=12;p.dodgeCooldown=95;this.#event('dodge',p.body.x,p.body.y);}
    if(c.reload&&!this.last.reload&&p.reload===0){this.#reload();if(p.reload>0)p.reloadPending=true;}
    if(p.reload>0&&p.reloadPending!==true)p.reloadPending=true;
    const speed=p.dodge>0?11:5;
    p.body=stepBody2D(p.body,{x:c.moveX,y:c.moveY},{profile:'shmup',motor:{speed},bounds:{minX:20,minY:245,maxX:WIDTH-18,maxY:423},blockedAt:obstruction});
    if(c.interact&&!this.last.interact)this.#interact();
    if(c.fire)this.#fire(false);
    if(c.stun&&!this.last.stun)this.#fire(true);
    this.last={stun:c.stun,interact:c.interact,dodge:c.dodge,reload:c.reload};
    this.#enemyStep();this.#projectiles();
    if(!this.switch.disabled&&p.body.x>=danger.minX&&p.body.x<=danger.maxX&&
       p.body.y>=danger.minY&&p.body.y<=danger.maxY&&this.tick%80===0)this.#hurt(15);
    if(this.tick>=HAZARD_LIMIT&&this.civilian.state==='waiting'){
      this.civilian.state='lost';this.#event('lost',this.civilian.x,this.civilian.y);
    }
    const boss=this.enemies.find(e=>e.kind==='boss');
    if(p.hp<=0){this.phase='defeat';this.endReason='Agent down';}
    else if(this.tick>=TIME_LIMIT){this.phase='defeat';this.endReason='Evacuation window expired';}
    else if(!alive(boss)&&p.body.x>=1260){
      this.phase='victory';this.endReason='District secured';this.score+=this.civilian.state==='rescued'?200:0;
      this.#event('victory',p.body.x,p.body.y);
    }
    return this.snapshot();
  }
  snapshot(){
    return structuredClone({phase:this.phase,tick:this.tick,remaining:Math.ceil((TIME_LIMIT-this.tick)/RATE),
      score:this.score,endReason:this.endReason,player:{...this.player,body:{...this.player.body}},
      enemies:this.enemies,civilian:this.civilian,switch:this.switch,bullets:this.bullets,
      counters:this.counters,events:this.events.slice(-20),hazard:danger,
      exitOpen:!alive(this.enemies.find(e=>e.kind==='boss'))});
  }
}
