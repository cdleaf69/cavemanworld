import {DEALER_APPEARANCE} from './npc-hair.js';
import {CASINO_BUILDING,CASINO_FIXTURES} from './world.js';
const block=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
const make=(w,h)=>{const image=document.createElement('canvas');image.width=w;image.height=h;return image;};
export function drawCasinoBuilding(ctx,art,building=CASINO_BUILDING){
  const sprite=art.sprite(`town-building:${building.id}`,()=>{
    const image=make(220,185),c=image.getContext('2d');
    block(c,23,72,174,86,'#735a48');block(c,27,78,166,76,'#c4a774');
    for(let x=32;x<190;x+=19){block(c,x,80,5,73,'#8b6948');block(c,x,81,2,64,'#e7c58b');}
    const variant=[...building.id].reduce((n,c)=>n+c.charCodeAt(0),0)%3;
    const roof=({shop:['#527e77','#78a092'],smith:['#586676','#8c9b9d'],house:['#927147','#c0a06b'],casino:['#ac7753','#cb955e']})[building.type];
    if(building.biome==='tundra'){roof[0]='#83a4a8';roof[1]='#beded3';}
    if(building.biome==='marsh'&&building.type==='house'){roof[0]='#6c8a72';roof[1]='#a4ad77';}
    if(building.type==='house'){
      for(let y=28;y<79;y+=3){const w=variant===1?82:38+(y-28)*1.0;block(c,110-w,y,w*2,3,roof[y%2]);}
      if(variant===1){block(c,24,27,172,6,'#735340');for(let x=30;x<195;x+=13)block(c,x,32,4,46,'#ab8953');}
      if(variant===2){block(c,47,51,39,51,'#aa8a58');for(let y=27;y<55;y+=3)block(c,66-(y-27),y,(y-27)*2+6,3,'#c0a06b');}
      block(c,35,111,31,27,'#3c635a');block(c,38,114,25,20,'#e5bb79');block(c,49,113,3,23,'#79593e');
      block(c,155,107,28,29,'#3c635a');block(c,158,110,22,22,'#e5bb79');block(c,168,110,2,24,'#79593e');
      block(c,35,140,34,8,'#826447');block(c,39,138,6,5,'#78ad6d');block(c,55,137,6,5,'#da958b');
    }else if(building.type==='shop'){
      for(let y=24;y<69;y+=3){const w=70+(y-24)*.5;block(c,110-w,y,w*2,3,roof[y%2]);}
      block(c,15,96,190,18,'#d8c293');for(let x=15;x<205;x+=24)block(c,x,96,12,18,'#6d9c91');
      block(c,18,111,5,47,'#6e513f');block(c,197,111,5,47,'#6e513f');
      block(c,35,122,44,27,'#496962');block(c,39,125,35,18,'#a5b99c');block(c,146,127,33,27,'#9d7548');block(c,147,137,31,3,'#d3a568');block(c,150,128,8,8,'#da8270');block(c,162,128,9,7,'#adc06e');
    }else if(building.type==='smith'){
      block(c,23,72,174,86,'#7e9293');for(let y=77;y<157;y+=14)for(let x=24;x<194;x+=24)block(c,x+(y%28?0:8),y,22,12,'#a1ad9e');
      for(let y=36;y<76;y+=3)block(c,14,y,191-(y-36)*.65,3,roof[y%2]);
      block(c,157,13,23,65,'#687782');for(let y=15;y<75;y+=11)block(c,158,y,21,2,'#a5b5af');block(c,153,11,31,7,'#bac2b1');
      block(c,33,100,42,47,'#344949');block(c,39,126,30,17,'#d87943');block(c,47,121,13,22,'#f6bb5c');block(c,41,143,25,4,'#5d5552');
      block(c,145,136,43,8,'#40545f');block(c,155,143,22,9,'#657986');block(c,145,152,42,4,'#40545f');
    }else{
      for(let y=13;y<76;y+=3){const w=36+(y-13)*1.06;block(c,110-w,y,w*2,3,roof[y%2]);}
      for(const x of [23,174]){block(c,x,55,23,101,'#9c7453');block(c,x-4,49,31,9,'#e2bd77');block(c,x+5,88,13,26,'#f3d784');}
      block(c,106,1,8,15,'#efd07d');block(c,101,5,18,7,'#efd07d');
      for(const x of [49,150]){block(c,x,109,22,29,'#5c7563');block(c,x+3,112,16,23,'#efc579');}
    }
    block(c,10,73,200,7,'#674c3e');block(c,17,73,186,2,'#edc48a');
    block(c,90,118,40,41,'#725140');block(c,96,123,28,35,'#2c4140');block(c,97,123,3,34,'#ac895d');
    if(building.type!=='house'){block(c,52,81,116,15,'#374e49');block(c,54,81,112,2,'#e5c27b');c.fillStyle='#f4d998';c.font='bold 9px monospace';c.textAlign='center';c.fillText(building.sign,110,92);}
    block(c,83,158,54,5,'#a5b2a2');block(c,79,163,62,4,'#7d958a');
    return {image,ax:110,ay:150};
  });art.shadow(ctx,building.x,building.y+60,170);art.draw(ctx,sprite,building.x,building.y+60,2.1);
}
export function drawCasinoFloor(ctx,art,building=CASINO_BUILDING){
  const sprite=art.sprite(`town-room:${building.id}`,()=>{
    const image=make(1100,850),c=image.getContext('2d');
    block(c,0,0,1100,850,'#273d3f');block(c,60,60,980,750,'#927756');block(c,70,70,960,730,'#b19468');
    for(let y=70;y<800;y+=24)for(let x=70;x<1030;x+=64){block(c,x,y,63,23,(Math.floor(x/64)+Math.floor(y/24))%3?'#b19468':'#bba173');block(c,x+5,y+4,37,1,'#d1b38355');}
    block(c,60,40,980,55,'#5c6954');block(c,68,46,964,7,'#adc09a');block(c,68,89,964,6,'#394d45');
    if(building.type==='smith'){for(let y=95;y<715;y+=40)for(let x=75;x<1020;x+=48)block(c,x,y,46,38,(x+y)%3?'#859390':'#9eaa9d');}
    const rug=({house:['#557b65','#86a27d'],shop:['#9d7b48','#c6a164'],smith:['#536d74','#819294'],casino:['#864e54','#b16b66']})[building.type];
    block(c,477,92,148,540,rug[0]);block(c,486,96,130,530,rug[1]);
    for(let y=105;y<620;y+=40){block(c,488,y,3,19,'#e6bd84');block(c,611,y,3,19,'#e6bd84');}
    block(c,470,716,160,84,'#627b65');block(c,490,730,120,65,'#8ca280');block(c,516,760,68,12,'#d6c39c');
    c.font='bold 24px monospace';c.textAlign='center';c.fillStyle='#f4ddab';c.fillText(building.name.toUpperCase(),550,133);c.font='bold 16px monospace';c.fillText('EXIT',550,793);
    for(const x of [90,996])for(const y of [100,645]){block(c,x,y,14,50,'#6a5444');block(c,x-5,y-5,24,15,'#dcad64');block(c,x+4,y-14,8,12,'#ffe299');}
    return {image,ax:0,ay:0};
  });ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite.image,-2,-2);ctx.restore();
}
export function casinoObjects(ctx,art,time){
  const objects=[];
  for(const fixture of CASINO_FIXTURES){
    const sprite=art.sprite(`casino-${fixture.id}`,()=>{
      const image=make(320,230),c=image.getContext('2d');
      if(fixture.id==='slots'){
        for(const x of [15,115,215]){
          block(c,x,30,78,136,'#425b59');block(c,x+3,33,72,116,'#a69068');block(c,x+8,36,62,12,'#dfbe7e');
          block(c,x+9,62,60,53,'#263e40');
          for(let i=0;i<3;i++){block(c,x+13+i*18,68,14,34,'#e7d8af');block(c,x+16+i*18,79,8,10,['#cc7495','#75ad73','#91bad1'][i]);}
          block(c,x+16,124,47,14,'#587858');block(c,x+52,129,6,5,'#ecc780');block(c,x+76,80,5,33,'#6c6350');block(c,x+74,76,9,9,'#da8e6c');block(c,x-2,163,82,7,'#344c4b');
        }
      }else{
        block(c,37,66,250,113,'#694d3f');block(c,32,70,260,101,'#bb9763');block(c,39,78,246,85,'#48785f');block(c,50,83,225,4,'#a8bb83');
        for(const x of [85,140,195]){block(c,x,122,31,32,'#b5c19b');block(c,x+3,125,25,25,'#48785f');}
        for(const [x,y] of [[110,105],[150,99],[183,105]]){block(c,x,y,16,23,'#f1e6c5');block(c,x+3,y+5,5,5,'#bd6666');}
        block(c,45,175,12,25,'#634f3c');block(c,270,175,12,25,'#634f3c');
        c.fillStyle='#eadbb4';c.font='bold 14px monospace';c.textAlign='center';c.fillText('BLACKJACK',162,110);
      }
      return {image,ax:160,ay:147};
    });objects.push({y:fixture.y,draw:()=>art.draw(ctx,sprite,fixture.x,fixture.y,1)});
  }
  objects.push({y:300,draw:()=>{art.player(ctx,{x:780,y:300,appearance:DEALER_APPEARANCE,facing:Math.PI/2,moving:false},{equippedGear:null},time);ctx.fillStyle='#f5ddaa';ctx.font='bold 17px monospace';ctx.textAlign='center';ctx.fillText('Dealer',780,180);}});
  return objects;
}
