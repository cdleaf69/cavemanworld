import test from 'node:test';import assert from 'node:assert/strict';
import {LanWorld} from '../src/lan-server.js';
import {coastline,MOUNTAINS} from '../src/frontier-world.js';
import {SURFACE,RIVER,RIVER_HALF_WIDTH,LAKES,waterAt} from '../src/world.js';
import {CROPS,forageCrop} from '../src/gardening.js';
import {fishLimit,chooseFish} from '../src/fish-species.js';
const act=(w,p,a,t=Date.now())=>w.action(p.id,p.token,a,t);
test('world area doubles; wide river reaches both boundaries and new lake is fishable',()=>{assert.equal(SURFACE.width*SURFACE.height,90000*63000*2);assert.ok(RIVER[0][1]<0&&RIVER.at(-1)[1]>SURFACE.height);assert.ok(RIVER_HALF_WIDTH>83);const l=LAKES.find(l=>l.id==='great-mirror');assert.ok(waterAt(l.x,l.y));assert.ok(MOUNTAINS.every(m=>m.height>=2200&&m.rx>=5800));});
test('biomes provide their own edible crops and growable seeds',()=>{for(const biome of ['heartlands','woodland','tundra','marsh','badlands','volcanic'])for(let i=0;i<30;i++){const loot=forageCrop({id:'bush-'+i,biome}),c=CROPS.find(c=>loot[c.id]);assert.ok(c);assert.ok(loot[c.seed]);if(c.biomes)assert.ok(c.biomes.includes(biome));}});
test('offshore depth gates the largest strange fish even with an advanced rod',()=>{assert.ok(fishLimit({quest:10,rodRank:6,depth:0})<18);assert.equal(fishLimit({quest:10,rodRank:6,depth:15}),18);assert.equal(chooseFish({water:'ocean',quest:10,rodRank:6,depth:15},()=>.999).rank,18);for(let i=0;i<20;i++)assert.ok(chooseFish({water:'ocean',quest:10,rodRank:6,depth:30},()=>i/20).rank>=16);});
test('shared structures validate authorization, reach, tool, cooldown, removal and late joins',()=>{
 const w=new LanWorld(),a=w.join(),b=w.join(),events=[];w.listeners.add(e=>events.push(e));for(const p of [a,b])act(w,p,{type:'position',x:13000,y:8500,layer:'surface'});
 const {structure:s}=act(w,a,{type:'place',kind:'wood-wall',x:13100,y:8500,layer:'surface'});assert.equal(w.snapshot().structures[0].owner,a.id);assert.throws(()=>w.action(a.id,'bad',{type:'mine',id:s.id,tool:'stone-axe'}));assert.throws(()=>act(w,b,{type:'mine',id:s.id,tool:'stone-pickaxe'},1000),/axe/);act(w,b,{type:'mine',id:s.id,tool:'stone-axe'},1000);assert.throws(()=>act(w,b,{type:'mine',id:s.id,tool:'stone-axe'},1100),/Wait/);act(w,b,{type:'mine',id:s.id,tool:'stone-axe'},1500);assert.ok(act(w,b,{type:'mine',id:s.id,tool:'stone-axe'},2000).removed);assert.equal(w.snapshot().structures.length,0);assert.ok(events.some(e=>e.type==='remove'&&e.data.actor===b.id));
 const stone=act(w,a,{type:'place',kind:'stone-wall',x:13100,y:8500,layer:'surface'}).structure;assert.throws(()=>act(w,b,{type:'mine',id:stone.id,tool:'stone-axe'},3000),/pickaxe/);act(w,b,{type:'position',x:14000,y:8500,layer:'surface'});assert.throws(()=>act(w,b,{type:'mine',id:stone.id,tool:'stone-pickaxe'},3000),/closer/);
});
test('rafts require water, reserve one driver, move in water and release driver on departure',()=>{
 const w=new LanWorld(),a=w.join(),b=w.join(),x=coastline(14500)+250,y=14500;for(const p of [a,b])act(w,p,{type:'position',x,y,layer:'surface'});
 assert.throws(()=>act(w,a,{type:'place',kind:'reed-raft',x:x-350,y,layer:'surface'}));const raft=act(w,a,{type:'place',kind:'reed-raft',x:x+50,y,layer:'surface'}).structure;act(w,a,{type:'board',id:raft.id});assert.throws(()=>act(w,b,{type:'board',id:raft.id}),/occupied/);assert.throws(()=>act(w,b,{type:'sail',id:raft.id,x:x+60,y}),/driver/);act(w,a,{type:'sail',id:raft.id,x:x+100,y},Date.now()+200);assert.equal(w.structures.get(raft.id).x,x+100);act(w,a,{type:'position',x:x+100,y,layer:'ocean'});assert.equal(w.structures.get(raft.id).driver,null);act(w,a,{type:'position',x:x+100,y,layer:'surface'});act(w,a,{type:'board',id:raft.id});w.leave(a.id);assert.equal(w.structures.get(raft.id).driver,null);
});
