// SPDX-License-Identifier: Apache-2.0
// Original bounded game policy; routing/collision remain VANILLAJS modules.
import {NavigationGrid,findPath} from '../vendor/vanillajs/modules/navigation/index.js';
import {raycast} from '../vendor/vanillajs/modules/collision/index.js';
export const DIFFICULTIES=Object.freeze({casual:Object.freeze({reaction:65,cadence:42,speed:2.7,spread:.075,health:70,playerHealth:140,playerArmour:30}),standard:Object.freeze({reaction:40,cadence:27,speed:3.2,spread:.045,health:90,playerHealth:110,playerArmour:20})});
export function aimAngles(from,to){const d=to.map((x,i)=>x-from[i]);return {yaw:Math.atan2(-d[0],-d[2]),pitch:Math.atan2(d[1],Math.hypot(d[0],d[2]))};}
export function aimDirection(yaw,pitch){return [-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];}
export function visible(from,to,solids){const d=to.map((x,i)=>x-from[i]),n=Math.hypot(...d);return n<1e-6||!raycast(from,d,n,solids);}
export function makeNavigation(arena){
  const origin=-arena.size/2,blocked=[];
  for(let z=0;z<arena.size;z++)for(let x=0;x<arena.size;x++){
    const wx=origin+x+.5,wz=origin+z+.5;
    if(arena.solids.some(s=>s.box.max[1]>.05&&s.box.min[1]<1.8&&wx+.4>s.box.min[0]&&wx-.4<s.box.max[0]&&wz+.4>s.box.min[2]&&wz-.4<s.box.max[2]))blocked.push([x,z]);
  }
  const grid=new NavigationGrid({width:arena.size,height:arena.size,origin:[origin,origin],blocked}),cover=[];
  for(const s of arena.solids.filter(s=>s.box.min[1]===0&&s.box.max[1]>1&&s.box.max[1]<3)){
    const {min,max}=s.box,cx=(min[0]+max[0])/2,cz=(min[2]+max[2])/2;
    for(const p of [[min[0]-1,cz],[max[0]+1,cz],[cx,min[2]-1],[cx,max[2]+1]]){const c=grid.worldToCell(p);if(c&&grid.walkable(c))cover.push([...grid.cellCenter(c)]);}
  }
  return {grid,cover:cover.slice(0,24)};
}
export function createBrain(index){return {index,mode:'patrol',lastSeen:null,seenAt:-1000,acquiredAt:null,path:[],pathIndex:0,nextRoute:index*20,cover:null,nextCover:0,routeExpanded:0,coverQueries:0,patrolIndex:index};}
export function botIntent({brain,character,actor,player,playerAlive,tick,difficulty,navigation,solids,random}){
  const cfg=DIFFICULTIES[difficulty],pos=character.position,eye=[pos[0],pos[1]+1.55,pos[2]],target=[player.position[0],player.position[1]+1.1,player.position[2]],distance=Math.hypot(target[0]-eye[0],target[2]-eye[2]);
  const sees=playerAlive&&distance<29&&visible(eye,target,solids);
  if(sees){brain.lastSeen=[...player.position];brain.seenAt=tick;if(brain.acquiredAt===null)brain.acquiredAt=tick;}
  if(!playerAlive||tick-brain.seenAt>180){brain.lastSeen=null;brain.acquiredAt=null;}
  if(sees&&actor.health<actor.maxHealth*.65&&tick>=brain.nextCover){
    brain.nextCover=tick+90;brain.cover=null;let best=Infinity;
    for(const point of navigation.cover){const d=Math.hypot(point[0]-pos[0],point[1]-pos[2]);if(d>12)continue;brain.coverQueries++;
      if(!visible(target,[point[0],1,point[1]],solids)&&d<best){brain.cover=point;best=d;}}
  }
  const coverNow=brain.cover&&actor.health<actor.maxHealth*.65&&tick%150<105;
  const patrols=[[-12,0,12],[12,0,12],[12,0,-12],[-12,0,-12]];
  let destination=coverNow?[brain.cover[0],0,brain.cover[1]]:brain.lastSeen??patrols[brain.patrolIndex%4];
  brain.mode=coverNow?'cover':sees?'engage':brain.lastSeen?'pursue':'patrol';
  if(brain.mode==='patrol'&&Math.hypot(destination[0]-pos[0],destination[2]-pos[2])<1.3){brain.patrolIndex++;destination=patrols[brain.patrolIndex%4];}
  let movement=[0,0];
  if(sees&&!coverNow){
    const dx=target[0]-pos[0],dz=target[2]-pos[2],n=Math.hypot(dx,dz)||1,side=((Math.floor(tick/100)+brain.index)%2?1:-1);
    const forward=distance>12?1:distance<5?-.65:0;
    movement=[dx/n*forward-dz/n*side*.55,dz/n*forward+dx/n*side*.55];
  }else{
    if(tick>=brain.nextRoute){
      brain.nextRoute=tick+60;const from=navigation.grid.worldToCell([pos[0],pos[2]]),to=navigation.grid.worldToCell([destination[0],destination[2]]);
      if(from&&to){const route=findPath(navigation.grid,from,to,{maxExpanded:256});brain.routeExpanded+=route.expanded;brain.path=route.path;brain.pathIndex=1;}else brain.path=[];
    }
    const next=brain.path[brain.pathIndex];if(next){const p=navigation.grid.cellCenter(next),d=[p[0]-pos[0],p[1]-pos[2]],n=Math.hypot(...d);if(n<.35)brain.pathIndex++;else movement=d.map(x=>x/n);}
  }
  const angles=aimAngles(eye,target),yaw=sees?angles.yaw:Math.atan2(-movement[0],-movement[1]);
  const fire=sees&&!coverNow&&tick-(brain.acquiredAt??tick)>=cfg.reaction&&tick%cfg.cadence===brain.index*7%cfg.cadence;
  // World movement -> engine local X/Z. Facing and movement remain independent.
  const c=Math.cos(yaw),s=Math.sin(yaw),move=[c*movement[0]-s*movement[1],s*movement[0]+c*movement[1]];
  const pitch=angles.pitch,spread=fire?[(random()-.5)*2*cfg.spread,(random()-.5)*2*cfg.spread]:[0,0];
  return {move,yaw,pitch,fire,direction:aimDirection(yaw+spread[0],pitch+spread[1])};
}
