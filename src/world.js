import {STORE_LAYER} from './underground-store-data.js';
import {CAVE_LAYERS,caveDepth,caveClearance,naturalizeCaves} from './cave-shapes.js';
import {naturalBiomePolygon} from './biome-shapes.js';
import {FRONTIER_BIOMES,FRONTIER_PATHS,FRONTIER_CAVE_ENTRIES,MOUNTAINS,mountainAt,plateauAt,coastline} from './frontier-world.js';
import {roundedPathPoints} from './path-geometry.js';
import { MATERIALS } from './materials.js';
import {TOWNS,TOWN_BUILDINGS,buildingForLayer,INTERIOR_SIZE,fixturesForBuilding,VILLAGE_HUTS} from './town-data.js';
export {TOWNS,TOWN_BUILDINGS,buildingForLayer} from './town-data.js';
export const SURFACE = { width: 135000, height: 84000, spawn: { x: 9000, y: 7000 } };
export const CAVES = { width: 16000, height: 8100 };
export const DEEP_CAVES = { width: 17600, height: 9000, spawn:{x:4700,y:3300} };
export const WALK_SPEED = 157.5;
export const SPRINT_MULTIPLIER = 2.5;
export const PLAYER_RADIUS = 24;

export const BIOMES = [
  { id: 'woodland', name: 'Elderwood', color: '#698a65', edge: '#4e7255', center: [4200, 5000], radii: [3700, 3750], seed: 3 },
  { id: 'tundra', name: 'Frostfall', color: '#b5c9be', edge: '#83a99f', center: [10000, 2250], radii: [6650, 2100], seed: 9 },
  { id: 'marsh', name: 'Mirefen', color: '#82977b', edge: '#5d786e', center: [4700, 11300], radii: [3900, 2650], seed: 14 },
  { id: 'badlands', name: 'Redstone Reach', color: '#bd8463', edge: '#a56651', center: [15100, 6850], radii: [2900, 3700], seed: 21 },
  { id: 'volcanic', name: 'Ashen Crown', color: '#8d7770', edge: '#695d59', center: [13200, 11600], radii: [3900, 2450], seed: 28 },
  { id:'woodland',name:'The Emerald Wilds',color:'#4f7952',edge:'#315d44',center:[23400,7600],radii:[6200,5000],seed:39 },
  { id:'tundra',name:'Silverpine Highlands',color:'#aec3bd',edge:'#7f9a94',center:[26700,2000],radii:[9300,2600],seed:45 },
  { id:'marsh',name:'Willowmere',color:'#647f64',edge:'#3e655b',center:[8300,17800],radii:[8000,3100],seed:51 },
  { id:'badlands',name:'Sunscar Mesa',color:'#ba8560',edge:'#875c49',center:[32500,11400],radii:[4200,6800],seed:57 },
  { id:'volcanic',name:'Cinderfall',color:'#786762',edge:'#51494a',center:[22300,17700],radii:[7700,3500],seed:62 },
  {id:'woodland',name:'Fernwild Expanse',color:'#4f7952',center:[41700,8100],radii:[7200,6200],seed:71},
  {id:'tundra',name:'Aurora Frontier',color:'#aec3bd',center:[43900,2100],radii:[9800,3100],seed:78},
  {id:'badlands',name:'Ochre Dunes',color:'#ba8560',center:[50000,17800],radii:[4400,9100],seed:85},
  {id:'marsh',name:'Lotus Basin',color:'#647f64',center:[37100,27600],radii:[8000,6400],seed:92},
  {id:'volcanic',name:'Ember Peninsula',color:'#786762',center:[48900,30400],radii:[5400,4700],seed:99},
  {id:'woodland',name:'Southroot Forest',color:'#4f7952',center:[8500,26700],radii:[7600,6400],seed:106},
  {id:'marsh',name:'Rainveil Wetlands',color:'#647f64',center:[22400,30100],radii:[7500,5100],seed:113},
  {id:'badlands',name:'Amberstep Plateau',color:'#ba8560',center:[27000,23400],radii:[6200,4300],seed:120},
];
export const DEFAULT_BIOME = { id: 'heartlands', name: 'Heartlands', color: '#9ab389', edge: '#7b9e77' };

export function blobPoints([cx, cy], [rx, ry], seed, count = 56) {
  const points = [];
  for (let i = 0; i < count; i++) {
    const a = i * Math.PI * 2 / count;
    const wave = 1 + .045 * Math.sin(a * 5 + seed) + .032 * Math.cos(a * 11 - seed * 2) + .025 * Math.sin(a * 17 + seed * .7);
    points.push({ x: cx + Math.cos(a) * rx * wave, y: cy + Math.sin(a) * ry * wave });
  }
  return points;
}
BIOMES.push(...FRONTIER_BIOMES.map(b=>({...b,color:'#8ac36f',edge:'#658f70'})));
for (const biome of BIOMES){biome.polygon = naturalBiomePolygon(biome);biome.bounds={left:Math.min(...biome.polygon.map(p=>p.x)),right:Math.max(...biome.polygon.map(p=>p.x)),top:Math.min(...biome.polygon.map(p=>p.y)),bottom:Math.max(...biome.polygon.map(p=>p.y))};}

