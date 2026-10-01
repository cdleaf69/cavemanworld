import { MATERIALS } from './materials.js';
export const SURFACE = { width: 36000, height: 21000, spawn: { x: 9000, y: 7000 } };
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
for (const biome of BIOMES) biome.polygon = blobPoints(biome.center, biome.radii, biome.seed);

export function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function biomeAt(x, y, layer = 'surface') {
  if(EXTRA_CAVES[layer]){const room=EXTRA_CAVES[layer].rooms.reduce((best,r)=>Math.hypot(x-r.x,y-r.y)<Math.hypot(x-best.x,y-best.y)?r:best);return {id:room.biome,name:room.name,color:'#655782',edge:'#ad93c8'};}
  if (layer === 'cave') return { id: 'cave', name: 'Deep Below', color: '#665c59', edge: '#a78867' };
  if (layer === 'deep') {const room=[...DEEP_ROOMS].sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y))[0];return {id:room?.biome||'deep',name:room?.name||'The Lower Dark',color:'#514c5d',edge:'#a699b2'};}
  if (Math.hypot(x - 9000, y - 7000) < 760) return DEFAULT_BIOME;
  for (let i = BIOMES.length - 1; i >= 0; i--) if (pointInPolygon(x, y, BIOMES[i].polygon)) return BIOMES[i];
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
];

export const RIVER = [[7750,-100],[7560,1000],[7970,2270],[7720,3260],[7330,4250],[7610,5260],[7990,6190],[8170,7450],[7590,8700],[7100,9900],[7200,11300],[6750,14050],[7200,16100],[7900,17800],[6900,19400],[7100,21200]];
export const LAKES = [
  {id:'hearthmere',name:'Hearthmere',x:9000,y:8050,rx:260,ry:210},
  {id:'moonpool',name:'Moonpool',x:5210,y:11100,rx:205,ry:205},
  {id:'willowmere-tarn',name:'Willowmere Tarn',x:10400,y:17300,rx:390,ry:265},
];
export function lakeAt(x,y){return LAKES.find(lake=>((x-lake.x)/lake.rx)**2+((y-lake.y)/lake.ry)**2<1)||null;}
export function lakeWaterDistance(x,y){let closest=Infinity;for(const lake of LAKES){const dy=y-lake.y,dx=(x-lake.x)*lake.ry/lake.rx;closest=Math.min(closest,Math.hypot(dx,dy)-lake.ry);}return closest;}

