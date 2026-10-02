import {resourceName} from './item-index.js';
import {RECIPES,RESOURCES} from './crafting.js';
import {fishCount} from './fish-species.js';
import {FISHERMAN_QUESTS} from './expeditions.js';
import {altitudeAt} from './frontier-world.js';
const $=id=>document.getElementById(id);
export class FrontierUI{
 constructor({inventory,quests,npcs,player,diving,buffs,openModal,onChange,toast}){Object.assign(this,{inventory,quests,npcs,player,diving,buffs,openModal,onChange,toast});
  $('questNpc').replaceChildren();for(const n of npcs.items){const o=document.createElement('option');o.value=n.id;o.textContent=n.name+' · '+n.layer;$('questNpc').append(o);}
  $('questNpc').addEventListener('change',()=>this.renderQuest());$('claimQuest').addEventListener('click',()=>{const n=this.selectedNpc();if(Math.hypot(n.x-player.x,n.y-player.y)>180||n.layer!==player.layer)return;const result=quests.claim(n,inventory);$('questFeedback').textContent=result.message;onChange();this.renderQuest();});
  $('questsButton').addEventListener('click',()=>this.showJournal());
  $('machineResource').innerHTML=RESOURCES.map(id=>`<option value="${id}">${resourceName(id)}</option>`).join('');
  $('machineFuel').addEventListener('click',()=>{const ok=this.machine?.addFuel(inventory);toast(ok?'Added fuel or bait.':'Gather the fuel or bait listed below.');onChange();this.renderMachine();});
  $('machineInput').addEventListener('click',()=>{const ok=this.machine?.kind==='storage-chest'?this.machine.deposit(inventory,$('machineResource').value):this.machine?.addInput(inventory);toast(ok?'Input added.':'No suitable input in your bag.');onChange();this.renderMachine();});
  $('machineCollect').addEventListener('click',()=>{const n=this.machine?.collect(inventory)||0;toast(n?`Collected ${n} resources.`:'Nothing ready yet.');onChange();this.renderMachine();});
 }
 selectedNpc(){return this.npcs.items.find(n=>n.id===$('questNpc').value)||this.npcs.items[0];}
 showJournal(npc=null){if(npc)$('questNpc').value=npc.id;this.openModal('questModal');$('questFeedback').textContent='';this.renderQuest();}
 renderQuest(){const n=this.selectedNpc(),q=this.quests.task(n),inv=this.inventory;$('questTitle').textContent=n.name;
  $('questLocation').textContent=`${n.layer} · ${Math.round(n.x).toLocaleString()}, ${Math.round(n.y).toLocaleString()} · ${n.role==='fisherman'?`Quest ${Math.min(10,this.quests.fisherman+1)} / 10`:'Small errands and larger expeditions'}`;
  $('questName').textContent=q?.name||'Keeper of the Tides · completed';$('questHint').textContent=q?.hint||'Your Tidekeeper Armor is in your armor inventory. Equip it to breathe underwater.';
  $('questObjectives').replaceChildren();
  if(q){for(const [id,amount] of Object.entries(q.resources||{})){const li=document.createElement('li');li.textContent=`${resourceName(id)}: ${inv.resources[id]||0} / ${amount} (hand in)`;$('questObjectives').append(li);}
   if(q.fish){const li=document.createElement('li');li.textContent=`Fish rank ${q.minFish}+ (${q.minFish<=4?'shore':'offshore'}): ${fishCount(inv,q.minFish)} / ${q.fish} (hand in)`;$('questObjectives').append(li);}
   for(const [id,amount] of Object.entries(q.proof||{})){const li=document.createElement('li');li.textContent=`${({treasures:'Different ocean chests',deepTreasures:'Different deep wreck chests',reefCrab:'Reef crabs defeated',seaPredators:'Ocean predators defeated',mountainBoss:'Bigfoot defeated',boar:'Boars defeated'})[id]||id}: ${this.quests.proof[id]||0} / ${amount}`;$('questObjectives').append(li);}
   $('questReward').textContent=`Reward: ${q.coins} coins + ${q.xp} XP${q.item?' + '+RECIPES.find(r=>r.id===q.item).name:''}`;
  }else $('questReward').textContent='All ten fisherman quests completed.';
  const nearby=n.layer===this.player.layer&&Math.hypot(n.x-this.player.x,n.y-this.player.y)<180;$('claimQuest').disabled=!q||!nearby||!this.quests.ready(n,inv);$('claimQuest').textContent=nearby?'Complete quest':'Return to this NPC to complete';
  $('fishermanSteps').replaceChildren();for(const [i,task] of FISHERMAN_QUESTS.entries()){const li=document.createElement('li');li.textContent=`${i+1}. ${task.name}${i<this.quests.fisherman?' ✓':i===this.quests.fisherman?' · current':''}`;$('fishermanSteps').append(li);}
 }
 showMachine(machine){this.machine=machine;this.openModal('machineModal');this.renderMachine();}
 renderMachine(){const s=this.machine;if(!s)return;$('machineTitle').textContent=RECIPES.find(r=>r.id===s.kind)?.name||'Structure';
  $('machineStatus').textContent=`Fuel / bait: ${s.fuel} · Input: ${s.input} · ${s.interval?`${Math.floor(s.progress)} / ${s.interval} seconds`:'Storage'}`;
  $('machineOutput').textContent=Object.entries(s.storage).filter(([,n])=>n>0).map(([id,n])=>`${resourceName(id)} ${n}`).join(' · ')||'No stored output yet.';
  const kind=s.kind;$('machineFuel').classList.toggle('hidden',!s.interval);$('machineFuel').textContent=kind==='healing-totem'?'Add 1 essence':kind==='fish-trap'?'Add 1 leaf bait':'Add 1 wood';
  $('machineInput').classList.toggle('hidden',!['drying-shack','storage-chest'].includes(kind));$('machineInput').textContent=kind==='storage-chest'?'Store up to 10 selected resources':'Load 1 fresh marijuana';$('machineResource').classList.toggle('hidden',kind!=='storage-chest');
  $('machineHelp').textContent=RECIPES.find(r=>r.id===kind)?.detail+' Recover with a pickaxe (three clicks). Queued and stored items are returned.';
 }
 update(now){if(!$('machineModal').classList.contains('hidden'))this.renderMachine();if(!$('questModal').classList.contains('hidden'))this.renderQuest();
  const underwater=this.player.layer==='ocean',altitude=this.player.layer==='surface'?altitudeAt(this.player.x,this.player.y):0,boost=this.buffs.active(now);
  $('breathBlock').classList.toggle('hidden',!underwater);$('altitudeStatus').classList.toggle('hidden',altitude<10);$('buffStatus').classList.toggle('hidden',!boost);
  $('expeditionCard').classList.toggle('inactive',!underwater&&altitude<10&&!boost);
  $('breathText').textContent=this.inventory.equippedGear?.id==='tidekeeper-armor'?'Water breathing':`${Math.ceil(this.diving.breath)} / ${this.diving.maxBreath} sec`;$('breathFill').style.width=`${100*this.diving.breath/this.diving.maxBreath}%`;
  $('altitudeStatus').textContent=`Altitude ${Math.round(altitude)} m · summit plateaus are buildable`;$('buffStatus').textContent=`+50% health / XP · ${Math.ceil((this.buffs.marijuanaUntil-now)/1000)} sec`;
 }
}
