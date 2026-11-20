// SPDX-License-Identifier: Apache-2.0
// SUNRELAY YARD presentation. Physics, aim and damage remain in the game state.
import {Renderer} from '../vendor/vanillajs/modules/render-webgl/index.js';
import {boxMeshBatch} from '../vendor/vanillajs/modules/geometry/index.js';
import {characterView} from '../vendor/vanillajs/modules/character/index.js';
import {rotate} from '../vendor/vanillajs/modules/math/index.js';
import {arenaVisuals,robotVisual,weaponAccents,pickupVisual,projectileVisual} from './forge-art.js';

const NAVY=[.055,.13,.17],TEAL=[.13,.62,.63],CREAM=[.91,.93,.82],GOLD=[1,.66,.17],CORAL=[.98,.43,.36];
const box=(center,size,color)=>({center,size,color});
const mapBox=s=>box(s.box.min.map((x,i)=>(x+s.box.max[i])/2),s.box.min.map((x,i)=>s.box.max[i]-x),s.color??TEAL);
const EDGES=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
function edges(boxes,color=NAVY){
  const out=[];
  for(const b of boxes){
    const p=Array.from({length:8},(_,n)=>b.center.map((v,i)=>v+(b.size[i]+.003)*((n>>i&1)-.5)));
    for(const [a,c] of EDGES)out.push(...p[a],...color,...p[c],...color);
  }
  return new Float32Array(out);
}
function transformed(vertices,position,orientation){
  const out=new Float32Array(vertices.length);
  for(let i=0;i<vertices.length;i+=6){
    const p=rotate(orientation,[vertices[i],vertices[i+1],vertices[i+2]]);
    for(let n=0;n<3;n++){out[i+n]=p[n]+position[n];out[i+n+3]=vertices[i+n+3];}
  }
  return out;
}
function weaponModels(){
  const grip=[box([.23,-.34,-.45],[.12,.25,.17],NAVY),box([.22,-.41,-.4],[.17,.12,.2],CREAM)];
  return {
    lancet:boxMeshBatch([...grip,
      box([.23,-.24,-.64],[.14,.13,.53],TEAL),box([.23,-.22,-.92],[.075,.075,.36],CREAM),
      box([.23,-.15,-.64],[.09,.07,.22],NAVY),box([.23,-.14,-.55],[.045,.035,.025],GOLD),
      box([.31,-.24,-.57],[.035,.06,.28],GOLD),box([.23,-.22,-1.1],[.09,.09,.035],NAVY)]),
    rivet:boxMeshBatch([...grip,
      box([.24,-.25,-.6],[.25,.21,.37],NAVY),box([.24,-.23,-.64],[.21,.15,.37],CORAL),
      box([.24,-.23,-.88],[.1,.09,.2],CREAM),box([.3,-.4,-.6],[.13,.25,.17],TEAL),
      box([.095,-.22,-.61],[.035,.06,.29],GOLD),box([.38,-.22,-.61],[.035,.06,.29],GOLD),
      box([.24,-.105,-.68],[.035,.04,.06],CREAM)]),
    comet:boxMeshBatch([...grip,
      box([.25,-.25,-.61],[.31,.28,.43],TEAL),box([.25,-.25,-.69],[.28,.24,.3],GOLD),
      box([.25,-.25,-.85],[.22,.2,.035],NAVY),box([.25,-.36,-.84],[.3,.035,.17],CREAM),
      box([.25,-.14,-.84],[.3,.035,.17],CREAM),box([.1,-.25,-.84],[.035,.25,.17],CREAM),
      box([.4,-.25,-.84],[.035,.25,.17],CREAM),box([.25,-.08,-.61],[.06,.06,.18],NAVY)])
  };
}

