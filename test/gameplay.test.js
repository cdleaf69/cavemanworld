import test from 'node:test';
import assert from 'node:assert/strict';
import { SpawnZoneManager } from '../src/spawn-zones.js';
import { ResourceNode, SpawnableRegistry, Tool } from '../src/spawnables.js';
import { populateWorld,populateSpawnSupplies } from '../src/spawner.js';
import { Inventory, RECIPES } from '../src/crafting.js';
import { PATHS, DEEP_TUNNELS } from '../src/world.js';

test('zones create visible, separate resource objects and hand-pickable starters', () => {
  const zones=new SpawnZoneManager(null),registry=new SpawnableRegistry();
  const counts=populateWorld(zones,registry);
  assert.ok(counts.nodes>500);
  assert.ok(counts.decorations>100);
  assert.ok([...registry.nodes.values()].some(n=>n.kind==='ground'&&n.layer==='surface'));assert.ok(![...registry.nodes.values()].some(n=>n.id.startsWith('starter-')));
  assert.ok([...registry.nodes.values()].filter(n=>n.kind==='tree'&&n.layer==='surface').length>=140);
  assert.ok([...registry.nodes.values()].some(n=>n.kind==='tree'&&n.zoneId==='heartlands-east'));
  assert.ok([...registry.nodes.values()].some(n=>n.kind==='bush'&&n.layer==='surface'));
  const bushes=[...registry.nodes.values()].filter(n=>n.kind==='bush'&&n.layer==='surface');
  assert.ok(bushes.length>300,'surface must still have forageable bushes');
  for(const bush of bushes){
    const local=bushes.filter(other=>Math.hypot(other.x-bush.x,other.y-bush.y)<350);
    assert.ok(local.length<=7,`bush cluster near ${bush.x},${bush.y} has ${local.length} bushes`);
  }
  assert.ok([...registry.nodes.values()].some(n=>n.kind==='ore'&&n.layer==='cave'));
  assert.ok([...registry.nodes.values()].every(n=>zones.zones.some(z=>z.id===n.zoneId)));
  for(const path of PATHS)for(let i=1;i<path.points.length;i++){
    const a=path.points[i-1],b=path.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/90);
    for(let j=0;j<=steps;j++){const t=j/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;assert.equal(registry.blocks(x,y,'surface'),false,`${path.name} blocked by spawned object`);}
  }
});

test('basic gathering leads to gear, tools, and iron mining without a paid service', () => {
  const inventory=new Inventory({level:20});
  const pebble=new ResourceNode({id:'p',kind:'ground',resource:'stone',x:0,y:0,layer:'surface',zoneId:'test'});
  const hand=pebble.take(0);
  assert.equal(hand.ok,true);inventory.add(hand.resource,hand.amount);
  assert.equal(inventory.craft('hand-rock').ok,true);
  assert.equal(inventory.equippedTool,null);
  inventory.equip('hand-rock');
  assert.equal(inventory.equippedTool.type,'rock');

  const ore=new ResourceNode({id:'o',kind:'ore',resource:'iron',x:0,y:0,layer:'cave',zoneId:'test',quantity:2});
  assert.equal(ore.take(0,inventory.equippedTool).ok,false);
  inventory.add('wood',2);inventory.add('stone',4);
  assert.equal(inventory.craft('stone-pickaxe').ok,true);
  assert.equal(inventory.equippedTool.id,'hand-rock');
  inventory.equip('stone-pickaxe');
  assert.equal(ore.take(1,inventory.equippedTool).progress,true);
  const mined=ore.take(601,inventory.equippedTool);
  assert.equal(mined.ok,true);assert.equal(mined.resource,'iron');assert.equal(mined.amount,3);
  inventory.add('leaves',3);
  assert.equal(inventory.craft('leaf-wrap').ok,true);
  assert.equal(inventory.equippedGear,null);
  inventory.equip('leaf-wrap');
  assert.equal(inventory.equippedGear.tier,'leaf');
  assert.ok(RECIPES.some(r=>r.id==='iron-armor'));
});

test('resource nodes are passable and return after their respawn delay', () => {
  const registry=new SpawnableRegistry(),tree=new ResourceNode({id:'tree',kind:'tree',resource:'wood',x:100,y:100,layer:'surface',zoneId:'test',radius:40,respawnMs:1000});
  registry.addNode(tree);
  assert.equal(registry.blocks(100,100,'surface'),false);
  assert.equal(registry.blocks(100,100,'cave'),false);
  tree.take(0,new Tool({id:'axe',type:'axe',tier:'stone'}));assert.equal(tree.active,false);
  assert.equal(registry.blocks(100,100,'surface'),false);
  registry.update(999);assert.equal(tree.active,false);
  registry.update(1000);assert.equal(tree.active,true);
});

