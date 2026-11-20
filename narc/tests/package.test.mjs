// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {build} from '../scripts/build.mjs';
import {ROOT,ENGINE_COMMIT} from '../scripts/package-lib.mjs';
import {verifySource,verifyPackage,verifyVendor} from '../scripts/verify.mjs';
test('source pin is the exact audited six-module VANILLAJS closure',async()=>{
  const receipt=await verifyVendor();assert.equal(receipt.commit,ENGINE_COMMIT);
  assert.equal(receipt.modules.length,6);assert.deepEqual(receipt.localChanges,[]);
  assert.deepEqual(receipt.modules.map(item=>item.depends),Array.from({length:6},()=>[]));
  const source=await verifySource();
  for(const path of ['src/world.js','src/art.js','src/view.js','src/app.js','src/offline.js'])
    assert.ok(source.paths.includes(path));
});
test('game package is reproducible, sealed, excludes tools, and detects corruption',async()=>{
  const one=await build(),first=await readFile(join(ROOT,'dist/manifest.json'),'utf8');
  const two=await build();
  assert.equal(one.version,two.version);assert.equal(await readFile(join(ROOT,'dist/manifest.json'),'utf8'),first);
  const names=JSON.parse(first).files.map(f=>f.path);
  assert.ok(names.includes('service-worker.js')&&names.includes('src/world.js'));
  assert.ok(!names.some(x=>x.startsWith('tests/')||x.startsWith('scripts/')||x.includes('node_modules')));
  const target=join(ROOT,'dist/style.css'),original=await readFile(target);
  try{await writeFile(target,'CORRUPT');await assert.rejects(verifyPackage(),/size|digest/);}
  finally{await writeFile(target,original);}
  await verifyPackage();
});
