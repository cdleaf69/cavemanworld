import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory,RECIPES} from '../src/crafting.js';
import {CROPS} from '../src/gardening.js';
import {ResourceNode} from '../src/spawnables.js';
import {FrontierStructure} from '../src/frontier-structures.js';
import {ProjectileRegistry} from '../src/combat-objects.js';
import {MountainLion,populateFrontierCreatures} from '../src/frontier-creatures.js';
import {CreatureRegistry} from '../src/creatures.js';
import {MOUNTAINS,mountainRadius,altitudeAt,mountainTravelFactor} from '../src/frontier-world.js';
import {canWalk} from '../src/world.js';

test('plant boxes consume seeds and water, respect growth times, return crops/seeds and recover unfinished inputs',()=>{
 for(const crop of CROPS){
  const inv=new Inventory();inv.add(crop.seed,1);inv.add('freshWater',2);
  const box=new FrontierStructure('plant-box',100,100,'surface');
  assert.ok(box.addInput(inv,crop.id));assert.equal(inv.resources[crop.seed],0);
  assert.equal(box.addInput(inv,crop.id),false);box.update(100);assert.equal(box.garden.progress,0);
  assert.ok(box.addFuel(inv));box.update(crop.seconds-.1);assert.equal(box.storage[crop.id],undefined);
  box.update(.2);assert.equal(box.storage[crop.id],crop.yield);assert.equal(box.storage[crop.seed],2);assert.equal(box.fuel,0);
  box.collect(inv);assert.equal(inv.resources[crop.id],crop.yield);assert.ok(box.addInput(inv,crop.id));assert.ok(box.addFuel(inv));box.update(1);box.recover(inv);
  assert.equal(inv.resources[crop.seed],2);assert.equal(inv.resources.freshWater,1);assert.equal(inv.structures['plant-box'],1);
 }
 assert.ok(RECIPES.some(r=>r.id==='waterskin'));assert.ok(RECIPES.some(r=>r.id==='plant-box'));
});
test('foraging provides biome crops and seeds',()=>{
 const seeds=new Set();for(const biome of ['heartlands','woodland','tundra','marsh','badlands','volcanic'])for(let i=0;i<100;i++){
  const n=new ResourceNode({id:'test-bush-'+i,kind:'bush',resource:'leaves',x:1,y:1,layer:'surface'}),r=(n.biome=biome,n.take(1000));
  assert.equal(r.loot.sticks,2);assert.equal(r.loot.leaves,2);
  for(const c of CROPS.filter(c=>c.heal))if(r.loot[c.seed]){seeds.add(c.seed);assert.equal(r.loot[c.id],1);}
 }assert.equal(seeds.size,CROPS.filter(c=>c.heal).length);
});
test('feces lands at the aimed range, splashes and damages only players standing in its temporary puddle',()=>{
 const registry=new ProjectileRegistry(),player={x:62000,y:24500,layer:'surface'};
 registry.launch({x:61000,y:24500,angle:0,speed:340,damage:25,layer:'surface',kind:'feces',range:100},'bigfoot',0);
 registry.update(.4,400,player);assert.equal(registry.projectiles.length,0);assert.equal(registry.puddles.length,1);
 const p=registry.puddles[0];assert.ok(Math.abs(p.x-61100)<13);
 assert.equal(registry.update(.1,1000,player).length,0);player.x=p.x;
 assert.equal(registry.update(.1,1100,player)[0].kind,'puddle');assert.equal(registry.update(.1,1200,player).length,0);
 assert.equal(registry.update(.1,2100,player)[0].damage,12);player.layer='cave';assert.equal(registry.update(.1,3100,player).length,0);
 registry.update(.1,13000,player);assert.equal(registry.puddles.length,0);
 registry.clear();assert.equal(registry.puddles.length,0);
});
test('mountain lions inhabit all ranges, chase uphill and cannot wander out of their mountain',()=>{
 const r=new CreatureRegistry();populateFrontierCreatures(r);
 assert.equal(r.creatures.filter(c=>c.kind==='mountainLion').length,24);
 for(const m of MOUNTAINS){
  const lion=new MountainLion(m,2),before=altitudeAt(lion.x,lion.y),player={x:lion.x,y:lion.y-400,layer:'surface'};
  for(let i=0;i<40;i++)lion.update(.05,1000+i*50,player,canWalk);
  assert.ok(altitudeAt(lion.x,lion.y)>before);assert.ok(mountainRadius(m,lion.x,lion.y)<1);assert.equal(lion.temperament,'hostile');assert.ok(lion.health>90);
 }
});
test('mountain ascent has restrained uphill effort and downhill relief while flat ground keeps normal speed',()=>{
 const m=MOUNTAINS[0],y=m.y+m.ry*.7;
 assert.ok(mountainTravelFactor(m.x,y,0,-10)<1);assert.ok(mountainTravelFactor(m.x,y,0,10)>1);
 assert.equal(mountainTravelFactor(m.x,m.y,10,0),1);assert.equal(mountainTravelFactor(9000,7000,10,0),1);
});
