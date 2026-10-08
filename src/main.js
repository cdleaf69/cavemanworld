import {grain} from './pixel-art.js';
import {StoreUI} from './store-ui.js';
import {STORE_LAYER,LOTTERY_SPOT,DARREN} from './underground-store-data.js';
import {resourceImage} from './resource-art.js';
import {levelGuide} from './level-guide.js';
import {CRAFT_CATEGORIES,craftingCategory} from './crafting-categories.js';
import {GameAudio} from './game-audio.js';
import {SteezusMusic} from './steezus-music.js';
import {BAITS,selectBait,rodStats} from './fishing-tackle.js';
import {slideStep} from './sliding-motion.js';
import {MapView} from './map-view.js';
import {CRAFTING_TABLES,availableRecipes,tableForTier,stationRequirement} from './crafting-stations.js';
import {caveDepth} from './cave-shapes.js';
import {bridgeAt,physicalWaterAt,updateBridgeContact,startBridgeJump,riverCurrent} from './river-travel.js';
import {loadWorldLayout} from './world-layout.js';
import {LanClient} from './lan-client.js';
import {GardenPlot} from './gardening.js';
import {CROPS} from './gardening.js';
import {mountainTravelFactor} from './frontier-world.js';
import {DivingSession,StatusEffects,QuestBook,NpcRegistry,FrontierNodes} from './expeditions.js';
import {FrontierUI} from './frontier-ui.js';
import {populateFrontierCreatures,summonEden} from './frontier-creatures.js';
import {FrontierStructure,structurePlacement,raftCanOccupy} from './frontier-structures.js';
import {TRANSPORT} from './frontier-items.js';
import {FISH_SPECIES,rodRank} from './fish-species.js';
import {MOUNTAINS,FISHERMAN,coastline,mountainAt,plateauAt,altitudeAt,elevationOffset,unprojectMountainPoint} from './frontier-world.js';
import {equipmentRecipe,bowForm} from './bow-upgrades.js';
import { grantBetaItem } from './beta.js';
import { LAYERS, LAYER_NAMES, portalDestination,portalDirection,randomSurfaceSpawn } from './world.js';
import { SURFACE, CAVES, DEEP_CAVES, PORTALS, DESCENTS, LAKES, PLAYER_RADIUS, canWalk, nearestPortal, nearbyPlace, biomeAt, lakeAt, waterAt, oceanDistance } from './world.js';
import { SpawnZoneManager, SPAWN_TYPES, RESOURCE_TYPES, BIOME_IDS } from './spawn-zones.js';
import { SpawnableRegistry } from './spawnables.js';
import { populateWorld,populateSpawnSupplies } from './spawner.js';
import { Inventory, RECIPES, RESOURCES } from './crafting.js';
import { PixelWorldRenderer as WorldRenderer } from './pixel-renderer.js';
import { worldBridge } from './network-hooks.js';
import { rangedWeaponOrigin } from './player-animation.js';
import { mouseLookOffset } from './camera.js';
import { movementVector, keyboardFacing, startJump, updateJump, CARDINAL_DIRECTIONS } from './controls.js';
import { CreatureRegistry, populateCreatures } from './creatures.js';
import { PlayerVitals, attackTarget, armorReduction } from './combat.js';
import { LootRegistry, ProjectileRegistry } from './combat-objects.js';
import { itemImage } from './item-art.js';
import { Hotbar } from './hotbar.js';
import { Campfire, StructureRegistry } from './structures.js';
import { FishingSession } from './fishing.js';
import { ARMOR_PERKS, armorEffects, perkPercent, scaledWeaponDamage, scaledHarvestTool } from './perks.js';
import { indexEntries, resourceName, visibleResources, oreLevel } from './item-index.js';
import { BUILDING_PORTALS,CASINO_BUILDING,casinoActivityAt } from './world.js';
import { CasinoUI } from './casino-ui.js';
import {TownUI} from './town-ui.js';
import {buildingForLayer,TOWN_BUILDINGS,INTERIOR_ACTIVITY} from './town-data.js';

const $ = id => document.getElementById(id);
function activate(element,handler){element.addEventListener('click',handler);}
const canvas=$('world');
const renderer=new WorldRenderer(canvas);
const zones=new SpawnZoneManager();
export const spawnables=new SpawnableRegistry();
export const loadingStats=await loadWorldLayout(zones,spawnables);
document.getElementById('worldLoading')?.remove();
const inventory=new Inventory();
const hotbar=new Hotbar(),structures=new StructureRegistry();
let openCampfire=null;
const creatures=new CreatureRegistry();populateCreatures(creatures);
const vitals=new PlayerVitals();
const drops=new LootRegistry(),projectiles=new ProjectileRegistry();
const fishing=new FishingSession();
export { worldBridge, zones };

// URL start points make distant transitions reproducible during local testing.
const params=new URLSearchParams(location.search);
const devMode=params.get('dev')==='1';
const startLayer=Object.keys(LAYERS).includes(params.get('layer'))?params.get('layer'):'surface';
const startPortal=[...PORTALS,...DESCENTS,...BUILDING_PORTALS].find(p=>p.id===params.get('start'));
const startLake=LAKES.find(l=>l.id===params.get('start'));
const startBridge=startLayer==='surface'&&params.get('start')==='mire-crossing'?{x:8200,y:7850}:null;
const requestedMountain=MOUNTAINS.find(m=>params.get('start')===m.id||params.get('start')===m.id+'-summit');
const frontierStart=startLayer==='ocean'?{x:coastline(14500)+220,y:14500}:params.get('start')==='fisherman'?{x:FISHERMAN.x-70,y:FISHERMAN.y+70}:requestedMountain?{x:requestedMountain.x,y:params.get('start').endsWith('-summit')?requestedMountain.y+650:requestedMountain.y+requestedMountain.ry+210}:null;
const initial=frontierStart||startPortal?.[startLayer]||(startLayer==='surface'&&startLake?{x:startLake.x+startLake.rx+85,y:startLake.y}:null)||startBridge||(startLayer==='surface'?randomSurfaceSpawn():null)||LAYERS[startLayer]?.spawn||(startLayer==='deep'?DEEP_CAVES.spawn:startLayer==='cave'?{x:3950,y:2700}:SURFACE.spawn);
const player={x:initial.x,y:initial.y,facing:Math.PI*1.5,moving:false,jumpHeight:0,jumpActive:false};
player.layer=startLayer;if(startLayer==='surface'&&!startPortal&&!startLake)populateSpawnSupplies(spawnables,player);
const diving=new DivingSession(),buffs=new StatusEffects(),quests=new QuestBook(),npcs=new NpcRegistry(),frontierNodes=new FrontierNodes(zones);
populateFrontierCreatures(creatures);
const musicBosses=creatures.creatures.filter(c=>c.kind==='steezus');
const lan=new LanClient();let lastStructureSync=0,lastSail=0;let remotePlayers=[],networkShots=[],lifeRevision=0;
function receiveStructure(data){
 let s=structures.items.get(data.id);const before=s?{x:s.x,y:s.y}:null;
 if(!s){s=data.kind==='campfire'?new Campfire(data.x,data.y,data.layer):new FrontierStructure(data.kind,data.x,data.y,data.layer,data.rotation,{inventory,spawnables,player,vitals,now:()=>performance.now()});s.id=data.id;structures.add(s);}
 const own=data.owner===lan.id,driving=s.driver===lan.id&&data.driver===lan.id;const {garden,...fields}=data;
 if(driving){delete fields.x;delete fields.y;}if(own){for(const k of ['fuel','input','progress','storage','rawMeat','cookedMeat','rawFish','cookedFish'])delete fields[k];}
 Object.assign(s,fields);if(data.kind==='campfire')delete s.kind;s.remote=!own;s.networked=true;if(s.kind==='reed-raft'&&!s.confirmed)s.confirmed={x:s.x,y:s.y};
 if(!own&&garden){s.garden=Object.assign(new GardenPlot(),garden);}
 if(before&&player.raftId===s.id&&s.driver!==lan.id){player.x+=s.x-before.x;player.y+=s.y-before.y;}
}
lan.addEventListener('snapshot',e=>{const ids=new Set(e.detail.structures.map(s=>s.id));for(const s of structures.items.values())if(s.networked&&!ids.has(s.id))structures.remove(s);for(const s of e.detail.structures)receiveStructure(s);});
lan.addEventListener('structure',e=>receiveStructure(e.detail));
lan.addEventListener('remove',e=>{const s=structures.items.get(e.detail.id);if(s){if(e.detail.actor===lan.id){if(s.kind)s.recover(inventory);else{inventory.structures.campfire=(inventory.structures.campfire||0)+1;if(s.fuel>=4)inventory.add('wood',Math.floor(s.fuel/4));for(const [field,id] of [['rawMeat','meat'],['cookedMeat','cookedMeat'],['rawFish','rawFish'],['cookedFish','cookedFish']])if(s[field])inventory.add(id,s[field]);}renderInventory();renderHotbar();showToast('Structure recovered');}structures.remove(s);if(player.raftId===s.id)player.raftId=null;if(frontierUI.machine?.id===s.id)setModal('machineModal',false);}});
lan.addEventListener('status',e=>{document.querySelector('.session').textContent=e.detail?'LAN CONNECTED · '+(lan.players.size+1)+' players':'LAN reconnecting…';});
lan.addEventListener('chat',e=>{worldBridge.receiveChat(e.detail);const log=$('lanChatLog');if(log){const line=document.createElement('div');line.textContent=e.detail.name+': '+e.detail.text;log.append(line);while(log.children.length>8)log.firstChild.remove();}});
lan.addEventListener('shots',e=>{networkShots=e.detail.filter(s=>s.source!==lan.id);});
lan.addEventListener('pvp',e=>{const hit=e.detail;if(hit.target===lan.id){lifeRevision=hit.lifeRevision;vitals.health=hit.health;vitals.maxHealth=hit.maxHealth;vitals.invulnerableUntil=performance.now()+400;updateHud();showToast(`${hit.sourceName} hit you · −${hit.damage} HP`,1200);if(hit.dead){lan.send({type:'respawn'}).then(result=>{lifeRevision=result.lifeRevision;resetAfterDefeat(performance.now(),result);showToast(`Defeated by ${hit.sourceName} · returned to town`,3500);}).catch(e=>showToast(e.message));}}else if(hit.source===lan.id)showToast(hit.dead?`Defeated ${hit.targetName}`:`${hit.targetName} · −${hit.damage} HP`,1000);});
async function sendCombat(action){if(!lan.ready)return;try{await syncPosition();await lan.send(action);}catch(e){showToast(e.message,900);}}
function resetAfterDefeat(now,position=null){vitals.respawn(now);diving.reset();player.grappleTarget=null;fishing.cancel();layer='surface';player.layer=layer;player.swimming=false;player.bridgeId=null;player.waterJump=false;player.jumpActive=false;player.jumpHeight=0;player.raftId=null;player.flightHeight=0;Object.assign(player,position?{x:position.x,y:position.y}:randomSurfaceSpawn());camera.lookX=0;camera.lookY=0;camera.x=player.x;camera.y=player.y;projectiles.clear();worldBridge.publishInteraction({kind:'respawn',x:player.x,y:player.y,layer});}
let lastPositionPayload='',lastPositionSent=0;
const machinePayloads=new Map();
function syncPosition(force=true){
 if(!lan.ready)return;
 const action={type:'position',x:player.x,y:player.y,layer:player.layer,facing:player.facing,moving:player.moving,tool:inventory.equippedTool?.id,gear:inventory.equippedGear?.id,flightHeight:player.flightHeight||0,jumpHeight:player.jumpHeight||0,swimming:player.swimming,underwater:player.underwater,vehicleId:player.vehicleId,name:lan.name,health:vitals.health,maxHealth:vitals.maxHealth,lifeRevision};
 const payload=JSON.stringify(action),now=performance.now();
 if(!force&&payload===lastPositionPayload&&now-lastPositionSent<1500)return;
 lastPositionPayload=payload;lastPositionSent=now;
 return lan.send(action).catch(()=>{if(lastPositionPayload===payload)lastPositionPayload='';});
}
function syncMachines(){
 if(!lan.ready)return;
 for(const id of machinePayloads.keys())if(!structures.items.has(id))machinePayloads.delete(id);
 for(const s of structures.items.values())if(s.owner===lan.id){
  const state={fuel:s.fuel,input:s.input,progress:s.progress,storage:s.storage,garden:s.garden,rawMeat:s.rawMeat,cookedMeat:s.cookedMeat,rawFish:s.rawFish,cookedFish:s.cookedFish},payload=JSON.stringify(state);
  if(machinePayloads.get(s.id)===payload)continue;
  machinePayloads.set(s.id,payload);
  lan.send({type:'state',id:s.id,state}).catch(()=>{if(machinePayloads.get(s.id)===payload)machinePayloads.delete(s.id);});
 }
}
async function boardRaft(s){try{await syncPosition();const result=await lan.send({type:'board',id:s.id});player.raftId=s.id;if(result.driver===lan.id){player.x=s.x;player.y=s.y-20;fishing.cancel();showToast('Driving raft · WASD to steer · E to stop and fish');}else showToast('Standing on deck · select a rod and click water to fish');}catch(e){showToast(e.message);}}
let structureRotation=0;
const camera={x:player.x,y:player.y,lookX:0,lookY:0};
let layer=startLayer,zoom=.68,targetZoom=.68,showZones=false,selectedZone=null,dragVertex=-1;
let lastFrame=performance.now(),lastHud=0,lastMap=0,lastPosition=0,lastTransition=0,lastPublishedFacing=player.facing;
let fpsFrames=0,fpsStart=performance.now();
let lastRespawn=0,targetNode=null,targetDrop=null,toastTimer=0;
let nextSwingAt=0;
let selectedInventoryItem=null;
let pointerInventoryDrag=null;
let lastDestinationWarm=0;
let inventoryDropClickUntil=0;
const keys=new Set();
const mouse={x:renderer.width/2,y:renderer.height/2};
const casinoUI=new CasinoUI({inventory,openModal:()=>setModal('casinoModal',true),onInteraction:detail=>worldBridge.publishInteraction({...detail,x:player.x,y:player.y,layer})});
const townUI=new TownUI({inventory,openModal:()=>setModal('townModal',true),onChange:detail=>{renderInventory();renderCrafting();renderHotbar();updateHud();worldBridge.publishInteraction({...detail,x:player.x,y:player.y,layer});}});
export const gameAudio=new GameAudio();
const steezusMusic=new SteezusMusic();
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>{steezusMusic.unlock();gameAudio.unlock();},{capture:true});
const storeUI=new StoreUI({inventory,player,openModal:id=>setModal(id,true),onChange:()=>{renderInventory();renderCrafting();renderHotbar();updateHud();}});
const frontierUI=new FrontierUI({inventory,quests,npcs,player,diving,buffs,storeUI,openModal:id=>setModal(id,true),onChange:()=>{renderInventory();renderCrafting();renderHotbar();updateHud();},toast:showToast});
function interiorActivity(){const b=buildingForLayer(layer),spot=b?.type==='convenience'?LOTTERY_SPOT:INTERIOR_ACTIVITY;return b&&b.type!=='casino'&&Math.hypot(player.x-spot.x,player.y-spot.y)<180;}

