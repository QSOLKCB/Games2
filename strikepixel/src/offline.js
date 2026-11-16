// SPDX-License-Identifier: Apache-2.0
// Optional local-package installation. Gameplay never waits on this operation.
export async function registerOffline({onStatus=()=>{}}={}){
  const report=(state,message)=>{try{onStatus({state,message});}catch{}};
  const local=location.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  if((location.protocol!=='https:'&&!local)||!('serviceWorker' in navigator)){
    report('unavailable','Offline installation needs HTTPS or a local HTTP server.');return null;
  }
  const base=new URL('../',import.meta.url);
  let existing;
  const installed=()=>existing?.scope===base.href&&existing.active?.scriptURL===new URL('service-worker.js',base).href&&existing.active.state==='activated';
  const useInstalled=()=>{report('ready','Running the installed offline package. Reconnect to check for updates.');return existing;};
  try{
    existing=await navigator.serviceWorker.getRegistration(base.href);
    const response=await fetch(new URL('manifest.json',base),{cache:'no-store'});
    if(!response.ok){if(installed())return useInstalled();report('source','Source checkout: build the static package to enable offline installation.');return null;}
    const manifest=await response.json();
    if(manifest.schemaVersion!==1||manifest.game!=='strikepixel'||!Array.isArray(manifest.files)||!manifest.files.some(file=>file.path==='service-worker.js'))throw Error('Invalid offline package manifest');
    const registration=await navigator.serviceWorker.register(new URL('service-worker.js',base),{scope:base.pathname,updateViaCache:'none'});
    const update=()=>{
      if(registration.waiting)report('update','Update ready; close existing game tabs, then reopen.');
      else if(registration.active?.state==='activated')report('ready','Offline installation complete. Future visits can run without networking.');
      else report('installing','Installing verified offline files…');
    };
    const follow=()=>{const worker=registration.installing;if(worker)worker.addEventListener('statechange',()=>{
      if(worker.state==='redundant')report('failed','Offline installation failed. Reconnect and reload to try again.');
      else update();
    });update();};
    registration.addEventListener('updatefound',follow);follow();
    return registration;
  }catch{if(installed())return useInstalled();report('unavailable','Offline installation unavailable; the current game can still run.');return null;}
}