export function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function biomeAt(x, y, layer = 'surface') {
  if(layer==='ocean')return {id:'ocean',name:'The Sunken Reach',color:'#287f99'};
  const building=buildingForLayer(layer);if(building)return {id:building.biome||'heartlands',name:building.name,color:'#526858'};
  if(EXTRA_CAVES[layer]){const room=EXTRA_CAVES[layer].rooms.reduce((best,r)=>Math.hypot(x-r.x,y-r.y)<Math.hypot(x-best.x,y-best.y)?r:best);return {id:room.biome,name:room.name,color:'#655782',edge:'#ad93c8'};}
  if (layer === 'cave') return { id: 'cave', name: 'Deep Below', color: '#665c59', edge: '#a78867' };
  if (layer === 'deep') {const room=[...DEEP_ROOMS].sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0];return {id:room?.biome||'deep',name:room?.name||'The Lower Dark',color:'#514c5d',edge:'#a699b2'};}
  if (Math.hypot(x - 9000, y - 7000) < 760) return DEFAULT_BIOME;
  for (let i = BIOMES.length - 1; i >= 0; i--) if (x>=BIOMES[i].bounds.left&&x<=BIOMES[i].bounds.right&&y>=BIOMES[i].bounds.top&&y<=BIOMES[i].bounds.bottom&&pointInPolygon(x, y, BIOMES[i].polygon)) return BIOMES[i];
  return DEFAULT_BIOME;
}

export const PATHS = [
  { name: 'Elder Trail', points: [[9000,7000],[8250,6930],[7380,6530],[6450,6100],[5420,5400],[4550,4440],[3600,3320]] },
  { name: 'Western Fork', points: [[6450,6100],[5600,6800],[4550,7380],[3250,7500],[1800,7200]] },
  { name: 'Frost Road', points: [[9000,7000],[9130,5950],[9480,4970],[10100,3950],[10900,2550],[11600,1520]] },
  { name: 'Northwest Pass', points: [[9480,4970],[8470,4070],[7350,3050],[6100,2420],[4840,1920]] },
  { name: 'Redstone Road', points: [[9000,7000],[10100,6860],[11250,6480],[12500,6020],[13600,5120],[14750,3550]] },
  { name: 'Eastern Spur', points: [[12500,6020],[13650,6640],[14700,7520],[16300,8500],[17500,9300]] },
  { name: 'Mire Walk', points: [[9000,7000],[8420,7540],[8170,7890],[7680,8050],[7480,8410],[7400,8730],[6400,9710],[5300,10650],[4100,11000],[2600,12200]] },
  { name: 'Ash Road', points: [[9000,7000],[9710,7860],[10600,8880],[11650,10020],[12800,10800],[13750,11300],[15300,12700]] },
  { name: 'South Ridge', points: [[7400,8730],[8100,10050],[8950,11300],[9900,12600]] },
  { name: 'Crown Connector', points: [[14700,7520],[14500,8870],[13950,9950],[13750,11300]] },
  {name:'Emerald Way',points:[[16300,8500],[18500,8200],[20500,7100],[22900,7500],[25300,6800],[27500,7900],[30200,9000],[33200,10500]]},
  {name:'Silverpine Trail',points:[[22900,7500],[23700,5900],[25000,4200],[26600,2500],[29500,1400],[32700,2100]]},
  {name:'Willow Walk',points:[[8950,11300],[9300,14000],[10500,15900],[8600,17800],[5500,18300],[2700,19000]]},
  {name:'Cinder Trail',points:[[15300,12700],[17800,14200],[20300,16500],[23300,17800],[26700,18700],[30200,18200],[33200,16500]]},
  {name:'Wilds Passage',points:[[25300,6800],[24500,9700],[25100,12500],[23300,15000],[23300,17800]]},
  {name:'Fernwild Trail',points:[[33200,10500],[36000,9700],[38700,8500],[41600,7600],[44700,9400],[48000,12500],[51500,17200]]},
  {name:'Aurora Way',points:[[38700,8500],[40600,6000],[43100,3600],[46400,2400],[51000,2000]]},
  {name:'Lotus Road',points:[[33200,16500],[35400,19300],[37700,22300],[38400,26100],[36900,29400],[33700,32000]]},
  {name:'Ember Coast',points:[[51500,17200],[49800,22000],[48100,25400],[48500,28600],[51100,32200]]},
  {name:'Southroot Way',points:[[5500,18300],[6200,21000],[8500,24000],[7800,27300],[4900,30000],[2400,32000]]},
  {name:'Rainveil Passage',points:[[26700,18700],[27900,21100],[27200,24500],[24400,27600],[24600,29300],[22800,31000],[19100,32200]]},
  {name:'Southern Connector',points:[[7800,27300],[12200,28100],[16000,29000],[19100,32200],[22800,31000],[28500,31500],[33700,32000],[40700,31100],[48500,28600]]},
  {name:'Hearthside Lane',points:[[9000,7000],[8500,7000],[8500,7660],[8800,7660],[8800,7626]]},
];

