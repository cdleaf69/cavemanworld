import { caveGeometry,TOWNS,TOWN_BUILDINGS,LANDMARKS,waterAt } from './world.js';
import { PATHS, TUNNELS, DEEP_TUNNELS, PORTALS, DESCENTS, canWalk, distanceToSegment, biomeAt } from './world.js';
import { Decoration, ResourceNode, ORE_RARITY } from './spawnables.js';

function seedFor(text) { let h=2166136261;for(const char of text){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0; }
function random(seed) { let s=seed;return () => {s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;}; }
function bounds(points) { return points.reduce((b,p)=>({minX:Math.min(b.minX,p.x),maxX:Math.max(b.maxX,p.x),minY:Math.min(b.minY,p.y),maxY:Math.max(b.maxY,p.y)}),{minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity}); }
function nearPath(x,y) {
  for(const path of PATHS)for(let i=1;i<path.points.length;i++)if(distanceToSegment(x,y,...path.points[i-1],...path.points[i])<58+14*Math.sin(x*.007+y*.011))return true;
  return false;
}
function nearPortal(x,y,layer) { return [...PORTALS,...DESCENTS].some(p=>p[layer]&&Math.hypot(x-p[layer].x,y-p[layer].y)<210); }
function nearTunnel(x,y,layer){const {tunnels}=caveGeometry(layer);return tunnels.some(t=>t.points.some((p,i)=>i>0&&distanceToSegment(x,y,...t.points[i-1],...p)<95));}
function valid(x,y,zone,radius) {
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
  const nearby=(x,y,layer,range,visit)=>{const gx=Math.floor(x/160),gy=Math.floor(y/160),reach=Math.ceil(range/160),limit=range*range;for(let dy=-reach;dy<=reach;dy++)for(let dx=-reach;dx<=reach;dx++)for(const p of spatial.get(`${layer}:${gx+dx}:${gy+dy}`)||[]){const d2=(p.x-x)**2+(p.y-y)**2;if(d2<limit&&visit(p,d2))return true;}return false;};
  const occupied=(x,y,layer,kind,scale)=>nearby(x,y,layer,270,(p,d2)=>{
    const gap=layer==='surface'?(kind==='bush'&&p.kind==='bush'?170*Math.max(scale,p.scale):kind==='tree'&&p.kind==='tree'?185*Math.max(scale,p.scale):kind==='bush'||p.kind==='bush'?145*Math.max(scale,p.scale):kind==='tree'||p.kind==='tree'?125*Math.max(scale,p.scale):65):kind==='tree'?165:65;
    return d2<gap*gap;
  });
  const crowdedBushes=(x,y,layer)=>{let count=0;return nearby(x,y,layer,400,p=>p.kind==='bush'&&++count>=5);};
  const remember=(x,y,layer,kind,scale)=>{const key=`${layer}:${Math.floor(x/160)}:${Math.floor(y/160)}`;if(!spatial.has(key))spatial.set(key,[]);spatial.get(key).push({x,y,kind,scale});};
  for(const zone of zones.zones) {
    if(zone.id==='village-starters')continue; // Curated safe first steps around the village.
    const rng=random(seedFor(zone.id)),box=bounds(zone.vertices),types=zone.allowedTypes.filter(t=>t!=='ground'&&t!=='decoration');
    const habitat=zone.id.startsWith('habitat-');
    const area=(box.maxX-box.minX)*(box.maxY-box.minY);
    const target=habitat?Math.min(10000,Math.round(area/(zone.biome==='woodland'?105000:zone.biome==='heartlands'?150000:130000))):zone.layer==='abyss'||zone.layer==='core'?28:zone.layer!=='surface'?48:zone.id==='elder-canopy'?150:zone.id==='mire-thicket'?110:zone.id==='village-grove'?80:zone.id==='heartlands-east'?90:70;
    const placed=[];
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
      registry.addNode(node);placed.push({x,y});remember(x,y,zone.layer,kind,scale);
    }
    // Each rare region has a discoverable vein even when weighted rolls miss it.
    const rare=zone.resources.find(r=>ORE_RARITY[r]?.label==='rare'||['obsidian','moonstone'].includes(r));
    if(rare&&zone.allowedTypes.includes('ore'))for(let attempt=0;attempt<350;attempt++){
      const x=Math.round(box.minX+rng()*(box.maxX-box.minX)),y=Math.round(box.minY+rng()*(box.maxY-box.minY));
      if(!valid(x,y,zone,37)||placed.some(p=>Math.hypot(p.x-x,p.y-y)<100))continue;
      registry.addNode(new ResourceNode({id:`${zone.id}-rare`,kind:'ore',resource:rare,x,y,radius:37,quantity:4,layer:zone.layer,zoneId:zone.id}));break;
    }
    // Loose stones are hand-pickable; large boulders remain mining targets.
    const looseStoneTarget=zone.layer==='surface'?(habitat?Math.min(1000,Math.ceil(area/1400000)):20):35;
    if(zone.resources.includes('stone')&&zone.allowedTypes.includes('ground'))for(let attempt=0,created=0;attempt<looseStoneTarget*40&&created<looseStoneTarget;attempt++){
      const x=Math.round(box.minX+rng()*(box.maxX-box.minX)),y=Math.round(box.minY+rng()*(box.maxY-box.minY));
      if(!valid(x,y,zone,12)||placed.some(p=>Math.hypot(p.x-x,p.y-y)<90))continue;
      registry.addNode(new ResourceNode({id:`${zone.id}-pebble-${created++}`,kind:'ground',resource:zone.layer==='surface'&&habitat?['stone','sticks','leaves'][created%3]:'stone',x,y,radius:12,quantity:1,layer:zone.layer,zoneId:zone.id}));
    }
    if(zone.allowedTypes.includes('decoration')){
      const count=habitat?Math.round(target*.65):zone.layer==='surface'&&zone.allowedTypes.includes('tree')?90:zone.layer==='surface'?50:40;
      for(let attempt=0,created=0;attempt<count*35&&created<count;attempt++){
        const x=Math.round(box.minX+rng()*(box.maxX-box.minX)),y=Math.round(box.minY+rng()*(box.maxY-box.minY));
        if(!zone.contains(x,y)||!canWalk(x,y,zone.layer,4)||nearPortal(x,y,zone.layer)||(habitat&&biomeAt(x,y).id!==zone.biome))continue;
        const kind=zone.layer!=='surface'?(zone.layer==='cave'?'mushroom':'crystal'):zone.biome==='marsh'?'reed':zone.biome==='badlands'?'bone':zone.biome==='volcanic'?'ash':['flower','fern','grass','mushroom'][Math.floor(rng()*4)];
        registry.addDecoration(new Decoration({id:`${zone.id}-dec-${created++}`,kind,x,y,layer:zone.layer,zoneId:zone.id}));
      }
    }
  }
  return { nodes:registry.nodes.size, decorations:registry.decorations.size };
}

export function populateSpawnSupplies(registry,spawn){
 const seeds=[['bush','leaves',80,60,28,2],['tree','wood',150,-90,43,4],['rock','stone',-160,-110,34,5],...Array.from({length:8},(_,i)=>['ground','stone',Math.cos(i*.785)*180,Math.sin(i*.785)*180,12,1])];
 for(const [i,[kind,resource,dx,dy,radius,quantity]] of seeds.entries()){
  const x=spawn.x+dx,y=spawn.y+dy;if(!canWalk(x,y,'surface',radius)||waterAt(x,y))continue;
  registry.addNode(new ResourceNode({id:`spawn-supply-${i}`,zoneId:'spawn-supplies',kind,resource,x,y,radius,quantity,layer:'surface'}));
 }
}