const TUTORIAL_DISMISSED='embervale-quick-start-dismissed';
function saveTutorialDismissal(){try{localStorage.setItem(TUTORIAL_DISMISSED,'1');}catch{} }
function showQuickStart(){let dismissed=false;try{dismissed=localStorage.getItem(TUTORIAL_DISMISSED)==='1';}catch{}if(!dismissed){setModal('tutorialModal',true);$('tutorialClose').focus({preventScroll:true});}}
window.addEventListener('storage',event=>{if(event.key===TUTORIAL_DISMISSED&&event.newValue==='1')$('tutorialModal').classList.add('hidden');});
function setModal(id,open){if(open)gameAudio.talk(id==='questModal'?frontierUI.lockedNpc:(id==='townModal'||id==='casinoModal')?{id}:null);else if(['questModal','townModal','casinoModal'].includes(id))gameAudio.talk(null);if((id==='tutorialModal'&&!open)||(open&&id!=='tutorialModal'&&!$('tutorialModal').classList.contains('hidden')))saveTutorialDismissal();if(open)document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));$(id).classList.toggle('hidden',!open);if(id==='mapModal'&&open){mapView.reset();drawFullMap();}if(id==='craftModal'&&open){setCraftTab('craft');renderCrafting();}if(id==='inventoryModal'&&open)renderInventory();}
const modalElements=document.getElementsByClassName('modal');
function modalOpen(){for(let i=0;i<modalElements.length;i++)if(!modalElements[i].classList.contains('hidden'))return true;return !!document.getElementById('inventoryItemInfo')?.open;}
function setZoneOverlay(open){showZones=open;$('zonePanel').classList.toggle('hidden',!open);$('zonesButton').classList.toggle('active',open);if(!open){dragVertex=-1;selectedZone=null;}refreshZonePanel();renderer.drawOverview($('minimap'),layer,player,zones,showZones);drawFullMap();}
function showToast(message,duration=2800){$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),duration);}
const hudIds=['locationCard','healthCard','minimapCard','pouchCard','hotbar','toolbar','expeditionCard','questsButton'];
let hudVisible={};
try{hudVisible=JSON.parse(localStorage.getItem('embervale-hud')||'{}')||{};}catch{hudVisible={};}
function setHud(id,visible){hudVisible[id]=visible;$(id).classList.toggle('hidden',!visible);const input=document.querySelector(`[data-hud="${id}"]`);if(input)input.checked=visible;localStorage.setItem('embervale-hud',JSON.stringify(hudVisible));}
for(const id of hudIds)setHud(id,hudVisible[id]!==false);
function eatFood(resource='cookedMeat'){
  if(!['cookedMeat','cookedFish','driedMarijuana',...CROPS.filter(c=>c.heal).map(c=>c.id)].includes(resource)){showToast('This is a material, not food. See its inventory Info for uses.');return;}
  if(resource==='driedMarijuana'){if(!buffs.use(inventory,performance.now())){showToast('Dry fresh marijuana in a drying shack first');return;}currentEffects();renderInventory();renderHotbar();updateHud();frontierUI.update(performance.now());showToast('+50% health and XP for 60 seconds');return;}
  if(vitals.health>=vitals.maxHealth){showToast('Health is already full');return;}
  if(!inventory.consume(resource,1)){showToast('Cook food over a fueled campfire first');return;}
  const healed=vitals.heal(CROPS.find(c=>c.id===resource)?.heal||(resource==='cookedFish'?30:40));
  showToast(`Ate ${resourceName(resource)} · +${healed} health`);
  renderInventory();renderHotbar();updateHud();worldBridge.publishInteraction({kind:'eat-cooked-food',resource,x:player.x,y:player.y,layer});
}
function eatMeat(){eatFood(inventory.resources.cookedMeat>0?'cookedMeat':'cookedFish');}
function currentEffects(){const effect=buffs.apply(inventory,armorEffects(inventory),performance.now());vitals.setMaxHealth(100*effect.stats.health);return effect;}
function attack(aimFacing=player.facing){
  const now=performance.now();if(modalOpen()||now<nextSwingAt)return;
  nextSwingAt=now+(inventory.equippedTool?.cooldown||420);player.swingUntil=now+250;void sendCombat({type:'strike',angle:aimFacing});
  const target=attackTarget(creatures.nearby(player.x,player.y,layer,(inventory.equippedTool?.range||120)+50),{...player,facing:aimFacing},inventory.equippedTool?.range||120);
  if(!target)return;
  const damage=scaledWeaponDamage(inventory.equippedTool,currentEffects().stats.power),result=target.hit(damage,now);
  if(!result.ok)return;
  rewardHit(target,result,damage,now);
  if(!result.dead){const shove=inventory.equippedTool?.knockback||0,x=target.x+Math.cos(aimFacing)*shove,y=target.y+Math.sin(aimFacing)*shove;if(canWalk(x,y,layer,target.radius)&&!structures.blocks(x,y,layer,target.radius)){target.x=x;target.y=y;}}
}
function rewardHit(target,result,damage,now){
  if(!result.ok)return;
  if(result.dead){quests.recordKill(target);inventory.progression.gain(caveDepth(layer)?25+(caveDepth(layer)-1)*20:25);drops.spawn(result.loot,target.x,target.y,layer,now);showToast(`${target.name} defeated · loot dropped nearby (E)`);}
  else showToast(`${target.name} · ${target.health}/${target.maxHealth} health`,850);
  worldBridge.publishInteraction({kind:'attack-creature',targetId:target.id,damage,x:player.x,y:player.y,layer});
}
function shoot(point){
 const now=performance.now(),tool=inventory.equippedTool;
 if(now<nextSwingAt||(player.swimming&&!player.underwater))return;
 const ammo=tool.type==='bow'?'arrows':'stone';
 if(!inventory.consume(ammo,1)){showToast(tool.type==='bow'?'Buy arrows from a blacksmith first':'Pick up stones for slingshot ammunition');return;}
 nextSwingAt=now+(tool.type==='bow'?bowForm(tool).cooldown:420);player.swingUntil=now+250;
 const origin=rangedWeaponOrigin(player,now,tool.type);origin.y-=player.flightHeight||0;void sendCombat({type:'fire',x:origin.x,y:origin.y,angle:Math.atan2(point.y-origin.y,point.x-origin.x)});
 projectiles.shoot({...origin,point,damage:scaledWeaponDamage(tool,currentEffects().stats.power),layer,type:tool.type},now);
 renderInventory();renderHotbar();worldBridge.publishInteraction({kind:'fire-projectile',type:tool.type,x:origin.x,y:origin.y,targetX:point.x,targetY:point.y,layer});
}
function gather(node){
  if(!node||Math.hypot(node.x-player.x,node.y-player.y)>node.radius+145){showToast('Move closer to gather');return;}
  const effectiveTool=scaledHarvestTool(inventory.equippedTool,currentEffects().stats.power);
  const result=node.take(performance.now(),effectiveTool);
  if(!result.ok){if(!result.cooldown)showToast(result.message);return;}
  player.swingUntil=performance.now()+250;
  if(result.progress)showToast(`${node.label}: ${result.remaining} strength left · click again`,1000);
  else {inventory.progression.gain(node.kind==='ore'?14:6);for(const [resource,amount] of Object.entries(result.loot))inventory.add(resource,amount);showToast(Object.entries(result.loot).map(([r,n])=>`+${n} ${r}`).join(' · '));}
  renderInventory();renderCrafting();updateHud();
  worldBridge.publishInteraction({kind:'gather',targetId:node.id,x:player.x,y:player.y,layer});
}
function renderHotbar(){
  hotbar.removeDepleted(inventory);
  const host=$('hotbar');host.replaceChildren();
  hotbar.slots.forEach((slot,index)=>{
    const button=document.createElement('button');button.className=`hotbar-slot ${index===hotbar.selected?'selected':''}`;button.type='button';
    const number=document.createElement('span');number.className='hotbar-number';number.textContent=String(index+1);button.append(number);
    if(slot){const recipe=equipmentRecipe(RECIPES.find(r=>r.id===slot.id),inventory.owned.get(slot.id));button.append(slot.kind==='resource'||!recipe?resourceImage(slot.id,resourceName(slot.id)):itemImage(recipe));const label=document.createElement('small');label.textContent=recipe?.name||resourceName(slot.id);button.append(label);if(slot.kind==='structure'||slot.kind==='resource'){const count=document.createElement('b');count.textContent=slot.amount??(slot.kind==='structure'?inventory.structures[slot.id]:inventory.resources[slot.id]);button.append(count);}}
    activate(button,()=>{if(index===hotbar.selected&&['cookedMeat','cookedFish','driedMarijuana',...CROPS.filter(c=>c.heal).map(c=>c.id)].includes(slot?.id))eatFood(slot.id);else selectHotbar(index);});host.append(button);
  });
  renderInventoryHotbar();
}
function selectHotbar(index){
  if(!hotbar.select(index))return;
  const slot=hotbar.current;
  if(slot?.kind==='equipment'&&hotbar.allowed(slot,inventory))inventory.equip(slot.id);
  else inventory.equippedTool=null;
  currentEffects();
  renderHotbar();renderInventory();
}
function inventoryDragSource(element,slot){
  element.draggable=true;
  element.querySelectorAll('img').forEach(img=>img.draggable=false);
  element.addEventListener('pointerdown',event=>{const image=event.target.closest('img');if(image)image.draggable=false;if(event.target.closest('button')!==element&&event.target.closest('button'))return;if(event.button===0)pointerInventoryDrag={slot,x:event.clientX,y:event.clientY,handled:false};});
  element.addEventListener('dragstart',event=>{
    if(!pointerInventoryDrag)pointerInventoryDrag={slot,x:event.clientX,y:event.clientY,handled:false};
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',JSON.stringify(slot));
    pointerInventoryDrag.native=true;
    element.classList.add('dragging');
  });
  element.addEventListener('dragend',event=>{
    element.classList.remove('dragging');
    finishInventoryDrag(pointerInventoryDrag,event.clientX,event.clientY);
    pointerInventoryDrag=null;
    document.querySelectorAll('.drop-target').forEach(cell=>cell.classList.remove('drop-target'));
  });
}
function finishInventoryDrag(pending,x,y){
  if(!pending||pending.handled||Math.hypot(x-pending.x,y-pending.y)<12)return;
  const target=document.elementFromPoint(x,y)?.closest('.inventory-hotbar-slot');
  if(target&&$('inventoryModal').contains(target)){
    pending.handled=true;
    putInventoryItem(Number(target.dataset.slot),pending.slot,pending.slot.fromIndex??null);
  }
}
window.addEventListener('pointerup',event=>{
  const pending=pointerInventoryDrag;
  if(!pending?.native){finishInventoryDrag(pending,event.clientX,event.clientY);if(pointerInventoryDrag===pending)pointerInventoryDrag=null;}
});
window.addEventListener('pointercancel',()=>{if(!pointerInventoryDrag?.native)pointerInventoryDrag=null;});
function chooseInventoryItem(slot){selectedInventoryItem=slot;renderInventory();}
function putInventoryItem(index,slot,fromIndex=null){
  if(!hotbar.place(index,slot,inventory,fromIndex))return;
  selectedInventoryItem=null;
  inventoryDropClickUntil=performance.now()+150;
  selectHotbar(index);
}
function renderInventoryHotbar(){
  const host=$('inventoryHotbar');if(!host)return;
  hotbar.removeDepleted(inventory);host.replaceChildren();
  hotbar.slots.forEach((slot,index)=>{
    const cell=document.createElement('div'),number=document.createElement('span'),label=document.createElement('small');
    cell.className=`inventory-hotbar-slot ${index===hotbar.selected?'selected':''}`;
    cell.dataset.slot=String(index);
    cell.tabIndex=0;cell.setAttribute('role','button');cell.setAttribute('aria-label',`Hotbar slot ${index+1}${slot?`: ${slot.kind==='resource'?resourceName(slot.id):itemName(slot.id)}`:': empty'}`);
    number.className='hotbar-number';number.textContent=String(index+1);cell.append(number);
    if(slot){const recipe=equipmentRecipe(RECIPES.find(r=>r.id===slot.id),inventory.owned.get(slot.id));cell.append(slot.kind==='resource'||!recipe?resourceImage(slot.id,resourceName(slot.id)):itemImage(recipe));label.textContent=recipe?.name||resourceName(slot.id);cell.append(label);
      inventoryDragSource(cell,{kind:slot.kind,id:slot.id,fromIndex:index});
      const clear=document.createElement('button');clear.type='button';clear.className='inventory-slot-clear';clear.textContent='×';clear.setAttribute('aria-label',`Clear hotbar slot ${index+1}`);
      clear.addEventListener('click',event=>{event.stopPropagation();hotbar.clear(index);selectHotbar(hotbar.selected);});cell.append(clear);
    }
    cell.addEventListener('dragover',event=>{event.preventDefault();cell.classList.add('drop-target');});
    cell.addEventListener('dragleave',()=>cell.classList.remove('drop-target'));
    cell.addEventListener('drop',event=>{
      event.preventDefault();cell.classList.remove('drop-target');
      try{const dragged=JSON.parse(event.dataTransfer.getData('text/plain'));if(pointerInventoryDrag)pointerInventoryDrag.handled=true;putInventoryItem(index,dragged,dragged.fromIndex??null);}catch{}
    });
    cell.addEventListener('click',()=>{if(performance.now()<inventoryDropClickUntil)return;if(selectedInventoryItem)putInventoryItem(index,selectedInventoryItem,selectedInventoryItem.fromIndex??null);else selectHotbar(index);});
    cell.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();cell.click();}});
    host.append(cell);
  });
}
function openFire(fire){if(fire.tableTier){setModal('craftModal',true);return;}if(fire.kind==='reed-raft'){boardRaft(fire);return;}if(fire.remote&&fire.kind!=='wood-gate'){showToast('This machine belongs to another player');return;}if(fire.kind==='wood-gate'){lan.send({type:'gate',id:fire.id}).catch(e=>showToast(e.message));return;}if(fire.kind){frontierUI.showMachine(fire);return;}openCampfire=fire;setModal('campfireModal',true);renderCampfire();}
function renderCampfire(){
  if(!openCampfire)return;
  $('campfireFuel').textContent=`${openCampfire.fuel} cook cycles`;
  $('campfireRaw').textContent=openCampfire.rawMeat;
  $('campfireCooked').textContent=openCampfire.cookedMeat;
  $('campfireRawFish').textContent=openCampfire.rawFish;
  $('campfireCookedFish').textContent=openCampfire.cookedFish;
  $('campfireProgress').textContent=openCampfire.fuel&&(openCampfire.rawMeat||openCampfire.rawFish)?`${Math.floor(openCampfire.progress/4*100)}%`:'Idle';
  $('addFuelButton').disabled=inventory.resources.wood<1;
  $('addRawButton').disabled=inventory.resources.meat<1;
  $('collectCookedButton').disabled=openCampfire.cookedMeat<1;
  $('addFishButton').disabled=inventory.resources.rawFish<1&&!FISH_SPECIES.some(f=>inventory.resources[f.id]>0);
  $('collectFishButton').disabled=openCampfire.cookedFish<1;
}
async function mineCampfire(fire){
 if(Math.hypot(fire.x-player.x,fire.y-player.y)>fire.radius+145){showToast('Move closer');return;}
 try{syncMachines();await syncPosition();const result=await lan.send({type:'mine',id:fire.id,tool:inventory.equippedTool?.id});player.swingUntil=performance.now()+250;if(!result.removed)showToast(`${result.remaining} hits remaining`,900);}catch(e){showToast(e.message);}
}
async function placeCampfire(point){await placeShared(point,'campfire');}
async function placeShared(point,kind){
 if(!(inventory.structures[kind]>0)||Math.hypot(point.x-player.x,point.y-player.y)>240){showToast('Select a kit and place it within reach');return;}
 if(placeShared.pending)return;placeShared.pending=true;
 try{await syncPosition();const result=await lan.send({type:'place',kind,x:point.x,y:point.y,layer,rotation:kind==='reed-raft'||CRAFTING_TABLES.some(t=>t.id===kind)?0:structureRotation});inventory.structures[kind]--;receiveStructure(result.structure);renderInventory();renderHotbar();showToast(kind==='reed-raft'?'Raft placed · E at the marked driver seat':'Structure placed · E to interact');}catch(e){showToast(e.message);}finally{placeShared.pending=false;}
}
function collectFrontier(node){if(!node||Math.hypot(node.x-player.x,node.y-player.y)>150){showToast('Move closer');return;}const result=frontierNodes.collect(node,inventory,quests,performance.now());if(!result.ok&&result.message)showToast(result.message);if(result.ok){inventory.progression.gain(node.kind==='treasure'?20:6);showToast(result.message);renderInventory();renderCrafting();renderHotbar();updateHud();worldBridge.publishInteraction({kind:'collect-frontier',targetId:node.id,x:player.x,y:player.y,layer});}}
function placeFrontier(point,kind){
 if(['wood-floor','wood-roof','wood-wall','stone-wall','wood-gate'].includes(kind))point={x:Math.round(point.x/128)*128,y:Math.round(point.y/128)*128};
 if(kind!=='campfire'){const valid=structurePlacement(kind,point,layer,structures);if(!valid.ok){showToast(valid.message);return;}}
 placeShared(point,kind);
}
function toggleDive(){
 if(layer!=='ocean'&&!diving.canDive(player)){showToast('Enter ocean water, then press V to dive');return;}
 layer=layer==='ocean'?'surface':'ocean';player.layer=layer;player.underwater=layer==='ocean';player.vehicle=null;player.flightHeight=0;player.raftId=null;player.grappleTarget=null;player.jumpActive=false;player.jumpHeight=0;fishing.cancel();projectiles.clear();camera.y=player.y;worldBridge.publishPosition({x:player.x,y:player.y,layer,facing:player.facing});worldBridge.publishInteraction({kind:layer==='ocean'?'dive':'surface',x:player.x,y:player.y,layer});showToast(layer==='ocean'?'Ocean floor · watch your breath · V to surface':'Surfaced · breath recovering');updateHud();drawFullMap();
}
function interact(){
  if(fishing.active){finishFishing();return;}
  const raft=structures.items.get(player.raftId)||[...structures.items.values()].find(s=>s.kind==='reed-raft'&&s.layer===layer&&Math.hypot(player.x-s.x,player.y-s.y+20)<120);if(raft){boardRaft(raft);return;}
  if(fishing.active){finishFishing();return;}
  const drop=drops.nearest(player.x,player.y,layer,performance.now());
  if(drop){drops.collect(drop);inventory.add(drop.resource,drop.amount);showToast(`Picked up ${drop.amount} ${drop.resource}`);renderInventory();renderCrafting();updateHud();worldBridge.publishInteraction({kind:'pickup-loot',targetId:drop.id,resource:drop.resource,amount:drop.amount,x:player.x,y:player.y,layer});return;}
  const portal=nearestPortal(player.x,player.y,layer);
  if(portal){transition();return;}
  const npc=npcs.nearest(player);if(npc){frontierUI.showJournal(npc);return;}
  const special=frontierNodes.nearest(player);if(special){collectFrontier(special);return;}
  const building=buildingForLayer(layer);
  if(building){if(building.type==='convenience'){storeUI.showLottery();return;}if(building.type==='casino'){const activity=casinoActivityAt(player.x,player.y);if(activity)casinoUI.open(activity.id,building.name);}else if(interiorActivity())townUI.open(building);return;}
  const fire=structures.nearest(player.x,player.y,layer);
  if(fire){if(fire.tableTier){setModal('craftModal',true);return;}openFire(fire);return;}
  const node=spawnables.nearest(player.x,player.y,layer);
  if(node&&['ground','bush'].includes(node.kind))gather(node);
}
function transition(p=nearestPortal(player.x,player.y,layer),instant=false){
  if(!p||(!instant&&performance.now()-lastTransition<600))return;
  const from=layer;
  fishing.cancel();
  layer=portalDestination(p,layer);
  projectiles.clear();
  player.layer=layer;player.underwater=false;player.grappleTarget=null;player.vehicle=null;player.flightHeight=0;player.raftId=null;player.swimming=false;player.bridgeId=null;player.waterJump=false;player.jumpActive=false;player.jumpHeight=0;const dest=p[layer];player.x=dest.x;player.y=dest.y;camera.x=player.x+camera.lookX;camera.y=player.y+camera.lookY;
  warmNextDestination();lastTransition=performance.now();selectedZone=null;refreshZonePanel();drawFullMap();renderer.drawOverview($('minimap'),layer,player,zones,showZones);
  worldBridge.publishInteraction({kind:buildingForLayer(layer)?'enter-building':buildingForLayer(from)?'exit-building':from==='surface'?'enter-cave':layer==='surface'?'exit-cave':Object.keys(LAYERS).indexOf(layer)>Object.keys(LAYERS).indexOf(from)?'descend-cave':'ascend-cave',targetId:p.id,x:player.x,y:player.y,layer});
}
function handleKey(event,down){
  if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;
  const key=/^(Digit|Numpad)[1-7]$/.test(event.code)?event.code.slice(-1):event.key.toLowerCase();
  if([' ','+','-','='].includes(key)||key==='f3'||CARDINAL_DIRECTIONS[key]||/^[1-7]$/.test(key))event.preventDefault();
  if(down){
    if(keys.has(key))return;
    if(CARDINAL_DIRECTIONS[key]||key==='shift'||key==='alt')keys.add(key);
    if(CARDINAL_DIRECTIONS[key]&&!modalOpen())player.facing=keyboardFacing(keys,player.facing);
    if(key==='e'&&!modalOpen()&&(!fishing.active||!event.repeat))interact();
    if(key===' '&&!event.repeat&&!modalOpen())startBridgeJump(player,startJump);
    if(key==='h'&&!modalOpen())eatMeat();
    if(key==='v'&&!modalOpen())toggleDive();
    if(key==='j'){if(!$('questModal').classList.contains('hidden'))setModal('questModal',false);else frontierUI.showJournal();}
    if(key==='r'&&!modalOpen()){structureRotation=structureRotation?0:Math.PI/2;showToast('Building orientation: '+(structureRotation?'vertical':'horizontal'));}
    if(/^[1-6]$/.test(key)&&!modalOpen())selectHotbar(Number(key)-1);
    if(key==='7'&&!event.repeat){renderBeta();setModal('betaModal',$('betaModal').classList.contains('hidden'));}
    if(key==='c')setModal('craftModal',$('craftModal').classList.contains('hidden'));
    if(key==='i')setModal('inventoryModal',$('inventoryModal').classList.contains('hidden'));
    if(key==='p')setHud('pouchCard',hudVisible.pouchCard===false);
    if(key==='o')setModal('settingsModal',$('settingsModal').classList.contains('hidden'));
    if(key==='m')setModal('mapModal',$('mapModal').classList.contains('hidden'));
    if(key==='f3')setZoneOverlay(!showZones);
    if(key==='escape'){gameAudio.talk(null);if(!$('tutorialModal').classList.contains('hidden'))saveTutorialDismissal();document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));}
    if(key==='+'||key==='=')targetZoom=Math.min(1.7,targetZoom*1.18);
    if(key==='-')targetZoom=Math.max(.32,targetZoom/1.18);
  } else keys.delete(key);
}
window.addEventListener('keydown',e=>handleKey(e,true));
window.addEventListener('keyup',e=>handleKey(e,false));
window.addEventListener('blur',()=>keys.clear());
window.addEventListener('pointermove',event=>{const rect=canvas.getBoundingClientRect();mouse.x=event.clientX-rect.left;mouse.y=event.clientY-rect.top;});
window.addEventListener('wheel',e=>{if(modalOpen())return;e.preventDefault();targetZoom=Math.max(.32,Math.min(1.7,targetZoom*(e.deltaY>0?.9:1.1)));},{passive:false});
window.addEventListener('resize',()=>{renderer.resize();drawFullMap();});

