import {FISH_SPECIES} from './fish-species.js';
let nextId=1;
export class Campfire {
  constructor(x,y,layer){Object.assign(this,{id:`campfire-${nextId++}`,x,y,layer,radius:42,fuel:0,rawMeat:0,cookedMeat:0,rawFish:0,cookedFish:0,progress:0,hits:0,nextHitAt:0});}
  addFuel(inventory){if(!inventory.consume('wood',1))return false;this.fuel+=4;return true;}
  addMeat(inventory){if(!inventory.consume('meat',1))return false;this.rawMeat++;return true;}
  addFish(inventory){const id=inventory.resources.rawFish>0?'rawFish':FISH_SPECIES.find(f=>inventory.resources[f.id]>0)?.id;if(!id||!inventory.consume(id,1))return false;this.rawFish++;return true;}
  update(dt){if(this.fuel<=0||this.rawMeat+this.rawFish<=0)return;this.progress+=dt;while(this.progress>=4&&this.fuel>0&&this.rawMeat+this.rawFish>0){this.progress-=4;this.fuel--;if(this.rawMeat>0){this.rawMeat--;this.cookedMeat++;}else{this.rawFish--;this.cookedFish++;}}}
  collect(inventory){const amount=this.cookedMeat;if(amount){inventory.add('cookedMeat',amount);this.cookedMeat=0;}return amount;}
  collectFish(inventory){const amount=this.cookedFish;if(amount){inventory.add('cookedFish',amount);this.cookedFish=0;}return amount;}
  mine(tool,now){
    if(tool?.type!=='pickaxe')return {ok:false,message:'Equip a pickaxe to mine and pick up this campfire.'};
    if(now<this.nextHitAt)return {ok:false,cooldown:true};
    this.nextHitAt=now+600;this.hits++;
    return {ok:true,removed:this.hits>=3,remaining:Math.max(0,3-this.hits)};
  }
}
export class StructureRegistry {
  constructor(){this.items=new Map();}
  add(item){this.items.set(item.id,item);return item;}
  remove(item){this.items.delete(item.id);}
  update(dt){for(const item of this.items.values())if(!item.remote)item.update(dt);}
  visible(bounds,layer){const result=[];for(const s of this.items.values())if(s.layer===layer&&s.x>bounds.left-100&&s.x<bounds.right+100&&s.y>bounds.top-100&&s.y<bounds.bottom+100)result.push(s);return result;}
  at(x,y,layer){let best=null,priority=Infinity;for(const s of this.items.values()){if(s.layer!==layer)continue;const rank=s.kind==='wood-floor'?2:s.kind==='wood-roof'?1:0;if(rank>=priority)continue;if(s.width?Math.abs(x-s.x)<s.width/2+8&&Math.abs(y-s.y)<s.height/2+60:Math.hypot(x-s.x,y-s.y)<s.radius+16){best=s;priority=rank;}}return best;}
  nearest(x,y,layer,range=135){let best=null,distance=range;for(const s of this.items.values()){if(s.layer!==layer)continue;const d=Math.hypot(x-s.x,y-s.y)-s.radius;if(d<distance){best=s;distance=d;}}return best;}
  blocks(x,y,layer,radius=24){for(const s of this.items.values())if(s.layer===layer&&s.solid!==false&&!(s.kind==='wood-gate'&&s.open)&& (s.width?Math.abs(x-s.x)<s.width/2+radius&&Math.abs(y-s.y)<s.height/2+radius:Math.hypot(x-s.x,y-s.y)<s.radius+radius))return true;return false;}
}
