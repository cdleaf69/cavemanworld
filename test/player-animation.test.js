import test from 'node:test';
import assert from 'node:assert/strict';
import { playerArmPose,heldToolPose,fishingRodTipWorld } from '../src/player-animation.js';
import { CAMERA_TILT } from '../src/camera.js';

test('side walking swings arms in opposition while front/back motion remains unchanged',()=>{
 for(const facing of [0,Math.PI]){
  const pose=playerArmPose({facing,moving:true},145);
  const [a,b]=pose.arms;assert.ok((a.elbow.x-a.shoulder.x)*(b.elbow.x-b.shoulder.x)<0);assert.ok(a.hand.y>a.elbow.y&&b.hand.y>b.elbow.y);
 }
 for(const facing of [Math.PI/2,Math.PI*1.5]){const pose=playerArmPose({facing,moving:true},145);assert.equal(pose.arms[0].hand.x,11.5);assert.equal(pose.arms[1].hand.x,32.5);}
});

test('held tools stay attached to an animated hand through windup, strike and recovery',()=>{
  for(const type of ['axe','pickaxe','club','rock','rod']){
    const player={x:100,y:200,facing:Math.PI,swingUntil:1250};
    const angles=[];
    for(const time of [1000,1062.5,1162.5,1250]){
      const pose=playerArmPose(player,time,type),held=heldToolPose(player,time,type,null,pose);
      const hand=pose.arms[pose.heldArm].hand;
      assert.equal((held.flip?-1:1)*held.x,(pose.flip?-1:1)*(hand.x-22));
      assert.equal(held.y,hand.y-61);angles.push(held.angle);
    }
    assert.ok(angles[1]<angles[0]);assert.ok(angles[2]>angles[0]);assert.ok(Math.abs(angles[3])<.12);
  }
});

test('fishing line remains on the rod tip during mirrored swings and jumps',()=>{
  for(const facing of [0,Math.PI])for(const targetX of [-50,500])for(const time of [1000,1060,1160,1300]){
    const player={x:100,y:200,facing,moving:true,swingUntil:1250,jumpHeight:20};
    const fishing={active:true,castPoint:{x:targetX,y:300}};
    const held=heldToolPose(player,time,'rod',fishing),tip=fishingRodTipWorld(player,time,fishing);
    const handX=player.x+(held.flip?-1:1)*held.scale*held.x,handY=player.y-player.jumpHeight+held.scale/CAMERA_TILT*held.y;
    const length=Math.hypot((tip.x-handX)/held.scale,(tip.y-handY)*CAMERA_TILT/held.scale);
    assert.ok(Math.abs(length-held.size*Math.hypot((59-27)/96,(13-81)/96))<1e-10);
    assert.equal(held.flip,targetX<player.x);
  }
});


test('side arm swings stay compact and the far arm swaps with facing',()=>{
 const east=playerArmPose({facing:0,moving:true},145),west=playerArmPose({facing:Math.PI,moving:true},145);
 assert.equal(east.arms[0].far,true);assert.equal(east.arms[1].far,false);
 assert.equal(west.arms[0].far,false);assert.equal(west.arms[1].far,true);
 for(const facing of [0,Math.PI]){
  const poses=Array.from({length:24},(_,i)=>playerArmPose({facing,moving:true},i*25));
  for(let arm=0;arm<2;arm++){
   const hands=poses.map(p=>p.arms[arm].hand.x);
   assert.ok(Math.max(...hands)-Math.min(...hands)<7);
   for(const p of poses){const a=p.arms[arm];assert.ok(a.hand.y>a.elbow.y);assert.ok(Math.hypot(a.hand.x-a.elbow.x,a.hand.y-a.elbow.y)<8);}
  }
  for(const time of [0,145,290,435]){const pose=playerArmPose({facing,moving:true},time,'bow');assert.equal(pose.arms[pose.heldArm].far,false);}
 }
});
