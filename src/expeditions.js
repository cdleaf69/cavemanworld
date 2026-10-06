import {DARREN} from './underground-store-data.js';
import {MOUNTAINS,FISHERMAN,coastline,mountainAt} from './frontier-world.js';
import {CAVE_ROOMS,DEEP_ROOMS,EXTRA_CAVES,canWalk,oceanDistance,BIOMES,waterAt} from './world.js';
import {fishCount,consumeFish} from './fish-species.js';
import {RECIPES} from './crafting.js';
import {Tool,Gear} from './spawnables.js';

export class DivingSession{
 constructor(){this.breath=35;this.maxBreath=35;this.wetTime=0;this.damageTime=0;}
 update(dt,player,inventory){
  const unlimited=inventory.equippedGear?.id==='tidekeeper-armor';this.maxBreath=inventory.equippedGear?.id==='diver-wrap'?70:35;this.breath=Math.min(this.breath,this.maxBreath);
  if(player.layer==='ocean'){
   this.wetTime=0;if(unlimited){this.breath=this.maxBreath;this.damageTime=0;return 0;}
   this.breath=Math.max(0,this.breath-dt);if(!this.breath){this.damageTime+=dt;if(this.damageTime>=1){this.damageTime-=1;return 8;}}return 0;
  }
  this.breath=Math.min(this.maxBreath,this.breath+dt*12);this.damageTime=0;
  this.wetTime=player.layer==='surface'&&oceanDistance(player.x,player.y)<-750&&!player.vehicle?.boat&&!player.vehicle?.glider?this.wetTime+dt:0;return 0;
 }
 canDive(player){return player.layer==='surface'&&oceanDistance(player.x,player.y)<-70;}
 reset(){this.breath=this.maxBreath;this.wetTime=0;this.damageTime=0;}
}
export class StatusEffects{
 constructor(){this.marijuanaUntil=0;}
 use(inventory,now){if(!inventory.consume('driedMarijuana',1))return false;this.marijuanaUntil=now+60000;return true;}
 active(now){return now<this.marijuanaUntil;}
 apply(inventory,effects,now){const active=this.active(now);inventory.progression.multiplier=active?1.5:1;if(active)effects.stats.health*=1.5;return effects;}
}

