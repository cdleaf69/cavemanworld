import { MATERIALS } from './materials.js';
import { Progression } from './progression.js';
import { Gear, Tool } from './spawnables.js';

export const RESOURCES = ['sinew','fang','essence','arrows', 'leaves', 'sticks', 'wood', 'stone', 'iron', 'copper', 'quartz', 'amber', 'obsidian', 'moonstone', 'meat', 'cookedMeat', 'rawFish', 'cookedFish', 'hide', 'bone', 'wing', 'shell', 'venom', 'glimmer'];
export const RECIPES = [
  {id:'wood-bow',name:'Wood Bow',category:'tool',type:'bow',tier:'wood',damage:12,cost:{wood:4,sticks:3,leaves:3},detail:'Click to fire an arrow. Buy arrows from a blacksmith.'},
  {id:'slingshot',name:'Slingshot',category:'tool',type:'slingshot',tier:'wood',damage:7,cost:{sticks:3,hide:1,leaves:2},detail:'Click to shoot a stone toward the cursor. Uses one stone per shot.'},
  { id:'campfire', name:'Campfire', category:'structure', tier:'wood', cost:{wood:4,stone:4}, detail:'Place it, add wood as fuel, then cook raw meat.' },
  { id:'fishing-rod', name:'Fishing Rod', category:'tool', type:'rod', tier:'wood', damage:1, cost:{sticks:3,wood:2,leaves:2}, detail:'Cast into a lake from the shore. Reel in fish when the bobber bites.' },
  { id:'hand-rock', name:'Hand Rock', category:'tool', type:'rock', tier:'stone', damage:3, cost:{stone:1}, detail:'A first weapon you can make from one pebble.' },
  { id:'leaf-wrap', name:'Leaf Wrap', category:'gear', slot:'body', tier:'leaf', defense:1, cost:{leaves:3}, detail:'Light starter armor · blocks 1 damage.' },
  { id:'wood-club', name:'Wood Club', category:'tool', type:'club', tier:'wood', damage:5, cost:{wood:3}, detail:'A sturdy early weapon · 5 combat damage.' },
  { id:'wood-vest', name:'Wood Vest', category:'gear', slot:'body', tier:'wood', defense:2, cost:{leaves:2,wood:4}, detail:'Woven bark protection · blocks 2 damage.' },
  { id:'hide-wrap', name:'Hide Wrap', category:'gear', slot:'body', tier:'wood', defense:3, cost:{hide:2,leaves:2}, detail:'Animal-hide armor · blocks 3 damage.' },
  { id:'stone-axe', name:'Crude Stone Axe', category:'tool', type:'axe', tier:'stone', damage:5, power:1, yield:3, cost:{sticks:2,stone:2}, detail:'Chops trees and deals 5 combat damage.' },
  { id:'reinforced-axe', name:'Reinforced Stone Axe', category:'tool', type:'axe', tier:'stone', damage:7, power:2, yield:5, requires:'stone-axe', cost:{wood:4,stone:3,leaves:2}, detail:'Wooden haft upgrade · 7 combat damage.' },
  { id:'stone-pickaxe', name:'Stone Pickaxe', category:'tool', type:'pickaxe', tier:'stone', damage:5, cost:{wood:2,stone:4}, detail:'Mines iron deposits · 5 combat damage.' },
  { id:'stone-club', name:'Stone Club', category:'tool', type:'club', tier:'stone', damage:8, cost:{wood:2,stone:4}, detail:'Heavy stone weapon · 8 combat damage.' },
  { id:'bone-club', name:'Bone Club', category:'tool', type:'club', tier:'stone', damage:10, cost:{bone:2,wood:2}, detail:'Cave-bone weapon · 10 combat damage.' },
  { id:'stone-hide', name:'Stone Hide', category:'gear', slot:'body', tier:'stone', defense:4, cost:{leaves:3,stone:6}, detail:'Stone-plated armor · blocks 4 damage.' },
  { id:'iron-axe', name:'Iron Axe', category:'tool', type:'axe', tier:'iron', damage:11, power:3, yield:8, requires:'reinforced-axe', cost:{wood:2,iron:5}, detail:'Efficient chopper · 11 combat damage.' },
  { id:'iron-pickaxe', name:'Iron Pickaxe', category:'tool', type:'pickaxe', tier:'iron', damage:10, cost:{wood:2,iron:5}, detail:'Efficient mining · 10 combat damage.' },
  { id:'iron-club', name:'Iron Club', category:'tool', type:'club', tier:'iron', damage:14, cost:{wood:2,iron:4}, detail:'Heavy iron weapon · 14 combat damage.' },
  { id:'iron-armor', name:'Iron Armor', category:'gear', slot:'body', tier:'iron', defense:6, cost:{leaves:3,iron:8}, detail:'Sturdy upper-cave armor · blocks 6 damage.' },
  { id:'copper-axe', name:'Copper Axe', category:'tool', type:'axe', tier:'copper', damage:9, power:2, yield:6, cost:{wood:2,copper:4}, detail:'Redstone copper axe · upper-cave tier.' },
  { id:'copper-pickaxe', name:'Copper Pickaxe', category:'tool', type:'pickaxe', tier:'copper', damage:9, power:2, yield:6, cost:{wood:2,copper:4}, detail:'Redstone copper mining tool · upper-cave tier.' },
  { id:'copper-club', name:'Copper Club', category:'tool', type:'club', tier:'copper', damage:11, cost:{wood:2,copper:4}, detail:'Redstone copper weapon · upper-cave tier.' },
  { id:'copper-armor', name:'Copper Armor', category:'gear', slot:'body', tier:'copper', defense:5, cost:{copper:7,hide:2}, detail:'Redstone Reach armor · power perk.' },
  { id:'quartz-axe', name:'Quartz Axe', category:'tool', type:'axe', tier:'quartz', damage:9, power:2, yield:6, cost:{wood:2,quartz:4}, detail:'Frostfall crystal axe · upper-cave tier.' },
  { id:'quartz-pickaxe', name:'Quartz Pickaxe', category:'tool', type:'pickaxe', tier:'quartz', damage:9, power:2, yield:6, cost:{wood:2,quartz:4}, detail:'Frostfall crystal mining tool · upper-cave tier.' },
  { id:'quartz-club', name:'Quartz Club', category:'tool', type:'club', tier:'quartz', damage:11, cost:{wood:2,quartz:3}, detail:'Frostfall crystal weapon · upper-cave tier.' },
  { id:'quartz-armor', name:'Quartz Armor', category:'gear', slot:'body', tier:'quartz', defense:5, cost:{quartz:7,hide:2}, detail:'Frostfall armor · health perk.' },
  { id:'amber-axe', name:'Amber Axe', category:'tool', type:'axe', tier:'amber', damage:9, power:2, yield:6, cost:{wood:2,amber:4}, detail:'Mirefen amber axe · upper-cave tier.' },
  { id:'amber-pickaxe', name:'Amber Pickaxe', category:'tool', type:'pickaxe', tier:'amber', damage:9, power:2, yield:6, cost:{wood:2,amber:4}, detail:'Mirefen amber mining tool · upper-cave tier.' },
  { id:'amber-club', name:'Amber Club', category:'tool', type:'club', tier:'amber', damage:11, cost:{wood:2,amber:4}, detail:'Mirefen amber weapon · upper-cave tier.' },
  { id:'venom-club', name:'Venom Club', category:'tool', type:'club', tier:'stone', damage:12, cost:{wood:1,bone:2,venom:2}, detail:'Scorpion sting · 12 combat damage.' },
  { id:'wing-cloak', name:'Wing Cloak', category:'gear', slot:'body', tier:'wood', defense:4, cost:{hide:2,wing:3}, detail:'Bat wings and hide · blocks 4 damage.' },
  { id:'shell-armor', name:'Crawler Shell', category:'gear', slot:'body', tier:'iron', defense:6, cost:{shell:3,stone:4}, detail:'Heavy cave shell · blocks 6 damage.' },
  { id:'amber-wrap', name:'Amber Wrap', category:'gear', slot:'body', tier:'amber', defense:5, cost:{amber:7,hide:2}, detail:'Mirefen armor · speed perk.' },
  { id:'obsidian-axe', name:'Obsidian Axe', category:'tool', type:'axe', tier:'obsidian', damage:15, power:4, yield:10, requires:'iron-axe', cost:{obsidian:4,wood:2}, detail:'Ash glass blade · 15 combat damage and 10 wood per tree.' },
  { id:'obsidian-pickaxe', name:'Obsidian Pickaxe', category:'tool', type:'pickaxe', tier:'obsidian', damage:15, power:4, yield:10, requires:'iron-pickaxe', cost:{obsidian:4,wood:2}, detail:'Ashen Crown mining tool · deep-cave tier.' },
  { id:'obsidian-club', name:'Obsidian Club', category:'tool', type:'club', tier:'obsidian', damage:17, cost:{obsidian:4,wood:2}, detail:'Ashen Crown weapon · deep-cave tier.' },
  { id:'obsidian-armor', name:'Obsidian Armor', category:'gear', slot:'body', tier:'obsidian', defense:8, cost:{obsidian:7,shell:2}, detail:'Ashen Crown armor · power perk.' },
  { id:'moonstone-axe', name:'Moonstone Axe', category:'tool', type:'axe', tier:'moonstone', damage:15, power:4, yield:10, requires:'iron-axe', cost:{moonstone:4,wood:2,glimmer:1}, detail:'Moon Vault axe · deep-cave tier.' },
  { id:'moonstone-pickaxe', name:'Moonstone Pickaxe', category:'tool', type:'pickaxe', tier:'moonstone', damage:15, power:4, yield:10, requires:'iron-pickaxe', cost:{moonstone:4,wood:2,glimmer:1}, detail:'Moon Vault mining tool · deep-cave tier.' },
  { id:'moonstone-club', name:'Moonstone Club', category:'tool', type:'club', tier:'moonstone', damage:17, cost:{moonstone:3,obsidian:2,glimmer:1}, detail:'Moon Vault weapon · deep-cave tier.' },
  { id:'moonstone-armor', name:'Moonstone Armor', category:'gear', slot:'body', tier:'moonstone', defense:8, cost:{moonstone:7,shell:2,glimmer:1}, detail:'Moon Vault armor · defense perk.' },
];

