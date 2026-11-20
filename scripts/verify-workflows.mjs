// SPDX-License-Identifier: Apache-2.0
// These workflows deliberately use JSON, a YAML subset, so policy checks need no parser dependency.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const ACTIONS={
  "checkout": "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  "setup-node": "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1",
  "upload-pages-artifact": "actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9",
  "deploy-pages": "actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346"
};
const MAIN_GATE="github.repository == 'QSOLKCB/Games2' && github.ref == 'refs/heads/main' && (github.event_name == 'push' || github.event_name == 'workflow_dispatch')";
const BROWSER_ENV={
  "NODE_PATH": "${{ runner.temp }}/games2-browser/node_modules",
  "PLAYWRIGHT_BROWSERS_PATH": "${{ runner.temp }}/games2-browsers"
};
const PROVISION="npm install --prefix \"$RUNNER_TEMP/games2-browser\" --ignore-scripts --no-save --package-lock=false --no-audit --no-fund playwright@1.64.0\nnode \"$RUNNER_TEMP/games2-browser/node_modules/playwright/cli.js\" install --with-deps chromium\nnode -e 'console.log(\"Playwright \"+require(\"playwright/package.json\").version); console.log(\"Chromium executable \"+require(\"playwright\").chromium.executablePath());'";
const PUBLICATION_BOUNDARY="test \"$GITHUB_REPOSITORY\" = \"QSOLKCB/Games2\"\ntest \"$GITHUB_REF\" = \"refs/heads/main\"\ncase \"$GITHUB_EVENT_NAME\" in push|workflow_dispatch) ;; *) exit 1 ;; esac";
const FRESHNESS=PUBLICATION_BOUNDARY+'\n'+"cabinet_main=\"$(git ls-remote --exit-code https://github.com/QSOLKCB/Games2.git refs/heads/main)\"\ntest \"${cabinet_main%%$'\\t'*}\" = \"$GITHUB_SHA\"";
const COMMANDS={
  "policy": "node scripts/verify-workflows.mjs",
  "source": "node scripts/verify-site.mjs --source\nnode strikepixel/scripts/verify.mjs --source\nnode narc/scripts/verify.mjs --source",
  "tests": "node --test tests/*.test.mjs\nnode --test strikepixel/tests/*.test.mjs\nnode --test narc/tests/*.test.mjs",
  "build": "node narc/scripts/build.mjs\nnode narc/scripts/verify.mjs\nnode strikepixel/scripts/build.mjs\nnode strikepixel/scripts/verify.mjs\nnode scripts/build-site.mjs\nnode scripts/verify-site.mjs",
  "browser": "node narc/scripts/browser.mjs\nnode strikepixel/scripts/browser.mjs\nnode scripts/browser-site.mjs",
  "final": "node scripts/verify-site.mjs\ngit diff --check"
};
const expression=value=>'${{ '+value+' }}';
function keys(value,expected,label){
  assert.ok(value&&typeof value==='object'&&!Array.isArray(value),label+' must be an object');
  assert.deepEqual(Object.keys(value).sort(),[...expected].sort(),label+' has missing or unknown fields');
}
function equal(actual,expected,label){assert.deepEqual(actual,expected,label);}
function readOnly(permissions,label){equal(permissions,{contents:'read'},label+' uses only contents:read');}
function hosted(job,label){
  equal(job['runs-on'],'ubuntu-24.04',label+' uses the audited GitHub-hosted runner');
  assert.ok(Number.isInteger(job['timeout-minutes'])&&job['timeout-minutes']>=1&&job['timeout-minutes']<=30,label+' bounded timeout');
}
function step(value,fields,label){keys(value,['id','name',...fields],label);assert.equal(typeof value.name,'string');}

/** A tiny non-executing evaluator for the guards used below. Unsupported syntax fails closed.
 * It interprets only boolean operators, equality, parentheses, literal strings and own data fields.
 */
