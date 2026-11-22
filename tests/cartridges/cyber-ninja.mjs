// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {fromCabinet} from '../play-cartridge.mjs';

export const play = options => fromCabinet(options, 'cyber-ninja', 'Blade Circuit', async page => {
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
