// Geometry is deliberately independent of the terrain/resource registries.
export const MOUNTAINS=[
 {id:'pinecrest',name:'Pinecrest Range',x:61000,y:24000,rx:3800,ry:3000,height:1100,color:'#87917f'},
 {id:'cloudspine',name:'Cloudspine Range',x:73000,y:43000,rx:4200,ry:3300,height:1600,color:'#8995a3'},
 {id:'frostpeak',name:'Frostpeak Range',x:34000,y:48000,rx:4400,ry:3300,height:2000,color:'#b0c4bd'},
];
for(const m of MOUNTAINS)m.trail=[[m.x,m.y+m.ry+180],[m.x-600,m.y+m.ry*.77],[m.x+700,m.y+m.ry*.58],[m.x-650,m.y+m.ry*.40],[m.x,m.y+350]];
export function mountainRadius(m,x,y){return Math.hypot((x-m.x)/m.rx,(y-m.y)/m.ry);}
export function mountainAt(x,y){return MOUNTAINS.find(m=>mountainRadius(m,x,y)<1)||null;}
export function altitudeAt(x,y){const m=mountainAt(x,y);if(!m)return 0;const t=Math.max(0,Math.min(1,(1-mountainRadius(m,x,y))/.64));return m.height*t*t*(3-2*t);}
export function plateauAt(x,y){const m=mountainAt(x,y);return !!m&&mountainRadius(m,x,y)<=.36;}
export const elevationOffset=(x,y)=>altitudeAt(x,y)*.22;
export function unprojectMountainPoint(point){let y=point.y;for(let i=0;i<8;i++)y=point.y+elevationOffset(point.x,y);return {x:point.x,y};}
export const COAST_X=87200;
export function coastline(y){return COAST_X+240*Math.sin(y/1600)+100*Math.sin(y/530);}
export const FISHERMAN={id:'fisherman',name:'Marlow the Fisherman',x:coastline(14500)-145,y:14500,layer:'surface',role:'fisherman',fixed:true};
export const FRONTIER_BIOMES=[
 {id:'woodland',name:'Whispering Reach',center:[61000,13500],radii:[11000,9500],seed:137},
 {id:'tundra',name:'Northwind Steppe',center:[68000,4000],radii:[18000,4700],seed:144},
 {id:'badlands',name:'Saffron Coast',center:[83400,22500],radii:[6800,8500],seed:151},
 {id:'marsh',name:'Pearl Wetlands',center:[76700,31000],radii:[8500,7600],seed:158},
 {id:'woodland',name:'Tallroot Country',center:[58500,38000],radii:[11000,10500],seed:165},
 {id:'tundra',name:'Frostpeak Foothills',center:[34000,48000],radii:[11000,10000],seed:172},
 {id:'volcanic',name:'Cinder South',center:[13500,47000],radii:[12500,8500],seed:179},
 {id:'woodland',name:'Verdant Expanse',center:[53500,56500],radii:[20000,6400],seed:186},
 {id:'marsh',name:'Southern Mangroves',center:[79300,56100],radii:[9500,6500],seed:193},
];
export const FRONTIER_PATHS=[
 {name:'Whispering Coast Trail',points:[[51500,17200],[58000,14000],[70000,12500],[84000,12500],[FISHERMAN.x,14500]]},
 {name:'Tallroot Passage',points:[[48500,28600],[55500,33000],[58500,39000],[65000,49000],[80000,52500],[85500,56000]]},
 {name:'Southern Wilds Trail',points:[[33700,32000],[27500,40000],[27500,53000],[45000,56000],[65000,49000]]},
 {name:'Pinecrest Approach',points:[[58000,14000],[56000,22500],[57000,28600],[61000,27180]]},
 {name:'Cloudspine Approach',points:[[65000,49000],[73000,48000],[73000,46480]]},
 {name:'Frostpeak Approach',points:[[27500,53000],[34000,53000],[34000,51480]]},
 ...MOUNTAINS.map(m=>({name:m.name+' Climb',points:m.trail})),
];

export const FRONTIER_CAVE_ENTRIES=[
 {id:'whisper-cave',name:'Whispering Grotto',x:57500,y:16800},
 {id:'northwind-cave',name:'Northwind Hollow',x:66000,y:9200},
 {id:'saffron-cave',name:'Saffron Depths',x:81000,y:23200},
 {id:'tallroot-cave',name:'Tallroot Cavern',x:57800,y:42700},
 {id:'frostpeak-cave',name:'Frostpeak Foothill Vault',x:40500,y:52200},
 {id:'mangrove-cave',name:'Mangrove Sinkhole',x:79000,y:56000},
];
for(const [i,entry] of FRONTIER_CAVE_ENTRIES.entries())FRONTIER_PATHS.push({name:entry.name+' Trail',points:[[[58000,14000],[70000,12500],[84000,12500],[58500,39000],[45000,56000],[80000,52500]][i],[entry.x,entry.y]]});
