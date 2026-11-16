// SPDX-License-Identifier: Apache-2.0
// Original Strike Pixel geometry. Metres, +Y up, -Z forward.
const box=(id,min,max,color,material='stone')=>({id,box:{min,max},color,material});
const navy=[.075,.14,.2],teal=[.12,.39,.43],light=[.24,.59,.58],amber=[1,.57,.16];
const solids=[
  box('yard-floor',[-18,-1,-18],[18,0,18],[.13,.2,.25]),
  box('north-wall',[-18,0,-18],[18,4,-17],navy),
  box('south-wall',[-18,0,17],[18,4,18],navy),
  box('west-wall',[-18,0,-17],[-17,4,17],teal),
  box('east-wall',[17,0,-17],[18,4,17],teal),
  box('relay-plinth',[-1.7,0,-4.3],[1.7,.6,-.9],teal),
  box('relay-tower',[-1.2,.6,-3.8],[1.2,4.6,-1.4],navy),
  box('east-baffle',[5,0,-2],[8,1.45,0],light),
  box('west-baffle',[-8,0,4],[-5,1.35,6],teal),
  box('north-crate',[-5,0,-11],[-2,1.1,-8],[.42,.31,.18],'wood'),
  box('east-crate',[10,0,8],[12,1.1,10],[.42,.31,.18],'wood'),
  box('south-fin',[5,0,10],[6,2.3,12],navy),
  box('west-fin',[-13,0,8],[-12,2.1,12],navy),
  box('north-fin',[5,0,-14],[6,2.1,-10],teal),
  box('relay-deck',[-14,0,-5],[-8,1.5,0],teal),
  box('deck-back',[-14,1.5,-5],[-8,2.25,-4.7],navy),
  box('deck-west',[-14,1.5,-5],[-13.7,2.25,0],navy)
];
// Six shallow 25cm steps make the raised deck accessible without a jump exploit.
for(let i=0;i<6;i++)solids.push(box('deck-step-'+i,[-11,0,3-i*.5],[-8,.25*(i+1),3.5-i*.5],i%2?light:teal));
const decor=[
  // Thin painted route markings are visual only, never invisible collision.
  box('east-lane-paint',[13.8,.002,-14],[14,.01,14],light),
  box('west-lane-paint',[-15,.002,-14],[-14.8,.01,14],light),
  box('launch-paint',[-4,.002,14],[4,.01,14.15],amber),
  box('relay-paint',[-3,.002,-5.5],[3,.01,-5.35],amber),
  box('east-flank-paint',[9,.002,2.2],[15,.01,2.35],light),
  box('relay-light',[-1.24,3.25,-3.84],[1.24,3.65,-1.36],amber),
  box('relay-cap',[-1.5,4.6,-4.1],[1.5,4.85,-1.1],light),
  box('north-trim',[-17,3.1,-17.04],[17,3.35,-16.98],light),
  box('east-trim',[16.98,3.1,-17],[17.04,3.35,17],amber),
  box('west-trim',[-17.04,3.1,-17],[-16.98,3.35,17],light)
];
function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
export const ARENA=freeze({id:'sunrelay-yard',title:'SUNRELAY YARD',size:34,solids,decor,
  playerSpawn:[0,0,12],playerYaw:-Math.atan2(6,8),botSpawns:[[6,0,4],[-10,0,-9],[11,0,-10]],
  pickups:[{id:'south-ammo',kind:'ammo',position:[-3,0,10],amount:24,cooldown:600},
    {id:'east-health',kind:'health',position:[13,0,2],amount:45,cooldown:720},
    {id:'deck-ammo',kind:'ammo',position:[-10,1.5,-2],amount:24,cooldown:600},
    {id:'north-health',kind:'health',position:[0,0,-13],amount:45,cooldown:720}]});
