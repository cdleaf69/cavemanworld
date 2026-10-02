import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory,RECIPES} from '../src/crafting.js';
import {TOWNS,TOWN_BUILDINGS,BUILDING_PORTALS,canWalk,nearestPortal,portalDestination} from '../src/world.js';
import {tradeResource,upgradeTool,clubQuality,HouseLoot,HOUSE_RESPAWN_MS} from '../src/town-services.js';
import {Creature} from '../src/creatures.js';
import {armorEffects} from '../src/perks.js';
import {heldToolPose} from '../src/player-animation.js';

test('four connected towns offer shops, forges and houses; casinos occur in two towns',()=>{
 assert.equal(TOWNS.length,4);assert.equal(TOWN_BUILDINGS.filter(b=>b.type==='casino').length,2);
 for(const t of TOWNS)for(const type of ['shop','smith','house'])assert.ok(TOWN_BUILDINGS.some(b=>b.town===t.id&&b.type===type));
 for(const p of BUILDING_PORTALS){for(const layer of Object.keys(p).filter(k=>typeof p[k]==='object')){assert.ok(canWalk(p[layer].x,p[layer].y,layer),p.id);assert.equal(nearestPortal(p[layer].x,p[layer].y,layer)?.id,p.id);assert.ok(p[portalDestination(p,layer)]);}const layer=portalDestination(p,'surface');assert.ok(canWalk(550,345,layer));if(TOWN_BUILDINGS.find(b=>b.id===p.id).type!=='casino')assert.equal(canWalk(550,225,layer),false);}
});
test('shop transactions conserve resources and reject overspending or overselling',()=>{
 const inv=new Inventory();inv.coins=60;assert.equal(tradeResource(inv,'wood',5,true).ok,true);assert.equal(inv.coins,40);assert.equal(inv.resources.wood,5);
 assert.equal(tradeResource(inv,'wood',5,false).ok,true);assert.equal(inv.coins,50);assert.equal(inv.resources.wood,0);
 assert.equal(tradeResource(inv,'wood',1,false).ok,false);assert.equal(tradeResource(inv,'adamantite',5,true).ok,false);assert.equal(inv.coins,50);assert.equal(tradeResource(inv,'stone',-1,false).ok,false);
});
function forgeInventory(club){const inv=new Inventory({level:20});for(const r of Object.keys(inv.resources))inv.resources[r]=100;inv.coins=1000;inv.craft('stone-axe');inv.craft(club);inv.equip(club);return inv;}
test('rare clubs improve forge odds and upgrades strengthen the same owned tool without auto-equipping',()=>{
 const rough=forgeInventory('wood-club'),master=forgeInventory('infernite-club');
 assert.ok(clubQuality(master.equippedTool).chances[2]>clubQuality(rough.equippedTool).chances[2]);
 assert.equal(upgradeTool(rough,'stone-axe',()=>.4).ok,true);assert.equal(rough.owned.get('stone-axe').upgradeQuality,'Rough');
 const before=master.owned.get('stone-axe').damage;assert.equal(upgradeTool(master,'stone-axe',()=>.4).ok,true);assert.equal(master.owned.get('stone-axe').upgradeQuality,'Masterwork');assert.ok(master.owned.get('stone-axe').damage>before);assert.equal(master.equippedTool.id,'infernite-club');
 upgradeTool(master,'stone-axe',()=>.9);upgradeTool(master,'stone-axe',()=>.9);const coins=master.coins;assert.equal(upgradeTool(master,'stone-axe').ok,false);assert.equal(master.coins,coins);
 master.equippedTool=null;assert.equal(upgradeTool(master,'infernite-club').ok,false);
});
test('each house chest refills exactly two minutes after collection and cannot be claimed twice',()=>{
 const houses=new HouseLoot(()=>.5),inv=new Inventory(),first=houses.peek('a',1000);assert.equal(first.collected,false);
 assert.ok(houses.collect('a',1000,inv).ok);const coins=inv.coins;assert.equal(houses.collect('a',1001,inv).ok,false);assert.equal(inv.coins,coins);
 assert.equal(houses.peek('a',1000+HOUSE_RESPAWN_MS-1).collected,true);assert.equal(houses.peek('a',1000+HOUSE_RESPAWN_MS).collected,false);
 assert.equal(houses.peek('b',1001).collected,false);assert.ok(houses.collect('a',121000,inv).ok);
});
test('cave progression significantly raises hit counts, speed and immediate detection',()=>{
 const mobs=['cave','deep','abyss','core'].map(layer=>new Creature({id:'depth-'+layer,kind:'caveBat',x:4000,y:2700,layer}));
 for(let i=1;i<mobs.length;i++){assert.ok(mobs[i].maxHealth>mobs[i-1].maxHealth*1.5);assert.ok(mobs[i].speed>mobs[i-1].speed);assert.ok(mobs[i].aggroRange>mobs[i-1].aggroRange);}
 const bat=mobs[0];bat.update(.1,1000,{x:5200,y:2700,layer:'cave'},()=>true);assert.ok(bat.x>4000);assert.equal(bat.facing,0);
 const inv=forgeInventory('wood-club');inv.craft('leaf-wrap');inv.equip('leaf-wrap');assert.ok(inv.equippedGear.defense>=3);assert.ok(armorEffects(inv).stats.health>1.3);
});
test('held tools use distinct south, north and side poses while remaining hand-attached',()=>{
 for(const type of ['axe','pickaxe','club','rock','rod']){const poses=[0,Math.PI/2,Math.PI*1.5].map(facing=>heldToolPose({facing,moving:true},1000,type));assert.equal(new Set(poses.map(p=>p.angle)).size,3);assert.ok(poses.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
});
