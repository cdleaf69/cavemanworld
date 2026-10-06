import {BAITS} from './fishing-tackle.js';
import {FISH_SPECIES} from './fish-species.js';
import {FRONTIER_RESOURCES} from './frontier-items.js';
import { MATERIALS } from './materials.js';
import { RECIPES, RESOURCES } from './crafting.js';

const RESOURCE_DETAILS={
 sinew:['Sinew','Boars, wolves, spiders, and burrowing creatures','Bow reinforcement or sell at a general shop.','⌁'],
 fang:['Fangs','Wolves, spiders, serpents, and deep predators','Rare bow bindings or sell at a general shop.','◢'],
 essence:['Essence','Wisps, spirits, and deep magical creatures','Late bow evolution material or sell at a general shop.','✧'],
 arrows:['Arrows','Blacksmith ammunition counter','Ammunition for bows. Buy five for ten coins.','➶'],
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

Object.assign(RESOURCE_DETAILS,FRONTIER_RESOURCES);for(const b of BAITS)RESOURCE_DETAILS[b.id]=[b.name,'Marlow the beach fisherman',`${b.luck}× luck · ${b.strength}× reeling strength · ${b.speed}× bite speed. One bait per cast. ${b.amount} for ${b.price} coins.`,'⌁'];for(const f of FISH_SPECIES)RESOURCE_DETAILS[f.id]=[f.name,'Lake or ocean fishing',`${f.length} cm · sells for ${f.value} coins · raw cooking ingredient.`,'◁'];
export function resourceName(id){return RESOURCE_DETAILS[id]?.[0]||id;}
for(const m of MATERIALS)RESOURCE_DETAILS[m.id]=[m.name,`Ore Level ${m.depth} · ${m.biome} caves`,`Player level ${m.level} equipment · ${m.stat} armor bonus. Equal base strength to other biome materials at this depth.`,'◆'];
export function oreLevel(id){return id==='iron'?1:MATERIALS.find(m=>m.id===id)?.depth||0;}
export function visibleResources(inventory){return RESOURCES.filter(id=>(inventory.resources[id]||0)>0).sort((a,b)=>Number(!!oreLevel(b))-Number(!!oreLevel(a))||oreLevel(a)-oreLevel(b)||resourceName(a).localeCompare(resourceName(b)));}
export function indexEntries(inventory){
  const resources=[...RESOURCES].sort((a,b)=>Number(!!oreLevel(b))-Number(!!oreLevel(a))||oreLevel(a)-oreLevel(b)).map(id=>{const [name,source,detail,symbol]=RESOURCE_DETAILS[id];return {id,name,kind:'resource',group:oreLevel(id)?`Ores · Level ${oreLevel(id)}`:'Resources',source,detail,symbol,count:inventory.resources[id]||0,recipe:RECIPES.find(r=>r.id===id&&r.category==='resource')};});
  const crafted=RECIPES.filter(r=>r.category!=='resource').map(recipe=>({id:recipe.id,name:recipe.name,kind:recipe.category,group:recipe.category==='tool'?'Weapons & Tools':recipe.category==='gear'?'Armor':'Structures',source:recipe.category==='structure'?'Crafting menu':`Crafting menu · ${recipe.tier} tier`,detail:recipe.detail,symbol:null,count:recipe.category==='structure'?(inventory.structures[recipe.id]||0):Number(inventory.owned.has(recipe.id)),recipe}));
  return [...resources,...crafted];
}