export const RIVER_HALF_WIDTH=145;
export const RIVER = [[7750,-100],[7560,1000],[7970,2270],[7720,3260],[7330,4250],[7610,5260],[7990,6190],[8170,7450],[7590,8700],[7100,9900],[7200,11300],[6750,14050],[7200,16100],[7900,17800],[6900,19400],[7100,21200],[9600,23000],[11000,25700],[12500,28200],[13900,31000],[13300,35200],[16200,42000],[19500,50000],[16800,58000],[23000,66000],[30000,74000],[34000,84100]];
export const LAKES = [
  {id:'hearthmere',name:'Hearthmere',x:9000,y:8050,rx:260,ry:210},
  {id:'moonpool',name:'Moonpool',x:5210,y:11100,rx:205,ry:205},
  {id:'willowmere-tarn',name:'Willowmere Tarn',x:10400,y:17300,rx:390,ry:265},
  {id:'fernwater',name:'Fernwater Lake',x:42800,y:11500,rx:1150,ry:960},
  {id:'lotus-mere',name:'Lotus Mere',x:35200,y:27900,rx:820,ry:590},
  {id:'rainveil-pool',name:'Rainveil Pool',x:23300,y:28700,rx:630,ry:470},
  {id:'great-mirror',name:'Great Mirror Lake',x:98600,y:62500,rx:4800,ry:3500},
];
export function lakeShape(lake,angle){const seed=LAKES.indexOf(lake)*1.37;return .87+.085*Math.sin(angle*3+seed)+.045*Math.cos(angle*5-seed);}
export function lakeDistance(lake,x,y){const dx=(x-lake.x)/lake.rx,dy=(y-lake.y)/lake.ry;return (Math.hypot(dx,dy)-lakeShape(lake,Math.atan2(dy,dx)))*Math.min(lake.rx,lake.ry);}
export function lakeOutline(lake){return Array.from({length:80},(_,i)=>{const a=i*Math.PI/40,r=lakeShape(lake,a);return [lake.x+Math.cos(a)*lake.rx*r,lake.y+Math.sin(a)*lake.ry*r];});}
export function oceanDistance(x,y){return coastline(y)-x;}
export function waterAt(x,y,layer='surface'){
 if(layer!=='surface')return false;
 if(oceanDistance(x,y)<0||lakeAt(x,y))return true;
 if(!RIVER.slice(1).some((b,i)=>distanceToSegment(x,y,...RIVER[i],...b)<RIVER_HALF_WIDTH))return false;
 return !PATHS.some(path=>path.points.slice(1).some((b,i)=>distanceToSegment(x,y,...path.points[i],...b)<51));
}
export function lakeAt(x,y){return LAKES.find(lake=>lakeDistance(lake,x,y)<0)||null;}
export function lakeWaterDistance(x,y){let closest=Infinity;for(const lake of LAKES){if(Math.abs(x-lake.x)>lake.rx+300||Math.abs(y-lake.y)>lake.ry+300)continue;closest=Math.min(closest,lakeDistance(lake,x,y));}return closest;}

export const PORTALS = [
  { id: 'elder-mouth', name: 'Elder Mouth', surface: { x: 3600, y: 3320 }, cave: { x: 850, y: 1050 } },
  { id: 'frost-crack', name: 'Frost Crack', surface: { x: 11600, y: 1520 }, cave: { x: 6160, y: 780 } },
  { id: 'redstone-hollow', name: 'Redstone Hollow', surface: { x: 14750, y: 3550 }, cave: { x: 7040, y: 2280 } },
  { id: 'mire-sink', name: 'Mire Sink', surface: { x: 4100, y: 11000 }, cave: { x: 1120, y: 4470 } },
  { id: 'ash-gate', name: 'Ash Gate', surface: { x: 13750, y: 11300 }, cave: { x: 6300, y: 4510 } },
  {id:'emerald-mouth',name:'Emerald Hollow',surface:{x:25300,y:6800},cave:{x:10100,y:2600}},
  {id:'silverpine-mouth',name:'Silverpine Vault',surface:{x:32700,y:2100},cave:{x:14200,y:1700}},
  {id:'cinder-mouth',name:'Cinderfall Rift',surface:{x:23300,y:17800},cave:{x:13300,y:6500}},
  {id:'southroot-mouth',name:'Southroot Hollow',surface:{x:7800,y:27300},cave:{x:2000,y:6800}},
  {id:'lotus-mouth',name:'Lotus Cavern',surface:{x:36900,y:29400},cave:{x:4900,y:7000}},
  {id:'aurora-mouth',name:'Aurora Vault',surface:{x:51000,y:2000},cave:{x:14500,y:4500}},
  {id:'coast-mouth',name:'Ember Coast Rift',surface:{x:51100,y:32200},cave:{x:14700,y:7400}},
];

