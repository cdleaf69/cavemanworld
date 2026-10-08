import {equipmentStyle} from './equipment-design.js';
import {MATERIAL_COLORS} from './materials.js';
export function equipmentPalette(tier){
 const base=MATERIAL_COLORS[tier]||({leaf:'#779b59',wood:'#aa7a49',stone:'#99aaa3',iron:'#abc1ca'}[tier])||'#b7a1ce';
 const mix=(target,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(base.slice(i,i+2),16)*(1-t)+parseInt(target.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
 return {base,edge:mix('#f4f5de',.68),shade:mix('#232b39',.55),outline:'#263039'};
}
// Draw on a 48px grid: a restrained outline, a bevel, and a broad unbroken
// material face. The shared handle anchor matches heldToolPose.
export function refinedWeaponSvg(recipe){
 if(!['axe','pickaxe','club','sword','spear','warhammer'].includes(recipe.type))return '';
 const {depth=0,biome='heartlands'}=equipmentStyle(recipe.tier),d=Math.max(0,depth-1),p=equipmentPalette(recipe.tier);
 if(depth>0)return evolvedWeapon(recipe,p,depth,biome);
 const accent=({woodland:'#91ba78',tundra:'#d5f5ef',marsh:'#79c8c0',badlands:'#edc279',volcanic:'#f7a565'})[biome]||'#dec18a';
 const path=(s,fill,stroke=p.outline,w=1)=>`<path d="${s}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="miter"/>`;
 const rect=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
 let out=path('M16 43V12h4v31z','#6d4b39')+rect(17,15,1,25,'#bc925f');
 for(let y=31;y<41;y+=3)out+=path(`M16 ${y}h4v1h-4z`,'#c9aa79','none');
 out+=path('M15 41h6v3h-6z',p.shade)+rect(16,41,4,1,p.edge);
 let shape='';
 if(recipe.type==='axe')shape=`M16 12L${10-d} 9V${5-d*.4}L14 7h7l${7+d} -3v13l-${4+d} 4-4-6h-5z`;
 if(recipe.type==='pickaxe')shape=`M${4-d*.3} 16l4-7 7-3h7l7 4 ${3+d*.4} 8-6-5-6-2h-5l-6 2z`;
 if(recipe.type==='club')shape=`M16 25l-${3+d*.3} -8V7l3-3h4l3 3v10l-${3+d*.3} 8z`;
 if(recipe.type==='sword')shape=`M${16-d*.25} 29V${8-d*.4}L18 ${3-d*.25}l${2+d*.25} ${5+d*.15}V29l-${2+d*.25} 3z`;
 if(recipe.type==='spear')shape=`M18 2l${4+d*.35} 9-2 6-2 4-2-4-2-6z`;
 if(recipe.type==='warhammer')shape=`M${7-d*.3} 6h${22+d*.6}v${11+d*.4}H${7-d*.3}z`;
 out+=path(shape,p.shade);
 if(recipe.type==='axe')out+=path(`M22 8l${5+d} -3v11l-${3+d} 3-2-5z`,p.base,'none')+path(`M${27+d} 5v11l-${3+d} 3`, 'none',p.edge);
 if(recipe.type==='pickaxe')out+=path('M7 12l8-4h7l6 4-7-2h-6z',p.edge,'none');
 if(recipe.type==='club')out+=path('M16 7h3v14l-2-4z',p.base,'none')+rect(15,8,1,8,p.edge)+rect(14,11,8,2,accent)+rect(15,18,6,2,accent);
 if(recipe.type==='sword'||recipe.type==='spear')out+=path(recipe.type==='sword'?'M18 5v25l-1-2V9z':'M18 4v14l-2-7z',p.edge,'none');
 if(recipe.type==='warhammer')out+=rect(9-d*.3,7,18+d*.6,2,p.edge)+rect(10,10,16,5,p.base)+rect(10,10,2,5,p.shade)+rect(25,10,2,5,p.shade);
 const guard=recipe.type==='sword'?27:recipe.type==='spear'?20:23;
 out+=path(`M14 ${guard}h8v2h-8z`,accent)+rect(17,guard,2,1,p.edge);
 if(depth>1)out+=path(`M18 ${guard-5}l2 2-2 2-2-2z`,accent);
 // Biome-specific inlay proportions change construction without adding spikes.
 const b=['heartlands','woodland','tundra','marsh','badlands','volcanic'].indexOf(biome);
 if(depth>0)out+=rect(17,guard+4,2,1+Math.max(0,b)*.35,accent);
 return `<g transform="scale(2)" shape-rendering="crispEdges"><g transform="rotate(38 18 39)">${out}</g></g>`;
}
// Each tier changes the head's construction, not its scale. These silhouettes
// share the starter tool's bevel language and hand anchor.
const evolvedHeads={
 axe:['M15 8h7l8-5v14l-7 6-2-9h-6z','M15 8h5l9-5-1 7 4 3-6 9-6-7h-5z','M14 8l-7-5v14l6 5 3-9h4l3 9 7-5V3l-7 5z','M15 7h7l8-5v8l-3 2 4 5-7 7-3-10h-6z','M14 7h9l7-5v17l-10 5V13h-6z','M14 8l-5-5-3 3v11l6 6 4-9h5l4 9 6-6V6l-3-3-5 5z'],
 pickaxe:['M5 17l3-9 8-3h8l6 6 2 9-7-9h-9l-7 3z','M5 16V8l8-4h10l7 6 2 10-6-6-5-5h-8l-3 7z','M4 15l4-8 7-2h7l7 3 3 10-7-6h-5v6h-5v-7H9z','M4 18l2-10 9-4h10l6 6v11l-5-10h-7v5h-4V9l-7 4z','M4 17V6h10l4-3 10 4 4 13-8-9h-9l-4 6z','M3 18l3-11 9-4h9l7 5 2 14-5-9-8-3-3 7-3-6-6 3z'],
 sword:['M16 29V8l2-5 2 5v21l-2 3z','M15 29V8l6-5-1 13 2 5-3 11z','M15 29V10l3-7 3 7v19l-3 4z','M14 29V7l8-4-2 9 3 6-3 12-2 3z','M13 28V7l5-4 5 4v21l-5 5z','M14 29V9l-2-3 6-4 6 4-2 3v20l-4 4z'],
 spear:['M18 2l4 9-2 6-2 4-2-4-2-6z','M18 2l6 8-6 12-4-7 1-7z','M11 5l3 9 2-3V3h4v8l2 3 3-9v12l-7 6-7-6z','M16 3h6l-2 6 5 4-7 9-4-6z','M18 2l7 8-2 6-5 7-5-7-2-6z','M18 2l3 7 5-3-2 10-6 8-6-8-2-10 5 3z'],
 warhammer:['M7 6h22v11H7z','M8 5h8v3h5V5h7v14h-7v-3h-5v3H8z','M8 5l8-2h7l6 5v8l-7 4-14-3z','M7 4h9v3h6V4h7v16h-7v-4h-6v4H7z','M6 4h24v17H6z','M6 7l4-4h5v4h6V3h5l4 4v11l-4 4h-5v-5h-6v5h-5l-4-4z'],
 club:['M16 25l-3-8V7l3-3h4l3 3v10l-3 8z','M16 25l-5-10 2-9 5-3 5 3 2 9-5 10z','M16 25V19l-5-3V8l5-3h4l5 3v8l-5 3v6z','M16 25l-4-6-2-9 5-6h6l5 6-2 9-4 6z','M15 25V19l-5-2V7l5-4h6l5 4v10l-5 2v6z','M16 25V20l-5-4V7l7-5 7 5v9l-5 4v5z']
};
function evolvedWeapon(recipe,p,depth,biome){
 const shape=evolvedHeads[recipe.type][Math.min(5,depth-1)];
 const b=['woodland','tundra','marsh','badlands','volcanic'].indexOf(biome);
 const path=(d,c,stroke='none')=>`<path d="${d}" fill="${c}" stroke="${stroke}" stroke-width="1"/>`;
 const grip=depth>=4?'#3e444e':'#79543b',trim=depth>=5?'#d7b974':'#c1a685';
 let s=path('M16 43V13h4v30z',grip,p.outline)+path('M17 15h1v25h-1z','#b59b77');
 for(let y=32;y<41;y+=3)s+=path(`M16 ${y}h4v1h-4z`,trim);
 s+=path('M15 41h6v3h-6z',p.shade,p.outline);
 s+=`<defs><clipPath id="head"><path d="${shape}"/></clipPath></defs>`+path(shape,p.base,p.outline);
 s+=`<g clip-path="url(#head)">`+path('M2 3h32v3H2zM3 6h15v25H3z',p.edge)+path('M19 7h16v22H19z',p.shade)+path('M17 4h2v27h-2z',p.base);
 // Large, readable material construction: vine binding, ice facets, hollow
 // channels, riveted plates, or a single volcanic seam.
 const faces=[path('M10 9l12 8 4-3-12-8z','#507352'),path('M17 3l7 7-5 13-2-9z',p.edge),path('M16 9h5v8h-5z',p.outline)+path('M17 10h2v6h-2z',p.edge),path('M8 10h21v2H8z',trim)+path('M11 8h2v2h-2zM24 14h2v2h-2z',p.edge),path('M20 4l-3 8 3 4-2 8 5-9-3-4 2-7z','#ffc77a')];
 s+=(faces[b]||'')+'</g>';
 if(recipe.type==='sword')s+=path(depth<3?'M12 28h12v2H12z':'M10 26l6 2h4l6-2v4l-6 2h-4l-6-2z',trim,p.outline);
 else s+=path('M15 23h6v2h-6z',trim,p.outline);
 // Functional rear profiles distinguish biome variants even in silhouette.
 if(!['sword','spear'].includes(recipe.type))s+=path(['M14 9l-4 3 4 3z','M14 8l-5-3 3 9z','M14 8h-4v7h4z','M14 8h-5v3h5z','M14 9l-6 5h6z'][Math.max(0,b)],p.shade,p.outline);
 return `<g transform="scale(2)" shape-rendering="crispEdges"><g transform="rotate(38 18 39)">${s}</g></g>`;
}
