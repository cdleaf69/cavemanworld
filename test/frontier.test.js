import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory,RECIPES,RESOURCES} from '../src/crafting.js';
import {Tool,Gear,ResourceNode,SpawnableRegistry} from '../src/spawnables.js';
import {SpawnZoneManager,defaultZones} from '../src/spawn-zones.js';
import {StructureRegistry} from '../src/structures.js';
import {PlayerVitals} from '../src/combat.js';
import {DivingSession,StatusEffects,QuestBook,NpcRegistry,FrontierNodes,FISHERMAN_QUESTS,NPC_APPEARANCES} from '../src/expeditions.js';
import {FrontierStructure,structurePlacement} from '../src/frontier-structures.js';
import {FISH_SPECIES,fishCount,consumeFish,chooseFish,fishLimit} from '../src/fish-species.js';
import {resourcePrice} from '../src/town-services.js';
import {armorEffects} from '../src/perks.js';
import {MOUNTAINS,FISHERMAN,coastline,altitudeAt,elevationOffset,plateauAt,unprojectMountainPoint} from '../src/frontier-world.js';
import {SURFACE,canWalk,PATHS,TOWN_BUILDINGS} from '../src/world.js';
import {Bigfoot,populateFrontierCreatures} from '../src/frontier-creatures.js';
import {CreatureRegistry} from '../src/creatures.js';
import {RockProjectile,PlayerProjectile} from '../src/combat-objects.js';
import {Hotbar} from '../src/hotbar.js';
const item=id=>RECIPES.find(r=>r.id===id);
const fullBag=()=>{const inv=new Inventory({level:20});for(const id of RESOURCES)inv.add(id,200);return inv;};

