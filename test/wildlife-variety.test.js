import test from 'node:test';
import assert from 'node:assert/strict';
import { Creature, CreatureRegistry, populateCreatures } from '../src/creatures.js';
import { SpawnZoneManager } from '../src/spawn-zones.js';
import { SpawnableRegistry } from '../src/spawnables.js';
import { populateWorld } from '../src/spawner.js';

test('new wildlife and cave species inhabit the generated world',()=>{
  const registry=new CreatureRegistry();populateCreatures(registry);
  for(const kind of ['fox','boar','tortoise','caveSlime','crystalBeetle','emberGolem'])assert.ok(registry.creatures.some(m=>m.kind===kind),kind);
});

test('depth increases health, damage and pursuit speed, including shiny enemies and respawns',()=>{
  for(const shiny of [false,true])for(const kind of ['caveBat','caveCrawler','rockScorpion','stoneRam','caveSlime','crystalBeetle','emberGolem']){
    let previous=null;
    for(const layer of ['cave','deep','abyss','core']){
      const mob=new Creature({id:'depth-test',kind,x:4000,y:2700,layer,shiny});
      if(previous){assert.ok(mob.maxHealth>previous.maxHealth);assert.ok(mob.damage>previous.damage);assert.ok(mob.speed>previous.speed);}
      const max=mob.maxHealth;mob.hit(9999,0);mob.update(.1,60001,{layer:'surface',x:0,y:0});assert.equal(mob.health,max);
      previous=mob;
    }
  }
});

test('cave loose stones are capped below surface density without removing starter stones',()=>{
  const registry=new SpawnableRegistry();populateWorld(new SpawnZoneManager(),registry);
  const counts=new Map();
  for(const node of registry.nodes.values())if(node.kind==='ground'&&node.resource==='stone'&&node.layer!=='surface')counts.set(node.zoneId,(counts.get(node.zoneId)||0)+1);
  assert.ok(counts.size>0);assert.ok([...counts.values()].every(count=>count<=13));
  assert.ok([...registry.nodes.values()].some(n=>n.id==='starter-pebble-1'));
});
