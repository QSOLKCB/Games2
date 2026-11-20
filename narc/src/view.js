// SPDX-License-Identifier: Apache-2.0
// All world projection and effects are presentation only; no input/physics writes.
import {createProjection25D,projectPoint25D,projectScene25D}
 from '../vendor/vanillajs/modules/projection25d/index.js';
import {rasterViceSprites} from './art.js';
import {STREET_PROPS,streetPropBounds} from './world.js';
export const SCREEN=Object.freeze({width:960,height:540});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const stages=[
 {id:'ion-shop',x:5,z:4.1,width:4,depth:2.0,height:2.3},
 {id:'grid-bay',x:10.4,z:5.0,width:5,depth:1.8,height:3.0},
 {id:'repair-yard',x:18.7,z:4.8,width:4.5,depth:2.1,height:2.2},
 {id:'dock-tower',x:28.1,z:4.0,width:4.0,depth:2.6,height:3.0},
 {id:'reactor-site',x:35.7,z:4.6,width:4.3,depth:2.0,height:3.5}
];
function polygon(c,points,color){c.fillStyle=color;c.beginPath();for(let i=0;i<points.length;i++){
  const [x,y]=points[i];if(!i)c.moveTo(x,y);else c.lineTo(x,y);
}c.closePath();c.fill();}
function stroke(c,x1,y1,x2,y2,color,width=1){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
}
function text(c,value,x,y,size=16,color='#f7f4e6',align='left'){
  c.font='800 '+size+'px system-ui, sans-serif';c.textAlign=align;c.fillStyle=color;
  c.fillText(value,x,y);c.textAlign='left';
}
function disc(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
/** Ground patches use the exact same padded bounds as movement obstruction. */
export function projectedStreetFootprints(projection){
  return STREET_PROPS.map(prop=>{
    const bounds=streetPropBounds(prop);
    const min=projectPoint25D(projection,[bounds.minX/32,0,bounds.minY/32]);
    const max=projectPoint25D(projection,[bounds.maxX/32,0,bounds.maxY/32]);
    return {prop,bounds,x:min[0],y:min[1],width:max[0]-min[0],height:max[1]-min[1]};
  });
}
export class ViceView{
  constructor(canvas){
    this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});
    if(!this.ctx)throw Error('Canvas2D unavailable');this.assets=rasterViceSprites();
    this.canvas.width=960;this.canvas.height=540;this.lastFrame=null;
  }
  draw(state){
    if(!state?.player)throw TypeError('Circuit Vice snapshot required');
    const c=this.ctx,w=960,h=540,t=state.tick,cam=clamp(state.player.body.x-265,0,360);
    const projector=createProjection25D({viewport:[960,540],origin:[(cam+480)/32,9.3],
      pixelsPerUnit:32,heightRise:.85,heightShear:.08,shadowDirection:[.55,.3]});
    const point=(x,y,elevation=0)=>projectPoint25D(projector,[x/32,elevation,y/32]);
    const gradient=c.createLinearGradient(0,0,0,520);
    gradient.addColorStop(0,'#07101c');gradient.addColorStop(.52,'#18304b');gradient.addColorStop(1,'#39616b');
    c.fillStyle=gradient;c.fillRect(0,0,w,h);
    // Original procedural skyline: visually continuous, modest geometry budget.
    for(let i=0;i<37;i++){
      const x=i*44-(cam*.22)%44,y=80+(i*41%105),height=205-y;
      c.fillStyle=i%3===0?'#17314a':'#10283d';c.fillRect(x,y,37,height);
      c.fillStyle='#33536a';
      for(let row=0;row<5;row++)for(let col=0;col<3;col++)
        if((i*7+row*3+col*11)%4===0)c.fillRect(x+7+col*10,y+14+row*19,4,7);
    }
    c.fillStyle='#071e31';c.fillRect(0,220,w,320);
    const asphalt=c.createLinearGradient(0,225,0,540);
    asphalt.addColorStop(0,'#33444e');asphalt.addColorStop(.55,'#192c36');asphalt.addColorStop(1,'#0a1826');
    c.fillStyle=asphalt;c.fillRect(0,226,w,314);
    c.fillStyle='#324450';c.fillRect(0,238,w,13);
    for(let i=0;i<34;i++){
      const x=((i*72-cam)%2400+2400)%2400-72;
      c.fillStyle='rgba(147,187,197,.11)';c.fillRect(x,250,34,2);
      c.fillStyle='rgba(236,191,94,.38)';c.fillRect(x+10,415,40,4);
    }
    c.fillStyle='#5ed6dd';c.fillRect(0,249,w,2);
    // Source-bound VANILLAJS 2.5D visual extrusions; never used as blockers.
    const buildings=projectScene25D(projector,stages);
    for(const shadow of buildings.shadows)polygon(c,shadow.points,'rgba(0,0,0,.27)');
    for(const obj of buildings.solids){
      polygon(c,obj.sideX,'#1b384b');polygon(c,obj.sideZ,'#315164');
      polygon(c,obj.roof,'#486879');
      const top=obj.roof[0];const label={'ion-shop':'ION//TIDE','grid-bay':'GRID 18',
        'repair-yard':'REPAIR / 09','dock-tower':'ORBITAL TAXIS','reactor-site':'REACTOR'}[obj.id];
      if(top&&top[0]>-120&&top[0]<w+120)text(c,label,top[0]+11,top[1]+32,12,'#a0f5eb');
    }
    const hz=state.hazard;
    if(!state.switch.disabled){
      const a=point(hz.minX,hz.minY),b=point(hz.maxX,hz.maxY);
      c.fillStyle=t%48<24?'rgba(245,71,137,.21)':'rgba(245,71,137,.10)';
      c.fillRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);
      for(let i=0;i<3;i++)stroke(c,a[0]+i*19,a[1],a[0]+i*19,b[1],'#fa658d',2);
    }
    // The cyan-bordered GROUND patch is the exact blocked footprint,
    // including the 12-unit actor clearance. Raised crate detail is decorative.
    const footprints=projectedStreetFootprints(projector);
    for(const f of footprints){
      c.fillStyle='rgba(30,73,84,.85)';c.fillRect(f.x,f.y,f.width,f.height);
      c.strokeStyle='#68bec8';c.lineWidth=2;c.strokeRect(f.x,f.y,f.width,f.height);
      const p=point(f.prop.x,f.prop.y),top=p[1]-27;
      c.fillStyle='#172739';c.fillRect(p[0],top,f.prop.w,f.prop.h+27);
      c.strokeStyle='#a2eef3';c.lineWidth=2;c.strokeRect(p[0],top,f.prop.w,f.prop.h+27);
      stroke(c,p[0],top,p[0]+12,top-12,'#a2eef3',2);
      stroke(c,p[0]+f.prop.w,top,p[0]+f.prop.w+12,top-12,'#a2eef3',2);
    }
    // Relay actuator sits at the precise interaction coordinate, not the
    // electrical hazard's edge. Disabled state remains a visible landmark.
    const relay=state.switch,relayPoint=point(relay.x,relay.y);
    const relayNear=!relay.disabled&&
      Math.hypot(state.player.body.x-relay.x,state.player.body.y-relay.y)<=63;
    const relayColor=relay.disabled?'#738c92':'#ffe18d';
    disc(c,relayPoint[0],relayPoint[1],23,'rgba(3,20,31,.8)');
    c.strokeStyle=relayColor;c.lineWidth=3;
    c.strokeRect(relayPoint[0]-19,relayPoint[1]-36,38,32);
    c.fillStyle=relay.disabled?'#35505a':'#ffbb58';
    c.fillRect(relayPoint[0]-14,relayPoint[1]-31,28,22);
    disc(c,relayPoint[0],relayPoint[1]-21,6,relay.disabled?'#8badae':'#fff7c2');
    text(c,relay.disabled?'GRID OFFLINE':relayNear?'[E] DISABLE GRID':'GRID RELAY',
      relayPoint[0],relayPoint[1]-49,13,relay.disabled?'#9cb7bc':'#fff3ae','center');
    const anchor=(x,y)=>point(x,y);
    const drawSprite=(name,x,y,frame,size=54,face=1,opacity=1)=>{
      const frames=this.assets[name],asset=frames[frame%frames.length],p=anchor(x,y);
      if(p[0]<-80||p[0]>1040)return;
      c.save();c.globalAlpha=opacity;
      if(face<0){c.translate(p[0],0);c.scale(-1,1);c.translate(-p[0],0);}
      c.imageSmoothingEnabled=false;c.drawImage(asset,Math.round(p[0]-size/2),Math.round(p[1]-size*.91),size,size);
      c.restore();
      disc(c,p[0],p[1]-1,size*.19,'rgba(5,10,20,.35)');
    };
    // Display-only painter ordering by depth; deterministic stable tie-break.
    const actors=state.enemies.filter(e=>e.hp>0&&!e.captured).map(e=>({kind:e.kind,x:e.x,y:e.y,face:e.face,
      hp:e.hp,maxHp:e.maxHp,stunned:e.stunned,id:e.id}));
    if(state.civilian.state==='waiting')actors.push({kind:'civilian',x:state.civilian.x,y:state.civilian.y,face:1,id:99});
    actors.push({kind:'agent',x:state.player.body.x,y:state.player.body.y,face:state.player.face,id:0});
    actors.sort((a,b)=>a.y-b.y||a.id-b.id);
    for(const a of actors){
      const p=anchor(a.x,a.y),bob=a.kind==='agent'&&Math.abs(state.player.body.vx)>0?Math.sin(t*.5)*2:0;
      const frame=Math.floor(t/10)+(a.id%4);
      if(a.kind==='agent'){
        const blink=state.player.invulnerable>0&&t%8<3;
        if(!blink)drawSprite('agent',a.x,a.y+bob,frame,62,a.face);
      }else{
        drawSprite(a.kind,a.x,a.y,frame,a.kind==='boss'?93:54,a.face,a.stunned>0?.65:1);
        if(a.kind!=='civilian'){
          c.fillStyle='#071321';c.fillRect(p[0]-23,p[1]-(a.kind==='boss'?106:66),46,5);
          c.fillStyle=a.stunned>0?'#59e7d3':a.kind==='boss'?'#ff6a99':'#ffbc83';
          c.fillRect(p[0]-22,p[1]-(a.kind==='boss'?105:65),44*a.hp/a.maxHp,3);
          if(a.stunned>0)text(c,'CAPTURE [E]',p[0],p[1]-78,12,'#74ffe4','center');
        }else text(c,'RESCUE [E]',p[0],p[1]-67,12,'#97ffc8','center');
      }
    }
    for(const b of state.bullets){
      const p=anchor(b.x,b.y-11),color=b.stun?'#6bffdb':b.owner==='player'?'#ffe6a1':'#ff7398';
      stroke(c,p[0]-b.vx*1.3,p[1]-b.vy*1.3,p[0],p[1],color,b.stun?5:3);
      disc(c,p[0],p[1],b.stun?4:2,color);
    }
    const recent=state.events.filter(e=>t-e.tick<22);
    for(const e of recent){
      const p=anchor(e.x,e.y-26),age=t-e.tick,r=4+age*.8;
      if(['impact','hurt','rescue','capture','down','victory','switch'].includes(e.type)){
        c.strokeStyle=['hurt','down'].includes(e.type)?'#ff6b9a':'#79ffdc';
        c.lineWidth=2;c.beginPath();c.arc(p[0],p[1],r,0,Math.PI*2);c.stroke();
      }
    }
    const exit=anchor(1260,355);
    c.fillStyle=state.exitOpen?'rgba(81,251,193,.2)':'rgba(255,92,133,.12)';
    c.fillRect(exit[0],190,43,230);stroke(c,exit[0],190,exit[0],420,state.exitOpen?'#6fffd0':'#fd648a',4);
    if(exit[0]>-80&&exit[0]<1040)text(c,state.exitOpen?'EVAC READY':'GATE LOCKED',exit[0]-18,180,14,
      state.exitOpen?'#9affdf':'#ffb2cd');
    // Compact overlay for diegetic objective direction.
    c.fillStyle='rgba(5,17,29,.78)';c.fillRect(18,18,440,52);
    text(c,'DISTRICT 09  /  NIGHT RESPONSE',32,40,17,'#f5f2e9');
    const directive=state.civilian.state==='waiting'?'RESCUE THE OPERATOR':
      !state.switch.disabled?'DISABLE THE LIVE GRID':
      !state.exitOpen?'STOP THE REACTOR SENTINEL':'REACH THE EVAC GATE →';
    text(c,directive,32,59,13,'#7af7dc');
    this.lastFrame={camera:cam,actors:actors.length,bullets:state.bullets.length,
      footprintCount:footprints.length,relay:{x:relay.x,y:relay.y,near:relayNear,disabled:relay.disabled}};
    return this.lastFrame;
  }
}
