import test from 'node:test';
import assert from 'node:assert/strict';
import {RECIPES} from '../src/crafting.js';
import {itemSvg} from '../src/item-art.js';
test('every material pickaxe has distinct geometry in its inventory and held artwork',()=>{
  const shapes=new Set();
  for(const recipe of RECIPES.filter(r=>r.type==='pickaxe')){
    const svg=itemSvg(recipe,{background:false}),geometry=svg.replace(/#[0-9a-f]{6}/gi,'#COLOR');
    assert.ok(svg.includes('shape-rendering="crispEdges"'));assert.ok(!shapes.has(geometry),recipe.id);shapes.add(geometry);
  }
  assert.ok(shapes.size>=20);
});
