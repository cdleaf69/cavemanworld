import {sceneryRock} from './scenery-art.js';
import {MATERIAL_COLORS} from './materials.js';
import {fishSpecies} from './fish-species.js';
import {makeMobSprite} from './mob-art.js';
import {drawSulfur,drawOldTestament} from './relic-art.js';
import {baitById} from './fishing-tackle.js';
import {baitImage} from './fishing-art.js';
import {itemImage} from './item-art.js';
const cache=new Map();
export function resourceImage(id,name=id){
 const bait=baitById(id);if(bait)return baitImage(bait);
 if(id==='steezusBook')return itemImage({id,name,tier:'sulfur',category:'resource'});
 if(!cache.has(id)){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d');const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};const p=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  if(fishSpecies(id)){c.drawImage(makeMobSprite(id).image,0,-9,64,64);}
  else if(id==='sulfur')drawSulfur(c,32,34,1.8);
  else if(id==='oldTestament')drawOldTestament(c,32,34,1.5);
  else if(id==='scratchTicket'){r(12,12,40,42,'#5b8659');r(15,16,34,8,'#f5d189');r(17,28,30,21,'#a8b9b4');r(20,32,24,3,'#dbe2d5');r(21,40,18,4,'#829a91');}
  else if(MATERIAL_COLORS[id]||['stone','iron','copper','quartz','amber','obsidian','moonstone','skyCrystal','essence','glimmer','seaEssence','sunkenRelic'].includes(id)){
   const color=MATERIAL_COLORS[id]||({stone:'#a6b7b4',iron:'#bdcbd2',skyCrystal:'#bba8e5',essence:'#9abdc9',glimmer:'#dacbf1'}[id]||'#c2ac78');sceneryRock(c,0,['#40515b','#a9bec0','#748d97'],color);
  }else if(['wood','sticks'].includes(id)){for(const [x,y]of[[13,20],[25,27],[17,35]]){p([[x,y],[x+30,y+10],[x+27,y+17],[x-3,y+7]],'#805b3d');r(x,y+2,7,5,'#d5ad76');p([[x+9,y+4],[x+28,y+10],[x+27,y+12],[x+8,y+6]],'#bc9461');}}
  else if(/seed|spores/i.test(id)){r(18,16,28,38,'#957650');r(21,20,22,28,'#cfb185');r(24,12,16,8,'#b29264');for(const[x,y]of[[27,29],[37,34],[30,42]]){r(x,y,5,7,'#6b6546');r(x+1,y,2,4,'#e5d29a');}}
  else if(/marijuana|leaves|fiber|herb|flower/i.test(id)){r(30,18,4,35,'#638353');for(const [x,y]of[[32,27],[32,40]])for(const [dx,dy]of[[-23,-10],[-13,-23],[0,-27],[14,-23],[23,-10]])p([[x,y],[x+dx,y+dy],[x+dx*.55,y+dy*.25]],id==='driedMarijuana'?'#a5a365':'#6daa61');r(30,30,4,4,'#c5d87c');}
  else if(/meat|hide|fur|sinew/i.test(id)){p([[14,19],[31,13],[49,24],[47,45],[30,53],[12,41]],/hide|fur/i.test(id)?'#9a805c':'#c58975');p([[19,23],[31,18],[42,25],[37,39],[20,43]],/hide|fur/i.test(id)?'#c1a47a':'#efb998');for(let i=0;i<5;i++)r(20+i*4,29+i%2*5,3,9,'#75564366');}
  else if(/fish|shell|pearl|coral/i.test(id)){p([[14,44],[18,27],[32,15],[47,28],[53,44]],'#9aada4');p([[18,40],[32,20],[47,40]],'#e2dec4');for(let i=0;i<4;i++)p([[30,22],[17+i*9,42],[19+i*9,43]],'#bcba9b');}
  else if(/bone|fang|wing|feather/i.test(id)){p([[14,49],[24,40],[36,15],[44,12],[49,19],[34,42],[19,55]],'#d2d5b8');p([[25,40],[36,17],[43,16],[38,31],[27,45]],'#fff0ce');r(20,45,4,5,'#a5aa8b');}
  else {const color=/berry|pepper/i.test(id)?'#c87d76':/carrot/i.test(id)?'#db9b57':/mushroom/i.test(id)?'#b49b80':'#afb26d';p([[17,25],[29,17],[44,22],[49,38],[39,51],[23,48],[14,36]],'#586450');p([[21,25],[30,21],[41,25],[44,36],[34,46],[22,42],[18,33]],color);r(30,12,5,11,'#558257');p([[31,18],[42,9],[44,15],[35,23]],'#91b773');r(24,26,7,4,'#edddb8');}
  cache.set(id,canvas.toDataURL());
 }
 const img=document.createElement('img');img.className='item-art resource-art';img.width=48;img.height=48;img.alt=name;img.src=cache.get(id);return img;
}
