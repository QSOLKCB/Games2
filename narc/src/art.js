// SPDX-License-Identifier: Apache-2.0
// Original, locally generated RGBA assets from the pinned VANILLAJS Sprite Foundry.
import {generateSprite,rgbaFrame} from '../vendor/vanillajs/modules/sprite2d/index.js';
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
export function generateViceSprites(){
  return Object.freeze({
    agent:generateSprite(spriteRecipe('character',104,swatches.agent),{name:'Circuit Vice response agent'}),
    striker:generateSprite(spriteRecipe('enemy',517,swatches.striker),{name:'Circuit Vice close pursuer'}),
    shooter:generateSprite(spriteRecipe('character',718,swatches.shooter),{name:'Circuit Vice emitter'}),
    boss:generateSprite(spriteRecipe('enemy',991,swatches.boss),{name:'Circuit Vice reactor sentinel'}),
    civilian:generateSprite(spriteRecipe('character',203,swatches.civilian),{name:'Circuit Vice stranded operator'})
  });
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
