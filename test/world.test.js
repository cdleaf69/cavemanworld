import { MATERIALS } from '../src/materials.js';
import { LAYERS, EXTRA_CAVES, portalDestination } from '../src/world.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { SURFACE, CAVES, DEEP_CAVES, WALK_SPEED, SPRINT_MULTIPLIER, PATHS, PORTALS, DESCENTS, CAVE_ROOMS, TUNNELS, DEEP_ROOMS, DEEP_TUNNELS, HUTS, canWalk, nearestPortal, biomeAt } from '../src/world.js';
import { SpawnZoneManager, defaultZones } from '../src/spawn-zones.js';
import { Gear, Tool, TIERS } from '../src/spawnables.js';
import { BRIDGE_SPANS } from '../src/bridges.js';

test('river crossings stay short and connected to their paths',()=>{
  assert.equal(BRIDGE_SPANS.length,5);
  assert.ok(BRIDGE_SPANS.every(span=>span.length<400));
  assert.ok(BRIDGE_SPANS.some(span=>span.path==='Mire Walk'));
});

test('surface uses the requested faster walking and sprint speeds', () => {
  assert.equal(WALK_SPEED,157.5);
  assert.equal(SURFACE.width*SURFACE.height,18000*14000*3);
  assert.equal(CAVES.width*CAVES.height,8000*5400*3);
  assert.equal(DEEP_CAVES.width*DEEP_CAVES.height,8800*6000*3);
  assert.equal(SPRINT_MULTIPLIER,2.5);
  assert.equal(canWalk(SURFACE.spawn.x,SURFACE.spawn.y,'surface'),true);
  assert.equal(canWalk(-1,100,'surface'),false);
  assert.equal(canWalk(SURFACE.width+1,100,'surface'),false);
});

test('every drawn surface path has a clear centerline and every cave mouth is reachable', () => {
  for (const path of PATHS) for (let i=1;i<path.points.length;i++) {
    const a=path.points[i-1],b=path.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/20);
    for(let j=0;j<=steps;j++){const t=j/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;assert.ok(canWalk(x,y,'surface'),`${path.name} blocked at ${Math.round(x)},${Math.round(y)}`);}
  }
  for(const p of PORTALS){assert.ok(canWalk(p.surface.x,p.surface.y,'surface'),p.id);assert.equal(nearestPortal(p.surface.x,p.surface.y,'surface')?.id,p.id);}
});

test('cave paths and chambers are walkable, cave walls block movement', () => {
  for(const room of CAVE_ROOMS)assert.ok(canWalk(room.x,room.y,'cave'),room.name);
  for(const tunnel of TUNNELS)for(let i=1;i<tunnel.points.length;i++){
    const a=tunnel.points[i-1],b=tunnel.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/20);
    for(let j=0;j<=steps;j++){const t=j/steps;assert.ok(canWalk(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,'cave'));}
  }
  for(const p of PORTALS){assert.ok(canWalk(p.cave.x,p.cave.y,'cave'),p.id);assert.equal(nearestPortal(p.cave.x,p.cave.y,'cave')?.id,p.id);}
  assert.equal(canWalk(4000,100,'cave'),false);
  assert.equal(canWalk(CAVES.width+1,300,'cave'),false);
  assert.equal(canWalk(HUTS[0].x,HUTS[0].y,'surface'),false);
  assert.equal(canWalk(7330,4250,'surface'),false); // river away from a marked crossing
});

test('multiple descents connect upper and lower cave routes',()=>{
  assert.ok(DESCENTS.length>=3);
  for(const room of DEEP_ROOMS)assert.ok(canWalk(room.x,room.y,'deep'),room.name);
  for(const tunnel of DEEP_TUNNELS)for(let i=1;i<tunnel.points.length;i++){
    const a=tunnel.points[i-1],b=tunnel.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/25);
    for(let j=0;j<=steps;j++){const t=j/steps;assert.ok(canWalk(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,'deep'),`blocked deep tunnel at ${i}`);}
  }
  for(const p of DESCENTS)for(const layer of Object.keys(LAYERS).filter(l=>p[l])){assert.ok(canWalk(p[layer].x,p[layer].y,layer),p.id);assert.equal(nearestPortal(p[layer].x,p[layer].y,layer)?.id,p.id);assert.ok(p[portalDestination(p,layer)]);}
  assert.equal(canWalk(DEEP_CAVES.width+1,100,'deep'),false);
});

test('zones describe biome, boundaries, and allowed resources independently of terrain', () => {
  const storage={value:null,getItem(){return this.value;},setItem(_,v){this.value=v;}};
  const manager=new SpawnZoneManager(storage);
  assert.equal(manager.zones.length,defaultZones().length);
  for(const zone of manager.zones){assert.ok(zone.vertices.length>=3);assert.ok(zone.biome);assert.ok(zone.allowedTypes.length);assert.ok(zone.resources.length);}
  const zone=manager.zones[0],v=zone.vertices[0];zone.name='Edited grove';zone.vertices[0]={x:v.x+1,y:v.y+1};manager.save();
  const restored=new SpawnZoneManager(storage);assert.equal(restored.zones[0].name,'Edited grove');assert.equal(restored.zones[0].vertices[0].x,v.x+1);
  manager.reset();assert.equal(manager.zones[0].name,defaultZones()[0].name);
});

test('resource tiers and equipment models are ready without populating the terrain', () => {
  for(const id of ['leaf','wood','stone','iron',...MATERIALS.map(m=>m.id)])assert.ok(TIERS[id]);
  assert.equal(new Tool({id:'t',type:'pickaxe',tier:'iron'}).durability,100);
  assert.equal(new Gear({id:'g',slot:'body',tier:'leaf'}).tier,'leaf');
  assert.equal(biomeAt(9000,7000).id,'heartlands');
});

test('abyss and core rooms have connected walkable tunnels',()=>{
  for(const [layer,geometry] of Object.entries(EXTRA_CAVES)){
    for(const room of geometry.rooms)assert.ok(canWalk(room.x,room.y,layer));
    for(const t of geometry.tunnels)for(let i=1;i<t.points.length;i++)for(let k=0;k<=100;k++){
      const a=t.points[i-1],b=t.points[i],f=k/100;assert.ok(canWalk(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,layer));
    }
    assert.equal(canWalk(20,20,layer),false);
  }
});
