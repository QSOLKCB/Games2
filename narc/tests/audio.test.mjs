// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {ViceAudio,createViceScore} from '../src/app.js';

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

test('original multi-lane score yields reproducible bounded stereo-free PCM',()=>{
  const a=createViceScore().wav(),b=createViceScore().wav();
  assert.equal(a.length,44+96000*2);assert.deepEqual(a,b);
  assert.ok(a.some((v,i)=>i>48&&v!==0),'generated score must not be silent');
});
test('mute does not replay stale combat cues after unmute',()=>{
  const audio=new ViceAudio();let played=0;
  const destination={};
  audio.context={state:'running',destination,
    createBufferSource(){return {connect(){return {connect(){return destination;}};},start(){played++;}};},
    createGain(){return {gain:{value:0},connect(){return destination;}};}
  };
  audio.buffers.set('shot',{});
  audio.muted=true;audio.play([{type:'shot',tick:50}],50);
  assert.equal(audio.last,50);assert.equal(played,0);
  audio.muted=false;audio.play([{type:'shot',tick:50}],51);
  assert.equal(played,0);
  audio.play([{type:'shot',tick:52}],52);
  assert.equal(played,1);
  audio.setMusic(false);assert.equal(audio.musicOn,false);
});
