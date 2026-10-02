import { BIOMES, DEFAULT_BIOME, SURFACE, CAVES, DEEP_CAVES, PATHS, RIVER, PORTALS, DESCENTS, HUTS, LANDMARKS, CAVE_ROOMS, TUNNELS, DEEP_ROOMS, DEEP_TUNNELS, biomeAt, canWalk } from './world.js';
import { CAMERA_TILT, worldToScreen, screenToWorld, viewBounds } from './camera.js';

const TAU = Math.PI * 2;
const hash = (x,y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const surfaceInk = '#314738';

function polygon(ctx, points) { ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i=1;i<points.length;i++) ctx.lineTo(points[i].x,points[i].y); ctx.closePath(); }
function line(ctx, points) { ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]); for (let i=1;i<points.length;i++) ctx.lineTo(points[i][0], points[i][1]); }
function circle(ctx,x,y,r) { ctx.beginPath(); ctx.arc(x,y,r,0,TAU); }
function label(ctx,text,x,y,{size=33,color='#20382c',align='center',weight=700,shadow=false}={}) {
  ctx.save(); ctx.font = `${weight} ${size}px 'Space Grotesk', system-ui, sans-serif`; ctx.textAlign=align; ctx.textBaseline='middle';
  if (shadow) { ctx.shadowColor='#101913bb'; ctx.shadowBlur=12; }
  ctx.fillStyle=color; ctx.fillText(text,x,y); ctx.restore();
}

