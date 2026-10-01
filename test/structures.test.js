import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory} from '../src/crafting.js';
import {Hotbar} from '../src/hotbar.js';
import {Campfire,StructureRegistry} from '../src/structures.js';
import {Tool} from '../src/spawnables.js';
import {canWalk} from '../src/world.js';

test('campfire can be crafted repeatedly and assigned to the hotbar',()=>{
  const inventory=new Inventory({level:20}),bar=new Hotbar();inventory.add('wood',8);inventory.add('stone',8);
  assert.equal(inventory.craft('campfire').ok,true);assert.equal(inventory.craft('campfire').ok,true);
  assert.equal(inventory.structures.campfire,2);
  bar.assign('structure','campfire');assert.equal(bar.current.id,'campfire');
  bar.assign('equipment','stone-axe');assert.equal(bar.selected,1);
  bar.select(0);assert.equal(bar.current.id,'campfire');
});
test('wood fuels cooking, cooked meat can be collected, and a pickaxe recovers a structure',()=>{
  const inventory=new Inventory({level:20}),fire=new Campfire(100,100,'surface'),registry=new StructureRegistry();registry.add(fire);
  inventory.add('wood',1);inventory.add('meat',1);
  assert.equal(fire.addMeat(inventory),true);fire.update(5);assert.equal(fire.cookedMeat,0);
  assert.equal(fire.addFuel(inventory),true);fire.update(4.1);assert.equal(fire.cookedMeat,1);
  assert.equal(fire.collect(inventory),1);assert.equal(inventory.resources.cookedMeat,1);
  assert.equal(registry.blocks(100,100,'surface'),true);
  assert.equal(fire.mine(null,1).ok,false);
  const pick=new Tool({id:'stone-pickaxe',type:'pickaxe',tier:'stone'});
  assert.equal(fire.mine(pick,1).removed,false);assert.equal(fire.mine(pick,601).removed,false);assert.equal(fire.mine(pick,1201).removed,true);
  registry.remove(fire);assert.equal(registry.blocks(100,100,'surface'),false);
});
test('houses and lakes stay solid while ordinary ground remains walkable',()=>{
  assert.equal(canWalk(8580,6590,'surface'),false);
  assert.equal(canWalk(5210,11100,'surface'),false);
  assert.equal(canWalk(9000,7000,'surface'),true);
});
