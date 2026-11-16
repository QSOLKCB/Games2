// SPDX-License-Identifier: Apache-2.0
const retry=document.getElementById('retry');
retry.addEventListener('click',()=>location.reload());
try{
  const {startGame}=await import('./src/app.js');
  await startGame();
}catch(error){
  document.documentElement.dataset.ready='error';
  document.getElementById('error').hidden=false;
  document.getElementById('error-message').textContent='The game could not start. '+error.message+' Try reloading; a WebGL-capable browser and a local HTTP server are required.';
  document.getElementById('boot-message').textContent='Startup failed. Reload to try again.';
}
