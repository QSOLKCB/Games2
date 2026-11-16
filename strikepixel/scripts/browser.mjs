// SPDX-License-Identifier: Apache-2.0
// Real packaged-game verification; state is observed through read-only diagnostics.
// Playwright is external development tooling, never a game dependency.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {ROOT} from './package-lib.mjs';
import {verifyPackage} from './verify.mjs';
import {ARENA} from '../src/arena.js';
import {raycast} from '../vendor/vanillajs/modules/collision/index.js';

const require=createRequire(import.meta.url);
let chromium;try{({chromium}=require('playwright'));}catch{throw Error('Use an existing Playwright installation (NODE_PATH) and PLAYWRIGHT_CHROMIUM_EXECUTABLE. No runtime npm packages are needed.');}
const verified=await verifyPackage(),directory=join(ROOT,'dist'),prefix='/games/strikepixel/';
const artifacts=resolve(process.env.STRIKEPIXEL_ARTIFACT_DIR??join(ROOT,'browser-artifacts'));await mkdir(artifacts,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.md':'text/plain','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),path=decodeURIComponent(url.pathname);
    if(!path.startsWith(prefix))throw Error('Not in game');
    const local=path.slice(prefix.length)||'index.html',file=resolve(directory,local);
    if(!file.startsWith(directory+'/'))throw Error('Unsafe path');
    const bytes=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]??'text/plain','Cache-Control':'no-cache'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+prefix+'index.html',results=[],started=Date.now();