export const PORTALS = [
  { id: 'elder-mouth', name: 'Elder Mouth', surface: { x: 3600, y: 3320 }, cave: { x: 850, y: 1050 } },
  { id: 'frost-crack', name: 'Frost Crack', surface: { x: 11600, y: 1520 }, cave: { x: 6160, y: 780 } },
  { id: 'redstone-hollow', name: 'Redstone Hollow', surface: { x: 14750, y: 3550 }, cave: { x: 7040, y: 2280 } },
  { id: 'mire-sink', name: 'Mire Sink', surface: { x: 4100, y: 11000 }, cave: { x: 1120, y: 4470 } },
  { id: 'ash-gate', name: 'Ash Gate', surface: { x: 13750, y: 11300 }, cave: { x: 6300, y: 4510 } },
  {id:'emerald-mouth',name:'Emerald Hollow',surface:{x:25300,y:6800},cave:{x:10100,y:2600}},
  {id:'silverpine-mouth',name:'Silverpine Vault',surface:{x:32700,y:2100},cave:{x:14200,y:1700}},
  {id:'cinder-mouth',name:'Cinderfall Rift',surface:{x:23300,y:17800},cave:{x:13300,y:6500}},
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

export const HUTS = [
  { x: 8580, y: 6590, r: 110 }, { x: 8780, y: 6400, r: 115 }, { x: 9380, y: 6550, r: 120 },
  { x: 9510, y: 7220, r: 110 }, { x: 9020, y: 7540, r: 120 }, { x: 8510, y: 7120, r: 108 },
];


export const EXTRA_CAVES={};
for(const [layer,depth] of [['abyss',3],['core',4]]){
  const rooms=MATERIALS.filter(m=>m.depth===depth).map((m,i)=>({x:1700+(i%3)*2400,y:1500+Math.floor(i/3)*3000,r:650,name:`${m.name} ${layer==='core'?'Sanctum':'Hollow'}`,biome:m.biome,material:m.id}));
  const tunnels=rooms.slice(1).map((r,i)=>({width:280,points:[[rooms[i].x,rooms[i].y],[r.x,r.y]]}));
  EXTRA_CAVES[layer]={width:8500,height:6200,spawn:{x:1700,y:1500},rooms,tunnels,depth};
}
export const LAYERS={surface:SURFACE,cave:CAVES,deep:DEEP_CAVES,...EXTRA_CAVES};
export const LAYER_NAMES={surface:'Surface',cave:'Upper Caves · Depth 1',deep:'Deep Caves · Depth 2',abyss:'Abyss · Depth 3',core:'World Core · Depth 4'};
export function caveGeometry(layer){return EXTRA_CAVES[layer]||{rooms:layer==='deep'?DEEP_ROOMS:CAVE_ROOMS,tunnels:layer==='deep'?DEEP_TUNNELS:TUNNELS};}
export function portalDestination(portal,layer){return Object.keys(LAYERS).find(key=>key!==layer&&portal[key]);}
DESCENTS.push({id:'abyss-descent',name:'Abyss Descent',deep:{x:4850,y:3400},abyss:{x:1700,y:1500}}, {id:'core-descent',name:'Core Descent',abyss:{x:4400,y:4600},core:{x:1700,y:1500}});

export const LANDMARKS = [
  { x: 9000, y: 7000, name: 'Central Village', type: 'village', layer: 'surface' },
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
  ...CAVE_ROOMS.map((room, i) => ({ x: room.x, y: room.y, name: room.name, type: 'room', layer: 'cave', index: i })),
  ...DEEP_ROOMS.map((room, i) => ({ x: room.x, y: room.y, name: room.name, type: 'room', layer: 'deep', index: i })),
];

export function distanceToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - x1 - t * dx, y - y1 - t * dy);
}

export function canWalk(x, y, layer = 'surface', radius = PLAYER_RADIUS) {
  const bounds = LAYERS[layer]||SURFACE;
  if (x < radius || y < radius || x > bounds.width - radius || y > bounds.height - radius) return false;
  if (layer === 'surface') {
    if (HUTS.some(h => Math.hypot(x - h.x, y - h.y) < h.r + radius)) return false;
    if (LAKES.some(lake=>((x-lake.x)/(lake.rx+radius))**2+((y-lake.y)/(lake.ry+radius))**2<1)) return false;
    let inRiver = false;
    for (let i = 1; i < RIVER.length; i++) {
      if (distanceToSegment(x,y,...RIVER[i-1],...RIVER[i]) < 83 + radius) { inRiver = true; break; }
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
  const {rooms,tunnels}=caveGeometry(layer);
  if (rooms.some(r => Math.hypot(x - r.x, y - r.y) < r.r - radius)) return true;
  for (const tunnel of tunnels) {
    for (let i = 1; i < tunnel.points.length; i++) {
      const a = tunnel.points[i - 1], b = tunnel.points[i];
      if (distanceToSegment(x, y, ...a, ...b) < tunnel.width / 2 - radius) return true;
    }
  }
  return false;
}

export function nearestPortal(x, y, layer, range = 125) {
  let nearest = null, distance = range;
  for (const portal of [...PORTALS,...DESCENTS]) {
    if(!portal[layer])continue;
    const d = Math.hypot(x - portal[layer].x, y - portal[layer].y);
    if (d < distance) { nearest = portal; distance = d; }
  }
  return nearest;
}

export function nearbyPlace(x, y, layer) {
  const places = LANDMARKS.filter(l => l.layer === layer);
  let nearest = null, distance = layer === 'surface' ? 580 : 700;
  for (const place of places) {
    const d = Math.hypot(place.x - x, place.y - y);
    if (d < distance) { nearest = place; distance = d; }
  }
  return nearest?.name || biomeAt(x, y, layer).name;
}
