// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {readWorkflows,validateWorkflows,evaluateGuard,ACTIONS} from '../scripts/verify-workflows.mjs';

const workflows=await readWorkflows();
const step=(w,id)=>w.ci.jobs.verify.steps.find(s=>s.id===id);
function context(event='push',ref='refs/heads/main',repository='QSOLKCB/Games2',result='success',publish=true){
  return {github:{repository,ref,event_name:event},inputs:{pages_artifact:publish},needs:{verify:{result}}};
}

test('actual workflow graph has reviewed official pins, isolated hosted checks and a verified artifact dependency',()=>{
  assert.deepEqual(validateWorkflows(workflows),{workflows:2,actions:4,runner:'ubuntu-24.04',playwright:'1.64.0'});
  for(const action of Object.values(ACTIONS))assert.match(action,/^actions\/[a-z-]+@[a-f0-9]{40}$/);
  assert.equal(workflows.pages.jobs.verify.uses,'./.github/workflows/ci.yml');
  assert.equal(step(workflows,'artifact').with.path,'site/');
});

test('actual artifact and deployment guards reject PRs, forks, tags and feature-branch dispatches',()=>{
  const caller=workflows.pages.jobs.verify.if,artifact=step(workflows,'artifact').if,deploy=workflows.pages.jobs.deploy.if;
  for(const event of ['push','workflow_dispatch']){
    for(const guard of [caller,artifact,deploy])assert.equal(evaluateGuard(guard,context(event)),true,event+' main is eligible');
  }
  for(const event of ['pull_request','pull_request_target','workflow_run','schedule','workflow_call']){
    // Even a fabricated main ref cannot make a PR/other event eligible.
    for(const guard of [caller,artifact,deploy])assert.equal(evaluateGuard(guard,context(event)),false,event);
  }
  for(const ref of ['refs/heads/feature/cabinet','refs/pull/3/merge','refs/tags/main','refs/heads/main-malicious']){
    for(const event of ['push','workflow_dispatch'])for(const guard of [caller,artifact,deploy])assert.equal(evaluateGuard(guard,context(event,ref)),false,ref);
  }
  for(const guard of [caller,artifact,deploy])assert.equal(evaluateGuard(guard,context('push','refs/heads/main','someone/Games2')),false,'fork cannot publish');
  assert.equal(evaluateGuard(artifact,context('push','refs/heads/main','QSOLKCB/Games2','success',false)),false,'ordinary verification never uploads Pages');
  for(const result of ['failure','cancelled','skipped',''])assert.equal(evaluateGuard(deploy,context('push','refs/heads/main','QSOLKCB/Games2',result)),false,'verification '+result);
  assert.equal(evaluateGuard(artifact,{}),false,'missing inputs fail closed');
  assert.throws(()=>evaluateGuard('${{ process.exit() }}',{}),/unsupported workflow guard syntax/);
});

test('workflow audit rejects privilege escalation, untrusted events, mutable actions and unsafe checkout',()=>{
  const mutations=[
    w=>{w.ci.on.pull_request_target={};},
    w=>{w.pages.on.workflow_run={workflows:['Cabinet verification'],types:['completed']};},
    w=>{w.pages.on.push.branches=['**'];},
    w=>{w.pages.jobs.verify.if='${{ true }}';},
    w=>{w.pages.jobs.deploy.if='${{ always() }}';},
    w=>{w.ci.permissions.contents='write';},
    w=>{w.ci.jobs.verify.permissions.pages='write';},
    w=>{w.pages.permissions['id-token']='write';},
    w=>{w.pages.jobs.verify.secrets='inherit';},
    w=>{w.pages.jobs.deploy.permissions.contents='write';},
    w=>{w.ci.jobs.verify['runs-on']=['self-hosted','owner'];},
    w=>{w.pages.jobs.deploy['runs-on']='self-hosted';},
    w=>{step(w,'checkout').uses='actions/checkout@v7';},
    w=>{step(w,'node').uses='someone/setup-node@'+'a'.repeat(40);},
    w=>{step(w,'checkout').with['persist-credentials']=true;},
    w=>{step(w,'checkout').with.ref='${{ github.event.pull_request.head.sha }}';},
    w=>{w.pages.jobs.deploy.steps.unshift({id:'code',name:'Unexpected project code',run:'node scripts/build-site.mjs',shell:'bash'});},
    w=>{w.pages.jobs.deploy.environment.name='unrestricted';},
    w=>{w.pages.jobs.deploy.steps[1].with.preview=true;}
  ];
  for(const [index,mutate] of mutations.entries()){
    const changed=structuredClone(workflows);mutate(changed);
    assert.throws(()=>validateWorkflows(changed),{name:'AssertionError'},'unsafe workflow mutation '+index);
  }
});