// Tunnels and rooms are navigable geometry, shared by rendering and collision.
export const CAVE_ROOMS = [
  { x: 850, y: 1050, r: 420, name: 'Elder Chamber' },
  { x: 2550, y: 1480, r: 490, name: 'Echo Hall' },
  { x: 3950, y: 2700, r: 680, name: 'The Deep Hearth' },
  { x: 6160, y: 780, r: 400, name: 'Frost Vault' },
  { x: 7040, y: 2280, r: 430, name: 'Redstone Grotto' },
  { x: 1120, y: 4470, r: 440, name: 'Mire Hollow' },
  { x: 2740, y: 4200, r: 370, name: 'Glowpool' },
  { x: 6300, y: 4510, r: 480, name: 'Ash Vault' },
  { x: 5300, y: 3450, r: 390, name: 'Iron Lode' },
  {x:10100,y:2600,r:750,name:'Emerald Hollow'},
  {x:14200,y:1700,r:650,name:'Silverpine Vault'},
  {x:13300,y:6500,r:850,name:'Cinderfall Rift'},
  {x:9500,y:6400,r:680,name:'The Root Cathedral'},
  {x:2000,y:6800,r:500,name:'Southroot Hollow',biome:'woodland'},
  {x:4900,y:7000,r:550,name:'Lotus Cavern',biome:'marsh'},
  {x:14500,y:4500,r:600,name:'Aurora Vault',biome:'tundra'},
  {x:14700,y:7400,r:450,name:'Ember Coast Rift',biome:'volcanic'},
];
export const TUNNELS = [
  { points: [[850,1050],[1700,1050],[2550,1480],[3300,1950],[3950,2700]], width: 340 },
  { points: [[3950,2700],[4600,1930],[5290,1210],[6160,780]], width: 315 },
  { points: [[6160,780],[6860,1450],[7040,2280],[6260,2740],[5300,3450]], width: 300 },
  { points: [[3950,2700],[3040,3000],[2210,3660],[1120,4470]], width: 335 },
  { points: [[1120,4470],[1920,4240],[2740,4200],[3670,3550],[3950,2700]], width: 310 },
  { points: [[3950,2700],[4740,3370],[5300,3450],[5900,4070],[6300,4510]], width: 340 },
  { points: [[2740,4200],[3780,4630],[5050,4540],[6300,4510]], width: 300 },
  {points:[[7040,2280],[8450,2850],[10100,2600],[11600,1800],[14200,1700]],width:380},
  {points:[[10100,2600],[11000,4200],[12300,5100],[13300,6500],[11400,7100],[9500,6400],[7900,5400],[6300,4510]],width:400},
  {points:[[2740,4200],[2000,6800],[4900,7000],[7300,6800],[9500,6400]],width:330},
  {points:[[14200,1700],[14500,4500],[14700,7400],[13300,6500]],width:340},
];

// A second connected underground map. Descents are passages, not teleport-only art.
export const DEEP_ROOMS = [
  {x:1250,y:1100,r:470,name:'Root Descent',biome:'deep-woodland'},
  {x:3300,y:1600,r:530,name:'Prism Gallery',biome:'deep-badlands'},
  {x:5400,y:1000,r:470,name:'Frost Root',biome:'deep-tundra'},
  {x:6900,y:2300,r:570,name:'Ember Deep',biome:'deep-volcanic'},
  {x:4700,y:3300,r:720,name:'Black Heart',biome:'deep'},
  {x:1800,y:4300,r:560,name:'Bone Trench',biome:'deep-marsh'},
  {x:6900,y:4900,r:540,name:'Moon Vault',biome:'deep'},
  {x:10200,y:2700,r:850,name:'Jade Abyss',biome:'deep-woodland'},
  {x:15100,y:1600,r:780,name:'Aurora Crypt',biome:'deep-tundra'},
  {x:14900,y:6900,r:950,name:'Obsidian Throne',biome:'deep-volcanic'},
  {x:9600,y:7400,r:800,name:'Forgotten Gardens',biome:'deep-marsh'},
];
export const DEEP_TUNNELS = [
  {points:[[1250,1100],[2200,1250],[3300,1600],[4200,2600],[4700,3300]],width:350},
  {points:[[3300,1600],[4300,1150],[5400,1000],[6300,1550],[6900,2300]],width:325},
  {points:[[4700,3300],[5900,2850],[6900,2300]],width:340},
  {points:[[4700,3300],[3500,3700],[1800,4300]],width:350},
  {points:[[4700,3300],[5750,4200],[6900,4900]],width:340},
  {points:[[1800,4300],[3000,5000],[4700,4800],[6900,4900]],width:310},
  {points:[[6900,2300],[8500,1800],[10200,2700],[12500,2200],[15100,1600]],width:390},
  {points:[[10200,2700],[11300,4600],[13500,5100],[14900,6900],[12100,7800],[9600,7400],[8100,6100],[6900,4900]],width:410},
];
export const DESCENTS = [
  {id:'echo-descent',name:'Echo Descent',cave:{x:2760,y:1650},deep:{x:1250,y:1100}},
  {id:'frost-descent',name:'Frost Descent',cave:{x:5900,y:950},deep:{x:5400,y:1000}},
  {id:'ash-descent',name:'Ash Descent',cave:{x:6510,y:4710},deep:{x:6900,y:2300}},
  {id:'glow-descent',name:'Glowpool Descent',cave:{x:2900,y:4330},deep:{x:1800,y:4300}},
  {id:'emerald-descent',name:'Jade Descent',cave:{x:10300,y:2800},deep:{x:10200,y:2700}},
  {id:'cinder-descent',name:'Throne Descent',cave:{x:13600,y:6500},deep:{x:14900,y:6900}},
];

