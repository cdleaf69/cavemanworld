import { MATERIALS } from './materials.js';
import { RECIPES, RESOURCES } from './crafting.js';

const RESOURCE_DETAILS={
  leaves:['Leaves','Bushes and fallen leaves','Starter plant material for wraps and tools.','✿'],
  sticks:['Sticks','Bushes and loose sticks','Starter handles for your first axe.','⌁'],
  wood:['Wood','Chop trees with an axe','Fuel for campfires and material for tools.','┃'],
  stone:['Stone','Pick up pebbles or mine boulders','Starter tool heads and structures.','◆'],
  iron:['Iron','Iron deposits on the surface and in caves','Stronger tools and armor.','✦'],
  copper:['Copper','Redstone Reach and its caves','Upper-cave biome equipment with a power perk.','◈'],
  quartz:['Quartz','Frostfall and the Frost Vault','Upper-cave biome equipment with a health perk.','◇'],
  amber:['Amber','Mirefen and the Mire Hollow','Upper-cave biome equipment with a speed perk.','◉'],
  obsidian:['Obsidian','Ashen Crown and deeper caves','Deep-cave biome equipment with a power perk.','⬟'],
  moonstone:['Moonstone','Rare deep-cave deposits','Deep-cave biome equipment with a defense perk.','✧'],
  meat:['Raw Meat','Rabbits, deer, foxes, boars, and moss tortoises','Cook this at a campfire with wood fuel.','◖'],
  cookedMeat:['Cooked Meat','Cook raw meat at a fueled campfire','Eat to restore 40 health.','◕'],
  rawFish:['Raw Fish','Fish in a lake with a fishing rod','Cook this at a fueled campfire.','◁'],
  cookedFish:['Cooked Fish','Cook raw fish at a fueled campfire','Eat to restore 30 health.','◀'],
  hide:['Hide','Rabbits, deer, foxes, boars, and Stone Rams','Used for armor.','▣'],
  bone:['Bone','Cave creatures','Used for cave weapons.','◗'],
  wing:['Wing','Cave Bats','Used for the Wing Cloak.','⌁'],
  shell:['Shell','Moss Tortoises, Crystal Beetles, Cave Crawlers, and Stone Rams','Used for tough armor.','⬡'],
  venom:['Venom','Rock Scorpions and Cave Slimes','Used for the Venom Club.','✳'],
  glimmer:['Glimmer','Shiny creatures, especially deep below','Used for rare moonstone equipment.','✺'],
};

export function resourceName(id){return RESOURCE_DETAILS[id]?.[0]||id;}
for(const m of MATERIALS)RESOURCE_DETAILS[m.id]=[m.name,`Depth ${m.depth} · ${m.biome} caves`,`Level ${m.level} equipment · ${m.stat} armor bonus. Equal base strength to other biome materials at this depth.`,'◆'];
export function visibleResources(inventory){return RESOURCES.filter(id=>(inventory.resources[id]||0)>0);}
export function indexEntries(inventory){
  const resources=RESOURCES.map(id=>{const [name,source,detail,symbol]=RESOURCE_DETAILS[id];return {id,name,kind:'resource',group:'Resources',source,detail,symbol,count:inventory.resources[id]||0};});
  const crafted=RECIPES.map(recipe=>({id:recipe.id,name:recipe.name,kind:recipe.category,group:recipe.category==='tool'?'Weapons & Tools':recipe.category==='gear'?'Armor':'Structures',source:recipe.category==='structure'?'Crafting menu':`Crafting menu · ${recipe.tier} tier`,detail:recipe.detail,symbol:null,count:recipe.category==='structure'?(inventory.structures[recipe.id]||0):Number(inventory.owned.has(recipe.id)),recipe}));
  return [...resources,...crafted];
}
