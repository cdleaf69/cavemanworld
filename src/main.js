import { grantBetaItem } from './beta.js';
import { LAYERS, LAYER_NAMES, portalDestination } from './world.js';
import { SURFACE, CAVES, DEEP_CAVES, PORTALS, DESCENTS, LAKES, PLAYER_RADIUS, canWalk, nearestPortal, nearbyPlace, biomeAt, lakeAt } from './world.js';
import { SpawnZoneManager, SPAWN_TYPES, RESOURCE_TYPES, BIOME_IDS } from './spawn-zones.js';
import { SpawnableRegistry } from './spawnables.js';
import { populateWorld } from './spawner.js';
import { Inventory, RECIPES, RESOURCES } from './crafting.js';
import { PixelWorldRenderer as WorldRenderer } from './pixel-renderer.js';
import { worldBridge } from './network-hooks.js';
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
import { indexEntries, resourceName, visibleResources } from './item-index.js';

const $ = id => document.getElementById(id);
function activate(element,handler){element.addEventListener('click',handler);}
const canvas=$('world');
const renderer=new WorldRenderer(canvas);
const zones=new SpawnZoneManager();
export const spawnables=new SpawnableRegistry();
populateWorld(zones,spawnables);
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
const startPortal=[...PORTALS,...DESCENTS].find(p=>p.id===params.get('start'));
const startLake=LAKES.find(l=>l.id===params.get('start'));
const startBridge=startLayer==='surface'&&params.get('start')==='mire-crossing'?{x:8200,y:7850}:null;
const initial=startPortal?.[startLayer]||(startLayer==='surface'&&startLake?{x:startLake.x+startLake.rx+85,y:startLake.y}:null)||startBridge||LAYERS[startLayer]?.spawn||(startLayer==='deep'?DEEP_CAVES.spawn:startLayer==='cave'?{x:3950,y:2700}:SURFACE.spawn);
const player={x:initial.x,y:initial.y,facing:Math.PI*1.5,moving:false,jumpHeight:0,jumpActive:false};
player.layer=startLayer;
const camera={x:player.x,y:player.y,lookX:0,lookY:0};
let layer=startLayer,zoom=.68,targetZoom=.68,showZones=false,selectedZone=null,dragVertex=-1;
let lastFrame=performance.now(),lastHud=0,lastMap=0,lastPosition=0,lastTransition=0,lastPublishedFacing=player.facing;
let fpsFrames=0,fpsStart=performance.now();
let lastRespawn=0,targetNode=null,targetDrop=null,toastTimer=0;
let nextSwingAt=0;
let selectedInventoryItem=null;
let pointerInventoryDrag=null;
const keys=new Set();
const mouse={x:renderer.width/2,y:renderer.height/2};

