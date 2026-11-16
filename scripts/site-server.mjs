// SPDX-License-Identifier: Apache-2.0
// Loopback-only preview of the actual Pages artifact at its project prefix.
import {createServer} from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8'};
export async function serveSite({directory=join(root,'site'),port=0}={}){
  const base=await realpath(directory),prefix='/Games2/';
  const server=createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost'),path=decodeURIComponent(url.pathname);
      if(path==='/'||path==='/Games2'){res.writeHead(302,{Location:prefix});res.end();return;}
      if(!path.startsWith(prefix)||!['GET','HEAD'].includes(req.method))throw Error('Outside site');
      let file=resolve(base,path.slice(prefix.length));
      if(file!==base&&!file.startsWith(base+'/'))throw Error('Outside site');
      if((await stat(file)).isDirectory()){
        if(!path.endsWith('/')){res.writeHead(302,{Location:path+'/'});res.end();return;}
        file=join(file,'index.html');
      }
      file=await realpath(file);if(!file.startsWith(base+'/'))throw Error('Outside site');
      const body=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'text/plain; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
      res.end(req.method==='HEAD'?undefined:body);
    }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return {server,url:'http://127.0.0.1:'+server.address().port+prefix,close:()=>new Promise(resolve=>server.close(resolve))};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length!==2)throw Error('usage: node scripts/site-server.mjs');
  const {verifySite}=await import('./verify-site.mjs');await verifySite();
  const running=await serveSite({port:8000});console.log('Games2 preview: '+running.url+' (Ctrl+C to stop)');
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{void running.close().then(()=>process.exit(0));});
}