export const HUTS=VILLAGE_HUTS;


export const EXTRA_CAVES={};
for(const [layer,depth] of [['abyss',3],['core',4],['mantle',5],['vault',6]]){
  const rooms=MATERIALS.filter(m=>m.depth===depth).map((m,i)=>({x:1700+(i%3)*2400,y:1500+Math.floor(i/3)*3000,r:650,name:`${m.name} ${layer==='core'?'Sanctum':'Hollow'}`,biome:m.biome,material:m.id}));
  const tunnels=rooms.slice(1).map((r,i)=>({width:280,points:[[rooms[i].x,rooms[i].y],[r.x,r.y]]}));
  EXTRA_CAVES[layer]={width:8500,height:6200,spawn:{x:1700,y:1500},rooms,tunnels,depth};
}
for(const town of TOWNS){
 PATHS.push({name:`${town.name} Approach`,points:town.approach||[town.connection,[town.x,town.y]]});
 for(const b of TOWN_BUILDINGS.filter(b=>b.town===town.id&&b.id!=='lucky-hearth')){const side=b.x+(b.x<town.x?-250:250);PATHS.push({name:`${b.name} Lane`,points:b.type==='casino'?[[town.x,town.y],[town.x,town.y+280],[b.x,town.y+280],[b.x,b.y+126]]:b.type==='house'?[[town.x,town.y],[town.x,town.y+950],[b.x,town.y+950],[b.x,b.y+126]]:[[town.x,town.y],[b.x,town.y],[b.x,b.y+126]]});}
}
PATHS.push({name:'Lucky Hearth Lane',points:[[10600,7600],[10600,7660],[8800,7660],[8800,7626]]});
// Retain a handful of short footbridges without drawing roads across continents.
const crossings=[];
for(const path of PATHS)for(let i=1;i<path.points.length;i++)for(let j=1;j<RIVER.length;j++){
 const a=path.points[i-1],b=path.points[i],c=RIVER[j-1],d=RIVER[j],ux=b[0]-a[0],uy=b[1]-a[1],vx=d[0]-c[0],vy=d[1]-c[1],det=ux*vy-uy*vx;if(Math.abs(det)<.001)continue;
 const t=((c[0]-a[0])*vy-(c[1]-a[1])*vx)/det,q=((c[0]-a[0])*uy-(c[1]-a[1])*ux)/det;if(t<0||t>1||q<0||q>1)continue;
 const x=a[0]+ux*t,y=a[1]+uy*t;if(crossings.some(p=>Math.hypot(p.x-x,p.y-y)<500))continue;const l=Math.hypot(vx,vy),nx=-vy/l,ny=vx/l;crossings.push({x,y,name:path.name,points:[[x-nx*360,y-ny*360],[x+nx*360,y+ny*360]],localCrossing:true});
}
// Towns retain lanes and short approaches; wilderness navigation uses the atlas.
for(let i=PATHS.length-1;i>=0;i--){const path=PATHS[i];if(!path.localCrossing&&!/Lane|Approach/.test(path.name))PATHS.splice(i,1);else if(/Approach/.test(path.name)){const end=path.points.at(-1),near=path.points.at(-2)||end,dx=near[0]-end[0],dy=near[1]-end[1],d=Math.hypot(dx,dy),t=Math.min(1,1000/(d||1));path.points=[[end[0]+dx*t,end[1]+dy*t],end];}}

