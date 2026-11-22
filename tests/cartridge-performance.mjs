// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// Measure the packaged Canvas draw call separately from refresh scheduling.
export async function measureDraw(page, slug, artifacts) {
  const metrics = await page.evaluate(async () => {
    const {draw} = await import('./src/view.js');
    const {newRun,step} = await import('./src/world.js');
    const source=document.querySelector('canvas'), target=document.createElement('canvas');
    target.width=source.width; target.height=source.height;
    const c=target.getContext('2d'), state=newRun(), batches=[];
    for(let batch=0;batch<26;batch++){
      const start=performance.now();
      for(let i=0;i<12;i++){
        step(state,{right:batch%4<2,left:batch%4>=2,attack:true,launch:batch===0});
        draw(c,state,false);
      }
      // Include a readback per batch to flush the Canvas command queue.
      c.getImageData(target.width>>1,target.height>>1,1,1);
      if(batch>=2)batches.push((performance.now()-start)/12);
    }
    batches.sort((a,b)=>a-b);
    return {frames:288,canvas:[target.width,target.height],medianMs:batches[11],p95Ms:batches[22]};
  });
  assert.ok(Number.isFinite(metrics.p95Ms) && metrics.p95Ms>=metrics.medianMs);
  await writeFile(join(artifacts, slug + '-canvas.json'),JSON.stringify(metrics,null,2)+'\n');
  console.log(slug+' packaged Canvas '+JSON.stringify(metrics));
}
