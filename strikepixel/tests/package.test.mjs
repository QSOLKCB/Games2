// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,cp,readFile,writeFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {build} from '../scripts/build.mjs';
import {verifyVendor,verifySource,verifyPackage} from '../scripts/verify.mjs';
import {ROOT,ENGINE_COMMIT} from '../scripts/package-lib.mjs';

async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'strikepixel-package-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await cp(join(ROOT,'vendor'),join(root,'vendor'),{recursive:true});
  await mkdir(join(root,'scripts'));await mkdir(join(root,'src'));
  await cp(join(ROOT,'scripts/service-worker.template.js'),join(root,'scripts/service-worker.template.js'));
  await cp(join(ROOT,'src/offline.js'),join(root,'src/offline.js'));
  await cp(join(ROOT,'vendor/vanillajs/LICENSE'),join(root,'LICENSE'));
  await writeFile(join(root,'NOTICE'),'Strike Pixel uses VANILLAJS '+ENGINE_COMMIT+' under Apache-2.0.');
  await writeFile(join(root,'index.html'),'<!doctype html><link rel="stylesheet" href="style.css"><script type="module" src="start.js"></script>');
  await writeFile(join(root,'style.css'),'body { color: white; background: black; }');
  await writeFile(join(root,'start.js'),"import('./src/game.js');\n");
  await writeFile(join(root,'src/game.js'),"import {FixedClock} from '../vendor/vanillajs/modules/time/index.js'; export const clock=new FixedClock();\n");
  return root;
}

test('engine provenance and declared imports describe the exact immutable native module closure',async()=>{
  const receipt=await verifyVendor();
  assert.equal(receipt.engine.commit,ENGINE_COMMIT);
  for(const name of ['combat3d','character','collision','projectiles','weapons','navigation','render-webgl','input','math','audio2d','soundtrack','time'])assert.ok(receipt.selection.modules.includes(name));
  assert.deepEqual(receipt.localChanges,[]);
});
test('build is deterministic, preserves notices and excludes tooling or unlisted root files',async t=>{
  const root=await fixture(t);
  await mkdir(join(root,'node_modules'));await writeFile(join(root,'node_modules/private.js'),'private');
  await mkdir(join(root,'docs'));await writeFile(join(root,'docs/PLAYER.md'),'# Offline player guide\n');
  await writeFile(join(root,'README.md'),'[Player guide](docs/PLAYER.md)\n');
  await mkdir(join(root,'browser-artifacts'));await writeFile(join(root,'browser-artifacts/screenshot.png'),'test artifact, not a runtime asset');
  await writeFile(join(root,'.env'),'LOCAL_SECRET=not-for-packaging');
  await writeFile(join(root,'scripts/private-profile.json'),'private');
  const first=await build({root}),manifest=await readFile(join(root,'dist/manifest.json'),'utf8');
  assert.deepEqual(await build({root}),first);assert.equal(await readFile(join(root,'dist/manifest.json'),'utf8'),manifest);
  const paths=JSON.parse(manifest).files.map(file=>file.path);
  for(const path of ['LICENSE','NOTICE','README.md','docs/PLAYER.md','vendor/vanillajs/LICENSE','vendor/vanillajs/NOTICE','vendor/vanillajs/MODULES.json','vendor/vanillajs/provenance.json'])assert.ok(paths.includes(path));
  assert.ok(paths.every(path=>!path.includes('node_modules')&&!path.startsWith('scripts/')&&!path.startsWith('browser-artifacts/')&&!path.startsWith('.')));
  await writeFile(join(root,'style.css'),'body { color: green; }');
  assert.notEqual((await build({root})).version,first.version,'changed delivered bytes change offline identity');
});
test('modified vendor bytes, undeclared files and unsafe runtime links are rejected',async t=>{
  const root=await fixture(t),module=join(root,'vendor/vanillajs/modules/time/index.js'),original=await readFile(module);
  await writeFile(module,Buffer.concat([original,Buffer.from('\n// altered')]));
  await assert.rejects(verifyVendor(root),/source size|source digest/);await writeFile(module,original);
  await writeFile(join(root,'vendor/vanillajs/extra.js'),'export const injected=true;');
  await assert.rejects(verifyVendor(root),/unexpected vendored/);await rm(join(root,'vendor/vanillajs/extra.js'));
  for(const source of ["import 'https://example.invalid/game.js';","import './missing.js';","import '../../outside.js';","import('./'+name+'.js');"]){
    await writeFile(join(root,'start.js'),source);await assert.rejects(verifySource(root),/relative|missing local|escaping|literal local/);
  }
  await writeFile(join(root,'start.js'),"import './src/game.js';");
  await symlink(join(root,'LICENSE'),join(root,'src/external.js'));
  await assert.rejects(verifySource(root),/symlink/);
});
test('package verifier rejects modified content and extra deployed files',async t=>{
  const root=await fixture(t);await build({root});
  await writeFile(join(root,'dist/style.css'),'damaged');
  await assert.rejects(verifyPackage({root}),/package size|package digest/);
  await build({root});await writeFile(join(root,'dist/private-profile.json'),'{}');
  await assert.rejects(verifyPackage({root}),/extra or missing/);
});
test('HTML cannot hide runtime dependencies in unquoted or inline scripts',async t=>{
  const root=await fixture(t);
  await writeFile(join(root,'index.html'),'<script src=https://example.invalid/remote.js></script>');
  await assert.rejects(verifySource(root),/quoted paths/);
  await writeFile(join(root,'index.html'),'<script>import("https://example.invalid/remote.js");</script>');
  await assert.rejects(verifySource(root),/inline scripts/);
});
test('offline registration recognises an installed package without needing an uncached manifest',async()=>{
  const scope='http://127.0.0.1:8123/play/strikepixel/',active={scope,active:{state:'activated',scriptURL:scope+'service-worker.js'}};
  const source=(await readFile(join(ROOT,'src/offline.js'),'utf8'))
    .replace('export async function registerOffline','async function registerOffline')
    .replace('import.meta.url',JSON.stringify(scope+'src/offline.js'))+'\nglobalThis.registerOffline=registerOffline;';
  for(const [registration,expected]of [[active,'ready'],[{...active,scope:'http://127.0.0.1:8123/other/'},'unavailable'],[null,'unavailable']]){
    const reports=[],context={URL,location:new URL(scope),navigator:{serviceWorker:{getRegistration:async()=>registration,register:async()=>{throw Error('registration must not be attempted offline');}}},fetch:async()=>{throw Error('network disabled');}};
    vm.runInNewContext(source,context);
    const result=await context.registerOffline({onStatus:report=>reports.push(report)});
    assert.equal(reports.at(-1).state,expected);
    assert.equal(result,expected==='ready'?active:null);
  }
});

