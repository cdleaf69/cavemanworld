import test from 'node:test';import assert from 'node:assert/strict';
import {Inventory,RECIPES,RESOURCES} from '../src/crafting.js';
import {CRAFTING_TABLES,availableRecipes} from '../src/crafting-stations.js';
import {MATERIALS} from '../src/materials.js';
import {CAVE_LAYERS,caveDepth,roomRadius,caveClearance} from '../src/cave-shapes.js';
import {LAYERS,PORTALS,DESCENTS,caveGeometry,canWalk,portalDestination,portalDirection} from '../src/world.js';
import {ResourceNode} from '../src/spawnables.js';
import {indexEntries,visibleResources,oreLevel} from '../src/item-index.js';
import {resourcePrice,clubQuality} from '../src/town-services.js';
import {STRUCTURE_CONFIG} from '../src/frontier-structures.js';
import {LanWorld} from '../src/lan-server.js';

test('placed crafting tables are shared, stay upright, and use material-appropriate recovery tools',()=>{
 const world=new LanWorld(),join=world.join(),p=world.players.get(join.id);Object.assign(p,{x:13000,y:8500});
 let clock=1000;for(const [kind,tool,x] of [['bark-workbench','stone-axe',13100],['stone-forge','stone-pickaxe',12900]]){
  clock+=5000;const s=world.action(join.id,join.token,{type:'place',kind,x,y:8700,layer:'surface',rotation:1},clock).structure;assert.equal(s.rotation,0);assert.ok(s.tableTier);assert.ok(world.snapshot().structures.some(n=>n.id===s.id));
  const wrong=tool==='stone-axe'?'stone-pickaxe':'stone-axe';assert.throws(()=>world.action(join.id,join.token,{type:'mine',id:s.id,tool:wrong},clock+1000),/Use an/);
  for(let i=0;i<3;i++)world.action(join.id,join.token,{type:'mine',id:s.id,tool},clock+2000+i*600);assert.equal(world.structures.has(s.id),false);
 }
});

test('six descents lead from the surface through safe, reversible underground passages',()=>{
 let current='surface';for(const next of CAVE_LAYERS){const p=[...PORTALS,...DESCENTS].find(p=>p[current]&&p[next]);assert.ok(p,`${current} -> ${next}`);assert.equal(portalDestination(p,current),next);assert.equal(portalDirection(p,current),'Descend');assert.equal(portalDirection(p,next),'Ascend');assert.equal(portalDestination(p,next),current);for(const l of [current,next])assert.ok(canWalk(p[l].x,p[l].y,l));assert.ok(LAYERS[next]);current=next;}
});
test('caves have varied chamber shapes, winding routes, side branches, and matching collision',()=>{
 for(const layer of CAVE_LAYERS){const g=caveGeometry(layer);assert.ok(g.tunnels.length>g.rooms.length);assert.ok(g.tunnels.some(t=>t.points.length>4));const r=g.rooms[12],radii=Array.from({length:64},(_,i)=>roomRadius(r,i*Math.PI/32));assert.ok(Math.max(...radii)/Math.min(...radii)>1.6);
 for(let i=0;i<64;i++){const a=i*Math.PI/32,rr=roomRadius(r,a)*.75,x=r.x+Math.cos(a)*rr,y=r.y+Math.sin(a)*rr;assert.equal(canWalk(x,y,layer,24),caveClearance(x,y,g)>24);}
 }
});
test('ore labels and lists show cave levels 1–6 separately from player requirements',()=>{
 const bag=new Inventory();for(const id of ['voidsteel','iron','cobalt','copper','wood'])bag.add(id,2);
 assert.deepEqual(visibleResources(bag),['copper','iron','cobalt','voidsteel','wood']);
 for(const layer of CAVE_LAYERS){const m=MATERIALS.find(m=>m.depth===caveDepth(layer)),n=new ResourceNode({id:m.id,kind:'ore',resource:m.id,layer});assert.equal(n.oreLevel,m.depth);assert.ok(n.label.includes(`Ore Lv ${m.depth}`));assert.ok(indexEntries(bag).find(e=>e.id===m.id).group.includes(`Level ${m.depth}`));assert.ok(resourcePrice(m.id)>0);assert.ok(clubQuality({type:'club',tier:m.id}).chances.every(Number.isFinite));}
 assert.equal(oreLevel('wood'),0);
});
test('recipe visibility grows only when tables are crafted; player levels alone do not unlock tiers',()=>{
 const bag=new Inventory();for(const id of RESOURCES)bag.add(id,1000);const initial=availableRecipes(RECIPES,bag);assert.ok(initial.length<40);assert.ok(initial.some(r=>r.id==='stone-pickaxe'));assert.ok(!initial.some(r=>r.id==='copper-axe'));assert.equal(bag.craft('bark-workbench').ok,false);
 bag.progression.upgrade(19);assert.equal(bag.craft('copper-axe').ok,false);assert.equal(bag.craft('astral-workbench').ok,false);
 for(const table of CRAFTING_TABLES){const prior=bag.tableTier;assert.ok(bag.craft(table.id).ok);assert.equal(bag.tableTier,prior+1);assert.equal(bag.structures[table.id],1);assert.ok(STRUCTURE_CONFIG[table.id].solid);assert.equal(bag.equippedTool,null);assert.equal(bag.equippedGear,null);assert.ok(availableRecipes(RECIPES,bag).some(r=>r.depth===table.tableTier));}
 assert.ok(bag.craft('voidsteel-pickaxe').ok);assert.equal(bag.equippedTool,null);
});
test('table levels and previous-level mixed ore costs cannot be bypassed or partially spent',()=>{
 const bag=new Inventory({level:6});bag.add('wood',100);bag.add('stone',100);bag.add('iron',3);assert.ok(bag.craft('bark-workbench').ok);
 const before={...bag.resources};assert.equal(bag.craft('stone-forge').ok,false);assert.deepEqual(bag.resources,before);assert.equal(bag.tableTier,1);
 bag.add('quartz',3);bag.add('copper',5);assert.ok(bag.craft('stone-forge').ok);assert.equal(bag.resources.quartz,0);assert.equal(bag.resources.copper,0);assert.equal(bag.tableTier,2);
 const prior={...bag.resources};assert.equal(bag.craft('crystal-workbench').ok,false);assert.deepEqual(bag.resources,prior);
});
