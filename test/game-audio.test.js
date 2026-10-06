import test from 'node:test';import assert from 'node:assert/strict';
import {movementSound,creatureSound} from '../src/game-audio.js';
test('sprint footsteps speed up, swimming splashes and diving muffles movement; flying and stopped players are silent',()=>{
 const player={moving:true,layer:'surface'};const walk=movementSound(player,false),run=movementSound(player,true);assert.ok(run.interval<walk.interval);assert.ok(run.rate>walk.rate);
 player.swimming=true;assert.match(movementSound(player,false).file,/splash/);player.layer='ocean';assert.ok(movementSound(player,false).lowpass<1000);
 for(const change of [{moving:false},{jumpHeight:10},{flightHeight:30},{vehicle:{}},{raftId:'raft'}])assert.equal(movementSound({...player,...change},false),null);
});
test('calls distinguish animals and fantasy mobs; Steezus and helpers do not produce unrelated ambient animal noises',()=>{
 assert.notEqual(creatureSound({kind:'wolf'}).file,creatureSound({kind:'boar'}).file);assert.notEqual(creatureSound({kind:'wolf'}).rate,creatureSound({kind:'fox'}).rate);
 assert.notEqual(creatureSound({kind:'rootStalker'}).file,creatureSound({kind:'caveSpider'}).file);for(const kind of ['steezus','adam','eve'])assert.equal(creatureSound({kind}),null);
});