export class ArenaRenderer{
  constructor(canvas,arena,{onContextLost=()=>{},onContextRestored=()=>{}}={}){
    this.canvas=canvas;this.callbacks={onContextLost,onContextRestored};this.disposed=false;this.lost=false;
    this.effects=[];this.hits=new Map();this.lastEventTick=-1;this.shotTick=-100;this.shotWeapon=null;this.playerId='player';
    this.weaponLocal=Object.fromEntries(Object.entries(weaponModels()).map(([name,mesh])=>
      [name,new Float32Array([...mesh,...weaponAccents(name)])]));this.arena=arena;
    this.onLost=event=>{event.preventDefault();this.lost=true;this.callbacks.onContextLost(new Error('WebGL context lost. Match paused.'));};
    this.onRestored=()=>{
      if(this.disposed)return;
      try{this.init();this.lost=false;this.callbacks.onContextRestored();}
      catch(error){this.lost=true;this.callbacks.onContextLost(error);}
    };
    canvas.addEventListener('webglcontextlost',this.onLost);
    canvas.addEventListener('webglcontextrestored',this.onRestored);
    try{this.init();}catch(error){canvas.removeEventListener('webglcontextlost',this.onLost);canvas.removeEventListener('webglcontextrestored',this.onRestored);throw error;}
  }
  init(){
    // Restore allocates fresh handles; the lost context's handles are invalid.
    this.renderer=new Renderer(this.canvas);this.renderer.gl.clearColor(.69,.86,.85,1);
    this.staticMesh=this.renderer.mesh([]);this.outlineMesh=this.renderer.mesh([],'lines');
    this.dynamicMesh=this.renderer.mesh([]);this.effectMesh=this.renderer.mesh([]);
    this.traceMesh=this.renderer.mesh([],'lines');this.weaponMesh=this.renderer.mesh([]);
    this.setArena(this.arena);
  }
  setArena(arena){
    if(!arena||!Array.isArray(arena.solids)||!Array.isArray(arena.decor))throw new TypeError('Arena solids and decor required');
    if(arena.solids.length+arena.decor.length>2048)throw new RangeError('Arena presentation budget exceeded');
    this.arena=arena;const boxes=[...arena.solids,...arena.decor].map(mapBox);
    this.renderer.update(this.staticMesh,new Float32Array([...boxMeshBatch(boxes),...arenaVisuals(arena)]));this.renderer.update(this.outlineMesh,edges(boxes));
    this.effects=[];this.hits.clear();this.lastEventTick=-1;this.shotTick=-100;this.shotWeapon=null;
  }
  playEvents(events,tick){
    if(tick===this.lastEventTick)return;
    if(tick<this.lastEventTick){this.effects=[];this.hits.clear();this.shotTick=-100;}
    this.lastEventTick=tick;
    for(const e of events??[]){
      if(e.type==='shot'&&e.source===this.playerId){this.shotTick=tick;this.shotWeapon=e.weapon;}
      if(e.type==='damage')this.hits.set(e.target,tick+6);
      if(['trace','impact','explosion','pickup','respawn'].includes(e.type))
        this.effects.push({...e,born:tick,life:e.type==='trace'?5:e.type==='explosion'?20:14});
      if(e.type==='shot'&&e.source!==this.playerId&&e.origin)
        this.effects.push({type:'muzzle',point:e.origin.map((x,i)=>x+e.direction[i]*.45),born:tick,life:3});
    }
    this.effects=this.effects.filter(e=>tick-e.born<e.life).slice(-128);
    for(const [id,end] of this.hits)if(end<tick)this.hits.delete(id);
  }
  render(snapshot,_alpha=0){
    if(this.disposed)throw new Error('Renderer disposed');
    if(this.lost)return false;
    if(!snapshot?.player)throw new TypeError('A game snapshot is required');
    const player=snapshot.player,tick=snapshot.tick;this.playerId=player.id??'player';
    this.playEvents(snapshot.events,tick);
    const view=characterView(player),renderer=this.renderer,gl=renderer.gl;
    renderer.begin(view.position,view.orientation,{fog:.0025,fov:Math.PI/2.6});
    renderer.draw(this.staticMesh);renderer.draw(this.outlineMesh);
    const dynamic=[];
    for(const bot of (snapshot.bots??[]).slice(0,16))if(bot.alive){
      const mesh=robotVisual(bot,tick,(this.hits.get(bot.id)??-1)>=tick),yaw=bot.yaw??0;
      dynamic.push(...transformed(mesh,bot.position,[0,Math.sin(yaw/2),0,Math.cos(yaw/2)]));
    }
    const boxes=[];
    for(const p of (snapshot.projectiles??[]).slice(0,64)){
      dynamic.push(...projectileVisual(p));
    }
    for(const p of (snapshot.pickups??[]).slice(0,32))if(p.active)
      dynamic.push(...pickupVisual(p,tick));
    dynamic.push(...boxMeshBatch(boxes));renderer.update(this.dynamicMesh,new Float32Array(dynamic));renderer.draw(this.dynamicMesh);
    const sparks=[],lines=[];
    for(const e of this.effects){
      const age=tick-e.born;if(age<0||age>=e.life)continue;
      if(e.type==='trace'){
        const c=e.source===this.playerId?[1,.87,.42]:[1,.5,.38];
        lines.push(...e.from,...c,...e.to,...c);
      }else{
        const p=e.point??e.position;if(!p)continue;
        if(e.type==='explosion'){
          const radius=Math.max(.1,(e.radius??1)*age/e.life);
          lines.push(...edges([box(p,[radius*2,radius*2,radius*2],GOLD)],age<7?CREAM:GOLD));
        }else for(let n=0;n<4;n++){
          const d=age*.018,sign=n%2?1:-1;
          sparks.push(box([p[0]+sign*d,p[1]+d*(n+1),p[2]+(n<2?d:-d)],[.055,.055,.055],e.type==='pickup'?TEAL:age<4?CREAM:GOLD));
        }
      }
    }
    renderer.update(this.effectMesh,boxMeshBatch(sparks));renderer.draw(this.effectMesh);
    renderer.update(this.traceMesh,new Float32Array(lines));renderer.draw(this.traceMesh);
    if(player.alive){
      // Only weapon presentation is depth-isolated. World traces and collisions
      // use the actual eye ray, never the decorative barrel's screen position.
      const kick=player.weaponId===this.shotWeapon?Math.max(0,1-(tick-this.shotTick)/6):0,moving=Math.hypot(player.velocity?.[0]??0,player.velocity?.[2]??0);
      const bob=Math.sin(tick*.15)*Math.min(.012,moving*.002),dip=player.reloadRemaining>0?.16:0;
      const local=this.weaponLocal[player.weaponId]??this.weaponLocal.lancet;
      const shifted=new Float32Array(local);
      for(let i=0;i<shifted.length;i+=6){shifted[i+1]+=bob-dip;shifted[i+2]+=kick*.075;}
      const weapon=Array.from(transformed(shifted,view.position,view.orientation));
      if(kick>.45){
        const muzzle={lancet:[.23,-.22,-1.13],rivet:[.24,-.23,-1],comet:[.25,-.25,-.95]}[player.weaponId];
        const flash=boxMeshBatch([box(muzzle,[.1+kick*.05,.08,.12],CREAM)]);
        weapon.push(...transformed(flash,view.position,view.orientation));
      }
      renderer.update(this.weaponMesh,new Float32Array(weapon));gl.clear(gl.DEPTH_BUFFER_BIT);renderer.draw(this.weaponMesh);
    }
    return true;
  }
  snapshot(){return {lost:this.lost,disposed:this.disposed,effects:this.effects.length,meshes:this.renderer?.meshes.size??0};}
  dispose(){
    if(this.disposed)return;this.disposed=true;
    this.canvas.removeEventListener('webglcontextlost',this.onLost);this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
    if(!this.lost)this.renderer?.dispose();this.effects=[];this.hits.clear();
  }
}
