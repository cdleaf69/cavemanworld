import { MATERIAL_COLORS } from './materials.js';
// Self-contained vector illustrations for crafted equipment. The UI uses img
// elements so every recipe has a visual thumbnail without a paid asset service.
const PALETTE={leaf:['#527c55','#a6d082'],wood:['#705037','#d8a66d'],stone:['#667772','#bbc5ae'],copper:['#995945','#e7a672'],quartz:['#7295a2','#d9f2f1'],amber:['#9a603c','#f2c778'],iron:['#6d777b','#d4ddd1'],obsidian:['#504866','#b69bd5'],moonstone:['#7165a4','#e1d4ff']};

for(const [id,color] of Object.entries(MATERIAL_COLORS))PALETTE[id]=['#4c5974',color];
export function itemSvg(recipe,{background=true}={}){
  const [dark,light]=PALETTE[recipe.tier]||PALETTE.stone;
  const isGear=recipe.category==='gear';
  let shape='';
  if(recipe.category==='structure'){
    shape=`<path d="M16 69 34 55 76 69M20 75 62 53 80 75" fill="none" stroke="#b99265" stroke-width="9" stroke-linecap="round"/><path d="M47 61Q23 40 43 20Q42 39 52 34Q65 15 68 42Q69 57 47 61Z" fill="#f4a657" stroke="#ffdb8d" stroke-width="3"/>`;
  }else if(isGear){
    shape=`<path d="M22 18 37 12 46 19 55 12 70 18 77 34 65 40 62 75 30 75 27 40 15 34Z" fill="${dark}" stroke="${light}" stroke-width="4"/><path d="M38 21 46 29 54 21M31 46h30M34 58h24" fill="none" stroke="${light}" stroke-width="3"/>`;
    if(recipe.id.includes('wing'))shape+=`<path d="M22 25 5 15 14 47 26 42M70 25 87 15 78 47 66 42" fill="${light}" opacity=".75"/>`;
    if(recipe.id.includes('shell'))shape+=`<path d="M37 38 46 32 55 38 55 55 46 64 37 55Z" fill="${light}"/>`;
    if(recipe.id.includes('moonstone'))shape+=`<path d="M46 34 54 46 46 61 38 46Z" fill="#f4eaff"/>`;
  }else if(recipe.type==='rock'){
    shape=`<path d="M19 55 25 31 51 21 71 37 66 64 43 75Z" fill="${dark}" stroke="${light}" stroke-width="5"/><path d="m30 37 18-7 12 10" fill="none" stroke="${light}" stroke-width="4"/>`;
  }else if(recipe.type==='rod'){
    shape=`<path d="M27 81Q47 58 59 13" fill="none" stroke="#674a35" stroke-width="7" stroke-linecap="round"/><path d="M28 78Q47 55 59 13" fill="none" stroke="#d2ad73" stroke-width="3" stroke-linecap="round"/><path d="M58 15Q83 25 78 63" fill="none" stroke="#f5e6bc" stroke-width="2"/><circle cx="78" cy="64" r="5" fill="#8d969b" stroke="#e9efec" stroke-width="2"/><circle cx="42" cy="56" r="8" fill="${dark}" stroke="${light}" stroke-width="3"/>`;
  }else{
    shape=`<path d="M35 78 55 18" stroke="#5b4334" stroke-width="13" stroke-linecap="round"/><path d="M35 78 55 18" stroke="#c79568" stroke-width="5" stroke-linecap="round"/>`;
    if(recipe.type==='axe')shape+=`<path d="M47 15 76 12 81 29 59 40 48 33Z" fill="${dark}" stroke="${light}" stroke-width="4"/>`;
    else if(recipe.type==='pickaxe')shape+=`<path d="M22 17Q48 2 78 18L73 27Q49 18 25 27Z" fill="${dark}" stroke="${light}" stroke-width="4"/>`;
    else shape+=`<path d="M45 8Q60 2 68 16L65 36Q54 43 44 31Z" fill="${dark}" stroke="${light}" stroke-width="4"/><circle cx="57" cy="20" r="5" fill="${light}"/>`;
    if(recipe.id.includes('venom'))shape+=`<path d="M68 36Q83 45 67 52Q59 47 68 36" fill="#b6e87e"/>`;
    if(recipe.id.includes('bone'))shape+=`<path d="M42 13Q28 5 26 18Q32 29 44 27" fill="#e9dbc1"/>`;
  }
  const backdrop=background?`<defs><radialGradient id="bg"><stop stop-color="${dark}" stop-opacity=".65"/><stop offset="1" stop-color="#1c2a28"/></radialGradient></defs><rect width="96" height="96" rx="15" fill="url(#bg)"/><path d="M8 75 75 8M-5 49 49-5" stroke="${light}" stroke-opacity=".17" stroke-width="2"/>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">${backdrop}${shape}${background?`<circle cx="80" cy="78" r="5" fill="${light}"/>`:''}</svg>`;
}
export function itemImage(recipe){
  const svg=itemSvg(recipe);
  const img=document.createElement('img');img.className='item-art';img.alt=`${recipe.name} illustration`;img.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;img.width=72;img.height=72;return img;
}
