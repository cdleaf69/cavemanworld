import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory,RECIPES,RESOURCES} from '../src/crafting.js';
import {Hotbar} from '../src/hotbar.js';
import {indexEntries,visibleResources,resourceName} from '../src/item-index.js';

test('empty and depleted resources leave the carried inventory but remain in the item index',()=>{
  const inventory=new Inventory({level:20});
  assert.deepEqual(visibleResources(inventory),[]);
  assert.equal(indexEntries(inventory).length,RESOURCES.length+RECIPES.length);
  inventory.add('wood',1);assert.deepEqual(visibleResources(inventory),['wood']);
  assert.equal(inventory.consume('wood',1),true);assert.deepEqual(visibleResources(inventory),[]);
  assert.equal(indexEntries(inventory).find(entry=>entry.id==='wood').count,0);
  assert.equal(resourceName('cookedMeat'),'Cooked Meat');
});

test('depleted consumables and structure kits clear their hotbar slots',()=>{
  const inventory=new Inventory({level:20}),hotbar=new Hotbar();
  inventory.add('cookedMeat',1);inventory.structures.campfire=1;
  hotbar.assign('resource','cookedMeat');hotbar.assign('structure','campfire');
  assert.equal(hotbar.slots.filter(Boolean).length,2);
  inventory.consume('cookedMeat',1);inventory.structures.campfire=0;hotbar.removeDepleted(inventory);
  assert.equal(hotbar.slots.filter(Boolean).length,0);
  inventory.add('cookedMeat',1);hotbar.assign('resource','cookedMeat');
  assert.equal(hotbar.current.id,'cookedMeat');
});
