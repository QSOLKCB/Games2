// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {resolve,join,posix} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT=resolve(fileURLToPath(new URL('../',import.meta.url)));
export const ENGINE_COMMIT='32b4fb1ca80e854297998aa00f87a8f012398b89';
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export const safePath=path=>typeof path==='string'&&/^[A-Za-z0-9._/-]+$/.test(path)&&!path.startsWith('/')&&!path.split('/').some(part=>!part||part==='.'||part==='..');
const filesAtRoot=new Set(['index.html','start.js','style.css','LICENSE','NOTICE','README.md','ROADMAP.md','VERIFICATION.md']);
const directories=new Set(['src','vendor','icons','locales','docs']);
const extensions=/\.(?:js|mjs|json|css|html|svg|png|webp|ico|woff2)$/;
export function publicPath(path){
  if(!safePath(path)||path.split('/').some(part=>part.startsWith('.')||['node_modules','tests','scripts','profiles'].includes(part)))return false;
  if(filesAtRoot.has(path))return true;
  if(!directories.has(path.split('/')[0]))return false;
  if(path.startsWith('docs/'))return path.endsWith('.md');
  if(path.startsWith('vendor/vanillajs/'))return /\.(?:js|json)$/.test(path)||/\/(?:LICENSE|NOTICE)$/.test(path);
  return extensions.test(path);
}
export async function walk(root,prefix=''){
  if(!prefix){const entry=await lstat(root);assert.ok(entry.isDirectory()&&!entry.isSymbolicLink(),'inventory root must be a real directory');}
  const entries=await readdir(join(root,prefix),{withFileTypes:true}),paths=[];
  for(const entry of entries){
    const path=prefix?prefix+'/'+entry.name:entry.name;
    assert.ok(!entry.isSymbolicLink(),'symlink is not a package input: '+path);
    if(entry.isDirectory())paths.push(...await walk(root,path));
    else{assert.ok(entry.isFile(),'non-file package input: '+path);paths.push(path);}
  }
  return paths.sort();
}
export async function publicFiles(root=ROOT){
  const paths=[];
  for(const entry of await readdir(root,{withFileTypes:true})){
    if(!filesAtRoot.has(entry.name)&&!directories.has(entry.name))continue;
    assert.ok(!entry.isSymbolicLink(),'symlink is not a package input: '+entry.name);
    if(directories.has(entry.name)){assert.ok(entry.isDirectory(),entry.name+' must be a directory');paths.push(...await walk(root,entry.name));}
    else{assert.ok(entry.isFile(),entry.name+' must be a file');paths.push(entry.name);}
  }
  for(const required of ['index.html','start.js','style.css','LICENSE','NOTICE','src/offline.js','vendor/vanillajs/provenance.json'])assert.ok(paths.includes(required),'missing public input: '+required);
  for(const path of paths)assert.ok(publicPath(path),'non-public file inside runtime tree: '+path);
  return paths.sort();
}
export async function records(root,paths){
  return Promise.all(paths.map(async path=>{const bytes=await readFile(join(root,path));return {path,bytes:bytes.length,sha256:hash(bytes)};}));
}
export function packageVersion(files){return hash(JSON.stringify(files));}
export function renderWorker(template,files,version){
  assert.equal(template.split('__PACKAGE_VERSION__').length,2,'one worker version slot');
  assert.equal(template.split('__PACKAGE_FILES__').length,2,'one worker inventory slot');
  return template.replace('__PACKAGE_VERSION__',JSON.stringify(version)).replace('__PACKAGE_FILES__',JSON.stringify(files));
}
export function imports(source){
  const references=[];
  for(const match of source.matchAll(/\b(?:import|export)\s+(?:\{[^}]*\}|\*\s*(?:as\s+\w+)?|[\w$]+(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+))?)\s+from\s*(['"])([^'"]+)\1/g))references.push(match[2]);
  for(const match of source.matchAll(/\bimport\s*(['"])([^'"]+)\1/g))references.push(match[2]);
  const dynamic=[...source.matchAll(/\bimport\s*\(/g)],literal=[...source.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g)];
  assert.equal(dynamic.length,literal.length,'dynamic imports must use a literal local path');
  references.push(...literal.map(match=>match[2]));
  return references;
}
export function localReference(from,specifier){
  assert.ok(typeof specifier==='string'&&!/[?#\\]/.test(specifier)&&!specifier.startsWith('/')&&!/^[a-z][a-z0-9+.-]*:/i.test(specifier),'external or ambiguous resource: '+specifier);
  const path=posix.normalize(posix.join(posix.dirname(from),specifier));
  assert.ok(safePath(path),'escaping resource: '+specifier);
  return path;
}
export async function verifyReferences(root,paths){
  const inventory=new Set(paths);
  for(const path of paths){
    if(!/\.(?:js|mjs|html|css)$/.test(path))continue;
    const source=await readFile(join(root,path),'utf8'),references=[];
    if(/\.[cm]?js$/.test(path)){
      for(const specifier of imports(source)){
        assert.ok(specifier.startsWith('.'),'module imports must be relative: '+path+' '+specifier);
        references.push(specifier);
      }
    }
    if(path.endsWith('.html')){
      for(const tag of source.matchAll(/<(?:script|link|img|audio|video|source|iframe)\b[^>]*>/gi)){
        assert.doesNotMatch(tag[0],/\b(?:src|href)\s*=\s*[^\s'"=]/i,'HTML resources must use quoted paths: '+path);
        for(const attribute of tag[0].matchAll(/\b(?:src|href)\s*=\s*(['"])(.*?)\1/gi))references.push(attribute[2]);
      }
      for(const script of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi))assert.equal(script[1].trim(),'','inline scripts are not supported by the static import audit: '+path);
    }
    if(path.endsWith('.css'))for(const match of source.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)|@import\s+['"]([^'"]+)['"]/g))references.push(match[1]??match[2]);
    for(const specifier of references){
      if(specifier.startsWith('data:')||specifier.startsWith('#'))continue;
      const target=localReference(path,specifier);
      assert.ok(inventory.has(target),'missing local resource: '+path+' -> '+target);
      assert.ok((await lstat(join(root,target))).isFile(),'resource is not a regular file: '+target);
    }
  }
}
