// SPDX-License-Identifier: Apache-2.0
import {ROUTE, EXIT} from './world.js';

const W = 640, H = 320, floor = 246;
const ink = '#15272e', mint = '#a6fbd6', red = '#ff704f', cream = '#ffdeb5';
function poly(c, color, points) {
  c.fillStyle = color;
  c.beginPath();
  for (let i = 0; i < points.length; i += 2) i ? c.lineTo(points[i], points[i+1]) : c.moveTo(points[i], points[i+1]);
  c.closePath(); c.fill();
}
function line(c, color, width, x, y, tx, ty) {
  c.strokeStyle = color; c.lineWidth = width;
  c.beginPath(); c.moveTo(x,y); c.lineTo(tx,ty); c.stroke();
}
function label(c, text, x, y, color, size = 10) {
  c.fillStyle=color; c.font='bold '+size+'px monospace'; c.fillText(text,x,y);
}

function skyline(c, cam) {
  c.fillStyle='#e9ac83'; c.fillRect(0,0,W,216);
  c.fillStyle='#f8cc9f'; c.beginPath(); c.arc(460-cam*.06,76,49,0,2*Math.PI); c.fill();
  for (let i=0;i<14;i++) {
    const x=i*71-cam*.19-80, h=34+(i*37)%81;
    c.fillStyle=i%2?'#be8773':'#ca8f77'; c.fillRect(x,180-h,57,h+30);
    c.fillRect(x+10,168-h,15,20);
    for(let y=183-h;y<170;y+=10) {c.fillStyle='#e3a582';c.fillRect(x+29,y,21,2);}
  }
  for(let i=0;i<10;i++){
    const x=i*141-cam*.47-110;
    poly(c,'#5d6460',[x,211,x+9,115,x+20,115,x+28,211]);
    line(c,'#5d6460',5,x+12,119,x+84,83);
    line(c,'#70675c',3,x+12,134,x+80,88);
    line(c,'#665f57',2,x+76,88,x+76,133);
    c.fillStyle='#686b62';c.fillRect(x+65,132,22,12);
  }
  c.fillStyle='#344b4b';c.fillRect(0,203,W,34);
  for(let i=0;i<35;i++){const x=i*43-cam*.65;c.fillStyle=i%3?'#b89473':'#e0b08a';c.fillRect(x,211,25,6);}
  c.fillStyle='#253c40';c.fillRect(0,230,W,27);
  c.fillStyle='#edbb85';c.fillRect(0,243,W,3);
  c.fillStyle='#21373b';c.fillRect(0,247,W,H-247);
  for(let i=-1;i<36;i++){const x=i*48-cam%48;line(c,'#344b4c',1,x,247,x-43,320);}
  for(const y of [253,268,292,315])line(c,'#384f50',1,0,y,W,y);
}

