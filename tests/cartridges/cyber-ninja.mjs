// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {measureDraw} from '../cartridge-performance.mjs';
import {fromCabinet} from '../play-cartridge.mjs';

export async function play(options) {
  await fromCabinet(options, 'cyber-ninja', 'Blade Circuit', async page => {
    const inspect = () => page.evaluate(() => bladeCircuit.inspect());
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => bladeCircuit.inspect().body.x > 110);
    await page.keyboard.up('KeyD');
    await page.keyboard.down('KeyJ');
    await page.waitForFunction(() => bladeCircuit.inspect().score >= 20);
    await page.keyboard.up('KeyJ');
    assert.ok((await inspect()).foes.some(f => f.hp < f.maxHP));
    await page.keyboard.down('KeyD');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    const paused = await inspect();
    await page.keyboard.up('KeyD');
    await page.waitForTimeout(90);
    assert.equal((await inspect()).tick, paused.tick);
    await page.locator('#pause').click();
    await page.waitForFunction(t => bladeCircuit.inspect().tick > t + 3, paused.tick);
    assert.equal((await inspect()).body.x, paused.body.x);
  });
  const context = await options.browser.newContext({viewport:{width:1000,height:820},hasTouch:true,reducedMotion:'reduce'});
  try {
    const page = await context.newPage();
    const url = new URL('cyber-ninja/', options.url).href;
    await page.goto(url);
    await page.locator('html[data-ready="true"]').waitFor();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'true');
    await page.locator('#motion').click();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'false');
    await page.locator('#sound').click();
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
    await page.locator('#sound').click();
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
    await measureDraw(page,'cyber-ninja',options.artifacts);
    const now = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({time:now});
    await page.clock.pauseAt(new Date(+now+3000));
    await page.reload();
    await page.locator('html[data-ready="true"]').waitFor();
    await page.locator('#start').click();
    await page.keyboard.down('KeyL');await page.clock.runFor(140);await page.keyboard.up('KeyL');
    assert.ok((await page.evaluate(()=>bladeCircuit.inspect())).cooldown>0);
    await page.keyboard.down('KeyJ');
    for(let i=0;i<160;i++){
      const s=await page.evaluate(()=>bladeCircuit.inspect());
      if(s.phase!=='playing')break;
      const target=s.foes.find(f=>f.hp),gap=target?target.x-s.body.x:100;
      const direction=gap>38?'KeyD':gap < -12?'KeyA':null;
      if(direction)await page.keyboard.down(direction);
      await page.clock.runFor(130);
      if(direction)await page.keyboard.up(direction);
    }
    await page.keyboard.up('KeyJ');
    const victory=await page.evaluate(()=>bladeCircuit.inspect());
    assert.equal(victory.phase,'won');assert.equal(victory.sector,2);assert.ok(victory.score>1000);
    await page.locator('#restart').click();
    assert.equal((await page.evaluate(() => bladeCircuit.inspect())).tick,0);
    await page.setViewportSize({width:320,height:720});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const control = page.locator('[data-control="dash"]');
    await control.tap();
    // Restart clears the wall-clock origin. Allow the first frame to establish it
    // and then advance several actual simulation ticks before sampling a tap.
    await page.clock.runFor(128);
    const tapped = await page.evaluate(()=>bladeCircuit.inspect());
    assert.ok(tapped.tick >= 4, 'simulation advanced after restart');
    assert.ok(tapped.cooldown > 0 && tapped.body.x > 32, 'touch dash reached the game');
  } finally { await context.close(); }
}
