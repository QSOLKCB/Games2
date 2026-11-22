// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {fromCabinet} from '../play-cartridge.mjs';

export const play = options => fromCabinet(options, 'pinball', 'Orbital Pinball', async page => {
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
