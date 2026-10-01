import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory,RECIPES} from '../src/crafting.js';
import {Gear,Tool} from '../src/spawnables.js';
import {ARMOR_PERKS,armorEffects,scaledWeaponDamage,scaledHarvestTool} from '../src/perks.js';
import {movementVector} from '../src/controls.js';
import {PlayerVitals,armorReduction} from '../src/combat.js';

test('every armor has a perk and matching biome equipment shares its cave-depth baseline',()=>{
  const armor=RECIPES.filter(recipe=>recipe.category==='gear');
  assert.ok(armor.every(recipe=>ARMOR_PERKS[recipe.id]));
  for(const material of ['copper','quartz','amber']){
    const set=RECIPES.filter(r=>r.tier===material);
    assert.equal(set.find(r=>r.category==='gear').defense,9);
    assert.equal(set.find(r=>r.type==='axe').damage,9);
    assert.equal(set.find(r=>r.type==='pickaxe').damage,9);
    assert.equal(set.find(r=>r.type==='club').damage,11);
  }
  for(const material of ['obsidian','moonstone']){
    const set=RECIPES.filter(r=>r.tier===material);
    assert.equal(set.find(r=>r.category==='gear').defense,13);
    assert.equal(set.find(r=>r.type==='axe').damage,15);
    assert.equal(set.find(r=>r.type==='pickaxe').damage,15);
    assert.equal(set.find(r=>r.type==='club').damage,17);
  }
});

test('a completed matching tool set boosts the equipped armor perk only while held',()=>{
  const inventory=new Inventory({level:20});
  inventory.owned.set('quartz-armor',new Gear({id:'quartz-armor',slot:'body',tier:'quartz',defense:5}));
  inventory.equip('quartz-armor');
  assert.ok(Math.abs(armorEffects(inventory).stats.health-1.12*1.24)<1e-10);
  for(const id of ARMOR_PERKS['quartz-armor'].tools)inventory.owned.set(id,new Tool({id,type:RECIPES.find(r=>r.id===id).type,tier:'quartz'}));
  assert.equal(armorEffects(inventory).fullSet,true);
  assert.equal(armorEffects(inventory).boosted,false);
  inventory.equip('quartz-club');
  assert.equal(armorEffects(inventory).boosted,true);
  assert.ok(armorEffects(inventory).stats.health>1.18);
  inventory.equippedTool=null;
  assert.equal(armorEffects(inventory).boosted,false);
});

test('health, defense, and speed multipliers affect gameplay values',()=>{
  const vitals=new PlayerVitals();vitals.takeDamage(25,null,0);vitals.setMaxHealth(118);
  assert.equal(vitals.maxHealth,118);assert.ok(vitals.health>75);
  assert.equal(armorReduction({defense:8},1.33),11);
  const keys=new Set(['w']);
  const normal=movementVector({keys,sprinting:false,dt:1});
  const boosted=movementVector({keys,sprinting:false,dt:1,speedMultiplier:1.15});
  assert.ok(Math.abs(boosted.dy)>Math.abs(normal.dy));
  const axe=new Tool({id:'copper-axe',type:'axe',tier:'copper',damage:9,power:2,yield:6});
  assert.equal(scaledWeaponDamage(axe,1.15),10);
  assert.equal(scaledHarvestTool(axe,1.15).power,3);
  assert.equal(scaledHarvestTool(axe,1.15).yield,7);
});
