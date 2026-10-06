import {baitImage} from './fishing-art.js';
import {BAITS,buyBait,selectBait,starterBait} from './fishing-tackle.js';
import {CROPS} from './gardening.js';
import {resourceName} from './item-index.js';
import {RECIPES,RESOURCES} from './crafting.js';
import {fishCount} from './fish-species.js';
import {FISHERMAN_QUESTS} from './expeditions.js';
import {altitudeAt} from './frontier-world.js';
const $=id=>document.getElementById(id);
export class FrontierUI{
 constructor({inventory,quests,npcs,player,diving,buffs,openModal,onChange,toast,storeUI}){Object.assign(this,{inventory,quests,npcs,player,diving,buffs,openModal,onChange,toast,storeUI});
  $('questNpc').replaceChildren();for(const n of npcs.items){const o=document.createElement('option');o.value=n.id;o.textContent=n.name+' · '+n.layer;$('questNpc').append(o);}
  $('questNpc').addEventListener('change',()=>this.renderQuest());$('claimQuest').addEventListener('click',()=>{const n=this.selectedNpc();if(Math.hypot(n.x-player.x,n.y-player.y)>180||n.layer!==player.layer)return;const result=quests.claim(n,inventory);$('questFeedback').textContent=result.message;onChange();this.renderQuest();});
  $('questsButton').addEventListener('click',()=>this.showJournal());
  $('machineResource').innerHTML=RESOURCES.map(id=>`<option value="${id}">${resourceName(id)}</option>`).join('');
  $('machineFuel').addEventListener('click',()=>{const ok=this.machine?.addFuel(inventory);toast(ok?(this.machine.kind==='plant-box'?'Watered the plot.':'Added fuel or bait.'):'Gather the water, fuel or bait listed below.');onChange();this.renderMachine();});
  $('machineInput').addEventListener('click',()=>{const ok=this.machine?.kind==='storage-chest'?this.machine.deposit(inventory,$('machineResource').value):this.machine?.addInput(inventory,$('machineResource').value);toast(ok?(this.machine.kind==='plant-box'?'Seed planted.':'Input added.'):'No suitable seed or input, or a crop is already growing.');onChange();this.renderMachine();});
  $('machineCollect').addEventListener('click',()=>{const n=this.machine?.collect(inventory)||0;toast(n?`Collected ${n} resources.`:'Nothing ready yet.');onChange();this.renderMachine();});
 }
 renderBaitShop(){
  const n=this.selectedNpc(),inv=this.inventory,visible=this.lockedNpc?.role==='fisherman',nearby=visible&&n.layer===this.player.layer&&Math.hypot(n.x-this.player.x,n.y-this.player.y)<180;
  $('fishermanShop').classList.toggle('hidden',!visible);if(!visible)return;
  const hash=JSON.stringify([nearby,inv.coins,inv.fishingBait,inv.fishermanStarterBait,...BAITS.map(b=>inv.resources[b.id])]);if(hash===this.baitShopHash)return;this.baitShopHash=hash;
  $('baitCoins').textContent=`${inv.coins} coins · One bait per cast. Bonuses multiply your rod stats.`;$('starterWorms').disabled=!nearby||inv.fishermanStarterBait;$('starterWorms').textContent=inv.fishermanStarterBait?'Starter worms collected':'Free starter pack · 10 worms';$('starterWorms').onclick=()=>{if(!this.baitTradeAllowed())return;const result=starterBait(inv);this.onChange();$('questFeedback').textContent=result.message;this.renderBaitShop();};
  $('baitStock').replaceChildren();for(const bait of BAITS){const card=document.createElement('div');card.className='bait-card';card.dataset.bait=bait.id;card.append(baitImage(bait));const detail=document.createElement('div'),title=document.createElement('strong'),line=document.createElement('p');title.textContent=`${bait.name} · ${inv.resources[bait.id]} carried`;line.textContent=`${bait.luck}× luck · ${bait.strength}× pull · ${bait.speed}× bite speed`;detail.append(title,line);card.append(detail);const buy=document.createElement('button');buy.textContent=`Buy ${bait.amount} · ${bait.price} coin${bait.price===1?'':'s'}`;buy.disabled=!nearby||inv.coins<bait.price;buy.onclick=()=>{if(!this.baitTradeAllowed())return;const result=buyBait(inv,bait.id);this.onChange();$('questFeedback').textContent=result.message;this.renderBaitShop();};const use=document.createElement('button');use.textContent=inv.fishingBait===bait.id?'Selected':'Use bait';use.disabled=inv.resources[bait.id]<1||inv.fishingBait===bait.id;use.onclick=()=>{const result=selectBait(inv,bait.id);this.onChange();$('questFeedback').textContent=result.message;this.renderBaitShop();};const actions=document.createElement('div');actions.className='bait-actions';actions.append(buy,use);card.append(actions);$('baitStock').append(card);}
 }
 baitTradeAllowed(){const n=this.lockedNpc;return n?.role==='fisherman'&&n.layer===this.player.layer&&Math.hypot(n.x-this.player.x,n.y-this.player.y)<180;}
 selectedNpc(){if(this.lockedNpc)return this.lockedNpc;return this.npcs.items.find(n=>n.id===$('questNpc').value)||this.npcs.items[0];}
 showJournal(npc=null){this.lockedNpc=npc;$('questNpc').disabled=!!npc;$('questNpc').closest('label').classList.toggle('hidden',!!npc);if(npc)$('questNpc').value=npc.id;this.openModal('questModal');$('questFeedback').textContent='';this.renderQuest();}
 renderQuest(){this.renderBaitShop();this.storeUI?.renderDarren(this.lockedNpc);const n=this.selectedNpc(),q=this.quests.task(n),inv=this.inventory;$('questTitle').textContent=n.name;
  $('questLocation').textContent=`${n.layer} · ${Math.round(n.x).toLocaleString()}, ${Math.round(n.y).toLocaleString()} · ${n.role==='fisherman'?`Quest ${Math.min(10,this.quests.fisherman+1)} / 10`:n.role==='darren'?'Repeatable trade · 7 marijuana → 500 coins':'Small errands and larger expeditions'}`;
  $('questName').textContent=q?.name||'Keeper of the Tides · completed';$('questHint').textContent=q?.hint||'Your Tidekeeper Armor is in your armor inventory. Equip it to breathe underwater.';
  $('fishermanTrials').classList.toggle('hidden',n.role!=='fisherman');$('fishermanDiveHint').classList.toggle('hidden',n.role!=='fisherman');
  $('questObjectives').replaceChildren();if(q?.marijuana){const li=document.createElement('li');li.textContent=`Fresh or dried marijuana: ${inv.resources.rawMarijuana+inv.resources.driedMarijuana} / ${q.marijuana} (hand in)`;$('questObjectives').append(li);}
  if(q){for(const [id,amount] of Object.entries(q.resources||{})){const li=document.createElement('li');li.textContent=`${resourceName(id)}: ${inv.resources[id]||0} / ${amount} (hand in)`;$('questObjectives').append(li);}
   if(q.fish){const li=document.createElement('li');li.textContent=`Fish rank ${q.minFish}+ (${q.minFish<=4?'shore':'offshore'}): ${fishCount(inv,q.minFish)} / ${q.fish} (hand in)`;$('questObjectives').append(li);}
   for(const [id,amount] of Object.entries(q.proof||{})){const li=document.createElement('li');li.textContent=`${({treasures:'Different ocean chests',deepTreasures:'Different deep wreck chests',reefCrab:'Reef crabs defeated',seaPredators:'Ocean predators defeated',mountainBoss:'Bigfoot defeated',boar:'Boars defeated'})[id]||id}: ${this.quests.proof[id]||0} / ${amount}`;$('questObjectives').append(li);}
   $('questReward').textContent=`Reward: ${q.coins} coins + ${q.xp} XP${q.item?' + '+RECIPES.find(r=>r.id===q.item).name:''}`;
  }else $('questReward').textContent='All ten fisherman quests completed.';
  const nearby=n.layer===this.player.layer&&Math.hypot(n.x-this.player.x,n.y-this.player.y)<180;$('claimQuest').disabled=!q||!nearby||!this.quests.ready(n,inv);$('claimQuest').textContent=nearby?'Complete quest':'Return to this NPC to complete';
  $('fishermanSteps').replaceChildren();for(const [i,task] of FISHERMAN_QUESTS.entries()){const li=document.createElement('li');li.textContent=`${i+1}. ${task.name}${i<this.quests.fisherman?' ✓':i===this.quests.fisherman?' · current':''}`;$('fishermanSteps').append(li);}
 }
 showMachine(machine){this.machine=machine;$('machineResource').replaceChildren();for(const item of (machine.kind==='plant-box'?CROPS.map(c=>({id:c.id,name:c.name+' · '+c.seconds+' sec'})):RESOURCES.map(id=>({id,name:resourceName(id)})))){const o=document.createElement('option');o.value=item.id;o.textContent=item.name;$('machineResource').append(o);}this.openModal('machineModal');this.renderMachine();}
 renderMachine(){const s=this.machine;if(!s)return;$('machineTitle').textContent=RECIPES.find(r=>r.id===s.kind)?.name||'Structure';
  $('machineStatus').textContent=`Fuel / bait: ${s.fuel} · Input: ${s.input} · ${s.interval?`${Math.floor(s.progress)} / ${s.interval} seconds`:'Storage'}`;
  $('machineOutput').textContent=Object.entries(s.storage).filter(([,n])=>n>0).map(([id,n])=>`${resourceName(id)} ${n}`).join(' · ')||'No stored output yet.';
  const kind=s.kind;if(kind==='plant-box')$('machineStatus').textContent=s.garden?.growing?`${s.garden.crop.name}: ${Math.floor(s.garden.progress)} / ${s.garden.crop.seconds} sec · Water ${s.fuel}${s.fuel?'':' · needs watering'}`:`${s.garden?.crop&&s.storage[s.garden.crop.id]>0?'Harvest ready':'Empty plot'} · stored water ${s.fuel}`;$('machineFuel').classList.toggle('hidden',!s.interval&&kind!=='plant-box');$('machineFuel').textContent=kind==='plant-box'?'Water (1 fresh water)':kind==='healing-totem'?'Add 1 essence':kind==='fish-trap'?'Add 1 leaf bait':'Add 1 wood';
  $('machineInput').classList.toggle('hidden',!['drying-shack','storage-chest','plant-box'].includes(kind));$('machineInput').textContent=kind==='plant-box'?'Plant selected seed':kind==='storage-chest'?'Store up to 10 selected resources':'Load 1 fresh marijuana';$('machineResource').classList.toggle('hidden',!['storage-chest','plant-box'].includes(kind));
  $('machineInput').disabled=kind==='plant-box'&&!!s.garden?.growing;$('machineHelp').textContent=RECIPES.find(r=>r.id===kind)?.detail+' Recover with the matching tool (wood: axe; stone and machines: pickaxe), three clicks. Queued and stored items are returned.';
 }
 update(now){if(!$('machineModal').classList.contains('hidden'))this.renderMachine();if(!$('questModal').classList.contains('hidden'))this.renderQuest();
  const underwater=this.player.layer==='ocean',altitude=this.player.layer==='surface'?altitudeAt(this.player.x,this.player.y):0,boost=this.buffs.active(now);
  $('breathBlock').classList.toggle('hidden',!underwater);$('altitudeStatus').classList.toggle('hidden',altitude<10);$('buffStatus').classList.toggle('hidden',!boost);
  $('expeditionCard').classList.toggle('inactive',!underwater&&altitude<10&&!boost);
  $('breathText').textContent=this.inventory.equippedGear?.id==='tidekeeper-armor'?'Water breathing':`${Math.ceil(this.diving.breath)} / ${this.diving.maxBreath} sec`;$('breathFill').style.width=`${100*this.diving.breath/this.diving.maxBreath}%`;
  $('altitudeStatus').textContent=`Altitude ${Math.round(altitude)} m · summit plateaus are buildable`;$('buffStatus').textContent=`+50% health / XP · ${Math.ceil((this.buffs.marijuanaUntil-now)/1000)} sec`;
 }
}
