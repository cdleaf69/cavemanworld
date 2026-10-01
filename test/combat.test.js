import test from 'node:test';
import assert from 'node:assert/strict';
import { Creature, CreatureRegistry, populateCreatures } from '../src/creatures.js';
import { PlayerVitals, attackTarget, weaponDamage } from '../src/combat.js';
import { Inventory } from '../src/crafting.js';
import { canWalk } from '../src/world.js';
import { LootRegistry, RockProjectile } from '../src/combat-objects.js';

test('animals drop useful resources, and meat heals after injury',()=>{
  const animal=new Creature({id:'test-rabbit',kind:'rabbit',x:100,y:0,layer:'surface'});
  const target=attackTarget([animal],{x:0,y:0,facing:0,layer:'surface'});
  assert.equal(target,animal);
  assert.equal(attackTarget([animal],{x:0,y:0,facing:Math.PI,layer:'surface'}),null);
  const inventory=new Inventory({level:20});inventory.add('stone',1);
  assert.equal(inventory.craft('hand-rock').ok,true);
  inventory.equip('hand-rock');
  let result;
  for(let i=0;i<4;i++)result=animal.hit(weaponDamage(inventory.equippedTool),i*500);
  assert.equal(result.dead,true);
  for(const [resource,amount] of Object.entries(result.loot))inventory.add(resource,amount);
  assert.equal(inventory.resources.meat,1);assert.equal(inventory.resources.hide,1);
  const vitals=new PlayerVitals();vitals.takeDamage(30,null,1000);
  assert.equal(vitals.health,70);assert.equal(inventory.consume('meat',1),true);
  assert.equal(vitals.heal(25),25);assert.equal(vitals.health,95);
});

test('cave enemies chase, damage, drop crafting bones, and armor absorbs hits',()=>{
  const crawler=new Creature({id:'test-crawler',kind:'caveCrawler',x:4000,y:2700,layer:'cave'});
  let hit=null;
  for(let t=0;t<12000;t+=100){hit=crawler.update(.1,t,{x:4040,y:2700,layer:'cave'},()=>true);if(hit)break;}
  assert.equal(hit.damage,10);
  const inventory=new Inventory({level:20});inventory.add('leaves',3);inventory.craft('leaf-wrap');inventory.equip('leaf-wrap');
  const vitals=new PlayerVitals();assert.equal(vitals.takeDamage(hit.damage,inventory.equippedGear,1000).damage,9);
  assert.equal(vitals.takeDamage(hit.damage,inventory.equippedGear,1100).damage,0);
  const result=crawler.hit(28,2000);assert.equal(result.dead,true);assert.equal(result.loot.bone,1);assert.equal(result.loot.shell,1);
  inventory.add('bone',2);inventory.add('wood',2);assert.equal(inventory.craft('bone-club').ok,true);
  inventory.equip('bone-club');
  assert.equal(weaponDamage(inventory.equippedTool),10);
});

test('creatures populate both layers on walkable ground and respawn after defeat',()=>{
  const registry=new CreatureRegistry();populateCreatures(registry);
  assert.ok(registry.creatures.filter(c=>c.layer==='surface').length>=20);
  assert.ok(registry.creatures.filter(c=>c.layer==='cave').length>=10);
  assert.ok(registry.creatures.every(c=>canWalk(c.x,c.y,c.layer,c.radius)));
  const creature=registry.creatures[0];creature.hit(100,1000);
  assert.equal(creature.alive,false);creature.update(.1,61001,{x:0,y:0,layer:'cave'});
  assert.equal(creature.alive,true);assert.equal(creature.health,creature.maxHealth);
});

test('a player at a cave entrance is safe until they leave the portal area',()=>{
  const registry=new CreatureRegistry();populateCreatures(registry);
  const player={x:850,y:1050,layer:'cave'};
  let attacks=0;
  for(let t=0;t<20000;t+=100)attacks+=registry.update(.1,t,player,canWalk).length;
  assert.equal(attacks,0);
  assert.ok(registry.creatures.filter(c=>c.id.startsWith('cave-0-')).every(c=>Math.hypot(c.x-850,c.y-1050)>=210));
  const hunter=new Creature({id:'test-entrance-hunter',kind:'caveBat',x:1100,y:1050,layer:'cave'});
  assert.equal(hunter.update(.1,20000,{x:1150,y:1050,layer:'cave'},canWalk)?.damage,6);
});