test('eighteen fish increase in size and sale value; higher catches need rod and depth progression',()=>{
 assert.equal(FISH_SPECIES.length,18);let length=0,price=0;
 for(const f of FISH_SPECIES){assert.ok(f.length>length);assert.ok(f.value>price);assert.equal(resourcePrice(f.id),f.value);length=f.length;price=f.value;}
 assert.equal(fishLimit(),4);assert.equal(fishLimit({quest:9,rodRank:6,depth:4}),18);
 assert.ok(chooseFish({},()=>.999).rank<=4);assert.equal(chooseFish({quest:10,rodRank:6,depth:4},()=>.999).rank,18);
 const inv=new Inventory();inv.add(FISH_SPECIES[0].id,20);inv.add(FISH_SPECIES[13].id,2);assert.equal(fishCount(inv,12),2);assert.equal(consumeFish(inv,3,12),false);assert.equal(inv.resources[FISH_SPECIES[13].id],2);assert.equal(consumeFish(inv,2,12),true);assert.equal(inv.resources[FISH_SPECIES[0].id],20);
});
test('fisherman has ten completable sequential quests; final armor is not craftable or auto equipped',()=>{
 const inv=fullBag(),book=new QuestBook();assert.equal(FISHERMAN_QUESTS.length,10);assert.equal(inv.craft('tidekeeper-armor').ok,false);
 Object.assign(book.proof,{treasures:3,deepTreasures:5,reefCrab:5,seaPredators:3});
 for(let i=0;i<10;i++){assert.equal(book.fisherman,i);assert.ok(book.ready(FISHERMAN,inv));assert.ok(book.claim(FISHERMAN,inv).ok);if(i<9)assert.equal(inv.owned.has('tidekeeper-armor'),false);}
 assert.ok(inv.owned.get('tidekeeper-armor') instanceof Gear);assert.equal(inv.equippedGear,null);assert.equal(inv.equippedTool,null);assert.equal(inv.fishingQuest,10);const coins=inv.coins;assert.equal(book.claim(FISHERMAN,inv).ok,false);assert.equal(inv.coins,coins);
 const hotbar=new Hotbar();assert.equal(hotbar.allowed({kind:'equipment',id:'tidekeeper-armor'},inv),false);
});
test('NPCs retain the humanoid model with distinct appearances and valid woodland/cave positions',()=>{
 const npcs=new NpcRegistry();assert.ok(npcs.items.filter(n=>n.role==='woods').length>=5);assert.ok(npcs.items.filter(n=>n.role==='cave').length>=12);
 assert.ok(new Set(NPC_APPEARANCES.map(n=>n.skin+':'+n.hair+':'+n.shirt)).size>=7);
 for(const n of npcs.items)assert.ok(canWalk(n.x,n.y,n.layer,20),n.id);
 const book=new QuestBook(),n=npcs.items.find(n=>n.role==='woods');assert.equal(book.task(n).name,'Trail Supplies');book.steps[n.id]=2;assert.equal(book.task(n).name,'The Summit Expedition');assert.equal(book.task(n).proof.mountainBoss,1);
 const p={x:n.x+300,y:n.y,layer:n.layer},before={x:n.x,y:n.y};npcs.update(1,1000,p);assert.ok(n.x!==before.x||n.y!==before.y);
});
test('diving drains breath, drowns without air, refills at surface and respects breathing armor',()=>{
 const inv=new Inventory(),d=new DivingSession(),p={x:coastline(14500)+1000,y:14500,layer:'surface'};assert.ok(d.canDive(p));d.update(4.1,p,inv);assert.ok(d.wetTime>4);
 p.layer='ocean';assert.equal(d.update(34,p,inv),0);assert.equal(d.breath,1);assert.equal(d.update(2,p,inv),8);assert.equal(d.breath,0);
 p.layer='surface';d.update(3,p,inv);assert.equal(d.breath,35);
 inv.owned.set('diver-wrap',new Gear(item('diver-wrap')));inv.equip('diver-wrap');d.update(3,p,inv);assert.equal(d.maxBreath,70);assert.equal(d.breath,70);
 inv.owned.set('tidekeeper-armor',new Gear(item('tidekeeper-armor')));inv.equip('tidekeeper-armor');p.layer='ocean';assert.equal(d.update(300,p,inv),0);assert.equal(d.breath,35);
});
test('marijuana harvest is usually one, rarely three; processing takes thirty seconds each and boosts only sixty seconds',()=>{
 const nodes=new FrontierNodes(),inv=new Inventory(),quests=new QuestBook(),plants=nodes.items.filter(n=>n.kind==='marijuana');assert.equal(plants.length,MOUNTAINS.length*6);
 for(const [i,rng,n] of [[0,()=>0,1],[1,()=>.90,2],[2,()=>.99,3]]){const before=inv.resources.rawMarijuana;nodes.collect(plants[i],inv,quests,1000,rng);assert.equal(inv.resources.rawMarijuana-before,n);}
 inv.add('wood',1);const shack=new FrontierStructure('drying-shack',0,0,'surface');assert.ok(shack.addFuel(inv));assert.ok(shack.addInput(inv));assert.ok(shack.addInput(inv));shack.update(29.99);assert.equal(shack.storage.driedMarijuana,undefined);shack.update(.01);assert.equal(shack.storage.driedMarijuana,1);shack.update(30);assert.equal(shack.storage.driedMarijuana,2);shack.collect(inv);
 const effects=new StatusEffects();assert.ok(effects.use(inv,1000));const boosted=effects.apply(inv,armorEffects(inv),1000);assert.equal(boosted.stats.health,1.5);inv.progression.gain(10);assert.equal(inv.progression.xp,15);assert.equal(effects.active(60999),true);assert.equal(effects.active(61000),false);effects.apply(inv,armorEffects(inv),61000);assert.equal(inv.progression.multiplier,1);
 const v=new PlayerVitals();v.setMaxHealth(150);assert.equal(v.health,150);v.takeDamage(20,null,1000);v.setMaxHealth(100);assert.equal(v.health,87);
});
test('three inland mountains have walkable climb routes and flat summits; buildings and ordinary construction stay off slopes',()=>{
 assert.equal(SURFACE.width*SURFACE.height,90000*63000*2);assert.equal(MOUNTAINS.length,3);const structures=new StructureRegistry();
 for(const m of MOUNTAINS){assert.equal(altitudeAt(m.x,m.y),m.height);assert.ok(plateauAt(m.x,m.y));assert.ok(canWalk(m.x,m.y,'surface'));assert.ok(structurePlacement('drying-shack',m,'surface',structures).ok);
  const slope={x:m.x,y:m.y+m.ry*.65};assert.equal(structurePlacement('drying-shack',slope,'surface',structures).ok,false);
  for(let i=1;i<m.trail.length;i++){const a=m.trail[i-1],b=m.trail[i];for(let j=0;j<=20;j++){const t=j/20;assert.ok(canWalk(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,'surface',24),m.id);}}
  assert.ok(!TOWN_BUILDINGS.some(b=>Math.hypot((b.x-m.x)/m.rx,(b.y-m.y)/m.ry)<1));
  const y=m.y+m.ry*.6,p=unprojectMountainPoint({x:m.x,y:y-elevationOffset(m.x,y)});assert.ok(Math.abs(p.y-y)<1);
 }
});
test('exactly one boss guards each mountain with melee, feces and log attacks and delayed respawn',()=>{
 const registry=new CreatureRegistry();populateFrontierCreatures(registry);assert.equal(registry.creatures.filter(c=>c.boss).length,3);assert.ok(new Set(registry.creatures.filter(c=>c.aquatic).map(c=>c.kind)).size>=20);
 const boss=new Bigfoot(MOUNTAINS[0]),p={x:boss.x+500,y:boss.y,layer:'surface'};boss.update(.1,1000,p,()=>true);let result=boss.update(.1,1651,p,()=>true);assert.equal(result.projectile.kind,'feces');boss.update(.1,5000,p,()=>true);result=boss.update(.1,5651,p,()=>true);assert.equal(result.projectile.kind,'log');assert.equal(result.projectile.radius,28);assert.equal(result.projectile.lifetime,6000);
 p.x=boss.x+50;assert.equal(boss.update(.1,9000,p,()=>true).damage,34);const kill=boss.hit(1e6,10000);assert.ok(kill.dead);assert.ok(kill.loot.bigfootFur>0);boss.update(.1,609999,p,()=>true);assert.equal(boss.alive,false);boss.update(.1,610000,p,()=>true);assert.equal(boss.alive,true);
});
test('ocean treasure requires a single pickup and deep wreck proof cannot be farmed from the same chest',()=>{
 const nodes=new FrontierNodes(),inv=new Inventory(),book=new QuestBook(),n=nodes.items.find(n=>n.kind==='treasure'&&n.depth===3);assert.ok(canWalk(n.x,n.y,'ocean'));assert.ok(nodes.collect(n,inv,book,0).ok);assert.equal(inv.resources.sunkenRelic,1);assert.equal(book.proof.deepTreasures,1);assert.equal(nodes.collect(n,inv,book,1).ok,false);book.recordChest(n);assert.equal(book.proof.deepTreasures,1);nodes.update(1e9);assert.equal(n.active,false);
});
test('base walls and gates collide, floors remain passable, rotation matches collision and storage conserves resources',()=>{
 const registry=new StructureRegistry(),wall=registry.add(new FrontierStructure('stone-wall',1000,1000,'surface')),gate=registry.add(new FrontierStructure('wood-gate',1200,1000,'surface',Math.PI/2));assert.ok(registry.blocks(1000,1000,'surface'));assert.equal(gate.width,20);assert.equal(gate.height,104);assert.ok(registry.blocks(1200,1030,'surface'));gate.open=true;assert.equal(registry.blocks(1200,1000,'surface'),false);
 registry.add(new FrontierStructure('wood-floor',1500,1000,'surface'));assert.equal(registry.blocks(1500,1000,'surface'),false);
 const inv=new Inventory(),stash=new FrontierStructure('storage-chest',0,0,'surface');inv.add('wood',15);assert.ok(stash.deposit(inv,'wood'));assert.equal(inv.resources.wood,5);assert.equal(stash.storage.wood,10);assert.equal(stash.collect(inv),10);assert.equal(inv.resources.wood,15);assert.equal(stash.collect(inv),0);
});
test('machines use fuel, take actual finite nodes with crafted tools, and traps need bait',()=>{
 const inv=new Inventory({level:20}),nodes=new SpawnableRegistry(),tree=new ResourceNode({id:'tree',kind:'tree',resource:'wood',x:50,y:50,layer:'surface',quantity:3});nodes.addNode(tree);inv.owned.set('iron-axe',new Tool(item('iron-axe')));inv.add('wood',1);
 const rig=new FrontierStructure('timber-rig',0,0,'surface',0,{inventory:inv,spawnables:nodes,now:()=>1000});rig.update(100);assert.equal(tree.active,true);rig.addFuel(inv);rig.update(25);assert.equal(tree.active,false);assert.equal(rig.fuel,0);assert.equal(rig.storage.wood,8);assert.equal(inv.progression.xp,0);
 const trap=new FrontierStructure('fish-trap',0,0,'surface',0,{inventory:inv});trap.update(90);assert.deepEqual(trap.storage,{});inv.add('leaves',1);trap.addFuel(inv);trap.update(44.9);assert.deepEqual(trap.storage,{});trap.update(.1);assert.equal(Object.values(trap.storage).reduce((a,b)=>a+b,0),1);assert.equal(trap.fuel,0);
 const crystalDrill=new Tool(item('powered-drill'));assert.equal(crystalDrill.power,22);assert.equal(crystalDrill.yield,28);assert.ok(item('adamantite-pickaxe'));
});