async function workerHarness(root,{corrupt=null}={}){
  const scope='http://127.0.0.1:8123/play/strikepixel/',stores=new Map(),handlers=new Map();
  let offline=false,fetches=0;
  const caches={
    async open(name){if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {
      async put(key,response){data.set(typeof key==='string'?key:key.url,response.clone());},
      async match(key){return data.get(typeof key==='string'?key:key.url)?.clone();},
      async delete(key){return data.delete(typeof key==='string'?key:key.url);}
    };},
    async keys(){return [...stores.keys()];},async delete(name){return stores.delete(name);}
  };
  const context={self:{registration:{scope},addEventListener:(event,handler)=>handlers.set(event,handler)},caches,crypto:webcrypto,URL,Response,
    fetch:async request=>{
      if(offline)throw Error('network disabled');fetches++;
      const url=typeof request==='string'?request:request.url;
      assert.ok(url.startsWith(scope));const path=url.slice(scope.length)||'index.html';
      const bytes=await readFile(join(root,'dist',path));
      return new Response(path===corrupt?Buffer.from('corrupt asset'):bytes,{status:200});
    }};
  vm.runInNewContext(await readFile(join(root,'dist/service-worker.js'),'utf8'),context);
  const event=name=>{let pending;handlers.get(name)({waitUntil:promise=>{pending=promise;}});return pending;};
  const request=path=>{let response;handlers.get('fetch')({request:new Request(new URL(path,scope)),respondWith:promise=>{response=promise;}});return response;};
  return {scope,stores,event,request,setOffline:value=>{offline=value;},fetches:()=>fetches};
}
test('worker serves verified offline bytes and rejects cache corruption while disconnected',async t=>{
  const root=await fixture(t);await build({root});const worker=await workerHarness(root);
  await worker.event('install');
  worker.stores.set('unrelated-game-cache',new Map());
  worker.stores.set('qsol.strikepixel:'+worker.scope+':old-version',new Map());
  await worker.event('activate');
  assert.equal(worker.stores.has('unrelated-game-cache'),true,'activation preserves other games and scopes');
  assert.equal(worker.stores.has('qsol.strikepixel:'+worker.scope+':old-version'),false,'activation removes only obsolete game cache versions');
  worker.setOffline(true);
  const count=worker.fetches(),response=await worker.request('');
  assert.equal(response.status,200);assert.equal(await response.text(),await readFile(join(root,'index.html'),'utf8'));
  assert.equal(worker.fetches(),count,'offline success requires no network');
  assert.equal(worker.request('https://example.invalid/tracking'),undefined,'unknown URLs are never captured');
  const cache=[...worker.stores.values()][0];cache.set(worker.scope+'src/game.js',new Response('corrupted cached code'));
  assert.equal((await worker.request('src/game.js')).status,503,'corrupted code is never served');
  assert.equal(cache.has(worker.scope+'src/game.js'),false);
  worker.setOffline(false);assert.equal((await worker.request('src/game.js')).status,200,'online verified recovery');
});
test('one bad precache member rejects the entire installation and removes its partial cache',async t=>{
  const root=await fixture(t);await build({root});const worker=await workerHarness(root,{corrupt:'src/game.js'});
  await assert.rejects(worker.event('install'),/integrity failure/);
  assert.equal(worker.stores.size,0,'partial offline installation cannot be activated');
});
