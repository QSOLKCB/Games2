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