PATHS.push(...crossings);
for(const path of PATHS){path.width=/Lane|Approach/.test(path.name)?88:112;path.points=roundedPathPoints(path.points,path.width===88?80:120);}
export const CASINO_BUILDING=TOWN_BUILDINGS[0];
export const CASINO={width:1100,height:850,spawn:{x:550,y:700}};
export const BUILDING_PORTALS=TOWN_BUILDINGS.map(b=>({id:b.id,name:b.name,surface:{x:b.x,y:b.y+(b.hut?160:126)},[b.layer]:{x:550,y:755}}));
export const CASINO_FIXTURES=[{id:'slots',x:320,y:205,width:290,height:90,activity:{x:320,y:300}},{id:'blackjack',x:780,y:385,width:260,height:150,activity:{x:780,y:505}}];
export function casinoActivityAt(x,y,range=160){return CASINO_FIXTURES.find(f=>Math.hypot(x-f.activity.x,y-f.activity.y)<range)||null;}
export const LAYERS={[STORE_LAYER]:INTERIOR_SIZE,surface:SURFACE,ocean:SURFACE,cave:CAVES,deep:DEEP_CAVES,...EXTRA_CAVES,...Object.fromEntries(TOWN_BUILDINGS.map(b=>[b.layer,INTERIOR_SIZE]))};
export const LAYER_NAMES={[STORE_LAYER]:'Underground 7-Eleven · Layer 7',surface:'Surface',ocean:'Ocean Floor',cave:'Upper Caves · Ore Level 1',deep:'Deep Caves · Ore Level 2',abyss:'Abyss · Ore Level 3',core:'World Core · Ore Level 4',mantle:'Molten Mantle · Ore Level 5',vault:'Primordial Vault · Ore Level 6',casino:'The Lucky Hearth'};
Object.assign(LAYER_NAMES,Object.fromEntries(TOWN_BUILDINGS.map(b=>[b.layer,b.name])));
const CAVE_GEOMETRY={};
export function caveGeometry(layer){return CAVE_GEOMETRY[layer]||EXTRA_CAVES[layer];}
export function portalDestination(portal,layer){return Object.keys(LAYERS).find(key=>key!==layer&&portal[key]);}
DESCENTS.push({id:'abyss-descent',name:'Abyss Descent',deep:{x:4850,y:3400},abyss:{x:1700,y:1500}}, {id:'core-descent',name:'Core Descent',abyss:{x:4400,y:4600},core:{x:1700,y:1500}});

