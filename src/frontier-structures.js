import {CRAFTING_TABLES} from './crafting-stations.js';
import {CAVE_LAYERS} from './cave-shapes.js';
import {FISH_SPECIES,chooseFish} from './fish-species.js';
import {GardenPlot} from './gardening.js';
import {mountainAt,plateauAt} from './frontier-world.js';
import {SURFACE,canWalk,waterAt,oceanDistance,lakeWaterDistance,nearestPortal,buildingForLayer} from './world.js';
let serial=0;
export const STRUCTURE_CONFIG={
 ...Object.fromEntries(CRAFTING_TABLES.map(t=>[t.id,{radius:52,width:116,height:66,solid:true,tableTier:t.tableTier}])),
 'reed-raft':{radius:90,width:180,height:110,solid:false},
 'wood-roof':{radius:64,width:128,height:128,solid:false},
 'wood-wall':{radius:55,width:104,height:20,solid:true},
 'plant-box':{radius:44,width:96,height:64,solid:false},
 'drying-shack':{radius:70,interval:30,solid:true},'wood-floor':{radius:64,width:128,height:128,solid:false},
 'stone-wall':{radius:55,width:104,height:20,solid:true},'wood-gate':{radius:55,width:104,height:20,solid:true},
 'storage-chest':{radius:35,solid:true},'fish-trap':{radius:38,interval:45,solid:false},
 'ore-extractor':{radius:44,interval:20,solid:true},'timber-rig':{radius:48,interval:25,solid:true},'healing-totem':{radius:28,interval:30,solid:false},
};
export function raftCanOccupy(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=95&&y>=95&&x<=SURFACE.width-95&&y<=SURFACE.height-95&&canWalk(x,y,'surface',95,true)&&[-85,0,85].every(dx=>[-50,0,50].every(dy=>waterAt(x+dx,y+dy,'surface')));}
export function structurePlacement(kind,point,layer,registry){
 if(!STRUCTURE_CONFIG[kind])return {ok:false,message:'Unknown structure.'};
 if(buildingForLayer(layer)||layer==='ocean')return {ok:false,message:'Build outside buildings and above water.'};
 if(kind==='reed-raft'){return layer==='surface'&&raftCanOccupy(point.x,point.y)&&!registry.visible({left:point.x-200,right:point.x+200,top:point.y-150,bottom:point.y+150},layer).some(s=>s.kind==='reed-raft')?{ok:true}:{ok:false,message:'Place the entire raft in open surface water.'};}
 if(layer==='surface'&&mountainAt(point.x,point.y)&&!plateauAt(point.x,point.y))return {ok:false,message:'Choose flat ground or a summit plateau; slopes stay clear.'};
 if(registry.visible({left:point.x-10,right:point.x+10,top:point.y-10,bottom:point.y+10},layer).some(s=>s.kind===kind&&Math.hypot(s.x-point.x,s.y-point.y)<10))return {ok:false,message:'A piece is already placed here.'};
 const wet=waterAt(point.x,point.y,layer),nearWater=oceanDistance(point.x,point.y)<170||lakeWaterDistance(point.x,point.y)<170;
 if(kind==='fish-trap'){if(layer!=='surface'||!nearWater||oceanDistance(point.x,point.y)<-650)return {ok:false,message:'Fish traps need shallow surface water or a nearby shore.'};}
 else if(wet||!canWalk(point.x,point.y,layer,70,true))return {ok:false,message:'Choose flat, dry, open ground.'};
 if(nearestPortal(point.x,point.y,layer,180)||registry.visible({left:point.x-160,right:point.x+160,top:point.y-160,bottom:point.y+160},layer).some(s=>!['wood-floor','wood-roof'].includes(s.kind)&&Math.hypot(s.x-point.x,s.y-point.y)<s.radius+STRUCTURE_CONFIG[kind].radius+8))return {ok:false,message:'Leave room around entrances and other structures.'};
 if(kind==='ore-extractor'&&!CAVE_LAYERS.includes(layer))return {ok:false,message:'Ore extractors must be built in caves.'};
 if(kind==='timber-rig'&&layer!=='surface')return {ok:false,message:'Timber rigs need a surface tree.'};
 return {ok:true};
}
export class FrontierStructure{
 constructor(kind,x,y,layer,rotation=0,context=null){Object.assign(this,{id:'built-'+(++serial),kind,x,y,layer,rotation,context,...STRUCTURE_CONFIG[kind],input:0,fuel:0,progress:0,storage:{},open:false,hits:0,nextHitAt:0});if(rotation&&this.width)[this.width,this.height]=[this.height,this.width];}
 addFuel(inv){const id=this.kind==='plant-box'?'freshWater':this.kind==='healing-totem'?'essence':this.kind==='fish-trap'?'leaves':'wood';if(!inv.consume(id,1))return false;this.fuel+=this.kind==='drying-shack'?3:1;return true;}
 addInput(inv,resource){if(this.kind==='plant-box'){this.garden??=new GardenPlot();return this.garden.plant(inv,resource);}if(this.kind==='drying-shack'){if(!inv.consume('rawMarijuana',1))return false;this.input++;return true;}if(this.kind==='storage-chest')return this.deposit(inv,resource);return false;}
 deposit(inv,resource,amount=10){const n=Math.min(amount,inv.resources[resource]||0);if(!n||!inv.consume(resource,n))return false;this.storage[resource]=(this.storage[resource]||0)+n;return true;}
 collect(inv){let total=0;for(const [id,n] of Object.entries(this.storage)){if(n>0){inv.add(id,n);total+=n;}}this.storage={};return total;}
 update(dt){
  if(this.kind==='plant-box'){if(Object.values(this.storage).reduce((a,b)=>a+b,0)<200)this.garden?.update(dt,this);return;}
  if(!this.interval||!this.fuel||Object.values(this.storage).reduce((a,b)=>a+b,0)>=200)return;
  if(this.kind==='drying-shack'&&!this.input)return;
  const ctx=this.context;
  if(this.kind==='healing-totem'){
   if(ctx?.player.layer!==this.layer||Math.hypot(ctx.player.x-this.x,ctx.player.y-this.y)>240)return;
   ctx.vitals.heal(dt*2);this.progress+=dt;if(this.progress>=30){this.progress-=30;this.fuel--;}return;
  }
  this.progress+=dt;
  while(this.progress>=this.interval&&this.fuel>0){
   if(this.kind==='drying-shack'){if(!this.input){this.progress=0;break;}this.input--;this.storage.driedMarijuana=(this.storage.driedMarijuana||0)+1;}
   else if(this.kind==='fish-trap'){const f=chooseFish({quest:ctx?.inventory.fishingQuest||0,depth:.5,rodRank:0});this.storage[f.id]=(this.storage[f.id]||0)+1;}
   else if(ctx){
    const type=this.kind==='ore-extractor'?'pickaxe':'axe',kind=this.kind==='ore-extractor'?'ore':'tree';
    const tools=[...ctx.inventory.owned.values()].filter(t=>t.type===type).sort((a,b)=>b.power-a.power),node=[...ctx.spawnables.nodes.values()].filter(n=>n.layer===this.layer&&n.kind===kind&&n.active&&Math.hypot(n.x-this.x,n.y-this.y)<400).sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y)-Math.hypot(b.x-this.x,b.y-this.y))[0];
    if(!node||!tools[0]){this.progress=Math.min(this.progress,this.interval);return;}
    const result=node.take(ctx.now?.()||performance.now(),tools[0]);
    if(!result.ok){this.progress=Math.min(this.progress,this.interval);return;}
    for(const [id,n] of Object.entries(result.loot||{}))this.storage[id]=(this.storage[id]||0)+n;
   }else return;
   this.progress-=this.interval;this.fuel--;
  }
 }
 mine(tool,now){const required=this.tableTier?(this.tableTier===1?'axe':'pickaxe'):['wood-wall','wood-roof','wood-floor','wood-gate','reed-raft'].includes(this.kind)?'axe':'pickaxe';if(tool?.type!==required)return {ok:false,message:`Equip an ${required} to recover this structure.`};if(now<this.nextHitAt)return {ok:false,cooldown:true};this.nextHitAt=now+500;this.hits++;return {ok:true,removed:this.hits>=3,remaining:Math.max(0,3-this.hits)};}
 recover(inv){this.garden?.recover(inv);this.collect(inv);if(this.input)inv.add('rawMarijuana',this.input);const fuel=this.kind==='plant-box'?'freshWater':this.kind==='healing-totem'?'essence':this.kind==='fish-trap'?'leaves':'wood',amount=this.kind==='drying-shack'?Math.floor(this.fuel/3):this.fuel;if(amount)inv.add(fuel,amount);inv.structures[this.kind]=(inv.structures[this.kind]||0)+1;}
}
