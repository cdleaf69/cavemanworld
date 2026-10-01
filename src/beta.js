import { RECIPES,RESOURCES } from './crafting.js';
import { Tool,Gear } from './spawnables.js';
export function grantBetaItem(inventory,id,quantity=1){
  const count=Math.max(1,Math.min(999,Math.floor(Number(quantity)||1)));
  if(RESOURCES.includes(id)){inventory.add(id,count);return true;}
  const r=RECIPES.find(r=>r.id===id);if(!r)return false;
  if(r.category==='structure'){inventory.structures[id]=(inventory.structures[id]||0)+count;return true;}
  const item=r.category==='tool'?new Tool({...r,yield:r.yield}):new Gear(r);
  inventory.owned.set(id,item);if(r.category==='tool')inventory.equip(id);return true;
}
