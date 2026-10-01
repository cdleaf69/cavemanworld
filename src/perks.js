import { MATERIALS } from './materials.js';
// Every armor has one identity perk. Matching equipment uses the same baseline
// within a cave depth; biome materials choose which multiplier they improve.
export const ARMOR_PERKS=Object.freeze({
  'leaf-wrap':{biome:'Heartlands',stat:'health',base:1.18,tools:['hand-rock','stone-axe','stone-pickaxe']},
  'wood-vest':{biome:'Elderwood',stat:'speed',base:1.18,tools:['wood-club','stone-axe','stone-pickaxe']},
  'hide-wrap':{biome:'Woodland',stat:'power',base:1.20,tools:['bone-club','stone-axe','stone-pickaxe']},
  'stone-hide':{biome:'Heartlands',stat:'defense',base:1.22,tools:['stone-axe','stone-pickaxe','stone-club']},
  'iron-armor':{biome:'Upper Caves',stat:'defense',base:1.25,tools:['iron-axe','iron-pickaxe','iron-club']},
  'wing-cloak':{biome:'Upper Caves',stat:'speed',base:1.24,tools:['bone-club','stone-axe','stone-pickaxe']},
  'shell-armor':{biome:'Upper Caves',stat:'health',base:1.25,tools:['iron-axe','iron-pickaxe','iron-club']},
  'copper-armor':{biome:'Redstone Reach',stat:'power',base:1.25,tools:['copper-axe','copper-pickaxe','copper-club']},
  'quartz-armor':{biome:'Frostfall',stat:'health',base:1.18,tools:['quartz-axe','quartz-pickaxe','quartz-club']},
  'amber-wrap':{biome:'Mirefen',stat:'speed',base:1.25,tools:['amber-axe','amber-pickaxe','amber-club']},
  'obsidian-armor':{biome:'Ashen Crown',stat:'power',base:1.22,tools:['obsidian-axe','obsidian-pickaxe','obsidian-club']},
  'moonstone-armor':{biome:'Moon Vault',stat:'defense',base:1.22,tools:['moonstone-axe','moonstone-pickaxe','moonstone-club']},
  ...Object.fromEntries(MATERIALS.map(m=>[m.id==='amber'?'amber-wrap':`${m.id}-armor`,{biome:m.biome,stat:m.stat,base:m.bonus,tools:['axe','pickaxe','club'].map(t=>`${m.id}-${t}`)}])),
});

export function armorEffects(inventory){
  const stats={health:1,power:1,defense:1,speed:1};
  const id=inventory.equippedGear?.id,perk=ARMOR_PERKS[id];
  if(!perk)return {stats,perk:null,crafted:0,total:0,fullSet:false,matchingTool:false,boosted:false};
  const crafted=perk.tools.filter(tool=>inventory.owned.has(tool)).length;
  const fullSet=crafted===perk.tools.length;
  const matchingTool=perk.tools.includes(inventory.equippedTool?.id);
  const boosted=fullSet&&matchingTool;
  stats.health=1.12;
  stats[perk.stat]*=1+(Math.max(perk.base,1.18)-1)*(boosted?1.5:1);
  return {stats,perk,crafted,total:perk.tools.length,fullSet,matchingTool,boosted};
}

export function perkPercent(multiplier){return `+${Math.round((multiplier-1)*1000)/10}%`;}
export function scaledWeaponDamage(tool,powerMultiplier=1){return Math.max(1,Math.round((tool?.damage??1)*powerMultiplier));}
export function scaledHarvestTool(tool,powerMultiplier=1){
  return tool&&powerMultiplier>1?{...tool,power:Math.ceil(tool.power*powerMultiplier),yield:Math.ceil(tool.yield*powerMultiplier)}:tool;
}
