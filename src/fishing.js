import {chooseFish} from './fish-species.js';
import {rodStats,baitById} from './fishing-tackle.js';
import {lakeAt,oceanDistance} from './world.js';
export class FishingSession{
 constructor(rng=Math.random){this.rng=rng;this.nextCastAt=0;this.cancel();}
 get active(){return !!this.castPoint;}
 get ready(){return this.active&&this.lastUpdate>=this.biteAt;}
 get disturbance(){return this.active&&!this.ready&&this.lastUpdate>=this.disturbAt;}
 cast(player,tool,point,now,inventory){
  if(this.active)return {ok:false,message:'Reel in your current line first.'};
  if(player.swimming&&!player.vehicle?.boat)return {ok:false,message:'Stand on shore or a raft to fish.'};
  if(player.layer!=='surface'||tool?.type!=='rod')return {ok:false,message:'Equip a fishing rod first.'};
  const lake=lakeAt(point.x,point.y)||(oceanDistance(point.x,point.y)<0?{id:'ocean',name:'The Sunken Reach'}:null);
  if(!lake)return {ok:false,message:'Aim at lake or ocean water.'};
  const stats=rodStats(tool);if(Math.hypot(player.x-point.x,player.y-point.y)>stats.range)return {ok:false,message:`Cast range: ${stats.range}. Upgrade your rod at a blacksmith.`};
  if(now<this.nextCastAt)return {ok:false,message:'Give the fish a moment to settle.'};
  const bait=baitById(inventory?.fishingBait||'worms');if(!bait||!inventory?.consume(bait.id,1))return {ok:false,message:'Out of bait! Marlow sells worms and special bait. Select bait in your bag.'};
  this.tool=tool;this.stats=stats;this.bait=bait;this.castPoint={x:point.x,y:point.y};this.lake=lake;this.progress=0;this.fish=null;this.lastClick=-Infinity;
  this.catchOptions={water:lake.id==='ocean'?'ocean':'lake',quest:player.fishingQuest||0,rodRank:stats.rank,luck:stats.luck*bait.luck,depth:lake.id==='ocean'?Math.max(0,-oceanDistance(point.x,point.y)/500):0};
  const wait=(2200+this.rng()*1600)/bait.speed;this.biteAt=now+wait;this.disturbAt=this.biteAt-Math.min(1100,wait*.5);this.escapeAt=this.biteAt+6500;this.lastUpdate=now;
  return {ok:true,message:`${bait.name} cast. Watch for ripples; when it bites, click repeatedly to reel!`};
 }
 update(now,player){
  if(!this.active)return null;
  const dt=Math.max(0,(now-this.lastUpdate)/1000);this.lastUpdate=now;
  if(player.layer!=='surface'||Math.hypot(player.x-this.castPoint.x,player.y-this.castPoint.y)>this.stats.range+80){this.cancel();return 'The line went slack.';}
  if(now>=this.escapeAt){this.cancel();return 'The fish got away. Cast again.';}
  if(this.fish)this.progress=Math.max(0,this.progress-dt*(1.3+this.fish.rank*.22)/this.stats.strength);
  if(now>=this.biteAt&&!this.biteShown){this.biteShown=true;return 'Fish biting! Click repeatedly on the water or tap E to reel it in.';}
  if(now<this.biteAt&&now>=this.disturbAt&&!this.disturbShown){this.disturbShown=true;return 'Something is circling your bait…';}
  return null;
 }
 reel(now,inventory){
  if(!this.active)return {ok:false,message:'Cast into water first.'};this.lastUpdate=now;
  if(now<this.biteAt)return {ok:false,message:'No bite yet. Watch for ripples.'};
  if(now>=this.escapeAt){this.cancel();return {ok:false,message:'The fish got away. Cast again.'};}
  if(now-this.lastClick<55)return {ok:false,progress:true,message:'Keep reeling!'};
  if(!this.fish){this.fish=chooseFish(this.catchOptions,this.rng);this.escapeAt=now+14000+this.fish.rank*250;}
  this.lastClick=now;this.progress=Math.min(100,this.progress+100/(8+this.fish.rank*2.3)*this.stats.strength*this.bait.strength);
  if(this.progress<100)return {ok:false,progress:true,message:`Reeling ${Math.floor(this.progress)}% · click repeatedly!`};
  const fish=this.fish;inventory.add(fish.id,1);inventory.progression.gain(10+Math.floor(fish.rank/3));this.cancel();this.nextCastAt=now+550;
  return {ok:true,resource:fish.id,message:`Caught a ${fish.name} (${fish.length} cm)! Worth ${fish.value} coins.`};
 }
 cancel(){this.castPoint=null;this.lake=null;this.fish=null;this.progress=0;this.biteShown=false;this.disturbShown=false;this.biteAt=0;this.disturbAt=0;this.escapeAt=0;this.lastUpdate=0;}
}
