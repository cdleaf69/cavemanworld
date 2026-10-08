import {terrainPlan} from './terrain-plan.js';
import {biomeBlend} from './biome-shapes.js';
import {RIVER_HALF_WIDTH} from './world.js';
import { BIOMES, SURFACE, LAYERS, PATHS, RIVER, HUTS, CAVE_ROOMS, TUNNELS, DEEP_ROOMS, DEEP_TUNNELS, distanceToSegment, lakeWaterDistance } from './world.js';
import { CAMERA_TILT } from './camera.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const grain=(x,y,seed=0)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(seed|0,1442695041);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
function noise(x,y,size){x/=size;y/=size;const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (grain(ix,iy)*(1-u)+grain(ix+1,iy)*u)*(1-v)+(grain(ix,iy+1)*(1-u)+grain(ix+1,iy+1)*u)*v;}
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const colors={heartlands:[91,119,66],woodland:[52,89,55],tundra:[158,177,168],marsh:[68,100,76],badlands:[167,117,78],volcanic:[80,73,73]};
const segments=points=>points.slice(1).map((b,i)=>({a:points[i],b,minX:Math.min(points[i][0],b[0])-140,maxX:Math.max(points[i][0],b[0])+140,minY:Math.min(points[i][1],b[1])-140,maxY:Math.max(points[i][1],b[1])+140}));
const trailSegments=PATHS.flatMap(p=>segments(p.points)),riverSegments=segments(RIVER);
function nearbyDistance(x,y,list){let d=10000;for(const s of list)if(x>=s.minX&&x<=s.maxX&&y>=s.minY&&y<=s.maxY)d=Math.min(d,distanceToSegment(x,y,...s.a,...s.b));return d;}
function surfaceSample(x,y){
  const variation=noise(x,y,680),detail=noise(x+800,y,95);
  let color=[...colors.heartlands];
  for(const b of BIOMES){const weight=biomeBlend(b,x,y);if(weight)color=mix(color,colors[b.id],weight);}
  color=color.map(v=>v+(variation-.5)*23+(detail-.5)*14);
  // Soil patches and meadow cover vary continuously across chunk boundaries.
  const soil=clamp((noise(x+600,y-900,230)-.64)*2.4);color=mix(color,[125,115,75],soil*.5);
  const path=nearbyDistance(x,y,trailSegments),river=nearbyDistance(x,y,riverSegments);
  const clearing=Math.hypot(x-9000,y-7000);
  const village=0;
  const trail=clamp((65-path+(detail-.5)*20)/28);
  color=mix(color,[152+detail*15,130+detail*12,88+detail*10],Math.max(village,trail)*.94);
  const waterDistance=Math.min(river-RIVER_HALF_WIDTH,lakeWaterDistance(x,y));
  const bridge=path<47&&river<RIVER_HALF_WIDTH+23;
  if(waterDistance<35&&!bridge){color=mix(color,[129,137,92],clamp((35-waterDistance)/35));if(waterDistance<0)color=mix([53,123,121],[30,68,89],clamp(-waterDistance/78)*.85);}
  if(bridge)color=[131+detail*20,102+detail*12,65+detail*10];
  return {color,water:waterDistance<0&&!bridge,soil:Math.max(village,trail),bridge};
}
function caveSample(x,y,layer){
  const rooms=layer==='deep'?DEEP_ROOMS:CAVE_ROOMS,tunnels=layer==='deep'?DEEP_TUNNELS:TUNNELS;
  let inside=-10000;
  for(const r of rooms)inside=Math.max(inside,r.r-Math.hypot(x-r.x,y-r.y));
  for(const t of tunnels)for(let i=1;i<t.points.length;i++)inside=Math.max(inside,t.width/2-distanceToSegment(x,y,...t.points[i-1],...t.points[i]));
  const n=noise(x,y,100),large=noise(x,y,650);
  let color=inside>0?(layer==='deep'?[69,75,83]:[97,93,75]):(layer==='deep'?[23,30,39]:[31,38,36]);
  const rim=clamp(1-Math.abs(inside+18)/68);
  color=color.map((v,i)=>v+(n-.5)*20+(large-.5)*14+rim*(i===2?16:21));
  if(inside>0&&inside<30)color=color.map(v=>v*.69);
  return {color,water:false,soil:1,bridge:false};
}
function canvas(w,h){if(typeof document==='undefined')return new OffscreenCanvas(w,h);const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function oval(c,x,y,rx,ry,color){c.fillStyle=color;for(let yy=-Math.ceil(ry);yy<=ry;yy++){const width=Math.floor(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));c.fillRect(Math.round(x-width),Math.round(y+yy),width*2+1,1);}}
function poly(c,points,color){c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(const point of points.slice(1))c.lineTo(...point);c.closePath();c.fill();}
function stroke(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.lineCap='square';c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();}
function foliage(c,x,y,rx,ry,palette,seed){
  for(let yy=-Math.ceil(ry);yy<=ry;yy++)for(let xx=-Math.ceil(rx);xx<=rx;xx++){
    const edge=xx*xx/(rx*rx)+yy*yy/(ry*ry),n=grain(xx+x,yy+y,seed);
    if(edge>1+(n-.5)*.16)continue;
    const light=clamp(.52-xx/rx*.19-yy/ry*.28+(n-.5)*.35);
    rect(c,x+xx,y+yy,1,1,palette[Math.min(palette.length-1,Math.floor(light*palette.length))]);
  }
}
const leafPal={heartlands:['#243b31','#33543a','#436c40','#628548','#829e55','#acb971'],woodland:['#183c32','#24533c','#357149','#4a8a50','#72a45d','#aac37c'],tundra:['#294f4e','#396561','#59877b','#83a997','#b3caba','#e1e7d2'],marsh:['#173b36','#23574a','#367360','#529076','#7ba27f','#a3bc8b'],badlands:['#43462d','#62633d','#7f8249','#969352','#b9ac69','#d1be83'],volcanic:['#383235','#4c4540','#635848','#7e6d50','#9b855e','#b3a47a']};
const metals={leaf:'#82a768',wood:'#b8915d',stone:'#a5aca0',iron:'#bbd2d0',copper:'#db9c68',quartz:'#c3eced',amber:'#e9b650',obsidian:'#8d78ad',moonstone:'#cfc0f7'};

