// SPDX-License-Identifier: Apache-2.0
// Data only. Registry fields never specify commands, modules, HTML or scripts.
const statuses=new Set(['concept','development','playable','released']);
const playable=new Set(['playable','released']);
const fields=['slug','title','subtitle','description','genre','status','directory','artwork','releaseLabel','order'];
const required=['slug','title','subtitle','description','genre','status','order'];
const reserved=new Set(['cabinet','docs','scripts','tests','site','dist','assets','node-modules','vendor','evidence','browser-artifacts','cartridges','site-manifest','manifest','service-worker','package']);
function fail(message){throw new TypeError('Invalid cartridge registry: '+message);}
function record(value,allowed,label){
  if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail(label+' must be a plain object');
  for(const key of Reflect.ownKeys(value)){
    if(typeof key!=='string'||!allowed.includes(key))fail(label+' has an unknown field: '+String(key));
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    if(!Object.hasOwn(descriptor,'value')||!descriptor.enumerable)fail(label+' must contain plain data');
  }
}
function text(value,name,max){
  if(typeof value!=='string'||!value.trim()||value!==value.trim()||value.length>max||/[<>\u0000-\u001f\u007f]/.test(value))fail(name+' must be bounded plain text');
  return value;
}
function cartridge(value){
  record(value,fields,'cartridge');
  for(const key of required)if(!Object.hasOwn(value,key))fail('missing '+key);
  const slug=text(value.slug,'slug',40);
  if(!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(slug)||reserved.has(slug))fail('unsafe or reserved slug');
  if(!statuses.has(value.status))fail('unknown status');
  if(!Number.isSafeInteger(value.order)||value.order<0||value.order>9999)fail('order must be an integer from 0 to 9999');
  const result={slug,title:text(value.title,'title',80),subtitle:text(value.subtitle,'subtitle',120),description:text(value.description,'description',600),genre:text(value.genre,'genre',60),status:value.status,order:value.order};
  if(Object.hasOwn(value,'directory')){
    if(value.directory!==slug)fail('directory must exactly match slug');result.directory=slug;
  }
  if(playable.has(value.status)&&!result.directory)fail('playable or released game requires a directory');
  if(Object.hasOwn(value,'artwork')){
    if(typeof value.artwork!=='string'||!/^cabinet\/assets\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/.test(value.artwork))fail('artwork must be a local cabinet SVG');
    result.artwork=value.artwork;
  }
  if(Object.hasOwn(value,'releaseLabel'))result.releaseLabel=text(value.releaseLabel,'releaseLabel',80);
  return Object.freeze(result);
}
export function validateRegistry(value){
  record(value,['schemaVersion','cartridges'],'registry');
  if(value.schemaVersion!==1)fail('unsupported schemaVersion');
  const list=value.cartridges;
  if(!Array.isArray(list)||list.length<1||list.length>64)fail('cartridges must contain 1 to 64 records');
  if(Reflect.ownKeys(list).length!==list.length+1)fail('cartridges must be a dense data array');
  const seen=new Set(),rows=[];
  for(let i=0;i<list.length;i++){
    const descriptor=Object.getOwnPropertyDescriptor(list,String(i));
    if(!descriptor||!Object.hasOwn(descriptor,'value'))fail('cartridges must contain plain data');
    const row=cartridge(descriptor.value);
    if(seen.has(row.slug))fail('duplicate slug: '+row.slug);seen.add(row.slug);rows.push(row);
  }
  return Object.freeze({schemaVersion:1,cartridges:Object.freeze(rows)});
}
export function parseRegistry(source){
  if(typeof source!=='string'||source.length>100000)fail('registry text exceeds its bound');
  let value;try{value=JSON.parse(source);}catch{fail('malformed JSON');}
  return validateRegistry(value);
}
export function launchPath(value){
  const row=cartridge(value);
  return playable.has(row.status)?'./'+row.slug+'/':null;
}
