import {equipmentStyle} from './equipment-design.js';
// Original 32-pixel silhouettes: mineral identity changes shape as well as color.
const heads={
  stone:'M9 7h5V5h8v2h4v4h-7v2h-4V9h-6z',
  iron:'M4 10V7h5V5h6V4h7v2h5v3h3v4h-3v-3h-7V8h-7v1H8v3H4z',
  copper:'M6 9V6h5V4h10v2h5v2h3v6h-3v-4h-8V8h-5v4H9v3H6z',
  quartz:'M5 13V7h3V3h3v5h4V1h4v7h4V4h3v5h3v5h-5v-3h-5v3h-4v-3h-5v2z',
  amber:'M5 12V6h4V3h12v2h5v4h3v6h-4v-5h-5V8h-7v2h-4v5H5z',
  obsidian:'M3 14V8h4V4h8V2h9v3h4v3h3v6h-3v-3h-3v-3h-5v2h-3v-3h-5v2H8v3H5v2z',
  moonstone:'M6 13V7h3V3h5V1h9v3h5v4h2v7h-3v-5h-3V7h-5V5h-5v2h-3v6z',
  verdite:'M5 12V8h3V4h6v3h3V2h4v5h5v3h4v5h-4v-3h-5v2h-5v-3h-5v3z',
  basalt:'M4 6h11V4h9v3h5v7h-4v-3h-8v2h-5v-3H4z',
  jade:'M4 13V8h4V4h6V2h7v3h6v3h3v5h-4V9h-6V7h-6v3H9v3z',
  bogiron:'M5 15V5h5V3h10v3h8v4h2v6h-4v-5h-7V8h-7v3H9v4z',
  sunstone:'M3 11V7h5V4h6V1h3v3h5V1h3v5h4v5h-4V9h-6v3h-5V9H8v5H3z',
  sylvite:'M4 12V9h3V5h4V2h4v6h3V3h4v5h4v2h4v5h-4v-3h-5v2h-6v-3H9v3z',
  cryolite:'M3 12V6h4V2h3v5h5V1h4v6h4V3h4v5h4v5h-5v-3h-6v4h-5v-4H8v5H3z',
  malachite:'M4 13V5h7V2h4v5h5V3h7v5h3v7h-4v-5h-6v3h-5v-3h-6v3z',
  cobalt:'M3 11V6h8V3h12v3h6v3h2v5h-5v-4h-6v3h-5v-3H8v4H3z',
  pyrite:'M3 7h4V4h5V2h11v3h5v3h3v7h-5v-5h-6v3h-6v-3H7v4H3z',
  liferoot:'M3 13V9h4V5h4V1h4v6h4V2h4v6h5v3h3v5h-5v-4h-6v3h-5v-4h-5v5H3z',
  frostgem:'M2 14V7h4V3h4V1h4v6h4V0h4v7h4V3h4v8h2v5h-6v-5h-6v4h-6v-4H8v5H2z',
  aetherite:'M3 13V7h4V3h7V1h8v4h5v3h4v7h-5v-5h-6v3h-5V9h-5v5H3z',
  adamantite:'M2 14V8h4V4h5V1h7v4h5V2h4v6h4v7h-5v-4h-6v3h-5v-4h-5v5H2z',
  infernite:'M3 15V7h4V2h4v5h5V0h4v7h4V3h4v7h3v6h-5v-5h-6v4h-5v-4H9v5H3z',
  viridium:'M3 13V8h5V4h5V1h4v7h4V3h5v5h4v7h-5v-4h-6v3h-5v-4H8v5H3z',
  glacium:'M2 15V8h3V2h4v6h5V0h4v8h4V2h4v6h4v7h-5v-4h-6v4h-5v-4H7v5H2z',
  tideglass:'M2 13V6h7V3h5V1h8v5h7v9h-4v-4h-6v3h-6V9H8v5H2z',
  orichalcum:'M2 12V7h5V4h6V1h9v4h6v3h3v7h-5v-5h-7v3h-5V9H8v5H2z',
  hellstone:'M2 15V6h4V1h4v6h5V0h5v6h4V2h4v7h3v7h-6v-5h-5v4h-5v-4H8v5H2z',
  worldroot:'M2 15V9h4V5h4V0h5v7h5V1h4v7h5v3h2v5h-6v-4h-5v4h-5v-5H8v5H2z',
  starfrost:'M1 14V7h4V1h4v7h4V0h6v8h4V1h4v7h4v8h-5v-5h-6v4h-6v-4H7v5H1z',
  levianite:'M1 13V5h6V2h6v4h4V0h5v5h6v4h3v7h-5v-5h-7v3h-5v-4H7v6H1z',
  solarium:'M1 12V6h5V3h5V0h4v4h5V0h4v5h5v4h2v7h-5v-5h-6v3h-6v-4H7v5H1z',
  voidsteel:'M1 16V7h5V3h7V0h10v4h5v5h3v7h-6v-5h-5v4h-6v-5H8v6H1z',
};
export function pickaxeSvg(tier,dark,light){
  const {depth}=equipmentStyle(tier);
  let haft='';for(let i=0;i<20;i++){const x=11+Math.floor(i/3),y=27-i;haft+=`<rect x="${x}" y="${y}" width="${depth>=5?4:3}" height="2" fill="${depth>=4?dark:'#70513d'}"/><rect x="${x}" y="${y}" width="1" height="2" fill="${depth>=4?light:'#d3a471'}"/>`;}
  if(depth>=2)haft+=`<path d="M13 19h4v2h-4zm2-6h4v2h-4z" fill="${light}"/>`;
  if(depth>=3)haft+=`<path d="M11 27l-3 2 4 3 4-3-2-2z" fill="${dark}"/><path d="M11 28h3v2h-3z" fill="${light}"/>`;
  if(depth>=4)haft+=`<path d="M13 17l-4-3 4-1 4 4-2 3z" fill="${light}"/>`;
  if(depth>=5)haft+=`<path d="M19 14l3-2 4 2-4 3z" fill="${light}"/><path d="M13 21h6v2h-6z" fill="#e2d6ab"/>`;
  if(depth>=6)haft+=`<path d="M22 15h5v5h-5zm-2 2h2v1h-2zm5-4h1v2h-1z" fill="${light}"/><path d="M23 16h3v3h-3z" fill="${dark}"/>`;
  const motif=Object.keys(heads).indexOf(tier),shape=heads[tier]||heads.iron;
  const wrap=['#88b279','#d0ad80','#b8cad0','#e7c78d'][Math.max(0,motif)%4];
  return `<g transform="scale(3)" shape-rendering="crispEdges">${haft}<rect x="12" y="22" width="3" height="2" fill="${wrap}"/><rect x="13" y="19" width="3" height="2" fill="${wrap}"/><path d="${shape}" fill="${dark}"/><path d="${shape}" fill="${light}" transform="translate(0 -1)"/><path d="${shape}" fill="${dark}" opacity=".35" transform="translate(0 2)"/><rect x="15" y="6" width="5" height="6" fill="${dark}"/><rect x="16" y="6" width="3" height="3" fill="${light}"/><rect x="17" y="6" width="1" height="1" fill="#f3f0cf"/><rect x="9" y="5" width="4" height="1" fill="#f3f0cf" opacity=".65"/>${motif>9?`<rect x="18" y="11" width="2" height="2" fill="${wrap}"/>`:''}</g>`;
}
