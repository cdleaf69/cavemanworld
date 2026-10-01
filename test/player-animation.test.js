import test from 'node:test';
import assert from 'node:assert/strict';
import { playerArmPose,heldToolPose,fishingRodTipWorld } from '../src/player-animation.js';
import { CAMERA_TILT } from '../src/camera.js';

test('both arms lean toward the side facing and forward walking alternates',()=>{
  for(const facing of [0,Math.PI])for(const time of [0,145,290,435]){
    const pose=playerArmPose({facing,moving:true},time);
    const direction=pose.flip?-1:1;
    for(const arm of pose.arms)assert.ok((arm.hand.x-arm.shoulder.x)*direction*(facing===0?1:-1)>0);
  }
  const forward=playerArmPose({facing:Math.PI/2,moving:true},145);
  assert.equal(forward.arms[0].hand.y-45,-(forward.arms[1].hand.y-45));
  for(const arm of forward.arms)assert.equal(arm.hand.x,arm.shoulder.x);
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

test('side running has compact bent elbows while south and north retain their existing swing',()=>{
  for(const time of [0,72.5,145,290,435]){
    for(const facing of [0,Math.PI])for(const type of [null,'axe','club','rod']){
      const pose=playerArmPose({facing,moving:true},time,type);
      for(const arm of pose.arms){
        assert.ok(arm.hand.y<arm.elbow.y,'forearm is lifted');
        assert.ok(arm.hand.x>arm.elbow.x,'forearm reaches into the run');
        assert.ok(Math.hypot(arm.elbow.x-arm.shoulder.x,arm.elbow.y-arm.shoulder.y)<9);
        assert.ok(Math.hypot(arm.hand.x-arm.elbow.x,arm.hand.y-arm.elbow.y)<10);
      }
    }
    for(const facing of [Math.PI/2,Math.PI*1.5]){
      const back=facing===Math.PI*1.5,pose=playerArmPose({facing,moving:true},time),stride=Math.sin(time/145*Math.PI/2);
      pose.arms.forEach((arm,i)=>{
        assert.equal(arm.shoulder.x,[11.5,32.5][i]);
        assert.equal(arm.elbow.y,38+(back?-1.2:0));
        assert.equal(arm.hand.x,arm.shoulder.x);
        assert.equal(arm.hand.y,45+(back?-4:0)+stride*(i===0?2:-2));
      });
    }
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
