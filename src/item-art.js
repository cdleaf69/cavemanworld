import {armorSvg} from './equipment-design.js';
import {frontierItemSvg} from './frontier-item-art.js';
import { MATERIAL_COLORS } from './materials.js';
import { pickaxeSvg } from './pickaxe-art.js';
import { toolSvg } from './tool-art.js';
// Self-contained vector illustrations for crafted equipment. The UI uses img
// elements so every recipe has a visual thumbnail without a paid asset service.
const PALETTE={leaf:['#527c55','#a6d082'],wood:['#705037','#d8a66d'],stone:['#667772','#bbc5ae'],copper:['#995945','#e7a672'],quartz:['#7295a2','#d9f2f1'],amber:['#9a603c','#f2c778'],iron:['#6d777b','#d4ddd1'],obsidian:['#504866','#b69bd5'],moonstone:['#7165a4','#e1d4ff']};

for(const [id,color] of Object.entries(MATERIAL_COLORS))PALETTE[id]=['#4c5974',color];
export function itemSvg(recipe,{background=true}={}){
  const [dark,light]=PALETTE[recipe.tier]||PALETTE.stone;
  const isGear=recipe.category==='gear';
  let shape='';
  const frontier=frontierItemSvg(recipe);
  if(frontier)shape=frontier;
  else if(recipe.category==='structure'){
    shape=`<path d="M16 69 34 55 76 69M20 75 62 53 80 75" fill="none" stroke="#b99265" stroke-width="9" stroke-linecap="round"/><path d="M47 61Q23 40 43 20Q42 39 52 34Q65 15 68 42Q69 57 47 61Z" fill="#f4a657" stroke="#ffdb8d" stroke-width="3"/>`;
  }else if(isGear){
    shape=armorSvg(recipe,dark,light);
  }else if(['rock','rod','axe','club','bow','slingshot','sword','spear','warhammer'].includes(recipe.type)){
    shape=toolSvg(recipe,dark,light);
  }else if(recipe.type==='pickaxe'){
    shape=pickaxeSvg(recipe.tier,dark,light);
  }
  const backdrop=background?`<defs><radialGradient id="bg"><stop stop-color="${dark}" stop-opacity=".65"/><stop offset="1" stop-color="#1c2a28"/></radialGradient></defs><rect width="96" height="96" rx="15" fill="url(#bg)"/><path d="M8 75 75 8M-5 49 49-5" stroke="${light}" stroke-opacity=".17" stroke-width="2"/>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">${backdrop}${shape}${background?`<circle cx="80" cy="78" r="5" fill="${light}"/>`:''}</svg>`;
}
export function itemImage(recipe){
  const svg=itemSvg(recipe);
  const img=document.createElement('img');img.className='item-art';img.alt=`${recipe.name} illustration`;img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;img.width=72;img.height=72;return img;
}