for(const material of MATERIALS){
  if(!RESOURCES.includes(material.id))RESOURCES.push(material.id);
  for(const type of ['axe','pickaxe','club','armor']){
    const category=type==='armor'?'gear':'tool';
    let recipe=RECIPES.find(r=>r.tier===material.id&&(category==='gear'?r.category==='gear':r.type===type));
    if(!recipe){recipe={id:`${material.id}-${type}`,name:`${material.name} ${type[0].toUpperCase()+type.slice(1)}`,category,tier:material.id,type:category==='tool'?type:undefined,slot:category==='gear'?'body':undefined,cost:{[material.id]:category==='gear'?7:4,wood:2},detail:`Depth ${material.depth} ${material.biome} equipment.`};RECIPES.push(recipe);}
    Object.assign(recipe,{level:material.level,depth:material.depth,defense:category==='gear'?material.defense:undefined,damage:material.damage+(type==='club'?2:0),power:material.power,yield:material.yield});
    recipe.detail=`Depth ${material.depth} · ${material.biome} · ${category==='gear'?`${material.defense} defense`:`${recipe.damage} damage · ${material.yield} harvest yield`}.`;
    delete recipe.requires;
  }
}
for(const r of RECIPES){r.level??=r.tier==='iron'?3:1;if(r.category==='gear'&&!MATERIALS.some(m=>m.id===r.tier))r.defense=Math.ceil(r.defense*1.4)+1;if(r.category==='gear')r.detail=r.detail.replace(/blocks \d+ damage/,`blocks ${r.defense} damage`);}

