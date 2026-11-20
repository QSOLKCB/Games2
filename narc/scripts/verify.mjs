// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,ENGINE_COMMIT,hash,safePath,walk,publicFiles,records,packageVersion,renderWorker,imports,localReference,verifyReferences} from './package-lib.mjs';
const roots=['combat2d','motion2d','projection25d','sprite2d','time','audio2d'];
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+String.fromCharCode(0)).update(bytes).digest('hex');
export async function verifyVendor(root=ROOT){
  const vendor=join(root,'vendor/vanillajs'),receipt=JSON.parse(await readFile(join(vendor,'ENGINE_PIN.json'),'utf8'));
  assert.equal(receipt.schemaVersion,1);assert.equal(receipt.license,'Apache-2.0');
  assert.equal(receipt.repository,'https://github.com/QSOLKCB/VANILLAJS');
  assert.equal(receipt.commit,ENGINE_COMMIT);assert.deepEqual(receipt.roots,roots);
  assert.deepEqual(receipt.localChanges,[]);
  assert.ok(Array.isArray(receipt.modules)&&receipt.modules.length===roots.length);
  const allowed=['ENGINE_PIN.json','LICENSE','NOTICE',...roots.map(x=>'modules/'+x+'/index.js')].sort();
  assert.deepEqual(await walk(vendor),allowed,'vendor must be exactly the reviewed source set');
  for(let i=0;i<roots.length;i++){
    const item=receipt.modules[i],name=roots[i],entry='modules/'+name+'/index.js';
    assert.deepEqual(Object.keys(item).sort(),['depends','gitBlobSha','name','path']);
    assert.equal(item.name,name);assert.equal(item.path,'vendor/vanillajs/'+entry);
    assert.deepEqual(item.depends,[],'selected source modules must be dependency-free');
    assert.match(item.gitBlobSha,/^[a-f0-9]{40}$/);
    const source=await readFile(join(vendor,entry));
    assert.match(source.toString('utf8'),/^\/\/ SPDX-License-Identifier: Apache-2\.0\n/);
    assert.equal(gitBlob(source),item.gitBlobSha,'exact pinned Git blob: '+name);
    assert.deepEqual(imports(source.toString('utf8')),[],'module must not import undeclared code');
  }
  assert.match(await readFile(join(vendor,'LICENSE'),'utf8'),/Apache License/);
  assert.match(await readFile(join(vendor,'NOTICE'),'utf8'),/VANILLAJS/);
  return receipt;
}
export async function verifySource(root=ROOT){
  const receipt=await verifyVendor(root),paths=await publicFiles(root);
  for(const must of ['index.html','start.js','style.css','src/app.js','src/world.js','src/view.js','src/art.js','src/offline.js','vendor/vanillajs/ENGINE_PIN.json'])
    assert.ok(paths.includes(must),'missing game source: '+must);
  await verifyReferences(root,paths);
  assert.match(await readFile(join(root,'NOTICE'),'utf8'),/VANILLAJS/);
  assert.match(await readFile(join(root,'LICENSE'),'utf8'),/Apache License/);
  return {receipt,paths};
}
export async function verifyPackage({root=ROOT,directory=join(root,'dist')}={}){
  const {paths}=await verifySource(root),assets=await records(root,paths),version=packageVersion(assets);
  const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
  assert.deepEqual(Object.keys(manifest).sort(),['engineCommit','files','game','schemaVersion','version']);
  assert.equal(manifest.schemaVersion,1);assert.equal(manifest.game,'narc');
  assert.equal(manifest.engineCommit,ENGINE_COMMIT);assert.equal(manifest.version,version);
  const template=await readFile(join(root,'scripts/service-worker.template.js'),'utf8'),
    service=renderWorker(template,assets,version);
  const expected=[...assets,{path:'service-worker.js',bytes:Buffer.byteLength(service),sha256:hash(service)}].sort((a,b)=>a.path.localeCompare(b.path));
  assert.deepEqual(manifest.files,expected,'manifest must reflect current audited source bytes');
  assert.deepEqual(await walk(directory),[...expected.map(f=>f.path),'manifest.json'].sort(),'no extra or missing files');
  for(const file of expected){
    const bytes=await readFile(join(directory,file.path));
    assert.equal(bytes.length,file.bytes,'packaged size: '+file.path);
    assert.equal(hash(bytes),file.sha256,'packaged digest: '+file.path);
  }
  await verifyReferences(directory,expected.map(f=>f.path));
  return {version,files:expected.length,engineCommit:ENGINE_COMMIT};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2);
  if(args.length>1||(args.length&&args[0]!=='--source'))throw Error('usage: node narc/scripts/verify.mjs [--source]');
  const result=args[0]==='--source'?await verifySource():await verifyPackage();
  console.log('PASS Circuit Vice '+JSON.stringify(args[0]==='--source'?{sourceFiles:result.paths.length,engine:ENGINE_COMMIT}:result));
}
