import test from 'node:test';
import assert from 'node:assert/strict';
import { LAKES, canWalk, lakeAt } from '../src/world.js';
import { Inventory, RECIPES } from '../src/crafting.js';
import { FishingSession } from '../src/fishing.js';
import { Campfire } from '../src/structures.js';
import { CreatureRegistry, populateCreatures } from '../src/creatures.js';
import { biomeAt } from '../src/world.js';

test('six lakes have dry, walkable shores and solid water',()=>{
  assert.equal(LAKES.length,6);
  for(const lake of LAKES){
    assert.equal(lakeAt(lake.x,lake.y)?.id,lake.id);
    assert.equal(canWalk(lake.x,lake.y,'surface'),false);
    assert.equal(canWalk(lake.x+lake.rx+85,lake.y,'surface'),true);
  }
});

test('a crafted rod catches fish that cook in a fueled campfire',()=>{
  const inventory=new Inventory();
  assert.ok(RECIPES.some(recipe=>recipe.id==='fishing-rod'));
  inventory.add('sticks',3);inventory.add('wood',3);inventory.add('leaves',2);
  assert.equal(inventory.craft('fishing-rod').ok,true);
  assert.equal(inventory.equippedTool,null);
  inventory.equip('fishing-rod');
  const lake=LAKES[0],player={x:lake.x+lake.rx+85,y:lake.y,layer:'surface'};
  const point={x:lake.x+lake.rx-40,y:lake.y};
  const session=new FishingSession();
  assert.equal(session.cast(player,inventory.equippedTool,point,1000).ok,true);
  assert.equal(session.reel(1500,inventory).ok,false);
  assert.match(session.update(5000,player),/Fish biting/);
  assert.equal(session.reel(5000,inventory).ok,true);
  assert.equal(inventory.resources.rawFish,1);
  const fire=new Campfire(player.x+100,player.y,'surface');
  assert.equal(fire.addFuel(inventory),true);
  assert.equal(fire.addFish(inventory),true);
  fire.update(4);
  assert.equal(fire.collectFish(inventory),1);
  assert.equal(inventory.resources.rawFish,0);
  assert.equal(inventory.resources.cookedFish,1);
});

test('new wildlife and cave enemies stay in their biome habitats',()=>{
  const registry=new CreatureRegistry();populateCreatures(registry);
  const expected={snowHare:['tundra'],marshCrane:['marsh'],sandLizard:['badlands','volcanic'],frostWisp:['tundra'],mireLeech:['marsh'],ashMite:['volcanic']};
  for(const [kind,habitats] of Object.entries(expected)){
    const creatures=registry.creatures.filter(creature=>creature.kind===kind);
    assert.ok(creatures.length>0,`${kind} should spawn`);
    for(const creature of creatures){
      if(creature.layer==='cave')continue;
      assert.ok(habitats.some(habitat=>biomeAt(creature.x,creature.y,creature.layer).id.includes(habitat)),`${kind} spawned in an unrelated biome`);
    }
  }
});
