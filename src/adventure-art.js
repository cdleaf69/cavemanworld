import {leafMass,sceneryRock,sceneryMushroom,sceneryPolygon} from './scenery-art.js';
import {equipmentPalette} from './refined-equipment-art.js';
import {drawNpcHair} from './npc-hair.js';
import {equipmentStyle} from './equipment-design.js';
import {drawMob} from './mob-art.js';
import {CROPS,forageCrop} from './gardening.js';
import {equipmentRecipe} from './bow-upgrades.js';
import { ToyArt } from './toy-art.js';
import { grain } from './pixel-art.js';
import { MATERIAL_COLORS } from './materials.js';
import { RECIPES } from './crafting.js';
import { itemSvg } from './item-art.js';
import { CAMERA_TILT } from './camera.js';
import { playerArmPose, heldToolPose, fishingRodTipWorld } from './player-animation.js';
const toolRecipes=new Map(RECIPES.filter(recipe=>recipe.category==='tool').map(recipe=>[recipe.id,recipe]));
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function canvas(w,h){if(typeof document==='undefined')return new OffscreenCanvas(w,h);const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function ellipse(c,x,y,rx,ry,color){for(let yy=-ry;yy<=ry;yy+=2){const r=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry)))/2)*2;rect(c,x-r,y+yy,2*r,2,color);}}
const palettes={heartlands:['#286d50','#388d53','#66b65e','#a6d976'],woodland:['#235b49','#328153','#58a65a','#92d175'],tundra:['#416c79','#669b9a','#9bccbb','#d9edd8'],marsh:['#2c655d','#3b9177','#68b996','#a3dac0'],badlands:['#93694c','#bb884f','#ddae65','#f2d38f'],volcanic:['#584768','#795d80','#a27992','#d4a3b1']};
export class AdventureArt extends ToyArt {
  makeTerrain(gx,gy,layer){
    const image=super.makeTerrain(gx,gy,layer),c=image.getContext('2d');
    // Sparse, fixed pixel details are baked once in the terrain worker.
    for(let i=0;i<70;i++){const x=Math.floor(grain(gx*71+i,gy)*254),y=Math.floor(grain(gy*71+i,gx)*254);const color=layer==='surface'?'#537f4930':layer==='ocean'?'#a8d4cf20':'#c4bada25';rect(c,x,y,2,1,color);if(i%3===0)rect(c,x+1,y-2,1,3,color);}
    return image;
  }
  resource(ctx,n,time,player,hovered=false){
    if(n.kind==='bush'){n.crop??=CROPS.find(c=>forageCrop(n)[c.id]);super.resource(ctx,{...n,resource:n.crop?.id||n.resource},time,player,hovered);}else super.resource(ctx,n,time,player,hovered);
  }
  makeResource(kind,biome,resource,variant){
    if(kind==='rock'||kind==='ore'){
      const image=canvas(64,66),c=image.getContext('2d'),form=variant%4;
      const stone=({tundra:['#607f96','#b9d8df','#87a9bc'],marsh:['#526c62','#9cb89a','#718e79'],badlands:['#95684f','#e5be84','#be9162'],volcanic:['#504960','#a39aba','#756a8d']})[biome]||['#536b7c','#b3c8c8','#829ba5'];
      sceneryRock(c,form,stone,kind==='ore'?(MATERIAL_COLORS[resource]||'#d6dbea'):null);
      if(kind==='rock'&&(biome==='woodland'||biome==='marsh')&&variant%3===0){rect(c,17,39,10,3,'#567b55');rect(c,20,38,7,2,'#9ab67b');}
      return {image,ax:32,ay:55,crispOutline:true};
    }
    if(kind==='ground'&&resource==='stone'){const image=canvas(64,66),c=image.getContext('2d');c.save();c.translate(11,20);c.scale(.65,.65);sceneryRock(c,variant%3,['#4b666a','#b4c9be','#799994']);c.restore();return {image,ax:32,ay:55,crispOutline:true};}
    if(kind==='ground'&&(resource==='sticks'||resource==='wood')){
      const image=canvas(64,66),c=image.getContext('2d');
      sceneryPolygon(c,[[17,51],[19,46],[29,37],[28,30],[31,29],[33,34],[42,25],[46,24],[47,28],[37,39],[44,38],[45,41],[34,43],[23,55],[19,56]],'#514b3b');
      sceneryPolygon(c,[[19,51],[32,37],[43,27],[45,27],[32,41],[22,53]],'#b18c58');
      sceneryPolygon(c,[[20,49],[32,35],[43,26],[43,28],[31,39],[20,52]],'#debb7f');rect(c,29,32,2,6,'#a47a4b');rect(c,37,40,5,1,'#debb7f');
      return {image,ax:32,ay:55,crispOutline:true};
    }
    if(kind!=='tree'&&kind!=='bush'){
      const sprite=super.makeResource(kind,biome,resource,variant);
      if(kind==='rock'||kind==='ore'){
        const c=sprite.image.getContext('2d');
        for(let i=0;i<16;i++){const x=17+Math.floor(grain(i,variant+5)*32),y=35+Math.floor(grain(variant+5,i)*15);rect(c,x,y,2+(i%3),2,i%3?'#d3e1d02b':'#384f6738');}
        if(kind==='ore'){const color=MATERIAL_COLORS[resource]||'#d6dbea';for(let i=0;i<5;i++)rect(c,18+i*7,42+(i%2)*6,4,3,color);}
      }
      return sprite;
    }
    const tree=kind==='tree',image=canvas(tree?112:64,tree?148:66),c=image.getContext('2d');
    let p=palettes[biome]||palettes.heartlands;
    if(['heartlands','woodland'].includes(biome)&&variant>=8)p=variant%2?['#6f5e38','#aa793e','#d9a44e','#f4cf77']:['#285c61','#367e75','#62ab85','#a1d4a0'];
    const crown=(x,y,rx,ry,seed)=>leafMass(c,x,y,rx,ry,p,seed);
    if(tree){
      const form=variant%4,bark=biome==='tundra'?['#687663','#b5b394','#d2d0ab']:['#71513a','#a67a48','#c89c5e'];
      // A clear trunk and restrained foliage leave open air between trees.
      sceneryPolygon(c,[[52,132],[48,138],[55,136],[59,137],[67,138],[62,130],[61,63],[57,43],[53,59]],bark[0]);
      rect(c,53,43,8,91,bark[0]);rect(c,54,48,3,84,bark[1]);rect(c,54,53,1,70,bark[2]);
      rect(c,52,111,9,23,bark[0]);rect(c,53,111,3,23,bark[1]);
      for(let i=0;i<6;i++){const y=62+i*11;rect(c,58,y,2,3,bark[0]);if(i%2===0)rect(c,54,y+6,2,2,bark[2]);}
      // Short upward branches and stepped roots, rather than a rectangular base.
      rect(c,46,82,8,3,bark[0]);rect(c,44,76,3,8,bark[0]);rect(c,44,76,1,5,bark[1]);
      rect(c,60,99,8,3,bark[0]);rect(c,66,92,3,9,bark[0]);rect(c,67,93,1,6,bark[1]);
      rect(c,51,130,12,5,bark[0]);rect(c,48,134,6,3,bark[0]);rect(c,61,133,5,3,bark[0]);rect(c,46,136,6,2,bark[0]);rect(c,65,136,3,2,bark[0]);rect(c,52,131,3,4,bark[1]);
      const leaves=(x,y,rx,ry,seed)=>leafMass(c,x,y,rx,ry,p,seed);
      if(form===0){
        // Open, compact pine boughs above a visible lower trunk.
        for(let i=4;i>=0;i--){const y=16+i*13,w=9+i*4;for(let row=0;row<23;row+=2){const half=Math.round(w*row/23);rect(c,56-half,y+row,half*2,2,row>17?p[0]:p[1]);}for(let j=0;j<6;j++)rect(c,48+j*3,y+16+(j%2)*2,3,1,p[2]);}
      }else{
        const rx=form===1?29:form===2?23:27,ry=form===1?23:form===2?28:25;
        // Branch-supported, overlapping foliage gives broadleaf trees real volume.
        sceneryPolygon(c,[[54,81],[36,57],[30,51],[33,48],[47,58],[57,66],[73,47],[78,40],[80,44],[68,65],[60,76]],bark[0]);
        sceneryPolygon(c,[[55,71],[35,51],[37,51],[55,66],[74,46],[74,49],[60,72]],bark[1]);
        leaves(38,47,Math.round(rx*.7),Math.round(ry*.8),variant+3);
        leaves(74,43,Math.round(rx*.8),Math.round(ry*.9),variant+5);
        leaves(54,29,Math.round(rx*.85),ry,variant+7);
        leaves(57,53,Math.round(rx*.75),Math.round(ry*.65),variant+9);
        if(form===2)leaves(45,82,10,8,variant+17);
        else if(form===3)leaves(68,91,7,6,variant+19);
        if(biome==='marsh')for(let i=0;i<4;i++){const x=37+i*12;rect(c,x,52,1,11+(i%2)*7,p[1]);rect(c,x-1,60,2,3,p[2]);}
      }
    }else{
      const form=variant%4;
      if(form===0){crown(18,43,16,10,variant);crown(41,42,19,12,variant+3);}
      else if(form===1){rect(c,30,37,4,17,'#99734e');crown(32,32,22,20,variant);}
      else if(form===2){for(let i=0;i<5;i++){rect(c,12+i*9,31+(i%2)*5,3,23-(i%2)*5,p[0]);crown(13+i*9,30+(i%2)*7,8,15,variant+i);}}
      else{crown(20,39,17,14,variant);crown(41,35,18,17,variant+3);}
      if(form!==2)for(let i=0;i<5;i++){const x=12+i*9,y=32+(i%2)*11;rect(c,x,y,4,4,form===0?'#e698bd':form===1?'#f3c768':'#90c8f0');if(form===0)rect(c,x+1,y+1,2,2,'#fff2bf');}
    }
    if(!tree){const crop=CROPS.find(c=>c.id===resource);if(crop){
      if(['cactusFruit','bogRice','forestMushroom'].includes(crop.id))c.clearRect(0,0,64,66);
      if(crop.id==='cactusFruit'){rect(c,27,12,11,43,'#48965f');rect(c,14,27,14,7,'#48965f');rect(c,14,20,6,12,'#6ab771');rect(c,37,34,15,7,'#48965f');rect(c,46,24,6,14,'#6ab771');rect(c,30,15,3,35,'#8ec781');rect(c,27,9,10,7,crop.color);rect(c,46,21,7,6,crop.color);}
      else if(crop.id==='forestMushroom'){for(let i=0;i<3;i++)sceneryMushroom(c,15+i*14,32+(i%2)*5,.9,crop.color);}
      else if(crop.id==='bogRice'){for(let i=0;i<5;i++){rect(c,10+i*10,22+(i%2)*6,2,33-(i%2)*6,'#6d9b5b');for(let j=0;j<4;j++)rect(c,7+i*10+(j%2)*4,18+j*5+(i%2)*6,4,3,crop.color);}}
      else for(let i=0;i<4;i++){const x=13+i*10,y=30+(i%2)*10;if(crop.id==='sunMelon')ellipse(c,x,y,7,5,crop.color);else{rect(c,x,y,5,5,crop.color);rect(c,x,y,2,2,'#ffe7b8');}}
    }}
    return {image,ax:tree?56:32,ay:tree?138:55,crispOutline:true};
  }
  creature(ctx,m,time){drawMob(this,ctx,m,time);}
  decoration(ctx,d){
    if(!['crystal','mushroom','ash','bone'].includes(d.kind))return super.decoration(ctx,d);
    const variant=Math.floor(grain(d.x,d.y)*7),sprite=this.sprite(`polished-decor:${d.kind}:${variant}`,()=>{
      const image=canvas(44,52),c=image.getContext('2d');
      const polygon=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();};
      if(d.kind==='crystal'){
        for(let i=0;i<3;i++){const x=4+i*12,top=16-i*5,p=['#77bfcb','#afa2da','#d49cce'][i];
          polygon([[x,46],[x-1,top+9],[x+5,top],[x+11,top+10],[x+10,46]],'#4f637d');
          polygon([[x+1,44],[x+1,top+9],[x+5,top+2],[x+9,top+11],[x+8,44]],p);
          polygon([[x+5,top+2],[x+9,top+11],[x+6,42]],['#4e93ad','#7b72ad','#a06ea9'][i]);
          polygon([[x+1,top+9],[x+5,top+2],[x+4,39]],'#e5f3e1');rect(c,x+2,top+12,1,8,'#f4fff0');rect(c,x+2,44,6,1,'#bfe0df');
        }rect(c,3,47,37,2,'#526278');
      }else if(d.kind==='mushroom'){
        sceneryMushroom(c,12,26,1,'#91ad75');sceneryMushroom(c,31,19,1,'#bb7881');
      }else if(d.kind==='bone'){
        c.strokeStyle='#9c8e7d';c.lineWidth=6;c.beginPath();c.moveTo(8,43);c.lineTo(32,22);c.stroke();c.strokeStyle='#eadcb5';c.lineWidth=4;c.stroke();for(const [x,y] of [[6,42],[11,46],[30,19],[35,23]]){ellipse(c,x,y,3,3,'#f6e9c8');rect(c,x-1,y-2,2,1,'#fff6db');}
      }else{for(let i=0;i<5;i++){polygon([[5+i*7,46],[7+i*7,36-i%2*7],[13+i*7,37],[17+i*7,46]],i%2?'#7c6e89':'#635e73');rect(c,8+i*7,37,3,1,'#ac91ac');}}
      return {image,ax:22,ay:49,crispOutline:true};
    });this.draw(ctx,sprite,d.x,d.y,1.4);
  }
  hut(ctx,h,index){
    const sprite=this.sprite(`adventure-hut:${index%3}`,()=>{
      const image=canvas(150,145),c=image.getContext('2d');
      rect(c,24,77,102,45,'#98714e');rect(c,28,84,94,34,'#ceab72');
      for(let i=0;i<7;i++){rect(c,28+i*14,83,4,35,'#825e43');rect(c,30+i*14,86,2,29,'#b58c5b');}
      const roofColors=[['#bf9657','#d6b06b'],['#918166','#c4b08c'],['#a7794a','#caa768']][index%3];
      for(let y=index%3===1?35:15;y<91;y+=3){const w=index%3===1?Math.floor(42+(y-35)*.35):Math.floor((y-10)*(index%3===2?.77:.83));rect(c,75-w,y,w*2,3,roofColors[y%2]);}
      if(index%3===1){rect(c,105,22,10,25,'#7c8c8e');rect(c,103,21,14,4,'#b6c1af');}
      if(index%3!==0){rect(c,34,96,14,16,'#507366');rect(c,36,98,10,11,'#eed093');rect(c,40,98,2,11,'#967449');rect(c,96,96,14,16,'#507366');rect(c,98,98,10,11,'#eed093');}

      // Roof courses, timber joints, and recessed windows make the shelter
      // follow the same layered material treatment as equipment.
      for(let row=0;row<6;row++){const y=47+row*7,left=75-(y-10)*.75,right=75+(y-10)*.75;for(let x=Math.ceil(left/14)*14+(row%2)*7;x<right-8;x+=14){rect(c,x,y,9,1,'#f0c68666');rect(c,x+10,y+1,1,4,'#694f3844');}}
      for(const x of [28,116]){rect(c,x,84,5,34,'#634b39');rect(c,x+1,85,1,31,'#e2c28b');rect(c,x,89,4,2,'#4c4536');rect(c,x,112,4,2,'#4c4536');}
      for(const x of [34,96]){rect(c,x-2,113,19,3,'#654c39');rect(c,x-1,113,17,1,'#e6c58b');rect(c,x+2,98,3,8,'#fff1ba55');rect(c,x+5,105,5,3,'#ac906366');}
      rect(c,13,88,124,7,'#7f6043');rect(c,57,93,36,29,'#70513b');rect(c,63,95,24,27,'#304b46');rect(c,67,94,4,28,'#b59b6a');rect(c,58,120,34,4,'#d6bb83');rect(c,55,124,41,3,'#68766b');rect(c,57,124,37,1,'#b8c4aa');
      return {image,ax:75,ay:122};
    });this.shadow(ctx,h.x,h.y,h.r*.7);this.draw(ctx,sprite,h.x,h.y,1.85);
  }
  player(ctx,p,inventory,time,fishing){
    if(p.flightHeight){this.shadow(ctx,p.x,p.y,18);p={...p,jumpHeight:(p.jumpHeight||0)+p.flightHeight,airborne:true,moving:false};}
    if(p.swimming){this.drawSwimmer(ctx,p,inventory,time);return;}
    const back=Math.sin(p.facing)<-.45,side=Math.abs(Math.cos(p.facing))>.7,step=p.moving?[0,1,0,-1][Math.floor(time/145)%4]:0,armor=inventory.equippedGear?.tier,style=p.appearance||{},tool=fishing?.active?fishing.tool:inventory.equippedTool?.type==='transport'?null:inventory.equippedTool;
    const pose=playerArmPose(p,time,tool?.type,fishing);
    const sprite=this.sprite(`adventurer:${back}:${side}:${step}:${armor}:${style.id||'player'}:${style.hairStyle||''}`,()=>{
      const hair=style.hair||'#634b39',ap=equipmentPalette(armor);
      const image=canvas(44,66),c=image.getContext('2d'),skin=style.skin||'#e4ad80',skinLight=style.skinLight||'#f2c495',skinShade=style.skinShade||'#c68c65',shirt=style.shirt||MATERIAL_COLORS[armor]||({leaf:'#71ae65',wood:'#b78858',iron:'#9bbec9',stone:'#9caeb0',copper:'#d7966b',quartz:'#a8d9dc',amber:'#ddb865',obsidian:'#9a81b6',moonstone:'#cbb3e0'}[armor])||'#bd8056';
      // Small stepped contours and broad color planes keep the figure readable at game zoom.
      for(const [x,stride] of [[side?16:14,step],[25,-step]]){
        if(side){
          const leg=stride*6,kneeX=x+leg*.5,footX=x+leg;
          for(let row=0;row<8;row++)rect(c,x+leg*.5*row/8,47+row,6,1,'#626566');
          for(let row=0;row<7;row++)rect(c,kneeX+leg*.5*row/7,54+row-Math.max(0,-stride)*2,5,1,'#7c7f76');
          rect(c,footX-1,59-Math.max(0,-stride)*2,10,3,'#354951');
          if(armor){for(let row=0;row<7;row++){const lx=Math.round(kneeX+leg*.5*row/7),ly=54+row-Math.max(0,-stride)*2;rect(c,lx,ly,5,1,ap.shade);rect(c,lx+1,ly,2,1,ap.base);}rect(c,footX-1,59-Math.max(0,-stride)*2,8,2,ap.base);rect(c,kneeX,53,5,2,ap.edge);}continue;
        }
        rect(c,x,45,6,11,'#626566');rect(c,x+1,49,3,7,'#7c7f76');
        rect(c,x+1,55+stride,5,4,'#545d61');
        rect(c,x-1,58+stride,9,3,'#354951');rect(c,x-2,60+stride,10,1,'#2e4148');
        rect(c,x,58+stride,5,1,'#80918b');
        if(armor){rect(c,x,52+stride,6,7,ap.shade);rect(c,x+1,53+stride,3,6,ap.base);rect(c,x,52+stride,5,1,ap.edge);rect(c,x-1,59+stride,8,2,ap.base);}
      }
      rect(c,18,23,9,6,skinShade);rect(c,19,24,6,4,skin);
      const bodyX=side?14:13,bodyW=side?17:18;
      rect(c,bodyX+2,27,bodyW-4,3,shirt);rect(c,bodyX,30,bodyW,7,shirt);rect(c,bodyX+1,37,bodyW-2,8,shirt);rect(c,bodyX,43,bodyW,4,shirt);
      rect(c,bodyX+1,31,3,11,'#ffffff19');rect(c,bodyX+bodyW-3,32,2,11,'#243e3926');
      if(side){
        // The shaded flank and curved front edge suggest a slight turn, not a flat front view.
        rect(c,14,31,5,13,'#263d393b');rect(c,18,32,1,11,'#e7bc8038');
        rect(c,15,44,4,3,'#263d393b');rect(c,19,28,9,2,'#ffffff12');
      }
      rect(c,18,28,9,2,'#805b43');rect(c,20,29,5,1,'#dfb383');
      if(armor){
        rect(c,bodyX-1,29,5,4,shirt);rect(c,bodyX+bodyW-3,29,5,4,shirt);
        rect(c,side?20:17,33,side?7:10,9,'#ffffff20');rect(c,side?21:18,33,side?5:8,1,'#ffffff40');
        rect(c,side?24:21,34,2,8,'#30443d22');
        const {depth,biome}=equipmentStyle(armor);
        const cx=side?24:22;
        if(armor==='wood'){for(let x=bodyX+2;x<bodyX+bodyW-2;x+=3)rect(c,x,33,2,12,'#e3b67b');rect(c,bodyX+1,38,bodyW-2,2,'#73543c');}
        if(armor==='stone'){for(let y=33;y<44;y+=5){rect(c,bodyX+2,y,6,4,'#c4d0c2');rect(c,bodyX+9,y,6,4,'#809397');}}
        if(armor==='leaf'){for(let y=33;y<43;y+=4){rect(c,cx-4,y,4,2,'#9ecb7b');rect(c,cx,y+1,4,2,'#44734f');}}
        if(depth>=2){rect(c,bodyX-2,28,6,6,shirt);rect(c,bodyX+bodyW-4,28,6,6,shirt);rect(c,bodyX-2,28,6,1,'#d9dcc080');rect(c,bodyX+bodyW-4,28,6,1,'#d9dcc080');}
        if(depth===1)for(let y=35;y<44;y+=3)rect(c,side?21:17,y,side?7:11,1,'#30443d55');
        if(depth===2){rect(c,cx-4,34,8,3,'#ecedcb60');rect(c,cx-3,38,6,5,'#31424a44');}
        if(depth===3){for(let y=0;y<9;y++)rect(c,cx-Math.min(y,8-y)/2,33+y,Math.min(y,8-y)+1,1,'#edfbd790');}
        if(depth>=4){rect(c,cx-5,35,3,9,'#2d394855');rect(c,cx+3,35,3,9,'#2d394855');rect(c,cx-2,35,4,6,'#edfbd780');}
        if(depth>=5){rect(c,bodyX-3,26,5,3,shirt);rect(c,bodyX+bodyW-2,26,5,3,shirt);rect(c,bodyX+2,44,bodyW-4,3,'#31424a70');}
        if(depth===6){rect(c,bodyX-3,24,3,4,'#fff0bd');rect(c,bodyX+bodyW,24,3,4,'#fff0bd');rect(c,cx-1,33,2,12,'#fff3c3');}
        if(biome==='woodland'){rect(c,cx-3,38,3,2,'#345e4655');rect(c,cx,39,3,2,'#345e4655');}
        if(biome==='tundra')rect(c,cx-1,38,2,4,'#f3fbef');
        if(biome==='volcanic'){rect(c,cx-2,39,2,4,'#ffae66');rect(c,cx,37,2,5,'#ffe0a0');}
      }else{
        // A hide tunic, rather than a flat square shirt.
        for(let i=0;i<13;i++)rect(c,bodyX+(side?6:2)+Math.floor(i*(side?.4:.6)),29+i,2,2,'#e7bc80');
        rect(c,bodyX+3,42,3,3,'#d69b65');rect(c,bodyX+bodyW-6,43,4,2,'#9b684c');
      }
      if(style.patched){rect(c,bodyX+3,34,5,6,'#b1a180');rect(c,bodyX+3,34,5,1,'#4d5046');rect(c,bodyX+bodyW-5,41,3,5,skinShade);rect(c,bodyX+2,43,2,3,'#42483e');}
      rect(c,bodyX+1,46,bodyW-2,3,'#795c47');rect(c,bodyX+1,46,bodyW-2,1,'#a48156');rect(c,side?25:22,46,3,3,'#e0bd76');
      if(armor){for(const tx of [bodyX+1,bodyX+bodyW-6]){rect(c,tx,49,5,4,ap.shade);rect(c,tx,49,4,2,ap.base);rect(c,tx,49,4,1,ap.edge);}rect(c,bodyX+4,28,bodyW-8,2,ap.shade);}
      // Cheeks, ears and a tapered jaw soften the old rectangular head.
      rect(c,15,9,15,3,skin);rect(c,13,12,19,9,skin);rect(c,14,21,17,3,skin);rect(c,17,24,11,2,skinShade);
      rect(c,11,16,3,4,skinShade);rect(c,12,16,2,3,skin);rect(c,31,16,3,4,skinShade);
      rect(c,14,12,3,9,skinLight);rect(c,29,13,2,10,skinShade);
      drawNpcHair(c,style,back,side);
      const eyeY=back?14:15,pupilY=back?eyeY:eyeY+1,pupilShift=side?3:2;
      if(!back){
        for(const eyeX of [15,24]){if(style.sleeping){rect(c,eyeX,eyeY+2,6,1,skinShade);}else{rect(c,eyeX,eyeY-2,6,1,'#805b43');rect(c,eyeX,eyeY,6,5,'#fff1d5');rect(c,eyeX+pupilShift,pupilY,2,3,'#354950');}}
        rect(c,22,20,2,2,skinShade);rect(c,21,20,1,1,skinLight);
        rect(c,19,23,7,1,'#9d684b');rect(c,20,24,5,1,'#f0bb8d');
      }
      if(style.wideJaw){rect(c,13,21,3,3,skin);rect(c,29,21,3,3,skinShade);}
      if(!back&&style.beard){rect(c,16,22,14,4,hair);rect(c,19,26,8,2,hair);rect(c,19,23,7,1,skinShade);}
      if(armor){rect(c,13,10,19,3,ap.shade);rect(c,14,10,17,2,ap.base);rect(c,15,10,15,1,ap.edge);rect(c,12,13,3,8,ap.shade);rect(c,31,13,2,8,ap.base);if(back){rect(c,14,12,17,10,ap.shade);rect(c,15,12,14,8,ap.base);rect(c,16,12,2,7,ap.edge);}else{rect(c,21,10,3,3,ap.edge);}}
      if(!back&&style.freckles){rect(c,15,21,2,1,skinShade);rect(c,28,21,2,1,skinShade);}
      return {image,ax:22,ay:61};
    });
    if(!p.swimBody&&!p.airborne)this.shadow(ctx,p.x,p.y,23);
    if(back&&tool)this.drawHeldTool(ctx,p,tool,time,fishing,pose);
    if(!p.swimBody)this.drawPlayerArms(ctx,p,pose,true,armor);
    this.draw(ctx,sprite,p.x,p.y-(p.jumpHeight||0),1.65,1,pose.flip);
    if(!p.swimBody)this.drawPlayerArms(ctx,p,pose,false,armor);
    if(tool&&!back)this.drawHeldTool(ctx,p,tool,time,fishing,pose);
  }
  drawPlayerArms(ctx,p,pose,behind,armor){
    const arms=pose.arms.filter(arm=>(pose.back||arm.far)===behind);
    if(!arms.length)return;
    const key=arms.flatMap(arm=>[arm.shoulder.x,arm.elbow.x,arm.elbow.y,arm.hand.x,arm.hand.y,arm.far?1:0].map(Math.round)).join(':');
    const sprite=this.sprite(`layered-arms:${armor}:${key}:${p.appearance?.id||'player'}`,()=>{
      const image=canvas(52,66),c=image.getContext('2d');for(const arm of arms)this.drawArm(c,{...arm,appearance:p.appearance,armor});return {image,ax:22,ay:61};
    });this.draw(ctx,sprite,p.x,p.y-(p.jumpHeight||0),1.65,1,pose.flip);
  }
  drawSwimmer(ctx,p,inventory,time){
    // Keep the normal upright head and torso. Only the joints, kicks, and waterline animate.
    const phase=p.moving?Math.floor(time/110)%8:Math.floor(time/240)%8;
    const side=Math.abs(Math.cos(p.facing))>.7,back=Math.sin(p.facing)<-.45,flip=Math.cos(p.facing)<-.7;
    const bob=[0,0,1,1,0,0,-1,-1][phase],bodyY=p.y+(p.underwater?0:28)+bob,waterline=p.y+(p.underwater?40:-6);
    const kicks=this.sprite(`swim-kicks:${phase}`,()=>{
      const image=canvas(44,66),c=image.getContext('2d');
      for(let i=0;i<2;i++){
        const kick=[0,1,2,1,0,-1,-2,-1][(phase+i*4)%8],x=i?26:16;
        rect(c,x,46,6,8,'#58767c');rect(c,x+kick,54,6,5,'#58767c');rect(c,x+kick-1,59,8,2,'#6d969e');
      }
      return {image,ax:22,ay:61};
    });this.draw(ctx,kicks,p.x,bodyY,1.65,.3,flip);
    ctx.save();ctx.beginPath();ctx.rect(p.x-90,p.y-200,180,p.underwater?266:194);ctx.clip();
    this.player(ctx,{...p,y:bodyY,swimming:false,swimBody:true,moving:false,jumpHeight:0,swingUntil:0},{...inventory,equippedTool:null},time);
    ctx.restore();
    const arms=this.sprite(`swim-arms:${inventory.equippedGear?.tier}:${phase}:${side}:${back}`,()=>{
      const image=canvas(52,66),c=image.getContext('2d');
      for(let i=0;i<2;i++){
        const stroke=(phase+i*4)%8,reach=[-1,-3,-5,-3,0,2,3,1][stroke];
        const x=(side?[15,29]:[11.5,32.5])[i],sign=i?1:-1;
        const elbow={x:x+sign*(side?2:4),y:35+reach*.4};
        const hand={x:elbow.x+sign*(side?3:4),y:39+reach};
        this.drawArm(c,{shoulder:{x,y:31},elbow,hand,far:side&&i===0,appearance:p.appearance,armor:inventory.equippedGear?.tier});
      }
      return {image,ax:22,ay:61};
    });
    ctx.save();ctx.beginPath();ctx.rect(p.x-90,p.y-200,180,p.underwater?266:194);ctx.clip();this.draw(ctx,arms,p.x,bodyY,1.65,1,flip);ctx.restore();
    if(p.underwater&&inventory.equippedTool&&inventory.equippedTool.type!=='transport')this.drawHeldTool(ctx,p,inventory.equippedTool,time,null,playerArmPose(p,time,inventory.equippedTool.type));
    // Small stationary ripple masks break around the moving shoulders, not a rotating body.
    ctx.save();ctx.fillStyle='#a6e4e7';ctx.globalAlpha=.7;
    rect(ctx,p.x-25,waterline,14,2);rect(ctx,p.x+10,waterline+2,14,2);
    if(p.moving){const offset=[0,2,4,2,0,-2,-4,-2][phase];rect(ctx,p.x-32-offset,waterline+8,8,2);rect(ctx,p.x+25+offset,waterline+7,8,2);}
    ctx.restore();
  }
  drawHeldTool(ctx,p,tool,time,fishing,pose){
      const recipe=equipmentRecipe(toolRecipes.get(tool.id),tool);
      if(!recipe)return;
      this.heldImages??=new Map();
      let image=this.heldImages.get(`${recipe.id}:${tool.bowLevel||0}:${tool.fishingUpgradeLevel||0}`);
      if(!image){image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(itemSvg(recipe,{background:false}))}`;this.heldImages.set(`${recipe.id}:${tool.bowLevel||0}:${tool.fishingUpgradeLevel||0}`,image);}
      if(!image.complete||!image.naturalWidth)return;
      const held=heldToolPose(p,time,recipe.type,fishing,pose);if(tool.id==='powered-drill'||tool.id==='grappling-tool')held.grip={x:24/96,y:78/96};
      ctx.save();ctx.translate(p.x,p.y-(p.jumpHeight||0));ctx.scale(held.flip?-held.scale:held.scale,held.scale/CAMERA_TILT);ctx.translate(held.x,held.y);ctx.rotate(held.angle);
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(image,-held.size*held.grip.x,-held.size*held.grip.y,held.size,held.size);
      rect(ctx,-2,-1,4,3,'#e4ad80');rect(ctx,-1,-1,2,1,'#f2c495');
      ctx.restore();
  }
  drawArm(ctx,{shoulder,elbow,hand,far=false,appearance,armor}){
    const skin=appearance?.skin||(far?'#ce986f':'#e4ad80'),light=appearance?.skinLight||(far?'#e0ae80':'#f2c495');
    for(const [segment,[a,b]] of [[shoulder,elbow],[elbow,hand]].entries()){
      const rows=Math.max(1,Math.ceil(Math.abs(b.y-a.y)));
      for(let i=0;i<=rows;i++){
        const t=i/rows,x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t);
        const width=far?4:segment===0?6:5;
        rect(ctx,x-Math.ceil(width/2),y,width,1,'#805f48');rect(ctx,x-2,y,far?3:4,1,skin);rect(ctx,x-2,y,1,1,light);
      }
    }
    // A small elbow shadow and forearm highlight distinguish the two segments.
    rect(ctx,elbow.x,elbow.y,2,2,far?'#b37d59':'#c68c65');
    if(armor){const a=equipmentPalette(armor);for(const [start,end,from,to] of [[shoulder,elbow,0,.4],[elbow,hand,.3,.85]]){for(let i=0;i<=8;i++){const t=from+(to-from)*i/8,x=Math.round(start.x+(end.x-start.x)*t),y=Math.round(start.y+(end.y-start.y)*t);rect(ctx,x-3,y,far?5:7,2,a.shade);rect(ctx,x-2,y,far?3:5,1,a.base);rect(ctx,x-2,y,1,1,a.edge);}}}
    rect(ctx,hand.x-2,hand.y-1,4,3,skin);rect(ctx,hand.x-1,hand.y-1,2,1,light);
  }
  fishingRodTip(p,fishing,time=0){return fishingRodTipWorld(p,time,fishing);}
}
