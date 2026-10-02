import {MOUNTAINS} from './frontier-world.js';
import {FRONTIER_RESOURCES} from './frontier-items.js';
import { MATERIALS } from './materials.js';
import { EXTRA_CAVES } from './world.js';
import { pointInPolygon, BIOMES, SURFACE, CAVE_ROOMS, DEEP_ROOMS } from './world.js';

export const SPAWN_TYPES = ['ground', 'tree', 'bush', 'rock', 'ore', 'decoration', 'frontier'];
export const RESOURCE_TYPES = [...new Set([...MATERIALS.map(m=>m.id),...Object.keys(FRONTIER_RESOURCES),'leaves', 'sticks', 'wood', 'stone', 'iron', 'copper', 'quartz', 'amber', 'obsidian', 'moonstone'])];
export const BIOME_IDS = ['heartlands', 'woodland', 'tundra', 'marsh', 'badlands', 'volcanic', 'cave', 'deep-woodland', 'deep-tundra', 'deep-marsh', 'deep-badlands', 'deep-volcanic', 'deep','mountains','ocean'];

// Polygons are editable boundaries in world coordinates. No terrain renderer consumes
// these as objects; a future spawner can query them and create nodes independently.
const DEFAULTS = [
  ['village-starters','Village Starter Grounds','surface','heartlands',['ground','tree','bush','rock','decoration'],['leaves','wood','stone'],[[8700,6700],[9400,6700],[9400,7350],[8700,7350]]],
  ['village-grove','Village Grove','surface','heartlands',['tree','bush','decoration'],['leaves','wood'],[[7450,6660],[8050,5500],[9060,5480],[8970,6280],[8180,7100]]],
  ['heartlands-east','East Village Grove','surface','heartlands',['tree','bush','decoration'],['leaves','wood'],[[9910,6340],[11300,6080],[12300,7500],[11000,8680],[9700,8090]]],
  ['elder-canopy','Elder Canopy','surface','woodland',['tree','bush','decoration'],['leaves','wood'],[[900,3480],[2250,2120],[4800,2250],[5650,3850],[4750,5550],[2250,5580]]],
  ['elder-stone','Elderwood Stonebeds','surface','woodland',['rock','decoration'],['stone'],[[3900,5570],[4830,5300],[5730,6170],[5020,6980],[3830,6700]]],
  ['frost-scrub','Frost Scrub','surface','tundra',['bush','rock','decoration'],['leaves','stone'],[[6130,650],[8930,450],[9920,1700],[8550,2770],[6520,2170]]],
  ['frost-lode','Frost Quartz Vein','surface','tundra',['ore','rock'],['iron','quartz','stone'],[[11900,250],[14300,420],[15100,1910],[13250,2700],[11600,1610]]],
  ['mire-thicket','Mire Thicket','surface','marsh',['tree','bush','decoration'],['leaves','wood'],[[1050,9800],[3300,8400],[5200,9300],[4550,12150],[2050,13200]]],
  ['mire-shale','Mire Shale','surface','marsh',['rock','decoration'],['stone'],[[5330,11200],[6580,10480],[7180,12220],[6050,13220],[4940,12710]]],
  ['redstone-ore','Redstone Copper Beds','surface','badlands',['ore','rock','decoration'],['iron','copper','stone'],[[14100,4510],[15900,3630],[17500,5110],[17000,6940],[15200,6910]]],
  ['redstone-bush','Dry Brush','surface','badlands',['bush','decoration'],['leaves','wood'],[[15100,7300],[17300,7600],[17700,10100],[15900,9590],[14300,8500]]],
  ['ash-rock','Ashen Scree','surface','volcanic',['rock','ore','decoration'],['stone','iron','obsidian'],[[11600,10400],[13500,10100],[15200,11740],[14100,13300],[11600,12900]]],
  ['ash-scrub','Ash Scrub','surface','volcanic',['bush','decoration'],['leaves','wood'],[[9900,11940],[11300,10900],[11500,12800],[10200,13700]]],
  ['elder-cave','Elder Cave Nodes','cave','cave',['rock','ore','decoration'],['stone','iron','copper'],[[350,700],[1500,620],[2010,1190],[1640,1630],[600,1500]]],
  ['echo-cave','Echo Hall Nodes','cave','cave',['rock','decoration'],['stone'],[[2100,1050],[2860,900],[3220,1750],[2520,2050]]],
  ['deep-iron','Deep Iron Lode','cave','cave',['ore','rock','decoration'],['iron','stone'],[[3450,2100],[4440,2030],[4810,3090],[3710,3520],[3280,2930]]],
  ['frost-cave','Frost Vault Ore','cave','tundra',['ore','rock'],['iron','quartz','stone'],[[5690,450],[6600,410],[6870,1200],[5900,1340]]],
  ['red-cave','Redstone Grotto Ore','cave','badlands',['ore','rock'],['iron','copper','stone'],[[6610,1850],[7470,1810],[7580,2690],[6700,2730]]],
  ['mire-cave','Mire Amber Hollow','cave','marsh',['ore','rock','decoration'],['stone','amber'],[[660,3950],[1590,3880],[1700,4800],[680,4910]]],
  ['ash-cave','Ash Vault Ore','cave','volcanic',['ore','rock','decoration'],['iron','obsidian','stone'],[[5830,4050],[6800,4040],[6890,4980],[5840,5040]]],
  ['root-deep','Root Descent Veins','deep','deep-woodland',['ore','rock','decoration'],['stone','copper','amber'],[[820,750],[1630,740],[1700,1450],[820,1470]]],
  ['prism-deep','Prism Gallery','deep','deep-badlands',['ore','rock','decoration'],['stone','copper','quartz','moonstone'],[[2840,1130],[3710,1140],[3780,2040],[2830,2040]]],
  ['frost-deep','Frost Root Crystals','deep','deep-tundra',['ore','rock','decoration'],['stone','quartz','moonstone'],[[5000,610],[5780,590],[5820,1410],[4980,1430]]],
  ['ember-deep','Ember Deep Glass','deep','deep-volcanic',['ore','rock','decoration'],['stone','obsidian','moonstone'],[[6410,1830],[7390,1840],[7420,2760],[6400,2770]]],
  ['heart-deep','Black Heart Lode','deep','deep',['ore','rock','decoration'],['iron','obsidian','moonstone','stone'],[[4110,2720],[5280,2720],[5300,3870],[4100,3880]]],
  ['bone-deep','Bone Trench Amber','deep','deep-marsh',['ore','rock','decoration'],['stone','amber','copper'],[[1320,3830],[2270,3820],[2290,4750],[1300,4750]]],
  ['moon-deep','Moon Vault','deep','deep',['ore','rock','decoration'],['stone','quartz','moonstone'],[[6460,4460],[7330,4450],[7350,5330],[6450,5340]]],
];
// Broad organic habitats populate the expanded world without baking objects into terrain.
for(const [index,biome] of BIOMES.entries())DEFAULTS.push([
  `habitat-${index}`,`${biome.name} Wilderness`,'surface',biome.id,
  ['tree','bush','rock','decoration'],['wood','leaves','stone'],
  biome.polygon.map(p=>[Math.max(30,Math.min(SURFACE.width-30,p.x)),Math.max(30,Math.min(SURFACE.height-30,p.y))]),
]);
DEFAULTS.push(['habitat-meadows','Heartland Meadows','surface','heartlands',['tree','bush','rock','decoration'],['wood','leaves','stone'],[[30,30],[SURFACE.width-30,30],[SURFACE.width-30,SURFACE.height-30],[30,SURFACE.height-30]]]);
for(let i=DEFAULTS.length-1;i>=0;i--)if(DEFAULTS[i][2]!=='surface'||DEFAULTS[i][0]==='village-starters')DEFAULTS.splice(i,1);
for(const [layer,rooms,depth] of [['cave',CAVE_ROOMS,1],['deep',DEEP_ROOMS,2],...Object.entries(EXTRA_CAVES).map(([layer,g])=>[layer,g.rooms,g.depth])])for(const [i,r] of rooms.entries()){
 const biome=r.biome.replace('deep-',''),m=MATERIALS.find(m=>m.depth===depth&&m.biome===biome)||MATERIALS.find(m=>m.depth===depth);
 DEFAULTS.push([`${layer}-chamber-${i}`,r.name,layer,biome,['ore','rock','ground','decoration'],['stone','iron',m.id],Array.from({length:20},(_,j)=>[r.x+Math.cos(j*Math.PI/10)*r.r*.94,r.y+Math.sin(j*Math.PI/10)*r.r*.94])]);
}
for(const m of MOUNTAINS)DEFAULTS.push(['summit-harvest-'+m.id,m.name+' Summit Harvests','surface','mountains',['frontier'],['rawMarijuana','skyCrystal','alpineFiber','eagleFeather'],Array.from({length:20},(_,i)=>[m.x+Math.cos(i*Math.PI/10)*m.rx*.36,m.y+Math.sin(i*Math.PI/10)*m.ry*.36])]);
DEFAULTS.push(['ocean-harvest','Ocean Floor Forage & Wrecks','ocean','ocean',['frontier'],['coral','pearl','sunkenRelic'],[[86800,30],[89970,30],[89970,62970],[86800,62970]]]);
export const defaultZones = () => DEFAULTS.map(([id,name,layer,biome,allowedTypes,resources,vertices]) => ({
  id, name, layer, biome, allowedTypes: [...new Set([...allowedTypes,...(resources.includes('stone')?['ground']:[])])], resources: [...resources,...(allowedTypes.includes('bush')?['sticks']:[])],
  vertices: vertices.map(([x,y]) => ({x,y})),
}));