function machine(c,x,face,foe,s,reduced) {
  c.save(); c.translate(Math.round(x),floor); c.scale(face,1);
  const boss=foe?.boss, enemy=Boolean(foe), attack=enemy?foe.wind:s.cut, guard=enemy?foe.guard:s.guardAge;
  const body=enemy?(foe.flash?'#fff3cf':boss?'#a54c36':'#e87e51'):'#347371';
  if(boss)c.scale(1.25,1.25);
  c.fillStyle='rgba(8,22,26,.4)';c.beginPath();c.ellipse(0,1,20,4,0,0,2*Math.PI);c.fill();
  const stride=!reduced&&!enemy&&!guard&&s.body.vx?Math.round(Math.sin(s.tick*.3)*5):0;
  poly(c,ink,[-12,-30,-2,-27,-5-stride,-5,-9-stride,0,-20-stride,0,-14-stride,-11]);
  poly(c,ink,[4,-27,13,-27,16+stride,-8,23+stride,-4,22+stride,0,10+stride,0,5+stride,-10]);
  poly(c,body,[-16,-53,-6,-59,9,-56,17,-46,9,-25,-8,-24,-14,-34]);
  poly(c,ink,[-15,-50,9,-48,8,-39,-13,-37]);
  poly(c,enemy?'#c38e67':mint,[-9,-50,4,-50,11,-47,-4,-47]);
  poly(c,ink,[-10,-69,1,-76,13,-71,12,-61,6,-55,-8,-59]);
  line(c,enemy?'#ffae65':mint,3,0,-66,13,-68);
  if (boss) {
    poly(c,cream,[-11,-68,-20,-82,-9,-77,-2,-70]);
    poly(c,red,[-17,-47,-24,-53,-28,-33,-19,-29]);
  }
  if(!enemy) {
    const tail=reduced?0:Math.sin(s.tick*.19)*2;
    poly(c,mint,[-6,-61,-22,-58+tail,-37,-64+tail,-19,-53,-5,-56]);
  }
  if (guard && !attack) {
    poly(c,enemy?'#8d4c39':'#488f84',[11,-53,23,-48,22,-24,14,-18,10,-34]);
    line(c,enemy?cream:mint,2,22,-46,20,-25);
  } else {
    const tip=attack ? (enemy?19:56) : 34, tipY=attack ? (enemy?-83:-48) : -15;
    line(c,ink,7,0,-44,17,-35);
    line(c,cream,3,17,-35,tip,tipY);
  }
  if(enemy && foe.wind){
    const total=boss?19:26;
    poly(c,'#f8ca91',[-16,-84,0,-98,16,-84,0,-73]);
    label(c,'!',-4,-81,ink,13);
    c.fillStyle=ink;c.fillRect(-13,-72,26,3);c.fillStyle=red;c.fillRect(-13,-72,26*(1-foe.wind/total),3);
  }
  if(!enemy && s.cut && !reduced){
    c.beginPath();c.arc(8,-40,36,-1.1,.45);c.strokeStyle=cream;c.lineWidth=2;c.stroke();
  }
  c.restore();
}

let backdrop, lastCam;
function background(c,cam) {
  if(!backdrop) { backdrop=document.createElement('canvas'); backdrop.width=W; backdrop.height=H; }
  if(cam!==lastCam) { skyline(backdrop.getContext('2d'),cam); lastCam=cam; }
  c.drawImage(backdrop,0,0);
}
export function draw(c,s,reduced=false) {
  const cam=Math.max(0,Math.min(EXIT-W+75,s.body.x-190));
  c.save();c.scale(c.canvas.width/W,c.canvas.height/H);
  background(c,cam);
  for(const [i,sector] of ROUTE.entries()){
    const x=sector.gate-cam;
    if(x < -90 || x > W+25)continue;
    c.fillStyle='#334749';c.fillRect(x,71,13,175);c.fillRect(x-33,71,54,19);
    label(c,'0'+(i+1),x-24,85,cream,11);
    if(i===s.sector && s.foes.some(f=>f.hp))for(let y=98;y<240;y+=11){c.fillStyle=red;c.fillRect(x+4,y,4,6);}
  }
  for(const f of s.foes)if(f.hp){
    machine(c,f.x-cam,f.face,f,s,reduced);
    const x=f.x-cam-14, y=f.boss?134:159;
    c.fillStyle=ink;c.fillRect(x,y,28,3);c.fillStyle=red;c.fillRect(x,y,28*f.hp/f.maxHP,3);
  }
  if(s.dash && !reduced){
    for(let i=0;i<3;i++) line(c,mint,2,s.body.x-cam-s.dashFace*21,211+i*6,s.body.x-cam-s.dashFace*(38+i*5),211+i*6);
  }
  machine(c,s.body.x-cam,s.face,null,s,reduced);
  if(s.riposte) label(c,'RIPOSTE',s.body.x-cam-21,155,mint);
  if(s.impact && !reduced){
    const t=s.tick-s.impact.tick,x=s.impact.x-cam;
    if(t<11) for(let i=0;i<6;i++){
      const a=(i*1.05)+.4;line(c,cream,2,x+Math.cos(a)*t*1.4,208+Math.sin(a)*t*1.4,x+Math.cos(a)*(5+t*2),208+Math.sin(a)*(5+t*2));
    }
  }
  c.fillStyle=ink;c.fillRect(16,15,143,27);
  label(c,'LINE 0'+(s.sector+1)+' / '+ROUTE[s.sector].name.toUpperCase(),24,32,cream,10);
  if(!s.foes.some(f=>f.hp))label(c,'EXIT  >>',Math.min(W-82,Math.max(25,EXIT-cam-35)),216,mint,14);
  c.restore();
}
