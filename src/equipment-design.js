import {MATERIALS} from './materials.js';
const materials=new Map(MATERIALS.map(m=>[m.id,m]));
const path=(d,fill,stroke='',width=1)=>`<path d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}"`:''}/>`;
const r=(x,y,w,h,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
export function equipmentStyle(tier){return materials.get(tier)||{depth:tier==='iron'?1:0,biome:'heartlands'};}
// Different construction at each depth: strapped metal, forged plates, split
// crystals, articulated relics, heavy siege equipment, and celestial artifacts.
const axe=[
 'M16 6h6V3h6v3h3v9h-4v3h-6v-4h-5z',
 'M15 6h5V3h8v3h3v12h-3v3h-5v-5h-8z',
 'M15 7h5L25 0l2 6 5 4-5 9-5-3-2-4h-5z',
 'M11 4h4v3h6V4h5V1h4v7h2v9h-4v3h-5v-7h-8v6h-4V9H9z',
 'M12 5h8V1h9v4h3v13h-4v5h-7v-9h-9z',
 'M9 5l5-4 3 7h5l4-8 6 5-2 6 2 6-6 5-4-8h-5l-4 7-5-5 3-5z',
];
const club=[
 'M13 18v-4h3v-4h3V5h3V2h5v3h3v7h-3v4h-4v4h-6v3z',
 'M12 16l6-10 6-4 7 6-3 9-8 6-6-2z',
 'M12 18l4-5-1-5 4 1 4-8 4 6 5 2-5 6-1 6-5-2-5 4z',
 'M12 16l5-8 3 2 4-7 7 3-1 7-6 2-1 6-6 3-6-3z',
 'M10 17l6-9 3 1 3-7h6l4 6-3 8-5 1-2 7-8 1z',
 'M10 16l5-3-1-7 6 2 5-8 3 7 4 3-5 4 2 8-8-3-5 7z',
];
const sword=[
 'M8 25 24 4l6-3-2 8L12 28z',
 'M8 25 17 12l5-8 9-3-3 10-5 1-10 17z',
 'M8 25 20 13l1-6 8-7 2 8-6 6-2 7-10 8z',
 'M7 25 18 13l-1-4 4 1 7-10 4 7-9 12-3-2-7 13z',
 'M6 25 18 11l-1-6 7-5 8 1-2 10-7 4-1 5-9 10z',
 'M7 25 19 13l-3-3 5-2 2-5 7-3 2 8-5 3-2 5-4-1-8 15z',
];
const spear=[
 'M19 13 22 4l9-4-3 10-7 5z',
 'M18 12 20 5l12-5-5 12-6 4z',
 'M17 12l5-4-1-5 6 2 5-5-2 8 2 3-8 2-3 5z',
 'M16 13l3-7 3 3 6-9 4 2-7 11 3 3-8 3z',
 'M15 13l3-9 5 1 8-5 1 7-5 8-8 3z',
 'M16 13l-1-7 6 2 4-8 7 1-3 9-6 2 1 7z',
];
const hammer=[
 'M13 5l7-4 12 11-6 7z',
 'M10 4l6-4 6 5 3-1 7 7-6 8-8-7-2 2z',
 'M10 7l5-6 7 4 5-2 5 7-6 10-7-5-4 1z',
 'M8 5l6-5 5 5 6-2 7 9-5 9-9-7-5 1z',
 'M7 5l7-5 7 4 6-1 5 8-2 8-7 4-7-8-5-1z',
 'M7 7l2-6 7 1 5 5 6-7 5 10-3 10-7 3-5-9-5 2z',
];
function emblem(biome,color){
 return ({woodland:path('M20 12l-3-5 4 1 3-5 1 7 4 2-5 2v4h-2v-5z',color),tundra:path('M23 5l3 6-3 7-3-7z',color),marsh:path('M22 6l5 2-1 4-5 2 4 2-2 2-5-4 1-5z',color),badlands:path('M20 6h6v3h3v5h-3v3h-6v-3h-3V9h3z',color),volcanic:path('M19 16l1-5 3 1 2-7 3 8-3 5z',color)})[biome]||'';
}
export function forgedToolSvg(recipe,dark,light){
 const material=materials.get(recipe.tier)||(recipe.type==='club'&&['stone','iron'].includes(recipe.tier)?{depth:recipe.tier==='iron'?2:1,biome:'heartlands'}:null);if(!material||!['axe','club','sword','spear','warhammer'].includes(recipe.type))return '';
 const d=material.depth,i=d-1,type=recipe.type;
 let art=path('M3 30 20 9','none','#302f3a',5)+path('M3 30 20 9','none',d>=4?dark:'#906646',3);
 // Wrapped grips, metal collars, and sculpted pommels change as tools advance.
 for(let k=0;k<d+1;k++)art+=path(`M${4+k} ${29-k}l3 2`,'none',k%2?light:'#e3c08a');
 art+=d>=3?path(d>=5?'M1 29l3-2 4 3-3 2H1z':'M1 30l3-3 4 3-3 2z',light):'';
 const silhouette=({axe,club,sword,spear,warhammer:hammer})[type][i];
 art+=path(silhouette,light,'#353340',1);
 const clip=`metal-${recipe.id}-${recipe.bowLevel||0}`;
 art+=`<defs><clipPath id="${clip}">${path(silhouette,'white')}</clipPath></defs><g clip-path="url(#${clip})">`;
 art+=path('M8 24 30 2 33 4 10 28z',dark)+path('M12 12h20v2H12z','#ffffff', '',1).replace('fill="#ffffff"','fill="#ffffff" opacity=".35"');
 art+=path('M10 22 20 12 30 17 30 23z',dark)+path('M13 8 25 1 29 3 18 11z','#fff5d4').replace('fill="#fff5d4"','fill="#fff5d4" opacity=".55"');
 art+=`<g transform="translate(8 4) scale(.65)">${emblem(material.biome,d>=4?'#fff3bd':dark)}</g>`;
 for(let k=0;k<d+1;k++)art+=r(19+k%3*3,6+Math.floor(k/3)*4,1,2,k%2?'#f3e9bc':dark);
 art+='</g>';
 if(type==='sword')art+=path(d<3?'M5 22l12 7':d<5?'M3 21l5 1 7 6 1 4':'M3 20l5-2 1 5 8 3 2 6-6-2-6-6-4-1','none',light,2);
 if(type==='axe')art+=r(15,9,4,3,dark)+r(16,9,2,2,'#e5d0a2');
 if(type==='warhammer'&&d>=3)art+=path(`M${10-d} 9l3-4 6 6-2 4z`,dark);
 if(type==='club')art+=path(d>=3?'M13 13l7 6M16 8l11 6':'M15 12l8 6','none',dark,2);
 return `<g transform="scale(3)" shape-rendering="crispEdges">${art}</g>`;
}
const cuirasses=[
 'M6 6l6-2 4 3 4-3 6 2 3 6-6 2v12H9V14l-6-2z',
 'M3 5h9l4 3 4-3h9v8l-5 2v11H8V15l-5-2z',
 'M3 8l6-5 7 5 7-5 6 5-3 6-4-1 2 13-8 4-8-4 2-13-4 1z',
 'M2 4l8-2 6 7 6-7 8 2-1 11-6-3v13l-7 5-7-5V12l-6 3z',
 'M1 7l5-6 6 3 4 6 4-6 6-3 5 6-2 9-6-1 2 12-9 4-9-4 2-12-6 1z',
 'M1 3l8-2 7 9 7-9 8 2-4 11-5-3 3 13-9 7-9-7 3-13-5 3z',
];
export function armorSvg(recipe,dark,light){
 const {depth,biome}=equipmentStyle(recipe.tier),d=Math.max(1,depth);
 let art=path(cuirasses[d-1],dark,light,1)+path(d===1?'M10 10h12v12H10z':d===2?'M9 10h14v4H9zm2 5h10v7H11z':d===3?'M16 10l6 6-6 10-6-10z':d===4?'M10 12l6 4 6-4v10l-6 5-6-5z':d===5?'M9 12h14v5H9zm2 6h10v7H11z':'M16 11l7 6-7 12-7-12z',light);
 art+=`<g transform="translate(-7 6) scale(.95)">${emblem(biome,dark)}</g>`;
 art+=path('M10 25h12v2H10z','#796344')+r(15,25,3,3,'#f5d58a');
 if(!depth&&recipe.tier==='wood')art=path('M7 5h6l3 3 3-3h6l2 8-5 2 2 12H8l2-12-5-2z',dark,light)+[10,14,18,22].map(x=>r(x,11,2,14,light)).join('')+r(8,21,16,2,'#6a503b');
 if(!depth&&recipe.tier==='stone')art=path('M4 6h9l3 4 3-4h9v8l-5 1 2 12H7l2-12-5-1z',dark,light)+path('M10 11h5v6h-5zm7 0h5v6h-5zm-8 8h6v6H9zm8 0h6v6h-6z',light);
 if(recipe.tier==='leaf')art=path('M5 7l5-4 6 6 6-6 5 4-5 8 3 8-9 6-9-6 3-8z',light,dark)+path('M16 9v17M8 10l8 6 8-6','none',dark);
 if(recipe.id.includes('wing'))art+=path('M6 8 0 5 3 22 9 17M26 8 32 5 29 22 23 17',light);
 if(recipe.id.includes('shell'))art+=path('M16 9l7 4v8l-7 6-7-6v-8z',light,dark)+path('M16 10v16M10 16h12','none',dark);
 return `<g transform="scale(3)" shape-rendering="crispEdges">${art}</g>`;
}
