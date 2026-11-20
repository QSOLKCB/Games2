// SPDX-License-Identifier: Apache-2.0
// Original, locally generated RGBA assets from the pinned VANILLAJS Sprite Foundry.
import {generateSprite,rgbaFrame,paintSpriteStroke} from '../vendor/vanillajs/modules/sprite2d/index.js';
const swatches=Object.freeze({
  agent:[[0,0,0,0],[29,54,77,255],[52,199,216,255],[242,210,125,255],[255,255,255,255]],
  striker:[[0,0,0,0],[81,35,77,255],[248,76,113,255],[255,174,89,255],[255,235,200,255]],
  shooter:[[0,0,0,0],[29,46,79,255],[162,116,244,255],[75,232,231,255],[250,232,196,255]],
  boss:[[0,0,0,0],[34,34,62,255],[252,86,147,255],[255,194,93,255],[255,247,221,255]],
  civilian:[[0,0,0,0],[47,78,71,255],[117,249,191,255],[243,227,175,255],[255,255,255,255]]
});
export function spriteRecipe(kind,seed,palette){
  return {kind,size:16,seed,symmetry:true,frameCount:4,palette};
}
// Add authored stance pixels with the immutable native Sprite Foundry paint API;
// movement/attacks select frames at draw time and never mutate source projects.
function accentFrames(project,kind){
  let result=project;
  for(let frame=0;frame<4;frame++){
    const shift=[0,1,0,-1][frame],palette=kind==='civilian'?3:kind==='boss'?4:3;
    const points=[{x:5+shift,y:8},{x:6+shift,y:8},{x:9-shift,y:8},{x:10-shift,y:8}];
    result=paintSpriteStroke(result,frame,points,palette);
    // Boot positions vary independently of torso colour, exposing a real gait.
    result=paintSpriteStroke(result,frame,[{x:5+shift,y:13},{x:10-shift,y:13}],2);
  }
  return result;
}
export function generateViceSprites(){
  const defs=[
    ['agent','character',104,'Circuit Vice response agent'],
    ['striker','enemy',517,'Circuit Vice close pursuer'],
    ['shooter','character',718,'Circuit Vice emitter'],
    ['boss','enemy',991,'Circuit Vice reactor sentinel'],
    ['civilian','character',203,'Circuit Vice stranded operator']
  ];
  return Object.freeze(Object.fromEntries(defs.map(([key,kind,seed,name])=>
    [key,accentFrames(generateSprite(spriteRecipe(kind,seed,swatches[key]),{name}),key)])));
}
export function rasterViceSprites(documentRef=document){
  const result={},projects=generateViceSprites();
  for(const [key,project] of Object.entries(projects)){
    result[key]=project.frames.map((frame,i)=>{
      const cvs=documentRef.createElement('canvas');cvs.width=cvs.height=16;
      const ctx=cvs.getContext('2d');if(!ctx)throw Error('2D asset context unavailable');
      const bytes=new Uint8ClampedArray(rgbaFrame(project,i));
      ctx.putImageData(new ImageData(bytes,16,16),0,0);
      return cvs;
    });
  }
  return result;
}
