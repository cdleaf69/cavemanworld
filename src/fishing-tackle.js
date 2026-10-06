export const BAITS=[
 {id:'worms',name:'Worms',amount:10,price:1,luck:1,strength:1,speed:1,color:'#c49884'},
 {id:'grub-bait',name:'Fat Grubs',amount:5,price:10,luck:1.35,strength:1.1,speed:1.15,color:'#d4d19d'},
 {id:'glow-bait',name:'Glow Larvae',amount:5,price:25,luck:1.75,strength:1.2,speed:1.3,color:'#9ae8b9'},
 {id:'royal-bait',name:'Royal Chum',amount:5,price:60,luck:2.3,strength:1.4,speed:1.5,color:'#efbc73'},
 {id:'abyss-bait',name:'Abyss Lure Bait',amount:3,price:90,luck:3,strength:1.65,speed:1.65,color:'#bb9eee'},
];
export const baitById=id=>BAITS.find(b=>b.id===id);
export const ROD_UPGRADES=[{coins:25,cost:{wood:6,sinew:2}},{coins:60,cost:{iron:4,sinew:4}},{coins:100,cost:{quartz:6,sinew:6}},{coins:160,cost:{moonstone:8,skyCrystal:2}},{coins:240,cost:{cobalt:10,skyCrystal:4}}];
export function rodStats(tool){
 const base=tool?.id==='abyss-rod'?{range:560,luck:1.5,strength:1.9,rank:6}:tool?.id==='reef-rod'?{range:420,luck:1.25,strength:1.45,rank:3}:{range:300,luck:1,strength:1,rank:0};
 const level=Math.max(0,Math.min(5,Math.floor(tool?.fishingUpgradeLevel||0)));
 return {range:base.range+level*80,luck:base.luck+level*.2,strength:base.strength+level*.35,rank:base.rank+Math.floor(level/2),level};
}
export const nextRodUpgrade=tool=>ROD_UPGRADES[rodStats(tool).level]||null;
export function upgradeFishingRod(inventory,id){
 const rod=inventory.owned.get(id);if(rod?.type!=='rod')return {ok:false,message:'Choose a fishing rod.'};
 const next=nextRodUpgrade(rod);if(!next)return {ok:false,message:'This rod is fully upgraded.'};
 if(inventory.coins<next.coins||Object.entries(next.cost).some(([r,n])=>(inventory.resources[r]||0)<n))return {ok:false,message:'Bring the coins and materials shown.'};
 inventory.coins-=next.coins;for(const [r,n]of Object.entries(next.cost))inventory.consume(r,n);
 rod.fishingUpgradeLevel=rodStats(rod).level+1;const s=rodStats(rod);
 return {ok:true,message:`Rod +${s.level}: ${s.range} cast range · ${s.luck.toFixed(2)}× luck · ${s.strength.toFixed(2)}× strength.`};
}
export function buyBait(inventory,id){const b=baitById(id);if(!b)return {ok:false,message:'Choose a bait.'};if(inventory.coins<b.price)return {ok:false,message:'Not enough coins.'};inventory.coins-=b.price;inventory.add(b.id,b.amount);return {ok:true,message:`Bought ${b.amount} ${b.name} for ${b.price} coins.`};}
export function selectBait(inventory,id){if(!baitById(id)||(inventory.resources[id]||0)<1)return {ok:false,message:'Buy some of this bait from Marlow first.'};inventory.fishingBait=id;return {ok:true,message:`Bait selected: ${baitById(id).name}.`};}
export function starterBait(inventory){if(inventory.fishermanStarterBait)return {ok:false,message:'You already received your starter worms.'};inventory.fishermanStarterBait=true;inventory.add('worms',10);return {ok:true,message:'Marlow gave you 10 starter worms. Extra worms cost 1 coin for 10.'};}
