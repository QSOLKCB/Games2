// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {loadBest, recordBest} from '../src/record.js';

test('malformed, unavailable and already higher score records preserve playable session scoring',()=>{
  const values=new Map();
  const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  for(const value of ['-1','Infinity','3x','9007199254740992','00']){
    storage.setItem('qsol.asterion.best.v1',value);assert.equal(loadBest(storage),0);
  }
  assert.equal(recordBest(0,1600,storage),1600);assert.equal(recordBest(0,300,storage),1600);
  assert.equal(loadBest(storage),1600);
  const denied={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};
  assert.equal(loadBest(denied),0);assert.equal(recordBest(120,50,denied),120);
});