test('built walls stop both hostile and player projectiles, and bosses cannot walk through them',()=>{
 const walls=new StructureRegistry();walls.add(new FrontierStructure('stone-wall',13080,8500,'surface'));
 const player={x:13400,y:8500,layer:'surface'},rock=new RockProjectile({x:13000,y:8500,angle:0,speed:340,damage:25,layer:'surface',createdAt:0});assert.equal(rock.update(.4,400,player,null,walls),null);assert.equal(rock.active,false);
 const arrow=new PlayerProjectile({x:13000,y:8500,point:{x:13400,y:8500},damage:20,layer:'surface',type:'bow',createdAt:0});assert.equal(arrow.update(.4,400,player,null,walls),null);assert.equal(arrow.active,false);
 const boss=new Bigfoot(MOUNTAINS[0]);boss.nextAttackAt=1e9;const x=boss.x,y=boss.y;walls.add(new FrontierStructure('stone-wall',x+150,y,'surface'));boss.update(1,1000,{x:x+500,y,layer:'surface'},(px,py,l,r)=>canWalk(px,py,l,r)&&!walls.blocks(px,py,l,r));assert.equal(boss.x,x);
});

test('lake and ocean catches respect species habitats, and only boats prevent automatic diving',()=>{
 for(const water of ['lake','ocean'])for(let i=0;i<100;i++){const f=chooseFish({water,quest:10,rodRank:6,depth:4},()=>i/100);assert.ok(f.habitat==='both'||f.habitat===(water==='lake'?'freshwater':'ocean'));}
 const d=new DivingSession(),inv=new Inventory(),p={x:coastline(14500)+1000,y:14500,layer:'surface',vehicle:{boat:true}};d.update(5,p,inv);assert.equal(d.wetTime,0);p.vehicle={glider:true};d.update(5,p,inv);assert.equal(d.wetTime,0);p.layer='ocean';d.maxBreath=70;d.breath=70;d.update(.1,p,inv);assert.ok(d.breath<=35);
});

