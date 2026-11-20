// SPDX-License-Identifier: Apache-2.0
import {readFile,writeFile,mkdir,copyFile,rm} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,ENGINE_COMMIT,hash,records,packageVersion,renderWorker} from './package-lib.mjs';
import {verifySource,verifyPackage} from './verify.mjs';

export async function build({root=ROOT}={}){
  const {paths}=await verifySource(root),assets=await records(root,paths),version=packageVersion(assets);
  const template=await readFile(join(root,'scripts/service-worker.template.js'),'utf8'),worker=renderWorker(template,assets,version);
  const out=join(root,'dist');await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
  for(const path of paths){await mkdir(dirname(join(out,path)),{recursive:true});await copyFile(join(root,path),join(out,path));}
  await writeFile(join(out,'service-worker.js'),worker);
  const files=[...assets,{path:'service-worker.js',bytes:Buffer.byteLength(worker),sha256:hash(worker)}].sort((a,b)=>a.path.localeCompare(b.path));
  await writeFile(join(out,'manifest.json'),JSON.stringify({schemaVersion:1,game:'narc',engineCommit:ENGINE_COMMIT,version,files},null,2)+'\n');
  return verifyPackage({root,directory:out});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length!==2)throw Error('usage: node narc/scripts/build.mjs');
  console.log('Built Circuit Vice '+JSON.stringify(await build()));
}
