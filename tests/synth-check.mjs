// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';

export async function checkSynth(Synth, event) {
  const param=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){}});
  const voices=[];
  const synth=new Synth();
  synth.context={state:'running',currentTime:0,destination:{},resume:async()=>{},
    createGain:()=>({gain:param(),connect(){return this},disconnect(){}}),
    createOscillator(){
      const osc={frequency:param(),connect:node=>node,disconnect(){this.disconnected=true},
        start(){},stop(time){if(time===undefined)this.stopped=true}};
      voices.push(osc);return osc;
    }};
  synth.cue(event);assert.equal(voices.length,0);
  await synth.toggle();
  for(let i=0;i<80;i++)synth.cue(event);
  assert.equal(voices.length,8);
  await synth.toggle();
  assert.equal(synth.enabled,false);assert.equal(synth.voices.size,0);
  assert.ok(voices.every(v=>v.stopped&&v.disconnected));
  synth.tick({tick:0,sector:0,serving:false,event});assert.equal(voices.length,8);
}
