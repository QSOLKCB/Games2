// SPDX-License-Identifier: Apache-2.0
import {mkdtemp,mkdir,copyFile,writeFile,rm,rename,lstat} from 'node:fs/promises';
import {join,dirname,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,verifySourceSite,runGame,sitePlan,compareSite} from './site-lib.mjs';

export async function buildSite({root=ROOT}={}){
  const source=await verifySourceSite(root),out=join(root,'site');
  try{const entry=await lstat(out);if(entry.isSymbolicLink()||!entry.isDirectory())throw Error('site output must be a real directory');}
  catch(error){if(error.code!=='ENOENT')throw error;}
  for(const row of source.approved){
    console.log('Building '+row.slug);const built=runGame(root,row.slug,'build');if(built)console.log(built);
    const checked=runGame(root,row.slug,'verify');if(checked)console.log(checked);
  }
  const plan=await sitePlan(root,source),staging=await mkdtemp(join(root,'.site-build-'));
  try{
    for(const copy of plan.copies){await mkdir(dirname(join(staging,copy.to)),{recursive:true});await copyFile(copy.from,join(staging,copy.to));}
    await writeFile(join(staging,'site-manifest.json'),JSON.stringify(plan.manifest,null,2)+'\n');
    const result=await compareSite(staging,plan.manifest);
    await rm(out,{recursive:true,force:true});await rename(staging,out);return result;
  }finally{await rm(staging,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length!==2)throw Error('usage: node scripts/build-site.mjs');
  console.log('PASS complete cabinet site '+JSON.stringify(await buildSite()));
}
