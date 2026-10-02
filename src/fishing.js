import {chooseFish,rodRank} from './fish-species.js';
import { lakeAt,oceanDistance } from './world.js';

export class FishingSession {
  constructor(){this.castPoint=null;this.lake=null;this.biteAt=0;this.escapeAt=0;this.nextCastAt=0;}
  get active(){return !!this.castPoint;}
  get ready(){return this.active&&this.lastUpdate>=this.biteAt;}
  cast(player,tool,point,now){
    if(player.swimming&&!player.vehicle?.boat)return {ok:false,message:'Stand on the shore to fish.'};
    if(player.layer!=='surface'||tool?.type!=='rod')return {ok:false,message:'Equip a fishing rod to cast into a lake.'};
    const lake=lakeAt(point.x,point.y)||(oceanDistance(point.x,point.y)<0?{id:'ocean',name:'The Sunken Reach'}:null);
    if(!lake)return {ok:false,message:'Aim at lake water to cast.'};
    if(Math.hypot(player.x-point.x,player.y-point.y)>300)return {ok:false,message:'Move closer to the lake shore.'};
    if(now<this.nextCastAt)return {ok:false,message:'Give the fish a moment to settle.'};
    this.tool=tool;this.castPoint={x:point.x,y:point.y};this.lake=lake;this.catchOptions={water:lake.id==='ocean'?'ocean':'lake',quest:player.fishingQuest||0,rodRank:rodRank(tool),depth:lake.id==='ocean'?Math.max(0,-oceanDistance(point.x,point.y)/500):0};
    this.biteAt=now+1800+(Math.abs(Math.floor(point.x*13+point.y*7))%1400);
    this.escapeAt=this.biteAt+6500;this.lastUpdate=now;
    return {ok:true,message:`Line cast into ${lake.name}. Wait for a bite, then click the bobber or press E.`};
  }
  update(now,player){
    if(!this.active)return null;
    this.lastUpdate=now;
    if(player.layer!=='surface'||Math.hypot(player.x-this.castPoint.x,player.y-this.castPoint.y)>365){this.cancel();return 'The line went slack.';}
    if(now>=this.escapeAt){this.cancel();return 'The fish got away. Cast again.';}
    if(now>=this.biteAt&&!this.biteShown){this.biteShown=true;return 'Fish biting! Click the bobber or press E to reel it in.';}
    return null;
  }
  reel(now,inventory){
    if(!this.active)return {ok:false,message:'Cast into a lake first.'};
    if(now<this.biteAt)return {ok:false,message:'No bite yet. Watch the bobber.'};
    if(now>=this.escapeAt){this.cancel();return {ok:false,message:'The fish got away. Cast again.'};}
    const fish=chooseFish(this.catchOptions);inventory.add(fish.id,1);inventory.progression.gain(10);this.cancel();this.nextCastAt=now+550;
    return {ok:true,resource:fish.id,message:`Caught a ${fish.name} (${fish.length} cm)! Sell for ${fish.value} coins or cook it.`};
  }
  cancel(){this.castPoint=null;this.lake=null;this.biteShown=false;this.biteAt=0;this.escapeAt=0;}
}