let browser;
async function check(name,run){await run();results.push(name);console.log('PASS '+name);}
const inspect=page=>page.evaluate(()=>window.strikePixel.inspect());
const state=async page=>(await inspect(page)).state;
const run=(page,milliseconds)=>page.clock.runFor(milliseconds);
async function ready(page){await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');}
async function fixed(page){await page.clock.install({time:new Date('2026-11-16T00:00:00Z')});await page.goto(url);await ready(page);await page.clock.pauseAt(new Date('2026-11-16T00:01:00Z'));}
async function key(page,name,milliseconds){await page.keyboard.down(name);await run(page,milliseconds);await page.keyboard.up(name);}
async function resume(page){await page.locator('#start').click();await run(page,80);assert.equal((await state(page)).phase,'playing');}
async function newMatch(page){await page.goto(url);await ready(page);await page.locator('#match-length').selectOption('quick');await resume(page);}
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await fixed(page);
  await check('briefing, real WebGL, gesture audio and first precision elimination',async()=>{
    const initial=await inspect(page);assert.equal(initial.state.phase,'ready');assert.equal(initial.state.tick,0);assert.equal(initial.audio.enabled,false);assert.equal(initial.graphics.meshes,6);
    await page.screenshot({path:join(artifacts,'briefing.png')});
    await page.locator('#match-length').selectOption('quick');await resume(page);await key(page,'f',45);
    const shot=await inspect(page);assert.equal(shot.counters.shots,1);assert.ok(shot.counters.hits>=1);assert.equal(shot.state.score.player,1);assert.equal(shot.state.player.ammo,7);
    assert.equal(shot.audio.enabled,true);assert.equal(shot.audio.paused,false);assert.equal(await page.locator('#score-player').textContent(),'1');
    await page.screenshot({path:join(artifacts,'combat.png')});
  });
  await check('actual sprint, jump, three weapons, projectile travel and reload',async()=>{
    const before=(await state(page)).player.position;await page.keyboard.down('Shift');await key(page,'w',400);await page.keyboard.up('Shift');
    const moved=(await state(page)).player.position;assert.ok(Math.hypot(moved[0]-before[0],moved[2]-before[2])>1.5);
    await key(page,'Space',200);assert.ok((await state(page)).player.position[1]>.3);
    await page.keyboard.press('2');await key(page,'f',500);let current=await inspect(page);assert.equal(current.state.player.weaponId,'rivet');assert.ok(current.state.player.ammo<22);assert.ok(current.counters.shots>=4);
    await page.keyboard.press('3');await run(page,34);await key(page,'ArrowDown',200);await key(page,'f',34);
    current=await inspect(page);assert.equal(current.state.player.weaponId,'comet');assert.equal(current.state.player.ammo,3);assert.ok(current.state.projectiles.length>0,'actual travelling projectile');
    await page.keyboard.press('r');await run(page,34);assert.ok((await state(page)).player.reloadRemaining>0);
    await run(page,2000);current=await inspect(page);assert.equal(current.state.player.ammo,4);assert.ok(current.state.player.reserve<20);assert.ok(current.counters.explosions>0);
  });
  await check('Escape, blur, hidden page and repeated held input require explicit fresh resume',async()=>{
    await page.keyboard.down('w');await page.keyboard.down('f');await run(page,50);await page.keyboard.press('Escape');
    let paused=await inspect(page);assert.equal(paused.state.phase,'paused');await run(page,1200);assert.equal((await state(page)).tick,paused.state.tick);assert.equal((await inspect(page)).audio.voices,0);
    await resume(page);const released=await inspect(page);await page.evaluate(()=>{dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',repeat:true,bubbles:true}));dispatchEvent(new KeyboardEvent('keydown',{code:'KeyF',repeat:true,bubbles:true}));});await run(page,160);
    let resumed=await inspect(page);assert.deepEqual(resumed.state.player.position,released.state.player.position);assert.equal(resumed.counters.shots,released.counters.shots);await page.keyboard.up('w');await page.keyboard.up('f');
    await page.evaluate(()=>dispatchEvent(new Event('blur')));paused=await state(page);assert.equal(paused.phase,'paused');await run(page,200);assert.equal((await state(page)).tick,paused.tick);await resume(page);
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));delete document.hidden;});assert.equal((await state(page)).phase,'paused');await resume(page);
  });
  await check('native pointer capture, actual mouse fire, unlock pause and relative look',async()=>{
    await newMatch(page);
    await page.locator('#game').click();await page.waitForFunction(()=>document.pointerLockElement?.id==='game');await run(page,40);const before=await inspect(page);
    await page.mouse.down();await run(page,70);await page.mouse.up();assert.ok((await inspect(page)).counters.shots>before.counters.shots);
    // Headless capture is native; relative device deltas are explicitly emulated.
    await page.evaluate(()=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:30,movementY:0,bubbles:true})));await run(page,40);assert.notEqual((await state(page)).player.yaw,before.state.player.yaw);
    await page.evaluate(()=>document.exitPointerLock());await page.waitForFunction(()=>strikePixel.inspect().state.phase==='paused');await resume(page);
  });
  await check('standard gamepad neutral gate, movement, fire, pause and disconnect',async()=>{
    await newMatch(page);
    await page.evaluate(()=>{window.testPad={id:'verification standard pad',index:0,mapping:'standard',connected:true,axes:[1,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.testPad]});});
    const before=(await state(page)).player.position;await run(page,150);assert.deepEqual((await state(page)).player.position,before);assert.equal((await inspect(page)).controllerArmed,false);
    await page.evaluate(()=>testPad.axes[0]=0);await run(page,40);assert.equal((await inspect(page)).controllerArmed,true);
    await page.evaluate(()=>testPad.axes[0]=1);await run(page,160);assert.notDeepEqual((await state(page)).player.position,before);
    await page.evaluate(()=>{testPad.axes[0]=0;testPad.buttons[7]={value:1,pressed:true};});const shots=(await inspect(page)).counters.shots;await run(page,1000);assert.ok((await inspect(page)).counters.shots>shots);
    await page.evaluate(()=>{testPad.buttons[7]={value:0,pressed:false};testPad.buttons[9]={value:1,pressed:true};});await run(page,40);assert.equal((await state(page)).phase,'paused');
    await page.evaluate(()=>testPad.buttons[9]={value:0,pressed:false});await resume(page);await page.evaluate(()=>{testPad.connected=false;dispatchEvent(new Event('gamepaddisconnected'));});assert.equal((await state(page)).phase,'paused');
    await page.evaluate(()=>{delete navigator.getGamepads;delete window.testPad;});await resume(page);
  });
  await check('context loss pauses, restored buffers remain paused until requested',async()=>{
    await page.evaluate(()=>{window.loss=document.getElementById('game').getContext('webgl').getExtension('WEBGL_lose_context');loss.loseContext();});
    await page.waitForFunction(()=>strikePixel.inspect().graphics.lost);assert.equal((await state(page)).phase,'paused');
    await page.evaluate(()=>loss.restoreContext());await page.waitForFunction(()=>!strikePixel.inspect().graphics.lost);assert.equal((await state(page)).phase,'paused');await resume(page);
  });
  await check('bots deal actual damage, score deaths, respawn and finish a match; restart resets',async()=>{
    await newMatch(page);
    for(let i=0;i<24&&(await state(page)).phase!=='ended';i++)await run(page,5000);
    const ended=await inspect(page);assert.equal(ended.state.phase,'ended');assert.equal(ended.state.outcome,'defeat');assert.ok(ended.counters.botShots>0);assert.ok(ended.counters.playerDeaths>=3);assert.ok(ended.counters.respawns>=2);assert.equal(ended.state.score.bots,3);
    assert.equal(await page.locator('#end-screen').isVisible(),true);await page.screenshot({path:join(artifacts,'match-end.png')});
    await page.locator('#restart').click();await run(page,64);const restarted=await inspect(page);assert.equal(restarted.state.phase,'playing');assert.equal(restarted.state.score.player,0);assert.equal(restarted.state.score.bots,0);assert.equal(restarted.counters.shots,0);assert.ok(restarted.state.tick<10);
  });
  await check('three aimed precision eliminations produce the actual victory screen',async()=>{
    await newMatch(page);await page.locator('#game').click();await page.waitForFunction(()=>document.pointerLockElement?.id==='game');await run(page,40);
    for(let attempt=0;attempt<30;attempt++){
      const read=await inspect(page),s=read.state;if(s.phase==='ended')break;
      const eye=s.player.position.map((x,i)=>x+(i===1?s.player.eyeHeight:0));
      const targets=s.bots.filter(b=>b.alive).map(b=>{
        const delta=b.position.map((x,i)=>x+(i===1?b.height-.2:0)-eye[i]),distance=Math.hypot(...delta);
        return {delta,distance,blocked:!!raycast(eye,delta,distance,ARENA.solids)};
      }).filter(t=>!t.blocked).sort((a,b)=>a.distance-b.distance);
      if(!targets.length){await run(page,200);continue;}
      const d=targets[0].delta,angle=Math.atan2(-d[0],-d[2])-s.player.yaw,yawDelta=Math.atan2(Math.sin(angle),Math.cos(angle));
      const pitchDelta=Math.atan2(d[1],Math.hypot(d[0],d[2]))-s.player.pitch,sensitivity=.0025*read.settings.sensitivity;
      await page.evaluate(({x,y})=>document.dispatchEvent(new MouseEvent('mousemove',{movementX:x,movementY:y,bubbles:true})),{x:Math.round(-yawDelta/sensitivity),y:Math.round(-pitchDelta/(sensitivity*(read.settings.invertY?-1:1)))});
      await key(page,'f',34);if((await state(page)).phase==='ended')break;await run(page,520);
    }
    const won=await inspect(page);assert.equal(won.state.outcome,'victory');assert.equal(won.state.score.player,3);assert.ok(won.counters.hits>=3);assert.equal(await page.locator('#end-screen').isVisible(),true);
    await page.screenshot({path:join(artifacts,'victory.png')});await page.locator('#restart').click();await run(page,64);
  });
  await check('narrow 320px and 390px layouts retain reachable controls',async()=>{
    await page.keyboard.press('Escape');
    for(const width of [320,390]){await page.setViewportSize({width,height:844});await run(page,40);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('#start').scrollIntoViewIfNeeded();assert.equal(await page.locator('#start').isVisible(),true);await page.screenshot({path:join(artifacts,'layout-'+width+'.png'),fullPage:true});}
    await page.setViewportSize({width:1440,height:1000});
  });
  await check('verified service-worker installation and nested-path offline startup/play',async()=>{
    // A ready registration alone does not imply this document is controlled.
    await page.evaluate(async()=>{const registration=await navigator.serviceWorker.ready;if(registration.active.state!=='activated')await new Promise(resolve=>registration.active.addEventListener('statechange',resolve,{once:true}));});
    await page.reload();await ready(page);assert.ok(await page.evaluate(()=>navigator.serviceWorker.controller));
    await context.setOffline(true);await page.goto(url);await ready(page);await run(page,50);await page.locator('#start').click();await run(page,80);await key(page,'f',50);
    assert.equal((await inspect(page)).counters.shots,1);assert.equal((await state(page)).score.player,1);
    assert.equal(await page.locator('#offline-status').getAttribute('data-state'),'ready');assert.match(await page.locator('#offline-status').textContent(),/Running the installed offline package/);await context.setOffline(false);
  });
  assert.deepEqual(errors,[],'no unhandled page errors');await context.close();
  await check('rejected saved settings, denied capture, audio failure and storage failure remain usable',async()=>{
    const c=await browser.newContext(),p=await c.newPage();await p.addInitScript(()=>{
      localStorage.setItem('strikepixel.settings.v1','{"kind":"stale","sensitivity":999}');
      HTMLCanvasElement.prototype.requestPointerLock=()=>Promise.reject(new Error('denied'));
      window.AudioContext=function(){throw Error('audio unavailable');};
      Storage.prototype.setItem=function(){throw Error('quota');};
    });await fixed(p);assert.equal((await inspect(p)).settings.sensitivity,1);assert.match(await p.locator('#settings-status').textContent(),/invalid/);
    await p.locator('#settings').evaluate(e=>e.open=true);await p.locator('#music').uncheck();assert.equal((await inspect(p)).storageAvailable,false);
    await resume(p);assert.match(await p.locator('#settings-status').textContent(),/Audio is unavailable/);
    await p.locator('#game').click();await run(p,50);assert.equal((await inspect(p)).pointerLocked,false);
    const angle=(await state(p)).player.yaw,box=await p.locator('#game').boundingBox();await p.mouse.move(box.x+100,box.y+200);await p.mouse.down();await p.mouse.move(box.x+170,box.y+200);await run(p,40);await p.mouse.up();assert.notEqual((await state(p)).player.yaw,angle);
    await key(p,'f',50);assert.equal((await inspect(p)).counters.shots,1);await c.close();
  });
  await check('unsupported graphics and failed module import show usable reload recovery',async()=>{
    for(const failure of ['graphics','module']){
      const c=await browser.newContext(),p=await c.newPage();
      if(failure==='graphics')await p.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=function(){return null;};});
      else await p.route('**/src/world.js',route=>route.abort());
      await p.goto(url);await p.waitForFunction(()=>document.documentElement.dataset.ready==='error');assert.equal(await p.locator('#error').isVisible(),true);assert.equal(await p.locator('#retry').isVisible(),true);assert.equal(await p.locator('#start').isEnabled(),false);await c.close();
    }
  });
  await check('fatal rendering failure disables resume and stops audio safely',async()=>{
    const c=await browser.newContext(),p=await c.newPage();await fixed(p);await resume(p);
    await p.evaluate(()=>{document.getElementById('game').getContext('webgl').drawArrays=()=>{throw Error('Injected device failure');};});await run(p,40);
    assert.equal(await p.locator('#error').isVisible(),true);assert.equal(await p.locator('#start').isEnabled(),false);assert.equal(await p.locator('#restart').isEnabled(),false);
    const frozen=await inspect(p);assert.equal(frozen.state.phase,'paused');assert.equal(frozen.audio.paused,true);await run(p,500);assert.equal((await state(p)).tick,frozen.state.tick);await c.close();
  });
  const report={result:'PASS',browser:browser.version(),engineCommit:verified.engineCommit,package:verified.version,checks:results,elapsedSeconds:(Date.now()-started)/1000,limitations:['Headless Chromium software rendering; no physical GPU, gamepad, mobile device or other browser engine exercised.','Clock-controlled requestAnimationFrame executes real fixed simulation steps; no mutating gameplay test hooks.']};
  await writeFile(join(artifacts,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(error){await writeFile(join(artifacts,'failure.txt'),error.stack+'\n');throw error;}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
