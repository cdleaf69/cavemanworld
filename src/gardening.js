export const CROPS=Object.freeze([
 {id:'berries',name:'Berry Bush',seed:'berrySeeds',seconds:45,yield:4,heal:12,color:'#e482a0'},
 {id:'carrots',name:'Carrots',seed:'carrotSeeds',seconds:55,yield:3,heal:18,color:'#e5a155'},
 {id:'alpineHerb',name:'Alpine Herb',seed:'herbSeeds',seconds:65,yield:3,heal:25,color:'#a9d6bc'},
 {id:'moonflower',name:'Moonflower',seed:'moonflowerSeeds',seconds:80,yield:2,heal:30,color:'#bfb4ef'},
 {id:'sunMelon',name:'Sun Melon',seed:'melonSeeds',biomes:['badlands'],seconds:70,yield:2,heal:28,color:'#f2c568'},
 {id:'cactusFruit',name:'Cactus Fruit',seed:'cactusSeeds',biomes:['badlands'],seconds:55,yield:3,heal:20,color:'#df86aa'},
 {id:'bogRice',name:'Bog Rice',seed:'riceSeeds',biomes:['marsh'],seconds:60,yield:4,heal:16,color:'#e8dca3'},
 {id:'lotusRoot',name:'Lotus Root',seed:'lotusSeeds',biomes:['marsh'],seconds:75,yield:3,heal:27,color:'#d4a1cf'},
 {id:'frostBerry',name:'Frost Berry',seed:'frostSeeds',biomes:['tundra'],seconds:70,yield:3,heal:26,color:'#99d9ee'},
 {id:'emberPepper',name:'Ember Pepper',seed:'pepperSeeds',biomes:['volcanic'],seconds:85,yield:2,heal:32,color:'#f59b72'},
 {id:'forestMushroom',name:'Forest Mushroom',seed:'mushroomSpores',biomes:['woodland'],seconds:50,yield:3,heal:19,color:'#e5bd84'},
 {id:'rawMarijuana',name:'Marijuana',seed:'marijuanaSeeds',seconds:90,yield:2,color:'#7cba67'},
]);
export const GARDEN_RESOURCES=Object.fromEntries([
 ...CROPS.filter(c=>c.id!=='rawMarijuana').map(c=>[c.id,[c.id==='berries'?'Berries':c.name,(c.biomes?c.biomes.join(' / ')+' plants':'Foraging and plant boxes'),`Eat for ${c.heal} health, sell, or grow more from seeds.`,'✿']]),
 ...CROPS.map(c=>[c.seed,[c.name+' Seeds',c.id==='rawMarijuana'?'Harvest mountain marijuana':'Forage plants in the matching biome','Plant in a crafted plant box, then add water. Harvest returns seeds.','·']]),
 ['freshWater',['Fresh Water','Click lake, river or ocean water with a waterskin','One unit waters one plant-box growth cycle.','◉']],
]);
export function forageCrop(node){const seed=[...node.id].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261),pool=CROPS.filter(c=>c.biomes?.includes(node.biome)||(!c.biomes&&c.id!=='rawMarijuana'&&({berries:['heartlands','woodland'],carrots:['heartlands'],alpineHerb:['tundra','mountains'],moonflower:['marsh','woodland']}[c.id]||[]).includes(node.biome))),c=(pool.length?pool:CROPS.slice(0,2))[seed%(pool.length||2)];return {[c.seed]:1,[c.id]:1};}
export class GardenPlot{
 constructor(){this.crop=null;this.growing=false;this.progress=0;}
 plant(inv,id){const c=CROPS.find(c=>c.id===id);if(!c||this.growing||!inv.consume(c.seed,1))return false;this.crop=c;this.progress=0;this.growing=true;return true;}
 update(dt,box){if(!this.growing||box.fuel<=0)return;this.progress=Math.min(this.crop.seconds,this.progress+dt);if(this.progress<this.crop.seconds)return;box.fuel--;box.storage[this.crop.id]=(box.storage[this.crop.id]||0)+this.crop.yield;box.storage[this.crop.seed]=(box.storage[this.crop.seed]||0)+2;this.growing=false;box.context?.inventory.progression.gain(8);}
 recover(inv){if(this.growing)inv.add(this.crop.seed,1);this.growing=false;}
}