export class SpawnZone {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.layer = data.layer;
    this.biome = data.biome;
    this.allowedTypes = [...data.allowedTypes];
    this.resources = [...data.resources];
    if(this.resources.includes('stone')&&!this.allowedTypes.includes('ground'))this.allowedTypes.push('ground');
    if(this.allowedTypes.includes('bush')&&!this.resources.includes('sticks'))this.resources.push('sticks');
    this.vertices = data.vertices.map(p => ({ x: Number(p.x), y: Number(p.y) }));
  }
  contains(x,y) { return pointInPolygon(x,y,this.vertices); }
  toJSON() { return { id:this.id, name:this.name, layer:this.layer, biome:this.biome, allowedTypes:this.allowedTypes, resources:this.resources, vertices:this.vertices }; }
}

export class SpawnZoneManager {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.zones = this.load();
  }
  load() {
    try {
      const saved=JSON.parse(this.storage?.getItem('embervale.spawnZones.v5'));
      if(Array.isArray(saved)&&saved.length&&saved.every(z=>z.id&&z.vertices?.length>=3)){const ids=new Set(saved.map(z=>z.id));return [...saved,...defaultZones().filter(z=>!ids.has(z.id))].map(z=>new SpawnZone(z));}
      const old=JSON.parse(this.storage?.getItem('embervale.spawnZones.v4'));if(Array.isArray(old)&&old.length){const defaults=defaultZones(),preserved=old.filter(z=>z.id!=='habitat-meadows'&&z.vertices?.length>=3),oldIds=new Set(preserved.map(z=>z.id));return [...preserved,...defaults.filter(z=>!oldIds.has(z.id))].map(z=>new SpawnZone(z));}
    } catch { /* invalid saved data: return to defaults */ }
    return defaultZones().map(z => new SpawnZone(z));
  }
  save() { this.storage?.setItem('embervale.spawnZones.v5', JSON.stringify(this.zones)); }
  reset() { this.zones = defaultZones().map(z => new SpawnZone(z)); this.save(); }
  at(x,y,layer) { return [...this.zones].reverse().find(z => z.layer === layer && z.contains(x,y)) || null; }
  forLayer(layer) { return this.zones.filter(z => z.layer === layer); }
  export() { return JSON.stringify({ version:1, zones:this.zones.map(z => z.toJSON()) }, null, 2); }
}
