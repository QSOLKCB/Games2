// SPDX-License-Identifier: Apache-2.0
import {HALF_ROAD, ROAD, SPLITS, SECTORS} from './world.js';

const W=720,H=400,SKY=155,FOCAL=295;
const palette=[
  ['#322642','#d9767f','#ffbe82','#86677a','#4b415c','#a36978'],
  ['#46273d','#d77966','#f4b383','#985d65','#65394c','#ab655c'],
  ['#272b4e','#ad7090','#ffd396','#7b748e','#4b4a69','#716479'],
];
function shape(c,color,...points){
  c.fillStyle=color;c.beginPath();c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.closePath();c.fill();
}
function line(c,color,width,x,y,tx,ty){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();
}
function label(c,text,x,y,size,color,align='left'){
  c.fillStyle=color;c.textAlign=align;c.font='bold '+size+'px monospace';c.fillText(text,x,y);
}
function sky(c,sector){
  const [top,middle,bottom,far,near,ground]=palette[sector];
  const light=c.createLinearGradient(0,0,0,SKY+32);
  light.addColorStop(0,top);light.addColorStop(.58,middle);light.addColorStop(1,bottom);
  c.fillStyle=light;c.fillRect(0,0,W,SKY+42);
  c.save();c.beginPath();c.arc(506,88,47,0,Math.PI*2);c.clip();
  c.fillStyle='#ffdf9b';c.fillRect(450,32,110,61);
  for(let y=94;y<138;y+=6){c.fillRect(450,y,110,4);}
  c.restore();
  shape(c,far,0,130,72,99,101,113,175,70,228,104,292,95,370,139,434,111,496,119,543,87,605,123,654,110,720,133,720,182,0,182);
  shape(c,near,0,143,68,134,112,152,163,124,197,129,226,116,308,150,411,144,467,132,544,144,592,127,647,135,720,119,720,182,0,182);
  for(let n=0;n<21;n++){
    const x=n*37+4,h=4+(n*19+sector*7)%23;
    c.fillStyle=near;c.fillRect(x,SKY-h,14+n%3*4,h+8);
    c.fillStyle=bottom;c.fillRect(x+3,SKY-h+3,3,2);
  }
  c.fillStyle=ground;c.fillRect(0,SKY+2,W,H-SKY);
}
// Integrate lateral curvature along the visible strip. Physics and art sample the same course.
function roadway(s) {
  const rows=[];
  let bend=0,slope=0,previous=0;
  for(let i=0;i<=68;i++){
    const z=2.7*Math.pow(103,i/68), span=z-previous;
    const k=ROAD.sample(Math.max(0,s.distance-4.6+previous+span/2));
    bend+=slope*span+k*span*span/2;slope+=k*span;
    const scale=FOCAL/z;
    rows.push({z,scale,y:SKY+670/z,x:W/2+(bend-s.car.offset*.78)*scale});
    previous=z;
  }
  return rows;
}
function band(c,a,b,lo,hi,color) {
  shape(c,color,a.x+lo*a.scale,a.y,a.x+hi*a.scale,a.y,b.x+hi*b.scale,b.y,b.x+lo*b.scale,b.y);
}
function section(c,a,b,s){
  const d=s.distance-4.6+(a.z+b.z)/2,stripe=Math.floor(d/5)%2===0;
  band(c,a,b,-8,8,stripe?'#b48b84':'#ab817f');
  band(c,a,b,-5.66,5.66,stripe?'#f4cb9d':'#c56572');
  band(c,a,b,-HALF_ROAD,HALF_ROAD,stripe?'#39374a':'#3c394b');
  for(const side of [-1,1])band(c,a,b,side*4.96-.045,side*4.96+.045,'#dfbfa2');
  if(Math.floor(d/7)%2===0)for(const x of [-1.72,1.72])band(c,a,b,x-.055,x+.055,'#e1c1ad');
}
function project(rows,z){
  if(z<rows[0].z || z>rows.at(-1).z)return null;
  const i=rows.findIndex(r=>r.z>=z);
  if(!i)return rows[0];
  const a=rows[i-1],b=rows[i],t=(z-a.z)/(b.z-a.z);
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,scale:a.scale+(b.scale-a.scale)*t};
}
function coupe(c,x,y,size,body,steering=0){
  c.save();c.translate(x,y);c.scale(size,size);c.transform(1,0,-steering*.075,1,0,0);
  c.fillStyle='#282539';c.beginPath();c.ellipse(0,1,49,7,0,0,2*Math.PI);c.fill();
  c.fillStyle='#211f30';c.fillRect(-44,-13,12,13);c.fillRect(32,-13,12,13);
  shape(c,'#25283e',-43,-9,-42,-24,-29,-31,-17,-47,19,-47,31,-31,43,-25,45,-9,38,-4,-36,-4);
  shape(c,body,-41,-13,-39,-24,-27,-29,-16,-44,18,-44,30,-29,40,-23,42,-12,35,-8,-34,-8);
  shape(c,'#30455b',-22,-30,-13,-41,15,-41,24,-30);
  shape(c,'#b1bad1',-15,-40,-11,-40,-19,-31,-22,-31);
  shape(c,'#ece0b6',-34,-26,32,-26,29,-23,-35,-23);
  shape(c,'#5a3d54',-40,-17,-31,-15,32,-15,40,-18,39,-9,-38,-9);
  c.fillStyle='#ff766b';c.fillRect(-36,-17,17,4);c.fillRect(20,-17,17,4);
  c.fillStyle='#f5d6a3';c.fillRect(-7,-13,14,4);
  line(c,'#241f30',3,-36,-28,38,-28);
  c.restore();
}
function marker(c,p,side) {
  const x=p.x+side*6.9*p.scale, h=p.scale*1.45;
  line(c,'#3b354d',Math.max(1,p.scale*.12),x,p.y,x,p.y-h);
  line(c,'#ffdb9c',Math.max(1,p.scale*.17),x,p.y-h,x,p.y-h*.72);
}
function gantry(c,p,name){
  const half=5.8*p.scale,h=3.2*p.scale;
  for(const side of [-1,1])line(c,'#313045',Math.max(1,p.scale*.12),p.x+half*side,p.y,p.x+half*side,p.y-h);
  c.fillStyle='#322b42';c.fillRect(p.x-half,p.y-h,half*2,p.scale*.64);
  if(p.scale>3)label(c,name,p.x,p.y-h+p.scale*.46,Math.max(5,p.scale*.4),'#ffdfa7','center');
}
export function draw(c,s) {
  c.save();c.scale(c.canvas.width/W,c.canvas.height/H);sky(c,s.sector);
  const rows=roadway(s);
  for(let i=rows.length-2;i>=0;i--)section(c,rows[i],rows[i+1],s);
  const objects=[];
  for(let d=Math.ceil((s.distance-1)/20)*20;d<s.distance+265;d+=20){
    const z=d-s.distance+4.6;
    objects.push({z,paint:p=>{marker(c,p,-1);marker(c,p,1);}});
  }
  for(const [i,d] of SPLITS.entries())objects.push({z:d-s.distance+4.6,paint:p=>gantry(c,p,i===2?'FINISH':'CHECKPOINT')});
  for(const r of s.rivals)objects.push({z:r.distance-s.distance+4.6,
    paint:p=>coupe(c,p.x+r.offset*p.scale,p.y,p.scale*.021,r.color)});
  objects.push({z:4.6,paint:p=>coupe(c,p.x+s.car.offset*p.scale,p.y,p.scale*.026,s.flash?'#ffe0a0':'#ffad65',s.car.steering)});
  for(const obj of objects.sort((a,b)=>b.z-a.z)){const p=project(rows,obj.z);if(p)obj.paint(p);}
  c.fillStyle='#29273b';c.fillRect(14,14,172,25);
  label(c,'0'+(s.sector+1)+'  /  '+SECTORS[s.sector].toUpperCase(),24,31,12,'#ffdeaa');
  c.restore();
}
