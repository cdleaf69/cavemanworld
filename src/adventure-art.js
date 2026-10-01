import { ToyArt } from './toy-art.js';
import { grain } from './pixel-art.js';
import { MATERIAL_COLORS } from './materials.js';
import { RECIPES } from './crafting.js';
import { itemSvg } from './item-art.js';
import { CAMERA_TILT } from './camera.js';
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
      rect(c,49,71,14,66,'#674b3e');rect(c,51,78,5,54,variant%4===2?'#e4d7b1':'#a57a51');rect(c,45,133,24,5,'#73513e');
      for(let i=0;i<7;i++)rect(c,52+(i%2)*5,87+i*6,3,3,'#513f36');
      rect(c,39,90,15,6,'#79563e');rect(c,35,75,6,21,'#79563e');rect(c,61,85,15,6,'#79563e');
      if(variant%4===0){for(let i=0;i<5;i++){const y=12+i*18,w=16+i*6;for(let j=0;j<36;j+=2)rect(c,56-w*j/36,y+j,2*w*j/36,2,p[1+(i%2)]);for(let k=0;k<12;k++)rect(c,56+(grain(k,i+variant)-.5)*w*1.4,y+19+grain(i,k)*14,4,2,p[2]);}}
      else if(variant%4===1){crown(28,62,25,18,variant);crown(80,61,26,19,variant+3);crown(54,49,38,24,variant+7);}
      else if(variant%4===2){crown(55,62,23,35,variant);crown(53,29,19,25,variant+4);crown(66,77,19,19,variant+9);}
      else{crown(30,64,24,22,variant);crown(78,59,26,25,variant+3);crown(54,37,34,29,variant+7);crown(52,69,28,19,variant+9);}
      if(biome==='marsh')for(let i=0;i<6;i++){rect(c,22+i*13,75,2,22+(i%3)*8,p[1]);rect(c,21+i*13,86,4,5,p[2]);}
      if(variant%4===1)for(let i=0;i<5;i++)rect(c,26+i*12,51+(i%2)*19,4,4,'#ef9a8c');
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
      for(let y=15;y<91;y+=3){const w=Math.floor((y-10)*.83);rect(c,75-w,y,w*2,3,y%2?'#bf9657':'#d6b06b');}
      rect(c,13,88,124,7,'#7f6043');rect(c,57,93,36,29,'#70513b');rect(c,63,95,24,27,'#304b46');rect(c,67,94,4,28,'#b59b6a');rect(c,58,120,34,4,'#d6bb83');
      return {image,ax:75,ay:122};
    });this.shadow(ctx,h.x,h.y,h.r*.7);this.draw(ctx,sprite,h.x,h.y,1.85);
  }
  player(ctx,p,inventory,time,fishing){
    const back=Math.sin(p.facing)<-.45,side=Math.abs(Math.cos(p.facing))>.7,step=p.moving?Math.floor(time/170)%2:0,armor=inventory.equippedGear?.tier,tool=inventory.equippedTool;
    const sprite=this.sprite(`adventurer:${back}:${side}:${step}:${armor}`,()=>{
      const image=canvas(44,66),c=image.getContext('2d'),skin='#e4ad80',shirt=MATERIAL_COLORS[armor]||({leaf:'#71ae65',wood:'#b78858',iron:'#9bbec9',stone:'#9caeb0',copper:'#d7966b',quartz:'#a8d9dc',amber:'#ddb865',obsidian:'#9a81b6',moonstone:'#cbb3e0'}[armor])||'#c9845b';
      rect(c,12,43,7,15+step*2,'#635b64');rect(c,24,43,7,17-step*2,'#635b64');rect(c,10,57+step*2,11,4,'#394652');rect(c,23,59-step*2,11,4,'#394652');
      rect(c,8,28,6,22,skin);rect(c,31,28,6,22,skin);rect(c,13,26,18,23,shirt);rect(c,14,28,4,16,'#ffffff22');rect(c,13,45,18,4,'#765849');
      rect(c,13,9,19,17,skin);rect(c,10,10,4,12,'#564438');rect(c,12,5,19,7,'#564438');rect(c,15,3,12,3,'#73503c');rect(c,30,8,4,9,'#564438');
      if(back)rect(c,13,9,19,4,'#564438');
      const eyeY=back?13:14,pupilY=back?eyeY:eyeY+2,pupilShift=side?3:1;
      for(const eyeX of [15,24]){rect(c,eyeX,eyeY,7,6,'#fff0cf');rect(c,eyeX+pupilShift,pupilY,2,3,'#263b49');}
      rect(c,20,23,7,2,'#a26c50');
      return {image,ax:22,ay:61};
    });this.shadow(ctx,p.x,p.y,23);this.draw(ctx,sprite,p.x,p.y-(p.jumpHeight||0),1.65,1,Math.cos(p.facing)<-.7);
    if(tool){
      const recipe=toolRecipes.get(tool.id);
      if(!recipe)return;
      this.heldImages??=new Map();
      let image=this.heldImages.get(recipe.id);
      if(!image){image=new Image();image.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(itemSvg(recipe,{background:false}))}`;this.heldImages.set(recipe.id,image);}
      if(!image.complete||!image.naturalWidth)return;
      const flip=this.heldItemFlip(p,recipe.type,fishing),scale=1.65,handX=34,handY=43,heldSize=recipe.type==='rock'?31:43;
      ctx.save();ctx.translate(p.x,p.y-(p.jumpHeight||0));ctx.scale(flip?-scale:scale,scale/CAMERA_TILT);ctx.translate(handX-22,handY-61);
      if(p.swingUntil>time)ctx.rotate(-.55);
      ctx.imageSmoothingEnabled=false;
      ctx.drawImage(image,-heldSize*.37,-heldSize*.81,heldSize,heldSize);
      rect(ctx,-2,-1,5,4,'#e4ad80');
      ctx.restore();
    }
  }
  heldItemFlip(p,type,fishing){return type==='rod'&&fishing?.active?fishing.castPoint.x<p.x:Math.cos(p.facing)<-.7;}
  fishingRodTip(p,fishing){
    const size=43,scale=1.65,flip=this.heldItemFlip(p,'rod',fishing);
    const x=34-22-size*.37+size*59/96;
    const y=43-61-size*.81+size*13/96;
    return {x:p.x+(flip?-scale:scale)*x,y:p.y-(p.jumpHeight||0)+scale/CAMERA_TILT*y};
  }
}
