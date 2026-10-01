import { EXTRA_CAVES,LAYERS,caveGeometry } from './world.js';
import { WorldRenderer } from './renderer.js';
import { grain } from './pixel-art.js';
import { AdventureArt } from './adventure-art.js';
import { CAMERA_TILT, worldToScreen } from './camera.js';
import { BIOMES, SURFACE, CAVES, DEEP_CAVES, HUTS, PORTALS, DESCENTS, LANDMARKS, CAVE_ROOMS, DEEP_ROOMS, LAKES, distanceToSegment } from './world.js';
import { BRIDGE_SPANS, RIVER_SEGMENTS, riverDistance } from './bridges.js';

const clampHealth=(health,max)=>Math.max(0,Math.min(1,health/Math.max(1,max)));

export class PixelWorldRenderer extends WorldRenderer {
  constructor(canvas){super(canvas);this.art=new AdventureArt();}
  resize(){
    // Pixel art needs one backing pixel per CSS pixel, not a costly retina-sized buffer.
    this.dpr=1;this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;
    this.canvas.width=Math.round(this.width);this.canvas.height=Math.round(this.height);
  }
  render({camera,zoom,player,layer,zones,showZones,selectedZone,editZones,spawnables,structures,creatures,drops,projectiles,fishing,targetNode,targetDrop,inventory,time}){
    const ctx=this.ctx,d=this.dpr,b=this.viewBounds(camera,zoom);
    ctx.setTransform(d,0,0,d,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle=layer==='surface'?'#60764a':'#202b2e';ctx.fillRect(0,0,this.width,this.height);
    ctx.save();ctx.translate(this.width/2,this.height/2);ctx.scale(zoom,zoom*CAMERA_TILT);ctx.translate(-camera.x,-camera.y);
    this.art.terrain(ctx,b,layer);
    if(layer==='surface')this.drawWaterMotion(ctx,b,time);
    const visible=(x,y,pad=300)=>x>b.left-pad&&x<b.right+pad&&y>b.top-pad&&y<b.bottom+pad;
    const objects=[];
    const items=spawnables.visible({...b,top:b.top-180,bottom:b.bottom+220},layer);
    for(const decoration of items.decorations)this.art.decoration(ctx,decoration);
    for(const node of items.nodes)objects.push({y:node.y,draw:()=>this.art.resource(ctx,node,time,player)});
    if(layer==='surface'){
      HUTS.forEach((hut,index)=>{if(visible(hut.x,hut.y))objects.push({y:hut.y,draw:()=>this.art.hut(ctx,hut,index)});});
      if(visible(9000,6850))objects.push({y:6850,draw:()=>this.art.fire(ctx,9000,6850,time)});
      for(const landmark of LANDMARKS.filter(l=>l.layer==='surface'&&l.type!=='village'&&visible(l.x,l.y,500)))objects.push({y:landmark.y,draw:()=>this.landmark(ctx,landmark,time)});
    }
    for(const portal of [...PORTALS,...DESCENTS]){const p=portal[layer];if(p&&visible(p.x,p.y))objects.push({y:p.y,draw:()=>this.portal(ctx,p,portal,layer)});}
    for(const fire of structures.visible(b,layer))objects.push({y:fire.y,draw:()=>this.art.fire(ctx,fire.x,fire.y,time,fire.fuel>0)});
    const visibleCreatures=creatures.visible({...b,bottom:b.bottom+100},layer);
    for(const creature of visibleCreatures)objects.push({y:creature.y,draw:()=>{this.art.creature(ctx,creature,time);if(creature.charger&&creature.windupUntil>time){ctx.strokeStyle='#ef996a';ctx.lineWidth=4;ctx.strokeRect(creature.x-43,creature.y-38,86,76);}}});
    objects.push({y:player.y,draw:()=>this.art.player(ctx,player,inventory,time,fishing)});
    objects.sort((a,b)=>a.y-b.y);for(const object of objects)object.draw();
    if(layer==='surface'&&fishing?.active){
      const {x,y}=fishing.castPoint;
      const tip=this.art.fishingRodTip(player,fishing);
      ctx.strokeStyle='#fff2cf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(x,y);ctx.stroke();
      ctx.fillStyle='#e7efec';ctx.fillRect(x-5,y-5,10,6);ctx.fillStyle=fishing.ready?'#c6d9b2':'#87969b';ctx.fillRect(x-5,y+1,10,7);
      if(fishing.ready){ctx.strokeStyle='#fff0ad';ctx.lineWidth=3;const ripple=14+Math.sin(time*.012)*5;ctx.beginPath();ctx.ellipse(x,y+3,ripple,ripple*.5,0,0,Math.PI*2);ctx.stroke();}
    }
    this.drawDrops(ctx,drops,layer,b,targetDrop,time);this.drawProjectiles(ctx,projectiles,layer,b,time);
    if(targetNode){const n=targetNode,r=n.radius+12;ctx.strokeStyle='#eee0a6bb';ctx.lineWidth=3;for(const sx of [-1,1])for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(n.x+sx*r,n.y+sy*(r*.5-9));ctx.lineTo(n.x+sx*r,n.y+sy*r*.5);ctx.lineTo(n.x+sx*(r-12),n.y+sy*r*.5);ctx.stroke();}if(n.quantity<n.maxQuantity&&n.blocking){ctx.fillStyle='#1e342c';ctx.fillRect(n.x-30,n.y+32,60,7);ctx.fillStyle='#dbbb77';ctx.fillRect(n.x-28,n.y+34,56*n.quantity/n.maxQuantity,3);}}
    // Small drifting pollen and cave spores provide motion without a light cone.
    for(let i=0;i<16;i++){const x=camera.x+(grain(i,19)-.5)*(b.right-b.left)+Math.sin(time*.0002+i)*30,y=camera.y+(grain(91,i)-.5)*(b.bottom-b.top)+Math.sin(time*.0003+i)*15;ctx.fillStyle=layer==='surface'?'#e4dbab55':'#9dc9c255';ctx.fillRect(x,y,2+grain(i,3)*3,2);}
    if(showZones)this.drawZones(ctx,zones.forLayer(layer),selectedZone,zoom,editZones);
    ctx.restore();
    this.drawMobTags(visibleCreatures,camera,zoom);
  }
  drawWaterMotion(ctx,b,time){
    const flowing=RIVER_SEGMENTS.filter(s=>s.right>b.left-90&&s.left<b.right+90&&s.bottom>b.top-90&&s.top<b.bottom+90);
    const bridges=BRIDGE_SPANS.filter(s=>s.x+s.length>b.left-120&&s.x-s.length<b.right+120&&s.y+s.length>b.top-120&&s.y-s.length<b.bottom+120);
    const lakes=LAKES.filter(l=>l.x+l.rx>b.left&&l.x-l.rx<b.right&&l.y+l.ry>b.top&&l.y-l.ry<b.bottom);
    const step=38,animationFrame=Math.floor(time/170);
    for(let gy=Math.floor(b.top/step)-1;gy<=Math.ceil(b.bottom/step);gy++)for(let gx=Math.floor(b.left/step)-1;gx<=Math.ceil(b.right/step);gx++){
      if(grain(gx,gy,31)<.42)continue;
      const x=gx*step+Math.floor(grain(gx,gy,45)*20),y=gy*step+Math.floor(grain(gx,gy,47)*17);
      if(riverDistance(x,y,flowing)>71&&!lakes.some(l=>((x-l.x)/l.rx)**2+((y-l.y)/l.ry)**2<.83))continue;
      if(bridges.some(s=>distanceToSegment(x,y,s.x,s.y,s.x+Math.cos(s.angle)*s.length,s.y+Math.sin(s.angle)*s.length)<59))continue;
      const length=grain(gx,gy,57)>.76?8:4;
      const frame=(animationFrame+Math.floor(grain(gx,gy,61)*4))%4;
      ctx.fillStyle='#9de9ed';ctx.fillRect(x,y+2,length,1);
      ctx.fillStyle='#e5fff3';
      if(frame===0){ctx.fillRect(x+1,y,Math.max(2,length-2),1);ctx.fillRect(x+2,y+2,2,1);}
      else if(frame===1){ctx.fillRect(x+1,y+1,Math.max(2,length-2),1);ctx.fillRect(x+length-2,y+3,2,1);}
      else if(frame===2){ctx.fillRect(x+1,y+3,Math.max(2,length-2),1);ctx.fillRect(x,y+1,2,1);}
      else{ctx.fillRect(x+1,y+4,Math.max(2,length-2),1);ctx.fillRect(x+length-2,y+2,2,1);}
    }
  }
  drawMobTags(creatures,camera,zoom){
    const ctx=this.ctx;
    ctx.save();ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 11px system-ui, sans-serif';
    for(const mob of creatures){
      const at=worldToScreen(mob.x,mob.y,camera,zoom,this.width,this.height);
      if(at.x<-90||at.x>this.width+90||at.y<-100||at.y>this.height+80)continue;
      const tagHeight=['emberGolem','crystalBeetle','deer'].includes(mob.kind)?110:80;
      const top=at.y-Math.max(27,tagHeight*zoom),width=Math.max(72,Math.min(126,ctx.measureText(mob.name).width+19)),x=at.x-width/2;
      ctx.fillStyle='#26394bdf';ctx.fillRect(Math.round(x),Math.round(top-19),Math.round(width),19);
      ctx.fillStyle=mob.shiny?'#ffe49a':'#fff7df';ctx.fillText(mob.name,at.x,top-9);
      ctx.fillStyle='#26394b';ctx.fillRect(Math.round(x),Math.round(top+2),Math.round(width),8);
      ctx.fillStyle=mob.temperament==='hostile'?'#ff786d':'#79dc82';
      ctx.fillRect(Math.round(x+2),Math.round(top+4),Math.round((width-4)*clampHealth(mob.health,mob.maxHealth)),4);
    }
    ctx.restore();
  }
  drawOverview(canvas,layer,player,zones=null,showZones=false){
    if(!EXTRA_CAVES[layer])return super.drawOverview(canvas,layer,player,zones,showZones);
    const c=canvas.getContext('2d'),world=LAYERS[layer],{rooms,tunnels}=caveGeometry(layer),scale=Math.min(canvas.width/world.width,canvas.height/world.height);
    c.setTransform(1,0,0,1,0,0);c.fillStyle='#252d48';c.fillRect(0,0,canvas.width,canvas.height);c.save();c.scale(scale,scale);c.strokeStyle='#9583b5';c.fillStyle='#baabc5';
    for(const t of tunnels){c.lineWidth=t.width;c.beginPath();t.points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
    for(const r of rooms){c.beginPath();c.arc(r.x,r.y,r.r,0,Math.PI*2);c.fill();}
    for(const p of DESCENTS){if(p[layer]){c.fillStyle='#ffb878';c.fillRect(p[layer].x-70,p[layer].y-70,140,140);}}
    c.fillStyle='#fff4b2';c.beginPath();c.arc(player.x,player.y,6/scale,0,Math.PI*2);c.fill();c.restore();
  }
  drawSurface(ctx,b,zoom,overview=false){
    if(!overview){this.art.terrain(ctx,b,'surface');return;}
    ctx.fillStyle='#788c5b';ctx.fillRect(0,0,SURFACE.width,SURFACE.height);
    const palette={woodland:'#39b473',tundra:'#a9decf',marsh:'#5fbd9c',badlands:'#e9a766',volcanic:'#867f9e'};
    for(const biome of BIOMES){ctx.beginPath();biome.polygon.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=palette[biome.id];ctx.fill();}
    this.drawRiver(ctx);for(const lake of LAKES){ctx.fillStyle='#2c8bc7';ctx.beginPath();ctx.ellipse(lake.x,lake.y,lake.rx,lake.ry,0,0,Math.PI*2);ctx.fill();}this.drawPaths(ctx,true);
    ctx.fillStyle='#cbb88c';ctx.beginPath();ctx.arc(9000,7000,600,0,Math.PI*2);ctx.fill();this.drawPortals(ctx,'surface',b,true);
  }
  portal(ctx,p,portal,layer){
    const sprite=this.art.sprite(`portal:${!!portal.deep}:${layer}`,()=>{
      const image=document.createElement('canvas');image.width=140;image.height=120;const c=image.getContext('2d');
      c.fillStyle='#1b292b';c.beginPath();c.moveTo(24,100);c.lineTo(28,60);c.lineTo(49,36);c.lineTo(81,27);c.lineTo(109,52);c.lineTo(117,99);c.closePath();c.fill();
      const shades=portal.deep?['#696777','#858596','#a9a1ad']:['#68736b','#8b9582','#b3b497'];
      for(let i=0;i<13;i++){const a=Math.PI+i*Math.PI/12,x=70+Math.cos(a)*48,y=91+Math.sin(a)*58;c.fillStyle=shades[i%3];c.fillRect(Math.round(x-12),Math.round(y-9),24,19);c.fillStyle='#34463b88';c.fillRect(x-10,y+5,22,5);c.fillStyle='#d0c8a744';c.fillRect(x-9,y-9,13,2);}
      for(let i=0;i<5;i++){c.fillStyle=i%2?'#445949':'#8a9880';c.fillRect(42-i*3,85+i*4,55+i*6,3);}
      for(let i=0;i<30;i++){const x=22+grain(i,4)*99,y=24+grain(9,i)*78;if(x<40||x>100){c.fillStyle='#537c56';c.fillRect(x,y,3,5);}}
      return {image,ax:70,ay:97};
    });this.art.shadow(ctx,p.x,p.y,115);this.art.draw(ctx,sprite,p.x,p.y,2.05);
    this.text(ctx,portal.name,p.x,p.y+67,23,layer==='surface'?'#e3dfb9':'#c9c1d8');
  }
  landmark(ctx,l,time){
    if(l.type==='pool')return;
    if(l.type==='root'){const sprite=this.art.sprite('ancient-tree',()=>this.art.makeResource('tree','woodland','wood',3));this.art.shadow(ctx,l.x,l.y,150);this.art.draw(ctx,sprite,l.x,l.y,4.4);}
    else if(l.type==='ice'){for(let i=0;i<5;i++){const node={kind:'ore',biome:'tundra',resource:'quartz',variant:i};const sprite=this.art.sprite(`spire${i}`,()=>this.art.makeResource(node.kind,node.biome,node.resource,i));this.art.draw(ctx,sprite,l.x+(i-2)*55,l.y-Math.sin(i)*40,3.4);}}
    else if(l.type==='crater'){ctx.fillStyle='#393938';ctx.beginPath();ctx.ellipse(l.x,l.y,205,170,0,0,Math.PI*2);ctx.fill();for(let i=0;i<35;i++){const a=i*2.4,r=120+grain(i,7)*55;ctx.fillStyle=i%3?'#815c48':'#cd8655';ctx.fillRect(l.x+Math.cos(a)*r-14,l.y+Math.sin(a)*r-10,28,20);}ctx.fillStyle='#ac6946';ctx.beginPath();ctx.ellipse(l.x,l.y,99,76,0,0,Math.PI*2);ctx.fill();}
    else if(l.type==='fossil'){ctx.strokeStyle='#cbc2a1';ctx.lineWidth=14;for(let i=0;i<8;i++){const x=l.x+(i-4)*42;ctx.beginPath();ctx.moveTo(x-20,l.y-75);ctx.lineTo(x+12,l.y-50);ctx.lineTo(x+30,l.y+9);ctx.lineTo(x+10,l.y+75);ctx.stroke();}ctx.strokeStyle='#857f69';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(l.x-190,l.y);ctx.lineTo(l.x+195,l.y+10);ctx.stroke();}
    else {for(let i=0;i<7;i++){const a=i*Math.PI*2/7,x=l.x+Math.cos(a)*130,y=l.y+Math.sin(a)*110;ctx.fillStyle='#4c5d53';ctx.fillRect(x-20,y-100,45,103);ctx.fillStyle='#a0a68a';ctx.fillRect(x-20,y-100,14,99);ctx.fillStyle='#738a63';ctx.fillRect(x-25,y-10,53,13);}}
    this.text(ctx,l.name,l.x,l.y+210,24,'#e3dfb9');
  }
  text(ctx,text,x,y,size,color){ctx.save();ctx.font=`800 ${size}px system-ui,sans-serif`;ctx.textAlign='center';ctx.shadowColor='#28333f';ctx.shadowBlur=3;ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();}
  drawDrops(ctx,registry,layer,bounds,target,time){
    for(const drop of registry.visible(bounds,layer)){const v=drop.visual(time);this.art.shadow(ctx,drop.landX,drop.landY,15);ctx.fillStyle=target===drop?'#ffe8a2':'#cdba87';ctx.fillRect(v.x-11,v.y-v.height-11,22,22);ctx.fillStyle=drop.resource==='meat'?'#af6455':'#697e69';ctx.fillRect(v.x-8,v.y-v.height-8,16,16);ctx.fillStyle='#fff3c1';ctx.fillRect(v.x-6,v.y-v.height-8,8,3);if(drop.landed(time))this.text(ctx,`${drop.amount} ${drop.resource}`,drop.landX,drop.landY-35,17,'#f0e3b8');}
  }
  drawProjectiles(ctx,registry,layer,bounds){for(const rock of registry.visible(bounds,layer)){ctx.fillStyle='#514d40';ctx.fillRect(rock.x-11,rock.y-9,22,19);ctx.fillStyle='#bda27b';ctx.fillRect(rock.x-9,rock.y-9,17,8);ctx.fillStyle='#e5cc94';ctx.fillRect(rock.x-6,rock.y-9,8,3);}}
}
