import test from 'node:test';
import assert from 'node:assert/strict';
import { Inventory } from '../src/crafting.js';
import { Hotbar } from '../src/hotbar.js';
import { grantBetaItem } from '../src/beta.js';

test('owned armor can enter a hotbar slot without auto equipping on placement',()=>{
  const bag=new Inventory({level:20}),bar=new Hotbar();
  bag.add('leaves',3);assert.equal(bag.craft('leaf-wrap').ok,true);
  assert.equal(bag.equippedGear,null);
  assert.equal(bar.assign('equipment','leaf-wrap'),0);
  assert.equal(bar.place(0,{kind:'equipment',id:'leaf-wrap'},bag),true);
  assert.deepEqual(bar.slots[0],{kind:'equipment',id:'leaf-wrap'});
  bag.equip('leaf-wrap');assert.equal(bag.equippedGear.id,'leaf-wrap');
  bag.unequip('leaf-wrap');assert.equal(bag.equippedGear,null);
  grantBetaItem(bag,'quartz-armor');assert.equal(bag.equippedGear,null);
});

test('inventory items place, move, swap, and clear across visible hotbar slots',()=>{
  const bag=new Inventory({level:20}),bar=new Hotbar();
  grantBetaItem(bag,'stone-axe');grantBetaItem(bag,'campfire',1);bag.add('cookedMeat',2);
  assert.equal(bar.place(2,{kind:'equipment',id:'stone-axe'},bag),true);
  assert.equal(bar.place(0,{kind:'structure',id:'campfire'},bag),true);
  assert.equal(bar.place(5,{kind:'resource',id:'cookedMeat'},bag),true);
  assert.equal(bar.place(0,bar.slots[2],bag,2),true);
  assert.equal(bar.slots[0].id,'stone-axe');assert.equal(bar.slots[2].id,'campfire');
  assert.equal(bar.place(3,{kind:'equipment',id:'stone-axe'},bag),true);
  assert.equal(bar.slots[0],null);assert.equal(bar.slots[3].id,'stone-axe');
  assert.equal(bar.clear(3),true);assert.equal(bar.slots[3],null);
  bag.consume('cookedMeat',2);bar.removeDepleted(bag);assert.equal(bar.slots[5],null);
  assert.equal(bar.place(99,{kind:'structure',id:'campfire'},bag),false);
});
