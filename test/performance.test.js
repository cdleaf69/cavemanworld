import test from 'node:test';
import assert from 'node:assert/strict';
import {terrainPlan} from '../src/terrain-plan.js';
import {indexBiomeInfluences} from '../src/biome-index.js';
import {biomeBlend} from '../src/biome-shapes.js';
import {BIOMES} from '../src/world.js';
import {PixelArt} from '../src/pixel-art.js';
import {SpawnableRegistry,ResourceNode} from '../src/spawnables.js';

test('respawn checks only depleted nodes and removes replaced or deleted sleepers',()=>{
 const registry=new SpawnableRegistry(),make=id=>new ResourceNode({id,kind:'ground',resource:'stone',x:100,y:100,layer:'surface',respawnMs:100});
 const a=make('a'),b=make('b');registry.addNode(a);registry.addNode(b);let untouched=0;b.update=()=>untouched++;
 a.take(10);assert.equal(registry.sleeping.size,1);registry.update(109);assert.equal(a.active,false);registry.update(110);assert.equal(a.active,true);assert.equal(a.quantity,a.maxQuantity);assert.equal(untouched,0);
 a.take(1000);registry.addNode(make('a'));assert.equal(registry.sleeping.size,0);
 const restored=make('restored');restored.active=false;restored.respawnAt=2000;registry.addNode(restored);assert.equal(registry.sleeping.size,1);registry.remove(restored.id);assert.equal(registry.sleeping.size,0);
 a.nextHitAt=0;a.active=true;a.take(3000);registry.update(4000);assert.equal(registry.sleeping.size,0);registry.clear();assert.equal(registry.nodes.size,0);
});

test('preload extends four chunks, prioritizes visible terrain and stays within its cache budget',()=>{
 const bounds={left:10000,right:12000,top:10000,bottom:11000},jobs=terrainPlan(bounds,'surface',135000,84000);
 assert.ok(jobs.some(j=>j.gx*512<bounds.left-1500));assert.ok(jobs.some(j=>j.gx*512>bounds.right+1500));
 const firstHidden=jobs.findIndex(j=>!j.visible);assert.ok(firstHidden>0);assert.ok(jobs.slice(firstHidden).every(j=>!j.visible));
 assert.ok(terrainPlan({left:0,right:10000,top:0,bottom:6000},'surface',135000,84000).length<=448);
 assert.ok(terrainPlan({left:134000,right:137000,top:83000,bottom:86000},'surface',135000,84000).every(j=>j.gx*512<135000&&j.gy*512<84000));
});
test('biome index preserves every nonzero blend and its original layering order',()=>{
 const candidates=indexBiomeInfluences(BIOMES);
 for(let y=-2048;y<88000;y+=997)for(let x=-2048;x<139000;x+=977){
  const expected=BIOMES.filter(b=>biomeBlend(b,x,y)>0),actual=candidates(x,y).filter(b=>biomeBlend(b,x,y)>0);assert.deepEqual(actual,expected);
 }
});
test('workers do not accumulate stale jobs when the camera changes; cache closes evicted bitmaps',()=>{
 const previousWorker=globalThis.Worker,previousCanvas=globalThis.OffscreenCanvas,workers=[];
 globalThis.Worker=class{constructor(){workers.push(this);this.sent=[];}postMessage(job){this.sent.push(job);}terminate(){this.terminated=true;}};
 globalThis.OffscreenCanvas=class{};
 try{
  const art=new PixelArt(),ctx={drawImage(){}};art.terrain(ctx,{left:10000,right:11000,top:10000,bottom:11000},'surface');
  assert.ok(art.pending.size<=2);assert.ok(workers.every(w=>w.sent.length===1));
  art.terrain(ctx,{left:70000,right:71000,top:40000,bottom:41000},'surface');
  const w=workers[0],old=w.sent[0];w.onmessage({data:{key:old.key,bitmap:{}}});
  assert.equal(w.sent.length,2);assert.ok(w.sent[1].gx*512>=69000);assert.ok(w.sent[1].visible);
  let closed=0;art.tiles.clear();for(let i=0;i<513;i++)art.cacheTile(String(i),{close(){closed++;}});assert.equal(art.tiles.size,512);assert.equal(closed,1);
  workers[0].onerror();assert.ok(workers[0].terminated);
 }finally{if(previousWorker===undefined)delete globalThis.Worker;else globalThis.Worker=previousWorker;if(previousCanvas===undefined)delete globalThis.OffscreenCanvas;else globalThis.OffscreenCanvas=previousCanvas;}
});