test('editable frontier zones mask special resources without moving players or losing gathered-node state',()=>{
 const zones=new SpawnZoneManager(null),nodes=new FrontierNodes(zones),pine=zones.zones.find(z=>z.id==='summit-harvest-pinecrest');assert.equal(nodes.items.filter(n=>n.kind==='marijuana').length,18);
 pine.resources=pine.resources.filter(r=>r!=='rawMarijuana');nodes.reconcileZones();assert.equal(nodes.items.filter(n=>n.kind==='marijuana').length,12);pine.resources.push('rawMarijuana');nodes.reconcileZones();assert.equal(nodes.items.filter(n=>n.kind==='marijuana').length,18);
 const plant=nodes.items.find(n=>n.kind==='marijuana'),inv=new Inventory(),q=new QuestBook();nodes.collect(plant,inv,q,1000,()=>0);nodes.reconcileZones();assert.equal(nodes.items.find(n=>n.id===plant.id).active,false);
 const old=defaultZones().filter(z=>!z.id.startsWith('summit-harvest')&&z.id!=='ocean-harvest');const storage={getItem:key=>key.endsWith('v4')?JSON.stringify(old):null,setItem(){}};const migrated=new SpawnZoneManager(storage);assert.ok(migrated.zones.some(z=>z.id==='ocean-harvest'));assert.equal(migrated.zones.find(z=>z.id==='habitat-meadows').vertices[1].x,134970);
});
