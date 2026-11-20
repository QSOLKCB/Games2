// SPDX-License-Identifier: Apache-2.0
// NC-002 presentation-only pose selector: no clock, physics or mutable world.
const abs=Math.abs;
export function vicePose(actor,tick,{events=[],reducedMotion=false}={}){
  if(!actor||typeof actor!=='object'||!Number.isSafeInteger(tick)||tick<0)
    throw TypeError('valid actor and nonnegative game tick required');
  const isPlayer=actor.kind==='agent',body=isPlayer?actor.body:actor;
  const recently=(names,age)=>Array.isArray(events)&&events.some(e=>
    names.includes(e.type)&&e.tick<=tick&&tick-e.tick<=age&&
    Math.abs(e.x-body.x)<28&&Math.abs(e.y-body.y)<34);
  const velocity=isPlayer?abs(body.vx??0)+abs(body.vy??0):actor.moving?1:0;
  let state='idle';
  if(isPlayer){
    if(actor.dodge>0)state='dodge';
    else if(actor.invulnerable>0)state='hurt';
    else if(recently(['shot','stun'],8))state='attack';
    else if(velocity>0)state='run';
  }else if(actor.stunned>0)state='stunned';
  else if(actor.windup>0)state='warning';
  else if(velocity>0)state='run';
  const frame=state==='idle'?0:state==='attack'?2:state==='hurt'?3:
    state==='dodge'?1:state==='stunned'?3:state==='warning'?2:Math.floor(tick/7)%4;
  const phase=state==='run'?Math.sin(tick*.52):Math.sin(tick*.12);
  return Object.freeze({state,frame,
    bob:reducedMotion?0:phase*(state==='run'?3:state==='idle'?.85:0),
    lean:reducedMotion?0:state==='dodge'?7:state==='attack'?-3:0,
    scaleY:state==='dodge'?.77:state==='stunned'?.91:1,
    flash:state==='hurt'&&tick%8<4
  });
}
