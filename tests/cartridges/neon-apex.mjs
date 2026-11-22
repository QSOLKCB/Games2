// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {fromCabinet} from '../play-cartridge.mjs';
import {timedPlay} from '../timed-play.mjs';

export async function play(options){
  await fromCabinet(options,'neon-apex','Neon Apex',async page=>{
    await page.keyboard.down('KeyW');await page.keyboard.down('KeyD');
    await page.waitForFunction(()=>neonApex.inspect().car.offset>.9 && neonApex.inspect().car.speed>31);
    await page.keyboard.up('KeyD');await page.keyboard.up('KeyW');
    await page.keyboard.down('KeyA');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await page.keyboard.up('KeyA');const parked=await page.evaluate(()=>neonApex.inspect().tick);
    await page.waitForTimeout(90);assert.equal(await page.evaluate(()=>neonApex.inspect().tick),parked);
    await page.locator('#pause').click();
    await page.waitForFunction(t=>neonApex.inspect().tick>t+4,parked);
  });
  await timedPlay(options,'neon-apex',async page=>{
    await page.keyboard.down('KeyW');await page.clock.runFor(33000);await page.keyboard.up('KeyW');
    const race=await page.evaluate(()=>neonApex.inspect());
    assert.equal(race.phase,'won');assert.equal(race.splits.length,3);
    await page.locator('#restart').click();await page.setViewportSize({width:320,height:720});
    await page.locator('[data-control="right"]').tap();await page.clock.runFor(160);
    assert.ok((await page.evaluate(()=>neonApex.inspect())).car.offset>0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.clock.runFor(22500);assert.equal((await page.evaluate(()=>neonApex.inspect())).phase,'lost');
  });
}
