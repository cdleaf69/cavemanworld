import {unpackLayout} from './layout-codec.js';
import {PATHS,RIVER,LAKES,TOWN_BUILDINGS,TOWNS,LANDMARKS,PORTALS,DESCENTS,BIOMES,EXTRA_CAVES} from './world.js';
import {MOUNTAINS} from './frontier-world.js';
import {ResourceNode,Decoration} from './spawnables.js';
import {populateWorld} from './spawner.js';
// Only pristine deterministic scenery is cached. Harvesting and player state stay live.
const VERSION='layout-2026-10-05-caves-v3';
function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('embervale-layout',1);request.onupgradeneeded=()=>request.result.createObjectStore('layouts');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function readLayout(key){let db;try{db=await database();return await new Promise((resolve,reject)=>{const r=db.transaction('layouts').objectStore('layouts').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}catch{return null;}finally{db?.close();}}
async function writeLayout(key,data){let db;try{db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction('layouts','readwrite'),store=tx.objectStore('layouts');store.clear();store.put(data,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}catch{/* Private browsing and storage quotas must not prevent play. */}finally{db?.close();}}
export async function loadWorldLayout(zones,registry){
 const key=VERSION+JSON.stringify({zones:zones.zones.map(z=>z.toJSON()),PATHS,RIVER,LAKES,TOWN_BUILDINGS,TOWNS,LANDMARKS,PORTALS,DESCENTS,BIOMES,EXTRA_CAVES,MOUNTAINS}),start=performance.now();
 let data=await readLayout(key),cached=!!data;
 if(!data){
  if(typeof Worker==='undefined'){populateWorld(zones,registry);return {cached:false,totalMs:performance.now()-start};}
  try{data=await new Promise((resolve,reject)=>{const worker=new Worker(new URL('./world-layout-worker.js',import.meta.url),{type:'module'});worker.onmessage=({data})=>{worker.terminate();data.error?reject(Error(data.error)):resolve(data.buffer||data);};worker.onerror=e=>{worker.terminate();reject(Error(e.message));};worker.postMessage(zones.zones.map(z=>z.toJSON()));});}
  catch{populateWorld(zones,registry);return {cached:false,totalMs:performance.now()-start};}
  void writeLayout(key,data);
 }
 data=unpackLayout(data);
 registry.clear();
 // Short batches keep loading paint and input responsive during hydration.
 let batchStart=performance.now();
 for(let i=0;i<data.nodes.length;i++){const n=data.nodes[i];registry.addNode(Object.assign(new ResourceNode(n),n));if(i%512===511&&performance.now()-batchStart>10){await new Promise(r=>setTimeout(r,0));batchStart=performance.now();}}
 for(let i=0;i<data.decorations.length;i++){const n=data.decorations[i];registry.addDecoration(new Decoration(n));if(i%512===511&&performance.now()-batchStart>10){await new Promise(r=>setTimeout(r,0));batchStart=performance.now();}}
 return {cached,totalMs:performance.now()-start,generationMs:data.generationMs,nodes:registry.nodes.size,decorations:registry.decorations.size};
}
