// SPDX-License-Identifier: Apache-2.0
// Exercise the assembled Pages collection at its real project prefix.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifySite} from './verify-site.mjs';
import {serveSite} from './site-server.mjs';
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),require=createRequire(import.meta.url);
const {chromium}=require('playwright'),verified=await verifySite();
const artifacts=resolve(process.env.GAMES2_ARTIFACT_DIR??join(root,'browser-artifacts/cabinet'));
await mkdir(artifacts,{recursive:true});
const hosted=await serveSite(),url=hosted.url,gameURL=new URL('strikepixel/',url).href;
const checks=[],started=Date.now();let browser;
const inspect=p=>p.evaluate(()=>strikePixel.inspect());
async function cabinet(p){await p.waitForFunction(()=>['ready','concept','error'].includes(document.querySelector('#cabinet')?.dataset.state));}
async function game(p){await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');}
async function select(p,slug){await p.locator('[data-slug="'+slug+'"]').click();await cabinet(p);}
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name);}
async function fire(p){
  const initial=await inspect(p),before=initial.counters.shots;
  // Let resume consume a released trigger before supplying a new press.
  await p.waitForFunction(t=>strikePixel.inspect().state.tick>=t+2,initial.state.tick);await p.keyboard.down('f');
  await p.waitForFunction(n=>strikePixel.inspect().counters.shots>n,before);await p.keyboard.up('f');
}
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:1100}}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await check('project-prefix cabinet, original artwork, native keyboard selection and truthful concepts',async()=>{
    await p.goto(url);await cabinet(p);
    const catalog=JSON.parse(await readFile(join(root,'cartridges.json'),'utf8')).cartridges;
    const displayed=await p.locator('#cartridge-rack [data-slug]').evaluateAll(items=>items.map(item=>item.dataset.slug));
    assert.deepEqual(displayed.sort(),catalog.map(row=>row.slug).sort());
    assert.match(await p.locator('#selected-title').textContent(),/STRIKE PIXEL/i);
    assert.match(await p.locator('#selected-status').textContent(),/PLAYABLE PREVIEW/i);
    assert.equal(await p.locator('#play-link').getAttribute('href'),'./strikepixel/');
    await p.waitForFunction(()=>{const image=document.getElementById('preview-art');return !image.hidden&&image.complete&&image.naturalWidth>0;});
    assert.ok(await p.locator('#preview-art').evaluate(image=>image.naturalWidth>0));
    assert.equal(await p.evaluate(()=>navigator.serviceWorker.controller),null);
    assert.equal(await p.locator('iframe,audio[autoplay],video[autoplay]').count(),0);
    await select(p,'neon-apex');assert.match(await p.locator('#selected-status').textContent(),/COMING SOON/);assert.equal(await p.locator('#play-link').getAttribute('href'),null);
    await p.locator('[data-slug="strikepixel"]').focus();await p.keyboard.press('Enter');await cabinet(p);
    assert.equal(await p.locator('#play-link').getAttribute('href'),'./strikepixel/');await p.screenshot({path:join(artifacts,'cabinet-desktop.png'),fullPage:true});
  });
  await check('PLAY launches the verified package and actual movement/firing at /Games2/strikepixel/',async()=>{
    await p.locator('#play-link').click();await p.waitForURL(gameURL);await game(p);
    assert.equal((await inspect(p)).state.phase,'ready');await p.locator('#start').click();await fire(p);
    const before=(await inspect(p)).state;await p.keyboard.down('w');await p.keyboard.down('Shift');
    await p.waitForFunction(t=>strikePixel.inspect().state.tick>=t+25,before.tick);await p.keyboard.up('w');await p.keyboard.up('Shift');
    const moved=(await inspect(p)).state.player.position;assert.ok(Math.hypot(moved[0]-before.player.position[0],moved[2]-before.player.position[2])>.5);
    assert.ok((await inspect(p)).counters.shots>=1);await p.keyboard.press('Escape');
    const paused=(await inspect(p)).state.tick;await p.waitForTimeout(150);assert.equal((await inspect(p)).state.tick,paused);
    await p.locator('#cabinet-return').waitFor({state:'visible'});await p.screenshot({path:join(artifacts,'launched-game.png'),fullPage:true});
  });
  await check('return and browser history keep game lifecycle usable without a cabinet worker',async()=>{
    await p.locator('#cabinet-return').click();await p.waitForURL(url);await cabinet(p);assert.equal(await p.evaluate(()=>navigator.serviceWorker.controller),null);
    await p.goBack();await game(p);assert.ok(['ready','paused'].includes((await inspect(p)).state.phase));await p.locator('#start').click();await fire(p);
    await p.keyboard.press('Escape');await p.locator('#cabinet-return').waitFor({state:'visible'});await p.locator('#cabinet-return').click();await cabinet(p);
  });
  let gameCaches;
  await check('direct game URL, complete installation and game-only service-worker scope',async()=>{
    await p.goto(gameURL);await game(p);
    await p.waitForFunction(async()=>(await navigator.serviceWorker.getRegistration())?.active?.state==='activated',null,{timeout:15000});await p.reload();await game(p);
    const worker=await p.evaluate(async()=>({controller:navigator.serviceWorker.controller?.scriptURL,scopes:(await navigator.serviceWorker.getRegistrations()).map(r=>r.scope)}));
    assert.equal(worker.controller,gameURL+'service-worker.js');assert.deepEqual(worker.scopes,[gameURL]);
    gameCaches=await p.evaluate(()=>caches.keys());assert.ok(gameCaches.some(name=>name.startsWith('qsol.strikepixel:'+gameURL+':')));
    // An unrelated cache is a canary for accidental cabinet-wide cleanup.
    await p.evaluate(async()=>{await (await caches.open('games2-test-unrelated')).put(new Request(location.origin+'/canary'),new Response('keep'));});
  });
  await check('invalid cabinet update fails closed and preserves installed game/unrelated caches',async()=>{
    await p.route('**/cartridges.json',route=>route.fulfill({contentType:'application/json',body:'{"schemaVersion":999,"cartridges":[]}'}));
    await p.goto(url);await cabinet(p);assert.equal(await p.locator('#cabinet').getAttribute('data-state'),'error');assert.equal(await p.locator('#play-link').getAttribute('href'),null);
    assert.equal(await p.locator('#registry-error').isVisible(),true);
    const after=await p.evaluate(()=>caches.keys());for(const name of gameCaches)assert.ok(after.includes(name));assert.ok(after.includes('games2-test-unrelated'));
    await p.unroute('**/cartridges.json');await p.locator('#retry-registry').click();await cabinet(p);
    assert.equal(await p.locator('[data-slug="strikepixel"]').evaluate(e=>e===document.activeElement),true);
  });
  await check('fresh offline direct load still starts a match and fires after cabinet navigation',async()=>{
    await context.setOffline(true);await p.goto(gameURL);await game(p);await p.locator('#start').click();await fire(p);
    assert.equal((await inspect(p)).state.phase,'playing');assert.ok((await inspect(p)).counters.shots>=1);
    assert.equal(await p.evaluate(async()=>await (await (await caches.open('games2-test-unrelated')).match(location.origin+'/canary')).text()),'keep');
    await context.setOffline(false);
  });
  assert.deepEqual(errors,[]);await context.close();
  await check('touch, 320px/390px viewports, focus and reduced-motion selection',async()=>{
    const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'}),page=await c.newPage();await page.goto(url);await cabinet(page);
    assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
    for(const slug of ['starward-signal','strikepixel']){await page.locator('[data-slug="'+slug+'"]').scrollIntoViewIfNeeded();const box=await page.locator('[data-slug="'+slug+'"]').boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);await cabinet(page);}
    assert.equal(await page.locator('#play-link').getAttribute('href'),'./strikepixel/');
    for(const width of [320,390]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('#play-link').focus();assert.equal(await page.locator('#play-link').evaluate(e=>e===document.activeElement),true);await page.screenshot({path:join(artifacts,'cabinet-'+width+'.png'),fullPage:true});}
    await c.close();
  });
  await check('missing cartridge art has a readable fallback while the valid game remains launchable',async()=>{
    const c=await browser.newContext(),page=await c.newPage();await page.route('**/cabinet/assets/strikepixel.svg',route=>route.fulfill({status:404,body:'Missing artwork'}));await page.goto(url);await cabinet(page);
    await page.waitForFunction(()=>!document.getElementById('art-fallback').hidden&&document.getElementById('fallback-note').textContent.includes('Artwork unavailable'));
    assert.equal(await page.locator('#play-link').getAttribute('href'),'./strikepixel/');assert.match(await page.locator('#selected-title').textContent(),/STRIKE PIXEL/i);
    await page.screenshot({path:join(artifacts,'missing-art.png'),fullPage:true});await c.close();
  });

  await check('second original cartridge launches its real Circuit Vice offline package',async()=>{
    const c=await browser.newContext({viewport:{width:1280,height:920}}),page=await c.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url);await cabinet(page);await select(page,'narc');
    assert.equal(await page.locator('#play-link').getAttribute('href'),'./narc/');
    assert.match(await page.locator('#selected-title').textContent(),/CIRCUIT VICE/i);
    await page.locator('#play-link').click();
    await page.waitForURL(new URL('narc/',url).href);
    await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    assert.equal(await page.evaluate(()=>circuitVice.inspect().state.phase),'ready');
    await page.locator('#start').click();
    await page.waitForFunction(()=>circuitVice.inspect().state.tick>5);
    const origin=await page.evaluate(()=>circuitVice.inspect().state.player.body.x);
    await page.keyboard.down('d');
    await page.waitForFunction(x=>circuitVice.inspect().state.player.body.x>x+35,origin);
    await page.keyboard.up('d');
    assert.deepEqual(errors,[]);
    await page.screenshot({path:join(artifacts,'circuit-vice.png'),fullPage:true});
    await c.close();
  });
  for(const slug of verified.games.filter(slug=>!['strikepixel','narc'].includes(slug))){
    const {play}=await import('../tests/cartridges/'+slug+'.mjs');
    await check(slug+' cabinet launch, play, recovery and offline restart',()=>play({browser,url,artifacts}));
  }
  const report={result:'PASS',siteVersion:verified.version,games:verified.games,browser:browser.version(),prefix:'/Games2/',checks,elapsedSeconds:(Date.now()-started)/1000,
    limitations:['Local hosted-prefix check; no production deployment performed.','Software-rendered headless Chromium; touch and narrow screens are emulated, not physical device tests.','Cabinet is online navigation; only the game has an offline worker.']};
  await writeFile(join(artifacts,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(error){await writeFile(join(artifacts,'failure.txt'),error.stack+'\n');throw error;}
finally{await browser?.close();await hosted.close();}
