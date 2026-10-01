import test from 'node:test';
import assert from 'node:assert/strict';
import { movementVector, mouseHeading } from '../src/controls.js';
import { turnToward } from '../src/camera.js';

test('WASD combines two directions diagonally without a speed boost',()=>{
  const step=keys=>movementVector({keys:new Set(keys),sprinting:false,dt:1});
  assert.deepEqual(step([]),{dx:0,dy:0});
  assert.deepEqual(step(['w']),{dx:0,dy:-157.5});
  assert.deepEqual(step(['a']),{dx:-157.5,dy:0});
  assert.deepEqual(step(['s']),{dx:0,dy:157.5});
  assert.deepEqual(step(['d']),{dx:157.5,dy:0});
  const diagonal=step(['w','d']);
  assert.ok(diagonal.dx>0&&diagonal.dy<0);
  assert.deepEqual(diagonal,step(['d','w']));
  assert.ok(Math.abs(Math.hypot(diagonal.dx,diagonal.dy)-157.5)<1e-10);
  assert.deepEqual(step(['w','s']),{dx:0,dy:0});
  assert.deepEqual(step(['w','ArrowRight']),step(['w']));
  assert.equal(movementVector({keys:new Set(['a','shift']),sprinting:true,dt:1}).dx,-393.75);
  assert.equal(movementVector({keys:new Set(['d','alt']),sprinting:false,betaBoost:true,dt:1}).dx,1575);
  assert.equal(movementVector({keys:new Set(['d','shift','alt']),sprinting:true,betaBoost:true,dt:1}).dx,3937.5);
});

test('mouse look turns independently and camera framing remains north-up',()=>{
  const player={x:9000,y:7000,facing:-Math.PI/2};
  const camera={x:9000,y:7000};
  const settings={player,camera,zoom:1,width:1600,height:900};
  const east=mouseHeading({...settings,mouse:{x:1200,y:450}});
  assert.ok(Math.abs(east)<1e-8);
  assert.deepEqual(movementVector({keys:new Set(['w']),sprinting:false,dt:1}),{dx:0,dy:-157.5});
  const turning=turnToward(player.facing,east,.25);
  assert.ok(turning>player.facing&&turning<east);
  assert.deepEqual(camera,{x:9000,y:7000});
});
