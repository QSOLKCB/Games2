// SPDX-License-Identifier: Apache-2.0
// Packaged Chromium game verification; never a runtime dependency.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {ROOT} from './package-lib.mjs';
import {verifyPackage} from './verify.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const verified=await verifyPackage(),directory=join(ROOT,'dist'),prefix='/games/narc/';
const artifactDir=resolve(process.env.CIRCUIT_VICE_ARTIFACT_DIR??join(ROOT,'browser-artifacts'));
await mkdir(artifactDir,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1'),path=decodeURIComponent(url.pathname);
    if(!path.startsWith(prefix))throw Error('different scope');
    const local=path.slice(prefix.length)||'index.html',file=resolve(directory,local);
    if(!file.startsWith(directory+'/'))throw Error('path escapes package');
    const bytes=await readFile(file);
    res.writeHead(200,{'Content-Type':types[extname(file)]??'text/plain','Cache-Control':'no-store'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url='http://127.0.0.1:'+server.address().port+prefix;
let browser;const results=[],errors=[];
async function check(name,fn){await fn();results.push(name);console.log('PASS '+name);}
const inspect=p=>p.evaluate(()=>window.circuitVice.inspect());
try{
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const context=await browser.newContext({viewport:{width:1220,height:950}});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
  await check('original assets and mission briefing load from real static bytes',async()=>{
    assert.equal((await inspect(p)).state.phase,'ready');
    assert.equal(await p.locator('canvas#game').count(),1);
    assert.equal(await p.locator('script[src^="http"]').count(),0);
    await p.screenshot({path:join(artifactDir,'briefing.png'),fullPage:true});
  });
  await check('deploy, move, fire, pause and restart work with keyboard',async()=>{
    await p.locator('#start').click();await p.waitForFunction(()=>circuitVice.inspect().state.tick>10);
    const before=(await inspect(p)).state;
    await p.keyboard.down('d');
    await p.waitForFunction(t=>circuitVice.inspect().state.tick>t+25,before.tick);
    await p.keyboard.up('d');
    assert.ok((await inspect(p)).state.player.body.x>before.player.body.x+40);
    await p.keyboard.down('f');
    const shots=(await inspect(p)).state.player.shots;
    await p.waitForFunction(n=>circuitVice.inspect().state.player.shots>n,shots);
    await p.keyboard.up('f');
    assert.ok((await inspect(p)).state.player.ammo<18);
    await p.keyboard.press('Escape');
    const paused=(await inspect(p)).state.tick;await p.waitForTimeout(120);
    assert.equal((await inspect(p)).state.tick,paused);
    assert.equal((await inspect(p)).state.phase,'paused');
    await p.screenshot({path:join(artifactDir,'district.png'),fullPage:true});
    await p.locator('#restart').click();
    assert.equal((await inspect(p)).state.tick,0);
    assert.equal((await inspect(p)).state.phase,'ready');
  });

  await check('live relay actuator and truthful interaction prompt are rendered at world position',async()=>{
    const evidence=await p.evaluate(async()=>{
      const {ViceView}=await import('./src/view.js');
      const canvas=document.createElement('canvas'),renderer=new ViceView(canvas);
      const original=circuitVice.inspect().state;
      const near=structuredClone(original);near.player.body.x=near.switch.x;near.player.body.y=near.switch.y;
      const far=structuredClone(near);far.player.body.x-=94;
      const labels=[],prototype=CanvasRenderingContext2D.prototype,draw=prototype.fillText;
      try{
        prototype.fillText=function(value,...rest){labels.push(String(value));return draw.call(this,value,...rest);};
        renderer.draw(far);const farState={...renderer.lastFrame.relay},farLabels=labels.splice(0);
        renderer.draw(near);const nearState={...renderer.lastFrame.relay},nearLabels=labels.splice(0);
        near.switch.disabled=true;renderer.draw(near);
        return {farState,nearState,disabled:renderer.lastFrame.relay,farLabels,nearLabels,
          disabledLabels:labels};
      }finally{prototype.fillText=draw;}
    });
    assert.deepEqual({x:evidence.nearState.x,y:evidence.nearState.y},{x:744,y:354});
    assert.equal(evidence.farState.near,false);assert.equal(evidence.nearState.near,true);
    assert.ok(evidence.farLabels.includes('GRID RELAY'));
    assert.ok(evidence.nearLabels.includes('[E] DISABLE GRID'));
    assert.ok(evidence.disabledLabels.includes('GRID OFFLINE'));
    assert.equal(evidence.disabled.near,false);
  });
  await check('blur blocks held-key auto-repeat until actual release and new press',async()=>{
    await p.locator('#start').click();
    await p.waitForFunction(()=>circuitVice.inspect().state.tick>=5);
    await p.keyboard.down('d');
    await p.waitForFunction(x=>circuitVice.inspect().state.player.body.x>x+12,75);
    await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
    assert.equal((await inspect(p)).state.phase,'paused');
    await p.locator('#start').click();
    assert.equal((await inspect(p)).state.phase,'playing');
    const before=(await inspect(p)).state;
    await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'d',repeat:true,bubbles:true})));
    await p.waitForFunction(t=>circuitVice.inspect().state.tick>t+12,before.tick);
    assert.equal((await inspect(p)).state.player.body.x,before.player.body.x,
      'canceled held D cannot move until keyup');
    await p.keyboard.up('d');
    await p.keyboard.down('d');
    const fresh=(await inspect(p)).state.player.body.x;
    await p.waitForFunction(x=>circuitVice.inspect().state.player.body.x>x+12,fresh);
    await p.keyboard.up('d');
    await p.keyboard.press('Escape');
  });
  await check('off-window key release permits first fresh press after resume or restart',async()=>{
    await p.locator('#restart').click();
    await p.locator('#start').click();
    await p.waitForFunction(()=>circuitVice.inspect().state.tick>=6);
    const initial=(await inspect(p)).state.player.body.x;
    await p.keyboard.down('d');
    await p.waitForFunction(x=>circuitVice.inspect().state.player.body.x>x+12,initial);
    await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
    assert.equal((await inspect(p)).state.phase,'paused');
    // Deliberately deliver no keyup to this window; it occurred elsewhere.
    await p.locator('#start').click();
    const stationary=(await inspect(p)).state;
    await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',
      {key:'d',repeat:true,bubbles:true})));
    await p.waitForFunction(t=>circuitVice.inspect().state.tick>t+8,stationary.tick);
    assert.equal((await inspect(p)).state.player.body.x,stationary.player.body.x,
      'an auto-repeat must not re-arm a canceled key');
    // The first real new press after the unseen release must work immediately.
    await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',
      {key:'d',repeat:false,bubbles:true})));
    await p.waitForFunction(x=>circuitVice.inspect().state.player.body.x>x+12,
      stationary.player.body.x);
    await p.keyboard.up('d');

    // The same lost-keyup case must not poison a later mission restart.
    await p.keyboard.down('d');
    const moved=(await inspect(p)).state.player.body.x;
    await p.waitForFunction(x=>circuitVice.inspect().state.player.body.x>x+8,moved);
    await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await p.locator('#restart').click();
    await p.locator('#start').click();
    assert.equal((await inspect(p)).state.player.body.x,75);
    const resumed=(await inspect(p)).state;
    await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',
      {key:'d',repeat:true,bubbles:true})));
    await p.waitForFunction(t=>circuitVice.inspect().state.tick>t+8,resumed.tick);
    assert.equal((await inspect(p)).state.player.body.x,75);
    await p.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',
      {key:'d',repeat:false,bubbles:true})));
    await p.waitForFunction(()=>circuitVice.inspect().state.player.body.x>87);
    await p.keyboard.up('d');
    await p.keyboard.press('Escape');
  });
  await check('bfcache persisted pagehide/pageshow resumes exactly one render loop',async()=>{
    await p.locator('#start').click();
    await p.waitForFunction(()=>circuitVice.inspect().state.tick>=10);
    await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
    assert.equal((await inspect(p)).state.phase,'paused');
    await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
    await p.locator('#start').click();
    const start=(await inspect(p)).state.tick;
    await p.waitForFunction(t=>circuitVice.inspect().state.tick>t+12,start);
    assert.equal((await inspect(p)).state.phase,'playing');
    await p.keyboard.press('Escape');
  });
  await check('original NC-002 animation, threat text and soundtrack control are visible',async()=>{
    const trace=await p.evaluate(async()=>{
      const {ViceView}=await import('./src/view.js');
      const cv=new ViceView(document.createElement('canvas')),state=circuitVice.inspect().state;
      const warn=structuredClone(state);
      warn.enemies[0].windup=12;warn.enemies[0].stunned=0;
      const labels=[],prototype=CanvasRenderingContext2D.prototype,original=prototype.fillText;
      try{
        prototype.fillText=function(value,...args){labels.push(String(value));return original.call(this,value,...args);};
        cv.draw(warn);const first={...cv.lastFrame};
        cv.draw(warn);const second={...cv.lastFrame};
        return {first,second,labels};
      }finally{prototype.fillText=original;}
    });
    assert.ok(trace.labels.includes('ATTACK INCOMING'));
    assert.ok(trace.first.animationStates.includes('warning'));
    assert.equal(trace.first.projectorBuilds,trace.second.projectorBuilds,
      'stationary scene must reuse validated 2.5D projection');
    await p.locator('#music').click();
    assert.equal(await p.locator('#music').textContent(),'MUSIC OFF');
    assert.equal((await inspect(p)).audio.musicOn,false);
    await p.locator('#music').click();
    assert.equal((await inspect(p)).audio.musicOn,true);
  });
  await check('packaged renderer sample profile records truthful headless CPU timings',async()=>{
    const measurements=await p.evaluate(async()=>{
      const {ViceView}=await import('./src/view.js');
      const source=circuitVice.inspect().state;
      const profile=structuredClone(source);
      // Bounded worst-allowed projectile count, presentation only.
      profile.bullets=Array.from({length:96},(_,i)=>({x:180+i*10,y:270+i%6*23,
        vx:i%2?9:-12,vy:0,owner:i%3?'player':'enemy',stun:i%4===0}));
      const render=new ViceView(document.createElement('canvas'));
      const samples=[],measure=()=>{const start=performance.now();render.draw(profile);
        samples.push(performance.now()-start);};
      for(let i=0;i<15;i++)render.draw(profile);
      for(let i=0;i<100;i++)measure();
      samples.sort((a,b)=>a-b);
      const percentile=q=>Number(samples[Math.floor((samples.length-1)*q)].toFixed(3));
      return {sampleCount:samples.length,p50Ms:percentile(.5),p95Ms:percentile(.95),
        maxMs:percentile(1),under16_67ms:percentile(.95)<=16.67,
        projectorBuilds:render.projectorBuilds,
        bullets:render.lastFrame.bullets,
        note:'Headless CPU Canvas2D microbenchmark; not monitor FPS or physical GPU evidence'};
    });
    assert.equal(measurements.sampleCount,100);
    assert.equal(measurements.bullets,96);
    assert.equal(measurements.projectorBuilds,1,'render should reuse stable scene');
    assert.ok(Number.isFinite(measurements.p50Ms)&&Number.isFinite(measurements.p95Ms));
    await writeFile(join(artifactDir,'performance.json'),JSON.stringify(measurements,null,2)+'\n');
    console.log('NC-002 headless renderer profile '+JSON.stringify(measurements));
  });
  await check('verified per-game offline install and independent cache namespace',async()=>{
    await p.waitForFunction(async()=> (await navigator.serviceWorker.getRegistration())?.active?.state==='activated',null,{timeout:15000});
    await p.reload();await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    const scopes=await p.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).map(r=>r.scope));
    assert.deepEqual(scopes,[url]);
    const cachesBefore=await p.evaluate(()=>caches.keys());
    assert.ok(cachesBefore.some(k=>k.startsWith('qsol.narc:'+url+':')));
    await context.setOffline(true);await p.goto(url);
    await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
    await p.locator('#start').click();
    await p.waitForFunction(()=>circuitVice.inspect().state.tick>4);
    assert.equal((await inspect(p)).state.phase,'playing');
    await context.setOffline(false);
  });
  await check('no browser exceptions and responsive mission viewport',async()=>{
    assert.deepEqual(errors,[]);
    await p.setViewportSize({width:390,height:840});
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await p.screenshot({path:join(artifactDir,'mobile-390.png'),fullPage:true});
  });
  await writeFile(join(artifactDir,'browser.json'),JSON.stringify({result:'PASS',checks:results,version:verified.version,
    limitations:['Headless Chromium, not physical GPU or controller testing','Hosted local scope, not a production Pages deployment']},null,2)+'\n');
  await context.close();
}catch(error){await writeFile(join(artifactDir,'failure.txt'),error.stack+'\n');throw error;}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
