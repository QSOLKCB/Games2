// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,validateSettings,parseSettings} from '../src/settings.js';
test('settings round-trip is owned and rejects stale, unsafe or unbounded data',()=>{
  const accepted=parseSettings(JSON.stringify(DEFAULT_SETTINGS));
  accepted.sensitivity=2;
  assert.equal(DEFAULT_SETTINGS.sensitivity,1);
  for(const bad of [{...accepted,kind:'strikepixel.settings.v2'},{...accepted,sensitivity:Infinity},{...accepted,sensitivity:0},{...accepted,music:'yes'},{...accepted,difficulty:'cheat'},{...accepted,extra:1}])assert.throws(()=>validateSettings(bad));
  const accessor={...accepted};Object.defineProperty(accessor,'music',{get(){throw Error('must not execute');}});
  assert.throws(()=>validateSettings(accessor),/Unknown or missing/);
  assert.throws(()=>parseSettings('{broken'));
  assert.throws(()=>parseSettings(' '.repeat(2049)));
  assert.throws(()=>parseSettings('{"__proto__":{}}'));
});
