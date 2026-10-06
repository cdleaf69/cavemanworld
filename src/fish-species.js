import {rodStats} from './fishing-tackle.js';
const names=['Sprat','Anchovy','Sardine','Perch','Trout','Salmon','Red Snapper','Tuna','Swordfish','Grouper','Sturgeon','Giant Ray','Sunfish','Coelacanth','Lantern Eel','Prism Sailfin','Abyssal Angler','Crown Leviathan'];
const values=[2,4,6,9,13,18,26,38,55,75,100,135,180,250,360,520,800,1250];
const colors=['#a8cbd2','#86b7bf','#c1d2d4','#e9bd68','#8bcec3','#e5a39a','#eb8874','#689bbb','#9bbacb','#ccad79','#99b6ab','#8c99d0','#e1ba7b','#74b9b8','#8ec9f0','#e19ee9','#73e2c0','#f2bb70'];
export const FISH_SPECIES=names.map((name,i)=>({id:'fish-'+name.toLowerCase().replaceAll(' ','-'),name,habitat:name==='Salmon'?'both':['Perch','Trout','Sturgeon'].includes(name)?'freshwater':'ocean',rank:i+1,value:values[i],length:i<14?10+i*9:180+(i-14)*95,color:colors[i],weight:Math.max(1,18-i)}));
export function fishSpecies(id){return FISH_SPECIES.find(f=>f.id===id);}
export function fishLimit({quest=0,rodRank=0,depth=0}={}){return Math.min(18,4+quest+rodRank+Math.floor(depth/5),5+Math.floor(depth*2)+rodRank);}
export function chooseFish(options={},rng=Math.random){const max=fishLimit(options),min=options.water==='ocean'?Math.max(1,Math.min(max-2,1+Math.floor((options.depth||0)/2))):1,pool=FISH_SPECIES.filter(f=>f.rank>=min&&f.rank<=max&&(!options.water||f.habitat==='both'||(options.water==='lake'?f.habitat==='freshwater':f.habitat==='ocean')));let roll=rng()*pool.reduce((s,f)=>s+f.weight*Math.pow(Math.max(1,options.luck||1),(f.rank-min)/Math.max(1,max-min)),0);for(const f of pool){roll-=f.weight*Math.pow(Math.max(1,options.luck||1),(f.rank-min)/Math.max(1,max-min));if(roll<=0)return f;}return pool.at(-1);}
export function fishCount(inventory,minRank=1){return FISH_SPECIES.filter(f=>f.rank>=minRank).reduce((s,f)=>s+(inventory.resources[f.id]||0),0);}
export function consumeFish(inventory,count,minRank=1){if(fishCount(inventory,minRank)<count)return false;for(const f of FISH_SPECIES.filter(f=>f.rank>=minRank)){const n=Math.min(count,inventory.resources[f.id]||0);if(n)inventory.consume(f.id,n);count-=n;if(!count)break;}return true;}
export function rodRank(tool){return rodStats(tool).rank;}
