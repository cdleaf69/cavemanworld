import {CRAFTING_TABLES,stationRequirement} from './crafting-stations.js';
export function levelGuide(recipes){
 return Array.from({length:20},(_,i)=>{const level=i+1;return {level,items:recipes.filter(r=>!r.questOnly&&(r.level||1)===level).map(r=>({id:r.id,name:r.name,how:`${stationRequirement(r)?`Requires ${CRAFTING_TABLES[stationRequirement(r)-1]?.name||'a workshop'}`:'Hand craft'}${r.requires?` · craft ${recipes.find(x=>x.id===r.requires)?.name||r.requires} first`:''}${r.id==='steezusBook'?' · defeat Steezus for an Old Testament and mine Sulfur around his mountain':''}`,recipe:r}))};});
}