export function evaluateGuard(raw,context){
  assert.equal(typeof raw,'string');assert.match(raw,/^\$\{\{[\s\S]+\}\}$/);
  const source=raw.slice(3,-2),tokens=[];
  for(let at=0;at<source.length;){
    if(/\s/.test(source[at])){at++;continue;}
    const match=/^(?:&&|\|\||==|\(|\)|true\b|false\b|'[^']*'|[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*)/.exec(source.slice(at));
    assert.ok(match,'unsupported workflow guard syntax');tokens.push(match[0]);at+=match[0].length;
  }
  let position=0;
  function atom(){
    const token=tokens[position++];assert.ok(token,'missing guard operand');
    if(token==='('){const value=or();assert.equal(tokens[position++],')');return value;}
    if(token==='true'||token==='false')return token==='true';
    if(token.startsWith("'"))return token.slice(1,-1);
    assert.match(token,/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/);
    let value=context;
    for(const field of token.split('.'))value=value&&Object.hasOwn(value,field)?value[field]:undefined;
    return value;
  }
  function comparison(){
    let value=atom();
    if(tokens[position]==='=='){
      position++;const right=atom();
      // The supported contexts are strings or the declared boolean input.
      value=typeof value==='string'&&typeof right==='string'?value.toLowerCase()===right.toLowerCase():value===right;
    }
    return value;
  }
  function and(){let value=comparison();while(tokens[position]==='&&'){position++;const right=comparison();value=Boolean(value)&&Boolean(right);}return value;}
  function or(){let value=and();while(tokens[position]==='||'){position++;const right=and();value=Boolean(value)||Boolean(right);}return value;}
  const result=or();assert.equal(position,tokens.length,'unsupported workflow guard syntax: trailing data');return Boolean(result);
}

