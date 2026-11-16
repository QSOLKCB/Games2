// SPDX-License-Identifier: Apache-2.0
// Optional navigation only. Standalone exports remain independently playable.
export async function findCabinet(link){
  const parent=new URL('../../',import.meta.url),controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),4000);
  try{
    const response=await fetch(new URL('cartridges.json',parent),{signal:controller.signal,cache:'no-store'});
    if(!response.ok)return false;
    const text=await response.text();if(text.length>100000)return false;
    const registry=JSON.parse(text);
    // This is a visibility probe, not a second registry or build system. Data
    // can never supply the destination, markup, scripts or game instructions.
    if(registry?.schemaVersion!==1||!Array.isArray(registry.cartridges)||registry.cartridges.length>64)return false;
    if(!registry.cartridges.some(entry=>entry?.slug==='strikepixel'&&entry.directory==='strikepixel'&&['playable','released'].includes(entry.status)))return false;
    link.href=parent.href;link.hidden=false;return true;
  }catch{return false;}
  finally{clearTimeout(timeout);}
}
