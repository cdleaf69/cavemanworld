import test from 'node:test';
import assert from 'node:assert/strict';
import {SpawnableRegistry,ResourceNode,Decoration} from '../src/spawnables.js';

test('spatial queries retain cell-edge objects, canopy clicks, respawns and replacement/removal',()=>{
  const r=new SpawnableRegistry();
  const node=new ResourceNode({id:'edge',kind:'tree',x:513,y:513,layer:'surface',radius:43});
  r.addNode(node);r.addDecoration(new Decoration({id:'fern',kind:'fern',x:510,y:510,layer:'surface'}));
  const b={left:500,right:520,top:500,bottom:520};
  assert.equal(r.visible(b,'surface').nodes[0],node);
  assert.equal(r.visible(b,'surface').decorations.length,1);
  assert.equal(r.nearest(500,500,'surface'),node);
  assert.equal(r.at(513,388,'surface'),node);
  assert.equal(r.visible(b,'cave').nodes.length,0);
  node.active=false;node.respawnAt=20;assert.equal(r.visible(b,'surface').nodes.length,0);
  r.update(21);assert.equal(r.visible(b,'surface').nodes.length,1);
  r.addNode(new ResourceNode({id:'edge',kind:'tree',x:3000,y:3000,layer:'surface'}));
  assert.equal(r.visible(b,'surface').nodes.length,0);
  r.remove('edge');r.remove('fern');assert.equal(r.visible(b,'surface').decorations.length,0);
  r.clear();assert.equal(r.cells.size,0);
});
