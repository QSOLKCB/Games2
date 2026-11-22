// SPDX-License-Identifier: Apache-2.0
import {createBody2D,stepBody2D} from '../vendor/vanillajs/modules/motion2d/index.js';

export const HZ=60, SCALE=16, WIDTH=1510, HEIGHT=960, SCAN_RANGE=78;
export const PORT={x:175,y:505,name:'Port Lumen'};
export const RELAYS=[
  {x:446,y:302,name:'Kite',mark:'I'}, {x:786,y:655,name:'Shoal',mark:'II'}, {x:1250,y:347,name:'Crown',mark:'III'},
];
const patrols=[
  [377,337,67,47],[538,415,89,55],[749,591,65,73],
  [915,582,81,58],[1168,390,75,65],[1111,284,62,75],
];
const bounds={minX:0,maxX:WIDTH*SCALE,minY:0,maxY:HEIGHT*SCALE};
export const target = s => RELAYS[s.recovered] ?? PORT;
export const position = s => ({x:s.ship.x/SCALE,y:s.ship.y/SCALE});
export const range = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

export function newRun(){
  return {phase:'playing',tick:0,time:100*HZ,ship:createBody2D({x:PORT.x*SCALE,y:PORT.y*SCALE}),
    heading:-.55,hull:5,invulnerable:0,recovered:0,echoes:0,cooldown:0,ring:null,casts:0,cleared:0,
    drones:patrols.map(([x,y],i)=>({x,y,id:i,silent:0})),event:'',notice:'Follow the bearing to Kite',noticeTime:110};
}
function announce(s,event,text){s.event=event;s.notice=text;s.noticeTime=92;}
function pulse(s,origin){
  s.casts++; s.cooldown=42; s.ring={...origin,age:0};
  announce(s,'pulse','Pulse sent');
  const relay=RELAYS[s.recovered];
  if(!relay || range(origin,relay)>SCAN_RANGE) return;
  s.echoes++;
  if(s.echoes===2){
    s.recovered++;s.echoes=0;
    announce(s,'recover',relay.name+' transmission recovered');
  }else announce(s,'echo',relay.name+' · first echo');
}
function updateDrones(s,pt){
  for(const drone of s.drones){
    const [cx,cy,rx,ry]=patrols[drone.id],angle=s.tick*.012+drone.id*1.9;
    drone.x=cx+rx*Math.cos(angle);drone.y=cy+ry*Math.sin(angle);
    if(drone.silent){drone.silent--;continue;}
    if(s.ring){
      const radius=s.ring.age*10,delta=range(drone,s.ring);
      if(delta<=radius+12 && delta>=Math.max(0,radius-23)){
        drone.silent=145;s.cleared++;continue;
      }
    }
    if(range(drone,pt)<26 && !s.invulnerable){
      s.hull--;s.invulnerable=90;announce(s,'hurt','Static strike');
      if(s.hull===0){s.phase='lost';return;}
    }
  }
}
export function step(s,{left=false,right=false,up=false,down=false,ping=false}={}){
  if(s.phase!=='playing')return;
  s.tick++;s.time--;s.event='';
  if(s.invulnerable)s.invulnerable--;
  if(s.cooldown)s.cooldown--;
  if(s.noticeTime)s.noticeTime--;
  const x=Number(Boolean(right))-Number(Boolean(left)), y=Number(Boolean(down))-Number(Boolean(up));
  s.ship=stepBody2D(s.ship,{x,y},{profile:'rts',bounds});
  if(s.ship.vx||s.ship.vy)s.heading=Math.atan2(s.ship.vy,s.ship.vx);
  const pt=position(s);
  if(ping&&!s.cooldown)pulse(s,pt);
  if(s.ring && ++s.ring.age>14)s.ring=null;
  updateDrones(s,pt);
  if(s.phase==='lost')return;
  if(s.recovered===RELAYS.length && range(pt,PORT)<=55){
    s.phase='won';announce(s,'dock','Three transmissions delivered');
  }else if(s.time<=0){s.time=0;s.phase='lost';announce(s,'loss','Carrier signal lost');}
}
