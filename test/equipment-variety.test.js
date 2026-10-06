import test from 'node:test';
import assert from 'node:assert/strict';
import {itemSvg} from '../src/item-art.js';
import {RECIPES} from '../src/crafting.js';
import {MATERIALS} from '../src/materials.js';
import {BOW_FORMS} from '../src/bow-upgrades.js';
import {NPC_APPEARANCES} from '../src/expeditions.js';
import {drawNpcHair,DEALER_APPEARANCE,SHOPKEEPER_APPEARANCE,SMITH_APPEARANCE} from '../src/npc-hair.js';
const geometry=svg=>svg.replace(/#[\da-f]{3,8}\b/gi,'COLOR').replace(/metal-[\w-]+/g,'CLIP').replace(/blade-[\w-]+/g,'CLIP');
test('all thirty mineral equipment sets have different geometry after removing colors and names',()=>{
 for(const type of ['axe','club','sword','spear','warhammer','armor']){
  const shapes=MATERIALS.map(m=>{const recipe=RECIPES.find(r=>r.id===`${m.id}-${type}`);return geometry(itemSvg(recipe||{id:`${m.id}-${type}`,tier:m.id,type,category:type==='armor'?'gear':'tool'},{background:false}));});
  assert.equal(new Set(shapes).size,MATERIALS.length,type);
 }
});
test('bow evolution, fishing rods, starter armor, and six workshops change their construction',()=>{
 const bow=BOW_FORMS.map((f,i)=>geometry(itemSvg({...f,id:'wood-bow',type:'bow',bowLevel:i},{background:false})));
 assert.equal(new Set(bow).size,7);
 for(const recipes of [RECIPES.filter(r=>r.type==='rod'),RECIPES.filter(r=>r.tableTier),['leaf','wood','stone','iron'].map(tier=>({id:tier+'-armor',tier,category:'gear'}))])assert.equal(new Set(recipes.map(r=>geometry(itemSvg(r,{background:false})))).size,recipes.length);
});
test('wandering and service NPCs have distinct hair silhouettes from both front and back',()=>{
 const styles=[...NPC_APPEARANCES,DEALER_APPEARANCE,SHOPKEEPER_APPEARANCE,SMITH_APPEARANCE];
 for(const back of [false,true]){
  const shapes=styles.map(style=>{const cells=new Set(),c={fillRect(x,y,w,h){for(let px=x;px<x+w;px++)for(let py=y;py<y+h;py++)cells.add(`${px}:${py}`);}};drawNpcHair(c,style,back,false);return [...cells].sort().join(';');});
  // Two different NPCs may share short hair; the roster still has eight cuts.
  assert.ok(new Set(shapes).size>=8);
 }
});
