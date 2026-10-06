import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SpawnZoneManager} from '../src/spawn-zones.js';
import {SpawnableRegistry} from '../src/spawnables.js';
import {populateWorld} from '../src/spawner.js';
test('cave expansion preserves all surface scenery positions, variants and quantities',()=>{
 const registry=new SpawnableRegistry();populateWorld(new SpawnZoneManager(null),registry);
 const digest=createHash('sha256').update(JSON.stringify([[...registry.nodes.values()].filter(n=>n.layer==='surface'),[...registry.decorations.values()].filter(n=>n.layer==='surface')])).digest('hex');
 assert.equal(digest,'41b4da4ed84e93b10c73582ac0afd67a6f9fc3bfd8d2ffa6b8aff1d5e7e7644c');
});
