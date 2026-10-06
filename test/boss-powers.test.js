import test from 'node:test';
import assert from 'node:assert/strict';
import {Bigfoot,summonEden} from '../src/frontier-creatures.js';
import {MOUNTAINS} from '../src/frontier-world.js';
import {SulfurStorm,ProjectileRegistry} from '../src/combat-objects.js';
const boss=()=>new Bigfoot(MOUNTAINS.find(m=>m.boss==='steezus'));
test('Steezus cycles exactly three powers and sulfur targets the last known position',()=>{
 const b=boss(),p={x:b.x+400,y:b.y,layer:'surface'};b.update(.1,1000,p,()=>true);const target={x:p.x,y:p.y};p.x+=300;const rain=b.update(.1,1601,p,()=>true);assert.equal(rain.hazard.kind,'sulfur-rain');assert.equal(rain.hazard.x,target.x);assert.equal(rain.hazard.y,target.y);assert.match(b.dialogue,/OLD TESTAMENT/);
 b.update(.1,9000,p,()=>true);assert.ok(b.update(.1,9601,p,()=>true).summon);
 b.update(.1,17000,p,()=>true);b.update(.1,17601,p,()=>true);assert.ok(b.skatingUntil>17601);const x=b.x,y=b.y;const shot=b.update(.1,17700,p,()=>true);assert.equal(shot.projectile.kind,'holy-smoke');assert.ok(Math.hypot(b.x-x,b.y-y)>0);assert.ok(b.smokingUntil>17700);assert.equal(b.powerIndex,3);
 b.update(.1,25000,p,()=>true);assert.equal(b.update(.1,25601,p,()=>true).hazard.kind,'sulfur-rain');
});
test('sulfur rain warns, stays fixed, can be dodged and expires',()=>{
 const s=new SulfurStorm({x:100,y:100,radius:155,layer:'surface'},'boss',0),p={x:100,y:100,layer:'surface'};assert.equal(s.update(1599,p),null);assert.equal(s.update(1600,p).damage,22);assert.equal(s.update(1700,p),null);p.x=400;assert.equal(s.update(2200,p),null);assert.equal(s.x,100);p.x=100;assert.equal(s.update(2800,p).kind,'sulfur-rain');assert.equal(s.update(5200,p),null);
 const r=new ProjectileRegistry();r.storm({x:100,y:100,layer:'surface'},'boss',0);r.clear();assert.equal(r.storms.length,0);
});
test('Adam and Eve have small attacks, can be killed, and do not multiply or linger after the boss',()=>{
 const b=boss(),helpers=summonEden(b,1000);assert.deepEqual(helpers.map(h=>h.kind),['adam','eve']);assert.ok(helpers.every(h=>h.damage<10&&h.health<100));const eve=helpers[1],p={x:eve.x+300,y:eve.y,layer:'surface'};assert.equal(eve.update(.1,1100,p,()=>true).projectile.kind,'apple');helpers[0].hit(1000,1200);helpers[0].update(.1,100000,p,()=>true);assert.equal(helpers[0].alive,false);const next=summonEden(b,1300);assert.ok(helpers.every(h=>!h.alive));b.hit(10000,1400);assert.ok(next.every(h=>!h.alive));
});
test('Bigfoot speaks for melee, feces and rolling logs',()=>{
 const b=new Bigfoot(MOUNTAINS[0]),p={x:b.x+500,y:b.y,layer:'surface'};b.update(.1,1000,p,()=>true);b.update(.1,1651,p,()=>true);assert.match(b.dialogue,/SAMPLE|SOURCED|REVIEWS/);b.update(.1,5000,p,()=>true);b.update(.1,5651,p,()=>true);assert.match(b.dialogue,/BRANCH|TREE|BARK/);p.x=b.x;b.update(.1,9000,p,()=>true);assert.match(b.dialogue,/PHOTO|CRYPTID|HANDS/);
});
