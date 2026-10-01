import { CAMERA_TILT } from './camera.js';

const clamp=v=>Math.max(0,Math.min(1,v));
const ease=t=>t*t*(3-2*t);
function swingAngle(progress,type){
  const angles=type==='rod'?[0,-.5,.35,0]:type==='rock'?[0,-.2,.4,0]:[0,-.7,1.05,0];
  const stops=[0,.25,.65,1];
  for(let i=1;i<stops.length;i++)if(progress<=stops[i]){
    const t=ease((progress-stops[i-1])/(stops[i]-stops[i-1]));
    return angles[i-1]+(angles[i]-angles[i-1])*t;
  }
  return 0;
}

// Coordinates are in the character's unmirrored 44 × 66 sprite space.
export function playerArmPose(player,time,type=null,fishing=null){
  const side=Math.abs(Math.cos(player.facing))>.7,back=Math.sin(player.facing)<-.45;
  const flip=Math.cos(player.facing)<-.7;
  const stride=player.moving?Math.sin(time/145*Math.PI/2):0;
  const remaining=Math.max(0,(player.swingUntil||0)-time);
  const progress=remaining?clamp(1-remaining/250):0;
  const attack=remaining?Math.sin(progress*Math.PI):0;
  const heldFlip=type==='rod'&&fishing?.active?fishing.castPoint.x<player.x:flip;
  const heldArm=heldFlip===flip?1:0;
  const arms=(side?[14.5,29.5]:[11.5,32.5]).map((x,index)=>{
    // Both side-facing arms lean in the same direction. Forward walking alternates naturally.
    const dx=side?4+stride*(index===0?1:-1):0;
    const dy=back?-4:0;
    const hand={x:x+dx,y:(side?47:45)+dy+stride*(index===0?2:-2)};
    let elbow={x:x+dx*(side?.3:.6),y:(side?39:38)+dy*.3};
    if(side&&player.moving){
      // Short upper arm, then a lifted forearm: both elbows point into the run.
      const beat=stride*(index===0?1:-1);
      elbow={x:x+1.5+beat,y:39+beat*.3};
      hand.x=elbow.x+3.5;hand.y=38+beat*.5;
    }
    if(type&&index===heldArm){
      hand.y-=(side&&player.moving?1.5:5)+attack*4;
      hand.x+=(side?1:2)+attack*(type==='rock'?6:2);
      if(type==='rod'&&fishing?.active)hand.y+=Math.sin(time*.008)*.4;
    }
    return {shoulder:{x,y:31},elbow,hand,far:side&&index===0};
  });
  return {arms,flip,heldFlip,heldArm,stride,progress,side,back,attacking:remaining>0};
}

export function heldToolPose(player,time,type,fishing=null,pose=playerArmPose(player,time,type,fishing)){
  const hand=pose.arms[pose.heldArm].hand;
  const size=type==='rock'?31:43;
  const grip=['bow','slingshot'].includes(type)?{x:.48,y:.66}:type==='rod'?{x:27/96,y:81/96}:type==='rock'?{x:.5,y:.6}:{x:35/96,y:78/96};
  // Convert the chosen hand into the held item's mirrored coordinate system.
  const x=(pose.flip?-1:1)*(pose.heldFlip?-1:1)*(hand.x-22);
  const y=hand.y-61;
  const carryAngle=pose.side?-.08:pose.back?-.55:.55;
  const angle=pose.attacking?carryAngle+(pose.back?-1:1)*swingAngle(pose.progress,type):carryAngle+pose.stride*.065+(type==='rod'&&fishing?.active?Math.sin(time*.006)*.025:Math.sin(time*.002)*.012);
  return {x,y,angle,size,grip,flip:pose.heldFlip,scale:1.65};
}

// Project sprite attachment points through the exact held-item transform.
export function heldItemPointWorld(player,time,type,point,fishing=null){
  const held=heldToolPose(player,time,type,fishing);
  const dx=held.size*(point.x/96-held.grip.x),dy=held.size*(point.y/96-held.grip.y);
  const x=held.x+dx*Math.cos(held.angle)-dy*Math.sin(held.angle);
  const y=held.y+dx*Math.sin(held.angle)+dy*Math.cos(held.angle);
  return {x:player.x+(held.flip?-1:1)*held.scale*x,y:player.y-(player.jumpHeight||0)+held.scale/CAMERA_TILT*y};
}
export function rangedWeaponOrigin(player,time,type){
  // Pixel art is drawn at 3× its 32-pixel grid: bow nock / slingshot pouch.
  const point=type==='bow'?{x:15*3,y:17*3}:{x:16*3,y:12*3};
  return heldItemPointWorld(player,time,type,point);
}
export function fishingRodTipWorld(player,time,fishing){
  return heldItemPointWorld(player,time,'rod',{x:59,y:13},fishing);
}
