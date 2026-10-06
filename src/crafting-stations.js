import {MATERIALS} from './materials.js';
export const CRAFTING_TABLES=[
 ['bark-workbench','Bark Workbench','#c59968'],['stone-forge','Stone Forge','#aac5c4'],['crystal-workbench','Crystal Workbench','#97ddea'],['runic-forge','Runic Forge','#c0a1dc'],['mantle-anvil','Mantle Anvil','#f4a477'],['astral-workbench','Astral Workbench','#efdda1'],
].map(([id,name,color],i)=>({id,name,color,tableTier:i+1,level:(i+1)*3,category:'structure',tier:'stone',cost:{wood:8+i*2,stone:8+i*4,...(i===0?{iron:3}:{})},oreDepth:i||0,oreAmount:i?6+i*2:0,station:i,detail:`Unlocks ore level ${i+1} equipment and advanced recipes. Craft, place, and press E to open your workshop.`}));
export const tableForTier=tier=>CRAFTING_TABLES.find(t=>t.tableTier===tier);
export function stationRequirement(recipe){return recipe.station??recipe.depth??(recipe.level>=3?Math.min(6,Math.ceil(recipe.level/3)):0);}
export function availableRecipes(recipes,inventory){return recipes.filter(r=>!r.questOnly&&(r.tableTier?r.tableTier<=inventory.tableTier+1:stationRequirement(r)<=inventory.tableTier));}
export function tableOreCount(recipe,inventory){return MATERIALS.filter(m=>m.depth===recipe.oreDepth).reduce((n,m)=>n+(inventory.resources[m.id]||0),0);}
export function spendTableOres(recipe,inventory){let remaining=recipe.oreAmount||0;for(const m of MATERIALS.filter(m=>m.depth===recipe.oreDepth)){const amount=Math.min(remaining,inventory.resources[m.id]||0);if(amount)inventory.consume(m.id,amount);remaining-=amount;}return remaining===0;}
