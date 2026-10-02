const names=['Sprat','Anchovy','Sardine','Perch','Trout','Salmon','Red Snapper','Tuna','Swordfish','Grouper','Sturgeon','Giant Ray','Sunfish','Coelacanth'];
const values=[2,4,6,9,13,18,26,38,55,75,100,135,180,250];
const colors=['#a8cbd2','#86b7bf','#c1d2d4','#e9bd68','#8bcec3','#e5a39a','#eb8874','#689bbb','#9bbacb','#ccad79','#99b6ab','#8c99d0','#e1ba7b','#74b9b8'];
export const FISH_SPECIES=names.map((name,i)=>({id:'fish-'+name.toLowerCase().replaceAll(' ','-'),name,habitat:name==='Salmon'?'both':['Perch','Trout','Sturgeon'].includes(name)?'freshwater':'ocean',rank:i+1,value:values[i],length:10+i*9,color:colors[i],weight:Math.max(1,18-i)}));
export function fishSpecies(id){return FISH_SPECIES.find(f=>f.id===id);}
export function fishLimit({quest=0,rodRank=0,depth=0}={}){return Math.min(14,4+quest+rodRank,5+Math.floor(depth*2)+rodRank);}
export function chooseFish(options={},rng=Math.random){const max=fishLimit(options),pool=FISH_SPECIES.filter(f=>f.rank<=max&&(!options.water||f.habitat==='both'||(options.water==='lake'?f.habitat==='freshwater':f.habitat==='ocean')));let roll=rng()*pool.reduce((s,f)=>s+f.weight,0);for(const f of pool){roll-=f.weight;if(roll<=0)return f;}return pool.at(-1);}
export function fishCount(inventory,minRank=1){return FISH_SPECIES.filter(f=>f.rank>=minRank).reduce((s,f)=>s+(inventory.resources[f.id]||0),0);}
export function consumeFish(inventory,count,minRank=1){if(fishCount(inventory,minRank)<count)return false;for(const f of FISH_SPECIES.filter(f=>f.rank>=minRank)){const n=Math.min(count,inventory.resources[f.id]||0);if(n)inventory.consume(f.id,n);count-=n;if(!count)break;}return true;}
export function rodRank(tool){return tool?.id==='abyss-rod'?6:tool?.id==='reef-rod'?3:tool?.bowLevel||0;}
