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
    for(let i=0;i<70;i++){const x=Math.floor(grain(gx*71+i,gy)*254),y=Math.floor(grain(gy*71+i,gx)*254);const color=layer==='surface'?'#537f4930':'#c4bada25';rect(c,x,y,2,1,color);if(i%3===0)rect(c,x+1,y-2,1,3,color);}
    return image;
  }
  makeResource(kind,biome,resource,variant){
    if(kind==='rock'||kind==='ore'){
      const image=canvas(64,66),c=image.getContext('2d'),form=variant%4;
      const stone=({tundra:['#607f96','#b9d8df','#87a9bc'],marsh:['#526c62','#9cb89a','#718e79'],badlands:['#95684f','#e5be84','#be9162'],volcanic:['#504960','#a39aba','#756a8d']})[biome]||['#536b7c','#b3c8c8','#829ba5'];
      const facet=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
      if(form===0){facet([[8,49],[14,28],[31,18],[49,25],[57,48],[43,56],[20,55]],stone[0]);facet([[14,28],[31,18],[49,25],[37,39],[17,42]],stone[1]);facet([[17,42],[37,39],[43,56],[20,55]],stone[2]);}
      else if(form===1){facet([[8,49],[12,39],[27,31],[49,33],[58,46],[51,55],[18,56]],stone[0]);facet([[12,39],[27,31],[49,33],[53,42],[24,46]],stone[1]);facet([[12,46],[24,46],[51,44],[51,51],[18,53]],stone[2]);}
      else if(form===2){facet([[16,55],[13,39],[22,12],[36,9],[48,25],[47,53]],stone[0]);facet([[22,12],[36,9],[38,35],[20,42]],stone[1]);facet([[20,42],[38,35],[34,54],[16,55]],stone[2]);rect(c,27,28,3,13,stone[0]);}
      else{for(const [x,y,s] of [[9,42,19],[29,29,25],[41,45,16]]){facet([[x,y+10],[x+3,y-4],[x+s-5,y-7],[x+s,y+8],[x+s-6,y+13]],stone[0]);facet([[x+3,y-4],[x+s-5,y-7],[x+s-3,y+2],[x+5,y+5]],stone[1]);}}
      if(kind==='ore'){const color=MATERIAL_COLORS[resource]||'#d6dbea';for(let i=0;i<4;i++){const x=20+i*7,y=35+(i%2)*8;rect(c,x,y,5,7,color);rect(c,x,y,2,3,'#fff5df');}}
      else if((biome==='woodland'||biome==='marsh')&&variant%3===0){rect(c,17,39,13,4,'#6eaa69');rect(c,23,36,8,4,'#97c477');}
      return {image,ax:32,ay:55};
    }
    if(kind==='ground'&&(resource==='sticks'||resource==='wood')){
      const image=canvas(192,198),c=image.getContext('2d');c.scale(3,3);
      c.lineCap='round';c.lineJoin='round';
      const line=(points,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);for(const point of points.slice(1))c.lineTo(...point);c.stroke();};
      line([[20,53],[43,30]],'#936642',5);line([[20,51],[41,30]],'#dab17a',1.5);
      line([[29,44],[27,38]],'#936642',2);line([[37,36],[43,36]],'#936642',2);
      return {image,ax:32,ay:55,resolution:3,smooth:true};
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
    const crown=(x,y,rx,ry,seed)=>{
      ellipse(c,x,y,rx,ry,p[0]);ellipse(c,x-2,y-4,rx-2,ry-3,p[1]);ellipse(c,x-5,y-8,rx-7,ry-8,p[2]);
      for(let i=0;i<18;i++){const a=grain(i,seed)*Math.PI*2,r=grain(seed,i)*.82,px=x+Math.cos(a)*rx*r,py=y+Math.sin(a)*ry*r;rect(c,px,py,4,2,i%4===0?p[3]:p[2]);}
    };
    if(tree){
      const form=variant%4,bark=biome==='tundra'?['#687663','#b5b394','#d2d0ab']:['#71513a','#a67a48','#c89c5e'];
      // A clear trunk and restrained foliage leave open air between trees.
      rect(c,53,43,8,91,bark[0]);rect(c,54,48,3,84,bark[1]);rect(c,54,53,1,70,bark[2]);
      rect(c,52,111,9,23,bark[0]);rect(c,53,111,3,23,bark[1]);
      for(let i=0;i<6;i++){const y=62+i*11;rect(c,58,y,2,3,bark[0]);if(i%2===0)rect(c,54,y+6,2,2,bark[2]);}
      // Short upward branches and stepped roots, rather than a rectangular base.
      rect(c,46,82,8,3,bark[0]);rect(c,44,76,3,8,bark[0]);rect(c,44,76,1,5,bark[1]);
      rect(c,60,99,8,3,bark[0]);rect(c,66,92,3,9,bark[0]);rect(c,67,93,1,6,bark[1]);
      rect(c,51,130,12,5,bark[0]);rect(c,48,134,6,3,bark[0]);rect(c,61,133,5,3,bark[0]);rect(c,46,136,6,2,bark[0]);rect(c,65,136,3,2,bark[0]);rect(c,52,131,3,4,bark[1]);
      const leaves=(x,y,rx,ry,seed)=>{
        // Small overlapping leaf masses form a single uneven crown, with quiet dappled shading.
        for(const [dx,dy,sx,sy] of [[-rx*.52,3,.56,.65],[rx*.48,1,.58,.68],[0,-ry*.36,.75,.72],[0,ry*.25,.7,.62]])ellipse(c,x+dx,y+dy,Math.round(rx*sx),Math.round(ry*sy),p[0]);
        ellipse(c,x-1,y-2,rx-3,ry-3,p[1]);ellipse(c,x-4,y-5,rx-7,ry-7,p[2]);
        for(let i=0;i<38;i++){
          const px=Math.round(x+(grain(i,seed,17)-.5)*rx*1.65),py=Math.round(y+(grain(seed,i,19)-.5)*ry*1.6);
          if(((px-x)/rx)**2+((py-y)/ry)**2>.78)continue;
          rect(c,px,py,2+(i%2),1+(i%3===0?1:0),i%7===0?p[3]:i%3===0?p[0]:p[1]);
        }
      };
      if(form===0){
        // Open, compact pine boughs above a visible lower trunk.
        for(let i=4;i>=0;i--){const y=16+i*13,w=9+i*4;for(let row=0;row<23;row+=2){const half=Math.round(w*row/23);rect(c,56-half,y+row,half*2,2,row>17?p[0]:p[1]);}for(let j=0;j<6;j++)rect(c,48+j*3,y+16+(j%2)*2,3,1,p[2]);}
      }else{
        const rx=form===1?29:form===2?23:27,ry=form===1?23:form===2?28:25;
        leaves(56,35,rx,ry,variant+7);
        if(form===2)leaves(45,82,7,7,variant+17);
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
    return {image,ax:tree?56:32,ay:tree?138:55};
  }
  creature(ctx,m,time){
    if(!['fox','boar','tortoise','caveSlime','crystalBeetle','emberGolem','snowHare','marshCrane','sandLizard','frostWisp','mireLeech','ashMite'].includes(m.kind))return super.creature(ctx,m,time);
    const facing=Math.cos(m.facing);if(facing<-.4)m.visualFlip=true;else if(facing>.4)m.visualFlip=false;
    const sprite=this.sprite(`wildlife:${m.kind}:${m.shiny}`,()=>{
      const image=canvas(96,88),c=image.getContext('2d'),body=m.shiny?'#c39bec':({fox:'#df9354',boar:'#9f7760',tortoise:'#70a279',caveSlime:'#7bc4ae',crystalBeetle:'#7299bc',emberGolem:'#847591'})[m.kind];
      if(m.kind==='snowHare'){
        const fur=m.shiny?'#e7baff':'#f2f1db';rect(c,31,13,8,24,fur);rect(c,46,8,8,28,fur);rect(c,34,17,3,15,'#eaa5b2');rect(c,49,12,3,17,'#eaa5b2');ellipse(c,43,52,25,15,fur);ellipse(c,63,41,15,14,fur);rect(c,69,38,4,4,'#365065');rect(c,23,62,14,6,'#cfd4d0');rect(c,54,63,16,6,'#cfd4d0');rect(c,17,46,12,12,fur);
      }else if(m.kind==='marshCrane'){
        const plumage=m.shiny?'#dcc2f3':'#d8e7d8';rect(c,35,53,5,26,'#a76758');rect(c,55,54,5,25,'#a76758');ellipse(c,42,47,24,17,plumage);rect(c,62,21,8,29,plumage);ellipse(c,67,21,10,9,plumage);rect(c,76,20,14,4,'#e6bc6c');rect(c,69,17,3,3,'#33484b');rect(c,24,44,25,9,'#86b5a0');
      }else if(m.kind==='sandLizard'){
        const hide=m.shiny?'#d6a5e7':'#d0a46c';ellipse(c,45,52,31,15,hide);ellipse(c,74,47,14,11,hide);rect(c,84,45,9,4,'#e8cb8e');rect(c,76,42,3,3,'#405050');for(const x of [27,58]){rect(c,x,61,9,8,'#9f765b');rect(c,x+7,33,5,10,'#e7c48c');}rect(c,4,49,18,6,'#b18560');rect(c,0,52,13,4,'#b18560');for(let i=0;i<6;i++)rect(c,28+i*8,46,4,4,'#e8c989');
      }else if(m.kind==='frostWisp'){
        const glow=m.shiny?'#ead1ff':'#9de5ee';ellipse(c,47,46,22,23,'#507b8a');ellipse(c,47,39,18,19,glow);rect(c,39,38,5,5,'#326375');rect(c,53,38,5,5,'#326375');for(const x of [27,40,54,66])rect(c,x,63+(x%3)*3,7,11,glow);rect(c,45,8,4,12,'#f0fbf1');rect(c,39,12,16,4,'#f0fbf1');
      }else if(m.kind==='mireLeech'){
        const skin=m.shiny?'#c0a2eb':'#648e79';ellipse(c,46,55,36,13,'#385f65');ellipse(c,45,48,32,15,skin);ellipse(c,72,44,14,11,skin);rect(c,73,41,5,4,'#e4d18b');for(let i=0;i<5;i++)rect(c,23+i*10,37,5,6,'#a2c58e');rect(c,21,59,48,4,'#a2c58e');
      }else if(m.kind==='ashMite'){
        const shell=m.shiny?'#c8a9ea':'#a66856';for(const x of [23,35,58,69])rect(c,x,55,5,15,'#624e62');ellipse(c,47,48,29,20,shell);ellipse(c,47,39,22,10,'#d38e64');ellipse(c,72,40,11,10,shell);rect(c,76,37,4,4,'#ffdf87');for(let i=0;i<5;i++)rect(c,28+i*8,27,4,11,'#685368');
      }else if(m.kind==='fox'||m.kind==='boar'){
        const fox=m.kind==='fox';for(const x of [24,36,57,69])rect(c,x,54,6,16,'#685453');
        ellipse(c,45,47,28,17,body);rect(c,27,35,26,5,fox?'#f3b871':'#bd987c');ellipse(c,72,40,15,14,body);
        rect(c,64,22,7,12,body);rect(c,77,24,6,10,body);rect(c,fox?80:78,44,12,8,fox?'#fff0ca':'#d9ad8c');rect(c,77,36,4,4,'#303f4b');
        if(fox){ellipse(c,15,49,13,9,body);rect(c,3,46,8,7,'#fff0ca');rect(c,67,47,13,6,'#fff0ca');}
        else{rect(c,76,48,4,10,'#f4dfb1');rect(c,86,47,4,9,'#f4dfb1');for(let i=0;i<5;i++)rect(c,28+i*6,29,4,7,'#705850');}
      }else if(m.kind==='tortoise'||m.kind==='crystalBeetle'){
        const beetle=m.kind==='crystalBeetle';for(const x of [20,35,58,72])rect(c,x,52,6,15,'#637566');ellipse(c,77,51,12,9,body);ellipse(c,46,44,31,23,body);ellipse(c,43,38,22,15,m.shiny?'#e3c6ff':beetle?'#9acddd':'#a8c56d');
        for(const x of [30,44,58]){rect(c,x,31,3,24,beetle?'#506f99':'#668552');rect(c,x-4,44,12,3,beetle?'#506f99':'#668552');}rect(c,82,48,3,3,'#30414c');
        if(beetle)for(const x of [26,43,60]){rect(c,x,17,8,21,'#bddeef');rect(c,x+2,13,4,18,'#e5f5ec');}else{rect(c,27,28,11,4,'#d1da89');rect(c,53,33,8,4,'#d1da89');}
      }else if(m.kind==='caveSlime'){
        ellipse(c,47,58,34,12,'#508d8c');ellipse(c,47,48,30,23,body);ellipse(c,39,38,16,10,m.shiny?'#ead4ff':'#bde8c9');rect(c,48,47,5,7,'#344b60');rect(c,65,47,5,7,'#344b60');rect(c,55,59,9,3,'#54888b');
      }else{
        rect(c,23,55,15,20,'#5b526d');rect(c,59,55,15,20,'#5b526d');rect(c,22,29,53,32,body);rect(c,11,34,13,29,body);rect(c,75,34,13,29,body);rect(c,31,10,37,25,body);rect(c,34,12,28,5,'#aa9ab1');rect(c,36,22,8,5,'#ffdb81');rect(c,54,22,8,5,'#ffdb81');rect(c,44,35,7,18,'#f39866');rect(c,37,42,21,5,'#ffcf79');rect(c,14,53,8,5,'#ed9c68');rect(c,77,53,8,5,'#ed9c68');
      }
      if(m.shiny){rect(c,10,15,3,11,'#fff3d4');rect(c,6,19,11,3,'#fff3d4');rect(c,78,9,3,11,'#fff3d4');rect(c,74,13,11,3,'#fff3d4');}
      return {image,ax:48,ay:72};
    });this.shadow(ctx,m.x,m.y,m.radius*.85);this.draw(ctx,sprite,m.x,m.y,m.kind==='fox'?1.3:1.55,1,m.visualFlip===true);
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

      rect(c,13,88,124,7,'#7f6043');rect(c,57,93,36,29,'#70513b');rect(c,63,95,24,27,'#304b46');rect(c,67,94,4,28,'#b59b6a');rect(c,58,120,34,4,'#d6bb83');
      return {image,ax:75,ay:122};
    });this.shadow(ctx,h.x,h.y,h.r*.7);this.draw(ctx,sprite,h.x,h.y,1.85);
  }
  player(ctx,p,inventory,time,fishing){
    if(p.swimming){this.drawSwimmer(ctx,p,inventory,time);return;}
    const back=Math.sin(p.facing)<-.45,side=Math.abs(Math.cos(p.facing))>.7,step=p.moving?[0,1,0,-1][Math.floor(time/145)%4]:0,armor=inventory.equippedGear?.tier,tool=inventory.equippedTool;
    const pose=playerArmPose(p,time,tool?.type,fishing);
    const sprite=this.sprite(`adventurer:${back}:${side}:${step}:${armor}`,()=>{
      const image=canvas(44,66),c=image.getContext('2d'),skin='#e4ad80',skinLight='#f2c495',skinShade='#c68c65',shirt=MATERIAL_COLORS[armor]||({leaf:'#71ae65',wood:'#b78858',iron:'#9bbec9',stone:'#9caeb0',copper:'#d7966b',quartz:'#a8d9dc',amber:'#ddb865',obsidian:'#9a81b6',moonstone:'#cbb3e0'}[armor])||'#bd8056';
      // Small stepped contours and broad color planes keep the figure readable at game zoom.
      for(const [x,stride] of [[side?16:14,step],[25,-step]]){
        rect(c,x,45,6,11,'#626566');rect(c,x+1,49,3,7,'#7c7f76');
        rect(c,x+1,55+stride,5,4,'#545d61');
        rect(c,x-1,58+stride,9,3,'#354951');rect(c,x-2,60+stride,10,1,'#2e4148');
        rect(c,x,58+stride,5,1,'#80918b');
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
      }else{
        // A hide tunic, rather than a flat square shirt.
        for(let i=0;i<13;i++)rect(c,bodyX+(side?6:2)+Math.floor(i*(side?.4:.6)),29+i,2,2,'#e7bc80');
        rect(c,bodyX+3,42,3,3,'#d69b65');rect(c,bodyX+bodyW-6,43,4,2,'#9b684c');
      }
      rect(c,bodyX+1,46,bodyW-2,3,'#795c47');rect(c,bodyX+1,46,bodyW-2,1,'#a48156');rect(c,side?25:22,46,3,3,'#e0bd76');
      // Cheeks, ears and a tapered jaw soften the old rectangular head.
      rect(c,15,9,15,3,skin);rect(c,13,12,19,9,skin);rect(c,14,21,17,3,skin);rect(c,17,24,11,2,skinShade);
      rect(c,11,16,3,4,skinShade);rect(c,12,16,2,3,skin);rect(c,31,16,3,4,skinShade);
      rect(c,14,12,3,9,skinLight);rect(c,29,13,2,10,skinShade);
      rect(c,12,8,3,8,'#634b39');rect(c,14,5,16,6,'#634b39');rect(c,17,3,11,3,'#785638');
      rect(c,11,10,3,6,'#634b39');rect(c,29,8,4,7,'#634b39');rect(c,31,13,2,4,'#634b39');
      rect(c,15,6,9,2,'#a27849');rect(c,16,9,4,3,'#634b39');rect(c,25,9,5,2,'#634b39');
      if(back){
        // Walking away shows the back of the head and the nape, rather than eyes.
        rect(c,13,10,19,12,'#634b39');rect(c,14,21,17,2,'#634b39');rect(c,17,23,11,2,'#785638');
        rect(c,15,11,3,8,'#785638');rect(c,16,11,1,5,'#986d43');
      }
      const eyeY=back?14:15,pupilY=back?eyeY:eyeY+1,pupilShift=side?3:2;
      if(!back){
        for(const eyeX of [15,24]){rect(c,eyeX,eyeY-2,6,1,'#805b43');rect(c,eyeX,eyeY,6,5,'#fff1d5');rect(c,eyeX+pupilShift,pupilY,2,3,'#354950');}
        rect(c,22,20,2,2,skinShade);rect(c,21,20,1,1,skinLight);
        rect(c,19,23,7,1,'#9d684b');rect(c,20,24,5,1,'#f0bb8d');
      }
      return {image,ax:22,ay:61};
    });if(!p.swimBody)this.shadow(ctx,p.x,p.y,23);if(back&&tool)this.drawHeldTool(ctx,p,tool,time,fishing,pose);this.draw(ctx,sprite,p.x,p.y-(p.jumpHeight||0),1.65,1,Math.cos(p.facing)<-.7);
    if(!p.swimBody){
    const armKey=pose.arms.flatMap(arm=>[arm.shoulder.x,arm.elbow.x,arm.elbow.y,arm.hand.x,arm.hand.y,arm.far?1:0].map(Math.round)).join(':');
    const armSprite=this.sprite(`arms:${armKey}`,()=>{
      const image=canvas(52,66),c=image.getContext('2d');
      for(const arm of pose.arms)this.drawArm(c,arm);
      return {image,ax:22,ay:61};
    });
    this.draw(ctx,armSprite,p.x,p.y-(p.jumpHeight||0),1.65,1,pose.flip);
    }
    if(tool&&!back)this.drawHeldTool(ctx,p,tool,time,fishing,pose);
  }
  drawSwimmer(ctx,p,inventory,time){
    // Keep the normal upright head and torso. Only the joints, kicks, and waterline animate.
    const phase=p.moving?Math.floor(time/110)%8:Math.floor(time/240)%8;
    const side=Math.abs(Math.cos(p.facing))>.7,back=Math.sin(p.facing)<-.45,flip=Math.cos(p.facing)<-.7;
    const bob=[0,0,1,1,0,0,-1,-1][phase],bodyY=p.y+28+bob,waterline=p.y-6;
    const kicks=this.sprite(`swim-kicks:${phase}`,()=>{
      const image=canvas(44,66),c=image.getContext('2d');
      for(let i=0;i<2;i++){
        const kick=[0,1,2,1,0,-1,-2,-1][(phase+i*4)%8],x=i?26:16;
        rect(c,x,46,6,8,'#58767c');rect(c,x+kick,54,6,5,'#58767c');rect(c,x+kick-1,59,8,2,'#6d969e');
      }
      return {image,ax:22,ay:61};
    });this.draw(ctx,kicks,p.x,bodyY,1.65,.3,flip);
    ctx.save();ctx.beginPath();ctx.rect(p.x-90,p.y-200,180,194);ctx.clip();
    this.player(ctx,{...p,y:bodyY,swimming:false,swimBody:true,moving:false,jumpHeight:0,swingUntil:0},{...inventory,equippedTool:null},time);
    ctx.restore();
    const arms=this.sprite(`swim-arms:${phase}:${side}:${back}`,()=>{
      const image=canvas(52,66),c=image.getContext('2d');
      for(let i=0;i<2;i++){
        const stroke=(phase+i*4)%8,reach=[-1,-3,-5,-3,0,2,3,1][stroke];
        const x=(side?[15,29]:[11.5,32.5])[i],sign=i?1:-1;
        const elbow={x:x+sign*(side?2:4),y:35+reach*.4};
        const hand={x:elbow.x+sign*(side?3:4),y:39+reach};
        this.drawArm(c,{shoulder:{x,y:31},elbow,hand,far:side&&i===0});
      }
      return {image,ax:22,ay:61};
    });
    ctx.save();ctx.beginPath();ctx.rect(p.x-90,p.y-200,180,194);ctx.clip();this.draw(ctx,arms,p.x,bodyY,1.65,1,flip);ctx.restore();
    // Small stationary ripple masks break around the moving shoulders, not a rotating body.
    ctx.save();ctx.fillStyle='#a6e4e7';ctx.globalAlpha=.7;
    rect(ctx,p.x-25,waterline,14,2);rect(ctx,p.x+10,waterline+2,14,2);
    if(p.moving){const offset=[0,2,4,2,0,-2,-4,-2][phase];rect(ctx,p.x-32-offset,waterline+8,8,2);rect(ctx,p.x+25+offset,waterline+7,8,2);}
    ctx.restore();
  }
  drawHeldTool(ctx,p,tool,time,fishing,pose){
      const recipe=toolRecipes.get(tool.id);
      if(!recipe)return;
      this.heldImages??=new Map();
      let image=this.heldImages.get(recipe.id);
      if(!image){image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(itemSvg(recipe,{background:false}))}`;this.heldImages.set(recipe.id,image);}
      if(!image.complete||!image.naturalWidth)return;
      const held=heldToolPose(p,time,recipe.type,fishing,pose);
      ctx.save();ctx.translate(p.x,p.y-(p.jumpHeight||0));ctx.scale(held.flip?-held.scale:held.scale,held.scale/CAMERA_TILT);ctx.translate(held.x,held.y);ctx.rotate(held.angle);
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(image,-held.size*held.grip.x,-held.size*held.grip.y,held.size,held.size);
      rect(ctx,-2,-1,4,3,'#e4ad80');rect(ctx,-1,-1,2,1,'#f2c495');
      ctx.restore();
  }
  drawArm(ctx,{shoulder,elbow,hand,far=false}){
    const skin=far?'#ce986f':'#e4ad80',light=far?'#e0ae80':'#f2c495';
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
    rect(ctx,hand.x-2,hand.y-1,4,3,skin);rect(ctx,hand.x-1,hand.y-1,2,1,light);
  }
  fishingRodTip(p,fishing,time=0){return fishingRodTipWorld(p,time,fishing);}
}
