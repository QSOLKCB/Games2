// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {measureDraw} from '../cartridge-performance.mjs';
import {fromCabinet} from '../play-cartridge.mjs';
import {watchSound,timedPlay} from '../timed-play.mjs';

export async function play(options){
  let measured=false;
  await fromCabinet(options,'neon-apex','Neon Apex',async page=>{
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'true');
    await page.locator('#motion').click();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'false');
    await page.keyboard.down('KeyW');await page.keyboard.down('KeyD');
    await page.waitForFunction(()=>neonApex.inspect().car.offset>.9 && neonApex.inspect().car.speed>31);
    await page.keyboard.down('Space');await page.waitForFunction(()=>neonApex.inspect().boosts===1);
    await page.keyboard.up('Space');
    await page.keyboard.up('KeyD');await page.keyboard.up('KeyW');
    await page.keyboard.down('KeyA');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await page.keyboard.up('KeyA');const parked=await page.evaluate(()=>neonApex.inspect().tick);
    await page.waitForTimeout(90);assert.equal(await page.evaluate(()=>neonApex.inspect().tick),parked);
    await page.locator('#pause').click();
    await page.waitForFunction(t=>neonApex.inspect().tick>t+4,parked);
    if(!measured){await measureDraw(page,'neon-apex',options.artifacts,{throttle:true,boost:true});measured=true;}
  });
  await timedPlay(options,'neon-apex',async page=>{
    await watchSound(page,'CoastAudio');
    await page.keyboard.down('KeyW');await page.clock.runFor(33000);await page.keyboard.up('KeyW');
    const race=await page.evaluate(()=>neonApex.inspect());
    assert.equal(race.phase,'won');assert.equal(race.splits.length,3);
    assert.deepEqual(await page.evaluate(()=>window.lastSounds()),['quiet','finish']);
    assert.equal(await page.locator('#best').textContent(),(race.tick/60).toFixed(2)+' s');
    assert.ok((await page.locator('#splits li span').allTextContents()).every(time=>time.endsWith(' s')));
    await page.reload();await page.locator('html[data-ready=true]').waitFor();await page.clock.runFor(48);
    assert.equal(await page.locator('#best').textContent(),(race.tick/60).toFixed(2)+' s');
    await watchSound(page,'CoastAudio');await page.locator('#start').click();
    await page.setViewportSize({width:320,height:720});
    await page.keyboard.down('KeyW');await page.locator('[data-control="boost"]').tap();await page.clock.runFor(160);
    assert.equal((await page.evaluate(()=>neonApex.inspect())).boosts,1);await page.keyboard.up('KeyW');
    await page.locator('[data-control="right"]').tap();await page.clock.runFor(160);
    assert.ok((await page.evaluate(()=>neonApex.inspect())).car.offset>0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.clock.runFor(22500);assert.equal((await page.evaluate(()=>neonApex.inspect())).phase,'lost');
    assert.deepEqual(await page.evaluate(()=>window.lastSounds()),['quiet','loss']);
  });
}
