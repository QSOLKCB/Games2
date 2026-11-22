// SPDX-License-Identifier: Apache-2.0
import {createRoadCurve, createRoadVehicle} from '../vendor/vanillajs/modules/road-arcade/index.js';

export const HZ = 60;
export const ROAD = createRoadCurve([0,.006,.009,-.002,-.011,-.005,.004,.013,.003,-.012,-.006,0], {segmentLength:150});
export const FINISH = ROAD.length;
export const SPLITS = [600, 1200, FINISH];
export const SECTORS = ['Salt flats', 'Copper cut', 'Sunset viaduct'];
const motor = createRoadVehicle({topSpeed:69, turboSpeed:15, acceleration:24, braking:43, drag:2.2,
  halfWidth:5.2, shoulderWidth:2.4, grip:12, lateralSpeed:10.5});
export const HALF_ROAD = motor.settings.halfWidth;
const traffic = [
  {name:'Kite', color:'#9bede0', lane:-2.35, pace:50, start:18},
  {name:'Ember', color:'#ff9167', lane:1.95, pace:55, start:43},
  {name:'Iris', color:'#d7adff', lane:-.3, pace:59, start:74},
];

export function newRun() {
  return {phase:'playing', tick:0, distance:0, time:21*HZ, sector:0, splits:[], place:4,
    car:{offset:0,speed:28,lateralSpeed:0,steering:0,slip:0},
    rivals:traffic.map(r=>({...r,distance:r.start,offset:r.lane,touching:false})),
    contacts:0, flash:0, event:'', notice:'Reach the first timing gate', noticeTime:110};
}

function announce(s, event, text) {
  s.event=event; s.notice=text; s.noticeTime=90;
}

function advanceTraffic(s, lastDistance, lastOffset) {
  for (const [id,r] of s.rivals.entries()) {
    const before=r.distance-lastDistance, oldLane=r.offset;
    const pace=r.pace + 2.4*Math.sin(r.distance/135+id);
    r.distance += pace/HZ;
    r.offset=r.lane + .75*Math.sin(r.distance/85+id);
    const after=r.distance-s.distance;
    // Check closest longitudinal approach within this tick against the moving lanes.
    const fraction=before===after ? 0 : Math.max(0,Math.min(1,before/(before-after)));
    const gap=before+(after-before)*fraction;
    const lateral=oldLane-lastOffset+fraction*((r.offset-s.car.offset)-(oldLane-lastOffset));
    const contact=Math.abs(gap)<4.5 && Math.abs(lateral)<1.35;
    if (contact && !r.touching) {
      s.contacts++; s.car.speed*=.69; s.flash=18;
      announce(s,'contact','Side contact');
    }
    r.touching=contact;
  }
}

export function step(s,{left=false,right=false,throttle=false,brake=false}={}) {
  if(s.phase!=='playing') return;
  const lastDistance=s.distance, lastOffset=s.car.offset;
  s.tick++; s.time--; s.event='';
  if(s.flash) s.flash--;
  if(s.noticeTime) s.noticeTime--;
  s.car=motor.step(s.car,{steer:Number(Boolean(right))-Number(Boolean(left)),throttle:Number(Boolean(throttle)),brake:Number(Boolean(brake))},ROAD.sample(s.distance),1/HZ);
  if(Math.abs(s.car.offset)>HALF_ROAD) s.car.speed=Math.max(0,s.car.speed-.12);
  s.distance=Math.min(FINISH,s.distance+s.car.speed/HZ);
  advanceTraffic(s,lastDistance,lastOffset);
  s.place=1+s.rivals.filter(r=>r.distance>s.distance).length;
  if(s.distance>=SPLITS[s.sector]){
    s.splits.push(s.tick);
    if(s.distance===FINISH){
      s.phase='won'; announce(s,'finish','Finish line'); return;
    }
    s.sector++;s.time+=13*HZ;
    announce(s,'gate',SECTORS[s.sector]+' · +13 seconds');
  }
  if(s.time<=0){s.time=0;s.phase='lost';announce(s,'loss','Clock expired');}
}
