// SPDX-License-Identifier: Apache-2.0
// Original Strike Pixel visuals made with pinned VANILLAJS CAD-003 geometry.
// Presentation only. Existing authoritative AABBs, hits and navigation do not change.
import {createCADPrimitive,createForgePreset,cadColorStream} from './engine/cad-geometry/index.js';

const NAVY=[.055,.13,.17],TEAL=[.13,.62,.63],CREAM=[.91,.93,.82],
  GOLD=[1,.66,.17],CORAL=[.98,.43,.36];
const cache=new Map();
function part(shape,config,color) {
  const key=JSON.stringify([shape,config,color]);
  if(cache.has(key))return cache.get(key);
  const source=shape==='forge'?createForgePreset(config):createCADPrimitive(config);
  const stream=cadColorStream(source,color);
  // Bake one face-lighting coefficient per CAD triangle. Shader stays the
  // existing lightweight VANILLAJS WebGL renderer; no textures or extra draw calls.
  for(let i=0;i<stream.length;i+=18){
    const ax=stream[i],ay=stream[i+1],az=stream[i+2],
      bx=stream[i+6],by=stream[i+7],bz=stream[i+8],
      cx=stream[i+12],cy=stream[i+13],cz=stream[i+14];
    const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az;
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
    const len=Math.hypot(nx,ny,nz)||1;
    const shade=Math.min(1,.67+.21*Math.max(0,(nx*.45+ny*.76+nz*.47)/len));
    for(let k=0;k<3;k++)for(let j=0;j<3;j++)stream[i+k*6+3+j]*=shade;
  }
  cache.set(key,stream);return stream;
}
const lathe=(kind,radius,height,segments,color)=>part('cad',{kind,radius,height,segments},color);
const forge=(kind,width,depth,height,bevel,color)=>part('forge',{kind,width,depth,height,bevel},color);
export function place(stream,center=[0,0,0],orientation=null){
  const out=new Float32Array(stream.length);
  if(!Array.isArray(center)||center.length!==3||!center.every(Number.isFinite))
    throw TypeError('finite translation required');
  if(orientation&&(!Array.isArray(orientation)||orientation.length!==4||
    !orientation.every(Number.isFinite)))throw TypeError('finite quaternion required');
  const [x,y,z,w]=orientation??[0,0,0,1];
  for(let i=0;i<stream.length;i+=6){
    let px=stream[i],py=stream[i+1],pz=stream[i+2];
    if(orientation){
      const tx=2*(y*pz-z*py),ty=2*(z*px-x*pz),tz=2*(x*py-y*px);
      px+=w*tx+y*tz-z*ty;py+=w*ty+z*tx-x*tz;pz+=w*tz+x*ty-y*tx;
    }
    out[i]=px+center[0];out[i+1]=py+center[1];out[i+2]=pz+center[2];
    out[i+3]=stream[i+3];out[i+4]=stream[i+4];out[i+5]=stream[i+5];
  }
  return out;
}
function merge(parts){
  const length=parts.reduce((sum,p)=>sum+p.length,0);
  const result=new Float32Array(length);let offset=0;
  for(const part of parts){result.set(part,offset);offset+=part.length;}
  return result;
}
const pitchBack=[-Math.SQRT1_2,0,0,Math.SQRT1_2]; // +Y barrel -> -Z.
export function arenaVisuals(arena){
  if(arena?.id!=='sunrelay-yard')throw TypeError('original Sunrelay Yard required');
  const parts=[];
  const mast=lathe('column',.13,2.7,12,NAVY),
    lamp=lathe('urn',.26,.42,16,GOLD),
    collar=lathe('column',.22,.2,12,TEAL);
  // Six grounded perimeter light towers, outside the traversable playing floor.
  for(const x of [-17.45,17.45])for(const z of [-11,0,11]){
    parts.push(place(mast,[x,1.35,z]),place(collar,[x,2.64,z]),
      place(lamp,[x,2.96,z]));
  }
  // A smooth relay beacon and original bevelled trims replace a purely cubic skyline.
  parts.push(place(lathe('urn',.77,1.1,20,TEAL),[0,5.38,-2.6]),
    place(lathe('cone',.27,.68,16,GOLD),[0,6.22,-2.6]),
    place(forge('tower',2.9,2.9,.26,.09,CREAM),[0,4.97,-2.6]));
  for(const x of [-7,7])parts.push(
    place(forge('wedge',1.0,1.3,.6,.04,NAVY),[x,.3,14.4]));
  return merge(parts);
}
const robotParts={legs:lathe('column',.13,.5,12,NAVY),
  helmet:lathe('urn',.24,.4,16,TEAL),
  visor:forge('wall',.35,.23,.21,.04,NAVY),
  arm:lathe('column',.12,.49,12,TEAL),
  gun:lathe('column',.12,.42,12,NAVY)};
