// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {join,resolve,posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {parseRegistry,launchPath} from '../cabinet/registry.js';

export const ROOT=resolve(fileURLToPath(new URL('../',import.meta.url)));
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const digestRows=rows=>sha256(JSON.stringify(rows));
const requiredCabinet=['index.html','cabinet/app.js','cabinet/style.css','cabinet/registry.js','cartridges.json','LICENSE','docs/GAME_IDEAS.md'];
const safePath=path=>typeof path==='string'&&/^[A-Za-z0-9._/-]+$/.test(path)&&!path.startsWith('/')&&!path.split('/').some(part=>!part||part==='.'||part==='..'||part.startsWith('.'));
const sortRows=rows=>rows.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
export async function assertPath(root,path,type='file'){
  assert.ok(safePath(path),'unsafe local path: '+path);
  const base=await lstat(root);assert.ok(base.isDirectory()&&!base.isSymbolicLink(),'source root must be a real directory');
  const parts=path.split('/');
  for(let i=0;i<parts.length;i++){
    const entry=await lstat(join(root,...parts.slice(0,i+1)));
    assert.ok(!entry.isSymbolicLink(),'symlink forbidden: '+parts.slice(0,i+1).join('/'));
    assert.ok(i===parts.length-1&&type==='file'?entry.isFile():entry.isDirectory(),'wrong local path type: '+path);
  }
}
export async function walk(root,{allowPrivate=false}={}){
  const files=[],directories=[];
  const base=await lstat(root);assert.ok(base.isDirectory()&&!base.isSymbolicLink(),'inventory root must be a real directory');
  async function visit(prefix){
    for(const entry of await readdir(join(root,prefix),{withFileTypes:true})){
      const path=prefix?prefix+'/'+entry.name:entry.name;
      assert.ok(safePath(path)||(allowPrivate&&/^[A-Za-z0-9._/-]+$/.test(path)&&!path.split('/').some(part=>part==='.'||part==='..')),'unsafe inventory path: '+path);
      assert.ok(!entry.isSymbolicLink(),'symlink forbidden: '+path);
      if(entry.isDirectory()){directories.push(path);await visit(path);}
      else{assert.ok(entry.isFile(),'non-file inventory member: '+path);files.push(path);}
    }
  }
  await visit('');return {files:files.sort(),directories:directories.sort()};
}
function parentDirectories(files){
  const paths=new Set();for(const file of files){const parts=file.split('/');for(let i=1;i<parts.length;i++)paths.add(parts.slice(0,i).join('/'));}
  return [...paths].sort();
}
export async function exactInventory(directory,files){
  const actual=await walk(directory);
  assert.deepEqual(actual.files,[...files].sort(),'unexpected or missing published files');
  assert.deepEqual(actual.directories,parentDirectories(files),'undeclared or empty published directory');
}
export async function fileRows(root,paths){
  return sortRows(await Promise.all(paths.map(async path=>{await assertPath(root,path);const bytes=await readFile(join(root,path));return {path,bytes:bytes.length,sha256:sha256(bytes)};})));
}
function local(from,reference){
  assert.ok(!/^[a-z][a-z0-9+.-]*:/i.test(reference)&&!/[?#\\]/.test(reference)&&!reference.startsWith('/'),'non-local runtime reference: '+reference);
  const path=posix.normalize(posix.join(posix.dirname(from),reference));assert.ok(safePath(path),'escaping runtime reference: '+reference);return path;
}
async function cabinetReferences(root,paths){
  const inventory=new Set(paths);
  for(const path of paths){
    if(!/\.(?:js|css|html|svg)$/.test(path))continue;
    const source=await readFile(join(root,path),'utf8'),references=[];
    if(path.endsWith('.js')){
      // Module clauses may combine a default binding with named or namespace
      // bindings. Comments between tokens are separators, not a way to hide a
      // module URL; quoted specifiers themselves are left intact.
      const gap='(?:\\s|/\\*[\\s\\S]*?\\*/|//[^\\n]*(?:\\n|$))*';
      const binding='[\\w$]+',named='\\{[^}]*\\}',namespace='\\*'+gap+'(?:as\\b'+gap+binding+')?';
      const clause='(?:'+named+'|'+namespace+'|'+binding+'(?:'+gap+','+gap+'(?:'+named+'|'+namespace+'))?)';
      const declarations=new RegExp('\\b(?:import|export)\\b'+gap+clause+gap+'from\\b'+gap+'([\'\"])([^\'\"]+)\\1|\\bimport\\b'+gap+'([\'\"])([^\'\"]+)\\3','g');
      for(const match of source.matchAll(declarations))references.push(match[2]??match[4]);
      const dynamic=[...source.matchAll(/\bimport\s*\(/g)],literal=[...source.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g)];
      assert.equal(dynamic.length,literal.length,'nonliteral runtime import: '+path);references.push(...literal.map(match=>match[2]));
      for(const specifier of references)assert.ok(specifier.startsWith('.'),'module imports must be relative: '+path);
    }
    if(path.endsWith('.html')){
      for(const tag of source.matchAll(/<(?:script|link|img|source|audio|video|iframe)\b[^>]*>/gi)){
        assert.doesNotMatch(tag[0],/\b(?:src|href)\s*=\s*[^\s'"=]/i,'unquoted runtime path: '+path);
        for(const match of tag[0].matchAll(/\b(?:src|href)\s*=\s*(['"])(.*?)\1/gi))references.push(match[2]);
      }
      for(const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi))assert.equal(match[1].trim(),'','inline executable script: '+path);
    }
    if(path.endsWith('.css'))for(const match of source.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)|@import\s+['"]([^'"]+)['"]/g))references.push(match[1]??match[2]);
    if(path.endsWith('.svg')){
      assert.ok(Buffer.byteLength(source)<=524288&&/<svg\b/i.test(source),'invalid or oversized SVG: '+path);
      assert.doesNotMatch(source,/<(?:script|foreignObject)\b|\bon[a-z]+\s*=|<!DOCTYPE|<!ENTITY/i,'executable SVG content: '+path);
      assert.doesNotMatch(source,/@import\b/i,'SVG stylesheet imports are not allowed: '+path);
      for(const match of source.matchAll(/\b(?:href|src)\s*=\s*(['"])(.*?)\1/gi))assert.ok(match[2].startsWith('#'),'SVG must not load another resource: '+path);
      for(const match of source.matchAll(/url\(\s*['"]?([^)'"\s]+)/g))assert.ok(match[1].startsWith('#'),'SVG must not load another resource: '+path);
    }
    for(const reference of references){
      if(reference.startsWith('#'))continue;
      const target=local(path,reference);assert.ok(inventory.has(target),'missing runtime reference: '+path+' -> '+target);
    }
  }
}
export async function verifySourceSite(root=ROOT){
  await assertPath(root,'cartridges.json');
  const raw=await readFile(join(root,'cartridges.json'),'utf8'),registry=parseRegistry(raw);
  const approved=registry.cartridges.filter(row=>launchPath(row)!==null).sort((a,b)=>a.slug.localeCompare(b.slug));
  const directories=new Set(['cabinet','docs','scripts','tests','site','evidence','browser-artifacts','.git','.github',...registry.cartridges.filter(row=>row.directory).map(row=>row.directory)]);
  for(const entry of await readdir(root,{withFileTypes:true}))if((entry.isDirectory()||entry.isSymbolicLink())&&!directories.has(entry.name)&&!entry.name.startsWith('.site-build-'))throw Error('undeclared source directory: '+entry.name);
  const cabinet=await walk(join(root,'cabinet'));
  const paths=[...requiredCabinet];
  for(const path of cabinet.files){
    if(['app.js','style.css','registry.js'].includes(path))continue;
    assert.match(path,/^assets\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/,'unknown cabinet runtime file');paths.push('cabinet/'+path);
  }
  assert.ok(cabinet.directories.every(path=>path==='assets'),'unknown cabinet runtime directory');
  for(const path of paths)await assertPath(root,path);
  for(const row of registry.cartridges){
    if(row.artwork)assert.ok(paths.includes(row.artwork),'missing cartridge artwork: '+row.slug);
    if(row.directory)await assertPath(root,row.directory,'directory');
  }
  for(const row of approved){
    for(const path of ['index.html','README.md','ROADMAP.md','AGENTS.md','LICENSE','NOTICE','scripts/build.mjs','scripts/verify.mjs'])await assertPath(root,row.directory+'/'+path);
    // Inspect every existing game source/output path before invoking its fixed
    // local scripts. No registry field selects a command or module to execute.
    await walk(join(root,row.directory),{allowPrivate:true});
  }
  await cabinetReferences(root,paths);
  return {registry,approved,paths:paths.sort(),registrySHA256:sha256(raw)};
}
export function runGame(root,slug,command){
  assert.ok(['build','verify'].includes(command));
  const path=join(root,slug,'scripts',command+'.mjs');
  const result=spawnSync(process.execPath,[path],{cwd:join(root,slug),encoding:'utf8',maxBuffer:4*1024*1024});
  if(result.error||result.status!==0)throw Error(slug+' '+command+' failed: '+(result.error?.message??'')+'\n'+result.stdout+'\n'+result.stderr);
  return result.stdout.trim();
}
export async function inspectGame(root,row){
  const directory=join(root,row.directory,'dist');await assertPath(root,row.directory+'/dist','directory');
  await assertPath(directory,'manifest.json');
  const raw=await readFile(join(directory,'manifest.json')),manifest=JSON.parse(raw);
  assert.ok(manifest&&typeof manifest==='object'&&!Array.isArray(manifest));
  const allowed=['schemaVersion','game','version','engineCommit','files'];
  assert.ok(Object.keys(manifest).every(key=>allowed.includes(key)),'unknown game manifest field: '+row.slug);
  assert.equal(manifest.schemaVersion,1);assert.equal(manifest.game,row.slug);assert.match(manifest.version,/^[a-f0-9]{64}$/);
  if(manifest.engineCommit!==undefined)assert.match(manifest.engineCommit,/^[a-f0-9]{40}$/);
  assert.ok(Array.isArray(manifest.files)&&manifest.files.length>0&&manifest.files.length<=10000);
  const paths=[],seen=new Set();
  for(const file of manifest.files){
    assert.ok(file&&typeof file==='object'&&!Array.isArray(file));assert.deepEqual(Object.keys(file).sort(),['bytes','path','sha256']);
    assert.ok(safePath(file.path)&&file.path!=='manifest.json'&&!seen.has(file.path),'unsafe or duplicate package path');
    assert.ok(!file.path.split('/').some(part=>['node_modules','browser-artifacts','tests','scripts','evidence','profiles','coverage','tmp','temp','secrets','credentials','.git','.github'].includes(part)),'private package member');
    assert.ok(!/\.(?:log|pem|key|p12|pfx|lock)$/i.test(file.path)&&!/(?:^|\/)(?:package(?:-lock)?\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(file.path),'private package file');
    assert.ok(Number.isSafeInteger(file.bytes)&&file.bytes>=0);assert.match(file.sha256,/^[a-f0-9]{64}$/);
    seen.add(file.path);paths.push(file.path);
  }
  for(const required of ['index.html','LICENSE','NOTICE'])assert.ok(seen.has(required),'game package missing '+required+': '+row.slug);
  await exactInventory(directory,[...paths,'manifest.json']);
  const files=await fileRows(directory,paths);
  assert.deepEqual(files,sortRows(manifest.files.map(file=>({...file}))),'game package digest mismatch: '+row.slug);
  const complete=await fileRows(directory,[...paths,'manifest.json']);
  return {directory,files:complete,summary:{slug:row.slug,version:manifest.version,manifestSHA256:sha256(raw),packageSHA256:digestRows(complete),files:complete.length}};
}
export async function sitePlan(root,source){
  const files=await fileRows(root,source.paths),games=[],copies=files.map(file=>({from:join(root,file.path),to:file.path}));
  for(const row of source.approved){
    const game=await inspectGame(root,row);games.push(game.summary);
    for(const file of game.files){files.push({...file,path:row.slug+'/'+file.path});copies.push({from:join(game.directory,file.path),to:row.slug+'/'+file.path});}
  }
  sortRows(files);
  return {copies,manifest:{schemaVersion:1,site:'games2-cartridge-cabinet',version:digestRows(files),registrySHA256:source.registrySHA256,games,files}};
}
export async function compareSite(directory,manifest){
  await exactInventory(directory,[...manifest.files.map(file=>file.path),'site-manifest.json']);
  const actual=JSON.parse(await readFile(join(directory,'site-manifest.json'),'utf8'));
  assert.deepEqual(actual,manifest,'site manifest is stale or contains unknown entries');
  assert.deepEqual(await fileRows(directory,manifest.files.map(file=>file.path)),manifest.files,'published bytes do not match approved packages');
  return {version:manifest.version,files:manifest.files.length,games:manifest.games.map(game=>game.slug)};
}
