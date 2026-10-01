import test from 'node:test';
import assert from 'node:assert/strict';
import { keyboardFacing,startJump,updateJump } from '../src/controls.js';
test('WASD selects only four directions and keeps the last facing when idle',()=>{
  for(const [key,angle] of [['d',0],['s',Math.PI/2],['a',Math.PI],['w',Math.PI*1.5]])assert.equal(keyboardFacing(new Set([key]),0),angle);
  const keys=new Set(['w','d']);assert.equal(keyboardFacing(keys,0),0);keys.delete('d');assert.equal(keyboardFacing(keys,0),Math.PI*1.5);
  assert.equal(keyboardFacing(new Set(['d','w']),0),Math.PI*1.5);
  assert.equal(keyboardFacing(new Set(['w','s']),Math.PI),Math.PI);
  assert.equal(keyboardFacing(new Set(),Math.PI/2),Math.PI/2);
});
test('jump has a bounded arc, prevents air jumps, and leaves ground coordinates intact',()=>{
  const p={x:12,y:34};assert.ok(startJump(p));updateJump(p,.26);assert.equal(p.jumpHeight,34);assert.equal(startJump(p),false);
  updateJump(p,.26);assert.equal(p.jumpHeight,0);assert.equal(p.jumpActive,false);assert.deepEqual([p.x,p.y],[12,34]);assert.ok(startJump(p));
  updateJump(p,2);assert.equal(p.jumpHeight,0);assert.equal(p.jumpActive,false);
});
