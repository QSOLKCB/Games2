// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {join} from 'node:path';

export async function fromCabinet({browser, url, artifacts}, slug, title, exercise) {
  const context = await browser.newContext({viewport:{width:1110, height:850}, reducedMotion:'reduce'});
  try {
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.locator('[data-slug="' + slug + '"]').click();
    assert.equal(await page.locator('#play-link').getAttribute('href'), './' + slug + '/');
    await page.locator('#play-link').click();
    const direct = new URL(slug + '/', url).href;
    await page.waitForURL(direct);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    assert.equal(await page.locator('h1').textContent(), title);
    await page.locator('#start').click();
    await exercise(page);
    await page.screenshot({path:join(artifacts, slug + '.png')});
    await page.keyboard.press('KeyP');
    assert.equal(await page.locator('html').getAttribute('data-phase'), 'paused');
    await page.locator('#restart').click();
    await page.waitForFunction(() => document.documentElement.dataset.phase === 'playing');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.goto(url);
    assert.equal(await page.evaluate(() => navigator.serviceWorker.controller), null);
    await context.setOffline(true);
    await page.goto(direct);
    await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
    assert.equal(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL), direct + 'service-worker.js');
    await page.locator('#offline[data-state="ready"]').waitFor();
    await page.locator('#start').click();
    await exercise(page);
    await context.setOffline(false);
    await page.locator('nav a').click(); await page.waitForURL(url);
    await page.locator('[data-slug="' + slug + '"]').waitFor();
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}
