import {mountainAt,MOUNTAINS,mountainRadius} from './frontier-world.js';
import { caveGeometry,TOWNS,TOWN_BUILDINGS,LANDMARKS,waterAt } from './world.js';
import { PATHS, TUNNELS, DEEP_TUNNELS, PORTALS, DESCENTS, canWalk, distanceToSegment, biomeAt } from './world.js';
import { Decoration, ResourceNode, ORE_RARITY } from './spawnables.js';

function seedFor(text) { let h=2166136261;for(const char of text){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0; }
function random(seed) { let s=seed;return () => {s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;}; }
function bounds(points) { return points.reduce((b,p)=>({minX:Math.min(b.minX,p.x),maxX:Math.max(b.maxX,p.x),minY:Math.min(b.minY,p.y),maxY:Math.max(b.maxY,p.y)}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity}); }
// Local path buckets keep curved trail clearance checks independent of world size.
const pathCells=new Map();
for(const path of PATHS)for(let i=1;i<path.points.length;i++){
 const a=path.points[i-1],b=path.points[i],pad=path.width/2+20,segment={a,b,clearance:path.width/2+12};
 for(let cy=Math.floor((Math.min(a[1],b[1])-pad)/512);cy<=Math.floor((Math.max(a[1],b[1])+pad)/512);cy++)for(let cx=Math.floor((Math.min(a[0],b[0])-pad)/512);cx<=Math.floor((Math.max(a[0],b[0])+pad)/512);cx++){const key=`${cx}:${cy}`;if(!pathCells.has(key))pathCells.set(key,[]);pathCells.get(key).push(segment);}
}
function nearPath(x,y){
 return (pathCells.get(`${Math.floor(x/512)}:${Math.floor(y/512)}`)||[]).some(s=>distanceToSegment(x,y,...s.a,...s.b)<s.clearance+4*Math.sin(x*.007+y*.011));
}
const portalCells=new Map(),tunnelCells=new Map();
function bucketSegment(cells,layer,s,pad){for(let y=Math.floor((Math.min(s.a[1],s.b[1])-pad)/512);y<=Math.floor((Math.max(s.a[1],s.b[1])+pad)/512);y++)for(let x=Math.floor((Math.min(s.a[0],s.b[0])-pad)/512);x<=Math.floor((Math.max(s.a[0],s.b[0])+pad)/512);x++){const key=`${layer}:${x}:${y}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(s);}}
for(const p of [...PORTALS,...DESCENTS])for(const layer of Object.keys(p)){const at=p[layer];if(at&&typeof at==='object'&&Number.isFinite(at.x))bucketSegment(portalCells,layer,{a:[at.x,at.y],b:[at.x,at.y]},210);}
for(const layer of ['cave','deep','abyss','core','mantle','vault'])for(const t of caveGeometry(layer).tunnels)for(let i=1;i<t.points.length;i++)bucketSegment(tunnelCells,layer,{a:t.points[i-1],b:t.points[i]},95);
function nearPortal(x,y,layer){return (portalCells.get(`${layer}:${Math.floor(x/512)}:${Math.floor(y/512)}`)||[]).some(s=>(x-s.a[0])**2+(y-s.a[1])**2<210**2);}
function nearTunnel(x,y,layer){return (tunnelCells.get(`${layer}:${Math.floor(x/512)}:${Math.floor(y/512)}`)||[]).some(s=>distanceToSegment(x,y,...s.a,...s.b)<95);}
function valid(x,y,zone,radius) {
  if(zone.layer==='surface'&&mountainAt(x,y))return false;
  if(!zone.contains(x,y)||!canWalk(x,y,zone.layer,radius))return false;
  if(zone.id.startsWith('habitat-')&&biomeAt(x,y).id!==zone.biome)return false;
  if(nearPortal(x,y,zone.layer))return false;
  if(zone.layer==='surface'&&TOWNS.some(t=>Math.hypot(x-t.x,y-t.y)<830))return false;
  if(zone.layer==='surface' && (nearPath(x,y)||waterAt(x,y)||TOWN_BUILDINGS.some(b=>Math.abs(x-b.x)<b.width/2+170&&Math.abs(y-b.y)<b.height/2+250)||LANDMARKS.some(l=>l.layer==='surface'&&Math.hypot(x-l.x,y-l.y)<230)))return false;
  if(zone.layer!=='surface'&&radius>20&&nearTunnel(x,y,zone.layer))return false;
  return true;
}
function resourceFor(kind,zone,rng) {
  if(kind==='tree')return zone.resources.includes('wood')?'wood':'leaves';
  if(kind==='bush')return zone.resources.includes('leaves')?'leaves':'wood';
  if(kind==='rock')return 'stone';
  if(kind==='ore'){
    const options=zone.resources.filter(r=>ORE_RARITY[r]);let roll=rng()*options.reduce((sum,r)=>sum+ORE_RARITY[r].weight,0);
    for(const resource of options){roll-=ORE_RARITY[resource].weight;if(roll<=0)return resource;}
    return options[0]||'iron';
  }
  const options=zone.resources.filter(r=>['leaves','wood','stone'].includes(r));
  return options[Math.floor(rng()*options.length)];
}

export function populateWorld(zones,registry) {
  registry.clear();
  const spatial=new Map();
  const nearby=(x,y,layer,range,visit)=>{const cells=spatial.get(layer);if(!cells)return false;const minX=Math.floor((x-range)/160),maxX=Math.floor((x+range)/160),minY=Math.floor((y-range)/160),maxY=Math.floor((y+range)/160),limit=range*range;for(let gy=minY;gy<=maxY;gy++)for(let gx=minX;gx<=maxX;gx++){const bucket=cells.get(gx+gy*2048);if(!bucket)continue;for(const p of bucket){const d2=(p.x-x)**2+(p.y-y)**2;if(d2<limit&&visit(p,d2))return true;}}return false;};
  const occupied=(x,y,layer,kind,scale)=>nearby(x,y,layer,270,(p,d2)=>{
    const gap=layer==='surface'?(kind==='bush'&&p.kind==='bush'?170*Math.max(scale,p.scale):kind==='tree'&&p.kind==='tree'?185*Math.max(scale,p.scale):kind==='bush'||p.kind==='bush'?145*Math.max(scale,p.scale):kind==='tree'||p.kind==='tree'?125*Math.max(scale,p.scale):65):kind==='tree'?165:65;
    return d2<gap*gap;
  });
  const crowdedBushes=(x,y,layer)=>{let count=0;return nearby(x,y,layer,400,p=>p.kind==='bush'&&++count>=5);};
  const remember=(x,y,layer,kind,scale)=>{if(!spatial.has(layer))spatial.set(layer,new Map());const cells=spatial.get(layer),key=Math.floor(x/160)+Math.floor(y/160)*2048;if(!cells.has(key))cells.set(key,[]);cells.get(key).push({x,y,kind,scale});};
  for(const zone of zones.zones) {
    if(zone.id.startsWith('mountain-habitat-')){
      populateMountainHabitat(zone,registry);continue;
    }
    if(zone.allowedTypes.includes('frontier')||zone.id==='ocean-harvest'||zone.id.startsWith('summit-harvest-'))continue;
    if(zone.id==='village-starters')continue; // Curated safe first steps around the village.
    const rng=random(seedFor(zone.id)),box=bounds(zone.vertices),types=zone.allowedTypes.filter(t=>t!=='ground'&&t!=='decoration');
    const habitat=zone.id.startsWith('habitat-');
    const area=(box.maxX-box.minX)*(box.maxY-box.minY);
    const target=habitat?Math.min(10000,Math.round(area/(zone.biome==='woodland'?105000:zone.biome==='heartlands'?150000:130000))):zone.layer==='abyss'||zone.layer==='core'?28:zone.layer!=='surface'?48:zone.id==='elder-canopy'?150:zone.id==='mire-thicket'?110:zone.id==='village-grove'?80:zone.id==='heartlands-east'?90:70;
    const placed=[],placedCells=new Map();
    const rememberPlaced=(x,y)=>{placed.push({x,y});const key=`${Math.floor(x/160)}:${Math.floor(y/160)}`;if(!placedCells.has(key))placedCells.set(key,[]);placedCells.get(key).push({x,y});};
    const nearPlaced=(x,y,gap)=>{const gx=Math.floor(x/160),gy=Math.floor(y/160);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const p of placedCells.get(`${gx+dx}:${gy+dy}`)||[])if((p.x-x)**2+(p.y-y)**2<gap*gap)return true;return false;};
    for(let attempt=0;attempt<target*35&&placed.length<target&&types.length;attempt++){
      const x=Math.round(box.minX+rng()*(box.maxX-box.minX)),y=Math.round(box.minY+rng()*(box.maxY-box.minY));
      // A varying probability field creates meandering glades, dense pockets, and single trees.
      const density=.50+.22*Math.sin(x*.0019+Math.sin(y*.0027)*2)+.20*Math.cos(y*.0013+x*.0006);
      if(habitat&&(density<.38||rng()>density))continue;
      const roll=rng();
      let kind=habitat?(roll<(zone.biome==='woodland'?.48:zone.biome==='heartlands'?.23:.30)?'tree':roll<.82?'bush':'rock'):types[Math.floor(rng()*types.length)],resource=resourceFor(kind,zone,rng);
      if(kind==='bush'&&zone.biome==='woodland'&&rng()<.55)continue;
      if(!zone.resources.includes(resource))continue;
      const radius={tree:43,bush:28,rock:34,ore:37}[kind];
      const scale=.75+rng()*.65;
      if(occupied(x,y,zone.layer,kind,scale)||kind==='bush'&&zone.layer==='surface'&&crowdedBushes(x,y,zone.layer)||!valid(x,y,zone,radius))continue;
      const node=new ResourceNode({id:`${zone.id}-${placed.length}`,kind,resource,x,y,radius,quantity:kind==='bush'?2:3,layer:zone.layer,zoneId:zone.id});
      node.biome=zone.biome;node.variant=Math.floor(rng()*12);node.scale=scale;
      registry.addNode(node);rememberPlaced(x,y);remember(x,y,zone.layer,kind,scale);
    }
    // Each rare region has a discoverable vein even when weighted rolls miss it.
    const rare=zone.resources.find(r=>ORE_RARITY[r]?.label==='rare'||['obsidian','moonstone'].includes(r));
    if(rare&&zone.allowedTypes.includes('ore'))for(let attempt=0;attempt<350;attempt++){
      const x=Math.round(box.minX+rng()*(box.maxX-box.minX)),y=Math.round(box.minY+rng()*(box.maxY-box.minY));
      if(!valid(x,y,zone,37)||nearPlaced(x,y,100))continue;
      registry.addNode(new ResourceNode({id:`${zone.id}-rare`,kind:'ore',resource:rare,x,y,radius:37,quantity:4,layer:zone.layer,zoneId:zone.id}));break;
    }
    // Loose stones are hand-pickable; large boulders remain mining targets.
    const looseStoneTarget=zone.layer==='surface'?(habitat?Math.min(1000,Math.ceil(area/1400000)):20):35;
    if(zone.resources.includes('stone')&&zone.allowedTypes.includes('ground'))for(let attempt=0,created=0;attempt<looseStoneTarget*40&&created<looseStoneTarget;attempt++){
      const x=Math.round(box.minX+rng()*(box.maxX-box.minX)),y=Math.round(box.minY+rng()*(box.maxY-box.minY));
      if(!valid(x,y,zone,12)||nearPlaced(x,y,90))continue;
      registry.addNode(new ResourceNode({id:`${zone.id}-pebble-${created++}`,kind:'ground',resource:zone.layer==='surface'&&habitat?['stone','sticks','leaves'][created%3]:'stone',x,y,radius:12,quantity:1,layer:zone.layer,zoneId:zone.id}));
    }
    if(zone.allowedTypes.includes('decoration')){
      const count=habitat?Math.round(target*.65):zone.layer==='surface'&&zone.allowedTypes.includes('tree')?90:zone.layer==='surface'?50:40;
      for(let attempt=0,created=0;attempt<count*35&&created<count;attempt++){
        const x=Math.round(box.minX+rng()*(box.maxX-box.minX)),y=Math.round(box.minY+rng()*(box.maxY-box.minY));
        if(zone.layer==='surface'&&mountainAt(x,y))continue;
  if(!zone.contains(x,y)||!canWalk(x,y,zone.layer,4)||nearPortal(x,y,zone.layer)||(habitat&&biomeAt(x,y).id!==zone.biome))continue;
        const kind=zone.layer!=='surface'?(zone.layer==='cave'?'mushroom':'crystal'):zone.biome==='marsh'?'reed':zone.biome==='badlands'?'bone':zone.biome==='volcanic'?'ash':['flower','fern','grass','mushroom'][Math.floor(rng()*4)];
        registry.addDecoration(new Decoration({id:`${zone.id}-dec-${created++}`,kind,x,y,layer:zone.layer,zoneId:zone.id}));
      }
    }
  }
  // Bound density around every existing bush, including overlapping zone edges.
  // Candidate-only checks allow neighboring clusters to accumulate around an older bush.
  const bushCells=new Map();
  const local=(x,y)=>{const gx=Math.floor(x/350),gy=Math.floor(y/350),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)for(const n of bushCells.get(`${gx+dx}:${gy+dy}`)||[])if(Math.hypot(n.x-x,n.y-y)<350)out.push(n);return out;};
  for(const n of [...registry.nodes.values()].filter(n=>n.kind==='bush'&&n.layer==='surface')){
   const neighbors=local(n.x,n.y);if(neighbors.length>=7||neighbors.some(p=>local(p.x,p.y).length>=7)){registry.remove(n.id);continue;}
   const key=`${Math.floor(n.x/350)}:${Math.floor(n.y/350)}`;if(!bushCells.has(key))bushCells.set(key,[]);bushCells.get(key).push(n);
  }
  return { nodes:registry.nodes.size, decorations:registry.decorations.size };
}

export function populateMountainHabitat(zone,registry){
 const m=MOUNTAINS.find(m=>zone.id==='mountain-habitat-'+m.id);if(!m)return;
 const rng=random(seedFor(zone.id)),placed=[];
 const validPoint=(x,y,gap)=>{
  if(!zone.contains(x,y)||mountainAt(x,y)!==m||waterAt(x,y)||!canWalk(x,y,'surface',10))return false;
  // Keep the travel lane, boss clearing, and both crop clusters readable.
  const trailDistance=Math.min(...m.trail.slice(1).map((b,i)=>distanceToSegment(x,y,...m.trail[i],...b)));
  if(trailDistance<76||Math.hypot(x-m.x,y-m.y-80)<230)return false;
  if([-480,480].some((dx,i)=>Math.hypot(x-m.x-dx,y-m.y-250-i*160)<210))return false;
  return !placed.some(p=>Math.hypot(x-p.x,y-p.y)<Math.max(gap,p.gap));
 };
 for(const [kind,target,gap] of [['tree',310,190],['bush',170,185],['rock',260,135]]){
  if(!zone.allowedTypes.includes(kind))continue;const resource={tree:'wood',bush:'leaves',rock:'stone'}[kind];if(!zone.resources.includes(resource))continue;
  for(let attempt=0,count=0;attempt<target*180&&count<target;attempt++){
   let x,y;
   const angle=rng()*Math.PI*2,r=rng()<.78?Math.sqrt(.4**2+rng()*(.97**2-.4**2)):Math.sqrt(rng())*.34;
   x=m.x+Math.cos(angle)*m.rx*r;y=m.y+Math.sin(angle)*m.ry*r;
   x=Math.round(x);y=Math.round(y);if(!validPoint(x,y,gap))continue;
   const h=mountainRadius(m,x,y),node=new ResourceNode({id:zone.id+'-'+kind+'-'+count++,kind,resource,x,y,radius:{tree:43,bush:28,rock:34}[kind],quantity:kind==='tree'?4:kind==='bush'?2:3,layer:'surface',zoneId:zone.id});
   node.biome=m.id==='frostpeak'?'tundra':h>.55?'woodland':'heartlands';node.variant=Math.floor(rng()*12);if(kind==='tree'&&rng()<.65)node.variant=Math.floor(rng()*3)*4;
   node.scale=kind==='tree'?.7+rng()*.28:.75+rng()*.45;registry.addNode(node);placed.push({x,y,gap});
  }
 }
 if(zone.allowedTypes.includes('decoration'))for(let attempt=0,count=0;attempt<5000&&count<100;attempt++){
  const angle=rng()*Math.PI*2,r=Math.sqrt(rng())*.96,x=m.x+Math.cos(angle)*m.rx*r,y=m.y+Math.sin(angle)*m.ry*r;if(!validPoint(x,y,65))continue;
  registry.addDecoration(new Decoration({id:zone.id+'-tuft-'+count++,kind:rng()<.6?'grass':'flower',x,y,layer:'surface',zoneId:zone.id}));placed.push({x,y,gap:55});
 }
}

export function populateSpawnSupplies(registry,spawn){
 const seeds=[['bush','leaves',80,60,28,2],['tree','wood',150,-90,43,4],['rock','stone',-160,-110,34,5],...Array.from({length:8},(_,i)=>['ground','stone',Math.cos(i*.785)*180,Math.sin(i*.785)*180,12,1])];
 for(const [i,[kind,resource,dx,dy,radius,quantity]] of seeds.entries()){
  const x=spawn.x+dx,y=spawn.y+dy;if(mountainAt(x,y)||!canWalk(x,y,'surface',radius)||waterAt(x,y))continue;
  registry.addNode(new ResourceNode({id:`spawn-supply-${i}`,zoneId:'spawn-supplies',kind,resource,x,y,radius,quantity,layer:'surface'}));
 }
}
