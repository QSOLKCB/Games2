// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,cp,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildSite} from '../scripts/build-site.mjs';
import {verifySite,verifySourceSite} from '../scripts/verify-site.mjs';
import {ROOT,sha256} from '../scripts/site-lib.mjs';

const game=(slug,status='playable')=>({slug,title:slug,subtitle:'Fixture cartridge',description:'A local test game.',genre:'Arcade',status,directory:slug,artwork:'cabinet/assets/fixture.svg',order:0});
const buildScript=`import {readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import {join,dirname,basename} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url)),slug=basename(root.slice(0,-1));
const hash=b=>createHash('sha256').update(b).digest('hex');
let count=0;try{count=Number(await readFile(join(root,'build-count.txt'),'utf8'));}catch{}
await writeFile(join(root,'build-count.txt'),String(count+1));
await rm(join(root,'dist'),{recursive:true,force:true});
const paths=['index.html','app.js','runtime/level.json','LICENSE','NOTICE','service-worker.js'],files=[];
for(const path of paths){const raw=await readFile(join(root,path));await mkdir(dirname(join(root,'dist',path)),{recursive:true});await copyFile(join(root,path),join(root,'dist',path));files.push({path,bytes:raw.length,sha256:hash(raw)});}
const version=hash(JSON.stringify(files));await writeFile(join(root,'dist/manifest.json'),JSON.stringify({schemaVersion:1,game:slug,version,files}));
`;
const verifyScript=`import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const root=new URL('../dist/',import.meta.url),manifest=JSON.parse(await readFile(new URL('manifest.json',root),'utf8'));
for(const file of manifest.files){const bytes=await readFile(new URL(file.path,root));assert.equal(bytes.length,file.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);}
`;
async function fixture(t){
  const root=await mkdtemp(join(tmpdir(),'games2-cabinet-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await mkdir(join(root,'cabinet/assets'),{recursive:true});await mkdir(join(root,'docs'));
  await writeFile(join(root,'index.html'),'<!doctype html><link rel="stylesheet" href="cabinet/style.css"><script type="module" src="cabinet/app.js"></script>');
  await writeFile(join(root,'cabinet/app.js'),"import {launchPath} from './registry.js'; export {launchPath};");
  await cp(join(ROOT,'cabinet/registry.js'),join(root,'cabinet/registry.js'));
  await writeFile(join(root,'cabinet/style.css'),'body{background:#123}');
  await writeFile(join(root,'cabinet/assets/fixture.svg'),'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32"/></svg>');
  await writeFile(join(root,'docs/GAME_IDEAS.md'),'# Preserved catalogue');await writeFile(join(root,'LICENSE'),'Apache License, Version 2.0');
  for(const slug of ['alpha','beta']){
    const directory=join(root,slug);await mkdir(join(directory,'scripts'),{recursive:true});await mkdir(join(directory,'runtime'));
    for(const path of ['README.md','ROADMAP.md','AGENTS.md','LICENSE','NOTICE'])await writeFile(join(directory,path),slug+' '+path);
    await writeFile(join(directory,'index.html'),'<script type="module" src="app.js"></script>');
    await writeFile(join(directory,'app.js'),'export const game='+JSON.stringify(slug)+';');
    await writeFile(join(directory,'runtime/level.json'),JSON.stringify({game:slug,level:1}));
    await writeFile(join(directory,'service-worker.js'),'// independent '+slug+' worker');
    await writeFile(join(directory,'scripts/build.mjs'),buildScript);await writeFile(join(directory,'scripts/verify.mjs'),verifyScript);
  }
  await writeFile(join(root,'cartridges.json'),JSON.stringify({schemaVersion:1,cartridges:[game('alpha'),game('beta','released'),{slug:'future',title:'Future',subtitle:'Not built',description:'Concept only',genre:'Space',status:'concept',order:5}]}));
  return root;
}
test('full site builds retain two complete games and rebuild both after only one changes',async t=>{
  const root=await fixture(t);const first=await buildSite({root});assert.deepEqual(first.games,['alpha','beta']);
  const manifest=JSON.parse(await readFile(join(root,'site/site-manifest.json'),'utf8'));
  assert.ok(manifest.files.some(file=>file.path==='alpha/runtime/level.json'));
  assert.ok(manifest.files.some(file=>file.path==='beta/service-worker.js'));
  assert.ok(!manifest.files.some(file=>file.path.startsWith('future/')||file.path==='service-worker.js'));
  const alpha=manifest.games.find(row=>row.slug==='alpha').packageSHA256;
  await writeFile(join(root,'beta/app.js'),'export const changed=true;');await buildSite({root});
  const next=JSON.parse(await readFile(join(root,'site/site-manifest.json'),'utf8'));
  assert.equal(next.games.find(row=>row.slug==='alpha').packageSHA256,alpha);
  assert.notEqual(next.version,manifest.version);
  for(const slug of ['alpha','beta']){
    assert.equal(await readFile(join(root,slug,'build-count.txt'),'utf8'),'2');
    for(const file of next.files.filter(file=>file.path.startsWith(slug+'/'))){
      const original=await readFile(join(root,slug,'dist',file.path.slice(slug.length+1)));
      assert.deepEqual(await readFile(join(root,'site',file.path)),original);assert.equal(file.sha256,sha256(original));
    }
  }
  assert.deepEqual((await verifySite({root})).games,['alpha','beta']);
});
test('source validation rejects missing entries, artwork, unknown runtime files and undeclared game directories',async t=>{
  const root=await fixture(t);await verifySourceSite(root);
  const index=await readFile(join(root,'alpha/index.html'));await rm(join(root,'alpha/index.html'));await assert.rejects(verifySourceSite(root));await writeFile(join(root,'alpha/index.html'),index);
  await rm(join(root,'cabinet/assets/fixture.svg'));await assert.rejects(verifySourceSite(root),/artwork/);
  await writeFile(join(root,'cabinet/assets/fixture.svg'),'<svg/>');
  await writeFile(join(root,'cabinet/private-profile.json'),'{}');await assert.rejects(verifySourceSite(root),/unknown cabinet runtime/);await rm(join(root,'cabinet/private-profile.json'));
  await mkdir(join(root,'undeclared-game'));await assert.rejects(verifySourceSite(root),/undeclared source directory/);
});
test('symlinked build scripts, their ancestors and runtime resources cannot enter a site',async t=>{
  const root=await fixture(t),script=join(root,'alpha/scripts/build.mjs');
  await rm(script);await symlink(join(root,'beta/scripts/build.mjs'),script);await assert.rejects(buildSite({root}),/symlink/);
  await rm(script);await writeFile(script,buildScript);
  await rm(join(root,'alpha/scripts'),{recursive:true});await symlink(join(root,'beta/scripts'),join(root,'alpha/scripts'));await assert.rejects(buildSite({root}),/symlink/);
  await rm(join(root,'alpha/scripts'));await mkdir(join(root,'alpha/scripts'));await writeFile(script,buildScript);await writeFile(join(root,'alpha/scripts/verify.mjs'),verifyScript);
  await rm(join(root,'cabinet/assets/fixture.svg'));await symlink(join(root,'LICENSE'),join(root,'cabinet/assets/fixture.svg'));await assert.rejects(verifySourceSite(root),/symlink/);
});
test('verification catches extra files, empty undeclared directories and altered copied game bytes',async t=>{
  const root=await fixture(t);await buildSite({root});
  await writeFile(join(root,'site/profile.json'),'{}');await assert.rejects(verifySite({root}),/unexpected or missing/);await rm(join(root,'site/profile.json'));
  await mkdir(join(root,'site/unregistered-game'));await assert.rejects(verifySite({root}),/undeclared or empty/);await rm(join(root,'site/unregistered-game'),{recursive:true});
  await writeFile(join(root,'site/alpha/runtime/level.json'),'modified');await assert.rejects(verifySite({root}),/published bytes/);
});
test('invalid game output blocks publication while preserving the previously complete site',async t=>{
  const root=await fixture(t);await buildSite({root});const before=await readFile(join(root,'site/site-manifest.json'));
  await writeFile(join(root,'alpha/scripts/build.mjs'),buildScript+`\nconst target=join(root,'dist/manifest.json');const broken=JSON.parse(await readFile(target,'utf8'));broken.files=broken.files.filter(file=>file.path!=='index.html');await rm(join(root,'dist/index.html'));await writeFile(target,JSON.stringify(broken));\n`);
  await assert.rejects(buildSite({root}),/missing index.html/);
  assert.deepEqual(await readFile(join(root,'site/site-manifest.json')),before);
});
test('invented package entries, escaping imports and external artwork are rejected',async t=>{
  const root=await fixture(t);await buildSite({root});
  const path=join(root,'alpha/dist/manifest.json'),manifest=JSON.parse(await readFile(path,'utf8'));
  manifest.files.push({path:'../outside',bytes:0,sha256:'0'.repeat(64)});await writeFile(path,JSON.stringify(manifest));
  await assert.rejects(verifySite({root}));
  await writeFile(join(root,'cabinet/app.js'),"import 'https://example.invalid/engine.js';");await assert.rejects(verifySourceSite(root),/relative/);
  await writeFile(join(root,'cabinet/app.js'),"import '../../outside.js';");await assert.rejects(verifySourceSite(root),/escaping/);
  await writeFile(join(root,'cabinet/app.js'),"import './registry.js';");
  await writeFile(join(root,'cabinet/assets/fixture.svg'),'<svg><image href="https://example.invalid/pixel.png"/></svg>');await assert.rejects(verifySourceSite(root),/another resource/);
});
test('a permissive game verifier cannot publish correctly hashed private tooling or credential files',async t=>{
  const root=await fixture(t);await buildSite({root});
  const manifestPath=join(root,'alpha/dist/manifest.json'),original=await readFile(manifestPath,'utf8');
  for(const path of ['tests/output.log','profiles/session.json','scripts/private.js','evidence/receipt.json','secrets/token.txt','certificate.pem','package.json']){
    const bytes=Buffer.from('private fixture data'),manifest=JSON.parse(original);
    const file=join(root,'alpha/dist',path);await mkdir(join(file,'..'),{recursive:true});await writeFile(file,bytes);
    manifest.files.push({path,bytes:bytes.length,sha256:sha256(bytes)});await writeFile(manifestPath,JSON.stringify(manifest));
    // Its fixed game verifier checks every declared hash and succeeds. The
    // independent site boundary must still reject development/private files.
    await assert.rejects(verifySite({root}),/private package/);
    await rm(file);await writeFile(manifestPath,original);
  }
});
test('default-plus-named and namespace imports cannot bypass local module validation',async t=>{
  const root=await fixture(t),app=join(root,'cabinet/app.js');
  const registry=join(root,'cabinet/registry.js');await writeFile(registry,(await readFile(registry,'utf8'))+'\nexport default null;\n');
  await writeFile(app,"import registry, {launchPath as path} from './registry.js'; export {path};");
  await verifySourceSite(root);
  await writeFile(app,"import registry /* binding comment */, {launchPath} /* URL comment */ from './registry.js';");
  await verifySourceSite(root);
  for(const source of [
    "import registry, {launchPath} from 'https://example.invalid/registry.js';",
    "import registry, * as namespace from 'https://example.invalid/registry.js';",
    "import registry /* binding comment */, {launchPath} from 'https://example.invalid/registry.js';",
    "import registry, {launchPath} from '../../outside.js';",
    "export {launchPath} from 'https://example.invalid/registry.js';"
  ]){await writeFile(app,source);await assert.rejects(verifySourceSite(root),/relative|escaping/);}
});
test('SVG stylesheet imports are rejected in quoted, URL and mixed-case forms',async t=>{
  const root=await fixture(t),art=join(root,'cabinet/assets/fixture.svg');
  for(const rule of ['@import "https://example.invalid/style.css";','@import \'https://example.invalid/style.css\';','@import url("https://example.invalid/style.css");','@IMPORT "https://example.invalid/style.css";']){
    await writeFile(art,'<svg xmlns="http://www.w3.org/2000/svg"><style>'+rule+'</style><rect width="10" height="10"/></svg>');
    await assert.rejects(verifySourceSite(root),/SVG stylesheet imports/);
  }
});
test('shell-like catalogue metadata remains inert data and never selects a command',async t=>{
  const root=await fixture(t),file=join(root,'cartridges.json'),registry=JSON.parse(await readFile(file,'utf8'));
  registry.cartridges[0].title='$(touch should-not-exist)';
  registry.cartridges[0].description='`touch should-not-exist`; shell punctuation is only a description.';
  await writeFile(file,JSON.stringify(registry));await buildSite({root});
  assert.equal(JSON.parse(await readFile(join(root,'site/cartridges.json'),'utf8')).cartridges[0].title,registry.cartridges[0].title);
  await assert.rejects(readFile(join(root,'should-not-exist')),error=>error.code==='ENOENT');
  registry.cartridges[0].command='touch should-not-exist';await writeFile(file,JSON.stringify(registry));
  await assert.rejects(verifySourceSite(root),/unknown field/);
  await assert.rejects(readFile(join(root,'should-not-exist')),error=>error.code==='ENOENT');
});