const mapView=new MapView(),mapCanvas=$('fullMap');let mapDrag=null;
const mapWorld=()=>LAYERS[layer]||{width:1100,height:850};
const mapPoint=event=>{const r=mapCanvas.getBoundingClientRect();return {x:(event.clientX-r.left)*mapCanvas.width/r.width,y:(event.clientY-r.top)*mapCanvas.height/r.height};};
mapCanvas.addEventListener('wheel',event=>{event.preventDefault();event.stopPropagation();const p=mapPoint(event),unit=event.deltaMode===1?16:event.deltaMode===2?mapCanvas.height:1;mapView.zoomAt(p.x,p.y,Math.exp(-Math.max(-350,Math.min(350,event.deltaY*unit))*.002),mapCanvas,mapWorld());drawFullMap();},{passive:false});
mapCanvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;event.preventDefault();mapDrag={id:event.pointerId,...mapPoint(event)};mapCanvas.setPointerCapture(event.pointerId);mapCanvas.classList.add('panning');});
mapCanvas.addEventListener('pointermove',event=>{if(mapDrag?.id!==event.pointerId)return;const p=mapPoint(event);mapView.pan(p.x-mapDrag.x,p.y-mapDrag.y,mapCanvas,mapWorld());mapDrag={id:event.pointerId,...p};drawFullMap();});
const stopMapDrag=()=>{mapDrag=null;mapCanvas.classList.remove('panning');};
mapCanvas.addEventListener('pointerup',stopMapDrag);mapCanvas.addEventListener('pointercancel',stopMapDrag);mapCanvas.addEventListener('lostpointercapture',stopMapDrag);
activate($('mapReset'),()=>{mapView.reset();drawFullMap();});
activate($('mapButton'),()=>setModal('mapModal',true));
activate($('settingsButton'),()=>setModal('settingsModal',true));
$('sfxVolume').value=Math.round(gameAudio.volume*100);$('sfxVolume').addEventListener('input',()=>gameAudio.setVolume(Number($('sfxVolume').value)/100));
activate($('pouchButton'),()=>setHud('pouchCard',hudVisible.pouchCard===false));
activate($('showAllHudButton'),()=>hudIds.forEach(id=>setHud(id,true)));
document.querySelectorAll('[data-hud]').forEach(input=>input.addEventListener('change',()=>setHud(input.dataset.hud,input.checked)));
activate($('eatMeatButton'),eatMeat);
activate($('eatFishButton'),()=>eatFood('cookedFish'));
const herbButton=document.createElement('button');herbButton.id='useMarijuanaButton';herbButton.className='bag-action';herbButton.textContent='Use dried marijuana · 60 sec';$('eatFishButton').after(herbButton);activate(herbButton,()=>eatFood('driedMarijuana'));
activate($('addFuelButton'),()=>{if(openCampfire?.addFuel(inventory)){renderCampfire();renderInventory();renderCrafting();showToast('Added wood fuel');worldBridge.publishInteraction({kind:'fuel-campfire',targetId:openCampfire.id,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('addRawButton'),()=>{if(openCampfire?.addMeat(inventory)){renderCampfire();renderInventory();renderCrafting();showToast('Added raw meat');worldBridge.publishInteraction({kind:'load-campfire',targetId:openCampfire.id,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('collectCookedButton'),()=>{const amount=openCampfire?.collect(inventory)||0;if(amount){renderCampfire();renderInventory();renderHotbar();showToast(`Collected ${amount} cooked meat · assign it in inventory`);worldBridge.publishInteraction({kind:'collect-cooked-meat',targetId:openCampfire.id,amount,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('addFishButton'),()=>{if(openCampfire?.addFish(inventory)){renderCampfire();renderInventory();renderCrafting();showToast('Added raw fish');worldBridge.publishInteraction({kind:'load-campfire-fish',targetId:openCampfire.id,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('collectFishButton'),()=>{const amount=openCampfire?.collectFish(inventory)||0;if(amount){renderCampfire();renderInventory();renderHotbar();showToast(`Collected ${amount} cooked fish`);worldBridge.publishInteraction({kind:'collect-cooked-fish',targetId:openCampfire.id,amount,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('craftTab'),()=>setCraftTab('craft'));
activate($('indexTab'),()=>setCraftTab('index'));
for(const [id,label] of CRAFT_CATEGORIES){const button=document.createElement('button');button.type='button';button.dataset.category=id;button.textContent=label;button.setAttribute('role','tab');activate(button,()=>{craftCategory=id;craftPage=0;renderCrafting();$('recipeList').scrollTop=0;});$('craftCategories').append(button);}
for(const id of ['craftSearch','craftDepth'])$(id).addEventListener(id==='craftSearch'?'input':'change',()=>{craftPage=0;renderCrafting();$('recipeList').scrollTop=0;});
activate($('craftPrevious'),()=>{craftPage=Math.max(0,craftPage-1);renderCrafting();$('recipeList').scrollTop=0;});activate($('craftNext'),()=>{craftPage++;renderCrafting();$('recipeList').scrollTop=0;});

$('indexSearch').addEventListener('input',renderItemIndex);
$('fishingBait').addEventListener('change',()=>{const result=selectBait(inventory,$('fishingBait').value);showToast(result.message);renderInventory();});
activate($('helpButton'),()=>setModal('helpModal',true));
activate($('craftButton'),()=>setModal('craftModal',true));
activate($('craftToolbarButton'),()=>setModal('craftModal',true));
activate($('inventoryButton'),()=>setModal('inventoryModal',true));
activate($('inventoryCraftButton'),()=>setModal('craftModal',true));
activate($('zonesButton'),()=>setZoneOverlay(!showZones));
activate($('zoneClose'),()=>setZoneOverlay(false));
document.querySelectorAll('[data-close]').forEach(b=>activate(b,()=>setModal(b.dataset.close,false)));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)setModal(m.id,false);}));

function itemName(id){const item=inventory.owned.get(id);return item?.type==='bow'?bowForm(item).name:RECIPES.find(r=>r.id===id)?.name||'None';}
function inventoryItemActions(card,slot,detail=''){
  const actions=document.createElement('div');actions.className='inventory-item-actions';
  const drag=document.createElement('button'),info=document.createElement('button');
  drag.type=info.type='button';drag.textContent='Put';info.textContent='Info';
  drag.className='inventory-put-button';drag.title='Put into the next empty hotbar slot';
  const amountLabel=document.createElement('label'),amount=document.createElement('input');amountLabel.className='inventory-amount';amountLabel.textContent='Amount';amount.type='number';amount.min='1';amount.max=String(slot.kind==='resource'?inventory.resources[slot.id]:slot.kind==='structure'?inventory.structures[slot.id]:1);amount.value=amount.max;amount.step='1';amount.setAttribute('aria-label',`Amount of ${resourceName(slot.id)}`);amountLabel.append(amount);
  const updateAmount=()=>{amount.value=String(Math.max(1,Math.min(Number(amount.max),Math.floor(Number(amount.value)||1))));slot.amount=Number(amount.value);};amount.addEventListener('change',updateAmount);updateAmount();
  activate(drag,event=>{event.stopPropagation();updateAmount();hotbar.removeDepleted(inventory);const index=hotbar.slots.findIndex(cell=>!cell);if(index<0){showToast('Your hotbar is full. Clear a slot first.');return;}putInventoryItem(index,{...slot});});
  activate(info,event=>{event.stopPropagation();
    let dialog=$('inventoryItemInfo');if(!dialog){dialog=document.createElement('dialog');dialog.id='inventoryItemInfo';document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});}
    const entry=indexEntries(inventory).find(e=>e.id===slot.id),title=document.createElement('h3'),body=document.createElement('p'),close=document.createElement('button');
    title.textContent=entry?.name||resourceName(slot.id);const edible=['cookedMeat','cookedFish','driedMarijuana',...CROPS.filter(c=>c.heal).map(c=>c.id)].includes(slot.id);
    const instructions=edible?'To consume: set Amount and click Put to fill the next empty hotbar slot. Close your inventory, select that slot, then click in the world to eat or use it.':slot.kind==='structure'?'Click Put to fill the next empty hotbar slot, select it, then click a valid location to build.':slot.kind==='equipment'?'Click Put to fill the next empty hotbar slot and select it to equip.': 'Crafting and quest materials are used automatically from your bag when needed.';
    body.textContent=[entry?.detail,detail,instructions].filter(Boolean).join(' ');close.textContent='Close';close.type='button';close.onclick=()=>dialog.close();dialog.replaceChildren(title,body,close);dialog.showModal();
  });actions.append(drag,info);card.append(amountLabel,actions);
}
function renderInventory(){
  const rod=inventory.equippedTool?.type==='rod'?inventory.equippedTool:[...inventory.owned.values()].find(t=>t.type==='rod');$('fishingBag').classList.toggle('hidden',!rod&&!BAITS.some(b=>inventory.resources[b.id]>0));$('fishingBait').replaceChildren(...BAITS.map(b=>{const o=document.createElement('option');o.value=b.id;o.textContent=`${b.name} · ${inventory.resources[b.id]} carried · ${b.luck}× luck / ${b.strength}× pull`;o.disabled=inventory.resources[b.id]<1;return o;}));$('fishingBait').value=inventory.fishingBait||'worms';if(rod){const st=rodStats(rod);$('rodBagStats').textContent=`Rod +${st.level}/5 · ${st.range} cast range · ${st.luck.toFixed(2)}× luck · ${st.strength.toFixed(2)}× strength. Upgrade at a blacksmith.`;}else $('rodBagStats').textContent='Equip a rod, click water, then click repeatedly after the bite. One bait per cast.';

  $('inventoryCoins').textContent=`${inventory.coins} coins`;
  const effect=currentEffects();
  for(const resource of RESOURCES){const counter=$(`count${resource[0].toUpperCase()+resource.slice(1)}`);if(counter){counter.textContent=inventory.resources[resource];counter.parentElement.classList.toggle('hidden',inventory.resources[resource]<=0);}}
  const extras=$('extraResources');extras.replaceChildren();
  for(const resource of visibleResources(inventory).filter(r=>!['leaves','sticks','wood','stone','iron','meat','hide','bone'].includes(r))){const chip=document.createElement('span');chip.textContent=`${resourceName(resource)}${oreLevel(resource)?` · Ore Lv ${oreLevel(resource)}`:''} ${inventory.resources[resource]}`;extras.append(chip);}
  extras.classList.toggle('hidden',extras.childElementCount===0);
  $('pouchEmpty').classList.toggle('hidden',visibleResources(inventory).length>0);
  $('equippedTool').textContent=inventory.equippedTool?`${itemName(inventory.equippedTool.id)} · ${scaledWeaponDamage(inventory.equippedTool,effect.stats.power)} dmg`:'Bare hands · 1 dmg';
  $('equippedGear').textContent=inventory.equippedGear?`${itemName(inventory.equippedGear.id)} · ${armorReduction(inventory.equippedGear,effect.stats.defense)} block`:'None';
  $('bagResources').replaceChildren();
  for(const resource of visibleResources(inventory)){
    const edible=['cookedMeat','cookedFish','driedMarijuana',...CROPS.filter(c=>c.heal).map(c=>c.id)].includes(resource);
    const chip=document.createElement('div');chip.className='inventory-resource-tile';const label=document.createElement('strong'),quantity=document.createElement('span');label.textContent=resourceName(resource);quantity.textContent=`×${inventory.resources[resource]}${oreLevel(resource)?` · Ore ${oreLevel(resource)}`:''}`;chip.append(resourceImage(resource,resourceName(resource)),label,quantity);
    inventoryItemActions(chip,{kind:'resource',id:resource});
    $('bagResources').append(chip);
  }
  $('bagResourcesEmpty').classList.toggle('hidden',$('bagResources').childElementCount>0);
  for(const id of ['eatMeatButton','eatFishButton','useMarijuanaButton'])$(id).classList.add('hidden');
  const weapons=$('ownedWeapons'),armor=$('ownedArmor');weapons.replaceChildren();armor.replaceChildren();
  let weaponCount=0,armorCount=0;
  for(const [id,item] of inventory.owned){
    const recipe=equipmentRecipe(RECIPES.find(r=>r.id===id),item),equipped=inventory.equippedTool?.id===id||inventory.equippedGear?.id===id;
    const card=document.createElement('div');card.className=`recipe-card owned ${equipped?'equipped':''}`;
    const info=document.createElement('div'),title=document.createElement('h3'),detail=document.createElement('p'),button=document.createElement('button');
    title.textContent=recipe.name;detail.textContent=`${recipe.tier} ${recipe.category==='gear'?'armor':recipe.type} · ${recipe.category==='gear'?`${item.defense} damage blocked · +12% max health · ${ARMOR_PERKS[id]?`${ARMOR_PERKS[id].stat} ${perkPercent(ARMOR_PERKS[id].base)}`:''}`:`${item.damage} damage${item.upgradeLevel?` · ${item.upgradeQuality} +${Math.round(item.upgradeBonus*100)}% (${item.upgradeLevel}/3)`:''}`} · ${equipped?'equipped':'in bag'}`;if(item.type==='rod'){const st=rodStats(item);detail.textContent=`Rod +${st.level}/5 · ${st.range} range · ${st.luck.toFixed(2)}× luck · ${st.strength.toFixed(2)}× strength · ${equipped?'equipped':'in bag'}`;}if(recipe.detail)detail.textContent+=' · '+recipe.detail;
    if(recipe.category==='gear'){
      button.textContent=equipped?'Unequip':'Equip';
      activate(button,()=>{if(equipped)inventory.unequip(id);else inventory.equip(id);currentEffects();renderInventory();renderCrafting();updateHud();});
    }else{
      button.textContent='Select';
      const slot={kind:'equipment',id};
      activate(button,()=>chooseInventoryItem(slot));
      if(selectedInventoryItem?.kind===slot.kind&&selectedInventoryItem.id===id)card.classList.add('inventory-picked');
    }
    card.title=detail.textContent;info.append(title,detail);card.append(itemImage(recipe),info);if(recipe.category==='gear')card.append(button);inventoryItemActions(card,{kind:'equipment',id},detail.textContent);
    if(recipe.category==='gear'){armor.append(card);armorCount++;}else{weapons.append(card);weaponCount++;}
  }
  $('weaponsEmpty').classList.toggle('hidden',weaponCount>0);$('armorEmpty').classList.toggle('hidden',armorCount>0);
  $('perkSummary').textContent=effect.perk?`${effect.perk.biome} ${effect.perk.stat}: ${perkPercent(effect.stats[effect.perk.stat])}. Matching tools crafted: ${effect.crafted}/${effect.total}. ${effect.boosted?'Full-set boost active.':effect.fullSet?'Equip one of the matching tools for the full-set boost.':'Craft every listed matching tool to unlock a stronger perk.'}`:'Equip armor to activate its biome perk.';
  const structureHost=$('ownedStructures');structureHost.replaceChildren();
  const kits=Object.entries(inventory.structures).filter(([,n])=>n>0);$('structuresEmpty').classList.toggle('hidden',kits.length>0);
  for(const [id,count] of kits){const recipe=RECIPES.find(r=>r.id===id),card=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button'),slot={kind:'structure',id};card.className='recipe-card';label.textContent=`${recipe.name} kits: ${count}`;button.textContent='Select';card.append(itemImage(recipe),label);inventoryItemActions(card,slot,recipe.detail);structureHost.append(card);}
  renderInventoryHotbar();
}
let craftCategory='tools',craftPage=0;
function renderCrafting(){
  const list=$('recipeList');list.replaceChildren();
  const next=tableForTier(inventory.tableTier+1);$('craftWorkshop').textContent=`${tableForTier(inventory.tableTier)?.name||'Hand crafting'}${next?` · Next workshop: player level ${next.level}`:' · All workshops unlocked'}`;
  const revealed=availableRecipes(RECIPES,inventory),query=$('craftSearch').value.trim().toLowerCase(),depth=$('craftDepth').value;
  for(const button of $('craftCategories').children){const count=revealed.filter(r=>craftingCategory(r)===button.dataset.category).length;button.textContent=CRAFT_CATEGORIES.find(([id])=>id===button.dataset.category)[1]+` (${count})`;const active=button.dataset.category===craftCategory;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));}
  const filtered=revealed.filter(r=>craftingCategory(r)===craftCategory&&(depth==='all'||(r.depth||0)===Number(depth))&&(!query||`${r.name} ${r.tier} ${r.type||''} ${Object.keys(r.cost).map(resourceName).join(' ')}`.toLowerCase().includes(query))).sort((a,b)=>(a.depth||0)-(b.depth||0)||(a.level||1)-(b.level||1));
  const size=window.innerWidth<760?2:4,pages=Math.max(1,Math.ceil(filtered.length/size));craftPage=Math.min(craftPage,pages-1);
  $('craftPageLabel').textContent=filtered.length?`${craftPage+1} / ${pages} · ${filtered.length} recipes`:'No matching recipes';$('craftPrevious').disabled=craftPage===0;$('craftNext').disabled=craftPage>=pages-1;
  const group=filtered.slice(craftPage*size,(craftPage+1)*size),grid=list;
  if(!group.length){const empty=document.createElement('p');empty.className='craft-empty';empty.textContent=query||depth!=='all'?'No matches. Try another search or tier.':'Unlock more recipes by crafting the next workshop.';list.append(empty);}
  for(const recipe of group){
    const card=document.createElement('div');card.className='recipe-card';
    const owned=inventory.owned.has(recipe.id),equipped=inventory.equippedTool?.id===recipe.id||inventory.equippedGear?.id===recipe.id;
    if(owned)card.classList.add('owned');if(equipped)card.classList.add('equipped');
    const info=document.createElement('div'),title=document.createElement('h3'),tier=document.createElement('span'),description=document.createElement('p'),cost=document.createElement('small'),button=document.createElement('button');
    title.textContent=recipe.name;tier.className='tier-tag';tier.textContent=`${recipe.depth?`Ore Lv ${recipe.depth}`:recipe.tier} · Player Lv ${recipe.level}`;title.append(tier);
    const perk=ARMOR_PERKS[recipe.id];
    description.textContent=recipe.detail+(perk?` +12% maximum health. ${perk.biome}: ${perkPercent(perk.base)} ${perk.stat}; ${perkPercent(1+(perk.base-1)*1.5)} with complete tool set and matching tool equipped.`:'');cost.textContent=Object.entries(recipe.cost).map(([r,n])=>`${n} ${r}`).join(' · ')+(recipe.oreAmount?` · ${recipe.oreAmount} ore from cave level ${recipe.oreDepth} (any mix)`:'')+(recipe.requires?` · Requires ${itemName(recipe.requires)}`:'')+(perk?` · Set: ${perk.tools.map(itemName).join(', ')}`:'');
    button.textContent=recipe.questOnly&&!owned?'Fisherman quest 10':!owned&&inventory.progression.level<recipe.level?`Level ${recipe.level}`:recipe.category==='structure'?'Craft':owned?'Inventory':'Craft';button.disabled=!owned&&!inventory.canCraft(recipe);
    activate(button,()=>{
      if(owned){setModal('inventoryModal',true);return;}
      else {const result=inventory.craft(recipe.id);showToast(result.ok?`Crafted ${recipe.name} · open inventory to equip or assign`:result.message);}
      renderInventory();renderCrafting();renderHotbar();
    });
    info.append(title,description,cost);card.append(itemImage(recipe),info,button);grid.append(card);
  }
  if(!$('indexView').classList.contains('hidden'))renderItemIndex();
}
function setCraftTab(tab){
  const index=tab==='index';
  $('craftView').classList.toggle('hidden',index);$('indexView').classList.toggle('hidden',!index);
  $('craftTab').classList.toggle('active',!index);$('indexTab').classList.toggle('active',index);
  $('craftTab').setAttribute('aria-selected',String(!index));$('indexTab').setAttribute('aria-selected',String(index));
  if(index)renderItemIndex();
}
function renderItemIndex(){
  const host=$('itemIndex'),query=$('indexSearch').value.trim().toLowerCase();host.replaceChildren();
  const guide=document.createElement('section');guide.className='unlock-guide';const heading=document.createElement('h3');heading.textContent='LEVEL & UNLOCK GUIDE';guide.append(heading);const intro=document.createElement('p');intro.textContent='Gain XP by gathering, crafting and defeating mobs. Reach the listed player level and craft the required workshop. Cave ore levels describe depth, not your player level.';guide.append(intro);
  for(const level of levelGuide(RECIPES)){const match=!query||/level|unlock|guide/.test(query)||level.items.some(item=>`${item.name} ${item.how}`.toLowerCase().includes(query));if(!match)continue;const row=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`Level ${level.level}${inventory.progression.level>=level.level?' · reached':''} · ${level.items.length} recipes`;row.append(summary);const ul=document.createElement('ul');for(const item of level.items){const li=document.createElement('li');li.textContent=`${item.name}: ${item.how}. Materials: `+Object.entries(item.recipe.cost).map(([id,n])=>`${n} ${resourceName(id)}`).join(', ')+(item.recipe.oreAmount?` + ${item.recipe.oreAmount} ore from cave level ${item.recipe.oreDepth} (any mix)`:'');ul.append(li);}if(!level.items.length){const li=document.createElement('li');li.textContent=level.level>=19?'Continue quests and boss hunts; the six workshops are unlocked by level 18.':'Build XP toward your next workshop and explore for materials.';ul.append(li);}row.append(ul);guide.append(row);}
  const caves=document.createElement('p');caves.textContent='Caves 1–6: descend through marked passages for progressively stronger ores. Layer 7: descend from the Primordial Vault to the underground 7-Eleven for Darren and scratch tickets. Fisherman gear comes from his 10 quests, rather than player levels.';guide.append(caves);host.append(guide);
  const entries=indexEntries(inventory).filter(entry=>!query||`${entry.name} ${entry.source} ${entry.detail} ${entry.recipe?.tier||''}`.toLowerCase().includes(query));
  if(!entries.length){const empty=document.createElement('p');empty.textContent='No items match that search.';host.append(empty);return;}
  for(const group of [...Array.from({length:6},(_,i)=>`Ores · Level ${i+1}`),'Resources','Weapons & Tools','Armor','Structures']){
    const matching=entries.filter(entry=>entry.group===group);if(!matching.length)continue;
    const section=document.createElement('section'),heading=document.createElement('h3'),grid=document.createElement('div');section.className='index-section';heading.textContent=group;grid.className='index-grid';section.append(heading,grid);host.append(section);
    for(const entry of matching){
      const card=document.createElement('article'),icon=entry.recipe?itemImage(entry.recipe):resourceImage(entry.id,entry.name),body=document.createElement('div'),title=document.createElement('h4'),source=document.createElement('small'),detail=document.createElement('p'),count=document.createElement('strong');
      card.className='index-card';
      title.textContent=entry.name;source.textContent=entry.source;detail.textContent=entry.detail;
      if(entry.recipe){const cost=Object.entries(entry.recipe.cost).map(([id,n])=>`${n} ${resourceName(id)}`).join(' · ');detail.textContent+=entry.recipe.questOnly?' Reward: fisherman quest 10.':` Craft: ${cost}.`;const perk=ARMOR_PERKS[entry.id];if(perk)detail.textContent+=` Perk: ${perkPercent(perk.base)} ${perk.stat}.`;
        count.textContent=entry.kind==='structure'||entry.kind==='resource'?`${entry.count} carried`:entry.count?'Crafted':'Not crafted';}
      else count.textContent=`${entry.count} carried`;
      body.append(title,source,detail);card.append(icon,body,count);grid.append(card);
    }
  }
}

$('zonePanelTitle').textContent=devMode?'SPAWN ZONE EDITOR':'SPAWN ZONES';
$('zoneInstructions').textContent=devMode?'Developer mode: click a zone and drag its corner handles. Changes save here and regenerate resources.':'Click a colored zone to inspect it. Zones cannot be moved during play. Add ?dev=1 to the URL to edit them.';
$('zoneReset').classList.toggle('hidden',!devMode);
$('zoneName').disabled=!devMode;$('zoneBiome').disabled=!devMode;

for(const biome of BIOME_IDS){const option=document.createElement('option');option.value=biome;option.textContent=biome;$('zoneBiome').append(option);}
function checkList(containerId,names,selected,change){
  const host=$(containerId);host.replaceChildren();
  for(const name of names){const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=selected.includes(name);box.disabled=!devMode;box.addEventListener('change',()=>change(name,box.checked));label.append(box,document.createTextNode(name));host.append(label);}
}
function saveZones(rebuild=true){zones.save();frontierNodes.reconcileZones();if(rebuild){populateWorld(zones,spawnables);targetNode=null;}}
function refreshZonePanel(){
  $('zoneEmpty').classList.toggle('hidden',!!selectedZone);
  $('zoneFields').classList.toggle('hidden',!selectedZone);
  if(!selectedZone)return;
  $('zoneName').value=selectedZone.name;$('zoneBiome').value=selectedZone.biome;
  checkList('zoneTypes',SPAWN_TYPES,selectedZone.allowedTypes,(name,on)=>{if(!devMode)return;selectedZone.allowedTypes=selectedZone.allowedTypes.filter(v=>v!==name);if(on)selectedZone.allowedTypes.push(name);saveZones();});
  checkList('zoneResources',RESOURCE_TYPES,selectedZone.resources,(name,on)=>{if(!devMode)return;selectedZone.resources=selectedZone.resources.filter(v=>v!==name);if(on)selectedZone.resources.push(name);saveZones();});
}
$('zoneName').addEventListener('input',e=>{if(devMode&&selectedZone){selectedZone.name=e.target.value;saveZones(false);}});
$('zoneBiome').addEventListener('change',e=>{if(devMode&&selectedZone){selectedZone.biome=e.target.value;saveZones();}});
activate($('zoneReset'),()=>{if(!devMode)return;zones.reset();populateWorld(zones,spawnables);frontierNodes.reconcileZones();selectedZone=null;refreshZonePanel();});
activate($('zoneExport'),()=>{
  const blob=new Blob([zones.export()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='cavemanworld-spawn-zones.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

function mouseWorld(event){const r=canvas.getBoundingClientRect(),p=renderer.screenToWorld(event.clientX-r.left,event.clientY-r.top,camera,zoom);return layer==='surface'?unprojectMountainPoint(p):p;}
function finishFishing(){
  const result=fishing.reel(performance.now(),inventory);if(!result.progress)showToast(result.message);
  if(result.progress)player.swingUntil=performance.now()+160;
  if(result.ok){player.swingUntil=performance.now()+250;renderInventory();renderCrafting();renderHotbar();updateHud();worldBridge.publishInteraction({kind:'catch-fish',resource:result.resource,amount:1,x:player.x,y:player.y,layer});}
}
canvas.addEventListener('pointerdown',event=>{
  if(modalOpen())return;
  if(!showZones){if(event.button===0){if(hotbar.current?.kind==='resource'&&hotbar.allowed(hotbar.current,inventory)){eatFood(hotbar.current.id);return;}if(fishing.active){finishFishing();return;}const p=mouseWorld(event);if(inventory.equippedTool?.type==='waterskin'){if(!waterAt(p.x,p.y,layer)||Math.hypot(p.x-player.x,p.y-player.y)>240||layer!=='surface'){showToast('Click nearby surface water to fill the waterskin');return;}const amount=Math.min(3,12-(inventory.resources.freshWater||0));if(amount>0)inventory.add('freshWater',amount);showToast(amount?`Filled ${amount} water · ${inventory.resources.freshWater}/12`:'Waterskin is full');renderInventory();renderHotbar();return;}const aimFacing=Math.atan2(p.y-player.y,p.x-player.x);
    const building=buildingForLayer(layer);
    if(building?.type==='convenience'){if(nearestPortal(p.x,p.y,layer)&&nearestPortal(player.x,player.y,layer))transition();else if(Math.hypot(p.x-DARREN.x,p.y-DARREN.y)<180&&Math.hypot(player.x-DARREN.x,player.y-DARREN.y)<180)frontierUI.showJournal(npcs.items.find(n=>n.id==='darren'));else if(Math.hypot(p.x-LOTTERY_SPOT.x,p.y-LOTTERY_SPOT.y)<180)storeUI.showLottery();return;}
    if(building){if(nearestPortal(p.x,p.y,layer)&&nearestPortal(player.x,player.y,layer))transition();else if(building.type==='casino'){const activity=casinoActivityAt(p.x,p.y,200);if(activity&&Math.hypot(player.x-activity.activity.x,player.y-activity.activity.y)<180)casinoUI.open(activity.id,building.name);else showToast('Walk up to a slot machine or the blackjack table');}else if(interiorActivity()&&Math.hypot(p.x-550,p.y-225)<240)townUI.open(building);else showToast('Walk up to the counter or supply chest');return;}
    if(['bow','slingshot'].includes(inventory.equippedTool?.type)){shoot(p);return;}
    if(inventory.equippedTool?.type==='grapple'){if(Math.hypot(p.x-player.x,p.y-player.y)>450){showToast('Grapple range: 450 units');return;}for(let t=0;t<=1;t+=.04)if(!canWalk(player.x+(p.x-player.x)*t,player.y+(p.y-player.y)*t,layer,PLAYER_RADIUS,true)||structures.blocks(player.x+(p.x-player.x)*t,player.y+(p.y-player.y)*t,layer)){showToast('The rope needs a clear route');return;}player.grappleTarget=p;return;}
    if(hotbar.current?.kind==='structure'){placeFrontier(p,hotbar.current.id);return;}
    const clickedNpc=npcs.visible({left:p.x-75,right:p.x+75,top:p.y-25,bottom:p.y+110},layer)[0];if(clickedNpc&&Math.hypot(clickedNpc.x-player.x,clickedNpc.y-player.y)<180){frontierUI.showJournal(clickedNpc);return;}
    const special=frontierNodes.visible({left:p.x-60,right:p.x+60,top:p.y-30,bottom:p.y+90},layer)[0];
    if(layer==='surface'){const b=TOWN_BUILDINGS.find(b=>Math.abs(p.x-b.x)<210&&Math.abs(p.y-b.y)<220);if(b){if(nearestPortal(player.x,player.y,layer)?.id===b.id)transition();else showToast(`Walk to the ${b.sign.toLowerCase()} entrance`);return;}}
    const fire=structures.at(p.x,p.y,layer);if(fire){if(['pickaxe','axe'].includes(inventory.equippedTool?.type))mineCampfire(fire);else if(Math.hypot(fire.x-player.x,fire.y-player.y)<fire.radius+145)openFire(fire);else showToast('Move closer to the campfire');return;}
    const clickedPlayer=remotePlayers.find(t=>Math.abs(t.x-p.x)<35&&p.y<t.y+25&&p.y>t.y-115);if(clickedPlayer){attack(Math.atan2(clickedPlayer.y-player.y,clickedPlayer.x-player.x));return;}
    const clickedMob=creatures.visible({left:p.x-110,right:p.x+110,top:p.y-80,bottom:p.y+280},layer).find(c=>Math.abs(c.x-p.x)<c.radius+30&&p.y<c.y+30&&p.y>c.y-(c.boss?240:110));
    if(clickedMob){attack(Math.atan2(clickedMob.y-player.y,clickedMob.x-player.x));return;}
    if(special){collectFrontier(special);return;}
    const node=hoveredNode||spawnables.at(p.x,p.y,layer);
    const meleeWeapon=['sword','spear','warhammer','club','rock'].includes(inventory.equippedTool?.type);
    if(meleeWeapon&&attackTarget(creatures.nearby(player.x,player.y,layer,(inventory.equippedTool?.range||120)+50),{...player,facing:aimFacing},inventory.equippedTool?.range||120)){attack(aimFacing);return;}
    if(node){gather(node);return;}
    if(hotbar.current?.kind==='structure'&&hotbar.current.id==='campfire'){placeCampfire(p);return;}
    if(fishing.active&&Math.hypot(p.x-fishing.castPoint.x,p.y-fishing.castPoint.y)<65){finishFishing();return;}
    if(lakeAt(p.x,p.y)||(layer==='surface'&&oceanDistance(p.x,p.y)<0)){player.fishingQuest=quests.fisherman;const rod=inventory.equippedTool?.type==='rod'?inventory.equippedTool:player.vehicle?.boat?[...inventory.owned.values()].filter(t=>t.type==='rod').sort((a,b)=>rodRank(b)-rodRank(a))[0]:null;const result=fishing.cast(player,rod,p,performance.now(),inventory);showToast(result.message);if(result.ok){renderInventory();renderHotbar();player.swingUntil=performance.now()+250;worldBridge.publishInteraction({kind:'cast-line',targetId:fishing.lake.id,x:p.x,y:p.y,layer});}return;}
    attack(aimFacing);}return;}
  const p=mouseWorld(event);
  if(devMode&&selectedZone){const index=selectedZone.vertices.findIndex(v=>Math.hypot(v.x-p.x,v.y-p.y)<Math.max(30,18/zoom));if(index>=0){dragVertex=index;canvas.setPointerCapture(event.pointerId);return;}}
  selectedZone=zones.at(p.x,p.y,layer);refreshZonePanel();
});
canvas.addEventListener('pointermove',event=>{
  if(dragVertex<0||!selectedZone)return;
  const p=mouseWorld(event),bounds=LAYERS[layer];
  selectedZone.vertices[dragVertex]={x:Math.round(Math.max(0,Math.min(bounds.width,p.x))),y:Math.round(Math.max(0,Math.min(bounds.height,p.y)))};
});
function stopDragging(){if(dragVertex>=0){dragVertex=-1;saveZones();}}
canvas.addEventListener('pointerup',stopDragging);canvas.addEventListener('pointercancel',stopDragging);

function update(dt,now){
  if(!modalOpen()){
    player.facing=keyboardFacing(keys,player.facing);
    player.underwater=layer==='ocean';player.vehicle=layer==='surface'?TRANSPORT[inventory.equippedTool?.id]||null:null;
    const raft=layer==='surface'?[...structures.items.values()].find(s=>s.kind==='reed-raft'&&Math.abs(player.x-s.x)<85&&Math.abs(player.y-s.y)<50):null;
    player.raftId=raft?.id||null;if(raft)player.vehicle={land:1,water:3.5,boat:true};
    player.flightHeight=player.vehicle?.glider?92+Math.sin(now*.003)*9:Math.max(0,(player.flightHeight||0)-dt*240);
    updateBridgeContact(player);
    player.swimming=player.underwater||(!raft&&!player.vehicle?.glider&&!player.bridgeId&&physicalWaterAt(player.x,player.y,layer)&&!player.waterJump);
    player.vehicleId=player.vehicle?.glider||inventory.equippedTool?.type==='transport'?inventory.equippedTool?.id:null;
    if(player.swimming){player.jumpActive=false;player.jumpHeight=0;if(!player.vehicle?.boat)fishing.cancel();}
    updateJump(player,dt);if(!player.jumpActive)player.waterJump=false;updateBridgeContact(player);
    player.moving=false;
    const drivingRaft=raft?.driver===lan.id;
    let transportSpeed=drivingRaft?3.5:player.vehicle?(player.swimming?player.vehicle.water:player.vehicle.land):player.swimming?.65:1;
    const motion=movementVector({keys,sprinting:keys.has('shift'),betaBoost:keys.has('alt'),speedMultiplier:currentEffects().stats.speed*transportSpeed,dt});
    let {dx,dy}=motion;
    if(layer==='surface'&&!player.swimming&&!player.vehicle){const climb=mountainTravelFactor(player.x,player.y,dx,dy);dx*=climb;dy*=climb;}
    if(player.vehicle?.glider&&altitudeAt(player.x+dx,player.y+dy)<altitudeAt(player.x,player.y)){dx*=1.4;dy*=1.4;}
    if(player.grappleTarget){const d=Math.hypot(player.grappleTarget.x-player.x,player.grappleTarget.y-player.y),step=Math.min(d,480*dt);if(d<5){player.grappleTarget=null;}else{dx=(player.grappleTarget.x-player.x)/d*step;dy=(player.grappleTarget.y-player.y)/d*step;}}
    if(drivingRaft&&(dx||dy)){
      const nx=raft.x+dx,ny=raft.y+dy;if(raftCanOccupy(nx,ny)){
       raft.x=nx;raft.y=ny;player.x=nx;player.y=ny-20;player.moving=true;if(now-lastSail>100){lastSail=now;lan.send({type:'sail',id:raft.id,x:nx,y:ny}).then(()=>raft.confirmed={x:nx,y:ny}).catch(e=>{const at=raft.confirmed;if(at){raft.x=at.x;raft.y=at.y;player.x=at.x;player.y=at.y-20;}showToast(e.message);});}
      }dx=0;dy=0;
    }
    if(layer==='surface'&&player.swimming&&!raft&&!player.vehicle){const flow=riverCurrent(player.x,player.y);dx+=flow.dx*dt;dy+=flow.dy*dt;}
    if(dx||dy){
      const beforeX=player.x,beforeY=player.y;
      // Keep collision sweeps short, including sprinting and fast transport.
      const steps=Math.ceil(Math.hypot(dx,dy)/8);
      const canOccupy=(x,y)=>!(player.vehicleId==='wood-scooter'&&mountainAt(x,y)&&!plateauAt(x,y))&&canWalk(x,y,layer,PLAYER_RADIUS,true)&&!structures.blocks(x,y,layer,PLAYER_RADIUS);
      for(let i=0;i<steps;i++){
        const previousX=player.x,previousY=player.y;
        const next=slideStep(player.x,player.y,dx/steps,dy/steps,canOccupy);
        player.x=next.x;player.y=next.y;updateBridgeContact(player,previousX,previousY);
      }
      player.moving=Math.hypot(player.x-beforeX,player.y-beforeY)>.01;if(!player.moving)player.grappleTarget=null;
    }
    player.swimming=player.underwater||(!raft&&!player.vehicle?.glider&&!player.bridgeId&&physicalWaterAt(player.x,player.y,layer)&&!player.waterJump);
  }else player.moving=false;
  steezusMusic.update(dt,player,musicBosses,now);
  gameAudio.update(dt,now,player,creatures.creatures,{sprinting:keys.has('shift'),paused:modalOpen()});
  structures.update(dt);npcs.update(dt,now,player);frontierNodes.update(now);
  if(now-lastHud>170){frontierUI.update(now);storeUI.update();}
  if(!$('townModal').classList.contains('hidden')&&townUI.building?.type==='house'&&now-lastHud>170)townUI.render();
  if(openCampfire&&!$('campfireModal').classList.contains('hidden')&&now-lastHud>170)renderCampfire();
  if(!modalOpen()){
    const hurt=(damage,source)=>{
      const result=vitals.takeDamage(damage,source==='Drowning'?null:inventory.equippedGear,now,source==='Drowning'?1:currentEffects().stats.defense);
      if(result.damage){showToast(`${source} hit you · −${result.damage} health`,900);updateHud();}
      if(result.dead){resetAfterDefeat(now);showToast('You fell and returned to safe town outskirts',3500);}
      return result.dead;
    };
    const drowning=diving.update(dt,player,inventory);if(diving.wetTime>4)toggleDive();
    let defeated=drowning?hurt(drowning,'Drowning'):false;
    for(const strike of creatures.update(dt,now,player,(x,y,l,r)=>canWalk(x,y,l,r)&&!structures.blocks(x,y,l,r))){
      if(strike.summon){for(const helper of summonEden(strike.creature,now))creatures.add(helper);}
      else if(strike.hazard)projectiles.storm(strike.hazard,strike.creature.id,now);
      else if(strike.projectile)projectiles.launch(strike.projectile,strike.creature.id,now);
      else if(hurt(strike.damage,strike.creature.name)){defeated=true;break;}
    }
    if(!defeated)for(const hit of projectiles.update(dt,now,player,creatures,structures)){if(hit.target){rewardHit(hit.target,hit.result,hit.damage,now);renderInventory();renderCrafting();updateHud();}else if(hurt(hit.damage,hit.kind==='sulfur-rain'?'Sulfur rain':hit.kind==='log'?'Rolling log':hit.kind==='feces'?'Bigfoot projectile':hit.kind==='holy-smoke'?'Steezus holy smoke':hit.kind==='puddle'?'Boss puddle':'Scorpion rock'))break;}
    drops.update(now);
  }
  const fishUpdate=fishing.update(now,player);if(fishUpdate)showToast(fishUpdate);
  const zoomingIn=targetZoom>zoom+.001;
  const follow=1-Math.exp(-dt*(zoomingIn?12:6)),zoomFollow=1-Math.exp(-dt*9),lookFollow=1-Math.exp(-dt*(zoomingIn?14:3.5));
  const look=mouseLookOffset(mouse,renderer.width,renderer.height,zoom,targetZoom);
  camera.lookX+=(look.x-camera.lookX)*lookFollow;
  camera.lookY+=(look.y-camera.lookY)*lookFollow;
  camera.x+=(player.x+camera.lookX-camera.x)*follow;
  camera.y+=(player.y-(layer==='surface'?elevationOffset(player.x,player.y):0)+camera.lookY-(player.flightHeight||0)*.5-camera.y)*follow;
  zoom+=(targetZoom-zoom)*zoomFollow;
  if(now-lastRespawn>1000){spawnables.update(now);lastRespawn=now;}
  remotePlayers=lan.positions(dt,layer);if(now-lastStructureSync>1000){syncMachines();lastStructureSync=now;}
  if(now-lastPosition>150){
    syncPosition(false);
    worldBridge.publishPosition({x:Math.round(player.x),y:Math.round(player.y),layer,facing:player.facing});lastPosition=now;lastPublishedFacing=player.facing;
  }
  if(now-lastHud>170){updateHud();lastHud=now;}
  if(now-lastDestinationWarm>1000){warmNextDestination();lastDestinationWarm=now;}
  if(now-lastMap>700){renderer.drawOverview($('minimap'),layer,player,zones,showZones);drawFullMap();lastMap=now;}
}
function updateHud(){
  if(lan.ready)document.querySelector('.session').textContent=`LAN CONNECTED · ${lan.players.size+1} player${lan.players.size?'s':''}`;
  $('coinBalance').textContent=inventory.coins.toLocaleString();
  const progress=inventory.progression,maxLevel=progress.level>=20;
  $('levelStatus').textContent=`LEVEL ${progress.level}`;
  $('xpText').textContent=maxLevel?'MAX LEVEL':`${progress.xp} / ${progress.required} XP`;
  $('xpFill').style.width=`${maxLevel?100:Math.min(100,100*progress.xp/progress.required)}%`;
  const xpTrack=$('xpTrack');xpTrack.setAttribute('aria-valuemax',String(maxLevel?1:progress.required));xpTrack.setAttribute('aria-valuenow',String(maxLevel?1:progress.xp));
  xpTrack.setAttribute('aria-valuetext',maxLevel?'Maximum level':`${progress.xp} of ${progress.required} experience to level ${progress.level+1}`);
  const effect=currentEffects();
  $('healthText').textContent=`${Math.ceil(vitals.health)} / ${vitals.maxHealth}`;
  $('healthFill').style.width=`${100*vitals.health/vitals.maxHealth}%`;
  $('armorText').textContent=`${inventory.equippedGear?itemName(inventory.equippedGear.id):'No armor'} · ${armorReduction(inventory.equippedGear,effect.stats.defense)} damage blocked`;
  $('perkText').textContent=effect.perk?`${effect.perk.biome} ${effect.perk.stat} ${perkPercent(effect.stats[effect.perk.stat])}${effect.boosted?' · set boost':''}`:'No armor perk';
  const biome=biomeAt(player.x,player.y,layer),place=nearbyPlace(player.x,player.y,layer);
  $('placeName').textContent=place;$('biomeName').textContent=buildingForLayer(layer)?`Interior · ${inventory.coins} coins`:`${biome.name} · ${LAYER_NAMES[layer]}`;
  $('coords').textContent=`${Math.round(player.x).toLocaleString()} · ${Math.round(player.y).toLocaleString()}`;
  const map=LAYERS[layer];$('mapSize').textContent=`${(map.width/1000).toFixed(map.width%1000?1:0)}k × ${(map.height/1000).toFixed(map.height%1000?1:0)}k units`;
  const p=nearestPortal(player.x,player.y,layer);
  const activity=buildingForLayer(layer)?.type==='casino'&&!p?casinoActivityAt(player.x,player.y):null;
  targetDrop=drops.nearest(player.x,player.y,layer,performance.now());
  const nearNpc=npcs.nearest(player),nearSpecial=frontierNodes.nearest(player);
  const nearFire=p||targetDrop?null:structures.nearest(player.x,player.y,layer);
  targetNode=p||targetDrop||nearFire||nearNpc||nearSpecial?null:spawnables.nearest(player.x,player.y,layer);
  const townActivity=interiorActivity();
  $('portalPrompt').classList.toggle('hidden',!fishing.active&&!p&&!targetDrop&&!targetNode&&!nearFire&&!activity&&!townActivity&&!nearNpc&&!nearSpecial);
  $('actionKey').textContent=targetNode&&!['bush','ground'].includes(targetNode.kind)?'CLICK':'E';
  if(fishing.active){$('actionKey').textContent='E';$('portalText').textContent=fishing.fish?`Reeling ${Math.floor(fishing.progress)}% · click repeatedly!`:fishing.ready?'Bite! Click repeatedly or tap E':fishing.disturbance?'Ripples near your bait · get ready':'Fishing · watch the bait';}
  else if(targetDrop)$('portalText').textContent=`Pick up ${targetDrop.amount} ${targetDrop.resource}`;
  else if(p)$('portalText').textContent=BUILDING_PORTALS.includes(p)?`${layer==='surface'?'Enter':'Leave'} ${p.name}`:`Travel to ${LAYER_NAMES[portalDestination(p,layer)]} · ${p.name} (${portalDirection(p,layer)})`;
  else if(activity)$('portalText').textContent=activity.id==='slots'?'Play casino games · coins':'Play blackjack against the dealer';
  else if(townActivity)$('portalText').textContent=({convenience:'Scratch lottery · 25 coins per ticket',shop:'Trade resources · general shop',smith:'Upgrade tools · blacksmith',house:'Open supply chest · refills every 2 minutes'})[buildingForLayer(layer).type];
  else if(nearNpc)$('portalText').textContent='Talk to '+nearNpc.name+' · quests';
  else if(nearSpecial)$('portalText').textContent=nearSpecial.label+' · collect';
  else if(nearFire)$('portalText').textContent=nearFire.tableTier?`Use ${tableForTier(nearFire.tableTier).name} · crafting`:nearFire.kind==='reed-raft'?(nearFire.driver===lan.id?'Stop steering · fish from deck':'Board driver seat · steer with WASD'):nearFire.kind==='wood-gate'?'Toggle gate':nearFire.kind?'Use '+RECIPES.find(r=>r.id===nearFire.kind).name:'Open campfire · cook meat or fish';
  else if(targetNode){$('portalPrompt').classList.add('hidden');const n=targetNode;$('portalText').textContent=n.kind==='bush'?`Forage ${n.crop?.name||'Bush'} · seeds + food + sticks`:n.kind==='ground'?`Pick up ${n.label}`:`${n.kind==='tree'?'Chop':'Mine'} ${n.label} · ${n.quantity}/${n.maxQuantity} · ${n.kind==='tree'?'axe':`${n.rarity?`${n.rarity} · `:''}${['obsidian','moonstone'].includes(n.resource)?'iron pickaxe':'pickaxe'}`} needed`;}
}
function drawFullMap(){if($('mapModal').classList.contains('hidden'))return;$('atlasTitle').textContent=LAYER_NAMES[layer];const viewport=$('atlasViewport'),map=$('fullMap'),width=Math.max(1,Math.floor(viewport.clientWidth)),height=Math.max(1,Math.floor(viewport.clientHeight));if(map.width!==width||map.height!==height){mapView.x*=width/map.width;mapView.y*=height/map.height;map.width=width;map.height=height;}mapView.constrain($('fullMap'),mapWorld());renderer.drawOverview($('fullMap'),layer,player,zones,showZones,mapView);$('mapZoom').textContent=mapView.zoom.toFixed(1)+'×';}
const hoverMasks=new WeakMap();
let hoveredNode=null,pointerOnWorld=false,hoverMemo='',hoverText='',hoverWidth=0,hoverHeight=0;
const hoverLabel=document.createElement('div');hoverLabel.id='resourceHoverLabel';hoverLabel.hidden=true;document.body.append(hoverLabel);
canvas.addEventListener('pointerenter',()=>pointerOnWorld=true);
canvas.addEventListener('pointerleave',()=>{pointerOnWorld=false;hoveredNode=null;hoverLabel.hidden=true;});
function updateResourceHover(){
  if(!pointerOnWorld||modalOpen()||showZones){hoveredNode=null;hoverMemo='';hoverLabel.hidden=true;return;}
  const projected=renderer.screenToWorld(mouse.x,mouse.y,camera,zoom),world=layer==='surface'?unprojectMountainPoint(projected):projected;
  const memo=`${layer}:${Math.round(projected.x*10)}:${Math.round(projected.y*10)}:${mouse.x}:${mouse.y}:${zoom.toFixed(4)}:${inventory.equippedTool?.id}:${inventory.equippedTool?.tier}`;
  if(memo===hoverMemo&&(!hoveredNode||hoveredNode.active))return;hoverMemo=memo;hoveredNode=null;
  const nodes=spawnables.query({left:world.x-230,right:world.x+230,top:world.y-290,bottom:world.y+390},layer,'nodes');
  for(const n of nodes){if(!n.active)continue;const y=n.y-(layer==='surface'?elevationOffset(n.x,n.y):0),scale=n.scale||1,dx=projected.x-n.x,dy=projected.y-y;
    const width=(n.kind==='tree'?65:n.kind==='ground'?31:55)*scale,height=(n.kind==='tree'?210:n.kind==='ground'?65:95)*scale;
    if(Math.abs(dx)>=width||dy<=-height||dy>=18*scale)continue;
    const variant=n.variant??Math.floor(grain(n.x,n.y)*12),resource=n.kind==='bush'?(n.crop?.id||n.resource):n.resource;
    const sprite=renderer.art.sprites.get(`${n.kind}:${n.biome||'heartlands'}:${resource}:${variant}`);if(!sprite)continue;
    const spriteScale=(n.kind==='tree'?1.65:1.8)*scale,px=Math.floor((dx/spriteScale+sprite.ax)*(sprite.resolution||1)),py=Math.floor((dy*.86/spriteScale+sprite.ay)*(sprite.resolution||1));
    if(px<0||py<0||px>=sprite.image.width||py>=sprite.image.height)continue;
    let mask=hoverMasks.get(sprite.image);if(!mask){mask=sprite.image.getContext('2d').getImageData(0,0,sprite.image.width,sprite.image.height).data;hoverMasks.set(sprite.image,mask);}
    if(mask[(py*sprite.image.width+px)*4+3]&&(!hoveredNode||n.y>hoveredNode.y))hoveredNode=n;
  }
  hoverLabel.hidden=!hoveredNode;if(!hoveredNode)return;
  const status=hoveredNode.gatherRequirement(inventory.equippedTool);hoverLabel.classList.toggle('unavailable',!status.ok);
  const text=`${hoveredNode.crop?.name||hoveredNode.label} · ${status.ok?'Gatherable':status.message}`;if(text!==hoverText){hoverText=text;hoverLabel.textContent=text;hoverWidth=hoverLabel.offsetWidth;hoverHeight=hoverLabel.offsetHeight;}
  const r=canvas.getBoundingClientRect();hoverLabel.style.left=`${Math.min(window.innerWidth-hoverWidth-8,r.left+mouse.x+14)}px`;hoverLabel.style.top=`${Math.min(window.innerHeight-hoverHeight-8,r.top+mouse.y+16)}px`;
}
let frameWork=0;
function frame(now){
  const workStart=performance.now();
  const dt=Math.max(0,Math.min(.05,(now-lastFrame)/1000));lastFrame=now;
  update(dt,now);updateResourceHover();renderer.render({camera,zoom,player,layer,zones,showZones,selectedZone,editZones:devMode,spawnables,structures,creatures,drops,projectiles,fishing,targetNode,targetDrop,inventory,hoveredNode,time:now,frontier:{npcs,nodes:frontierNodes,quests,remotePlayers,networkShots}});
  frameWork+=performance.now()-workStart;fpsFrames++;
  if(now-fpsStart>=1000){$('perfStats').textContent=`${Math.round(fpsFrames*1000/(now-fpsStart))} FPS · ${(frameWork/fpsFrames).toFixed(1)} ms/frame · ${layer} · ${zoom.toFixed(2)}× zoom · terrain ${renderer.art.worker?'worker':'fallback'}`;fpsFrames=0;frameWork=0;fpsStart=now;}
  requestAnimationFrame(frame);
}
function warmNextDestination(){const p=betaDescent();if(!p)return;const next=portalDestination(p,layer),at=p[next];if(!buildingForLayer(next)){renderer.art.prewarm(renderer.viewBounds({x:at.x,y:at.y},zoom),next);renderer.art.requestCaveAtlas(next);}}
function betaDescent(){const order=['surface','cave','deep','abyss','core','mantle','vault',STORE_LAYER],next=order[order.indexOf(layer)+1];return order.includes(layer)?[...PORTALS,...DESCENTS].filter(p=>p[layer]&&p[next]).sort((a,b)=>Math.hypot(a[layer].x-player.x,a[layer].y-player.y)-Math.hypot(b[layer].x-player.x,b[layer].y-player.y))[0]:null;}
activate($('betaDescend'),()=>{const p=betaDescent();if(!p)return;transition(p,true);setModal('betaModal',false);updateHud();showToast(`Teleported to ${LAYER_NAMES[layer]}`);});
function renderBeta(){const p=betaDescent();$('betaDescend').disabled=!p;$('betaDescend').textContent=p?`Descend · ${LAYER_NAMES[portalDestination(p,layer)]}`:'No deeper layer'; $('betaLevel').textContent=`Level ${inventory.progression.level} · ${inventory.progression.xp}/${inventory.progression.required} XP`; }
function refreshBeta(){renderBeta();renderInventory();renderCrafting();renderHotbar();updateHud();}
for(const amount of [1,5])activate($(amount===1?'betaLevelOne':'betaLevelFive'),()=>{inventory.progression.upgrade(amount);$('betaFeedback').textContent=`Upgraded to level ${inventory.progression.level}`;refreshBeta();});
for(const [label,items] of [['Resources',RESOURCES.map(id=>({id,name:resourceName(id)}))],['Equipment & structures',RECIPES]]){const group=document.createElement('optgroup');group.label=label;for(const item of items){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;group.append(option);}$('betaItem').append(group);}
activate($('betaGive'),()=>{grantBetaItem(inventory,$('betaItem').value,$('betaQuantity').value);$('betaFeedback').textContent=`Added ${$('betaItem').selectedOptions[0].textContent}`;refreshBeta();});
activate($('betaSupplies'),()=>{for(const id of RESOURCES)inventory.add(id,50);$('betaFeedback').textContent='Added 50 of every resource';refreshBeta();});

renderInventory();renderCrafting();renderHotbar();updateHud();renderer.drawOverview($('minimap'),layer,player,zones,showZones);warmNextDestination();requestAnimationFrame(frame);lan.connect();showQuickStart();
if(!startPortal&&layer==='surface')showToast('Click bushes and stones → C: craft an axe → 1–6: hotbar',6000);

$('lanName')?.addEventListener('change',e=>{lan.name=e.target.value.trim().slice(0,24)||'Caveman';syncPosition();});
$('lanChatForm')?.addEventListener('submit',e=>{e.preventDefault();const field=$('lanChatInput');lan.send({type:'chat',text:field.value}).then(()=>field.value='').catch(e=>showToast(e.message));});

// Exposed to local integration tests and future transport adapters.
export {player,inventory,hotbar,structures,lan,fishing,quests,creatures,vitals};
