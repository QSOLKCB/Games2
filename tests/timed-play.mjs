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

export async function watchSound(page, synthName) {
  await page.evaluate(async name => {
    const synth=(await import(new URL('src/synth.js',location.href)))[name].prototype;
    const calls=[];
    for(const method of ['quiet','cue']){
      const original=synth[method];
      synth[method]=function(...args){
        calls.push(method==='cue'?args[0]:method);
        if(calls.length>4)calls.shift();
        return original.apply(this,args);
      };
    }
    window.lastSounds=()=>calls.slice(-2);
  },synthName);
  await page.locator('#sound').click();
  assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
}
