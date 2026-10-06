import {darrenOnly} from './underground-store-data.js';
import {BAITS,rodStats,nextRodUpgrade,upgradeFishingRod} from './fishing-tackle.js';
import {evolveBow,nextBowForm,bowForm,equipmentRecipe} from './bow-upgrades.js';
import {RESOURCES,RECIPES} from './crafting.js';
import {resourceName} from './item-index.js';
import {itemImage} from './item-art.js';
import {tradeResource,resourcePrice,clubQuality,upgradeCost,upgradeTool,HouseLoot} from './town-services.js';
const $=id=>document.getElementById(id);
export class TownUI{
 constructor({inventory,openModal,onChange}){this.inventory=inventory;this.openModal=openModal;this.onChange=onChange;this.houses=new HouseLoot();
  $('shopResource').innerHTML=RESOURCES.filter(id=>!darrenOnly(id)&&!BAITS.some(b=>b.id===id)).map(id=>`<option value="${id}">${resourceName(id)}</option>`).join('');
  $('shopResource').addEventListener('change',()=>this.render());
  for(const buy of [true,false])for(const amount of [1,5])$(`${buy?'buy':'sell'}${amount}`).addEventListener('click',()=>this.act(()=>tradeResource(inventory,$('shopResource').value,amount,buy)));
  $('collectHouseLoot').addEventListener('click',()=>this.act(()=>this.houses.collect(this.building.id,performance.now(),inventory)));
 }
 open(building){this.building=building;this.openModal();$('townTitle').textContent=building.name;$('townFeedback').textContent='';for(const type of ['shop','smith','house'])$(`${type}View`).classList.toggle('hidden',type!==building.type);this.render();}
 act(action){const result=action();this.onChange({kind:`town-${this.building.type}`,targetId:this.building.id,ok:result.ok});this.render();$('townFeedback').textContent=result.message;}
 render(){if(!this.building)return;const inv=this.inventory;$('townCoins').textContent=`${inv.coins} coins`;
  if(this.building.type==='shop'){const id=$('shopResource').value,price=resourcePrice(id);$('shopStock').textContent=`You carry ${inv.resources[id]} · Buy ${price*2} coins each · Sell ${price} coins each`;
   for(const n of [1,5]){$(`buy${n}`).disabled=inv.coins<price*2*n;$(`sell${n}`).disabled=inv.resources[id]<n;}
  }else if(this.building.type==='smith'){
   const quality=clubQuality(inv.equippedTool);$('forgeQuality').textContent=quality.rank===0&&inv.equippedTool?.type!=='club'?'Rods and bows upgrade with materials. For other tools, equip a club; rare clubs improve forge quality.':`${quality.name} club · Rough ${Math.round(quality.chances[0]*100)}% · Fine ${Math.round(quality.chances[1]*100)}% · Masterwork ${Math.round(quality.chances[2]*100)}%`;
   $('forgeTools').replaceChildren();
   const ammo=document.createElement('button');ammo.className='bag-action';ammo.textContent=`Buy 5 arrows · 10 coins (${inv.resources.arrows} carried)`;ammo.disabled=inv.coins<10;
   ammo.addEventListener('click',()=>this.act(()=>{if(inv.coins<10)return {ok:false,message:'Not enough coins.'};inv.coins-=10;inv.add('arrows',5);return {ok:true,message:'Bought five arrows.'};}));$('forgeTools').append(ammo);for(const [id,item] of inv.owned){const recipe=RECIPES.find(r=>r.id===id);if(recipe?.category!=='tool')continue;
    if(item.type==='rod'){
     const next=nextRodUpgrade(item),stats=rodStats(item),card=document.createElement('div');card.className='forge-card';card.dataset.rod=id;card.append(itemImage(equipmentRecipe(recipe,item)));const d=document.createElement('div');const title=document.createElement('strong');title.textContent=`${recipe.name} +${stats.level}/5`;const line=document.createElement('p');line.textContent=`${stats.range} range · ${stats.luck.toFixed(2)}× luck · ${stats.strength.toFixed(2)}× strength`;const price=document.createElement('small');price.textContent=next?`Next: +80 range / +0.20 luck / +0.35 strength · ${next.coins} coins + `+Object.entries(next.cost).map(([r,n])=>`${n} ${resourceName(r)}`).join(' · '):'Fully upgraded';d.append(title,line,price);card.append(d);const button=document.createElement('button');button.className='bag-action';button.textContent=next?'Upgrade rod':'Maxed';button.disabled=!next||inv.coins<next.coins||Object.entries(next.cost).some(([r,n])=>inv.resources[r]<n);button.addEventListener('click',()=>this.act(()=>upgradeFishingRod(inv,id)));card.append(button);$('forgeTools').append(card);continue;
    }
    if(item.type==='bow'){
     const next=nextBowForm(item),card=document.createElement('div');card.className='forge-card';card.append(itemImage(equipmentRecipe(recipe,item)));const d=document.createElement('div');const title=document.createElement('strong');title.textContent=bowForm(item).name;const line=document.createElement('p');line.textContent=next?`${item.damage} → ${next.damage} damage · next: ${next.name} · Lv ${next.level}`:'Final form';const price=document.createElement('small');price.textContent=next?Object.entries(next.cost).map(([r,n])=>`${n} ${resourceName(r)}`).join(' · '):'Fully evolved';d.append(title,line,price);card.append(d);const b=document.createElement('button');b.className='bag-action';b.textContent=next?'Evolve bow':'Maxed';b.disabled=!next||inv.progression.level<next.level||Object.entries(next.cost).some(([r,n])=>inv.resources[r]<n);b.addEventListener('click',()=>this.act(()=>evolveBow(inv,id)));card.append(b);$('forgeTools').append(card);continue;
    }
    const cost=upgradeCost(item),card=document.createElement('div');card.className='forge-card';card.append(itemImage(recipe));const detail=document.createElement('div');const title=document.createElement('strong');title.textContent=recipe.name;const line=document.createElement('p');line.textContent=`${item.damage} damage · ${item.upgradeLevel||0}/3 upgrades${item.upgradeQuality?' · '+item.upgradeQuality:''}`;const price=document.createElement('small');price.textContent=`${cost.coins} coins + ${cost.amount} ${resourceName(cost.resource)}`;detail.append(title,line,price);card.append(detail);const button=document.createElement('button');button.className='bag-action';button.textContent=(item.upgradeLevel||0)>=3?'Maxed':'Upgrade';button.disabled=(item.upgradeLevel||0)>=3||inv.equippedTool?.type!=='club'||inv.coins<cost.coins||inv.resources[cost.resource]<cost.amount;button.addEventListener('click',()=>this.act(()=>upgradeTool(inv,id)));card.append(button);$('forgeTools').append(card);
   }if(!$('forgeTools').children.length)$('forgeTools').textContent='Craft a tool, then bring it here.';
  }else {const state=this.houses.peek(this.building.id,performance.now());$('houseLoot').textContent=state.collected?'The chest is empty.':Object.entries(state.loot).map(([id,n])=>`${n} ${resourceName(id)}`).join(' · ');$('houseTimer').textContent=state.collected?`Refills in ${Math.max(0,Math.ceil((state.readyAt-performance.now())/1000))} seconds`:'Mostly everyday supplies, occasionally a lucky find.';$('collectHouseLoot').disabled=state.collected;}
 }
}