export function robotVisual(bot,tick,hit=false){
  const color=hit?CREAM:bot.color??CORAL;
  const h=bot.height??1.8,velocity=bot.velocity??[0,0,0];
  const stride=Math.sin(tick*.23)*Math.min(.12,Math.hypot(...velocity)*.025);
  const torso=forge('tower',.63,.48,.7,.075,color);
  const arm=hit?lathe('column',.12,.49,12,CREAM):lathe('column',.12,.49,12,color);
  return merge([
    place(robotParts.legs,[-.2,.27,stride]),place(robotParts.legs,[.2,.27,-stride]),
    place(torso,[0,.86,0]),
    place(robotParts.helmet,[0,h-.25,0]),
    place(robotParts.visor,[0,h-.23,-.225]),
    place(arm,[-.41,1.05,stride*.4]),place(arm,[.41,1.05,-stride*.4]),
    place(robotParts.gun,[.37,1.04,-.48],pitchBack),
    place(lathe('column',.12,.22,12,GOLD),[.37,1.04,-.68],pitchBack)
  ]);
}
export function weaponAccents(name){
  const spec={
    lancet:{radius:.10,height:.62,color:CREAM},
    rivet:{radius:.13,height:.45,color:GOLD},
    comet:{radius:.16,height:.42,color:GOLD}
  }[name];
  if(!spec)throw RangeError('unknown original weapon');
  const primary=lathe(name==='comet'?'urn':'column',spec.radius,spec.height,16,spec.color);
  const rings=lathe('column',spec.radius+.04,.2,12,TEAL);
  return merge([
    place(primary,[.23,-.22,-.84],pitchBack),
    place(rings,[.23,-.22,-.66],pitchBack),
    place(forge('tower',.35,.3,.23,.045,NAVY),[.23,-.13,-.59])
  ]);
}
export function pickupVisual(p,tick){
  const health=p.kind==='health',t=tick*.045;
  const rotation=[0,Math.sin(t/2),0,Math.cos(t/2)];
  const base=p.position.map((x,i)=>x+(i===1?.43+Math.sin(t)*.06:0));
  return merge([
    place(lathe('urn',.19,.44,16,health?TEAL:GOLD),base,rotation),
    place(lathe('column',.25,.2,16,CREAM),[base[0],base[1]-.16,base[2]],rotation)
  ]);
}
export function projectileVisual(p){
  const velocity=p.velocity??[0,0,-1];
  const yaw=Math.atan2(-velocity[0],-velocity[2]);
  const rotation=[0,Math.sin(yaw/2),0,Math.cos(yaw/2)];
  const bolt=place(lathe('cone',.14,.34,12,GOLD),[0,0,0],pitchBack);
  return place(bolt,p.position,rotation);
}
export const ART_ENGINE_PIN=Object.freeze({
  commit:'e9121ea7297b0aeca1da131b695e7c3371a98745',
  upstreamBlob:'10b69a5ea58878f5109e5d84a08f1ed9d370e1e9'
});