function setModal(id,open){if(open)document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));$(id).classList.toggle('hidden',!open);if(id==='mapModal'&&open)drawFullMap();if(id==='craftModal'&&open){setCraftTab('craft');renderCrafting();}if(id==='inventoryModal'&&open)renderInventory();}
function modalOpen(){return !!document.querySelector('.modal:not(.hidden)');}
function setZoneOverlay(open){showZones=open;$('zonePanel').classList.toggle('hidden',!open);$('zonesButton').classList.toggle('active',open);if(!open){dragVertex=-1;selectedZone=null;}refreshZonePanel();renderer.drawOverview($('minimap'),layer,player,zones,showZones);drawFullMap();}
function showToast(message,duration=2800){$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),duration);}
const hudIds=['locationCard','healthCard','minimapCard','pouchCard','hotbar','toolbar'];
let hudVisible={};
try{hudVisible=JSON.parse(localStorage.getItem('embervale-hud')||'{}')||{};}catch{hudVisible={};}
function setHud(id,visible){hudVisible[id]=visible;$(id).classList.toggle('hidden',!visible);const input=document.querySelector(`[data-hud="${id}"]`);if(input)input.checked=visible;localStorage.setItem('embervale-hud',JSON.stringify(hudVisible));}
for(const id of hudIds)setHud(id,hudVisible[id]!==false);
function eatFood(resource='cookedMeat'){
  if(vitals.health>=vitals.maxHealth){showToast('Health is already full');return;}
  if(!inventory.consume(resource,1)){showToast('Cook food over a fueled campfire first');return;}
  const healed=vitals.heal(resource==='cookedFish'?30:40);
  showToast(`Ate ${resource==='cookedFish'?'cooked fish':'cooked meat'} · +${healed} health`);
  renderInventory();renderHotbar();updateHud();worldBridge.publishInteraction({kind:'eat-cooked-food',resource,x:player.x,y:player.y,layer});
}
function eatMeat(){eatFood(inventory.resources.cookedMeat>0?'cookedMeat':'cookedFish');}
function currentEffects(){const effect=armorEffects(inventory);vitals.setMaxHealth(100*effect.stats.health);return effect;}
function attack(aimFacing=player.facing){
  const now=performance.now();if(modalOpen()||now<nextSwingAt)return;
  nextSwingAt=now+420;player.swingUntil=now+250;
  const target=attackTarget(creatures.nearby(player.x,player.y,layer,170),{...player,facing:aimFacing});
  if(!target)return;
  const damage=scaledWeaponDamage(inventory.equippedTool,currentEffects().stats.power),result=target.hit(damage,now);
  if(!result.ok)return;
  if(result.dead){inventory.progression.gain(layer==='core'?90:layer==='abyss'?65:layer==='deep'?45:25);drops.spawn(result.loot,target.x,target.y,layer,now);showToast(`${target.name} defeated · loot dropped nearby (E)`);}
  else showToast(`${target.name} · ${target.health}/${target.maxHealth} health`,850);
  worldBridge.publishInteraction({kind:'attack-creature',targetId:target.id,damage,x:player.x,y:player.y,layer});
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
    if(slot){const recipe=RECIPES.find(r=>r.id===slot.id);if(recipe)button.append(itemImage(recipe));else{const icon=document.createElement('span');icon.className='food-icon';icon.textContent=slot.id==='cookedFish'?'🐟':'🍖';button.append(icon);}const label=document.createElement('small');label.textContent=recipe?.name||resourceName(slot.id);button.append(label);if(slot.kind==='structure'||slot.kind==='resource'){const count=document.createElement('b');count.textContent=slot.kind==='structure'?inventory.structures[slot.id]:inventory.resources[slot.id];button.append(count);}}
    activate(button,()=>{if(index===hotbar.selected&&['cookedMeat','cookedFish'].includes(slot?.id))eatFood(slot.id);else selectHotbar(index);});host.append(button);
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
  element.addEventListener('pointerdown',event=>{if(event.button===0)pointerInventoryDrag={slot,x:event.clientX,y:event.clientY,handled:false};});
  element.addEventListener('dragstart',event=>{
    if(!pointerInventoryDrag)pointerInventoryDrag={slot,x:event.clientX,y:event.clientY,handled:false};
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',JSON.stringify(slot));
    selectedInventoryItem=slot;
    element.classList.add('dragging');
  });
  element.addEventListener('dragend',event=>{
    element.classList.remove('dragging');
    finishInventoryDrag(pointerInventoryDrag,event.clientX,event.clientY);
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
  finishInventoryDrag(pending,event.clientX,event.clientY);
  if(pointerInventoryDrag===pending)pointerInventoryDrag=null;
});
function chooseInventoryItem(slot){selectedInventoryItem=slot;renderInventory();}
function putInventoryItem(index,slot,fromIndex=null){
  if(!hotbar.place(index,slot,inventory,fromIndex))return;
  selectedInventoryItem=null;
  selectHotbar(hotbar.selected);
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
    if(slot){const recipe=RECIPES.find(r=>r.id===slot.id);if(recipe)cell.append(itemImage(recipe));else {const icon=document.createElement('span');icon.className='food-icon';icon.textContent=slot.id==='cookedFish'?'🐟':'🍖';cell.append(icon);}label.textContent=recipe?.name||resourceName(slot.id);cell.append(label);
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
    cell.addEventListener('click',()=>{if(selectedInventoryItem)putInventoryItem(index,selectedInventoryItem,selectedInventoryItem.fromIndex??null);else selectHotbar(index);});
    cell.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();cell.click();}});
    host.append(cell);
  });
}
function openFire(fire){openCampfire=fire;setModal('campfireModal',true);renderCampfire();}
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
  $('addFishButton').disabled=inventory.resources.rawFish<1;
  $('collectFishButton').disabled=openCampfire.cookedFish<1;
}
function mineCampfire(fire){
  if(Math.hypot(fire.x-player.x,fire.y-player.y)>fire.radius+145){showToast('Move closer to the campfire');return;}
  const result=fire.mine(inventory.equippedTool,performance.now());if(!result.ok){if(!result.cooldown)showToast(result.message);return;}
  player.swingUntil=performance.now()+250;
  if(result.removed){inventory.structures.campfire++;if(fire.fuel>=4)inventory.add('wood',Math.floor(fire.fuel/4));if(fire.rawMeat)inventory.add('meat',fire.rawMeat);if(fire.cookedMeat)inventory.add('cookedMeat',fire.cookedMeat);if(fire.rawFish)inventory.add('rawFish',fire.rawFish);if(fire.cookedFish)inventory.add('cookedFish',fire.cookedFish);structures.remove(fire);showToast('Campfire recovered into your bag');renderInventory();renderHotbar();worldBridge.publishInteraction({kind:'mine-structure',targetId:fire.id,x:player.x,y:player.y,layer});}
  else showToast(`Campfire: ${result.remaining} hits remaining`,900);
}
function placeCampfire(point){
  if((inventory.structures.campfire||0)<1){showToast('Craft another campfire');return;}
  const distance=Math.hypot(point.x-player.x,point.y-player.y);
  if(distance>190||distance<55){showToast('Place the campfire on nearby open ground');return;}
  if(!canWalk(point.x,point.y,layer,52)||structures.blocks(point.x,point.y,layer,95)||nearestPortal(point.x,point.y,layer,145)){showToast('Choose open ground away from structures, water, and entrances');return;}
  inventory.structures.campfire--;const fire=structures.add(new Campfire(point.x,point.y,layer));renderInventory();renderHotbar();showToast('Campfire placed · click it to add fuel and food');worldBridge.publishInteraction({kind:'place-structure',targetId:fire.id,x:point.x,y:point.y,layer});
}
function interact(){
  if(fishing.active){finishFishing();return;}
  const drop=drops.nearest(player.x,player.y,layer,performance.now());
  if(drop){drops.collect(drop);inventory.add(drop.resource,drop.amount);showToast(`Picked up ${drop.amount} ${drop.resource}`);renderInventory();renderCrafting();updateHud();worldBridge.publishInteraction({kind:'pickup-loot',targetId:drop.id,resource:drop.resource,amount:drop.amount,x:player.x,y:player.y,layer});return;}
  const portal=nearestPortal(player.x,player.y,layer);
  if(portal){transition();return;}
  const fire=structures.nearest(player.x,player.y,layer);
  if(fire){openFire(fire);return;}
  const node=spawnables.nearest(player.x,player.y,layer);
  if(node&&['ground','bush'].includes(node.kind))gather(node);
}
function transition(){
  const p=nearestPortal(player.x,player.y,layer);
  if(!p||performance.now()-lastTransition<600)return;
  const from=layer;
  fishing.cancel();
  layer=portalDestination(p,layer);
  projectiles.clear();
  player.layer=layer;player.jumpActive=false;player.jumpHeight=0;const dest=p[layer];player.x=dest.x;player.y=dest.y;camera.x=player.x+camera.lookX;camera.y=player.y+camera.lookY;
  lastTransition=performance.now();selectedZone=null;refreshZonePanel();drawFullMap();renderer.drawOverview($('minimap'),layer,player,zones,showZones);
  worldBridge.publishInteraction({kind:from==='surface'?'enter-cave':layer==='surface'?'exit-cave':Object.keys(LAYERS).indexOf(layer)>Object.keys(LAYERS).indexOf(from)?'descend-cave':'ascend-cave',targetId:p.id,x:player.x,y:player.y,layer});
}
function handleKey(event,down){
  if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;
  const key=event.key.toLowerCase();
  if([' ','+','-','='].includes(key)||key==='f3'||CARDINAL_DIRECTIONS[key]||/^[1-7]$/.test(key))event.preventDefault();
  if(down){
    if(keys.has(key))return;
    if(CARDINAL_DIRECTIONS[key]||key==='shift'||key==='alt')keys.add(key);
    if(CARDINAL_DIRECTIONS[key]&&!modalOpen())player.facing=keyboardFacing(keys,player.facing);
    if(key==='e'&&!modalOpen())interact();
    if(key===' '&&!event.repeat&&!modalOpen())startJump(player);
    if(key==='h'&&!modalOpen())eatMeat();
    if(/^[1-6]$/.test(key)&&!modalOpen())selectHotbar(Number(key)-1);
    if(key==='7'&&!event.repeat){renderBeta();setModal('betaModal',$('betaModal').classList.contains('hidden'));}
    if(key==='c')setModal('craftModal',$('craftModal').classList.contains('hidden'));
    if(key==='i')setModal('inventoryModal',$('inventoryModal').classList.contains('hidden'));
    if(key==='p')setHud('pouchCard',hudVisible.pouchCard===false);
    if(key==='o')setModal('settingsModal',$('settingsModal').classList.contains('hidden'));
    if(key==='m')setModal('mapModal',$('mapModal').classList.contains('hidden'));
    if(key==='f3')setZoneOverlay(!showZones);
    if(key==='escape')document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));
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

