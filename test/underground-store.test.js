import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory,RECIPES} from '../src/crafting.js';
import {QuestBook} from '../src/expeditions.js';
import {DARREN,DARREN_ONLY,STORE_LAYER} from '../src/underground-store-data.js';
import {sellToDarren,buyScratch,claimScratch} from '../src/underground-store.js';
import {tradeResource} from '../src/town-services.js';
import {DESCENTS,canWalk,portalDestination,portalDirection} from '../src/world.js';
import {levelGuide} from '../src/level-guide.js';
test('book requires level five and a workbench, spends correct resources and can be crafted repeatedly',()=>{
 const i=new Inventory({level:4,tableTier:1});i.add('oldTestament',2);i.add('sulfur',14);
 assert.equal(i.craft('steezusBook').ok,false);assert.equal(i.resources.sulfur,14);
 i.progression.level=5;i.tableTier=0;assert.equal(i.craft('steezusBook').ok,false);
 i.tableTier=1;assert.equal(i.craft('steezusBook').ok,true);assert.equal(i.resources.steezusBook,1);assert.equal(i.resources.sulfur,7);
 assert.equal(i.craft('steezusBook').ok,true);assert.equal(i.resources.steezusBook,2);assert.equal(i.resources.oldTestament,0);
 assert.match(levelGuide(RECIPES)[4].items.find(r=>r.id==='steezusBook').how,/Bark Workbench/);
});
test('Darren alone buys marijuana and boss loot; seven mixed marijuana pays 500 and repeats',()=>{
 const i=new Inventory(),q=new QuestBook();i.coins=2000;
 for(const id of DARREN_ONLY){i.add(id,5);assert.equal(tradeResource(i,id,1,false).ok,false);assert.equal(tradeResource(i,id,1,true).ok,false);}
 for(const id of ['rawMarijuana','driedMarijuana']){const before=i.resources[id],coins=i.coins;assert.equal(sellToDarren(i,id,1).ok,false);assert.equal(sellToDarren(i,id,5).ok,false);assert.equal(i.resources[id],before);assert.equal(i.coins,coins);}
 i.resources.rawMarijuana=3;i.resources.driedMarijuana=4;
 assert.equal(q.claim(DARREN,i).ok,true);assert.equal(i.coins,2500);assert.equal(i.resources.rawMarijuana+i.resources.driedMarijuana,0);
 assert.equal(q.claim(DARREN,i).ok,false);i.add('driedMarijuana',7);assert.equal(q.claim(DARREN,i).ok,true);assert.equal(i.coins,3000);
 assert.equal(sellToDarren(i,'oldTestament',1).ok,true);assert.equal(i.coins,3300);assert.equal(sellToDarren(i,'wood',1).ok,false);
 assert.equal(tradeResource(i,'wood',1,true).ok,true);
});
test('scratch tickets charge once, block duplicate purchases, and pay each possible prize once',()=>{
 for(const [roll,id,amount] of [[.01,'steezusBook',1],[.1,'driedMarijuana',2],[.4,'coins',75],[.9,'none',0]]){
 const i=new Inventory();assert.equal(buyScratch(i,()=>roll).ok,false);i.coins=100;
 let n=0;assert.equal(buyScratch(i,()=>n++? .5:roll).ok,true);assert.equal(i.coins,75);
 assert.equal(buyScratch(i).ok,false);assert.equal(i.coins,75);
 const r=claimScratch(i);assert.deepEqual(r.prize,{id,amount});assert.equal(i.resources.scratchTicket,0);assert.equal(i.pendingScratch,null);
 assert.equal(claimScratch(i).ok,false);if(id==='coins')assert.equal(i.coins,150);else if(id!=='none')assert.equal(i.resources[id],amount);
 }
});
test('seventh layer connects to the bottom vault with walkable entrance and return',()=>{
 const p=DESCENTS.find(p=>p.id==='seven-eleven-descent');assert.ok(p);
 for(const l of ['vault',STORE_LAYER])assert.ok(canWalk(p[l].x,p[l].y,l));
 assert.equal(portalDestination(p,'vault'),STORE_LAYER);assert.equal(portalDirection(p,'vault'),'Descend');assert.equal(portalDirection(p,STORE_LAYER),'Ascend');
 assert.equal(canWalk(420,380,STORE_LAYER),false);
});
