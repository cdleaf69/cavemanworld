import {mountainAt,altitudeAt,unprojectMountainPoint} from './frontier-world.js';
import { caveGeometry,TOWNS } from './world.js';
import { MATERIAL_COLORS } from './materials.js';
import { PixelArt, grain } from './pixel-art.js';
import { BIOMES, SURFACE, PATHS, RIVER, CAVE_ROOMS, DEEP_ROOMS, TUNNELS, DEEP_TUNNELS, distanceToSegment, lakeWaterDistance, oceanDistance, biomeAt } from './world.js';
import { BRIDGE_SPANS } from './bridges.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const rgb=a=>`rgb(${a.map(v=>Math.round(clamp(v,0,255))).join(',')})`;
const ground={heartlands:[136,207,103],woodland:[81,184,109],tundra:[169,222,207],marsh:[94,189,156],badlands:[233,173,102],volcanic:[134,128,158]};
const leaves={heartlands:['#277d5b','#39ad66','#78d77a','#b9ed8a'],woodland:['#196c61','#209b71','#48c885','#9bea9c'],tundra:['#428f9c','#6ec5bb','#b8f0d6','#e6fff0'],marsh:['#287b83','#32aa92','#6cdec0','#b8f3c8'],badlands:['#a66b43','#d99753','#f4c66d','#ffe39c'],volcanic:['#615276','#8c6d98','#bb90ac','#e5bcbb']};
const ore={iron:'#b9d9da',copper:'#f79268',quartz:'#b7f0ef',amber:'#ffca57',obsidian:'#9f91d2',moonstone:'#efb5fc'};
const gear={leaf:'#64c776',wood:'#cb8c58',stone:'#a4bdc2',iron:'#7bc9de',copper:'#efa16d',quartz:'#ace7e8',amber:'#f2c357',obsidian:'#9c83cb',moonstone:'#e0a7ef'};
Object.assign(ore,MATERIAL_COLORS);Object.assign(gear,MATERIAL_COLORS);
const sections=points=>points.slice(1).map((b,i)=>({a:points[i],b,minX:Math.min(points[i][0],b[0])-130,maxX:Math.max(points[i][0],b[0])+130,minY:Math.min(points[i][1],b[1])-130,maxY:Math.max(points[i][1],b[1])+130}));
function indexSections(list){
 const cells=new Map();for(const s of list)for(let cy=Math.floor(s.minY/512);cy<=Math.floor(s.maxY/512);cy++)for(let cx=Math.floor(s.minX/512);cx<=Math.floor(s.maxX/512);cx++){const key=`${cx}:${cy}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(s);}list.cells=cells;return list;
}
const trails=indexSections(PATHS.flatMap(p=>sections(p.points).map(s=>({...s,half:p.width/2})))),river=indexSections(sections(RIVER));
function near(x,y,list){let d=10000;for(const s of (list.cells?.get(`${Math.floor(x/512)}:${Math.floor(y/512)}`)||[]))if(x>=s.minX&&x<=s.maxX&&y>=s.minY&&y<=s.maxY)d=Math.min(d,distanceToSegment(x,y,...s.a,...s.b)-(s.half||0));return d;}
function block(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function roundedBody(c,x,y,w,h,color){for(let row=0;row<h;row+=2){const half=Math.round(w/2*Math.sqrt(Math.max(0,1-((row-h/2)/(h/2))**2)));block(c,x+w/2-half,y+row,half*2,2,color);}}
function poly(c,points,color){c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();}
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.lineCap='square';c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();}
function canvas(w,h){if(typeof document==='undefined')return new OffscreenCanvas(w,h);const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function canopy(c,x,y,w,h,p,seed){
  block(c,x+5,y,w-10,h,p[0]);block(c,x,y+7,w,h-13,p[1]);block(c,x+5,y+4,w-12,h-17,p[2]);
  block(c,x+10,y+4,Math.round(w*.4),6,p[3]);block(c,x+7,y+h-11,w-17,5,p[0]);
  for(let i=0;i<4;i++){const bx=x+9+Math.floor(grain(i,seed)*Math.max(1,w-20)),by=y+11+Math.floor(grain(seed,i)*Math.max(1,h-25));block(c,bx,by,4,4,i%2?p[3]:p[1]);}
}
function smoothNoise(x,y,size){const fx=x/size,fy=y/size,ix=Math.floor(fx),iy=Math.floor(fy),a=fx-ix,b=fy-iy,u=a*a*(3-2*a),v=b*b*(3-2*b);return (grain(ix,iy)*(1-u)+grain(ix+1,iy)*u)*(1-v)+(grain(ix,iy+1)*(1-u)+grain(ix+1,iy+1)*u)*v;}
function sample(x,y,layer){
  if(layer==='ocean'){const depth=clamp(-oceanDistance(x,y)/2500),n=smoothNoise(x,y,230);return {color:mix([80+n*10,151+n*8,160],[27,66,107],depth*.8),water:false,dirt:false,bridge:false};}
  if(layer!=='surface'){
    const {rooms,tunnels}=caveGeometry(layer);
    let inside=-10000;for(const r of rooms)inside=Math.max(inside,r.r-Math.hypot(x-r.x,y-r.y));
    for(const t of tunnels)for(let i=1;i<t.points.length;i++)inside=Math.max(inside,t.width/2-distanceToSegment(x,y,...t.points[i-1],...t.points[i]));
    const floor=({deep:[94,94,145],abyss:[72,106,122],core:[124,81,103]}[layer]||[115,118,138]),wall=({deep:[34,43,78],abyss:[27,49,64],core:[55,34,61]}[layer]||[42,61,79]);
    return {color:mix(wall,floor,clamp((inside+10)/34)),water:false,dirt:false,bridge:false};
  }
  if(mountainAt(x,y)){const p=unprojectMountainPoint({x,y});y=p.y;}
  const n=smoothNoise(x,y,340),detail=smoothNoise(x,y,150);
  let color=ground.heartlands;
  for(const b of BIOMES){const rx=(x-b.center[0])/b.radii[0],ry=(y-b.center[1])/b.radii[1],w=clamp((1.10-Math.hypot(rx,ry))*4.4+(n-.5)*.3);if(w)color=mix(color,ground[b.id],w);}
  // World-space noise crosses tile edges continuously; texture is baked only once.
  color=color.map(v=>v+(n-.5)*10+(detail-.5)*7);
  color=mix(color,[169,211,106],clamp((detail-.48)*.3));
  const m=mountainAt(x,y);if(m){const h=altitudeAt(x,y)/m.height;color=mix(color,m.id==='frostpeak'?[185,203,190]:[132,151,135],clamp(h*.8));color=color.map(v=>v+(detail-.5)*15);if(h>.985)color=mix(color,m.id==='frostpeak'?[193,218,202]:[153,191,132],.7);}
  const path=near(x,y,trails),stream=near(x,y,river),village=Math.hypot(x-9000,y-7000);
  const edge=smoothNoise(x+1900,y-750,95);
  const townPlaza=Math.max(...TOWNS.map(t=>clamp((260-Math.hypot(x-t.x,y-t.y)+(detail-.5)*24)/75)));
  const dirt=clamp((10-path+(edge-.5)*8)/22),plaza=0,soil=Math.max(dirt,plaza,townPlaza);
  color=mix(color,[233+(detail-.5)*12,196+(detail-.5)*12,119+(detail-.5)*10],soil);
  const coast=oceanDistance(x,y);
  if(coast<240){const sand={tundra:[218,232,205],marsh:[198,202,143],badlands:[239,181,109],volcanic:[177,160,179],woodland:[224,207,141],heartlands:[239,211,147]}[biomeAt(x,y,'surface').id]||[239,211,147];color=mix(color,sand,clamp((240-coast)/130));}
  const water=Math.min(stream-83,lakeWaterDistance(x,y),coast),bridge=false;
  if(water<30&&!bridge)color=mix(color,[71,196,207],clamp((30-water)/35));
  if(water<0&&!bridge)color=mix(color,[44,139,199],clamp(-water/75)*.78);
  if(bridge)color=[185,133,81];
  return {color,water:water<0&&!bridge,dirt:soil>.5,soil,bridge};
}

export class ToyArt extends PixelArt {
  makeAtlas(){
    const tile=canvas(480,Math.round(480*SURFACE.height/SURFACE.width)),c=tile.getContext('2d');
    for(let y=0;y<tile.height;y+=2)for(let x=0;x<tile.width;x+=2){const s=sample(x/tile.width*SURFACE.width,y/tile.height*SURFACE.height,'surface');block(c,x,y,2,2,rgb(s.color));}
    return tile;
  }
  makeTerrain(gx,gy,layer){
    const tile=canvas(256,256),c=tile.getContext('2d');
    for(let py=0;py<256;py+=4)for(let px=0;px<256;px+=4){
      const x=gx*512+px*2,y=gy*512+py*2,s=sample(x,y,layer),n=grain(x>>2,y>>2,7);
      block(c,px,py,4,4,rgb(s.color));
      if(!s.water){
        // Quiet flecks use the ground's own palette, instead of noisy contrasting dots.
        const fleck=s.color.map(v=>v+(n>.5?9:-8));
        if(n<.1||n>.88)block(c,px+1,py+2,n>.96?2:1,1,rgb(fleck));
      }
      if(s.bridge){if(Math.floor(y/12)%2===0)block(c,px,py,4,1,'#8e654a');}
      else if(layer==='surface'&&!s.dirt&&!s.water){
        if(n>.989){const tuft=s.color.map((v,i)=>v+[-18,-13,-9][i]);block(c,px+1,py,1,2,rgb(tuft));block(c,px+2,py+1,1,2,rgb(tuft));}
        else if(n<.01)block(c,px+1,py+1,2,1,rgb(s.color.map(v=>v+17)));
      }
      else if(!s.water&&n>.985)block(c,px+1,py+1,2,1,layer==='surface'?'#fff0bf':'#aaa6d8');
    }
    if(layer==='surface')this.paintBridges(c,gx,gy);
    return tile;
  }
  paintBridges(c,gx,gy){
    const left=gx*512,top=gy*512;
    c.save();c.scale(.5,.5);c.translate(-left,-top);
    for(const bridge of BRIDGE_SPANS){
      if(bridge.x<left-bridge.length-130||bridge.x>left+512+bridge.length+130||bridge.y<top-bridge.length-130||bridge.y>top+512+bridge.length+130)continue;
      c.save();c.translate(bridge.x,bridge.y);c.rotate(bridge.angle);
      const length=bridge.length;
      c.fillStyle='#684632';c.fillRect(-7,-57,length+14,114);
      c.fillStyle='#c88f58';c.fillRect(-3,-50,length+6,100);
      c.fillStyle='#e0ac6f';c.fillRect(0,-40,length,80);
      for(let x=0;x<length;x+=16){
        c.fillStyle=x/16%3===0?'#d39b62':'#dda66c';c.fillRect(x,-40,Math.min(15,length-x),80);
        c.fillStyle='#a66f47';c.fillRect(x+15,-40,2,80);
        c.fillStyle='#f2c486';c.fillRect(x+2,-35,Math.min(10,length-x-2),3);
      }
      for(const side of [-1,1]){
        c.fillStyle='#78513a';c.fillRect(-8,side<0?-57:50,length+16,7);
        c.fillStyle='#e3b577';c.fillRect(-8,side<0?-56:51,length+16,2);
        for(let x=9;x<length;x+=56){c.fillStyle='#704831';c.fillRect(x-5,side<0?-67:49,10,18);c.fillStyle='#f1c184';c.fillRect(x-3,side<0?-67:49,6,4);}
      }
      c.restore();
    }
    c.restore();
  }
  makeResource(kind,biome,resource,variant){
    const tree=kind==='tree',image=canvas(tree?112:64,tree?148:66),c=image.getContext('2d'),ax=tree?56:32,ay=tree?138:55,p=leaves[biome]||leaves.heartlands;
    if(tree){
      const pine=biome==='tundra'||variant%4===0,willow=biome==='marsh',bare=biome==='volcanic'&&variant%3===0;
      block(c,48,79,16,58,'#805b49');block(c,49,83,5,50,'#b9865e');block(c,45,131,24,8,'#644c42');
      if(bare){line(c,[[56,95],[30,57],[18,49]],'#805b49',8);line(c,[[57,86],[81,48],[96,42]],'#805b49',7);canopy(c,14,42,23,22,p,variant);canopy(c,74,35,25,25,p,variant+1);}
      else if(pine){for(let i=0;i<4;i++){const y=20+i*23,w=23+i*7;poly(c,[[56,y-15],[56-w,y+22],[56+w,y+22]],p[i%3]);block(c,55-w/2,y+11,w,5,p[3]);}}
      else if(willow){canopy(c,17,25,78,65,p,variant);for(let i=0;i<7;i++){const x=23+i*10;block(c,x,82,4,22+(i%3)*8,p[1]);block(c,x,87,2,12,p[3]);}}
      else{canopy(c,11,40,38,45,p,variant);canopy(c,48,25,50,57,p,variant+1);canopy(c,22,13,61,59,p,variant+2);if(variant%3===1)for(let i=0;i<5;i++)block(c,30+i*11,35+(i%2)*18,5,5,biome==='badlands'?'#f5db7b':'#ff8e92');}
    }else if(kind==='bush'){
      block(c,17,42,27,13,'#4e8060');canopy(c,4,23,30,31,p,variant);canopy(c,29,16,31,38,p,variant+3);
      for(let i=0;i<4;i++)block(c,12+i*11,30+(i%2)*12,4,4,variant%3===0?'#ff8592':variant%3===1?'#ffd574':'#bdf2ee');
    }else if(kind==='rock'||kind==='ore'){
      poly(c,[[7,47],[12,28],[25,18],[47,18],[57,33],[53,52],[17,56]],'#627b8d');
      poly(c,[[12,28],[25,18],[47,18],[40,35],[19,38]],'#bdcfca');poly(c,[[19,38],[40,35],[53,52],[17,56]],'#8ca5ac');
      if(kind==='ore')for(let i=0;i<3;i++){const x=14+i*14;poly(c,[[x,43],[x,24],[x+6,14-i*3],[x+12,27],[x+12,43]],ore[resource]||'#f1cc7e');block(c,x+4,23,3,14,'#ffffff88');}
    }else if(resource==='sticks'||resource==='wood'){line(c,[[20,53],[43,30]],'#735044',6);line(c,[[21,50],[41,30]],'#e9ad6e',3);}
    else if(resource==='leaves'){poly(c,[[20,46],[28,31],[45,27],[41,44],[28,52]],'#4fc479');block(c,28,39,10,3,'#c3ec8a');}
    else{poly(c,[[19,50],[21,37],[31,31],[45,38],[48,50],[39,55],[23,55]],'#a9c4c8');block(c,28,35,9,4,'#e4eee0');}
    return {image,ax,ay};
  }
  decoration(ctx,d){const seed=Math.floor(grain(d.x,d.y)*7),sprite=this.sprite(`toy-decor:${d.kind}:${seed}`,()=>{
    const image=canvas(32,40),c=image.getContext('2d');
    if(d.kind==='crystal')for(let i=0;i<3;i++)poly(c,[[5+i*9,35],[5+i*9,16-i*3],[10+i*9,8-i*2],[15+i*9,19],[15+i*9,35]],['#86d7e0','#b8a8ed','#e5bded'][i]);
    else if(d.kind==='mushroom')for(let i=0;i<2;i++){block(c,8+i*11,25,4,11,'#fff1c6');block(c,4+i*11,19,13,7,i?'#fa8e95':'#a4dc83');block(c,8+i*11,21,3,2,'#fff4d2');}
    else if(d.kind==='bone'){line(c,[[5,33],[25,18]],'#e9dfc4',4);block(c,3,29,6,5,'#fff1d6');}
    else if(d.kind==='ash'){block(c,6,29,20,6,'#6c718e');block(c,13,23,9,6,'#ae83a0');}
    else for(let i=0;i<4;i++){const x=6+i*5;line(c,[[16,36],[x,17+(i%2)*7]],'#29946a',2);if(d.kind==='flower')block(c,x-2,14+(i%2)*7,6,6,['#ff8ea0','#ffdc78','#b4dcff'][seed%3]);if(d.kind==='reed')block(c,x,15+(i%2)*7,3,8,'#edc87e');}
    return {image,ax:16,ay:36};});this.draw(ctx,sprite,d.x,d.y,1.6);
  }
  hut(ctx,h,index){const sprite=this.sprite(`toy-hut:${index%4}`,()=>{
    const image=canvas(160,160),c=image.getContext('2d'),roof=['#f2b765','#ed9268','#e8c677','#90cdb8'][index%4],rim=['#a76c55','#aa5d59','#9e8057','#538f88'][index%4];
    block(c,23,83,114,41,'#956a55');block(c,27,88,105,28,'#edc58b');
    for(let i=0;i<6;i++){block(c,30+i*18,97,5,22,'#ad725a');block(c,33+i*18,100,5,4,'#ffe3aa');}
    poly(c,[[13,91],[31,60],[69,22],[81,12],[95,22],[131,60],[147,91],[132,102],[30,102]],rim);
    poly(c,[[20,84],[37,57],[72,25],[83,22],[119,58],[140,84],[130,91],[30,91]],roof);
    for(let i=0;i<7;i++){const y=50+i*7,w=18+i*7;block(c,80-w,y,w*2,3,i%2?'#fff0a4':'#d68c64');}
    block(c,61,121,39,7,'#71564d');block(c,65,91,31,35,'#634e4d');block(c,71,97,20,29,'#2f5559');block(c,90,108,3,4,'#ffdf80');
    block(c,22,123,116,5,'#554b4f');return {image,ax:80,ay:125};});this.shadow(ctx,h.x,h.y,h.r*.65);this.draw(ctx,sprite,h.x,h.y,1.8);
  }
  player(ctx,p,inventory,time){
    const pose=p.moving?Math.floor(time/115)%4:0,back=Math.sin(p.facing)<-.45,side=Math.abs(Math.cos(p.facing))>.7,armor=inventory.equippedGear?.tier||'hide',tool=inventory.equippedTool;
    const sprite=this.sprite(`toy-player:${pose}:${back}:${side}:${armor}:${tool?.type}:${tool?.tier}:${p.swingUntil>time}`,()=>{
      const image=canvas(56,78),c=image.getContext('2d'),step=[0,2,0,-2][pose],skin='#e9ab7c',outfit=gear[armor]||'#f17e5b';
      block(c,17,52,10,17+step,'#554e63');block(c,30,52,10,17-step,'#554e63');block(c,16,67+step,13,5,'#29394e');block(c,29,67-step,13,5,'#29394e');
      block(c,11,33,9,20-step,skin);block(c,38,33,9,20+step,skin);block(c,10,48-step,11,7,skin);block(c,37,48+step,11,7,skin);
      block(c,18,31,21,26,outfit);block(c,18,48,21,5,'#ffe096');block(c,20,35,5,9,'#ffd6a8');
      block(c,17,10,24,23,skin);block(c,16,8,26,9,'#493e4c');block(c,17,7,18,5,'#493e4c');
      if(back)block(c,17,12,24,18,'#493e4c');else if(side){block(c,30,19,6,6,'#fff6d8');block(c,32,20,4,4,'#263343');block(c,37,24,3,4,'#da845f');}
      else{block(c,20,18,7,7,'#fff6d8');block(c,31,18,7,7,'#fff6d8');block(c,23,20,4,4,'#263343');block(c,33,20,4,4,'#263343');block(c,26,27,7,2,'#ad604f');}
      if(tool){const x=p.swingUntil>time?43:44,y=p.swingUntil>time?18:37;line(c,[[42,52],[x,y]],'#795b4e',3);const color=gear[tool.tier]||'#b9cdd1';if(tool.type==='axe')block(c,x-4,y-3,13,9,color);else if(tool.type==='pickaxe')block(c,x-7,y-2,17,5,color);else block(c,x-3,y-5,9,9,color);}
      return {image,ax:28,ay:70};});this.shadow(ctx,p.x,p.y,23);this.draw(ctx,sprite,p.x,p.y,1.55,1,Math.cos(p.facing)<-.7);
  }
  creature(ctx,m,time){
    // Keep the silhouette stable while its world position moves; frame swapping
    // caused pixel-sized legs and wings to flash at normal camera zoom.
    const pose=0;
    const facing=Math.cos(m.facing);
    if(facing<-.4)m.visualFlip=true;else if(facing>.4)m.visualFlip=false;
    const key=`toy-mob:${m.kind}:${pose}:${m.shiny}`,sprite=this.sprite(key,()=>{
      const image=canvas(88,78),c=image.getContext('2d'),step=[-2,0,2][pose],shiny=m.shiny;
      if(m.kind==='rabbit'||m.kind==='deer'){
        const deer=m.kind==='deer',fur=shiny?'#bb93ec':deer?'#e5aa68':'#f7e5bd',light=shiny?'#ead2ff':deer?'#ffe1a0':'#fff8db';
        for(const x of [24,35,54,65])block(c,x,47,6,(deer?20:10)+step,'#715565');roundedBody(c,19,24,deer?52:49,deer?32:29,fur);block(c,28,28,23,7,light);
        roundedBody(c,57,18,23,26,fur);block(c,63,26,15,12,light);block(c,72,28,3,3,'#28354a');block(c,11,37,12,11,light);
        if(deer){for(const x of [61,72]){block(c,x,7,4,19,'#a36d55');block(c,x-6,8,15,3,'#a36d55');}for(let i=0;i<4;i++)block(c,31+i*8,39+(i%2)*7,5,4,light);}
        else for(const x of [60,71]){block(c,x,6,6,20,fur);block(c,x+2,9,2,12,'#ed91a0');}
      }else if(m.kind==='caveBat'){
        const wing=shiny?'#c5a2f7':'#8e7dd0';poly(c,[[41,37],[23,14-step],[4,27],[19,47],[33,43]],wing);poly(c,[[47,37],[65,14-step],[84,27],[69,47],[55,43]],wing);block(c,35,29,18,23,'#534d91');block(c,38,32,4,4,'#ffcd70');block(c,47,32,4,4,'#ffcd70');
      }else if(m.kind==='stoneRam'){
        const body=shiny?'#d8b5f2':'#91b4be';for(const x of [21,34,54,66])block(c,x,48,6,18+step,'#4c6576');roundedBody(c,16,20,57,37,body);for(let i=0;i<14;i++)block(c,25+Math.floor(grain(i,19)*37),26+Math.floor(grain(19,i)*20),4,3,i%2?'#c8d3c2':'#769ca9');block(c,56,23,22,25,'#d9d4b2');for(const y of [21,38]){block(c,58,y,15,6,'#e7b978');block(c,63,y-5,7,6,'#e7b978');}block(c,73,31,3,4,'#263343');
      }else{
        const scorpion=m.kind==='rockScorpion',body=shiny?'#c39df3':scorpion?'#ef9e68':'#76c9ac';
        for(const sign of [-1,1])for(let i=0;i<3;i++)line(c,[[44+sign*15,32+i*6],[44+sign*32,29+i*10+step]],'#604c72',4);
        roundedBody(c,27,20,35,39,body);for(let i=0;i<3;i++)block(c,31,39+i*5,26,2,scorpion?'#c77d5b':'#529e96');block(c,34,30,21,5,'#ffe3aa');block(c,37,27,4,4,'#293445');block(c,48,27,4,4,'#293445');
        if(scorpion){line(c,[[44,54],[67,62],[77,39],[72,24]],'#d5765b',7);block(c,69,16,11,10,'#ffd076');for(const x of [10,67])block(c,x,16,14,11,'#efa96c');}
      }
      if(shiny)for(let i=0;i<3;i++){const x=18+i*25;block(c,x,8+i*4,3,9,'#fff1fc');block(c,x-3,11+i*4,9,3,'#fff1fc');}
      return {image,ax:44,ay:m.kind==='rabbit'?60:m.kind==='deer'?68:64};
    });this.shadow(ctx,m.x,m.y,m.radius*.85);this.draw(ctx,sprite,m.x,m.y,m.kind==='rabbit'?1.1:1.55,1,m.visualFlip===true);
  }
  fire(ctx,x,y,time,lit=true){
    this.shadow(ctx,x,y,35);for(let i=0;i<6;i++){const a=i*Math.PI/3;block(ctx,x+Math.cos(a)*29-7,y+Math.sin(a)*18-4,14,9,i%2?'#a9b9bd':'#839ca9');}
    line(ctx,[[x-22,y-8],[x+22,y+8]],'#704c42',9);line(ctx,[[x-22,y+8],[x+22,y-8]],'#b7734b',8);
    if(lit){const h=43+Math.sin(time*.009)*4;poly(ctx,[[x-17,y],[x-8,y-24],[x-2,y-h],[x+7,y-24],[x+16,y],[x,y+5]],'#ff8b53');poly(ctx,[[x-9,y],[x,y-28],[x+9,y],[x,y+3]],'#ffe482');}
  }
}
