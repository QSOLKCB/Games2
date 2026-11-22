// SPDX-License-Identifier: Apache-2.0
import {PORT,RELAYS,WIDTH,HEIGHT,SCAN_RANGE,position,target,inBand,tunePhase,range} from './world.js';

const W=720,H=400,sea='#102935',foam='#a8e5d2',ivory='#ffe5a4',amber='#ffa575';
const clip=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function ring(c,x,y,r,col,lw=1,fill=false){
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);
  if(fill){c.fillStyle=col;c.fill();}else{c.strokeStyle=col;c.lineWidth=lw;c.stroke();}
}
function path(c,col,width,...pts){
  c.beginPath();c.moveTo(pts[0],pts[1]);
  for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);
  if(width){c.strokeStyle=col;c.lineWidth=width;c.stroke();}
  else{c.closePath();c.fillStyle=col;c.fill();}
}
function label(c,text,x,y,color,size=10,align='left'){
  c.fillStyle=color;c.textAlign=align;c.font='bold '+size+'px monospace';c.fillText(text,x,y);
}
let planet;
function planetPlate(){
  if(planet)return planet;
  planet=document.createElement('canvas');planet.width=580;planet.height=580;
  const c=planet.getContext('2d'),px=290,py=290;
  const nebula=c.createRadialGradient(px,py,5,px,py,290);
  nebula.addColorStop(0,'#405253');nebula.addColorStop(1,sea);
  c.fillStyle=nebula;c.fillRect(0,0,580,580);
  ring(c,px,py,48,'#80968a',1,true);
  c.save();c.beginPath();c.arc(px,py,48,0,Math.PI*2);c.clip();
  for(let k=0;k<9;k++)path(c,k%2?'#658783':'#a7ac85',3,px-58,py-48+k*12,px+55,py-23+k*12);
  c.restore();
  c.save();c.translate(px,py);c.rotate(-.32);
  c.beginPath();c.ellipse(0,0,84,14,0,0,Math.PI*2);c.strokeStyle='#c9aa7c';c.lineWidth=4;c.stroke();c.restore();
  return planet;
}
function field(c,ox,oy,reduced){
  c.fillStyle=sea;c.fillRect(0,0,W,H);
  const px=594-ox*.16,py=104-oy*.13;
  c.drawImage(planetPlate(),px-290,py-290);
  for(let i=0;i<143;i++){
    const depth=reduced ? .26 : (i%4+1)*.13;
    const x=((i*179+21-ox*depth)%W+W)%W,y=((i*i*47+i*11-oy*.24)%H+H)%H;
    if((px-x)**2+(py-y)**2<49**2)continue;
    c.fillStyle=i%4?'#749696':ivory;c.fillRect(x,y,i%8?1:2,i%8?1:2);
  }
}
function port(c,x,y){
  c.save();c.translate(x,y);
  ring(c,0,0,41,'#739697',1);
  for(let i=0;i<4;i++){
    c.rotate(Math.PI/2);
    path(c,'#537981',0,-12,-12,-9,-32,8,-32,13,-11);
    c.fillStyle=ivory;c.fillRect(-6,-29,12,3);
  }
  ring(c,0,0,17,'#122e38',1,true);ring(c,0,0,11,foam,2);
  label(c,'PORT LUMEN',0,57,foam,10,'center');c.restore();
}
function relay(c,x,y,relay,active,done,echoes){
  c.save();c.translate(x,y);
  const col=done?foam:active?ivory:'#6b9395';
  if(active){c.setLineDash([4,9]);ring(c,0,0,SCAN_RANGE,'#78998b');c.setLineDash([]);}
  path(c,'#233f48',0,-18,10,0,-22,18,10,0,22);path(c,col,2,-18,10,0,-22,18,10,0,22,-18,10);
  ring(c,0,0,5,col,1,true);path(c,col,2,-22,-4,-29,-12,-30,-23);path(c,col,2,22,-4,29,-12,30,-23);
  label(c,relay.mark+' / '+relay.name.toUpperCase(),0,40,col,10,'center');
  if(active)for(let i=0;i<2;i++)ring(c,-5+i*10,29,2.6,col,1,i<echoes);
  c.restore();
}
function ship(c,x,y,heading,thrust,hit){
  c.save();c.translate(x,y);c.rotate(heading);
  if(thrust)path(c,'#77cbbb',0,-12,-5,-28,0,-12,5);
  path(c,'#071b28',0,23,0,-13,-15,-7,-3,-18,0,-7,4,-13,16);
  path(c,hit?'#ffa575':ivory,0,19,0,-11,-12,-6,-3,-13,0,-6,3,-11,12);
  path(c,'#548b8d',0,11,0,-6,-4,-1,0,-6,4);c.restore();
}
export function draw(c,s,reduced=false) {
  const player=position(s),ox=clip(player.x-W/2,0,WIDTH-W),oy=clip(player.y-H/2,0,HEIGHT-H);
  c.save();c.scale(c.canvas.width/W,c.canvas.height/H);field(c,ox,oy,reduced);
  c.save();c.translate(-ox,-oy);
  c.strokeStyle='#496774';c.setLineDash([3,9]);c.strokeRect(3,3,WIDTH-6,HEIGHT-6);c.setLineDash([]);
  port(c,PORT.x,PORT.y);
  RELAYS.forEach((r,i)=>relay(c,r.x,r.y,r,i===s.recovered,i<s.recovered,s.echoes));
  for(const d of s.drones){
    if(d.x<ox-20||d.x>ox+W+20||d.y<oy-20||d.y>oy+H+20)continue;
    const color=d.silent?'#658384':amber;
    path(c,color,2,d.x-10,d.y,d.x-4,d.y-9,d.x+5,d.y-6,d.x+11,d.y,d.x+4,d.y+8,d.x-4,d.y+6,d.x-10,d.y);
    path(c,color,2,d.x-15,d.y+4,d.x-11,d.y+11,d.x-3,d.y+13);
    if(!d.silent){
      ring(c,d.x,d.y,3,ivory,1,true);
      if(!reduced)ring(c,d.x,d.y,12+(s.tick+d.id*8)%30/5,'#976e60');
    }
  }
  if(s.ring){
    const r=reduced?29:s.ring.age*10;
    ring(c,s.ring.x,s.ring.y,r,s.ring.harmonic?ivory:foam,2);
    if(s.ring.harmonic)ring(c,s.ring.x,s.ring.y,r+4,ivory);
  }
  ship(c,player.x,player.y,s.heading,Math.abs(s.ship.vx)+Math.abs(s.ship.vy)>12,s.invulnerable>65);
  if(s.shielding){
    ring(c,player.x,player.y,34,foam,2);
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3+(reduced?0:s.tick*.025);
      c.beginPath();c.arc(player.x,player.y,38,a,a+.65);c.strokeStyle=ivory;c.lineWidth=2;c.stroke();
    }
  }
  c.restore();
  const t=target(s),tx=t.x-ox,ty=t.y-oy,px=player.x-ox,py=player.y-oy;
  if(tx<32||tx>W-32||ty<42||ty>H-32){
    const dx=tx-px,dy=ty-py;
    const k=Math.min(dx>0?(W-24-px)/dx:dx<0?(24-px)/dx:Infinity,dy>0?(H-22-py)/dy:dy<0?(45-py)/dy:Infinity);
    c.save();c.translate(px+k*dx,py+k*dy);c.rotate(Math.atan2(dy,dx));path(c,ivory,0,8,0,-5,-5,-2,0,-5,5);c.restore();
  }
  c.fillStyle='#102834';c.fillRect(12,12,196,43);label(c,'BEARING / '+t.name.toUpperCase(),21,29,ivory);
  const near=range(player,t)<=SCAN_RANGE,locked=inBand(tunePhase(s.tick+1,s.recovered));
  label(c,s.recovered===3?'RETURN TO PORT':!near?Math.round(range(player,t))+' UNITS':
    s.shielding?'DEFLECTOR UP':s.cooldown?'PULSE RECHARGING':locked?'LOCK / PULSE NOW':'RELAY IN RANGE',21,45,foam);
  const mx=W-122,my=14,mw=108,mh=60;
  c.fillStyle='#0e2630';c.fillRect(mx,my,mw,mh);c.strokeStyle='#688b8b';c.strokeRect(mx,my,mw,mh);
  const chart=p=>[mx+4+p.x/WIDTH*(mw-8),my+4+p.y/HEIGHT*(mh-8)];
  const dot=(p,col,r)=>ring(c,...chart(p),r,col,1,true);
  const stations=[PORT,...RELAYS,PORT];
  for(let i=0;i<4;i++)path(c,i<s.recovered?'#8fbbac':'#3f6266',1,...chart(stations[i]),...chart(stations[i+1]));
  ring(c,...chart(t),4.8,ivory);
  dot(PORT,foam,2.3);RELAYS.forEach((r,i)=>dot(r,i===s.recovered?ivory:'#6a8785',2.4));dot(player,'#fff4d7',3);
  c.restore();
}
