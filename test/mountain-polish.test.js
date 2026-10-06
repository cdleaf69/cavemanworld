import test from 'node:test';
import assert from 'node:assert/strict';
import {SpawnZoneManager} from '../src/spawn-zones.js';
import {SpawnableRegistry} from '../src/spawnables.js';
import {populateMountainHabitat} from '../src/spawner.js';
import {MOUNTAINS,mountainAt,elevationOffset,mountainSurfacePoint} from '../src/frontier-world.js';
import {canWalk,distanceToSegment} from '../src/world.js';
import {FrontierNodes} from '../src/expeditions.js';
import {PixelArt} from '../src/pixel-art.js';

test('mountain habitats have sparse harvestable trees, bushes and rocks beside clear trails and crop patches',()=>{
 const zones=new SpawnZoneManager(null),registry=new SpawnableRegistry();
 for(const zone of zones.zones.filter(z=>z.id.startsWith('mountain-habitat-')))populateMountainHabitat(zone,registry);
 const nodes=[...registry.nodes.values()];
 for(const m of MOUNTAINS){
  const local=nodes.filter(n=>mountainAt(n.x,n.y)===m);
  for(const kind of ['tree','bush','rock'])assert.ok(local.filter(n=>n.kind===kind).length>=12,m.id+' '+kind);
  assert.ok(local.length<=740);
  const slopes=local.filter(n=>!((n.x-m.x)**2/m.rx**2+(n.y-m.y)**2/m.ry**2<.4**2));
  assert.ok(slopes.length>local.length*.55,'most scenery is on the slopes');
  assert.ok(new Set(slopes.map(n=>Math.floor((Math.atan2(n.y-m.y,n.x-m.x)+Math.PI)/Math.PI*4))).size>=7,'scenery covers the mountain on all sides');
  assert.ok(local.some(n=>elevationOffset(n.x,n.y)>30&&elevationOffset(n.x,n.y)<m.height*.20),'nodes along the climb');
  for(const n of local){
   assert.ok(canWalk(n.x,n.y,'surface',10));
   assert.ok(Math.min(...m.trail.slice(1).map((b,i)=>distanceToSegment(n.x,n.y,...m.trail[i],...b)))>=76);
   assert.ok(Math.hypot(n.x-m.x,n.y-m.y-80)>=230);
  }
  const plants=new FrontierNodes(zones).items.filter(n=>n.kind==='marijuana'&&mountainAt(n.x,n.y)===m);
  assert.equal(plants.length,6);
  for(const n of local)for(const p of plants)assert.ok(Math.hypot(n.x-p.x,n.y-p.y)>110);
 }
});

test('players can walk freely across every mountain slope, including outside marked trails',()=>{
 for(const m of MOUNTAINS)for(const r of [.4,.6,.8,.95])for(let i=0;i<24;i++){
  const a=i*Math.PI/12;assert.ok(canWalk(m.x+Math.cos(a)*m.rx*r,m.y+Math.sin(a)*m.ry*r,'surface',24,true),m.id+' '+r+' '+i);
 }
});

test('mountain terrain resolves the same elevated surface point as a rendered player',()=>{
 for(const m of MOUNTAINS)for(const [dx,dy] of [[0,0],[-600,700],[700,1600],[0,-1100]]){
  const x=m.x+dx,y=m.y+dy,p=mountainSurfacePoint(x,y-elevationOffset(x,y));
  assert.ok(Math.abs(p.y-y)<2);
 }
});

test('terrain fallback preloads four chunks beyond the screen and gives visible chunks priority',()=>{
 const art=new PixelArt({worker:false}),jobs=[],ctx={drawImage(){}};
 art.makeTerrain=(gx,gy,layer)=>{jobs.push({gx,gy,layer});return {};};
 const bounds={left:2100,right:2600,top:2100,bottom:2600};
 for(let i=0;i<110;i++)art.terrain(ctx,bounds,'surface');
 assert.ok(art.tiles.has('surface:0:0'));assert.ok(art.tiles.has('surface:9:9'));
 assert.ok(art.tiles.has('surface:2:2'));assert.ok(art.tiles.has('surface:7:7'));
 assert.ok(jobs.slice(0,4).every(j=>j.gx>=4&&j.gx<=5&&j.gy>=4&&j.gy<=5));
 assert.equal(art.pending.size,0);
 let closed=0;const cache=new PixelArt({worker:false});for(let i=0;i<513;i++)cache.cacheTile(String(i),{close(){closed++;}});
 assert.equal(cache.tiles.size,512);assert.equal(closed,1);
});