export class WorldRenderer {
  constructor(canvas) { this.canvas=canvas; this.ctx=canvas.getContext('2d',{alpha:false}); this.dpr=1; this.width=0; this.height=0; this.resize(); }
  resize() {
    this.dpr=Math.min(devicePixelRatio || 1,2);
    this.width=this.canvas.clientWidth; this.height=this.canvas.clientHeight;
    this.canvas.width=Math.round(this.width*this.dpr); this.canvas.height=Math.round(this.height*this.dpr);
  }
  viewBounds(camera,zoom) { return viewBounds(camera,zoom,this.width,this.height); }
  screenToWorld(sx,sy,camera,zoom) { return screenToWorld(sx,sy,camera,zoom,this.width,this.height); }
  render({camera,zoom,player,layer,zones,showZones,selectedZone,editZones,spawnables,structures,creatures,drops,projectiles,targetNode,targetDrop,inventory,time}) {
    const ctx=this.ctx, d=this.dpr;
    ctx.setTransform(d,0,0,d,0,0); ctx.clearRect(0,0,this.width,this.height);
    ctx.fillStyle=layer==='surface'?'#293d31':layer==='deep'?'#101219':'#151617';ctx.fillRect(0,0,this.width,this.height);
    ctx.save();ctx.translate(this.width/2,this.height/2);ctx.scale(zoom,zoom*CAMERA_TILT);ctx.translate(-camera.x,-camera.y);
    const bounds=this.viewBounds(camera,zoom);
    if(layer==='surface') this.drawSurface(ctx,bounds,zoom,false);
    else if(layer==='deep')this.drawDeep(ctx,bounds,zoom,false);
    else this.drawCaves(ctx,bounds,zoom,false);
    this.drawSpawnables(ctx,spawnables,layer,bounds,targetNode,time);
    this.drawStructures(ctx,structures,layer,bounds,time);
    this.drawDrops(ctx,drops,layer,bounds,targetDrop,time);
    this.drawCreatures(ctx,creatures,layer,bounds,time);
    this.drawProjectiles(ctx,projectiles,layer,bounds,time);
    if(showZones) this.drawZones(ctx,zones.forLayer(layer),selectedZone,zoom,editZones);
    ctx.restore();
    const at=worldToScreen(player.x,player.y,camera,zoom,this.width,this.height);
    ctx.save();ctx.setTransform(d,0,0,d,0,0);ctx.translate(at.x,at.y);ctx.scale(zoom*1.2,zoom*1.2);this.drawPlayer(ctx,player,inventory,time);ctx.restore();
  }
  drawStructures(ctx,structures,layer,bounds,time){
    if(!structures)return;
    for(const fire of structures.visible(bounds,layer)){
      ctx.save();ctx.translate(fire.x,fire.y);
      circle(ctx,0,9,48);ctx.fillStyle='#27251d77';ctx.fill();
      for(let i=0;i<7;i++){const a=i*TAU/7;circle(ctx,Math.cos(a)*34,Math.sin(a)*27,13);ctx.fillStyle=i%2?'#858777':'#aaa28a';ctx.fill();ctx.strokeStyle='#55564d';ctx.lineWidth=3;ctx.stroke();}
      ctx.save();ctx.rotate(.35);ctx.fillStyle='#785137';ctx.fillRect(-39,-7,78,14);ctx.restore();ctx.save();ctx.rotate(-.4);ctx.fillStyle='#a47348';ctx.fillRect(-37,-6,74,12);ctx.restore();
      if(fire.fuel>0){const flicker=Math.sin(time*.01+fire.x)*5;ctx.beginPath();ctx.moveTo(-16,7);ctx.quadraticCurveTo(-27,-20,0,-48-flicker);ctx.quadraticCurveTo(9,-22,17,5);ctx.closePath();ctx.fillStyle='#ed9149';ctx.fill();ctx.beginPath();ctx.moveTo(-8,5);ctx.quadraticCurveTo(-8,-12,2,-26-flicker*.4);ctx.quadraticCurveTo(13,-10,9,5);ctx.closePath();ctx.fillStyle='#ffdd8a';ctx.fill();}
      ctx.restore();
    }
  }
  drawSurface(ctx,bounds,zoom,overview=false) {
    ctx.fillStyle=DEFAULT_BIOME.color;ctx.fillRect(0,0,SURFACE.width,SURFACE.height);
    for(const biome of BIOMES){ polygon(ctx,biome.polygon);ctx.fillStyle=biome.color;ctx.fill();ctx.strokeStyle=biome.edge+'aa';ctx.lineWidth=22;ctx.stroke(); }
    this.drawRiver(ctx);
    this.drawPaths(ctx,overview);
    // A broad clear village gathering ground remains readable even at overview scale.
    circle(ctx,9000,7000,740);ctx.fillStyle='#c9bb8a';ctx.fill();ctx.strokeStyle='#a89871';ctx.lineWidth=16;ctx.stroke();
    if(!overview){this.drawGroundMarks(ctx,bounds);this.drawVillage(ctx);this.drawLandmarks(ctx,bounds,zoom);}
    this.drawPortals(ctx,'surface',bounds,overview);
    ctx.strokeStyle='#213b31';ctx.lineWidth=55;ctx.strokeRect(0,0,SURFACE.width,SURFACE.height);
  }
  drawRiver(ctx){
    ctx.lineJoin='round';ctx.lineCap='round';line(ctx,RIVER);ctx.strokeStyle='#557e80';ctx.lineWidth=210;ctx.stroke();
    line(ctx,RIVER);ctx.strokeStyle='#83aeaa';ctx.lineWidth=166;ctx.stroke();
  }
  drawPaths(ctx,overview){
    ctx.lineJoin='round';ctx.lineCap='round';
    for(const path of PATHS){
      line(ctx,path.points);
      ctx.strokeStyle=overview?'#e7d7aa':'#b9a67d';
      ctx.lineWidth=overview?55:94;
      ctx.stroke();
    }
  }
  drawGroundMarks(ctx,b){
    const spacing=175;
    for(let gy=Math.max(0,Math.floor(b.top/spacing)-1);gy<=Math.min(80,Math.ceil(b.bottom/spacing)+1);gy++){
      for(let gx=Math.max(0,Math.floor(b.left/spacing)-1);gx<=Math.min(103,Math.ceil(b.right/spacing)+1);gx++){
        const h=hash(gx,gy);if(h<.22)continue;
        const x=gx*spacing+(hash(gx+4,gy)-.5)*110,y=gy*spacing+(hash(gx,gy+6)-.5)*110;
        if(Math.hypot(x-9000,y-7000)<790)continue;
        const biome=biomeAt(x,y).id;
        ctx.save();ctx.translate(x,y);ctx.rotate((h-.5)*2);
        ctx.strokeStyle=biome==='tundra'?'#edf1df70':biome==='badlands'?'#794f4270':biome==='volcanic'?'#493e3b70':'#335a4270';
        ctx.lineWidth=3;ctx.lineCap='round';
        if(biome==='badlands'||biome==='volcanic'){ctx.beginPath();ctx.moveTo(-15,-2);ctx.lineTo(0,-9);ctx.lineTo(20,-3);ctx.stroke();}
        else if(biome==='tundra'){ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(0,-10);ctx.lineTo(9,0);ctx.moveTo(0,-10);ctx.lineTo(0,9);ctx.stroke();}
        else if(biome==='marsh'){ctx.beginPath();ctx.arc(0,0,15,Math.PI*.2,Math.PI*.85);ctx.stroke();}
        else {ctx.beginPath();ctx.moveTo(-9,8);ctx.quadraticCurveTo(-13,-8,-4,-10);ctx.moveTo(4,8);ctx.quadraticCurveTo(2,-10,11,-13);ctx.stroke();}
        ctx.restore();
      }
    }
  }
  drawVillage(ctx){
    for(const hut of HUTS){
      circle(ctx,hut.x+9,hut.y+19,hut.r+16);ctx.fillStyle='#586a4d66';ctx.fill();
      circle(ctx,hut.x,hut.y,hut.r+10);ctx.fillStyle='#573e30';ctx.fill();
      circle(ctx,hut.x,hut.y,hut.r);ctx.fillStyle='#9b7047';ctx.fill();
      circle(ctx,hut.x,hut.y,hut.r-20);ctx.strokeStyle='#d5ad6b';ctx.lineWidth=9;ctx.stroke();
      ctx.beginPath();ctx.moveTo(hut.x-hut.r*.7,hut.y+hut.r*.25);ctx.lineTo(hut.x,hut.y-hut.r*.85);ctx.lineTo(hut.x+hut.r*.7,hut.y+hut.r*.25);ctx.strokeStyle='#e0b578';ctx.lineWidth=13;ctx.stroke();
      ctx.beginPath();ctx.moveTo(hut.x,hut.y+hut.r*.28);ctx.lineTo(hut.x,hut.y+hut.r*.92);ctx.strokeStyle='#342c25';ctx.lineWidth=38;ctx.stroke();
    }
    circle(ctx,9000,7000,112);ctx.fillStyle='#7d6d54';ctx.fill();
    circle(ctx,9000,7000,78);ctx.fillStyle='#f2ac5e';ctx.fill();
    circle(ctx,9000,7000,42);ctx.fillStyle='#ffdf94';ctx.fill();
    label(ctx,'THE HEARTH',9000,7210,{size:45,color:'#564d35'});
  }
  drawLandmarks(ctx,b,zoom){
    const visible=LANDMARKS.filter(l=>l.layer==='surface'&&l.type!=='village'&&l.x>b.left-600&&l.x<b.right+600&&l.y>b.top-600&&l.y<b.bottom+600);
    for(const l of visible){ctx.save();ctx.translate(l.x,l.y);
      if(l.type==='stones'){for(let i=0;i<7;i++){const a=i*TAU/7;ctx.save();ctx.translate(Math.cos(a)*150,Math.sin(a)*135);ctx.rotate(a);ctx.fillStyle='#a2a18a';ctx.fillRect(-24,-57,48,114);ctx.strokeStyle='#5c6656';ctx.lineWidth=8;ctx.strokeRect(-24,-57,48,114);ctx.restore();}}
      else if(l.type==='root'){circle(ctx,0,0,160);ctx.fillStyle='#527556';ctx.fill();for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(Math.cos(i)*90,Math.sin(i)*90,Math.cos(i*TAU/7)*230,Math.sin(i*TAU/7)*230);ctx.strokeStyle='#5e4733';ctx.lineWidth=18;ctx.stroke();}}
      else if(l.type==='ice'){ctx.beginPath();ctx.moveTo(-90,100);ctx.lineTo(-20,-160);ctx.lineTo(45,-70);ctx.lineTo(80,100);ctx.closePath();ctx.fillStyle='#e0e7dc';ctx.fill();ctx.strokeStyle='#789b9b';ctx.lineWidth=10;ctx.stroke();}
      else if(l.type==='fossil'){ctx.beginPath();ctx.ellipse(0,0,210,98,-.4,0,TAU);ctx.strokeStyle='#eee0b3';ctx.lineWidth=25;ctx.stroke();for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*63,-120);ctx.quadraticCurveTo(i*70+40,-5,i*55,100);ctx.stroke();}}
      else if(l.type==='pool'){circle(ctx,0,0,205);ctx.fillStyle='#4e7976';ctx.fill();circle(ctx,0,0,172);ctx.fillStyle='#9bc4b1';ctx.fill();circle(ctx,0,0,117);ctx.strokeStyle='#e0e3b777';ctx.lineWidth=7;ctx.stroke();}
      else if(l.type==='crater'){circle(ctx,0,0,240);ctx.fillStyle='#463b38';ctx.fill();circle(ctx,0,0,177);ctx.strokeStyle='#dca16e';ctx.lineWidth=44;ctx.stroke();circle(ctx,0,0,105);ctx.fillStyle='#bd6c46';ctx.fill();}
      ctx.restore();if(zoom>.4)label(ctx,l.name.toUpperCase(),l.x,l.y+285,{size:28,color:surfaceInk,shadow:true});
    }
  }
  drawPortals(ctx,layer,b,overview){
    for(const p of [...PORTALS,...DESCENTS]){const pos=p[layer];if(!pos)continue;if(!overview&&(pos.x<b.left-200||pos.x>b.right+200||pos.y<b.top-200||pos.y>b.bottom+200))continue;
      const r=overview?95:104;
      const descent=!!p.deep;
      circle(ctx,pos.x,pos.y,r+35);ctx.fillStyle=descent?'#75678e':layer==='surface'?'#d9bd86':'#8d7962';ctx.fill();
      circle(ctx,pos.x,pos.y,r);ctx.fillStyle=descent?'#221e31':'#252928';ctx.fill();ctx.strokeStyle=descent?'#b29bd1':'#aa8764';ctx.lineWidth=18;ctx.stroke();
      ctx.beginPath();ctx.arc(pos.x,pos.y+8,r*.62,Math.PI,TAU);ctx.strokeStyle=descent?'#dbc7f1':'#d8b58b';ctx.lineWidth=13;ctx.stroke();
      if(!overview)label(ctx,layer==='surface'?p.name.toUpperCase():layer==='deep'?'ASCEND':descent?'DESCEND':'EXIT',pos.x,pos.y+178,{size:27,color:layer==='surface'?'#21382d':'#e8d2ac'});
    }
  }
  drawCaves(ctx,b,zoom,overview=false){
    ctx.fillStyle='#171819';ctx.fillRect(0,0,CAVES.width,CAVES.height);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const tunnel of TUNNELS){line(ctx,tunnel.points);ctx.strokeStyle='#433f3b';ctx.lineWidth=tunnel.width+115;ctx.stroke();}
    for(const room of CAVE_ROOMS){circle(ctx,room.x,room.y,room.r+55);ctx.fillStyle='#433f3b';ctx.fill();}
    for(const tunnel of TUNNELS){line(ctx,tunnel.points);ctx.strokeStyle='#827363';ctx.lineWidth=tunnel.width;ctx.stroke();line(ctx,tunnel.points);ctx.strokeStyle='#a08c71';ctx.lineWidth=tunnel.width-70;ctx.stroke();}
    for(const room of CAVE_ROOMS){circle(ctx,room.x,room.y,room.r);ctx.fillStyle='#a08c71';ctx.fill();circle(ctx,room.x,room.y,room.r-65);ctx.fillStyle='#ab9679';ctx.fill();}
    if(!overview){
      for(const room of CAVE_ROOMS){if(room.x<b.left-700||room.x>b.right+700||room.y<b.top-700||room.y>b.bottom+700)continue;
        circle(ctx,room.x,room.y,room.r*.75);ctx.strokeStyle='#ddd2aa33';ctx.lineWidth=5;ctx.setLineDash([30,50]);ctx.stroke();ctx.setLineDash([]);
        label(ctx,room.name.toUpperCase(),room.x,room.y+room.r*.62,{size:32,color:'#eadaba'});
      }
      for(let gy=Math.max(0,Math.floor(b.top/125));gy<Math.min(44,Math.ceil(b.bottom/125));gy++)for(let gx=Math.max(0,Math.floor(b.left/125));gx<Math.min(65,Math.ceil(b.right/125));gx++){
        if(hash(gx,gy)<.72)continue;const x=gx*125+hash(gx+2,gy)*60,y=gy*125+hash(gx,gy+2)*60;
        if(!canWalk(x,y,'cave',0))continue;circle(ctx,x,y,2+hash(gx+7,gy)*4);ctx.fillStyle='#e1cd9b55';ctx.fill();
      }
      const glow=CAVE_ROOMS[6];circle(ctx,glow.x,glow.y,150);ctx.fillStyle='#6ca9a4';ctx.fill();circle(ctx,glow.x,glow.y,105);ctx.fillStyle='#a3d1bc';ctx.fill();
    }
    this.drawPortals(ctx,'cave',b,overview);
  }
  drawDeep(ctx,b,zoom,overview=false){
    ctx.fillStyle='#13141c';ctx.fillRect(0,0,DEEP_CAVES.width,DEEP_CAVES.height);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const tunnel of DEEP_TUNNELS){line(ctx,tunnel.points);ctx.strokeStyle='#302d3e';ctx.lineWidth=tunnel.width+125;ctx.stroke();}
    for(const room of DEEP_ROOMS){circle(ctx,room.x,room.y,room.r+65);ctx.fillStyle='#302d3e';ctx.fill();}
    for(const tunnel of DEEP_TUNNELS){line(ctx,tunnel.points);ctx.strokeStyle='#5f596a';ctx.lineWidth=tunnel.width;ctx.stroke();line(ctx,tunnel.points);ctx.strokeStyle='#777184';ctx.lineWidth=tunnel.width-70;ctx.stroke();}
    const colors={'deep-tundra':'#8398ad','deep-volcanic':'#9d746b','deep-marsh':'#75897d','deep-badlands':'#9c8175','deep-woodland':'#758c83',deep:'#827b91'};
    for(const room of DEEP_ROOMS){circle(ctx,room.x,room.y,room.r);ctx.fillStyle=colors[room.biome]||'#827b91';ctx.fill();circle(ctx,room.x,room.y,room.r-65);ctx.fillStyle='#39374455';ctx.fill();}
    if(!overview){
      for(const room of DEEP_ROOMS){if(room.x<b.left-700||room.x>b.right+700||room.y<b.top-700||room.y>b.bottom+700)continue;
        circle(ctx,room.x,room.y,room.r*.74);ctx.strokeStyle='#f3e2ff33';ctx.lineWidth=5;ctx.setLineDash([25,55]);ctx.stroke();ctx.setLineDash([]);
        label(ctx,room.name.toUpperCase(),room.x,room.y+room.r*.64,{size:33,color:'#e9ddf1'});
      }
      for(let gy=Math.max(0,Math.floor(b.top/140));gy<Math.min(44,Math.ceil(b.bottom/140));gy++)for(let gx=Math.max(0,Math.floor(b.left/140));gx<Math.min(65,Math.ceil(b.right/140));gx++){
        if(hash(gx+51,gy+17)<.78)continue;const x=gx*140+hash(gx+2,gy)*60,y=gy*140+hash(gx,gy+2)*60;
        if(!canWalk(x,y,'deep',0))continue;circle(ctx,x,y,3+hash(gx+7,gy)*5);ctx.fillStyle='#c7b4e066';ctx.fill();
      }
    }
    this.drawPortals(ctx,'deep',b,overview);
  }
  drawSpawnables(ctx,registry,layer,bounds,target,time){
    const visible=registry.visible(bounds,layer);
    for(const d of visible.decorations){
      ctx.save();ctx.translate(d.x,d.y);ctx.lineWidth=4;ctx.lineCap='round';
      if(d.kind==='mushroom'){circle(ctx,0,5,8);ctx.fillStyle='#d6cfaa';ctx.fill();ctx.beginPath();ctx.arc(0,-5,17,Math.PI,TAU);ctx.fillStyle='#9ec1ab';ctx.fill();}
      else if(d.kind==='crystal'){ctx.beginPath();ctx.moveTo(-11,8);ctx.lineTo(-5,-21);ctx.lineTo(6,-29);ctx.lineTo(15,8);ctx.closePath();ctx.fillStyle='#baabd7';ctx.fill();ctx.strokeStyle='#eee0ff';ctx.lineWidth=3;ctx.stroke();}
      else if(d.kind==='reed'){ctx.strokeStyle='#3b6959';for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*8,12);ctx.lineTo(i*9+5,-23-(i===0?12:0));ctx.stroke();}}
      else if(d.kind==='bone'){ctx.strokeStyle='#e3cba3';ctx.beginPath();ctx.moveTo(-15,8);ctx.lineTo(15,-8);ctx.stroke();circle(ctx,-16,9,6);ctx.fillStyle='#e3cba3';ctx.fill();circle(ctx,16,-9,6);ctx.fill();}
      else if(d.kind==='ash'){circle(ctx,0,0,12);ctx.fillStyle='#514843';ctx.fill();circle(ctx,8,-4,4);ctx.fillStyle='#c68b5f';ctx.fill();}
      else {ctx.strokeStyle='#4d7658';ctx.beginPath();ctx.moveTo(0,9);ctx.lineTo(0,-7);ctx.stroke();for(let i=0;i<5;i++){const a=i*TAU/5;circle(ctx,Math.cos(a)*8,Math.sin(a)*8-10,5);ctx.fillStyle='#dfd39b';ctx.fill();}}
      ctx.restore();
    }
    for(const n of visible.nodes){
      ctx.save();ctx.translate(n.x,n.y);
      if(n.kind==='tree'){
        circle(ctx,7,15,n.radius+8);ctx.fillStyle='#1e332953';ctx.fill();
        circle(ctx,0,9,15);ctx.fillStyle='#705339';ctx.fill();
        const canopy=layer==='cave'?'#668579':n.zoneId.includes('mire')?'#466e60':'#3d7251';
        circle(ctx,-23,-11,n.radius*.69);ctx.fillStyle=canopy;ctx.fill();
        circle(ctx,24,-15,n.radius*.67);ctx.fillStyle='#5b8b5c';ctx.fill();
        circle(ctx,0,-31,n.radius*.74);ctx.fillStyle='#6f9b62';ctx.fill();
        circle(ctx,-12,-42,8);ctx.fillStyle='#a4bd75';ctx.fill();
      } else if(n.kind==='bush'){
        circle(ctx,5,9,n.radius+8);ctx.fillStyle='#213c3155';ctx.fill();
        for(const [ox,oy,r,color] of [[-18,3,20,'#356548'],[15,-4,22,'#4c8050'],[-2,-17,23,'#669857']]){circle(ctx,ox,oy,r);ctx.fillStyle=color;ctx.fill();}
        for(const [ox,oy] of [[-15,-9],[9,-21],[20,4]]){circle(ctx,ox,oy,4);ctx.fillStyle='#c7c36e';ctx.fill();}
      } else if(n.kind==='rock'||n.kind==='ore'){
        const oreColor={iron:'#e0aa6d',copper:'#dfa06f',quartz:'#d9e8f1',amber:'#f5bf68',obsidian:'#9f82c6',moonstone:'#c3b4f8'}[n.resource]||'#e0aa6d';
        ctx.beginPath();ctx.moveTo(-n.radius,-1);ctx.lineTo(-n.radius*.55,-n.radius*.8);ctx.lineTo(n.radius*.3,-n.radius);ctx.lineTo(n.radius,n.radius*.05);ctx.lineTo(n.radius*.6,n.radius*.75);ctx.lineTo(-n.radius*.68,n.radius*.6);ctx.closePath();
        ctx.fillStyle=n.kind==='ore'?'#65564e':'#8e9687';ctx.fill();ctx.strokeStyle=n.kind==='ore'?'#aa7959':'#626f63';ctx.lineWidth=5;ctx.stroke();
        ctx.beginPath();ctx.moveTo(-n.radius*.55,-n.radius*.24);ctx.lineTo(n.radius*.18,-n.radius*.47);ctx.lineTo(n.radius*.44,n.radius*.35);ctx.strokeStyle=n.kind==='ore'?oreColor:'#c3c9ab';ctx.lineWidth=6;ctx.stroke();
        if(n.kind==='ore'){circle(ctx,n.radius*.4,-n.radius*.35,5);ctx.fillStyle=oreColor;ctx.fill();}
      } else if(n.kind==='ground'){
        circle(ctx,0,0,20+Math.sin(time*.004+n.x)*3);ctx.fillStyle='#fff3bb44';ctx.fill();
        if(n.resource==='wood'||n.resource==='sticks'){ctx.save();ctx.rotate(-.7);ctx.fillStyle='#8d633e';ctx.fillRect(-5,-19,10,38);ctx.fillStyle='#c19761';ctx.fillRect(-2,-15,3,26);ctx.restore();}
        else if(n.resource==='leaves'){ctx.beginPath();ctx.ellipse(0,0,13,18,.65,0,TAU);ctx.fillStyle='#82b875';ctx.fill();ctx.strokeStyle='#42694e';ctx.lineWidth=2;ctx.stroke();}
        else {circle(ctx,0,0,12);ctx.fillStyle=n.resource==='iron'?'#b9805c':'#bdc4ae';ctx.fill();ctx.strokeStyle='#596b61';ctx.lineWidth=2;ctx.stroke();}
      }
      if(target===n){circle(ctx,0,0,n.radius+20+Math.sin(time*.009)*3);ctx.strokeStyle='#fff0b9';ctx.lineWidth=4;ctx.setLineDash([13,9]);ctx.stroke();ctx.setLineDash([]);}
      if(n.blocking&&n.quantity<n.maxQuantity){ctx.fillStyle='#26352b';ctx.fillRect(-32,n.radius+24,64,9);ctx.fillStyle='#edc37b';ctx.fillRect(-30,n.radius+26,60*n.quantity/n.maxQuantity,5);}
      ctx.restore();
    }
  }
  drawCreatures(ctx,registry,layer,bounds,time){
    for(const c of registry.visible(bounds,layer)){
      ctx.save();ctx.translate(c.x,c.y);
      circle(ctx,3,15,c.radius+9);ctx.fillStyle='#1b221b77';ctx.fill();
      if(c.shiny){circle(ctx,0,0,c.radius+15+Math.sin(time*.007+c.seed)*3);ctx.strokeStyle='#ebdcff';ctx.lineWidth=5;ctx.shadowColor='#d2b7ff';ctx.shadowBlur=22;ctx.stroke();ctx.shadowBlur=0;}
      if(c.charger&&c.windupUntil>time){circle(ctx,0,0,c.radius+27+(c.windupUntil-time)/40);ctx.strokeStyle='#ffbd78';ctx.lineWidth=6;ctx.setLineDash([13,8]);ctx.stroke();ctx.setLineDash([]);}
      if(c.kind==='rabbit'){
        ctx.save();ctx.rotate(Math.cos(c.facing)<0?-.2:.2);
        ctx.beginPath();ctx.ellipse(0,3,22,14,0,0,TAU);ctx.fillStyle='#dccab0';ctx.fill();ctx.strokeStyle='#695443';ctx.lineWidth=3;ctx.stroke();
        circle(ctx,18,-8,12);ctx.fillStyle='#e4d7bd';ctx.fill();
        for(const x of [13,23]){ctx.beginPath();ctx.ellipse(x,-24,5,17,x===13?-.2:.25,0,TAU);ctx.fillStyle='#d8c5aa';ctx.fill();ctx.beginPath();ctx.ellipse(x,-25,2,10,0,0,TAU);ctx.fillStyle='#ad7b74';ctx.fill();}
        circle(ctx,25,-10,2.5);ctx.fillStyle='#392f29';ctx.fill();ctx.restore();
      }else if(c.kind==='deer'){
        ctx.beginPath();ctx.ellipse(0,3,30,19,0,0,TAU);ctx.fillStyle='#a7754e';ctx.fill();ctx.strokeStyle='#5b402f';ctx.lineWidth=3;ctx.stroke();
        for(const x of [-18,14]){ctx.fillStyle='#62482e';ctx.fillRect(x,10,6,26);}
        circle(ctx,24,-13,13);ctx.fillStyle='#be8b5d';ctx.fill();circle(ctx,32,-16,2.5);ctx.fillStyle='#2e2a26';ctx.fill();
        ctx.strokeStyle='#72533c';ctx.lineWidth=4;for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(22,-22);ctx.lineTo(22+sign*12,-43);ctx.lineTo(22+sign*20,-50);ctx.moveTo(22+sign*11,-40);ctx.lineTo(22+sign*25,-40);ctx.stroke();}
      }else if(c.kind==='caveBat'){
        const flap=Math.sin(time*.013+c.seed)*8;
        ctx.fillStyle='#6c5d76';ctx.beginPath();ctx.moveTo(-5,0);ctx.quadraticCurveTo(-25,-24-flap,-44,-9-flap);ctx.lineTo(-31,11);ctx.lineTo(-19,5);ctx.lineTo(-8,14);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.moveTo(5,0);ctx.quadraticCurveTo(25,-24-flap,44,-9-flap);ctx.lineTo(31,11);ctx.lineTo(19,5);ctx.lineTo(8,14);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.ellipse(0,3,15,19,0,0,TAU);ctx.fillStyle='#51475e';ctx.fill();for(const x of [-6,6]){circle(ctx,x,-4,3);ctx.fillStyle='#f3bb7e';ctx.fill();}
        for(const x of [-11,11]){ctx.beginPath();ctx.moveTo(x,-12);ctx.lineTo(x*1.5,-25);ctx.lineTo(x*.4,-20);ctx.fillStyle='#51475e';ctx.fill();}
      }else if(c.kind==='rockScorpion'){
        for(const sign of [-1,1]){
          for(const y of [-13,0,13]){ctx.beginPath();ctx.moveTo(sign*14,y);ctx.lineTo(sign*30,y+12);ctx.strokeStyle='#5a3b30';ctx.lineWidth=6;ctx.stroke();}
          ctx.beginPath();ctx.moveTo(sign*22,-9);ctx.lineTo(sign*40,-22);ctx.lineTo(sign*49,-10);ctx.strokeStyle='#7d503e';ctx.lineWidth=9;ctx.stroke();
          circle(ctx,sign*49,-10,7);ctx.fillStyle='#a56748';ctx.fill();
        }
        ctx.beginPath();ctx.ellipse(0,0,26,22,0,0,TAU);ctx.fillStyle='#8f5840';ctx.fill();ctx.strokeStyle='#4d352e';ctx.lineWidth=4;ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,16);ctx.quadraticCurveTo(8,40,24,35);ctx.quadraticCurveTo(39,25,34,10);ctx.strokeStyle='#a66d4c';ctx.lineWidth=9;ctx.stroke();
        ctx.beginPath();ctx.moveTo(34,4);ctx.lineTo(42,17);ctx.lineTo(29,13);ctx.closePath();ctx.fillStyle='#e0b267';ctx.fill();
        for(const x of [-9,9]){circle(ctx,x,-7,3);ctx.fillStyle='#f4d184';ctx.fill();}
      }else if(c.kind==='stoneRam'){
        for(const sign of [-1,1]){ctx.fillStyle='#514b49';ctx.fillRect(sign*16-4,9,9,25);ctx.beginPath();ctx.moveTo(sign*14,-10);ctx.quadraticCurveTo(sign*34,-28,sign*35,-4);ctx.strokeStyle='#dcc79f';ctx.lineWidth=9;ctx.stroke();}
        ctx.beginPath();ctx.ellipse(0,0,34,25,0,0,TAU);ctx.fillStyle='#8a8075';ctx.fill();ctx.strokeStyle='#4d4745';ctx.lineWidth=5;ctx.stroke();
        ctx.beginPath();ctx.moveTo(-15,-11);ctx.lineTo(0,-19);ctx.lineTo(15,-11);ctx.strokeStyle='#c5b39c';ctx.lineWidth=4;ctx.stroke();
        for(const x of [-10,10]){circle(ctx,x,-4,3);ctx.fillStyle='#f0d08e';ctx.fill();}
      }else{
        for(const sign of [-1,1])for(const y of [-10,3,15]){ctx.beginPath();ctx.moveTo(sign*15,y);ctx.lineTo(sign*32,y+14);ctx.strokeStyle='#503e3e';ctx.lineWidth=6;ctx.stroke();}
        ctx.beginPath();ctx.ellipse(0,3,27,22,0,0,TAU);ctx.fillStyle='#71534d';ctx.fill();ctx.strokeStyle='#382e30';ctx.lineWidth=4;ctx.stroke();
        ctx.beginPath();ctx.moveTo(-8,-9);ctx.lineTo(0,-16);ctx.lineTo(8,-9);ctx.strokeStyle='#a0735b';ctx.lineWidth=3;ctx.stroke();
        for(const x of [-9,9]){circle(ctx,x,3,3);ctx.fillStyle='#ebad6d';ctx.fill();}
      }
      if(c.hitUntil>time){circle(ctx,0,0,c.radius+5);ctx.fillStyle='#fff0c655';ctx.fill();}
      if(c.health<c.maxHealth){ctx.fillStyle='#241f20';ctx.fillRect(-30,-c.radius-39,60,8);ctx.fillStyle=c.temperament==='hostile'?'#db7365':'#c7d398';ctx.fillRect(-29,-c.radius-38,58*c.health/c.maxHealth,6);}
      if(c.temperament==='hostile'){ctx.fillStyle='#f6b697';ctx.font="700 13px 'Space Grotesk',sans-serif";ctx.textAlign='center';ctx.fillText(c.name.toUpperCase(),0,-c.radius-45);}
      ctx.restore();
    }
  }
  drawDrops(ctx,registry,layer,bounds,target,time){
    const colors={meat:'#d37a6c',hide:'#c9a77a',bone:'#ead9b9',stone:'#bec4af',iron:'#e6ab78',copper:'#dc9465',quartz:'#d9e8f1',amber:'#edbd6b',obsidian:'#a28aca',moonstone:'#c8b6ff',wing:'#aaa0c5',shell:'#8c9c8b',venom:'#a8d786',glimmer:'#f6d9ff'};
    for(const drop of registry.visible(bounds,layer)){
      const view=drop.visual(time),pulse=Math.sin(time*.008+drop.spawnAt)*3;
      ctx.save();
      circle(ctx,drop.landX,drop.landY+9,18);ctx.fillStyle='#18251f66';ctx.fill();
      circle(ctx,drop.landX,drop.landY,26+pulse);ctx.strokeStyle=target===drop?'#fff2b8':'#f7da9b9c';ctx.lineWidth=3;ctx.stroke();
      ctx.translate(view.x,view.y-view.height-(drop.landed(time)?Math.sin(time*.004+drop.spawnAt)*4:0));
      circle(ctx,0,0,17);ctx.fillStyle='#27362d';ctx.fill();ctx.strokeStyle=colors[drop.resource]||'#e7c891';ctx.lineWidth=4;ctx.stroke();
      if(drop.resource==='meat'){ctx.beginPath();ctx.ellipse(0,0,11,8,-.4,0,TAU);ctx.fillStyle=colors.meat;ctx.fill();circle(ctx,6,-2,2);ctx.fillStyle='#f8dbc5';ctx.fill();}
      else if(drop.resource==='hide'){ctx.beginPath();ctx.moveTo(-10,-8);ctx.lineTo(10,-9);ctx.lineTo(12,8);ctx.lineTo(0,11);ctx.lineTo(-12,6);ctx.closePath();ctx.fillStyle=colors.hide;ctx.fill();}
      else if(drop.resource==='bone'){ctx.strokeStyle=colors.bone;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-7,7);ctx.lineTo(7,-7);ctx.stroke();for(const s of [-1,1]){circle(ctx,s*8,-s*8,4);ctx.fillStyle=colors.bone;ctx.fill();}}
      else {ctx.beginPath();ctx.moveTo(-10,5);ctx.lineTo(-7,-7);ctx.lineTo(5,-11);ctx.lineTo(11,-2);ctx.lineTo(6,9);ctx.closePath();ctx.fillStyle=colors[drop.resource]||'#d5ba8a';ctx.fill();}
      ctx.restore();
      if(drop.landed(time)){ctx.fillStyle='#fff0c9';ctx.font="700 13px 'Space Grotesk',sans-serif";ctx.textAlign='center';ctx.fillText(`${drop.amount} ${drop.resource}`,drop.landX,drop.landY-35);}
    }
  }
  drawProjectiles(ctx,registry,layer,bounds,time){
    for(const rock of registry.visible(bounds,layer)){
      ctx.save();ctx.translate(rock.x,rock.y);ctx.rotate(rock.angle);
      if(rock.owner==='player'){
        if(rock.type==='bow'){ctx.fillStyle='#b98655';ctx.fillRect(-21,-2,31,4);ctx.fillStyle='#b9d5d4';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(6,-6);ctx.lineTo(6,6);ctx.fill();ctx.fillStyle='#efe6c3';ctx.fillRect(-21,-5,7,3);ctx.fillRect(-21,2,7,3);}
        else{ctx.fillStyle='#718d96';ctx.fillRect(-6,-6,12,12);ctx.fillStyle='#b9d6d5';ctx.fillRect(-5,-5,7,4);}
        ctx.restore();continue;
      }
      ctx.beginPath();ctx.moveTo(-33,0);ctx.lineTo(-8,0);ctx.strokeStyle='#e7ad6888';ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke();
      circle(ctx,0,0,12);ctx.fillStyle='#d79a65';ctx.fill();ctx.strokeStyle='#553e34';ctx.lineWidth=3;ctx.stroke();
      circle(ctx,4,-4,3);ctx.fillStyle='#ffe1a4';ctx.fill();ctx.restore();
    }
  }
  drawZones(ctx,zones,selected,zoom,editable=false){
    for(const z of zones){polygon(ctx,z.vertices);const active=z===selected;ctx.fillStyle=active?'#ffe09b42':'#fbd18b22';ctx.fill();ctx.strokeStyle=active?'#ffe19b':'#ffe2a4a8';ctx.lineWidth=active?6:4;ctx.setLineDash(active?[]:[20,15]);ctx.stroke();ctx.setLineDash([]);
      const cx=z.vertices.reduce((s,p)=>s+p.x,0)/z.vertices.length,cy=z.vertices.reduce((s,p)=>s+p.y,0)/z.vertices.length;
      label(ctx,z.name.toUpperCase(),cx,cy,{size:Math.max(22,25/zoom),color:'#fff0cc',shadow:true});
      if(active&&editable){for(const p of z.vertices){circle(ctx,p.x,p.y,Math.max(11,10/zoom));ctx.fillStyle='#fff4d7';ctx.fill();ctx.strokeStyle='#523b29';ctx.lineWidth=3;ctx.stroke();}}
    }
  }
  drawPlayer(ctx,player,inventory,time){
    const step=player.moving?Math.sin(time*.021)*5:0;
    const bob=player.moving?Math.abs(Math.sin(time*.021))*1.7:0;
    const skin='#dba878',ink='#493628',hide='#a27047';
    ctx.save();
    // The ground shadow anchors a standing figure to the tilted map.
    ctx.beginPath();ctx.ellipse(2,31,24,9,0,0,TAU);ctx.fillStyle='#18221c70';ctx.fill();
    ctx.translate(0,-bob);
    const stroke=(x1,y1,x2,y2,w,color)=>{ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=ink;ctx.lineWidth=w+3;ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke();};
    // Legs move in opposition to the arms; the torso stays steady.
    stroke(-9,13,-10,29+step,10,skin);stroke(9,13,10,29-step,10,skin);
    ctx.fillStyle='#604632';ctx.beginPath();ctx.ellipse(-11,30+step,8,5,-.2,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(11,30-step,8,5,.2,0,TAU);ctx.fill();
    stroke(-17,-13,-21,12-step*.55,10,skin);stroke(17,-13,21,12+step*.55,10,skin);
    circle(ctx,-21,14-step*.55,5);ctx.fillStyle=skin;ctx.fill();circle(ctx,21,14+step*.55,5);ctx.fill();
    // Shaded shoulders and tunic suggest a chest facing the viewer.
    ctx.beginPath();ctx.moveTo(-16,-15);ctx.quadraticCurveTo(0,-25,16,-15);ctx.lineTo(18,16);ctx.quadraticCurveTo(0,22,-18,16);ctx.closePath();
    ctx.fillStyle=inventory.equippedGear?{leaf:'#5f8e55',wood:'#93683f',stone:'#879486',iron:'#a3aba8',copper:'#bc765a',obsidian:'#655977',moonstone:'#b5a6dc'}[inventory.equippedGear.tier]||hide:hide;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.moveTo(-13,-11);ctx.lineTo(-12,13);ctx.lineTo(0,17);ctx.lineTo(0,-18);ctx.closePath();ctx.fillStyle='#d3a16e88';ctx.fill();
    stroke(-12,-10,10,12,5,'#e2c18c');
    ctx.fillStyle='#624530';ctx.fillRect(-16,12,32,5);ctx.fillStyle='#e7c887';ctx.fillRect(-3,11,6,7);
    ctx.fillStyle=skin;ctx.fillRect(-6,-23,12,10);
    circle(ctx,-16,-27,5);ctx.fillStyle=skin;ctx.fill();circle(ctx,16,-27,5);ctx.fill();
    ctx.beginPath();ctx.ellipse(0,-29,17,20,0,0,TAU);ctx.fillStyle=skin;ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=3;ctx.stroke();
    // Forehead, cheek shadow, eyes and beard remain visible at normal zoom.
    ctx.beginPath();ctx.moveTo(-17,-29);ctx.lineTo(-18,-39);ctx.lineTo(-9,-49);ctx.lineTo(0,-45);ctx.lineTo(9,-48);ctx.lineTo(18,-38);ctx.lineTo(17,-28);ctx.lineTo(9,-37);ctx.lineTo(-11,-36);ctx.closePath();ctx.fillStyle='#433026';ctx.fill();
    ctx.beginPath();ctx.moveTo(-13,-24);ctx.quadraticCurveTo(0,-16,13,-24);ctx.lineTo(10,-15);ctx.quadraticCurveTo(0,-5,-10,-15);ctx.closePath();ctx.fillStyle='#5e4231';ctx.fill();
    for(const x of [-6,6]){circle(ctx,x,-29,3.3);ctx.fillStyle='#fff2d6';ctx.fill();circle(ctx,x+Math.cos(player.facing)*1.2,-29+Math.sin(player.facing)*.9,1.8);ctx.fillStyle='#25332c';ctx.fill();}
    ctx.beginPath();ctx.moveTo(0,-27);ctx.lineTo(3,-21);ctx.lineTo(-1,-20);ctx.strokeStyle='#ad754d';ctx.lineWidth=2;ctx.stroke();
    const tool=inventory.equippedTool;
    if(tool){ctx.save();ctx.translate(22,11);ctx.rotate(player.swingUntil>time?-Math.sin((player.swingUntil-time)/250*Math.PI)*.55:step*.018);
      const headColor={leaf:'#8eac7b',wood:'#795439',stone:'#aab5a4',copper:'#cf8a60',iron:'#c3c9c5',obsidian:'#9175af',moonstone:'#d6c5ff'}[tool.tier]||'#aab5a4';
      stroke(0,3,17,-30,6,'#765139');
      if(tool.type==='rock'){circle(ctx,18,-31,8);ctx.fillStyle='#aeb5a5';ctx.fill();}
      else if(tool.type==='club'){circle(ctx,18,-34,10);ctx.fillStyle=headColor;ctx.fill();}
      else if(tool.type==='axe'){ctx.beginPath();ctx.moveTo(12,-38);ctx.lineTo(32,-41);ctx.lineTo(29,-23);ctx.lineTo(15,-27);ctx.closePath();ctx.fillStyle=headColor;ctx.fill();}
      else {ctx.beginPath();ctx.moveTo(8,-39);ctx.lineTo(34,-41);ctx.strokeStyle=headColor;ctx.lineWidth=8;ctx.stroke();}
      ctx.restore();}
    ctx.restore();
  }
  drawOverview(canvas,layer,player,zones=null,showZones=false){
    const ctx=canvas.getContext('2d');const world=layer==='surface'?SURFACE:layer==='deep'?DEEP_CAVES:CAVES;
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
    const scale=Math.min(canvas.width/world.width,canvas.height/world.height),ox=(canvas.width-world.width*scale)/2,oy=(canvas.height-world.height*scale)/2;
    ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
    if(layer==='surface')this.drawSurface(ctx,{left:0,top:0,right:world.width,bottom:world.height},scale,true);
    else if(layer==='deep')this.drawDeep(ctx,{left:0,top:0,right:world.width,bottom:world.height},scale,true);
    else this.drawCaves(ctx,{left:0,top:0,right:world.width,bottom:world.height},scale,true);
    if(showZones&&zones)for(const zone of zones.forLayer(layer)){
      polygon(ctx,zone.vertices);ctx.fillStyle='#ffdc7666';ctx.fill();ctx.strokeStyle='#ffedb9';ctx.lineWidth=Math.max(2/scale,9);ctx.stroke();
    }
    ctx.restore();
    // Screen-space labels stay legible at every atlas size.
    if(canvas.width>500&&layer==='surface'){
      for(const biome of BIOMES){const x=ox+biome.center[0]*scale,y=oy+biome.center[1]*scale;label(ctx,biome.name.toUpperCase(),x,y,{size:14,color:'#25392d'});}
    }
    const px=ox+player.x*scale,py=oy+player.y*scale;
    circle(ctx,px,py,canvas.width>500?7:4);ctx.fillStyle='#fff3bb';ctx.fill();ctx.strokeStyle='#263227';ctx.lineWidth=2;ctx.stroke();
  }
}
