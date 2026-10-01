import test from 'node:test';
import assert from 'node:assert/strict';
import { worldToScreen, screenToWorld, viewBounds, mouseLookOffset, turnToward } from '../src/camera.js';

test('tilted north-up camera maps screen points to the right world point',()=>{
  for(const camera of [{x:9000,y:7000},{x:8500,y:6500}]){
    for(const [x,y] of [[0,0],[800,450],[1600,900],[233,752]]){
      const world=screenToWorld(x,y,camera,.85,1600,900);
      const screen=worldToScreen(world.x,world.y,camera,.85,1600,900);
      assert.ok(Math.abs(screen.x-x)<1e-8);
      assert.ok(Math.abs(screen.y-y)<1e-8);
      const bounds=viewBounds(camera,.85,1600,900);
      assert.ok(world.x>=bounds.left-1e-8&&world.x<=bounds.right+1e-8);
      assert.ok(world.y>=bounds.top-1e-8&&world.y<=bounds.bottom+1e-8);
    }
  }
});

test('mouse look can turn smoothly across the angle wrap while the map remains north-up',()=>{
  const camera={x:0,y:0};
  const east=worldToScreen(100,0,camera,1,800,600);
  assert.ok(east.x>400);
  assert.ok(Math.abs(east.y-300)<1e-8);
  const nearWrap=turnToward(3.1,-3.1,.5);
  assert.ok(Math.abs(nearWrap-3.14)<.1);
});

test('mouse pans the normal view, while zooming in recenters on the player',()=>{
  const mouse={x:1200,y:450},width=1600,height=900;
  assert.deepEqual(mouseLookOffset({x:800,y:450},width,height,.68),{x:0,y:0});
  const normal=mouseLookOffset(mouse,width,height,.68);
  const zooming=mouseLookOffset(mouse,width,height,.68,.72);
  assert.ok(normal.x>0&&zooming.x>0&&zooming.x<normal.x);
  assert.deepEqual(mouseLookOffset(mouse,width,height,.68,.8024),{x:0,y:0});
  assert.deepEqual(mouseLookOffset(mouse,width,height,1.7),{x:0,y:0});
  const camera={x:9000,y:7000};
  assert.deepEqual(worldToScreen(9000,7000,camera,1.7,width,height),{x:800,y:450});
});
