import { lakeAt } from './world.js';

export class FishingSession {
  constructor(){this.castPoint=null;this.lake=null;this.biteAt=0;this.escapeAt=0;this.nextCastAt=0;}
  get active(){return !!this.castPoint;}
  get ready(){return this.active&&this.lastUpdate>=this.biteAt;}
  cast(player,tool,point,now){
    if(player.layer!=='surface'||tool?.type!=='rod')return {ok:false,message:'Equip a fishing rod to cast into a lake.'};
    const lake=lakeAt(point.x,point.y);
    if(!lake)return {ok:false,message:'Aim at lake water to cast.'};
    if(Math.hypot(player.x-point.x,player.y-point.y)>300)return {ok:false,message:'Move closer to the lake shore.'};
    if(now<this.nextCastAt)return {ok:false,message:'Give the fish a moment to settle.'};
    this.castPoint={x:point.x,y:point.y};this.lake=lake;
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
    inventory.add('rawFish',1);inventory.progression.gain(10);this.cancel();this.nextCastAt=now+550;
    return {ok:true,message:'Caught 1 raw fish! Cook it at a fueled campfire.'};
  }
  cancel(){this.castPoint=null;this.lake=null;this.biteShown=false;this.biteAt=0;this.escapeAt=0;}
}
