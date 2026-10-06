import test from 'node:test';
import assert from 'node:assert/strict';
import {LAKES,lakeOutline,lakeDistance,lakeAt,waterAt,oceanDistance,canWalk,HUTS} from '../src/world.js';
import {startJump} from '../src/controls.js';
import {Inventory} from '../src/crafting.js';
import {PlayerProjectile,ProjectileRegistry} from '../src/combat-objects.js';
test('organic shore geometry agrees with water detection and players can swim without crossing houses',()=>{
 for(const lake of LAKES){assert.equal(waterAt(lake.x,lake.y),true);assert.equal(canWalk(lake.x,lake.y,'surface',18,true),true);assert.equal(canWalk(lake.x,lake.y),false);
  for(const [x,y] of lakeOutline(lake))assert.ok(Math.abs(lakeDistance(lake,x,y))<1e-8);
  const radii=lakeOutline(lake).map(([x,y])=>Math.hypot((x-lake.x)/lake.rx,(y-lake.y)/lake.ry));assert.ok(Math.max(...radii)-Math.min(...radii)>.12);
 }
 assert.ok(oceanDistance(134000,20000)<0);assert.equal(waterAt(134000,20000),true);assert.equal(canWalk(134000,20000,'surface',18,true),true);
 for(const h of HUTS)assert.equal(canWalk(h.x,h.y,'surface',18,true),false);
 assert.equal(startJump({swimming:true}),false);
});
test('bows and slingshots craft without auto equipping and use inventory tools',()=>{
 const inv=new Inventory();for(const r of ['wood','sticks','leaves','hide'])inv.add(r,20);
 for(const id of ['wood-bow','slingshot']){assert.equal(inv.craft(id).ok,true);assert.equal(inv.equippedTool,null);assert.equal(inv.equip(id),true);inv.equippedTool=null;}
});
test('player projectiles hit creatures only once and cannot tunnel through cave walls',()=>{
 const target={x:9200,y:7000,radius:20,health:20,hit(damage){this.health-=damage;return {ok:true,dead:this.health<=0};}};
 const creatures={nearby(x,y,layer,range){return Math.hypot(x-target.x,y-target.y)<range?[target]:[];}};
 const registry=new ProjectileRegistry();registry.shoot({x:9000,y:7000,point:{x:9400,y:7000},damage:12,layer:'surface',type:'bow'},0);
 const hits=registry.update(.5,500,{layer:'surface'},creatures);assert.equal(hits.length,1);assert.equal(target.health,8);assert.equal(registry.update(.5,1000,{layer:'surface'},creatures).length,0);
 const shot=new PlayerProjectile({x:850,y:1050,point:{x:850,y:-200},damage:12,layer:'cave',type:'bow',createdAt:0});shot.update(2,1000,{layer:'cave'},creatures);assert.equal(shot.active,false);assert.ok(shot.y>0);
});