export function validateWorkflows({ci,pages}){
  keys(ci,['name','on','permissions','jobs'],'CI workflow');
  equal(ci.on,{pull_request:{branches:['main']},workflow_call:{inputs:{pages_artifact:{
    description:'Upload the verified site for the same main-branch Pages run.',type:'boolean',required:false,default:false
  }}}},'CI accepts PRs to main or the local reusable call only');
  readOnly(ci.permissions,'CI default');keys(ci.jobs,['verify'],'CI jobs');
  const verify=ci.jobs.verify;
  keys(verify,['name','runs-on','timeout-minutes','permissions','steps'],'verification job');
  hosted(verify,'verification');readOnly(verify.permissions,'verification');
  assert.ok(Array.isArray(verify.steps));
  equal(verify.steps.map(s=>s.id),['checkout','node','policy','source','tests','build','provision','browser','final','publication','artifact'],'all required gates precede the sole artifact upload');
  const steps=Object.fromEntries(verify.steps.map(s=>[s.id,s]));
  step(steps.checkout,['uses','with'],'checkout');
  equal(steps.checkout.uses,ACTIONS.checkout,'reviewed checkout SHA');
  equal(steps.checkout.with,{'persist-credentials':false},'event SHA and no persistent token');
  step(steps.node,['uses','with'],'setup-node');
  equal(steps.node.uses,ACTIONS['setup-node'],'reviewed setup-node SHA');
  equal(steps.node.with,{'node-version':'22','package-manager-cache':false},'Node runtime and disabled dependency cache');
  for(const id of ['policy','source','tests','build','browser','final']){
    step(steps[id],id==='browser'?['run','shell','env']:['run','shell'],id);
    equal(steps[id].run,COMMANDS[id],id+' required command sequence');
    equal(steps[id].shell,'bash',id+' fail-on-error shell');
  }
  equal(steps.browser.env,BROWSER_ENV,'browser tools remain external');
  step(steps.provision,['run','shell','env'],'browser provisioning');
  equal(steps.provision.run,PROVISION,'exact external Playwright pin, suppressed npm scripts and explicit Chromium dependencies');
  equal(steps.provision.shell,'bash');equal(steps.provision.env,BROWSER_ENV);
  step(steps.publication,['if','run','shell'],'exact publication boundary');
  equal(steps.publication.if,expression('inputs.pages_artifact == true'));
  equal(steps.publication.run,PUBLICATION_BOUNDARY,'case-sensitive repository/ref/event boundary');
  equal(steps.publication.shell,'bash');
  step(steps.artifact,['if','uses','with'],'Pages artifact');
  equal(steps.artifact.if,expression('inputs.pages_artifact == true && ('+MAIN_GATE+')'),'artifact requires trusted main caller');
  equal(steps.artifact.uses,ACTIONS['upload-pages-artifact'],'reviewed artifact action SHA');
  equal(steps.artifact.with,{name:'github-pages',path:'site/','retention-days':1,'include-hidden-files':true},'only the verified site directory is uploaded');

  keys(pages,['name','on','permissions','concurrency','jobs'],'Pages workflow');
  equal(pages.on,{push:{branches:['main']},workflow_dispatch:{}},'Pages event boundary');
  readOnly(pages.permissions,'Pages default');
  equal(pages.concurrency,{group:'games2-pages','cancel-in-progress':false},'serialize the complete build/deploy without interrupting a deployment');
  keys(pages.jobs,['verify','deploy'],'Pages jobs');
  const caller=pages.jobs.verify;
  keys(caller,['name','if','uses','permissions','with'],'trusted verification caller');
  equal(caller.if,expression(MAIN_GATE),'caller excludes PRs, forks and non-main dispatch');
  equal(caller.uses,'./.github/workflows/ci.yml','reuse verification from this exact commit');
  readOnly(caller.permissions,'caller');equal(caller.with,{pages_artifact:true});
  const deploy=pages.jobs.deploy;
  keys(deploy,['name','needs','if','runs-on','timeout-minutes','permissions','environment','steps'],'deployment job');
  hosted(deploy,'deployment');
  equal(deploy.needs,['verify'],'deployment depends on completed verification');
  equal(deploy.if,expression(MAIN_GATE+" && needs.verify.result == 'success'"),'deployment repeats main/event and successful verification guards');
  equal(deploy.permissions,{pages:'write','id-token':'write'},'only deployment can write Pages or request OIDC');
  equal(deploy.environment,{name:'github-pages',url:expression('steps.deployment.outputs.page_url')},'main-restricted Pages environment');
  equal(deploy.steps.map(s=>s.id),['fresh','deployment'],'no repository code or checkout in the write-token job');
  const [fresh,publish]=deploy.steps;
  step(fresh,['run','shell'],'fresh main check');equal(fresh.run,FRESHNESS,'fail stale reruns or queued builds');equal(fresh.shell,'bash');
  step(publish,['uses','with'],'deployment action');equal(publish.uses,ACTIONS['deploy-pages'],'reviewed deploy action SHA');
  equal(publish.with,{artifact_name:'github-pages',preview:false},'deploy this run artifact only; no PR preview');
  return {workflows:2,actions:Object.keys(ACTIONS).length,runner:'ubuntu-24.04',playwright:'1.64.0'};
}

export async function readWorkflows(root=ROOT){
  const folder=join(root,'.github/workflows');
  equal((await readdir(folder)).filter(path=>/\.ya?ml$/.test(path)).sort(),['ci.yml','pages.yml'],'unknown workflow requires explicit policy review');
  const [ci,pages]=await Promise.all(['ci.yml','pages.yml'].map(async name=>JSON.parse(await readFile(join(folder,name),'utf8'))));
  return {ci,pages};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  assert.equal(process.argv.length,2,'usage: node scripts/verify-workflows.mjs');
  console.log('PASS deployment workflow policy '+JSON.stringify(validateWorkflows(await readWorkflows())));
}