activate($('mapButton'),()=>setModal('mapModal',true));
activate($('settingsButton'),()=>setModal('settingsModal',true));
activate($('pouchButton'),()=>setHud('pouchCard',hudVisible.pouchCard===false));
activate($('showAllHudButton'),()=>hudIds.forEach(id=>setHud(id,true)));
document.querySelectorAll('[data-hud]').forEach(input=>input.addEventListener('change',()=>setHud(input.dataset.hud,input.checked)));
activate($('eatMeatButton'),eatMeat);
activate($('eatFishButton'),()=>eatFood('cookedFish'));
activate($('addFuelButton'),()=>{if(openCampfire?.addFuel(inventory)){renderCampfire();renderInventory();renderCrafting();showToast('Added wood fuel');worldBridge.publishInteraction({kind:'fuel-campfire',targetId:openCampfire.id,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('addRawButton'),()=>{if(openCampfire?.addMeat(inventory)){renderCampfire();renderInventory();renderCrafting();showToast('Added raw meat');worldBridge.publishInteraction({kind:'load-campfire',targetId:openCampfire.id,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('collectCookedButton'),()=>{const amount=openCampfire?.collect(inventory)||0;if(amount){renderCampfire();renderInventory();renderHotbar();showToast(`Collected ${amount} cooked meat · assign it in inventory`);worldBridge.publishInteraction({kind:'collect-cooked-meat',targetId:openCampfire.id,amount,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('addFishButton'),()=>{if(openCampfire?.addFish(inventory)){renderCampfire();renderInventory();renderCrafting();showToast('Added raw fish');worldBridge.publishInteraction({kind:'load-campfire-fish',targetId:openCampfire.id,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('collectFishButton'),()=>{const amount=openCampfire?.collectFish(inventory)||0;if(amount){renderCampfire();renderInventory();renderHotbar();showToast(`Collected ${amount} cooked fish`);worldBridge.publishInteraction({kind:'collect-cooked-fish',targetId:openCampfire.id,amount,x:openCampfire.x,y:openCampfire.y,layer});}});
activate($('craftTab'),()=>setCraftTab('craft'));
activate($('indexTab'),()=>setCraftTab('index'));
$('indexSearch').addEventListener('input',renderItemIndex);
activate($('helpButton'),()=>setModal('helpModal',true));
activate($('craftButton'),()=>setModal('craftModal',true));
activate($('craftToolbarButton'),()=>setModal('craftModal',true));
activate($('inventoryButton'),()=>setModal('inventoryModal',true));
activate($('inventoryCraftButton'),()=>setModal('craftModal',true));
activate($('zonesButton'),()=>setZoneOverlay(!showZones));
activate($('zoneClose'),()=>setZoneOverlay(false));
document.querySelectorAll('[data-close]').forEach(b=>activate(b,()=>setModal(b.dataset.close,false)));
document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)setModal(m.id,false);}));

function itemName(id){return RECIPES.find(r=>r.id===id)?.name||'None';}
function renderInventory(){
  const effect=currentEffects();
  for(const resource of RESOURCES){const counter=$(`count${resource[0].toUpperCase()+resource.slice(1)}`);if(counter){counter.textContent=inventory.resources[resource];counter.parentElement.classList.toggle('hidden',inventory.resources[resource]<=0);}}
  const extras=$('extraResources');extras.replaceChildren();
  for(const resource of visibleResources(inventory).filter(r=>!['leaves','sticks','wood','stone','iron','meat','hide','bone'].includes(r))){const chip=document.createElement('span');chip.textContent=`${resourceName(resource)} ${inventory.resources[resource]}`;extras.append(chip);}
  extras.classList.toggle('hidden',extras.childElementCount===0);
  $('pouchEmpty').classList.toggle('hidden',visibleResources(inventory).length>0);
  $('equippedTool').textContent=inventory.equippedTool?`${itemName(inventory.equippedTool.id)} · ${scaledWeaponDamage(inventory.equippedTool,effect.stats.power)} dmg`:'Bare hands · 1 dmg';
  $('equippedGear').textContent=inventory.equippedGear?`${itemName(inventory.equippedGear.id)} · ${armorReduction(inventory.equippedGear,effect.stats.defense)} block`:'None';
  $('bagResources').replaceChildren();
  for(const resource of visibleResources(inventory)){
    const edible=['cookedMeat','cookedFish'].includes(resource);
    const chip=document.createElement(edible?'button':'span');chip.textContent=`${resourceName(resource)} ${inventory.resources[resource]}`;
    if(edible){
      chip.type='button';chip.className='inventory-drag-item';
      const slot={kind:'resource',id:resource};inventoryDragSource(chip,slot);
      chip.addEventListener('click',()=>chooseInventoryItem(slot));
    }
    $('bagResources').append(chip);
  }
  $('bagResourcesEmpty').classList.toggle('hidden',$('bagResources').childElementCount>0);
  $('eatMeatButton').classList.toggle('hidden',inventory.resources.cookedMeat<1);
  $('eatMeatButton').disabled=inventory.resources.cookedMeat<1||vitals.health>=vitals.maxHealth;
  $('eatFishButton').classList.toggle('hidden',inventory.resources.cookedFish<1);
  $('eatFishButton').disabled=inventory.resources.cookedFish<1||vitals.health>=vitals.maxHealth;
  const weapons=$('ownedWeapons'),armor=$('ownedArmor');weapons.replaceChildren();armor.replaceChildren();
  let weaponCount=0,armorCount=0;
  for(const [id,item] of inventory.owned){
    const recipe=RECIPES.find(r=>r.id===id),equipped=inventory.equippedTool?.id===id||inventory.equippedGear?.id===id;
    const card=document.createElement('div');card.className=`recipe-card owned ${equipped?'equipped':''}`;
    const info=document.createElement('div'),title=document.createElement('h3'),detail=document.createElement('p'),button=document.createElement('button');
    title.textContent=recipe.name;detail.textContent=`${recipe.tier} ${recipe.category==='gear'?'armor':recipe.type} · ${recipe.category==='gear'?`${item.defense} damage blocked · ${ARMOR_PERKS[id]?`${ARMOR_PERKS[id].stat} ${perkPercent(ARMOR_PERKS[id].base)}`:''}`:`${item.damage} damage`} · ${equipped?'equipped':'in bag'}`;
    if(recipe.category==='gear'){
      button.textContent=equipped?'Unequip':'Equip';
      activate(button,()=>{if(equipped)inventory.unequip(id);else inventory.equip(id);currentEffects();renderInventory();renderCrafting();updateHud();});
    }else{
      button.textContent='Select';
      const slot={kind:'equipment',id};inventoryDragSource(card,slot);
      activate(button,()=>chooseInventoryItem(slot));
      if(selectedInventoryItem?.kind===slot.kind&&selectedInventoryItem.id===id)card.classList.add('inventory-picked');
    }
    info.append(title,detail);card.append(itemImage(recipe),info,button);
    if(recipe.category==='gear'){armor.append(card);armorCount++;}else{weapons.append(card);weaponCount++;}
  }
  $('weaponsEmpty').classList.toggle('hidden',weaponCount>0);$('armorEmpty').classList.toggle('hidden',armorCount>0);
  $('perkSummary').textContent=effect.perk?`${effect.perk.biome} ${effect.perk.stat}: ${perkPercent(effect.stats[effect.perk.stat])}. Matching tools crafted: ${effect.crafted}/${effect.total}. ${effect.boosted?'Full-set boost active.':effect.fullSet?'Equip one of the matching tools for the full-set boost.':'Craft every listed matching tool to unlock a stronger perk.'}`:'Equip armor to activate its biome perk.';
  const structureHost=$('ownedStructures');structureHost.replaceChildren();
  const count=inventory.structures.campfire||0;$('structuresEmpty').classList.toggle('hidden',count>0);
  if(count>0){const card=document.createElement('div'),label=document.createElement('span'),button=document.createElement('button'),slot={kind:'structure',id:'campfire'};card.className='recipe-card';label.textContent=`Campfire kits: ${count}`;button.textContent='Select';inventoryDragSource(card,slot);activate(button,()=>chooseInventoryItem(slot));if(selectedInventoryItem?.kind===slot.kind&&selectedInventoryItem.id===slot.id)card.classList.add('inventory-picked');card.append(itemImage(RECIPES.find(r=>r.id==='campfire')),label,button);structureHost.append(card);}
  renderInventoryHotbar();
}
function renderCrafting(){
  const list=$('recipeList');list.replaceChildren();
  for(const [category,heading] of [['tool','Weapons & Tools'],['gear','Armor'],['structure','Structures']]){
  const section=document.createElement('section'),titleSection=document.createElement('h3'),grid=document.createElement('div');section.className='craft-section';titleSection.textContent=heading;grid.className='recipe-list';section.append(titleSection,grid);list.append(section);
  for(const recipe of RECIPES.filter(r=>r.category===category)){
    const card=document.createElement('div');card.className='recipe-card';
    const owned=inventory.owned.has(recipe.id),equipped=inventory.equippedTool?.id===recipe.id||inventory.equippedGear?.id===recipe.id;
    if(owned)card.classList.add('owned');if(equipped)card.classList.add('equipped');
    const info=document.createElement('div'),title=document.createElement('h3'),tier=document.createElement('span'),description=document.createElement('p'),cost=document.createElement('small'),button=document.createElement('button');
    title.textContent=recipe.name;tier.className='tier-tag';tier.textContent=`${recipe.tier} · Lv ${recipe.level}`;title.append(tier);
    const perk=ARMOR_PERKS[recipe.id];
    description.textContent=recipe.detail+(perk?` ${perk.biome}: ${perkPercent(perk.base)} ${perk.stat}; ${perkPercent(1+(perk.base-1)*1.5)} with complete tool set and matching tool equipped.`:'');cost.textContent=Object.entries(recipe.cost).map(([r,n])=>`${n} ${r}`).join(' · ')+(recipe.requires?` · Requires ${itemName(recipe.requires)}`:'')+(perk?` · Set: ${perk.tools.map(itemName).join(', ')}`:'');
    button.textContent=!owned&&inventory.progression.level<recipe.level?`Level ${recipe.level}`:recipe.category==='structure'?'Craft':owned?'Inventory':'Craft';button.disabled=!owned&&!inventory.canCraft(recipe);
    activate(button,()=>{
      if(owned){setModal('inventoryModal',true);return;}
      else {const result=inventory.craft(recipe.id);showToast(result.ok?`Crafted ${recipe.name} · open inventory to equip or assign`:result.message);}
      renderInventory();renderCrafting();renderHotbar();
    });
    info.append(title,description,cost);card.append(itemImage(recipe),info,button);grid.append(card);
  }
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
  const entries=indexEntries(inventory).filter(entry=>!query||`${entry.name} ${entry.source} ${entry.detail} ${entry.recipe?.tier||''}`.toLowerCase().includes(query));
  if(!entries.length){const empty=document.createElement('p');empty.textContent='No items match that search.';host.append(empty);return;}
  for(const group of ['Resources','Weapons & Tools','Armor','Structures']){
    const matching=entries.filter(entry=>entry.group===group);if(!matching.length)continue;
    const section=document.createElement('section'),heading=document.createElement('h3'),grid=document.createElement('div');section.className='index-section';heading.textContent=group;grid.className='index-grid';section.append(heading,grid);host.append(section);
    for(const entry of matching){
      const card=document.createElement('article'),icon=entry.recipe?itemImage(entry.recipe):document.createElement('span'),body=document.createElement('div'),title=document.createElement('h4'),source=document.createElement('small'),detail=document.createElement('p'),count=document.createElement('strong');
      card.className='index-card';if(!entry.recipe){icon.className='index-resource-icon';icon.textContent=entry.symbol;}
      title.textContent=entry.name;source.textContent=entry.source;detail.textContent=entry.detail;
      if(entry.recipe){const cost=Object.entries(entry.recipe.cost).map(([id,n])=>`${n} ${resourceName(id)}`).join(' · ');detail.textContent+=` Craft: ${cost}.`;const perk=ARMOR_PERKS[entry.id];if(perk)detail.textContent+=` Perk: ${perkPercent(perk.base)} ${perk.stat}.`;
        count.textContent=entry.kind==='structure'?`${entry.count} carried`:entry.count?'Crafted':'Not crafted';}
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
function saveZones(rebuild=true){zones.save();if(rebuild){populateWorld(zones,spawnables);targetNode=null;}}
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
activate($('zoneReset'),()=>{if(!devMode)return;zones.reset();populateWorld(zones,spawnables);selectedZone=null;refreshZonePanel();});
activate($('zoneExport'),()=>{
  const blob=new Blob([zones.export()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='embervale-spawn-zones.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});

function mouseWorld(event){const r=canvas.getBoundingClientRect();return renderer.screenToWorld(event.clientX-r.left,event.clientY-r.top,camera,zoom);}
function finishFishing(){
  const result=fishing.reel(performance.now(),inventory);showToast(result.message);
  if(result.ok){renderInventory();renderCrafting();renderHotbar();updateHud();worldBridge.publishInteraction({kind:'catch-fish',resource:'rawFish',amount:1,x:player.x,y:player.y,layer});}
}
canvas.addEventListener('pointerdown',event=>{
  if(modalOpen())return;
  if(!showZones){if(event.button===0){const p=mouseWorld(event);const aimFacing=Math.atan2(p.y-player.y,p.x-player.x);
    const fire=structures.at(p.x,p.y,layer);if(fire){if(inventory.equippedTool?.type==='pickaxe')mineCampfire(fire);else if(Math.hypot(fire.x-player.x,fire.y-player.y)<fire.radius+145)openFire(fire);else showToast('Move closer to the campfire');return;}
    const node=spawnables.at(p.x,p.y,layer);if(node){gather(node);return;}
    if(hotbar.current?.kind==='structure'&&hotbar.current.id==='campfire'){placeCampfire(p);return;}
    if(fishing.active&&Math.hypot(p.x-fishing.castPoint.x,p.y-fishing.castPoint.y)<65){finishFishing();return;}
    if(lakeAt(p.x,p.y)){const result=fishing.cast(player,inventory.equippedTool,p,performance.now());showToast(result.message);if(result.ok)worldBridge.publishInteraction({kind:'cast-line',targetId:fishing.lake.id,x:p.x,y:p.y,layer});return;}
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
    updateJump(player,dt);
    player.moving=false;
    const {dx,dy}=movementVector({keys,sprinting:keys.has('shift'),betaBoost:keys.has('alt'),speedMultiplier:currentEffects().stats.speed,dt});
    if(dx||dy){
      const beforeX=player.x,beforeY=player.y;
      // Small steps preserve hut, river, and cave-wall collision at beta speed.
      const steps=Math.ceil(Math.hypot(dx,dy)/18);
      for(let i=0;i<steps;i++){
        const sx=dx/steps,sy=dy/steps;
        if(canWalk(player.x+sx,player.y,layer,PLAYER_RADIUS)&&!structures.blocks(player.x+sx,player.y,layer,PLAYER_RADIUS))player.x+=sx;
        if(canWalk(player.x,player.y+sy,layer,PLAYER_RADIUS)&&!structures.blocks(player.x,player.y+sy,layer,PLAYER_RADIUS))player.y+=sy;
      }
      player.moving=Math.hypot(player.x-beforeX,player.y-beforeY)>.01;
    }
  }else player.moving=false;
  structures.update(dt);
  if(openCampfire&&!$('campfireModal').classList.contains('hidden')&&now-lastHud>170)renderCampfire();
  if(!modalOpen()){
    const hurt=(damage,source)=>{
      const result=vitals.takeDamage(damage,inventory.equippedGear,now,currentEffects().stats.defense);
      if(result.damage){showToast(`${source} hit you · −${result.damage} health`,900);updateHud();}
      if(result.dead){vitals.respawn(now);fishing.cancel();layer='surface';player.layer=layer;player.jumpActive=false;player.jumpHeight=0;player.x=SURFACE.spawn.x;player.y=SURFACE.spawn.y;camera.lookX=0;camera.lookY=0;camera.x=player.x;camera.y=player.y;projectiles.clear();showToast('You fell in the caves and returned to the village',3500);worldBridge.publishInteraction({kind:'respawn',x:player.x,y:player.y,layer});}
      return result.dead;
    };
    let defeated=false;
    for(const strike of creatures.update(dt,now,player,canWalk)){
      if(strike.projectile)projectiles.launch(strike.projectile,strike.creature.id,now);
      else if(hurt(strike.damage,strike.creature.name)){defeated=true;break;}
    }
    if(!defeated)for(const hit of projectiles.update(dt,now,player)){if(hurt(hit.damage,'Scorpion rock'))break;}
    drops.update(now);
  }
  const fishUpdate=fishing.update(now,player);if(fishUpdate)showToast(fishUpdate);
  const zoomingIn=targetZoom>zoom+.001;
  const follow=1-Math.exp(-dt*(zoomingIn?12:6)),zoomFollow=1-Math.exp(-dt*9),lookFollow=1-Math.exp(-dt*(zoomingIn?14:3.5));
  const look=mouseLookOffset(mouse,renderer.width,renderer.height,zoom,targetZoom);
  camera.lookX+=(look.x-camera.lookX)*lookFollow;
  camera.lookY+=(look.y-camera.lookY)*lookFollow;
  camera.x+=(player.x+camera.lookX-camera.x)*follow;
  camera.y+=(player.y+camera.lookY-camera.y)*follow;
  zoom+=(targetZoom-zoom)*zoomFollow;
  if(now-lastRespawn>1000){spawnables.update(now);lastRespawn=now;}
  if(now-lastPosition>100&&(player.moving||Math.abs(Math.atan2(Math.sin(player.facing-lastPublishedFacing),Math.cos(player.facing-lastPublishedFacing)))>.025)){
    worldBridge.publishPosition({x:Math.round(player.x),y:Math.round(player.y),layer,facing:player.facing});lastPosition=now;lastPublishedFacing=player.facing;
  }
  if(now-lastHud>170){updateHud();lastHud=now;}
  if(now-lastMap>700){renderer.drawOverview($('minimap'),layer,player,zones,showZones);lastMap=now;}
}
function updateHud(){
  const progress=inventory.progression,maxLevel=progress.level>=20;
  $('levelStatus').textContent=`LEVEL ${progress.level}`;
  $('xpText').textContent=maxLevel?'MAX LEVEL':`${progress.xp} / ${progress.required} XP`;
  $('xpFill').style.width=`${maxLevel?100:Math.min(100,100*progress.xp/progress.required)}%`;
  const xpTrack=$('xpTrack');xpTrack.setAttribute('aria-valuemax',String(maxLevel?1:progress.required));xpTrack.setAttribute('aria-valuenow',String(maxLevel?1:progress.xp));
  xpTrack.setAttribute('aria-valuetext',maxLevel?'Maximum level':`${progress.xp} of ${progress.required} experience to level ${progress.level+1}`);
  const effect=currentEffects();
  $('healthText').textContent=`${vitals.health} / ${vitals.maxHealth}`;
  $('healthFill').style.width=`${100*vitals.health/vitals.maxHealth}%`;
  $('armorText').textContent=`${inventory.equippedGear?itemName(inventory.equippedGear.id):'No armor'} · ${armorReduction(inventory.equippedGear,effect.stats.defense)} damage blocked`;
  $('perkText').textContent=effect.perk?`${effect.perk.biome} ${effect.perk.stat} ${perkPercent(effect.stats[effect.perk.stat])}${effect.boosted?' · set boost':''}`:'No armor perk';
  const biome=biomeAt(player.x,player.y,layer),place=nearbyPlace(player.x,player.y,layer);
  $('placeName').textContent=place;$('biomeName').textContent=`${biome.name} · ${LAYER_NAMES[layer]}`;
  $('coords').textContent=`${Math.round(player.x).toLocaleString()} · ${Math.round(player.y).toLocaleString()}`;
  const map=LAYERS[layer];$('mapSize').textContent=`${(map.width/1000).toFixed(map.width%1000?1:0)}k × ${(map.height/1000).toFixed(map.height%1000?1:0)}k units`;
  const p=nearestPortal(player.x,player.y,layer);
  targetDrop=drops.nearest(player.x,player.y,layer,performance.now());
  const nearFire=p||targetDrop?null:structures.nearest(player.x,player.y,layer);
  targetNode=p||targetDrop||nearFire?null:spawnables.nearest(player.x,player.y,layer);
  $('portalPrompt').classList.toggle('hidden',!fishing.active&&!p&&!targetDrop&&!targetNode&&!nearFire);
  $('actionKey').textContent=targetNode&&!['bush','ground'].includes(targetNode.kind)?'CLICK':'E';
  if(fishing.active){$('actionKey').textContent='E';$('portalText').textContent=fishing.ready?'Fish biting · reel in now':'Fishing · wait for a bite';}
  else if(targetDrop)$('portalText').textContent=`Pick up ${targetDrop.amount} ${targetDrop.resource}`;
  else if(p)$('portalText').textContent=`Travel to ${LAYER_NAMES[portalDestination(p,layer)]} · ${p.name}`;
  else if(nearFire)$('portalText').textContent='Open campfire · cook meat or fish';
  else if(targetNode){const n=targetNode;$('portalText').textContent=n.kind==='bush'?'Forage Bush · sticks + leaves':n.kind==='ground'?`Pick up ${n.label}`:`${n.kind==='tree'?'Chop':'Mine'} ${n.label} · ${n.quantity}/${n.maxQuantity} · ${n.kind==='tree'?'axe':`${n.rarity?`${n.rarity} · `:''}${['obsidian','moonstone'].includes(n.resource)?'iron pickaxe':'pickaxe'}`} needed`;}
}
function drawFullMap(){if($('mapModal').classList.contains('hidden'))return;$('atlasTitle').textContent=LAYER_NAMES[layer];renderer.drawOverview($('fullMap'),layer,player,zones,showZones);}
let frameWork=0;
function frame(now){
  const workStart=performance.now();
  const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
  update(dt,now);renderer.render({camera,zoom,player,layer,zones,showZones,selectedZone,editZones:devMode,spawnables,structures,creatures,drops,projectiles,fishing,targetNode,targetDrop,inventory,time:now});
  frameWork+=performance.now()-workStart;fpsFrames++;
  if(now-fpsStart>=1000){$('perfStats').textContent=`${Math.round(fpsFrames*1000/(now-fpsStart))} FPS · ${(frameWork/fpsFrames).toFixed(1)} ms/frame · ${layer} · ${zoom.toFixed(2)}× zoom · terrain ${renderer.art.worker?'worker':'fallback'}`;fpsFrames=0;frameWork=0;fpsStart=now;}
  requestAnimationFrame(frame);
}
function renderBeta(){ $('betaLevel').textContent=`Level ${inventory.progression.level} · ${inventory.progression.xp}/${inventory.progression.required} XP`; }
function refreshBeta(){renderBeta();renderInventory();renderCrafting();renderHotbar();updateHud();}
for(const amount of [1,5])activate($(amount===1?'betaLevelOne':'betaLevelFive'),()=>{inventory.progression.upgrade(amount);$('betaFeedback').textContent=`Upgraded to level ${inventory.progression.level}`;refreshBeta();});
for(const [label,items] of [['Resources',RESOURCES.map(id=>({id,name:resourceName(id)}))],['Equipment & structures',RECIPES]]){const group=document.createElement('optgroup');group.label=label;for(const item of items){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;group.append(option);}$('betaItem').append(group);}
activate($('betaGive'),()=>{grantBetaItem(inventory,$('betaItem').value,$('betaQuantity').value);$('betaFeedback').textContent=`Added ${$('betaItem').selectedOptions[0].textContent}`;refreshBeta();});
activate($('betaSupplies'),()=>{for(const id of RESOURCES)inventory.add(id,50);$('betaFeedback').textContent='Added 50 of every resource';refreshBeta();});

renderInventory();renderCrafting();renderHotbar();updateHud();renderer.drawOverview($('minimap'),layer,player,zones,showZones);requestAnimationFrame(frame);
if(!startPortal&&layer==='surface')showToast('Click bushes and stones → C: craft an axe → 1–6: hotbar',6000);
