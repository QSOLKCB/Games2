// SPDX-License-Identifier: Apache-2.0
// Games2 packaging adapter, adapted from VANILLAJS scripts/service-worker.template.js
// at e9121ea7297b0aeca1da131b695e7c3371a98745. Game cache namespace and build slots differ.
// Generated copies are bound to the complete allowlisted static package.
'use strict';
const VERSION=__PACKAGE_VERSION__;
const FILES=__PACKAGE_FILES__;
const PREFIX='qsol.' + __SLUG__ + ':'+self.registration.scope+':';
const CACHE=PREFIX+VERSION;
const ROOT=new URL('./',self.registration.scope).href;
const INDEX=new URL('index.html',self.registration.scope).href;
const MEMBERS=new Map(FILES.map(file=>[new URL(file.path,self.registration.scope).href,file]));
async function verified(response,file){
  if(response.status!==200||response.type==='opaque')throw Error('Unavailable offline asset: '+file.path);
  const bytes=await response.clone().arrayBuffer();
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  if(bytes.byteLength!==file.bytes||digest!==file.sha256)throw Error('Offline asset integrity failure: '+file.path);
  return response;
}
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try{
    for(let offset=0;offset<FILES.length;offset+=6){
      const results=await Promise.allSettled(FILES.slice(offset,offset+6).map(async file=>{
        const url=new URL(file.path,self.registration.scope).href;
        const response=await verified(await fetch(url,{cache:'reload'}),file);
        await cache.put(url,response);
      }));
      const failure=results.find(result=>result.status==='rejected');
      if(failure)throw failure.reason;
    }
    const index=await cache.match(INDEX);
    if(!index)throw Error('Offline entry point absent');
    await cache.put(ROOT,index);
  }catch(error){await caches.delete(CACHE);throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);
  // No skipWaiting or clients.claim: existing clients finish on their current version.
})()));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||request.headers.has('Range'))return;
  const file=MEMBERS.get(request.url)||(request.url===ROOT?MEMBERS.get(INDEX):undefined);
  if(!file)return; // No remote URLs, query requests or user-authored data enter this cache.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),cached=await cache.match(request.url);
    if(cached){
      try{return await verified(cached,file);}
      catch{await cache.delete(request.url);}
    }
    try{
      const response=await verified(await fetch(request),file);
      await cache.put(request.url,response.clone());return response;
    }catch{return new Response('Cartridge: verified offline file unavailable. Reconnect and reload to repair the installation.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}
  })());
});