// Every underground layer uses the same north-up coordinates as the surface.
// Old room arrays are regenerated in place so all consumers share the geometry.
const chamberNames=['Elder Chamber','Frost Vault','Redstone Grotto','Mire Hollow','Ash Vault','Emerald Hollow','Silverpine Vault','Cinderfall Rift','Southroot Hollow','Lotus Cavern','Aurora Vault','Ember Coast Rift'];
const roomBiome=r=>biomeAt(r.x,r.y,'surface').id;
const upper=PORTALS.map((p,i)=>{p.cave={...p.surface};return {...p.cave,r:1400+(i%3)*160,name:chamberNames[i],biome:roomBiome(p.surface)};});
upper.push({x:9000,y:7000,r:1700,name:'Echo Hall',biome:'woodland'},{x:19000,y:12000,r:1900,name:'The Deep Hearth',biome:'badlands'},{x:28500,y:20500,r:1800,name:'Iron Lode',biome:'badlands'},{x:15500,y:25500,r:1700,name:'Glowpool',biome:'marsh'},{x:41500,y:19000,r:2000,name:'The Root Cathedral',biome:'woodland'});
for(const e of FRONTIER_CAVE_ENTRIES){const point={x:e.x,y:e.y};PORTALS.push({id:e.id,name:e.name,surface:{...point},cave:{...point}});upper.push({...point,r:1700,name:e.name,biome:roomBiome(point)});}
function connectedTunnels(rooms){
 const connected=[0],remaining=new Set(rooms.slice(1).map((_,i)=>i+1)),tunnels=[],edges=new Set();
 const link=(a,b)=>{const key=[a,b].sort((x,y)=>x-y).join(':');if(edges.has(key))return;edges.add(key);const p=rooms[a],q=rooms[b];const distance=Math.hypot(q.x-p.x,q.y-p.y),steps=Math.max(2,Math.ceil(distance/850)),seed=a*1.71+b*.93,points=Array.from({length:steps+1},(_,i)=>{const t=i/steps,bend=Math.sin(t*Math.PI)*(Math.sin(t*Math.PI*3+seed)*Math.min(1800,distance*.12)+Math.cos(seed)*Math.min(1200,distance*.08));return [p.x+(q.x-p.x)*t-(q.y-p.y)/distance*bend,p.y+(q.y-p.y)*t+(q.x-p.x)/distance*bend];});tunnels.push({width:620+(a%3)*80,seed,points});};
 while(remaining.size){let pair,best=Infinity;for(const a of connected)for(const b of remaining){const d=Math.hypot(rooms[a].x-rooms[b].x,rooms[a].y-rooms[b].y);if(d<best){best=d;pair=[a,b];}}link(...pair);connected.push(pair[1]);remaining.delete(pair[1]);}
 for(let a=0;a<rooms.length;a++){const nearest=rooms.map((r,i)=>({i,d:Math.hypot(r.x-rooms[a].x,r.y-rooms[a].y)})).filter(r=>r.i!==a).sort((p,q)=>p.d-q.d).slice(0,2);for(const b of nearest)link(a,b.i);}
 return tunnels;
}
CAVE_ROOMS.splice(0,CAVE_ROOMS.length,...upper);TUNNELS.splice(0,TUNNELS.length,...connectedTunnels(upper));
Object.assign(CAVES,{width:SURFACE.width,height:SURFACE.height,spawn:{...upper[12]}});
const deep=upper.map((r,i)=>({...r,r:r.r+250,name:['Root Descent','Frost Root','Prism Gallery','Bone Trench','Ember Deep','Jade Abyss','Aurora Crypt','Obsidian Throne','Forgotten Gardens','Lotus Deep','Aurora Deep','Ember Coast Deep','Black Heart','Moon Vault','Sunstone Vault','Bogiron Garden','Jade Cathedral'][i]||r.name+' Deep',biome:'deep-'+r.biome}));
DEEP_ROOMS.splice(0,DEEP_ROOMS.length,...deep);DEEP_TUNNELS.splice(0,DEEP_TUNNELS.length,...connectedTunnels(deep));
Object.assign(DEEP_CAVES,{width:SURFACE.width,height:SURFACE.height,spawn:{x:deep[12].x,y:deep[12].y}});
const descentRooms=[12,1,4,15,5,7];
DESCENTS.splice(0,DESCENTS.length,...['echo','frost','ash','glow','emerald','cinder'].map((id,i)=>{const r=upper[descentRooms[i]];const point={x:r.x+400,y:r.y+350};return {id:id+'-descent',name:r.name+' Passage',cave:{...point},deep:{...point}};}));
for(const [layer,depth] of [['abyss',3],['core',4],['mantle',5],['vault',6]]){
 const materials=MATERIALS.filter(m=>m.depth===depth);
 const rooms=upper.map((r,i)=>{const m=materials.find(m=>m.biome===r.biome)||materials[i%materials.length];return {...r,r:r.r+400,biome:m.biome,material:m.id,name:m.name+' '+(i+1)+(layer==='core'?' Sanctum':' Hollow')};});
 Object.assign(EXTRA_CAVES[layer],{width:SURFACE.width,height:SURFACE.height,rooms,tunnels:connectedTunnels(rooms),spawn:{x:rooms[12].x,y:rooms[12].y}});
}
DESCENTS.push({id:'abyss-descent',name:'Abyss Passage',deep:{x:19400,y:12350},abyss:{x:19400,y:12350}},{id:'core-descent',name:'Core Passage',abyss:{x:41900,y:19350},core:{x:41900,y:19350}});
DESCENTS.push({id:'mantle-descent',name:'Mantle Passage',core:{x:9400,y:7350},mantle:{x:9400,y:7350}},{id:'vault-descent',name:'Primordial Passage',mantle:{x:28900,y:20850},vault:{x:28900,y:20850}});
DESCENTS.push({id:'seven-eleven-descent',name:'7-Eleven · Layer 7',vault:{x:28900,y:21050},[STORE_LAYER]:{x:550,y:755}});
for(const layer of CAVE_LAYERS){const depth=caveDepth(layer),g=layer==='cave'?{rooms:CAVE_ROOMS,tunnels:TUNNELS}:layer==='deep'?{rooms:DEEP_ROOMS,tunnels:DEEP_TUNNELS}:EXTRA_CAVES[layer];CAVE_GEOMETRY[layer]=naturalizeCaves(g.rooms,g.tunnels,depth);}
export function portalDirection(portal,layer){const order=['surface',...CAVE_LAYERS,STORE_LAYER];return order.indexOf(portalDestination(portal,layer))>order.indexOf(layer)?'Descend':'Ascend';}
export function randomSurfaceSpawn(rng=Math.random){
 // Pick one of several inhabited regions, then a safe patch outside town buildings.
 for(let i=0;i<150;i++){const town=TOWNS[Math.min(TOWNS.length-1,Math.floor(rng()*TOWNS.length))],angle=rng()*Math.PI*2,radius=850+rng()*700,x=Math.round(town.x+Math.cos(angle)*radius),y=Math.round(town.y+Math.sin(angle)*radius);if(canWalk(x,y,'surface',220))return {x,y};}
 return {x:10600,y:7600};
}