test('biome ores and deep rare veins spawn, with iron tools required for the rarest',()=>{
  const registry=new SpawnableRegistry();populateWorld(new SpawnZoneManager(null),registry);
  const ores=[...registry.nodes.values()].filter(n=>n.kind==='ore');
  for(const [zone,resource] of [['cave','quartz'],['cave','copper'],['cave','amber'],['deep','obsidian'],['deep','moonstone']]){
    assert.ok(ores.some(n=>n.layer===zone&&n.resource===resource),`${resource} missing from ${zone}`);
  }
  assert.ok(ores.filter(n=>n.layer==='deep').length>50);
  for(const tunnel of DEEP_TUNNELS)for(let i=1;i<tunnel.points.length;i++){
    const a=tunnel.points[i-1],b=tunnel.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/35);
    for(let j=0;j<=steps;j++){const t=j/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;assert.equal(registry.blocks(x,y,'deep'),false,`deep route blocked at ${Math.round(x)},${Math.round(y)}`);}
  }
  const rare=new ResourceNode({id:'rare',kind:'ore',resource:'moonstone',x:4700,y:3300,layer:'deep',zoneId:'heart-deep',quantity:1});
  assert.equal(rare.take(0,new Tool({id:'stone',type:'pickaxe',tier:'stone'})).ok,false);
  assert.equal(rare.take(0,new Tool({id:'iron',type:'pickaxe',tier:'iron'})).ok,true);
});


test('starter foraging unlocks axes, wood upgrades, and retained inventory', () => {
  const bag=new Inventory({level:20}),registry=new SpawnableRegistry();
  populateWorld(new SpawnZoneManager(null),registry);
  populateSpawnSupplies(registry,{x:13000,y:8500});const starters=[...registry.nodes.values()].filter(n=>n.zoneId==='spawn-supplies');
  const collect=(node,time,tool=bag.equippedTool)=>{const result=node.take(time,tool);if(result.loot)for(const [r,n]of Object.entries(result.loot))bag.add(r,n);return result;};
  const tree=starters.find(n=>n.kind==='tree'),bush=starters.find(n=>n.kind==='bush'),boulder=starters.find(n=>n.kind==='rock');
  assert.equal(collect(tree,0).ok,false);
  assert.equal(collect(boulder,0).ok,false);
  assert.equal(bag.resources.wood,0);
  assert.deepEqual(collect(bush,0).loot,{leaves:2,sticks:2});
  for(const n of starters.filter(n=>n.kind==='ground'&&n.resource==='stone'))collect(n,0);
  assert.ok(bag.resources.stone>=8);
  assert.equal(bag.craft('reinforced-axe').ok,false);
  assert.equal(bag.craft('stone-axe').ok,true);
  assert.equal(bag.equippedTool,null);
  bag.equip('stone-axe');
  const crude=bag.equippedTool;
  assert.equal(collect(tree,0).progress,true);
  const health=tree.quantity;
  assert.equal(collect(tree,200).cooldown,true);
  assert.equal(tree.quantity,health);
  let t=600;while(tree.active){collect(tree,t);t+=600;}
  assert.equal(bag.resources.wood,3);
  tree.update(tree.respawnAt);
  t=tree.respawnAt;while(tree.active){collect(tree,t);t+=600;}
  assert.equal(bag.craft('reinforced-axe').ok,true);
  assert.equal(bag.equippedTool,crude);
  bag.equip('reinforced-axe');
  assert.ok(bag.equippedTool.power>crude.power);
  const upgraded=bag.equippedTool,wood=bag.resources.wood;
  tree.update(tree.respawnAt);t=tree.respawnAt;let hits=0;
  while(tree.active){collect(tree,t);t+=600;hits++;}
  assert.equal(hits,Math.ceil(tree.maxQuantity/upgraded.power));
  assert.equal(bag.resources.wood-wood,5);
  assert.equal(bag.owned.size,2);
  bag.equip('stone-axe');assert.equal(bag.equippedTool,crude);
  bag.unequip('stone-axe');assert.equal(bag.equippedTool,null);assert.equal(bag.owned.size,2);
  bag.add('leaves',3);bag.craft('leaf-wrap');assert.equal(bag.equippedGear,null);bag.equip('leaf-wrap');assert.equal(bag.equippedGear.tier,'leaf');
  assert.ok(RECIPES.some(r=>r.id==='iron-axe'&&r.requires==='reinforced-axe'));
});
