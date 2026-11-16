// SPDX-License-Identifier: Apache-2.0
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {ROOT,verifySourceSite,runGame,sitePlan,compareSite} from './site-lib.mjs';
export {verifySourceSite} from './site-lib.mjs';

export async function verifySite({root=ROOT,directory=join(root,'site')}={}){
  const source=await verifySourceSite(root);
  for(const row of source.approved)runGame(root,row.slug,'verify');
  return compareSite(directory,(await sitePlan(root,source)).manifest);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2);
  if(args.length>1||(args.length===1&&args[0]!=='--source'))throw Error('usage: node scripts/verify-site.mjs [--source]');
  if(args[0]==='--source'){
    const source=await verifySourceSite();console.log('PASS cabinet sources '+JSON.stringify({cartridges:source.registry.cartridges.length,approved:source.approved.map(row=>row.slug),files:source.paths.length}));
  }else console.log('PASS complete cabinet site '+JSON.stringify(await verifySite()));
}
