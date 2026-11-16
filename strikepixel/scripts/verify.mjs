// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,ENGINE_COMMIT,hash,safePath,walk,publicFiles,records,packageVersion,renderWorker,imports,localReference,verifyReferences} from './package-lib.mjs';

export async function verifyVendor(root=ROOT){
  const vendor=join(root,'vendor/vanillajs'),receipt=JSON.parse(await readFile(join(vendor,'provenance.json'),'utf8'));
  assert.equal(receipt.schemaVersion,1);assert.equal(receipt.license,'Apache-2.0');
  assert.equal(receipt.engine.repository,'https://github.com/QSOLKCB/VANILLAJS');
  assert.equal(receipt.engine.commit,ENGINE_COMMIT);assert.equal(receipt.engine.release,'v2.5.0');
  assert.equal(receipt.engine.catalogue,'MODULES.json');assert.deepEqual(receipt.localChanges,[]);
  assert.ok(Array.isArray(receipt.files)&&receipt.files.length>0);
  const catalogue=JSON.parse(await readFile(join(vendor,'MODULES.json'),'utf8')),modules=new Set();
  function visit(name){
    assert.ok(Object.hasOwn(catalogue.modules,name),'unknown engine module: '+name);
    if(modules.has(name))return;modules.add(name);
    for(const dependency of catalogue.modules[name].depends)visit(dependency);
  }
  assert.ok(Array.isArray(receipt.selection.roots)&&receipt.selection.roots.length>0);
  assert.equal(new Set(receipt.selection.roots).size,receipt.selection.roots.length);
  for(const name of receipt.selection.roots)visit(name);
  assert.deepEqual(receipt.selection.modules,[...modules].sort(),'catalogue dependency closure');
  assert.deepEqual(receipt.selection.api,['api/audio/index.js','api/audio/effects.js']);
  const expected=['LICENSE','NOTICE','MODULES.json',...receipt.selection.api,...[...modules].map(name=>catalogue.modules[name].entry)].sort();
  assert.deepEqual(receipt.files.map(file=>file.path),expected,'source inventory exactly matches selected closure');
  assert.deepEqual(await walk(vendor),[...expected,'provenance.json'].sort(),'unexpected vendored source');
  for(const file of receipt.files){
    assert.ok(safePath(file.path));assert.equal(file.sourcePath,file.path);assert.deepEqual(file.localChanges,[]);
    const bytes=await readFile(join(vendor,file.path));
    assert.equal(bytes.length,file.bytes,'source size: '+file.path);assert.equal(hash(bytes),file.sha256,'source digest: '+file.path);
    if(file.path.endsWith('.js'))assert.match(bytes.toString('utf8'),/^\/\/ SPDX-License-Identifier: Apache-2\.0\n/);
  }
  assert.match(await readFile(join(vendor,'LICENSE'),'utf8'),/Apache License/);
  assert.ok((await readFile(join(vendor,'NOTICE'),'utf8')).length>100);
  for(const name of modules){
    const entry=catalogue.modules[name].entry,source=await readFile(join(vendor,entry),'utf8');
    const actual=imports(source).map(specifier=>localReference(entry,specifier));
    const declared=catalogue.modules[name].depends.map(dependency=>catalogue.modules[dependency].entry).sort();
    assert.deepEqual([...new Set(actual)].sort(),declared,'actual imports match catalogue: '+name);
  }
  await verifyReferences(vendor,expected);
  return receipt;
}
export async function verifySource(root=ROOT){
  const receipt=await verifyVendor(root),paths=await publicFiles(root);
  await verifyReferences(root,paths);
  assert.match(await readFile(join(root,'LICENSE'),'utf8'),/Apache License/);
  const notice=await readFile(join(root,'NOTICE'),'utf8');
  assert.ok(notice.includes('VANILLAJS')&&notice.includes(ENGINE_COMMIT),'game NOTICE identifies engine source');
  return {receipt,paths};
}
export async function verifyPackage({root=ROOT,directory=join(root,'dist')}={}){
  const {paths}=await verifySource(root),assets=await records(root,paths),version=packageVersion(assets);
  const manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8'));
  assert.equal(manifest.schemaVersion,1);assert.equal(manifest.game,'strikepixel');
  assert.equal(manifest.engineCommit,ENGINE_COMMIT);assert.equal(manifest.version,version);
  const template=await readFile(join(root,'scripts/service-worker.template.js'),'utf8'),worker=renderWorker(template,assets,version);
  const expected=[...assets,{path:'service-worker.js',bytes:Buffer.byteLength(worker),sha256:hash(worker)}].sort((a,b)=>a.path.localeCompare(b.path));
  assert.deepEqual(manifest.files,expected,'package matches current allowed source bytes');
  assert.deepEqual(await walk(directory),[...expected.map(file=>file.path),'manifest.json'].sort(),'package has no extra or missing files');
  for(const file of expected){
    const bytes=await readFile(join(directory,file.path));
    assert.equal(bytes.length,file.bytes,'package size: '+file.path);assert.equal(hash(bytes),file.sha256,'package digest: '+file.path);
  }
  await verifyReferences(directory,expected.map(file=>file.path));
  return {version,files:expected.length,engineCommit:ENGINE_COMMIT};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2);
  if(args.length>1||(args.length===1&&args[0]!=='--source'))throw Error('usage: node strikepixel/scripts/verify.mjs [--source]');
  const result=args[0]==='--source'?await verifySource():await verifyPackage();
  console.log('PASS Strike Pixel '+(args[0]==='--source'?'source/provenance':'static/offline package')+' '+JSON.stringify(args[0]==='--source'?{files:result.paths.length}:result));
}
