// SPDX-License-Identifier: Apache-2.0
import {WIDTH, HEIGHT, RADIUS, RAILS, BUMPERS, flipper} from './world.js';

const cream='#f6dba5', gold='#f1b45f', teal='#73cdb7', blue='#568c99';
function circle(c,x,y,r,color,fill=true,width=1) {
  c.beginPath();c.arc(x,y,r,0,Math.PI*2);
  if(fill){c.fillStyle=color;c.fill();}else{c.strokeStyle=color;c.lineWidth=width;c.stroke();}
}
function line(c,points,color,width) {
  c.beginPath();c.moveTo(points[0],points[1]);c.lineTo(points[2],points[3]);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function word(c,text,x,y,color,size=9){
  c.fillStyle=color;c.font='bold '+size+'px monospace';c.textAlign='center';c.fillText(text,x,y);
}

function table(c){
  c.fillStyle='#10242e';c.fillRect(0,0,WIDTH,HEIGHT);
  c.fillStyle='#173542';c.fillRect(12,16,338,466);
  for(let i=0;i<95;i++)circle(c,18+(i*83)%321,24+(i*127)%440,i%5===0?1.3:.6,'#79a8a9');
  c.save();c.translate(156,224);c.rotate(-.34);
  for(const r of [52,96,127]){c.beginPath();c.ellipse(0,0,r,r*.48,0,0,Math.PI*2);c.strokeStyle='#39606b';c.lineWidth=1;c.stroke();}
  c.restore();
  circle(c,122,235,37,'#496c71');circle(c,118,228,32,'#6d8c83');circle(c,107,221,9,'#5d7b78');
  c.save();c.translate(122,235);c.rotate(-.45);c.beginPath();c.ellipse(0,0,57,8,0,0,Math.PI);
  c.strokeStyle=gold;c.lineWidth=4;c.stroke();c.restore();
  word(c,'A S T E R I O N',161,299,cream,16);
  word(c,'R E L A Y',161,316,teal,11);
  c.fillStyle='#213b46';c.fillRect(316,117,28,348);
  for(let y=178;y<385;y+=17)line(c,[326,y+6,333,y],blue,2);
  c.lineCap='round';
  for(const rail of RAILS){
    line(c,rail,'#0a1924',8);line(c,rail,blue,4);line(c,rail,'#b4d4bb',1);
  }
  for(const [x,y] of [[12,128],[309,112],[30,289],[285,287],[40,393],[283,392]]){
    circle(c,x,y,5,'#112a34');circle(c,x,y,3,gold);
  }
}

export function draw(c,s){
  c.save();c.scale(c.canvas.width/WIDTH,c.canvas.height/HEIGHT);
  table(c);
  for(let i=0;i<BUMPERS.length;i++){
    const p=BUMPERS[i],lit=Boolean(s.bank & (1<<i)),fresh=s.tick-s.lastHits[i]<15;
    circle(c,p.x,p.y+3,p.r+3,'#0c222d');circle(c,p.x,p.y,p.r+1,cream);
    circle(c,p.x,p.y,p.r-2,fresh?'#f2cd8b':lit?'#7fbda8':'#426d75');
    circle(c,p.x,p.y,p.r-6,'#193c47');circle(c,p.x,p.y,p.r-8,lit?gold:blue,false);
    word(c,p.label,p.x,p.y+4,cream,12);
  }
  for (let i=0;i<3;i++) {
    const x=134+i*24;
    circle(c,x,339,6,s.bank&(1<<i)?gold:'#38565e');circle(c,x,339,6,cream,false);
  }
  for(let i=0;i<2;i++){
    const arm=flipper(i,s.lifts[i]);
    line(c,arm,'#071923',15);line(c,arm,gold,12);line(c,arm,'#f8dea3',5);
    circle(c,arm[0],arm[1],7,'#193a45');circle(c,arm[0],arm[1],3,cream);
  }
  const spring=s.serving?s.charge*.13:0;
  line(c,[331,483,331,464+spring],cream,3);
  for(let y=0;y<4;y++)line(c,[324,467+spring+y*(3-spring/6),338,468+spring+y*(3-spring/6)],gold,2);
  if(s.phase!=='over'){
    const b=s.ball, y=b.y+(s.serving?spring:0);
    circle(c,b.x+2,y+3,RADIUS+1,'#0b202c');circle(c,b.x,y,RADIUS,cream);
    circle(c,b.x-1.8,y-2,2.3,'#fff9dc');
  }
  c.restore();
}