test('workflow audit rejects skipped tests, stale or mismatched artifacts and hidden shell overrides',()=>{
  const mutations=[
    w=>{w.pages.jobs.deploy.needs=[];},
    w=>{w.pages.jobs.verify.uses='QSOLKCB/Games2/.github/workflows/ci.yml@main';},
    w=>{w.ci.jobs.verify.steps=w.ci.jobs.verify.steps.filter(s=>s.id!=='browser');},
    w=>{step(w,'tests')['continue-on-error']=true;},
    w=>{step(w,'browser').if='${{ false }}';},
    w=>{step(w,'tests').run='node --test tests/*.test.mjs';},
    w=>{step(w,'build').run='node scripts/build-site.mjs';},
    w=>{step(w,'final').run='git diff --check';},
    w=>{step(w,'final').shell='bash {0}';},
    w=>{step(w,'browser').env.NODE_OPTIONS='--import ./override.mjs';},
    w=>{w.ci.env={NODE_OPTIONS:'--import ./override.mjs'};},
    w=>{step(w,'provision').run=step(w,'provision').run.replace('--ignore-scripts ','');},
    w=>{step(w,'provision').run=step(w,'provision').run.replace('playwright@1.64.0','playwright@latest');},
    w=>{step(w,'artifact').with.path='.';},
    w=>{step(w,'artifact').if='${{ always() }}';},
    w=>{step(w,'publication').run='true';},
    w=>{w.ci.jobs.verify.steps.unshift(w.ci.jobs.verify.steps.pop());},
    w=>{w.pages.jobs.deploy.steps[1].with.artifact_name='unverified';},
    w=>{w.pages.jobs.deploy.steps[0].run='true';},
    w=>{w.pages.concurrency.group='${{ github.sha }}';}
  ];
  for(const [index,mutate] of mutations.entries()){
    const changed=structuredClone(workflows);mutate(changed);
    assert.throws(()=>validateWorkflows(changed),{name:'AssertionError'},'unsafe build/artifact mutation '+index);
  }
});

test('actual deploy shell rejects superseded commits and lookup failure without accessing GitHub',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'games2-deploy-policy-'));
  try{
    await writeFile(join(directory,'git'),'#!/bin/sh\n[ "$CABINET_TEST_LOOKUP_FAIL" != "yes" ] || exit 1\nprintf "%s\\trefs/heads/main\\n" "$CABINET_TEST_MAIN"\n',{mode:0o700});
    const current='a'.repeat(40),old='b'.repeat(40),script=workflows.pages.jobs.deploy.steps[0].run;
    const run=(sha,fail='no',overrides={})=>spawnSync('/bin/bash',['--noprofile','--norc','-e','-o','pipefail','-c',script],{
      encoding:'utf8',timeout:5000,env:{PATH:directory,GITHUB_SHA:sha,GITHUB_REPOSITORY:'QSOLKCB/Games2',GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',CABINET_TEST_MAIN:current,CABINET_TEST_LOOKUP_FAIL:fail,...overrides}
    });
    assert.equal(run(current).status,0,'current verified main can proceed');
    assert.notEqual(run(old).status,0,'older queued build cannot deploy');
    assert.notEqual(run(current,'yes').status,0,'network/lookup failure cannot deploy');
    assert.equal(evaluateGuard(workflows.pages.jobs.deploy.if,context('workflow_dispatch','refs/heads/Main')),true,'GitHub string equality ignores case');
    for(const overrides of [
      {GITHUB_REF:'refs/heads/Main',GITHUB_EVENT_NAME:'workflow_dispatch'},
      {GITHUB_REF:'refs/heads/feature',GITHUB_EVENT_NAME:'workflow_dispatch'},
      {GITHUB_REPOSITORY:'someone/Games2'},
      {GITHUB_EVENT_NAME:'pull_request'},
      {GITHUB_EVENT_NAME:'workflow_run'}
    ])assert.notEqual(run(current,'no',overrides).status,0,'exact shell boundary rejects '+JSON.stringify(overrides));
    const uploadScript=step(workflows,'publication').run;
    assert.equal(script.startsWith(uploadScript+'\n'),true,'the same exact boundary protects artifact upload');
  }finally{await rm(directory,{recursive:true,force:true});}
});
