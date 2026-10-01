import { WALK_SPEED, SPRINT_MULTIPLIER } from './world.js';
import { screenToWorld } from './camera.js';

export const CARDINAL_DIRECTIONS={w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]};

// Opposite keys cancel; perpendicular keys combine at the same overall speed.
export function movementVector({keys,sprinting,dt,betaBoost=false,speedMultiplier=1}){
  const x=Number(keys.has('d'))-Number(keys.has('a'));
  const y=Number(keys.has('s'))-Number(keys.has('w'));
  const length=Math.hypot(x,y);
  if(!length)return {dx:0,dy:0};
  const distance=WALK_SPEED*(sprinting?SPRINT_MULTIPLIER:1)*(betaBoost?10:1)*speedMultiplier*dt;
  return {dx:x/length*distance,dy:y/length*distance};
}

export function mouseHeading({mouse,player,camera,zoom,width,height}){
  const aim=screenToWorld(mouse.x,mouse.y,camera,zoom,width,height);
  if(Math.hypot(aim.x-player.x,aim.y-player.y)<20)return player.facing;
  return Math.atan2(aim.y-player.y,aim.x-player.x);
}

// Set insertion order preserves the most recently pressed movement key.
export function keyboardFacing(keys,previous){
  const angles={d:0,s:Math.PI/2,a:Math.PI,w:Math.PI*1.5};
  const opposite={w:'s',s:'w',a:'d',d:'a'};
  const active=[...keys].filter(k=>k in angles&&!keys.has(opposite[k]));
  return active.length?angles[active.at(-1)]:previous;
}
export function startJump(player){
  if(player.jumpActive||player.swimming)return false;
  player.jumpActive=true;player.jumpTime=0;player.jumpHeight=0;return true;
}
export function updateJump(player,dt){
  if(!player.jumpActive)return;
  player.jumpTime=Math.min(.52,player.jumpTime+dt);
  const t=player.jumpTime/.52;
  player.jumpHeight=34*4*t*(1-t);
  if(t>=1){player.jumpActive=false;player.jumpHeight=0;}
}
