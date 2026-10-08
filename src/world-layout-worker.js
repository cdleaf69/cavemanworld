import {packLayout} from './layout-codec.js';
import {SpawnZone} from './spawn-zones.js';
import {SpawnableRegistry} from './spawnables.js';
import {populateWorld} from './spawner.js';
self.onmessage=({data})=>{
 try{const registry=new SpawnableRegistry(),start=performance.now();
 populateWorld({zones:data.map(z=>new SpawnZone(z))},registry);
 const buffer=packLayout({nodes:[...registry.nodes.values()],decorations:[...registry.decorations.values()],generationMs:performance.now()-start});self.postMessage({buffer},[buffer]);
 }catch(error){self.postMessage({error:error.message});}
};
