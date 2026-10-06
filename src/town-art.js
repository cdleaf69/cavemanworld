import {SHOPKEEPER_APPEARANCE,SMITH_APPEARANCE} from './npc-hair.js';
export function townObjects(ctx,art,building,time){
 const sprite=art.sprite(`furniture:${building.type}`,()=>{
  const image=document.createElement('canvas');image.width=1100;image.height=850;const c=image.getContext('2d');const block=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  if(building.type==='house'){
   block(380,178,340,87,'#604638');block(390,165,320,76,'#bd8b51');block(390,180,320,8,'#e7bd78');block(545,197,18,29,'#efca78');block(548,210,12,5,'#6c5842');
   block(130,370,180,200,'#75513b');block(143,381,154,177,'#627c8c');block(150,383,139,45,'#eddfb6');block(145,431,150,112,'#8caebb');block(145,435,150,8,'#adc7c6');
   block(775,450,150,100,'#c29662');block(782,458,136,9,'#e4bd7e');block(810,471,22,31,'#f2dec0');block(840,477,25,25,'#789083');
  }else{
   block(380,175,340,100,'#684e3b');block(373,166,354,19,'#d2ad70');block(380,185,340,10,'#a98357');
   if(building.type==='shop'){for(let i=0;i<6;i++){block(410+i*47,205,31,38,['#87bb76','#b99869','#9dbcc2'][i%3]);block(417+i*47,201,17,6,'#d4c091');}for(const x of [150,845]){block(x,170,105,195,'#674e3f');for(let y=184;y<350;y+=50){block(x+4,y,96,8,'#be9864');for(let i=0;i<3;i++)block(x+12+i*28,y-23,18,23,'#9ead83');}}}
   else{block(465,130,135,48,'#647786');block(450,124,165,17,'#c3d1cd');block(490,163,80,11,'#43555d');block(795,173,100,90,'#6d6460');block(810,182,70,70,'#342f34');block(821,207,47,28,'#e8904e');block(834,211,19,20,'#ffd582');}
  }
  return {image,ax:0,ay:0};
 });
 const objects=[{y:275,draw:()=>{ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite.image,-2,-2);ctx.restore();}}];
 if(building.type!=='house')objects.push({y:155,draw:()=>{art.player(ctx,{x:550,y:155,appearance:building.type==='smith'?SMITH_APPEARANCE:SHOPKEEPER_APPEARANCE,facing:Math.PI/2,moving:false},{equippedGear:{tier:building.type==='smith'?'iron':'wood'}},time);}});
 return objects;
}
