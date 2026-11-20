// SPDX-License-Identifier: Apache-2.0
import {startGame} from './src/app.js';
try{startGame();}
catch(error){
 document.documentElement.dataset.ready='error';
 const panel=document.getElementById('panel'),title=document.getElementById('panel-title');
 if(panel&&title){panel.hidden=false;title.textContent='STARTUP UNAVAILABLE';
 document.getElementById('panel-message').textContent='This browser cannot start Circuit Vice. No game data was changed.';}
 console.error('Circuit Vice startup error',error);
}
