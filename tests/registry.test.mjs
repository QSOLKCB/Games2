// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {validateRegistry,parseRegistry,launchPath} from '../cabinet/registry.js';
const cartridge=()=>({slug:'example-game',title:'Example Game',subtitle:'An original game',description:'Offline play.',genre:'Arcade',status:'playable',directory:'example-game',order:0});
const registry=row=>({schemaVersion:1,cartridges:[row]});
test('the real registry launches only the implemented cartridge and returns owned frozen data',async()=>{
  const value=JSON.parse(await readFile(new URL('../cartridges.json',import.meta.url),'utf8')),result=validateRegistry(value);
  const suites=await readdir(new URL('./cartridges/',import.meta.url));
  const expected=['strikepixel','narc',...suites.map(name=>name.replace(/\.mjs$/,''))].sort();
  assert.deepEqual(result.cartridges.filter(row=>launchPath(row)).map(row=>row.slug).sort(),expected);
  for(const slug of ['neon-apex','starward-signal']){
    const row=result.cartridges.find(row=>row.slug===slug);
    assert.ok(row,'original cabinet card: '+slug);
    assert.equal(row.status,expected.includes(slug)?'playable':'concept');
  }
  assert.equal(launchPath(result.cartridges[0]),'./strikepixel/');
  value.cartridges[0].title='Changed';assert.equal(result.cartridges[0].title,'Strike Pixel');
  assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.cartridges)&&Object.isFrozen(result.cartridges[0]));
});
test('concept and development entries never launch; released entries use the same fixed local path',()=>{
  for(const status of ['concept','development']){const row=cartridge();row.status=status;delete row.directory;assert.equal(launchPath(validateRegistry(registry(row)).cartridges[0]),null);}
  const released={...cartridge(),status:'released'};assert.equal(launchPath(released),'./example-game/');
});
test('malformed, unknown, duplicate, escaping, executable and stale registry fields fail closed',()=>{
  for(const value of ['{',null,'[]','null','x'.repeat(100001)])assert.throws(()=>parseRegistry(value));
  const mutations=[
    row=>row.command='node arbitrary.js',row=>row.launchURL='https://example.invalid',row=>row.slug='../escape',row=>row.slug='cabinet',
    row=>row.slug='encoded%2fescape',row=>row.directory='other-game',row=>row.directory='/absolute',row=>delete row.directory,
    row=>row.status='finished',row=>row.artwork='https://example.invalid/image.svg',row=>row.artwork='cabinet/assets/../image.svg',
    row=>row.artwork='cabinet/assets/image.svg?remote=true',row=>row.title='<script>alert(1)</script>',row=>row.order=NaN,
    row=>row.order=-1,row=>delete row.description,row=>row.description='x'.repeat(601)
  ];
  for(const mutate of mutations){const row=cartridge();mutate(row);assert.throws(()=>validateRegistry(registry(row)));}
  for(const slug of ['evidence','browser-artifacts','cartridges','site-manifest','scripts','tests','site','dist','package'])assert.throws(()=>validateRegistry(registry({...cartridge(),slug,directory:slug})),/reserved/);
  assert.throws(()=>validateRegistry({...registry(cartridge()),schemaVersion:2}));
  assert.throws(()=>validateRegistry({...registry(cartridge()),execute:'do something'}));
  assert.throws(()=>validateRegistry({schemaVersion:1,cartridges:[cartridge(),cartridge()]}),/duplicate/);
});
test('registry validation never executes getters or accepts sparse and decorated arrays',()=>{
  let calls=0;const row=cartridge();Object.defineProperty(row,'title',{get(){calls++;return 'bad';},enumerable:true});
  assert.throws(()=>validateRegistry(registry(row)));assert.equal(calls,0);
  const list=[];Object.defineProperty(list,'0',{get(){calls++;return cartridge();},enumerable:true});
  assert.throws(()=>validateRegistry({schemaVersion:1,cartridges:list}));assert.equal(calls,0);
  assert.throws(()=>validateRegistry({schemaVersion:1,cartridges:new Array(1)}));
  const extra=[cartridge()];extra.command='do not execute';assert.throws(()=>validateRegistry({schemaVersion:1,cartridges:extra}));
  assert.throws(()=>validateRegistry(registry(Object.assign(Object.create({inherited:true}),cartridge()))));
});