for(const m of MATERIALS.filter(m=>m.depth>=2))for(const [type,multiplier,amount,range,cooldown,knockback] of [['sword',1.35,10,145,330,15],['spear',1.05,8,220,530,30],['warhammer',1.6,12,110,800,110]]){
 RECIPES.push({id:`${m.id}-${type}`,name:`${m.name} ${type[0].toUpperCase()+type.slice(1)}`,category:'tool',type,tier:m.id,damage:Math.ceil((m.damage+2)*multiplier),level:m.level,cost:{[m.id]:amount,wood:3,hide:2},range,cooldown,knockback,detail:type==='sword'?'Faster swings and more damage than a club; costs more ore.':type==='spear'?'Long reach with moderate damage and knockback.':'Heavy damage and strong knockback; slow swings.'});
}
export class Inventory {
  constructor({level=1}={}) {
    this.coins=0;
    this.progression=new Progression(level);
    this.resources = Object.fromEntries(RESOURCES.map(resource=>[resource,0]));
    this.owned = new Map();
    this.structures={campfire:0};
    this.equippedTool = null;
    this.equippedGear = null;
  }
  add(resource, amount) {
    if (!RESOURCES.includes(resource) || !Number.isFinite(amount) || amount <= 0) throw new Error('Invalid resource pickup');
    this.resources[resource] += amount;
  }
  consume(resource,amount){if(!RESOURCES.includes(resource)||!Number.isFinite(amount)||amount<=0||this.resources[resource]<amount)return false;this.resources[resource]-=amount;return true;}
  canCraft(recipe) {
    return this.progression.level>=(recipe.level||1) && (recipe.category==='structure'||!this.owned.has(recipe.id)) && (!recipe.requires || this.owned.has(recipe.requires)) && Object.entries(recipe.cost).every(([resource, amount]) => this.resources[resource] >= amount);
  }
  craft(recipeId) {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { ok:false, message:'Unknown recipe' };
    if(this.progression.level<(recipe.level||1))return {ok:false,message:`Requires level ${recipe.level}`};
    if (recipe.category!=='structure'&&this.owned.has(recipe.id)) return { ok:false, message:'Already crafted' };
    if(recipe.requires&&!this.owned.has(recipe.requires))return {ok:false,message:`Craft ${RECIPES.find(r=>r.id===recipe.requires).name} first`};
    if (!this.canCraft(recipe)) return { ok:false, message:'Gather more resources' };
    for (const [resource, amount] of Object.entries(recipe.cost)) this.resources[resource] -= amount;
    if(recipe.category==='structure'){this.structures[recipe.id]=(this.structures[recipe.id]||0)+1;return {ok:true,recipe,item:null};}
    const item = recipe.category === 'tool'
      ? new Tool(recipe)
      : new Gear({ id:recipe.id, slot:recipe.slot, tier:recipe.tier, defense:recipe.defense });
    this.progression.gain(20);
    this.owned.set(recipe.id, item);
    return { ok:true, item, recipe };
  }
  equip(id) {
    const item = this.owned.get(id);
    if (!item) return false;
    if (item instanceof Tool) this.equippedTool = item;
    else this.equippedGear = item;
    return true;
  }
  unequip(id) {
    if(this.equippedTool?.id===id)this.equippedTool=null;
    if(this.equippedGear?.id===id)this.equippedGear=null;
  }
}
