// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {ViceAudio} from '../src/app.js';

test('mission restart resets event tick and beat cursors without discarding decoded PCM',()=>{
  const sound=new ViceAudio();let started=0;
  const destination={};
  sound.context={
    state:'running',destination,
    createBufferSource(){return {
      buffer:null,connect(){return {connect(){return destination;}};},
      start(){started++;}
    };},
    createGain(){return {gain:{value:0},connect(){return destination;}};}
  };
  const buffer={name:'decoded original cue'};sound.buffers.set('shot',buffer);
  sound.play([{type:'shot',tick:100}],100);
  assert.equal(started,1);assert.equal(sound.last,100);
  sound.resetCursor();
  assert.equal(sound.last,-1);assert.equal(sound.lastBeat,-1);
  assert.strictEqual(sound.buffers.get('shot'),buffer);
  sound.play([{type:'shot',tick:1}],1);
  assert.equal(started,2,'new mission tick 1 must replay immediately');
  assert.equal(sound.last,1);
});
