import test from 'node:test';import assert from 'node:assert/strict';
import {Inventory,RECIPES} from '../src/crafting.js';import {Tool} from '../src/spawnables.js';
import {FishingSession} from '../src/fishing.js';import {LAKES} from '../src/world.js';
import {BAITS,rodStats,upgradeFishingRod,ROD_UPGRADES,buyBait,selectBait,starterBait} from '../src/fishing-tackle.js';
import {chooseFish,fishLimit} from '../src/fish-species.js';import {upgradeTool,tradeResource} from '../src/town-services.js';
const make=()=>{const inv=new Inventory(),rod=new Tool(RECIPES.find(r=>r.id==='fishing-rod'));inv.owned.set(rod.id,rod);const l=LAKES[0];return {inv,rod,player:{x:l.x+l.rx+50,y:l.y,layer:'surface'},point:{x:l.x+l.rx-80,y:l.y}};};
test('rod forge improves all fishing stats without needing a club, and caps at five paid upgrades',()=>{
 const {inv,rod}=make();assert.equal(upgradeFishingRod(inv,rod.id).ok,false);assert.equal(rod.fishingUpgradeLevel,undefined);
 inv.coins=1000;for(const cost of ROD_UPGRADES)for(const [id,n]of Object.entries(cost.cost))inv.add(id,n);
 for(let i=0;i<5;i++){const before=rodStats(rod);assert.equal(upgradeTool(inv,rod.id).ok,true);const after=rodStats(rod);for(const stat of ['range','luck','strength'])assert.ok(after[stat]>before[stat]);}
 const coins=inv.coins;assert.equal(upgradeFishingRod(inv,rod.id).ok,false);assert.equal(inv.coins,coins);assert.equal(rodStats(rod).range,700);
});
test('Marlow sells cheap neutral worms and multiplied baits; starter worms are granted once',()=>{
 const {inv}=make();assert.equal(starterBait(inv).ok,true);assert.equal(starterBait(inv).ok,false);assert.equal(inv.resources.worms,10);assert.deepEqual([BAITS[0].luck,BAITS[0].strength,BAITS[0].speed],[1,1,1]);
 inv.coins=1;assert.ok(buyBait(inv,'worms').ok);assert.equal(inv.resources.worms,20);assert.equal(inv.coins,0);assert.equal(buyBait(inv,'glow-bait').ok,false);assert.equal(selectBait(inv,'glow-bait').ok,false);
 inv.coins=25;assert.ok(buyBait(inv,'glow-bait').ok);assert.ok(selectBait(inv,'glow-bait').ok);assert.equal(inv.fishingBait,'glow-bait');assert.equal(tradeResource(inv,'worms',5,false).ok,false);
});
test('only valid casts consume one bait, and upgraded range also governs line slack',()=>{
 const {inv,rod,player,point}=make(),s=new FishingSession(()=>0);inv.add('worms',3);
 const far={x:point.x-240,y:point.y};assert.equal(s.cast(player,rod,far,0,inv).ok,false);assert.equal(inv.resources.worms,3);
 rod.fishingUpgradeLevel=2;assert.ok(s.cast(player,rod,far,0,inv).ok);assert.equal(inv.resources.worms,2);assert.equal(s.cast(player,rod,point,1,inv).ok,false);assert.equal(inv.resources.worms,2);
 assert.equal(s.update(100,{...player,x:far.x+rodStats(rod).range+70}),null);assert.ok(s.active);s.update(200,{...player,x:far.x+rodStats(rod).range+90});assert.equal(s.active,false);
});
test('disturbance precedes the bite, repeated reel clicks are required, and missed fish escape',()=>{
 const {inv,rod,player,point}=make();inv.add('worms',3);const s=new FishingSession(()=>0);s.cast(player,rod,point,0,inv);assert.match(s.update(s.disturbAt,player),/circling/);assert.ok(s.disturbance);assert.equal(s.reel(s.biteAt-1,inv).ok,false);
 s.update(s.biteAt,player);assert.ok(s.ready);const now=s.biteAt;assert.equal(s.reel(now,inv).ok,false);const first=s.progress;s.reel(now+10,inv);assert.equal(s.progress,first);s.update(now+1000,player);assert.ok(s.progress<first);
 let result;for(let i=1;i<70&&s.active;i++)result=s.reel(now+1000+i*100,inv);assert.ok(result.ok);assert.equal(inv.resources[result.resource],1);
 const missed=new FishingSession(()=>0);missed.cast(player,rod,point,20000,inv);assert.match(missed.update(missed.escapeAt,player),/got away/);assert.equal(missed.active,false);
});
test('luck favors higher ranks while preserving habitat and progression limits',()=>{
 let plain=0,lucky=0;for(let i=0;i<1000;i++){const rng=()=>i/1000,options={water:'ocean',quest:8,rodRank:6,depth:6};const a=chooseFish({...options,luck:1},rng),b=chooseFish({...options,luck:4},rng);plain+=a.rank;lucky+=b.rank;assert.ok(b.rank<=fishLimit(options));assert.notEqual(b.habitat,'freshwater');}assert.ok(lucky>plain*1.05);
});
test('stronger rods and bait need fewer pulls for the same fish',()=>{
 const pulls=(level,bait)=>{const {inv,rod,player,point}=make();rod.fishingUpgradeLevel=level;inv.add(bait,1);inv.fishingBait=bait;const s=new FishingSession(()=>0);s.cast(player,rod,point,0,inv);let clicks=0;while(s.active&&clicks<100){s.reel(4000+clicks*100,inv);clicks++;}return clicks;};assert.ok(pulls(3,'worms')<pulls(0,'worms'));assert.ok(pulls(0,'abyss-bait')<pulls(0,'worms'));
});
