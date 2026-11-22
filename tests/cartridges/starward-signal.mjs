// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {fromCabinet} from '../play-cartridge.mjs';
import {watchSound,timedPlay,setKeys} from '../timed-play.mjs';
import {position,target} from '../../starward-signal/src/world.js';

export async function play(options){
  await fromCabinet(options,'starward-signal','Starward Signal',async page=>{
    await page.keyboard.down('KeyD');await page.keyboard.down('Space');
    await page.waitForFunction(()=>starwardSignal.inspect().ship.x>3500 && starwardSignal.inspect().casts>0);
    await page.keyboard.up('Space');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await page.keyboard.up('KeyD');const parked=await page.evaluate(()=>starwardSignal.inspect().tick);
    await page.waitForTimeout(90);assert.equal(await page.evaluate(()=>starwardSignal.inspect().tick),parked);
    await page.locator('#pause').click();await page.waitForFunction(t=>starwardSignal.inspect().tick>t+4,parked);
  });
  await timedPlay(options,'starward-signal',async page=>{
    await watchSound(page,'ArrayAudio');
    const held=new Set();
    for(let i=0;i<220;i++){
      const s=await page.evaluate(()=>starwardSignal.inspect());if(s.phase!=='playing')break;
      const p=position(s),t=target(s),desired=['Space'];
      if(t.x-p.x>12)desired.push('KeyD');if(t.x-p.x< -12)desired.push('KeyA');
      if(t.y-p.y>12)desired.push('KeyS');if(t.y-p.y< -12)desired.push('KeyW');
      await setKeys(page,held,desired);await page.clock.runFor(110);
    }
    await setKeys(page,held,[]);
    const flight=await page.evaluate(()=>starwardSignal.inspect());
    assert.equal(flight.phase,'won');assert.equal(flight.recovered,3);assert.ok(flight.cleared>0);
    assert.deepEqual(await page.evaluate(()=>window.lastSounds()),['quiet','dock']);
    await page.locator('#restart').click();await page.setViewportSize({width:320,height:720});
    await page.locator('[data-control="ping"]').tap();await page.clock.runFor(160);
    assert.equal((await page.evaluate(()=>starwardSignal.inspect())).casts,1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  });
}
