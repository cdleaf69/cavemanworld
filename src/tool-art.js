import {forgedToolSvg} from './equipment-design.js';
// Original pixel equipment, shared by the crafting cards and held-item renderer.
const tiers=['wood','stone','iron','copper','quartz','amber','obsidian','moonstone','verdite','basalt','jade','bogiron','sunstone','sylvite','cryolite','malachite','cobalt','pyrite','liferoot','frostgem','aetherite','adamantite','infernite'];
const blades=[
 'M16 5h5V3h6v3h3v9h-3v3h-7v-3h-4z',
 'M16 5h6V2h7v3h2v12h-3v3h-8v-4h-4z',
 'M15 5h7V2h6v4h3v7h-3v5h-8v-4h-5z',
 'M16 4h5V1h7v5h3v10h-5v4h-6v-6h-4z',
 'M15 6h5V3h4V0h4v6h3v8h-4v4h-7v-4h-5z',
 'M15 4h8V1h6v5h2v9h-3v4h-9v-6h-4z',
 'M14 5h6V2h5V0h4v5h2v12h-5v3h-6v-5h-6z',
 'M15 6h6V2h8v3h2v11h-3v4h-8v-6h-5z',
];
const rect=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
function haft(index){
 let s='';for(let i=0;i<22;i++){const x=11+Math.floor(i/3),y=27-i;s+=rect(x,y,3,2,'#624936')+rect(x,y,1,2,'#c79865');}
 const wrap=['#dfc899','#87b08a','#c7d8d0','#dfa377'][index%4];
 for(let i=0;i<3;i++)s+=rect(12+i,24-i*3,3,1,wrap);
 return s+rect(10,28,4,2,'#493e36');
}
function mineralDetail(index,dark,light){
 let s=rect(20,7,3,5,dark)+rect(21,7,1,3,'#f5eccb');
 if(index>=4){const x=23+index%3,y=4+index%4;s+=rect(x,y,2,3,'#f5eccb')+rect(x-1,y+3,4,2,light);}
 if(index>=8)s+=rect(16,11+index%5,2,2,'#dbe8bc');
 return s;
}
export function toolSvg(recipe,dark,light){
 const forged=forgedToolSvg(recipe,dark,light);if(forged)return forged;
 const index=Math.max(0,tiers.indexOf(recipe.tier));let art='';
 if(recipe.type==='axe'){
  const crude=recipe.id==='stone-axe',reinforced=recipe.id==='reinforced-axe';
  const shape=crude?'M17 6h6V4h5v3h2v8h-4v2h-8z':blades[index%blades.length];
  art=haft(index)+`<path d="${shape}" fill="${dark}"/><path d="${shape}" transform="translate(0 -1)" fill="${light}"/>`;
  const clip=`blade-${recipe.id}`;
  art+=`<defs><clipPath id="${clip}"><path d="${shape}" transform="translate(0 -1)"/></clipPath></defs><g clip-path="url(#${clip})"><path d="M20 1h4v6h3v8h-4v5h-4V9h1z" fill="${dark}" opacity=".27"/><path d="M28 1h3v18h-5v-3h2z" fill="#eff1d9" opacity=".65"/><path d="M21 3h7v2h-4v2h-3z" fill="#f8eec7" opacity=".65"/></g>`;
  art+=rect(16,5,4,10,'#6d5542')+rect(17,5,1,8,'#d7b07b')+mineralDetail(index,dark,light);
  if(crude||reinforced){for(let i=0;i<3;i++)art+=rect(16,7+i*3,5,1,'#e4d2a0');}
  if(reinforced)art+=rect(23,3,6,2,'#ebecd4')+rect(13,16,4,2,'#acb9ad');
 }else if(recipe.type==='club'){
  const head=recipe.tier==='wood'?'#aa7b35':light,shade=recipe.tier==='wood'?'#705035':dark;
  art=`<path d="M3 29v-3h3v-4h3v-4h3v-4h3V9h3V5h3V2h6v2h3v7h-3v4h-4v4h-5v3h-4v4h-4v4H5v2H2v-3z" fill="#62483d"/><path d="M5 27h3v-5h3v-4h3v-4h3V9h3V5h6v1h2v6h-4v4h-4v3h-5v3h-4v4H8v3H5z" fill="${head}"/><path d="M8 25h3v-5h3v-4h3v-4h3V7h3V4h3v3h-2v5h-4v4h-4v4h-4v4z" fill="${shade}"/><path d="M13 18h3v-4h3v-4h3V6h3v3h-2v5h-4v4h-3v3h-3z" fill="#f5d78c" opacity=".6"/>`;
  art+=rect(5,27,4,1,'#dbb27a')+rect(8,24,3,1,'#dbb27a');
 }else if(recipe.type==='sword'){
  art=`<path d="M7 28 23 5l5-3-1 7L12 29z" fill="${light}"/><path d="m9 27 17-22" stroke="${dark}" stroke-width="2"/><path d="m5 22 12 7" stroke="#e0bc76" stroke-width="3"/><path d="m3 31 5-7" stroke="#76553e" stroke-width="4"/>`;
 }else if(recipe.type==='spear'){
  art=`<path d="m3 31 22-23" stroke="#896447" stroke-width="3"/><path d="m21 11 1-7 9-4-4 9-5 3z" fill="${light}"/><path d="m23 10 6-7" stroke="${dark}" stroke-width="2"/>`;
 }else if(recipe.type==='warhammer'){
  art=`<path d="m6 30 14-19" stroke="#896447" stroke-width="5"/><path d="m13 5 7-4 12 11-6 7z" fill="${dark}"/><path d="m15 5 5-2 9 9-4 4z" fill="${light}"/>`;
 }else if(recipe.type==='bow'){
  const level=recipe.bowLevel||0;
  const limbs=[
   'M12 3h5v3h4v4h3v5h2v7h-2v5h-3v3h-5v-3h4v-5h2v-7h-2v-5h-4V6h-4z',
   'M11 2h6v3h4v4h3v6h2v8h-3v6h-6v2h-5v-3h6v-6h3v-7h-3V9h-3V5h-4z',
   'M10 1h8v5h4v5h5v12h-4v6h-5v3h-7v-4h6v-6h5v-8h-5V7h-7z',
   'M8 2h6v5h4v3h5v6h4v6h-4v3h-5v4h-6v-3h3v-4h5v-8h-4v-4h-5V6H8z',
   'M8 0h7v5h6v5h5v5h3v9h-5v5h-6v3h-7v-4h6v-6h6v-7h-4v-5h-5V5H8z',
   'M7 0l9 2 3 5h6l4 6-1 11-5 3h-4l-3 5h-8l6-7h7l3-5-1-6-5-3-3-5H9z',
   'M7 0h7l4 5h7l7 9-3 10-9 3-4 5H7l6-8h8l5-6-3-7h-7l-4-7H7z',
  ];
  art=`<path d="${limbs[level]}" fill="${dark}" stroke="${light}" stroke-width="1"/><path d="M13 4 15 29" stroke="#f1e4bb" stroke-width="1"/>`;
  art+=rect(12,16,9,5,'#886344')+rect(13,17,6,1,'#ddba87');
  if(level>0)for(let i=0;i<level;i++)art+=rect(18+i%3,7+i*3,2,2,light);
  if(level>=3)art+=`<path d="M22 13l4 4-4 5-3-5z" fill="${light}"/><path d="M22 15v4" stroke="#fff1d0"/>`;
  if(level>=5)art+=`<path d="M8 3l-3 5 8 1M12 27l-7-3 3 7" fill="none" stroke="${light}" stroke-width="2"/>`;
 }else if(recipe.type==='slingshot'){
  art=`<path d="M13 29V18L7 9V4h4v5l5 6 5-6V4h4v6l-7 9v10z" fill="#76543b"/><path d="M14 27v-9L9 9V5M17 18l6-9V5" fill="none" stroke="#d4a76e" stroke-width="2"/><path d="M9 5 16 12 23 5" fill="none" stroke="#b98264" stroke-width="2"/><rect x="14" y="11" width="4" height="4" fill="#657b80"/>`;
 }else if(recipe.type==='rock'){
  art=`<path d="M7 22V13h3V9h7V7h6v4h4v4h2v10h-5v3H12v-3H7z" fill="#586d70"/><path d="M9 19v-6h4V9h9v4h4v7h-4v5H12v-3z" fill="#9ebfc1"/><path d="M12 10h9v3h-5v3h-5v-3h1z" fill="#dfebe0"/><path d="M23 15h4v8h-6v3h-5v-3h5v-4h2z" fill="#7b999f"/>`+rect(11,21,12,2,'#b5ac83');
 }else if(recipe.type==='rod'){
  // Keep the existing line-tip (59,13) and grip (27,81) coordinates exact.
  const rodLevel=recipe.id==='abyss-rod'?2:recipe.id==='reef-rod'?1:0;
  const reel=rodLevel===2?'M35 48l7-5 11 4 2 12-7 9-12-5z':rodLevel===1?'M36 49h17v14H36z':'M38 48h13v15H38z';
  const fittings=Array.from({length:recipe.fishingUpgradeLevel||0},(_,i)=>`<path d="M${39+i*3} ${58-i*7}l7 3" stroke="${light}" stroke-width="3"/>`).join('');
  const upgrade=rodLevel?`<path d="${reel}" fill="${dark}" stroke="${light}" stroke-width="2"/><path d="M40 52h9v7h-9z" fill="${light}"/><path d="M42 36l8 3M46 25l8 3" stroke="${light}" stroke-width="4"/>`+(rodLevel===2?'<path d="M32 74l-5-8 10 1M52 18l-6-5 10-1" fill="#acdef2"/>':''):'';
  return `<g><path d="M27 81 36 67 44 50 52 31 59 13" fill="none" stroke="#5d4837" stroke-width="7" stroke-linecap="square"/><path d="M27 81 36 67 44 50 52 31 59 13" fill="none" stroke="#cca16a" stroke-width="3" stroke-linecap="square"/><path d="M29 77 33 71M32 71 36 65M35 65 39 59" stroke="#e4d2a0" stroke-width="4"/><path d="M58 13Q83 25 78 63" fill="none" stroke="#f5e6bc" stroke-width="2"/><path d="M75 62h6v6h-2v3h-4v-2h2v-4h-2z" fill="#87989d"/><rect x="38" y="48" width="13" height="15" fill="#5b4b3c"/><rect x="40" y="50" width="9" height="11" fill="#d1b277"/><rect x="42" y="52" width="5" height="7" fill="#89755a"/><path d="M48 59h7v5" fill="none" stroke="#c9d8ce" stroke-width="3"/><rect x="55" y="62" width="4" height="4" fill="#74543a"/>${upgrade}${fittings}</g>`;
 }
 return `<g transform="scale(3)" shape-rendering="crispEdges">${art}</g>`;
}
