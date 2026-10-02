import {RESOURCES,RECIPES} from './crafting.js';
import {MATERIALS} from './materials.js';
export const HOUSE_RESPAWN_MS=120000;
export function resourcePrice(id){const m=MATERIALS.find(m=>m.id===id);return m?[0,4,10,18,30][m.depth]:({sinew:6,fang:9,essence:20,iron:4,hide:3,bone:3,wing:4,shell:5,venom:5,glimmer:18,cookedMeat:4,cookedFish:4,meat:2,rawFish:2,wood:2}[id]||1);}
export function tradeResource(inventory,id,amount,buy){
 if(!RESOURCES.includes(id)||![1,5].includes(amount))return {ok:false,message:'Choose a resource and quantity.'};
 const price=resourcePrice(id)*(buy?2:1)*amount;
 if(buy){if(inventory.coins<price)return {ok:false,message:'Not enough coins.'};inventory.coins-=price;inventory.add(id,amount);}
 else {if(!inventory.consume(id,amount))return {ok:false,message:'You do not have enough to sell.'};inventory.coins+=price;}
 return {ok:true,message:`${buy?'Bought':'Sold'} ${amount} ${id} for ${price} coins.`};
}
export function clubQuality(club){
 if(club?.type!=='club')return {name:'No club',chances:[1,0,0],rank:0};
 const depth=MATERIALS.find(m=>m.id===club.tier)?.depth||0;
 const rank=depth?depth+2:club.tier==='iron'?2:club.tier==='stone'?1:0;
 return {rank,name:club.tier,chances:[[.9,.1,0],[.75,.23,.02],[.6,.35,.05],[.5,.4,.1],[.3,.5,.2],[.15,.45,.4],[.05,.3,.65]][rank]};
}
export function upgradeCost(item){return {coins:20*((item?.upgradeLevel||0)+1),resource:['leaf','wood'].includes(item?.tier)?'wood':item?.tier,amount:2+(item?.upgradeLevel||0)};}
export function upgradeTool(inventory,id,rng=Math.random){
 const item=inventory.owned.get(id),recipe=RECIPES.find(r=>r.id===id);
 if(!item||recipe?.category!=='tool')return {ok:false,message:'Choose a crafted tool.'};
 if(inventory.equippedTool?.type!=='club')return {ok:false,message:'Equip a club from your hotbar before using the forge.'};
 if((item.upgradeLevel||0)>=3)return {ok:false,message:'This tool already has three upgrades.'};
 const cost=upgradeCost(item);if(inventory.coins<cost.coins||inventory.resources[cost.resource]<cost.amount)return {ok:false,message:'Gather the coins and material shown.'};
 const quality=clubQuality(inventory.equippedTool);let roll=rng(),grade=0;for(let i=0;i<3;i++){roll-=quality.chances[i];if(roll<0){grade=i;break;}}
 inventory.coins-=cost.coins;inventory.consume(cost.resource,cost.amount);
 item.upgradeLevel=(item.upgradeLevel||0)+1;item.upgradeBonus=(item.upgradeBonus||0)+[.06,.14,.26][grade];item.upgradeQuality=['Rough','Fine','Masterwork'][grade];
 item.baseDamage??=item.damage;item.basePower??=item.power;item.baseYield??=item.yield;
 item.damage=Math.ceil(item.baseDamage*(1+item.upgradeBonus));item.power=Math.ceil(item.basePower*(1+item.upgradeBonus));item.yield=Math.ceil(item.baseYield*(1+item.upgradeBonus));
 return {ok:true,message:`${item.upgradeQuality} upgrade! +${Math.round(item.upgradeBonus*100)}% total strength · ${item.upgradeLevel}/3 upgrades.`};
}
export class HouseLoot {
 constructor(rng=Math.random){this.rng=rng;this.houses=new Map();}
 peek(id,now){let state=this.houses.get(id);if(!state||now>=state.readyAt&&state.collected){
  const loot={},common=['sticks','leaves','stone','wood','meat','rawFish','hide'];
  for(let i=0;i<3;i++){const r=common[Math.floor(this.rng()*common.length)];loot[r]=(loot[r]||0)+1+Math.floor(this.rng()*3);}
  const lucky=this.rng()<.12;if(lucky){const rare=['iron','copper','quartz','amber','glimmer'];loot[rare[Math.floor(this.rng()*rare.length)]]=1+Math.floor(this.rng()*2);}
  state={loot,coins:0,collected:false,readyAt:now};this.houses.set(id,state);
 }return state;}
 collect(id,now,inventory){const state=this.peek(id,now);if(state.collected)return {ok:false,message:`The chest refills in ${Math.ceil((state.readyAt-now)/1000)} seconds.`};
  for(const [r,n] of Object.entries(state.loot))inventory.add(r,n);state.collected=true;state.readyAt=now+HOUSE_RESPAWN_MS;
  return {ok:true,message:`Collected supplies. Sell them at a general shop. More loot in two minutes.`};}
}