const appearance=(id,skin,hair,shirt,extra={})=>({id,skin,skinLight:skin==='\u00239e684e'?'#bd8966':'#f3caa0',skinShade:skin==='#9e684e'?'#78513f':'#bd8866',hair,shirt,...extra});
export const NPC_APPEARANCES=[
 appearance('marlow','#dba77b','#dad3b0','#478b94',{beard:true,hairStyle:'bald'}),
 appearance('nala','#9e684e','#3e3532','#d19a5b',{hairStyle:'curls',freckles:true}),
 appearance('toma','#e8bd91','#9a633a','#6c8b62',{beard:true,hairStyle:'ponytail'}),
 appearance('rin','#c78b64','#453e43','#936f9b',{hairStyle:'braids'}),
 appearance('keva','#ba7956','#2d343a','#b7a759',{hairStyle:'mohawk',wideJaw:true}),
 appearance('orren','#edc4a2','#86775c','#6393a5',{hairStyle:'shaved',freckles:true}),
 appearance('iris','#a77059','#ae9c82','#b66c69',{hairStyle:'swept'}),
];
export class NpcRegistry{
 constructor(){this.items=[{...FISHERMAN,appearance:NPC_APPEARANCES[0],facing:Math.PI/2,moving:false},{...DARREN}];
  const woods=BIOMES.filter(b=>b.id==='woodland');
  for(let i=0;i<woods.length;i++){const b=woods[i],x=b.center[0]+700,y=b.center[1]+450;if(canWalk(x,y,'surface',60)&&!mountainAt(x,y))this.items.push({id:'woods-'+i,name:['Nala','Toma','Rin','Keva','Iris'][i%5]+' the Wayfarer',x,y,homeX:x,homeY:y,layer:'surface',role:'woods',appearance:NPC_APPEARANCES[1+i%6],facing:0});}
  for(const [layer,rooms] of [['cave',CAVE_ROOMS],['deep',DEEP_ROOMS],...Object.entries(EXTRA_CAVES).map(([l,g])=>[l,g.rooms])])for(let i=0;i<5;i++){const r=rooms[(i*5+2)%rooms.length];this.items.push({id:layer+'-guide-'+i,name:['Orren','Keva','Toma','Rin','Iris'][i]+' the Delver',x:r.x+200,y:r.y+250,homeX:r.x+200,homeY:r.y+250,layer,role:'cave',appearance:NPC_APPEARANCES[(i+3)%7],facing:Math.PI/2});}
 }
 update(dt,time,player){for(const [i,n] of this.items.entries()){n.moving=false;if(n.fixed||n.layer!==player.layer||Math.hypot(n.x-player.x,n.y-player.y)>1600||Math.hypot(n.x-player.x,n.y-player.y)<130)continue;let a=time*.00025+i*1.7;if(Math.hypot(n.x-n.homeX,n.y-n.homeY)>220)a=Math.atan2(n.homeY-n.y,n.homeX-n.x);const dx=Math.cos(a)*28*dt,dy=Math.sin(a)*28*dt;if(canWalk(n.x+dx,n.y+dy,n.layer,25)&&!waterAt(n.x+dx,n.y+dy,n.layer)&&(n.layer!=='surface'||!mountainAt(n.x+dx,n.y+dy))){n.x+=dx;n.y+=dy;n.moving=true;n.facing=Math.abs(dx)>Math.abs(dy)?dx>0?0:Math.PI:dy>0?Math.PI/2:Math.PI*1.5;}}}
 nearest(player,range=160){return this.items.filter(n=>n.layer===player.layer&&Math.hypot(n.x-player.x,n.y-player.y)<range).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;}
 visible(b,layer){return this.items.filter(n=>n.layer===layer&&n.x>b.left-100&&n.x<b.right+100&&n.y>b.top-100&&n.y<b.bottom+100);}
}
export const FISHERMAN_QUESTS=[
 {name:'A First Line',resources:{sticks:6,leaves:4},coins:20,xp:30,item:'fishing-rod',hint:'Collect sticks and leaves; Marlow will give you a rod.'},
 {name:'Shore Supper',fish:3,minFish:1,coins:40,xp:45,hint:'Catch three fish from the beach.'},
 {name:'A Stronger Swimmer',fish:5,minFish:2,resources:{shell:4},coins:60,xp:70,item:'diver-wrap',hint:'Deliver fish and shells. The Diver Wrap doubles your breath.'},
 {name:'Into the Reef',fish:7,minFish:3,resources:{coral:5},coins:90,xp:90,item:'reef-rod',hint:'V dives in sea water. Coral grows on the seafloor.'},
 {name:'The First Wreck',fish:4,minFish:4,resources:{pearl:3},proof:{treasures:1},coins:130,xp:120,hint:'Find your first ocean-floor chest and some pearls.'},
 {name:'Crabs at the Mooring',fish:6,minFish:5,proof:{reefCrab:5},coins:180,xp:150,hint:'Defeat five reef crabs while diving.'},
 {name:'Provision the Raft',fish:8,minFish:6,resources:{coral:10},coins:220,xp:190,item:'reed-raft',hint:'A raft lets you fish farther offshore and dive above a wreck.'},
 {name:'Wreck Survey',fish:6,minFish:8,proof:{treasures:3},coins:300,xp:240,item:'abyss-rod',hint:'Survey three different wreck chests. Larger catches need offshore water.'},
 {name:'Hunters of the Deep',fish:5,minFish:10,resources:{pearl:8},proof:{seaPredators:3},coins:450,xp:300,hint:'Defeat ocean predators and land trophy catches.'},
 {name:'Keeper of the Tides',fish:3,minFish:12,resources:{sunkenRelic:5,seaEssence:8},proof:{deepTreasures:5},coins:750,xp:450,item:'tidekeeper-armor',hint:'Five deep wrecks and the rarest catches earn permanent water-breathing armor.'},
];
function grantItem(inv,id){const r=RECIPES.find(r=>r.id===id);if(!r||inv.owned.has(id))return;if(r.category==='structure')inv.structures[id]=(inv.structures[id]||0)+1;else inv.owned.set(id,r.category==='gear'?new Gear(r):new Tool(r));}
export class QuestBook{
 constructor(){this.fisherman=0;this.steps={};this.proof={treasures:0,deepTreasures:0,reefCrab:0,seaPredators:0,mountainBoss:0};this.claimedChests=new Set();this.active=new Set(['fisherman']);}
 task(npc){if(npc.role==='darren')return {name:'Seven for Five Hundred',marijuana:7,coins:500,xp:75,hint:'Bring 7 fresh or dried marijuana. Darren pays 500 coins. Repeatable. He is also the only buyer for marijuana and boss loot.'};if(npc.role==='fisherman')return FISHERMAN_QUESTS[this.fisherman]||null;
  const step=(this.steps[npc.id]||0)%3;
  if(npc.role==='woods')return [
   {name:'Trail Supplies',resources:{leaves:12,wood:6},coins:50,xp:50,hint:'Every traveler needs dry fuel and a little shelter.'},
   {name:'Wild Country',proof:{boar:3},resources:{hide:4},coins:110,xp:100,hint:'Drive off boars and bring spare hides.'},
   {name:'The Summit Expedition',resources:{alpineFiber:8,skyCrystal:4},proof:{mountainBoss:1},coins:600,xp:350,item:'crystal-glider',hint:'Climb a range, gather summit resources, and defeat its Bigfoot.'},
  ][step];
  const ore={cave:'iron',deep:'moonstone',abyss:'cobalt',core:'infernite',mantle:'hellstone',vault:'voidsteel'}[npc.layer]||'iron';return step===2?{name:'Clear the Dark',proof:{['kills-'+npc.layer]:20},resources:{essence:5},coins:550,xp:300,hint:'A larger expedition: defeat twenty creatures on this cave level.'}:{name:step?'Cave Provisions':'A Delver’s Order',resources:step?{wood:10,cookedMeat:4}:{[ore]:6,bone:4},coins:90+step*60,xp:80+step*50,hint:'Bring supplies or local ore to the wandering delver.'};
 }
 ready(npc,inv){const q=this.task(npc);return !!q&&(!q.marijuana||(inv.resources.rawMarijuana||0)+(inv.resources.driedMarijuana||0)>=q.marijuana)&&Object.entries(q.resources||{}).every(([id,n])=>(inv.resources[id]||0)>=n)&&(!q.fish||fishCount(inv,q.minFish)>=q.fish)&&Object.entries(q.proof||{}).every(([id,n])=>(this.proof[id]||0)>=n);}
 claim(npc,inv){const q=this.task(npc);if(!this.ready(npc,inv))return {ok:false,message:'Finish the listed objectives first.'};
  if(q.marijuana){const raw=Math.min(q.marijuana,inv.resources.rawMarijuana);if(raw)inv.consume('rawMarijuana',raw);if(raw<q.marijuana)inv.consume('driedMarijuana',q.marijuana-raw);}
  for(const [id,n] of Object.entries(q.resources||{}))inv.consume(id,n);if(q.fish)consumeFish(inv,q.fish,q.minFish);inv.coins+=q.coins;inv.progression.gain(q.xp);if(q.item)grantItem(inv,q.item);
  if(npc.role!=='fisherman')for(const [id,n] of Object.entries(q.proof||{}))this.proof[id]-=n;
  if(npc.role==='fisherman'){this.fisherman++;inv.fishingQuest=this.fisherman;}else this.steps[npc.id]=(this.steps[npc.id]||0)+1;
  return {ok:true,message:`Completed ${q.name}: +${q.coins} coins, +${q.xp} XP${q.item?' and '+RECIPES.find(r=>r.id===q.item).name:''}.`};
 }
 recordKill(c){for(const id of [c.kind,'kills-'+c.layer])this.proof[id]=(this.proof[id]||0)+1;if(c.kind==='bigfoot')this.proof.mountainBoss++;if(['reefShark','giantSquid','morayEel'].includes(c.kind))this.proof.seaPredators++;}
 recordChest(chest){if(this.claimedChests.has(chest.id))return;this.claimedChests.add(chest.id);this.proof.treasures++;if(chest.depth>=3)this.proof.deepTreasures++;}
}
export class FrontierNodes{
 constructor(zones=null){this.zones=zones;this.items=[];this.serial=0;
  const add=(data)=>this.items.push({id:'frontier-node-'+(++this.serial),active:true,readyAt:0,zoneId:data.layer==='ocean'?'ocean-harvest':'summit-harvest-'+MOUNTAINS.find(m=>Math.hypot((data.x-m.x)/m.rx,(data.y-m.y)/m.ry)<1)?.id,...data});
  for(const m of MOUNTAINS){for(let group=0;group<2;group++)for(let i=0;i<3;i++)add({kind:'marijuana',resource:'rawMarijuana',label:'Mountain Marijuana',x:m.x+(group?480:-480)+Math.cos(i*2.4+group*.7)*(i?80:55),y:m.y+250+group*160+Math.sin(i*2.4+group*.7)*65,layer:'surface'});
   if(m.boss==='steezus')for(let i=0;i<5;i++)add({kind:'sulfur',resource:'sulfur',label:'Sulfur Ore',x:m.x+Math.cos(i*2.399)*460,y:m.y+Math.sin(i*2.399)*340,layer:'surface'});
   for(let i=0;i<8;i++)add({kind:i%3===0?'crystal':'alpine',resource:i%3===0?'skyCrystal':i%3===1?'alpineFiber':'eagleFeather',label:i%3===0?'Sky Crystal':i%3===1?'Alpine Fiber':'Eagle Nest',x:m.x+Math.cos(i*2.4)*900,y:m.y+Math.sin(i*2.4)*650,layer:'surface'});
  }
  for(let i=0;i<36;i++){const y=13200+(i%12)*650,depth=1+Math.floor(i/12),x=coastline(y)+[220,820,1700][depth-1]+(i%3)*75;add({kind:'treasure',label:['Reef Cache','Sunken Chest','Deep Wreck Chest'][depth-1],x,y,depth,layer:'ocean'});}
  for(let i=0;i<110;i++){const y=1100+(i%80)*990,depth=1+i%3,x=coastline(y)+[220,1820,6700][depth-1]+Math.floor(i/80)*4200;add({kind:'treasure',label:depth===3?'Deep Wreck Chest':'Sunken Chest',x,y,depth,layer:'ocean'});}
  for(let i=0;i<60;i++){const y=12500+i*100,x=coastline(y)+130+(i%8)*220;add({kind:i%3?'coral':'pearl',resource:i%3?'coral':'pearl',label:i%3?'Coral Outcrop':'Pearl Shell',x,y,layer:'ocean'});}
  this.reconcileZones();
 }
 reconcileZones(){if(!this.zones)return;this.allItems??=this.items;this.items=this.allItems.filter(n=>{const z=this.zones.zones.find(z=>z.id===n.zoneId);return z?.allowedTypes.includes('frontier')&&z.contains(n.x,n.y)&&(z.resources.includes(n.resource||(n.kind==='treasure'?'sunkenRelic':null))||n.resource==='sulfur'&&z.id==='summit-harvest-cloudspine');});}
 update(now){for(const n of this.items)if(!n.active&&now>=n.readyAt&&n.kind!=='treasure')n.active=true;}
 visible(b,layer){return this.items.filter(n=>n.active&&n.layer===layer&&n.x>b.left-120&&n.x<b.right+120&&n.y>b.top-120&&n.y<b.bottom+120);}
 nearest(player,range=150){return this.items.filter(n=>n.active&&n.layer===player.layer&&Math.hypot(n.x-player.x,n.y-player.y)<range).sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0]||null;}
 collect(n,inventory,quests,now,rng=Math.random){if(!n.active)return {ok:false};if(n.kind==='sulfur'&&inventory.equippedTool?.type!=='pickaxe')return {ok:false,message:'Sulfur ore needs an equipped pickaxe.'};n.active=false;n.readyAt=now+300000;
  if(n.kind==='treasure'){inventory.add('pearl',n.depth+1);inventory.add('seaEssence',n.depth);if(n.depth===3)inventory.add('sunkenRelic',1);inventory.coins+=25*n.depth;quests.recordChest(n);return {ok:true,message:`${n.label}: pearls, sea essence${n.depth===3?', a sunken relic':''}, and ${25*n.depth} coins.`};}
  const roll=rng(),amount=n.kind==='marijuana'?(roll<.84?1:roll<.97?2:3):n.kind==='crystal'?1:2;inventory.add(n.resource,amount);if(n.kind==='marijuana')inventory.add('marijuanaSeeds',1);return {ok:true,message:`Picked up ${amount} ${n.label}.`};
 }
}
