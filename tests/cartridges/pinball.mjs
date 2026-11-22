// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {measureDraw} from '../cartridge-performance.mjs';
import {fromCabinet} from '../play-cartridge.mjs';

export async function play(options) {
  await fromCabinet(options, 'pinball', 'Orbital Pinball', async page => {
    const inspect = () => page.evaluate(() => orbitalPinball.inspect());
    await page.keyboard.down('Space');
    await page.waitForFunction(() => orbitalPinball.inspect().charge >= 30);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.keyboard.up('Space');
    assert.equal((await inspect()).charging, false);
    await page.locator('#pause').click();
    await page.keyboard.down('Space');
    await page.waitForFunction(() => orbitalPinball.inspect().charge === 100);
    await page.keyboard.up('Space');
    await page.waitForFunction(() => !orbitalPinball.inspect().inShooter);
    await page.keyboard.down('KeyA'); await page.keyboard.down('KeyD');
    await page.waitForFunction(() => orbitalPinball.inspect().lifts.every(n => n === 1));
    await page.keyboard.up('KeyA');await page.keyboard.up('KeyD');
    await page.waitForFunction(() => orbitalPinball.inspect().lifts.every(n => n === 0));
    assert.equal((await inspect()).launches,1);
    await page.waitForFunction(() => orbitalPinball.inspect().score >= 100);
  });
  const context = await options.browser.newContext({viewport:{width:1000,height:820},hasTouch:true,reducedMotion:'reduce'});
  try {
    const page = await context.newPage();
    const url = new URL('pinball/', options.url).href;
    await page.goto(url);
    await page.locator('html[data-ready="true"]').waitFor();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'true');
    await page.locator('#motion').click();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'),'false');
    await page.locator('#sound').click();
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
    await page.locator('#sound').click();
    assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
    await measureDraw(page,'pinball',options.artifacts);
    const now = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({time:now});
    await page.clock.pauseAt(new Date(+now+3000));
    await page.reload();
    await page.locator('html[data-ready="true"]').waitFor();
    await page.locator('#start').click();
    for(let serve=0;serve<4;serve++){
      const before=await page.evaluate(()=>orbitalPinball.inspect());
      if(before.phase==='over')break;
      assert.equal(before.serving,true);
      await page.keyboard.down('Space');await page.clock.runFor(206);await page.keyboard.up('Space');
      await page.clock.runFor(3000);
      const shot=await page.evaluate(()=>orbitalPinball.inspect());
      assert.ok(shot.skills>=1);assert.equal(shot.serving,false);
      if(serve===0){
        await page.keyboard.down('KeyN');await page.clock.runFor(40);await page.keyboard.up('KeyN');
        assert.equal((await page.evaluate(()=>orbitalPinball.inspect())).nudges,1);
      }
      for(let i=0;i<24;i++){
        await page.clock.runFor(1100);
        const s=await page.evaluate(()=>orbitalPinball.inspect());
        if(s.serving||s.phase==='over')break;
      }
    }
    const final=await page.evaluate(()=>orbitalPinball.inspect());
    assert.equal(final.phase,'over');assert.equal(final.stock,0);assert.ok(final.skills>=1);
    assert.equal(Number(await page.locator('#best').textContent()),final.score);
    await page.reload();await page.locator('html[data-ready="true"]').waitFor();
    await page.clock.runFor(40);
    assert.equal(Number(await page.locator('#best').textContent()),final.score);
    await page.locator('#start').click();
    await page.locator('#restart').click();
    assert.equal((await page.evaluate(() => orbitalPinball.inspect())).tick,0);
    await page.setViewportSize({width:320,height:720});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const control = page.locator('[data-control="launch"]');
    await control.tap();
    // Restart clears the wall-clock origin. Allow the first frame to establish it
    // and then advance several actual simulation ticks before sampling a tap.
    await page.clock.runFor(128);
    const tapped = await page.evaluate(()=>orbitalPinball.inspect());
    assert.ok(tapped.tick >= 4, 'simulation advanced after restart');
    assert.equal(tapped.launches, 1, 'touch launch reached the game');
  } finally { await context.close(); }
}