test('cave mobs notice a distant player immediately after leaving an entrance',()=>{
  for(const kind of ['caveBat','caveCrawler','rockScorpion','stoneRam']){
    const mob=new Creature({id:`aware-${kind}`,kind,x:4000,y:2700,layer:'cave'});
    const player={x:4750,y:2700,layer:'cave'};
    const start=mob.x;
    mob.update(.1,1000,player,()=>true);
    assert.ok(mob.x>start,`${kind} did not start pursuing at 750 units`);
    assert.equal(mob.facing,0);
  }
  const nearEntrance=new Creature({id:'aware-entrance',kind:'caveCrawler',x:1150,y:1050,layer:'cave'});
  const start=nearEntrance.x;
  nearEntrance.update(.1,1000,{x:850,y:1050,layer:'cave'},()=>true);
  assert.ok(Math.abs(nearEntrance.x-start)<2);
  nearEntrance.update(.1,1100,{x:1010,y:1050,layer:'cave'},()=>true);
  assert.ok(nearEntrance.x<start);
});

test('mob rewards animate into the world and require pickup',()=>{
  const drops=new LootRegistry(),inventory=new Inventory({level:20});
  drops.spawn({meat:2,hide:1},9000,7000,'surface',1000);
  assert.equal(inventory.resources.meat,0);
  assert.equal(drops.nearest(9000,7000,'surface',1200),null);
  const visual=drops.drops[0].visual(1325);
  assert.ok(visual.height>20);
  const meat=drops.nearest(drops.drops[0].landX,drops.drops[0].landY,'surface',1650);
  assert.equal(meat.resource,'meat');
  assert.equal(drops.collect(meat),true);inventory.add(meat.resource,meat.amount);
  assert.equal(inventory.resources.meat,2);
  assert.equal(drops.collect(meat),false);
});

test('rock scorpions fire dodgeable projectiles that stop at cave walls',()=>{
  const scorpion=new Creature({id:'test-scorpion',kind:'rockScorpion',x:3950,y:2700,layer:'cave'});
  assert.ok(scorpion.speed>50);
  const shot=scorpion.update(.1,2000,{x:4200,y:2700,layer:'cave'},canWalk);
  assert.equal(shot.projectile.damage,11);
  const rock=new RockProjectile({...shot.projectile,sourceId:scorpion.id,createdAt:2000});
  assert.equal(rock.update(.3,2300,{x:4200,y:2950,layer:'cave'}),null);
  assert.equal(rock.active,true);
  let hit=null;
  for(let t=2400;t<=3200;t+=100){hit=rock.update(.1,t,{x:4200,y:2700,layer:'cave'});if(hit)break;}
  assert.equal(hit?.damage,11);
  assert.equal(rock.active,false);
  const safeRock=new RockProjectile({x:1110,y:1050,angle:Math.PI,speed:280,damage:11,layer:'cave',sourceId:'test',createdAt:0});
  let safeHit=null;
  for(let t=100;t<1000&&safeRock.active;t+=100)safeHit=safeRock.update(.1,t,{x:1065,y:1050,layer:'cave'});
  assert.equal(safeHit,null);
  const wallRock=new RockProjectile({x:3950,y:2700,angle:-Math.PI/2,speed:280,damage:11,layer:'cave',sourceId:'test',createdAt:0});
  for(let t=100;t<3000&&wallRock.active;t+=100)wallRock.update(.1,t,{x:100,y:100,layer:'cave'});
  assert.equal(wallRock.active,false);
});

test('shiny creatures are more common below and stone rams wind up before charging',()=>{
  const registry=new CreatureRegistry();populateCreatures(registry);
  const count=layer=>registry.creatures.filter(c=>c.layer===layer),ratio=layer=>count(layer).filter(c=>c.shiny).length/count(layer).length;
  assert.ok(ratio('deep')>ratio('cave'));
  assert.ok(count('deep').some(c=>c.kind==='stoneRam'));
  const shiny=count('deep').find(c=>c.shiny),result=shiny.hit(1000,0);
  assert.equal(result.dead,true);assert.ok(result.loot.glimmer>=2);
  const ram=new Creature({id:'test-ram',kind:'stoneRam',x:4300,y:3300,layer:'deep'});
  const player={x:4450,y:3300,layer:'deep'};
  assert.equal(ram.update(.05,1000,player,canWalk),null);
  assert.ok(ram.windupUntil>1000);
  const before=ram.x;
  ram.update(.05,1650,player,canWalk);
  ram.update(.1,1750,player,canWalk);
  assert.ok(ram.x>before);
});
