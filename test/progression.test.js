import test from 'node:test';
import assert from 'node:assert/strict';
import { Inventory, RECIPES, RESOURCES } from '../src/crafting.js';
import { Progression } from '../src/progression.js';
import { MATERIALS } from '../src/materials.js';
import { armorEffects } from '../src/perks.js';
import { grantBetaItem } from '../src/beta.js';
import { ResourceNode, Tool } from '../src/spawnables.js';
import { defaultZones } from '../src/spawn-zones.js';

test('XP unlocks upgrades and cannot exceed level twenty',()=>{
  const p=new Progression();assert.equal(p.level,1);assert.equal(p.gain(95),1);assert.equal(p.level,2);assert.equal(p.xp,0);
  p.gain(1e6);assert.equal(p.level,20);assert.equal(p.xp,0);p.upgrade(5);assert.equal(p.level,20);
  const inv=new Inventory();for(const id of RESOURCES)inv.add(id,100);
  assert.equal(inv.craft('copper-axe').ok,false);assert.equal(inv.resources.copper,100);
  inv.progression.upgrade(2);assert.equal(inv.craft('copper-axe').ok,true);assert.equal(inv.progression.xp,20);
  assert.equal(inv.craft('copper-axe').ok,false);assert.equal(inv.progression.xp,20);
});
test('every biome depth has equal base equipment stats and a complete set bonus',()=>{
  for(const m of MATERIALS){
    const recipes=RECIPES.filter(r=>r.tier===m.id);assert.equal(recipes.length,4);
    const inv=new Inventory({level:20});for(const id of RESOURCES)inv.add(id,100);
    for(const r of recipes){assert.equal(r.level,m.depth*3);assert.equal(r.defense,r.category==='gear'?m.defense:undefined);assert.equal(r.damage,m.damage+(r.type==='club'?2:0));assert.equal(inv.craft(r.id).ok,true);}
    inv.equip(recipes.find(r=>r.category==='gear').id);inv.equip(`${m.id}-axe`);const effects=armorEffects(inv);assert.ok(effects.boosted);assert.equal(effects.perk.stat,m.stat);assert.ok(effects.stats[m.stat]>effects.perk.base);
    inv.unequip(`${m.id}-axe`);assert.equal(armorEffects(inv).boosted,false);
  }
});
test('deeper ore requires the previous depth pickaxe and has a biome spawn zone',()=>{
  const zones=defaultZones();
  for(const m of MATERIALS){
    const node=new ResourceNode({id:m.id,kind:'ore',resource:m.id,quantity:1});
    assert.equal(node.take(0,new Tool({id:'bad',type:'pickaxe',tier:'wood'})).ok,false);
    const previous=m.depth===1?'stone':MATERIALS.find(x=>x.depth===m.depth-1).id;
    assert.equal(node.take(1000,new Tool({id:'good',type:'pickaxe',tier:previous,power:20})).ok,true);
    assert.ok(zones.some(z=>z.biome===m.biome&&z.resources.includes(m.id)&&z.layer===['','cave','deep','abyss','core'][m.depth]));
  }
});
test('beta item grants work without changing normal crafting locks',()=>{
  const inv=new Inventory();assert.ok(grantBetaItem(inv,'infernite',10));assert.equal(inv.resources.infernite,10);
  assert.ok(grantBetaItem(inv,'infernite-axe',1));assert.equal(inv.equippedTool.id,'infernite-axe');assert.equal(inv.progression.level,1);
  assert.equal(inv.craft('infernite-armor').ok,false);assert.equal(grantBetaItem(inv,'unknown',1),false);
  grantBetaItem(inv,'campfire',3);assert.equal(inv.structures.campfire,3);
});