export class PixelArt {
  constructor({worker=true}={}){
    this.tiles=new Map();this.sprites=new Map();this.pending=new Set();this.workers=[];this.terrainQueue=[];this.warmJobs=[];this.protectedTiles=new Set();
    if(worker&&typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'){
      const count=Math.min(2,Math.max(1,(globalThis.navigator?.hardwareConcurrency||2)-1));
      for(let i=0;i<count;i++){
        const w=new Worker(new URL('./terrain-worker.js',import.meta.url),{type:'module'});w.busy=false;
        w.onmessage=({data})=>{this.pending.delete(data.key);w.busy=false;this.cacheTile(data.key,data.bitmap);this.pumpTerrain();};
        w.onerror=()=>{w.terminate();this.pending.delete(w.jobKey);this.workers=this.workers.filter(other=>other!==w);this.worker=this.workers[0]||null;this.pumpTerrain();};
        this.workers.push(w);
      }
      this.worker=this.workers[0];
    }
  }
  pumpTerrain(){
    for(const w of this.workers){
      if(w.busy)continue;
      let job;while(this.terrainQueue.length){const candidate=this.terrainQueue.shift();if(!this.tiles.has(candidate.key)&&!this.pending.has(candidate.key)){job=candidate;break;}}
      if(!job)break;w.busy=true;w.jobKey=job.key;this.pending.add(job.key);w.postMessage(job);
    }
  }
  cacheTile(key,tile){this.tiles.get(key)?.close?.();this.tiles.set(key,tile);if(this.tiles.size>512){const oldest=[...this.tiles.keys()].find(k=>!this.protectedTiles.has(k))??this.tiles.keys().next().value;this.tiles.get(oldest)?.close?.();this.tiles.delete(oldest);}}
  requestCaveAtlas(layer){
    this.caveAtlases??=new Map();const key='cave-atlas:'+layer;
    if(this.caveAtlases.has(layer)||this.pending.has(key))return;
    if(this.worker){this.pending.add(key);const w=new Worker(new URL('./terrain-worker.js',import.meta.url),{type:'module'});
      w.onmessage=({data})=>{this.caveAtlases.set(layer,data.bitmap);this.pending.delete(key);w.terminate();};
      w.onerror=()=>{this.pending.delete(key);w.terminate();this.caveAtlases.set(layer,this.makeCaveAtlas(layer));};
      w.postMessage({key,kind:'cave-atlas',layer});
    }else this.caveAtlases.set(layer,this.makeCaveAtlas(layer));
  }
  requestAtlas(){if(this.atlas||this.pending.has('surface-atlas'))return;if(this.worker){
    this.pending.add('surface-atlas');this.atlasWorker=new Worker(new URL('./terrain-worker.js',import.meta.url),{type:'module'});
    this.atlasWorker.onmessage=({data})=>{this.atlas=data.bitmap;this.pending.delete('surface-atlas');this.atlasWorker.terminate();this.atlasWorker=null;};
    this.atlasWorker.onerror=()=>{this.pending.delete('surface-atlas');this.atlasWorker.terminate();this.atlasWorker=null;this.atlas=this.makeAtlas();};
    this.atlasWorker.postMessage({key:'surface-atlas',kind:'atlas'});
  }else this.atlas=this.makeAtlas();}
  prewarm(bounds,layer){
    const world=LAYERS[layer]||SURFACE;
    this.warmJobs=terrainPlan(bounds,layer,world.width,world.height).filter(j=>j.visible);
    this.warmUntil=performance.now()+10000;
  }
  terrain(ctx,bounds,layer){
    const size=512,world=LAYERS[layer]||SURFACE;
    const signature=`${layer}:${Math.floor(bounds.left/size)}:${Math.ceil(bounds.right/size)}:${Math.floor(bounds.top/size)}:${Math.ceil(bounds.bottom/size)}`;
    if(signature!==this.planSignature){this.planSignature=signature;this.viewPlan=terrainPlan(bounds,layer,world.width,world.height);}
    const plan=this.viewPlan,visibleMissing=[],hiddenMissing=[],hiddenPlan=[];
    this.protectedTiles.clear();
    for(const job of plan){
      const tile=this.tiles.get(job.key);
      const visible=job.gx*size<bounds.right&&(job.gx+1)*size>bounds.left&&job.gy*size<bounds.bottom&&(job.gy+1)*size>bounds.top;
      if(visible)this.protectedTiles.add(job.key);else hiddenPlan.push(job);
      if(!tile&&!this.pending.has(job.key))(visible?visibleMissing:hiddenMissing).push(job);
      if(tile){this.tiles.delete(job.key);this.tiles.set(job.key,tile);if(visible){ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,job.gx*size-.5,job.gy*size-.5,size+1,size+1);}}
    }
    const warming=[];
    if(performance.now()<(this.warmUntil||0))for(const job of this.warmJobs){if(job.layer===layer||this.protectedTiles.size>=512)continue;this.protectedTiles.add(job.key);if(!this.tiles.has(job.key)&&!this.pending.has(job.key))warming.push(job);}
    const hiddenBudget=Math.max(0,512-this.protectedTiles.size),allowedHidden=new Set(hiddenPlan.slice(0,hiddenBudget).map(j=>j.key));
    this.terrainQueue=[...visibleMissing,...warming,...hiddenMissing.filter(j=>allowedHidden.has(j.key))];
    if(this.worker)this.pumpTerrain();
    else if(this.terrainQueue.length){const job=this.terrainQueue[0],tile=this.makeTerrain(job.gx,job.gy,job.layer);this.cacheTile(job.key,tile);if(job.layer===layer&&job.visible)ctx.drawImage(tile,job.gx*size-.5,job.gy*size-.5,size+1,size+1);}
  }
  makeTerrain(gx,gy,layer){
    const tile=canvas(256,256),c=tile.getContext('2d');
    for(let py=0;py<256;py+=4)for(let px=0;px<256;px+=4){
      const x=gx*512+px*2,y=gy*512+py*2,s=layer==='surface'?surfaceSample(x,y):caveSample(x,y,layer);
      const base=s.color.map(v=>Math.round(clamp(v,0,255)));
      rect(c,px,py,4,4,`rgb(${base.join(',')})`);
      for(let i=0;i<4;i++){const n=grain(x+i,y,73),shade=(n-.5)*(s.water?11:23),rgb=base.map(v=>Math.round(clamp(v+shade,0,255)));rect(c,px+Math.floor(n*4),py+Math.floor(grain(y+i,x)*4),s.water?2:1,1,`rgb(${rgb.join(',')})`);}
      const n=grain(x,y,27);
      if(s.water&&n>.96)rect(c,px,py,3,1,'#a1c9b144');
      if(s.bridge&&Math.floor(y/9)%2===0)rect(c,px,py,4,1,'#493c2b66');
      if(layer==='surface'&&!s.water&&!s.bridge&&s.soil<.3&&n>.87){rect(c,px+1,py-2,1,4,'#324c3555');rect(c,px+2,py-1,1,3,'#a6b97855');}
    }
    return tile;
  }
  sprite(key,make){
    if(!this.sprites.has(key)){
      const source=make(),resolution=source.resolution||1,pad=2*resolution;
      const image=canvas(source.image.width+pad*2,source.image.height+pad*2),c=image.getContext('2d');
      // Bake a thin, colored silhouette once, rather than outlining per frame.
      const radius=(source.crispOutline?1:.7)*resolution;c.imageSmoothingEnabled=!source.crispOutline;
      for(const [dx,dy] of (source.crispOutline?[[-1,0],[1,0],[0,-1],[0,1]]:[[-1,0],[1,0],[0,-1],[0,1],[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]]))c.drawImage(source.image,pad+dx*radius,pad+dy*radius);
      c.globalCompositeOperation='source-in';c.fillStyle='#30443ddb';c.fillRect(0,0,image.width,image.height);
      c.globalCompositeOperation='source-over';c.drawImage(source.image,pad,pad);
      this.sprites.set(key,{...source,image,ax:source.ax+pad/resolution,ay:source.ay+pad/resolution});
    }
    return this.sprites.get(key);
  }
  draw(ctx,sprite,x,y,scale=2,opacity=1,flip=false){ctx.save();ctx.translate(x,y);ctx.scale(flip?-scale:scale,scale/CAMERA_TILT);ctx.globalAlpha*=opacity;ctx.imageSmoothingEnabled=!!sprite.smooth;ctx.drawImage(sprite.image,-sprite.ax,-sprite.ay,sprite.image.width/(sprite.resolution||1),sprite.image.height/(sprite.resolution||1));ctx.restore();}
  shadow(ctx,x,y,r=36){if(!this.shadowImage){this.shadowImage=canvas(96,32);const c=this.shadowImage.getContext('2d');oval(c,48,16,46,13,'#111b2148');}ctx.drawImage(this.shadowImage,x-r,y-r*.25,r*2,r*.5);}
  resource(ctx,n,time,player,hovered=false){
    const biome=n.biome||'heartlands',variant=n.variant??Math.floor(grain(n.x,n.y)*12),scale=n.scale||1;
    const key=`${n.kind}:${biome}:${n.resource}:${variant}`;
    const sprite=this.sprite(key,()=>this.makeResource(n.kind,biome,n.resource,variant));
    this.shadow(ctx,n.x,n.y,n.kind==='tree'?52*scale:n.radius);
    const obscures=n.kind==='tree'&&player&&Math.abs(player.x-n.x)<80*scale&&player.y<n.y&&player.y>n.y-190*scale;
    this.draw(ctx,sprite,n.x,n.y-(hovered&&n.kind==='ground'&&n.resource==='stone'?7:0),(n.kind==='tree'?1.65:1.8)*scale,obscures?.5:1);
  }
  makeResource(kind,biome,resource,variant){
    const tree=kind==='tree',image=canvas(tree?112:64,tree?148:66),c=image.getContext('2d'),ax=tree?56:32,ay=tree?138:55;
    const p=leafPal[biome]||leafPal.heartlands;
    if(tree){
      const pine=biome==='tundra'||variant%4===0,willow=biome==='marsh',dead=biome==='volcanic'||biome==='badlands'&&variant%3===0;
      poly(c,[[50,138],[45,139],[51,125],[49,74],[58,67],[63,128],[70,139],[60,136]],'#3c332b');
      rect(c,52,76,6,58,variant%4===2?'#b4b5a0':'#786044');rect(c,57,82,4,47,'#4d4030');
      for(let i=0;i<14;i++)rect(c,52+Math.floor(grain(i,variant)*7),84+i*3,2,2,variant%4===2?'#565d4b':'#a18958');
      stroke(c,[[54,111],[34,84],[24,73]],'#534631',5);stroke(c,[[57,101],[78,69],[82,55]],'#51442f',4);
      if(dead){stroke(c,[[51,88],[45,51],[32,35]],'#746850',4);stroke(c,[[57,75],[63,46],[79,30]],'#8f7e61',3);for(let i=0;i<9;i++)foliage(c,24+grain(i,variant)*63,40+grain(variant,i)*49,9,6,p,i);}
      else if(pine){
        for(let i=4;i>=0;i--){const y=27+i*17,w=13+i*7;poly(c,[[56,y-26],[56-w,y+20],[42,y+17],[56,y+24],[72,y+18],[56+w,y+20]],p[1]);for(let j=0;j<80;j++){const xx=Math.floor(grain(j,i+variant)*w*2-w),yy=Math.floor(grain(i,j+variant)*42-20);if(Math.abs(xx)<(yy+24)/44*w)rect(c,56+xx,y+yy,2+grain(j,variant)*3,1,p[2+Math.floor(grain(j,i,7)*3)]);}}
      }else{
        for(let i=0;i<13;i++){const a=i*2.4,r=i<8?29:14;foliage(c,56+Math.cos(a)*r,57+Math.sin(a)*r*.7,20+grain(i,variant)*11,19+grain(variant,i)*8,p,i+variant*7);}
        if(willow)for(let i=0;i<18;i++){const x=17+i*4;for(let j=0;j<22+grain(i,variant)*17;j++)rect(c,x+Math.sin(j*.25+i)*2,69+j,2,2,p[2+(i%3)]);}
        for(let i=0;i<17;i++){const x=27+grain(i,variant,51)*56,y=34+grain(variant,i,16)*42;if(variant%5===1)rect(c,x,y,2,2,'#cdb16f');}
      }
    }else if(kind==='bush'){
      for(let i=0;i<7;i++)foliage(c,15+i*5,36+Math.sin(i*2)*8,11,12,p,variant+i);
      for(let i=0;i<13;i++)rect(c,13+grain(i,variant)*37,24+grain(variant,i)*25,2,2,variant%3===0?'#c47b70':variant%3===1?'#b5b869':'#9bb2c7');
    }else if(kind==='rock'||kind==='ore'){
      const dark=biome==='volcanic'?'#444552':'#586361';
      poly(c,[[8,44],[13,25],[26,15],[44,17],[56,36],[51,52],[25,57]],dark);
      poly(c,[[13,25],[26,15],[44,17],[38,34],[20,40]],'#9ba494');poly(c,[[20,40],[38,34],[51,52],[25,57]],'#747d72');poly(c,[[38,34],[44,17],[56,36],[51,52]],'#414d4c');
      for(let i=0;i<90;i++){const x=18+grain(i,variant)*28,y=25+grain(variant,i)*23;rect(c,x,y,1+(i%2),1,i%3?'#c1c3a633':'#1f303544');}
      if(kind==='ore')for(let i=0;i<5;i++){const x=18+i*6,y=28+Math.sin(i*2+variant)*7;poly(c,[[x-4,y+9],[x-3,y-5],[x+1,y-10],[x+5,y+4]],metals[resource]||'#c8a070');stroke(c,[[x+1,y-8],[x+1,y+5]],'#ffffff99',1);}
    }else{
      if(resource==='sticks'||resource==='wood'){stroke(c,[[23,54],[40,31]],'#4c3d2c',4);stroke(c,[[24,53],[39,32]],'#bc9866',2);stroke(c,[[31,43],[26,37]],'#aa8556',2);}
      else if(resource==='leaves'){poly(c,[[23,49],[28,34],[43,29],[41,43],[30,53]],'#789c60');stroke(c,[[27,49],[39,34]],'#bad087',1);}
      else {poly(c,[[24,50],[22,43],[28,37],[38,39],[42,47],[34,53]],'#a8b19f');rect(c,27,40,7,2,'#d4d5bc');}
    }
    return {image,ax,ay};
  }
  decoration(ctx,d){const seed=Math.floor(grain(d.x,d.y)*7);const sprite=this.sprite(`decor:${d.kind}:${seed}`,()=>{
    const image=canvas(32,40),c=image.getContext('2d');
    if(d.kind==='crystal'){for(let i=0;i<3;i++)poly(c,[[7+i*8,35],[5+i*8,18-i*4],[9+i*8,9-i*3],[14+i*8,20],[13+i*8,35]],['#668f99','#a6bdc9','#d5d4e6'][i]);}
    else if(d.kind==='mushroom'){for(let i=0;i<3;i++){rect(c,8+i*7,22+i*3,2,12-i*2,'#adbb96');oval(c,9+i*7,22+i*3,6,3,i%2?'#b38160':'#86bfa5');rect(c,7+i*7,20+i*3,2,1,'#dbddb2');}}
    else if(d.kind==='bone'){stroke(c,[[6,32],[25,16]],'#b6ae90',3);rect(c,5,29,5,5,'#d4c5a5');}
    else if(d.kind==='ash'){poly(c,[[7,34],[13,23],[24,26],[27,35]],'#454449');rect(c,14,25,7,2,'#88745b');}
    else for(let i=0;i<7;i++){const x=6+i*3,h=8+grain(i,seed)*20;stroke(c,[[16,36],[x,36-h]],i%2?'#557f4e':'#355c46',1);if(d.kind==='flower')rect(c,x-1,35-h,3,3,['#d5bd71','#be949b','#92b6d0'][seed%3]);if(d.kind==='fern')for(let j=0;j<3;j++)stroke(c,[[x,35-h+j*4],[x-4,32-h+j*4]],'#81a063',1);if(d.kind==='reed')rect(c,x,35-h,2,6,'#a89d6c');}
    return {image,ax:16,ay:36};});this.draw(ctx,sprite,d.x,d.y,1.6);
  }
  hut(ctx,h,index){const sprite=this.sprite(`hut:${index%4}`,()=>{
    const image=canvas(160,160),c=image.getContext('2d');
    oval(c,80,125,66,24,'#2d342a');oval(c,80,112,62,29,'#6f583d');rect(c,20,87,120,28,'#967244');
    for(let i=0;i<19;i++){const x=23+i*6;rect(c,x,84,2,36,'#b29963');rect(c,x+2,86,2,34,'#654d35');}
    poly(c,[[11,94],[30,64],[63,25],[80,10],[97,25],[130,64],[149,94],[132,109],[100,118],[61,118],[28,110]],'#645137');
    for(let y=22;y<117;y++)for(let x=12;x<149;x++){
      const half=(y-12)*.72+2;if(Math.abs(x-80)>half||((x-80)/71)**2+((y-79)/44)**2>1.18&&y>78)continue;
      const light=.7-(x-35)/180+(grain(x,y,index)-.5)*.4;const p=['#5b4c34','#79603b','#967c49','#b1965a','#c6af72','#dcc88c'];rect(c,x,y,1,1,p[Math.floor(clamp(light)*5)]);
    }
    for(let i=0;i<11;i++){const x=20+i*12;stroke(c,[[80,16],[x,96+Math.sin(i*.3)*13]],'#bca16c66',1);}
    poly(c,[[64,127],[64,101],[71,91],[90,91],[99,103],[99,129]],'#44382a');rect(c,70,101,23,27,'#242b26');rect(c,68,99,3,31,'#b29360');rect(c,93,101,3,29,'#715436');
    stroke(c,[[62,129],[98,129]],'#c5b183',3);for(let i=0;i<6;i++)rect(c,40+i*15,121+grain(i,index)*9,5,3,'#7a7f65');
    return {image,ax:80,ay:123};});this.shadow(ctx,h.x,h.y,h.r+20);this.draw(ctx,sprite,h.x,h.y,1.8);
  }
  player(ctx,p,inventory,time){
    const pose=p.moving?Math.floor(time/110)%4:0,back=Math.sin(p.facing)<-.45,side=Math.abs(Math.cos(p.facing))>.7;
    const gear=inventory.equippedGear?.tier||'hide',tool=inventory.equippedTool;
    const key=`player:${pose}:${back}:${side}:${gear}:${tool?.type}:${tool?.tier}:${p.swingUntil>time}`;
    const sprite=this.sprite(key,()=>{
      const image=canvas(56,78),c=image.getContext('2d'),step=[0,2,0,-2][pose],skin=['#c3946d','#c3946d','#c3946d'],cloth=metals[gear]||'#997344';
      rect(c,19,54,7,15+step,skin[0]);rect(c,29,54,7,15-step,skin[1]);rect(c,18,67+step,9,4,'#44392e');rect(c,29,67-step,9,4,'#514331');
      rect(c,15,32,6,21-step,skin[0]);rect(c,36,32,6,21+step,skin[1]);rect(c,15,48-step,5,6,skin[2]);rect(c,38,49+step,5,6,skin[2]);
      poly(c,[[21,29],[34,29],[38,39],[36,57],[18,57],[18,36]],'#443e30');rect(c,21,31,13,24,cloth);
      stroke(c,[[20,32],[34,50]],'#cbb17e',2);rect(c,19,51,18,3,'#524334');rect(c,26,50,4,4,'#c9ad72');
      rect(c,25,25,7,7,skin[0]);oval(c,28,19,10,11,skin[0]);
      poly(c,[[18,18],[18,11],[21,6],[27,4],[34,7],[38,14],[36,23],[33,15],[24,12],[21,21]],'#3b302b');rect(c,23,7,7,2,'#65503a');
      if(back){oval(c,28,17,9,10,'#3b302b');}
      else{rect(c,side?30:23,17,2,3,'#20211c');if(!side)rect(c,31,17,2,3,'#20211c');poly(c,[[22,25],[27,27],[34,24],[32,30],[27,32],[23,28]],'#49382b');}
      if(tool){const x=p.swingUntil>time?44:43,y=p.swingUntil>time?20:34;stroke(c,[[40,53],[x,y]],'#be9e67',3);const metal=metals[tool.tier]||'#bac6bb';if(tool.type==='axe')poly(c,[[x-2,y],[x+10,y-4],[x+11,y+6],[x+2,y+9]],metal);else if(tool.type==='pickaxe')stroke(c,[[x-6,y+2],[x+2,y-3],[x+10,y+1]],metal,3);else oval(c,x+1,y,tool.type==='rock'?5:4,tool.type==='rock'?4:8,metal);}
      return {image,ax:28,ay:69};
    });this.shadow(ctx,p.x,p.y,24);this.draw(ctx,sprite,p.x,p.y,1.55,1,Math.cos(p.facing)<-.7);
  }
  creature(ctx,m,time){
    const pose=Math.floor(time/160+m.seed)%3,key=`mob:${m.kind}:${pose}:${m.shiny}`;
    const sprite=this.sprite(key,()=>{
      const image=canvas(88,78),c=image.getContext('2d'),step=[-2,0,2][pose];
      const fur=m.shiny?'#c3b2db':m.kind==='deer'?'#b58a5d':'#c5b89b';
      if(m.kind==='rabbit'||m.kind==='deer'){
        const deer=m.kind==='deer';for(const x of [25,36,52,62]){rect(c,x,47,4,(deer?18:9)+(x%2?step:-step),'#5c503e');rect(c,x-1,54+(deer?11:0)+(x%2?step:-step),6,3,'#393e34');}
        foliage(c,41,39,deer?26:20,deer?16:13,['#6e5b45','#927955',fur,'#d6c398','#e0d1b1'],13);oval(c,66,29,10,deer?13:10,fur);oval(c,69,33,7,4,'#d8c5a0');rect(c,70,26,2,2,'#182c2d');rect(c,74,32,3,2,'#594a3b');
        oval(c,16,38,5,5,'#eee1bf');for(const x of [60,69]){oval(c,x,13,3,deer?6:12,fur);rect(c,x,7,1,8,'#af8980');}
        if(deer){stroke(c,[[61,20],[56,8],[50,3]],'#dbc39b',2);stroke(c,[[56,9],[47,10]],'#dbc39b',2);stroke(c,[[67,19],[70,6],[77,1]],'#c9b88f',2);for(let i=0;i<13;i++)rect(c,25+grain(i,2)*31,30+grain(2,i)*14,2,1,'#e2c997');}
      }else if(m.kind==='caveBat'){
        const flap=pose*5;poly(c,[[40,32],[22,14-flap],[4,24],[14,46],[25,37],[34,49]],'#66577d');poly(c,[[48,32],[66,14-flap],[84,24],[74,46],[63,37],[54,49]],'#78658c');stroke(c,[[43,38],[22,18-flap],[12,31]],'#b08eaa',1);stroke(c,[[46,38],[67,18-flap],[76,31]],'#b08eaa',1);foliage(c,44,37,11,16,['#2e3442','#49445e','#6a5a72','#8b718d'],7);poly(c,[[34,28],[34,14],[42,25]],'#716080');poly(c,[[48,25],[56,14],[55,29]],'#716080');rect(c,38,31,3,2,'#dba373');rect(c,48,31,3,2,'#dba373');
      }else if(m.kind==='stoneRam'){
        for(const x of [23,34,54,65])rect(c,x,45,5,18+step,'#514e45');foliage(c,43,35,25,20,['#454b48','#666e61','#939882','#b5b79a','#cec6a4'],9);foliage(c,65,36,11,13,['#4d4e46','#767a66','#a2a88c','#c5bd9b'],9);for(const y of [21,39]){oval(c,63,y,10,7,'#5d594c');oval(c,64,y,6,4,'#b5a781');rect(c,62,y-4,7,2,'#d4c399');}rect(c,70,31,3,2,'#eac48c');
      }else{
        const scorpion=m.kind==='rockScorpion';for(const sign of [-1,1])for(let i=0;i<4;i++)stroke(c,[[44+sign*13,29+i*6],[44+sign*28,25+i*9+step],[44+sign*33,31+i*9]],'#736654',3);
        foliage(c,44,40,19,22,scorpion?['#423c33','#70523d','#a0754d','#bc965e','#d2b477']:['#283c3a','#3c5751','#627b67','#8da07b','#b8bb8a'],4);
        for(let i=0;i<4;i++)stroke(c,[[30,29+i*8],[44,33+i*8],[57,29+i*8]],'#29392f88',2);
        rect(c,37,24,3,2,'#f0bd6e');rect(c,48,24,3,2,'#f0bd6e');
        if(scorpion){stroke(c,[[45,57],[59,66],[73,59],[76,38],[69,28]],'#b89965',7);poly(c,[[68,22],[77,34],[64,33]],'#dec489');for(const x of [15,69]){oval(c,x,19,9,6,'#927246');stroke(c,[[x-5,15],[x,10],[x+5,15]],'#d0a66a',3);}}
      }
      if(m.shiny)for(let i=0;i<7;i++){const x=12+grain(i,m.seed)*65,y=grain(m.seed,i)*25;rect(c,x,y,1,5,'#ecd7ff');rect(c,x-2,y+2,5,1,'#ecd7ff');}
      return {image,ax:44,ay:m.kind==='rabbit'?60:m.kind==='deer'?68:64};
    });this.shadow(ctx,m.x,m.y,m.radius);this.draw(ctx,sprite,m.x,m.y,m.kind==='rabbit'?1.1:1.55,1,Math.cos(m.facing)<0);
  }
  fire(ctx,x,y,time,lit=true){this.shadow(ctx,x,y,42);for(let i=0;i<8;i++){const a=i*Math.PI/4;rect(ctx,x+Math.cos(a)*32-7,y+Math.sin(a)*22-4,14,9,i%2?'#899080':'#636d66');}stroke(ctx,[[x-25,y-8],[x+25,y+10]],'#89623f',10);stroke(ctx,[[x-25,y+10],[x+25,y-8]],'#bd955b',8);if(lit){const h=47+Math.sin(time*.009)*6;poly(ctx,[[x-18,y],[x-13,y-25],[x-2,y-h],[x+6,y-21],[x+13,y-35],[x+18,y],[x,y+6]],'#e69a4e');poly(ctx,[[x-9,y],[x,y-29],[x+10,y],[x,y+5]],'#ffe5a0');for(let i=0;i<4;i++)rect(ctx,x+Math.sin(i+time*.001)*18,y-20-((time*.025+i*17)%60),3,3,'#efbc7377');}}
}
