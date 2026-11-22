// SPDX-License-Identifier: Apache-2.0
// Exercise normal DOM controls under a deterministic browser clock.
import assert from 'node:assert/strict';

export async function timedPlay(options, slug, flight) {
  const context=await options.browser.newContext({viewport:{width:1000,height:780},hasTouch:true,reducedMotion:'reduce'});
  try {
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const now=new Date('2026-01-01T00:00:00Z');
    await page.clock.install({time:now});await page.clock.pauseAt(new Date(+now+2000));
    await page.goto(new URL(slug+'/',options.url).href);
    await page.locator('html[data-ready="true"]').waitFor();
    await page.locator('#start').click();
    await flight(page);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
}

export async function setKeys(page, held, desired) {
  for(const key of [...held])if(!desired.includes(key)){await page.keyboard.up(key);held.delete(key);}
  for(const key of desired)if(!held.has(key)){await page.keyboard.down(key);held.add(key);}
}