export const LANDMARKS = [
  { x: 4850, y: 2260, name: 'Ancestor Stones', type: 'stones', layer: 'surface' },
  { x: 2520, y: 6400, name: 'Old Root', type: 'root', layer: 'surface' },
  { x: 11360, y: 1860, name: 'Ice Fang', type: 'ice', layer: 'surface' },
  { x: 15400, y: 6760, name: 'Great Rib', type: 'fossil', layer: 'surface' },
  { x: 5210, y: 11100, name: 'Moonpool', type: 'pool', layer: 'surface' },
  { x: 12900, y: 11760, name: 'Ember Crater', type: 'crater', layer: 'surface' },
  {x:23000,y:7800,name:'The Elder Giant',type:'root',layer:'surface'},
  {x:26600,y:2800,name:'Silverpine Spire',type:'ice',layer:'surface'},
  {x:33000,y:11000,name:'Sunscar Bones',type:'fossil',layer:'surface'},
  {x:23600,y:18100,name:'Cinderfall Caldera',type:'crater',layer:'surface'},
  {x:41600,y:7600,name:'Fernwild Watch',type:'stones',layer:'surface'},
  {x:46400,y:2400,name:'Aurora Needle',type:'ice',layer:'surface'},
  {x:51100,y:32200,name:'Ember Coast Caldera',type:'crater',layer:'surface'},
  {x:7800,y:27300,name:'Southroot Sentinel',type:'root',layer:'surface'},
  {x:8800,y:7500,name:'The Lucky Hearth',type:'casino',layer:'surface'},
  ...CAVE_ROOMS.map((room, i) => ({ x: room.x, y: room.y, name: room.name, type: 'room', layer: 'cave', index: i })),
  ...DEEP_ROOMS.map((room, i) => ({ x: room.x, y: room.y, name: room.name, type: 'room', layer: 'deep', index: i })),
];

export function distanceToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - x1 - t * dx, y - y1 - t * dy);
}

export function canWalk(x, y, layer = 'surface', radius = PLAYER_RADIUS, swimming = false) {
  const bounds = LAYERS[layer]||SURFACE;
  if (x < radius || y < radius || x > bounds.width - radius || y > bounds.height - radius) return false;
  if(layer==='ocean')return oceanDistance(x,y)<-20;
  if (layer === 'surface') {
    // Mountain height affects presentation, not foot movement. Construction
    // keeps its separate flat-ground check; ordinary obstacles still apply.
    if(TOWN_BUILDINGS.some(b=>!b.hut&&Math.abs(x-b.x)<b.width/2+radius&&Math.abs(y-b.y)<b.height/2+radius))return false;
    if (HUTS.some(h => Math.hypot(x - h.x, y - h.y) < h.r + radius)) return false;
    if(swimming)return true;
    if(oceanDistance(x,y)<radius)return false;
    if (LAKES.some(lake=>((x-lake.x)/(lake.rx+radius))**2+((y-lake.y)/(lake.ry+radius))**2<1)) return false;
    let inRiver = false;
    for (let i = 1; i < RIVER.length; i++) {
      if (distanceToSegment(x,y,...RIVER[i-1],...RIVER[i]) < RIVER_HALF_WIDTH + radius) { inRiver = true; break; }
    }
    if (inRiver) {
      // Surface paths form walkable fords and bridges wherever they cross water.
      for (const path of PATHS) for (let i = 1; i < path.points.length; i++) {
        if (distanceToSegment(x,y,...path.points[i-1],...path.points[i]) < 51 - radius) return true;
      }
      return false;
    }
    return true;
  }
  const building=buildingForLayer(layer);
  if(building){const fixtures=building.type==='casino'?CASINO_FIXTURES:fixturesForBuilding(building);return x>65+radius&&x<1035-radius&&y>65+radius&&y<800-radius&&!fixtures.some(f=>Math.abs(x-f.x)<f.width/2+radius&&Math.abs(y-f.y)<f.height/2+radius);}
  const geometry=caveGeometry(layer);return !!geometry&&caveClearance(x,y,geometry)>radius;
}

export function nearestPortal(x, y, layer, range = 125) {
  let nearest = null, distance = range;
  for (const portal of [...PORTALS,...DESCENTS,...BUILDING_PORTALS]) {
    if(!portal[layer])continue;
    const d = Math.hypot(x - portal[layer].x, y - portal[layer].y);
    if (d < distance) { nearest = portal; distance = d; }
  }
  return nearest;
}

export function nearbyPlace(x, y, layer) {
  const building=buildingForLayer(layer);if(building)return building.name;
  if(layer==='surface'&&mountainAt(x,y))return mountainAt(x,y).name;
  if(layer==='ocean')return 'The Sunken Reach';
  if(layer==='surface'){const town=TOWNS.find(t=>Math.hypot(x-t.x,y-t.y)<850);if(town)return town.name;}
  const places = LANDMARKS.filter(l => l.layer === layer);
  let nearest = null, distance = layer === 'surface' ? 580 : 700;
  for (const place of places) {
    const d = Math.hypot(place.x - x, place.y - y);
    if (d < distance) { nearest = place; distance = d; }
  }
  return nearest?.name || biomeAt(x, y, layer).name;
}
