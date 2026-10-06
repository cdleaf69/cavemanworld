import {drawStoreFloor,storeObjects,drawDarren} from './store-art.js';
import {drawFishingWater} from './fishing-art.js';
import {mapProjection} from './map-view.js';
import {drawSulfur,drawOldTestament} from './relic-art.js';
import {bridgeAt} from './river-travel.js';
import {RECIPES} from './crafting.js';
import {RIVER_HALF_WIDTH} from './world.js';
import {frontierNode,aquaticOrBoss,drawStructure,drawMountains,drawTransport,drawSeafloor} from './frontier-art.js';
import {elevationOffset,MOUNTAINS,FISHERMAN} from './frontier-world.js';
import { EXTRA_CAVES,LAYERS,caveGeometry,portalDirection } from './world.js';
import { WorldRenderer } from './renderer.js';
import { grain } from './pixel-art.js';
import { AdventureArt } from './adventure-art.js';
import { CAMERA_TILT, worldToScreen } from './camera.js';
import { BIOMES, SURFACE, CAVES, DEEP_CAVES, HUTS, PORTALS, DESCENTS, LANDMARKS, CAVE_ROOMS, DEEP_ROOMS, LAKES, lakeDistance, lakeOutline, oceanDistance, distanceToSegment } from './world.js';
import { BRIDGE_SPANS, RIVER_SEGMENTS, riverDistance } from './bridges.js';
import { drawCasinoBuilding,drawCasinoFloor,casinoObjects } from './casino-art.js';
import { CASINO_BUILDING,CASINO_FIXTURES } from './world.js';
import {buildingForLayer,TOWN_BUILDINGS,TOWNS,fixturesForBuilding} from './town-data.js';
import {townObjects} from './town-art.js';

const clampHealth=(health,max)=>Math.max(0,Math.min(1,health/Math.max(1,max)));

export class PixelWorldRenderer extends WorldRenderer {
  constructor(canvas){super(canvas);this.art=new AdventureArt();}
  resize(){
    // Pixel art needs one backing pixel per CSS pixel, not a costly retina-sized buffer.
    this.dpr=1;this.width=this.canvas.clientWidth;this.height=this.canvas.clientHeight;
    this.canvas.width=Math.round(this.width);this.canvas.height=Math.round(this.height);
  }
  render({camera,zoom,player,layer,zones,showZones,selectedZone,editZones,spawnables,structures,creatures,drops,projectiles,fishing,targetNode,targetDrop,inventory,time,frontier}){
    const ctx=this.ctx,d=this.dpr,b=this.viewBounds(camera,zoom);
    ctx.setTransform(d,0,0,d,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle=layer==='surface'?'#60764a':'#202b2e';ctx.fillRect(0,0,this.width,this.height);
    ctx.save();ctx.translate(this.width/2,this.height/2);ctx.scale(zoom,zoom*CAMERA_TILT);ctx.translate(-camera.x,-camera.y);
    const building=buildingForLayer(layer);
    if(building?.type==='convenience')drawStoreFloor(ctx,this.art);else if(building)drawCasinoFloor(ctx,this.art,building);else this.art.terrain(ctx,b,layer);
    if(layer==='surface')this.drawWaterMotion(ctx,b,time);if(layer==='ocean')drawSeafloor(this.art,ctx,b,time);
    const visible=(x,y,pad=300)=>x>b.left-pad&&x<b.right+pad&&y>b.top-pad&&y<b.bottom+pad;
    const objects=[],underBridgeActors=[],coveredBridges=new Set();const addActor=(actor,draw)=>{const bridge=layer==='surface'&&actor.swimming&&(actor.jumpHeight||0)<22&&!actor.flightHeight?bridgeAt(actor.x,actor.y,80):null;if(bridge){underBridgeActors.push({actor,draw});coveredBridges.add(bridge);}else objects.push({x:actor.x,y:actor.y,draw,playerForeground:actor===player});};
    // Include sprite height and the raised terrain when querying ground anchors.
    const entityBounds={left:b.left-256,right:b.right+256,top:b.top-256,bottom:b.bottom+Math.max(...MOUNTAINS.map(m=>m.height*.38))+320};
    for(const p of projectiles.puddles||[]){
      if(p.layer!==layer||!visible(p.x,p.y,950))continue;
      const age=time-p.createdAt,grow=Math.min(1,age/350),fade=Math.min(1,(p.expiresAt-time)/1800);
      ctx.save();ctx.translate(p.x,p.y-(layer==='surface'?elevationOffset(p.x,p.y):0));ctx.globalAlpha=Math.max(0,fade);ctx.fillStyle=p.kind==='holy-smoke'?'#477960':'#79613f';ctx.beginPath();
      for(let i=0;i<20;i++){const a=i*Math.PI/10,r=p.radius*grow*(.88+grain(i,71)*.2),x=Math.cos(a)*r,y=Math.sin(a)*r*.62;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.fillStyle=p.kind==='holy-smoke'?'#a1c580':'#a08b4f';
      for(let i=0;i<10;i++)ctx.fillRect((grain(i,5)-.5)*90*grow,(grain(i,6)-.5)*55*grow,7,3);
      if(age<450){ctx.fillStyle='#8d7846';for(let i=0;i<8;i++){const a=i*Math.PI/4,r=age/6;ctx.fillRect(Math.cos(a)*r,Math.sin(a)*r*.65-Math.sin(age/450*Math.PI)*25,5,5);}}
      ctx.restore();
    }
    if(layer==='surface')drawMountains(ctx,b,time);
    if(building)objects.push(...(building.type==='convenience'?storeObjects(ctx,this.art,time):building.type==='casino'?casinoObjects(ctx,this.art,time):townObjects(ctx,this.art,building,time)));
    const items=spawnables.visible(entityBounds,layer);
    for(const decoration of items.decorations)objects.push({x:decoration.x,y:decoration.y,draw:()=>this.art.decoration(ctx,decoration)});
    for(const node of items.nodes)objects.push({x:node.x,y:node.y,draw:()=>this.art.resource(ctx,node,time,player)});
    if(layer==='surface'){
      for(const building of TOWN_BUILDINGS)if(!building.hut&&visible(building.x,building.y))objects.push({y:building.y+60,draw:()=>drawCasinoBuilding(ctx,this.art,building)});
      HUTS.forEach((hut,index)=>{if(visible(hut.x,hut.y))objects.push({y:hut.y,draw:()=>this.art.hut(ctx,hut,index)});});
      for(const landmark of LANDMARKS.filter(l=>l.layer==='surface'&&!['village','casino'].includes(l.type)&&visible(l.x,l.y,500)))objects.push({y:landmark.y,draw:()=>this.landmark(ctx,landmark,time)});
    }
    for(const portal of [...PORTALS,...DESCENTS]){const p=portal[layer];if(p&&visible(p.x,p.y))objects.push({y:p.y,draw:()=>this.portal(ctx,p,portal,layer)});}
    for(const fire of structures.visible(entityBounds,layer)){
      if(['wood-floor','reed-raft'].includes(fire.kind)){ctx.save();if(layer==='surface')ctx.translate(0,-elevationOffset(fire.x,fire.y));drawStructure(this.art,ctx,fire,time,player);ctx.restore();}
      else objects.push({y:fire.y+(fire.kind==='wood-roof'?160:0),x:fire.x,draw:()=>fire.kind?drawStructure(this.art,ctx,fire,time,player):this.art.fire(ctx,fire.x,fire.y,time,fire.fuel>0)});
    }
    for(const p of frontier?.remotePlayers||[])if(visible(p.x,p.y))addActor(p,()=>{if(p.vehicleId)drawTransport(ctx,p,time);this.art.player(ctx,p,{equippedTool:RECIPES.find(r=>r.id===p.tool),equippedGear:RECIPES.find(r=>r.id===p.gear)},time);});
    for(const n of frontier?.nodes.visible(entityBounds,layer)||[])objects.push({x:n.x,y:n.y,draw:()=>frontierNode(this.art,ctx,n,time)});
    const visibleNpcs=frontier?.npcs.visible(entityBounds,layer)||[];
    for(const n of visibleNpcs)objects.push({x:n.x,y:n.y,draw:()=>{if(n.role==='darren'){drawDarren(ctx,this.art,n,time);return;}this.art.player(ctx,n,{equippedGear:null,equippedTool:n.role==='fisherman'?{id:'fishing-rod',type:'rod'}:null},time);if(n.role==='fisherman'){ctx.fillStyle='#d6bf87';ctx.fillRect(n.x-21,n.y-94,42,5);ctx.fillRect(n.x-13,n.y-105,26,13);}}});
    const visibleCreatures=creatures.visible(entityBounds,layer);
    for(const creature of visibleCreatures)objects.push({y:creature.y,x:creature.x,draw:()=>{if(creature.summoner){this.art.player(ctx,creature,{equippedGear:null,equippedTool:null},time);creature.artTagHeight=110;}else if(!aquaticOrBoss(this.art,ctx,creature,time))this.art.creature(ctx,creature,time);if(creature.charger&&creature.windupUntil>time){ctx.strokeStyle='#ef996a';ctx.lineWidth=4;ctx.strokeRect(creature.x-43,creature.y-38,86,76);}}});
    addActor(player,()=>{drawTransport(ctx,player,time);this.art.player(ctx,{...player,swimming:player.swimming&&!player.vehicle?.boat},inventory,time,fishing);});
    for(const {actor,draw} of underBridgeActors){ctx.save();ctx.translate(0,-elevationOffset(actor.x,actor.y));draw();ctx.restore();}
    for(const bridge of coveredBridges)this.art.paintBridge(ctx,bridge);
    objects.sort((a,b)=>(Number(!!a.playerForeground)-Number(!!b.playerForeground))||(a.y-(layer==='surface'?elevationOffset(a.x||0,a.y):0))-(b.y-(layer==='surface'?elevationOffset(b.x||0,b.y):0)));for(const object of objects){ctx.save();if(layer==='surface')ctx.translate(0,-elevationOffset(object.x||0,object.y));object.draw();ctx.restore();}
    if(layer==='surface'&&fishing?.active){
      const {x,y}=fishing.castPoint;
      const tip=this.art.fishingRodTip(player,fishing,time);
      ctx.strokeStyle='#fff2cf';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(x,y);ctx.stroke();
      drawFishingWater(ctx,fishing,time);
    }
    for(const shot of frontier?.networkShots||[]){if(shot.layer!==layer)continue;ctx.save();if(layer==='surface')ctx.translate(0,-elevationOffset(shot.x,shot.y));ctx.translate(shot.x,shot.y);ctx.rotate(shot.angle);if(shot.type==='bow'){ctx.fillStyle='#d9ae73';ctx.fillRect(-14,-2,28,4);ctx.fillStyle='#dbe6de';ctx.fillRect(9,-4,7,8);ctx.fillStyle='#ad8178';ctx.fillRect(-13,-5,5,10);}else{ctx.fillStyle='#536778';ctx.fillRect(-5,-5,10,10);ctx.fillStyle='#b7cecb';ctx.fillRect(-4,-4,6,4);}ctx.restore();}
    this.drawBossWeather(ctx,projectiles.storms||[],layer,time);this.drawDrops(ctx,drops,layer,b,targetDrop,time);this.drawProjectiles(ctx,projectiles,layer,b,time);
    if(targetNode){ctx.save();if(layer==='surface')ctx.translate(0,-elevationOffset(targetNode.x,targetNode.y));const n=targetNode,r=n.radius+12;ctx.strokeStyle='#eee0a6bb';ctx.lineWidth=3;for(const sx of [-1,1])for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(n.x+sx*r,n.y+sy*(r*.5-9));ctx.lineTo(n.x+sx*r,n.y+sy*r*.5);ctx.lineTo(n.x+sx*(r-12),n.y+sy*r*.5);ctx.stroke();}if(n.quantity<n.maxQuantity&&n.blocking){ctx.fillStyle='#1e342c';ctx.fillRect(n.x-30,n.y+32,60,7);ctx.fillStyle='#dbbb77';ctx.fillRect(n.x-28,n.y+34,56*n.quantity/n.maxQuantity,3);}ctx.restore();}
    // Small drifting pollen and cave spores provide motion without a light cone.
    for(let i=0;i<16;i++){const x=camera.x+(grain(i,19)-.5)*(b.right-b.left)+Math.sin(time*.0002+i)*30,y=camera.y+(grain(91,i)-.5)*(b.bottom-b.top)+Math.sin(time*.0003+i)*15;ctx.fillStyle=layer==='surface'?'#e4dbab55':'#9dc9c255';ctx.fillRect(x,y,2+grain(i,3)*3,2);}
    if(showZones){const overlays=zones.forLayer(layer).map(z=>z.biome==='mountains'?{...z,source:z,vertices:z.vertices.map(p=>({x:p.x,y:p.y-elevationOffset(p.x,p.y)}))}:z);this.drawZones(ctx,overlays,overlays.find(z=>(z.source||z)===selectedZone),zoom,editZones);}
    ctx.restore();
    this.drawMobTags(visibleCreatures,camera,zoom,layer);this.drawBossDialogue(visibleCreatures,camera,zoom,layer,time);
    this.drawNpcTags(visibleNpcs,camera,zoom,frontier?.quests);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.font='12px EmberRunes, monospace';ctx.textAlign='center';for(const p of frontier?.remotePlayers||[]){const at=worldToScreen(p.x,p.y-elevationOffset(p.x,p.y)-(p.flightHeight||0)-110,camera,zoom,this.width,this.height);ctx.fillStyle='#253d4be0';const width=Math.max(72,Math.ceil(ctx.measureText(p.name).width)+20);ctx.fillRect(at.x-width/2,at.y-13,width,20);ctx.fillStyle='#fff3bb';ctx.fillText(p.name,at.x,at.y+1);ctx.fillStyle='#24313d';ctx.fillRect(at.x-width/2,at.y+7,width,6);ctx.fillStyle='#e67161';ctx.fillRect(at.x-width/2+2,at.y+9,(width-4)*Math.max(0,(p.health??100)/(p.maxHealth||100)),2);}ctx.restore();
  }
  drawBossDialogue(mobs,camera,zoom,layer,time){
    const c=this.ctx;c.save();c.setTransform(1,0,0,1,0,0);c.font='10px EmberRunes, monospace';c.textAlign='center';c.textBaseline='middle';
    for(const m of mobs){if(!m.dialogue||time>m.dialogueUntil)continue;const lines=[];let line='';const max=Math.min(280,this.width-30);for(const word of m.dialogue.split(' ')){if(line&&c.measureText(line+' '+word).width>max){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
      const at=worldToScreen(m.x,m.y-(layer==='surface'?elevationOffset(m.x,m.y):0),camera,zoom,this.width,this.height),w=Math.max(...lines.map(l=>c.measureText(l).width))+20,h=lines.length*15+14,x=Math.max(w/2+5,Math.min(this.width-w/2-5,at.x)),y=Math.min(m.tagScreenTop??(at.y-Math.max(27,(m.artTagHeight||240)*zoom)),...mobs.filter(n=>Math.abs(n.x-m.x)*zoom<280&&Math.abs(n.y-m.y)*zoom<180).map(n=>n.tagScreenTop??Infinity))-h-34;
      c.fillStyle='#493525';c.fillRect(x-w/2-3,y-3,w+6,h+6);c.fillStyle='#efd7a1';c.fillRect(x-w/2,y,w,h);c.fillRect(x-3,y+h,6,7);c.fillStyle='#513c2a';lines.forEach((l,i)=>c.fillText(l,x,y+10+i*15));
    }c.restore();
  }
  drawBossWeather(c,storms,layer,time){
    for(const s of storms){if(s.layer!==layer)continue;const raining=time>=s.beginsAt;c.save();c.translate(s.x,s.y-(layer==='surface'?elevationOffset(s.x,s.y):0));
      c.strokeStyle=raining?'#f7bd64':'#f5d07d';c.lineWidth=4;c.setLineDash([12,9]);c.beginPath();c.ellipse(0,0,s.radius,s.radius*.66,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.fillStyle=raining?'#ec9a4420':'#efd07818';c.fill();
      // The cloud stays at the marked position after the player moves away.
      for(const [x,y,w,h] of [[-108,-243,73,38],[-70,-285,85,75],[5,-270,81,68],[64,-226,47,29],[-86,-216,168,24]]){c.fillStyle='#4b4554';c.fillRect(x,y,w,h);c.fillStyle='#817373';c.fillRect(x+5,y+4,w-10,8);c.fillStyle='#b5a282';c.fillRect(x+12,y+5,w-25,3);}
      if(raining)for(let i=0;i<9;i++){const phase=((time-s.beginsAt)/850+i*.618)%1,x=Math.sin(i*7.31)*s.radius*.85,y=-205+phase*225;drawSulfur(c,x,y,.85);if(phase>.92){c.fillStyle='#f2c873';c.fillRect(x-12,8,4,3);c.fillRect(x+13,-4,4,3);}}
      c.restore();
    }
  }
  drawWaterMotion(ctx,b,time){
    const flowing=RIVER_SEGMENTS.filter(s=>s.right>b.left-180&&s.left<b.right+180&&s.bottom>b.top-180&&s.top<b.bottom+180);
    const bridges=BRIDGE_SPANS.filter(s=>s.x+s.length>b.left-120&&s.x-s.length<b.right+120&&s.y+s.length>b.top-120&&s.y-s.length<b.bottom+120);
    const lakes=LAKES.filter(l=>l.x+l.rx>b.left&&l.x-l.rx<b.right&&l.y+l.ry>b.top&&l.y-l.ry<b.bottom);
    const step=38,animationFrame=Math.floor(time/170);
    for(let gy=Math.floor(b.top/step)-1;gy<=Math.ceil(b.bottom/step);gy++)for(let gx=Math.floor(b.left/step)-1;gx<=Math.ceil(b.right/step);gx++){
      if(grain(gx,gy,31)<.42)continue;
      const x=gx*step+Math.floor(grain(gx,gy,45)*20),y=gy*step+Math.floor(grain(gx,gy,47)*17);
      if(oceanDistance(x,y)>-12&&riverDistance(x,y,flowing)>RIVER_HALF_WIDTH-12&&!lakes.some(l=>lakeDistance(l,x,y)<-12))continue;
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
  drawMobTags(creatures,camera,zoom,layer){
    const ctx=this.ctx;
    ctx.save();ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 11px EmberRunes, monospace';const placed=[];const anchors=creatures.map(m=>{const p=worldToScreen(m.x,m.y-(layer==='surface'?elevationOffset(m.x,m.y):0),camera,zoom,this.width,this.height);return {x:p.x,y:p.y,top:p.y-Math.max(27,(m.artTagHeight??80)*zoom)};});
    for(const mob of creatures){
      const at=worldToScreen(mob.x,mob.y-(layer==='surface'?elevationOffset(mob.x,mob.y):0),camera,zoom,this.width,this.height);
      if(at.x<-90||at.x>this.width+90||at.y<-100||at.y>this.height+80)continue;
      const tagHeight=mob.artTagHeight??(mob.kind==='bigfoot'?240:['emberGolem','crystalBeetle','deer'].includes(mob.kind)?110:80);
      const width=Math.max(72,Math.ceil(ctx.measureText(mob.name).width)+20),x=at.x-width/2;let top=Math.min(at.y-Math.max(27,tagHeight*zoom),...anchors.filter(p=>Math.abs(p.x-at.x)<width/2+80&&Math.abs(p.y-at.y)<140).map(p=>p.top));for(let tries=0;tries<12&&placed.some(p=>x<p.x+p.width+4&&x+width>p.x-4&&top-19<p.top+12&&top+10>p.top-23);tries++)top-=34;placed.push({x,width,top});mob.tagScreenTop=top;
      ctx.fillStyle='#26394bdf';ctx.fillRect(Math.round(x),Math.round(top-19),Math.round(width),19);
      ctx.fillStyle=mob.shiny?'#ffe49a':'#fff7df';ctx.fillText(mob.name,at.x,top-9);
      ctx.fillStyle='#26394b';ctx.fillRect(Math.round(x),Math.round(top+2),Math.round(width),8);
      ctx.fillStyle=mob.temperament==='hostile'?'#ff786d':'#79dc82';
      ctx.fillRect(Math.round(x+2),Math.round(top+4),Math.round((width-4)*clampHealth(mob.health,mob.maxHealth)),4);
    }
    ctx.restore();
  }
  drawOverview(canvas,layer,player,zones=null,showZones=false,view=null){
    const building=buildingForLayer(layer);
    if(layer==='ocean'){super.drawOverview(canvas,'surface',player,zones,showZones,view);return;}
    if(building){
      const c=canvas.getContext('2d'),{scale:s,ox,oy}=mapProjection(canvas,{width:1100,height:850},view);c.setTransform(1,0,0,1,0,0);c.fillStyle='#2e4140';c.fillRect(0,0,canvas.width,canvas.height);c.save();c.translate(ox,oy);c.scale(s,s);c.fillStyle='#b19468';c.fillRect(60,60,980,750);c.fillStyle='#4d7b60';for(const f of building.type==='casino'?CASINO_FIXTURES:fixturesForBuilding(building))c.fillRect(f.x-f.width/2,f.y-f.height/2,f.width,f.height);c.fillStyle='#f4d798';c.fillRect(510,746,80,40);c.beginPath();c.arc(player.x,player.y,5/s,0,Math.PI*2);c.fill();c.restore();return;
    }
    if(layer==='surface'){super.drawOverview(canvas,layer,player,zones,showZones,view);if(layer==='surface'&&(view||canvas.width>500)){const c=canvas.getContext('2d'),{scale:s,ox,oy}=mapProjection(canvas,SURFACE,view);c.font='12px EmberRunes, monospace';c.textAlign='center';c.fillStyle='#fff0bc';for(const t of TOWNS){const x=ox+t.x*s,y=oy+t.y*s;c.fillRect(x-3,y-3,6,6);c.fillText(t.name.toUpperCase(),x+(t.id==='hearth'?65:0),y+18);}for(const m of MOUNTAINS)c.fillText(m.name.toUpperCase(),ox+m.x*s,oy+m.y*s-15);c.textAlign='right';c.fillStyle='#fff3b8';c.fillText('MARLOW · FISHING QUESTS',ox+FISHERMAN.x*s-10,oy+FISHERMAN.y*s); }return;}
    const c=canvas.getContext('2d'),world=LAYERS[layer],{scale,ox,oy}=mapProjection(canvas,world,view);
    this.art.requestCaveAtlas(layer);c.setTransform(1,0,0,1,0,0);c.fillStyle='#252d48';c.fillRect(0,0,canvas.width,canvas.height);
    const atlas=this.art.caveAtlases?.get(layer);if(atlas){c.imageSmoothingEnabled=true;c.drawImage(atlas,ox,oy,world.width*scale,world.height*scale);}
    c.save();c.translate(ox,oy);c.scale(scale,scale);
    for(const p of [...PORTALS,...DESCENTS]){if(p[layer]){c.fillStyle=portalDirection(p,layer)==='Descend'?'#ffb878':'#9be6d8';const size=4/scale;c.fillRect(p[layer].x-size/2,p[layer].y-size/2,size,size);}}
    c.fillStyle='#fff4b2';c.beginPath();c.arc(player.x,player.y,6/scale,0,Math.PI*2);c.fill();c.restore();
  }
  drawSurface(ctx,b,zoom,overview=false){
    if(!overview){this.art.terrain(ctx,b,'surface');return;}
    this.art.requestAtlas();ctx.fillStyle='#88cf67';ctx.fillRect(0,0,SURFACE.width,SURFACE.height);
    if(this.art.atlas){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(this.art.atlas,0,0,SURFACE.width,SURFACE.height);ctx.restore();}
    this.drawRiver(ctx);for(const lake of LAKES){ctx.fillStyle='#2c8bc7';ctx.beginPath();lakeOutline(lake).forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();}this.drawPaths(ctx,true);
    this.drawPortals(ctx,'surface',b,true);
    for(const m of MOUNTAINS){ctx.fillStyle='#e6eee1';ctx.beginPath();ctx.moveTo(m.x-160,m.y+90);ctx.lineTo(m.x,m.y-180);ctx.lineTo(m.x+160,m.y+90);ctx.closePath();ctx.fill();}ctx.fillStyle='#ffd88c';ctx.fillRect(FISHERMAN.x-90,FISHERMAN.y-90,180,180);
    ctx.fillStyle='#f6d075';ctx.fillRect(CASINO_BUILDING.x-140,CASINO_BUILDING.y-140,280,280);
    for(const town of TOWNS){ctx.fillStyle='#f4d996';ctx.fillRect(town.x-170,town.y-170,340,340);}
  }
  portal(ctx,p,portal,layer){
    if(buildingForLayer(layer)?.type==='convenience')return;
    const direction=portalDirection(portal,layer);
    const sprite=this.art.sprite(`portal:${direction}:${layer}`,()=>{
      const image=document.createElement('canvas');image.width=140;image.height=120;const c=image.getContext('2d');
      c.fillStyle='#1b292b';c.beginPath();c.moveTo(24,100);c.lineTo(28,60);c.lineTo(49,36);c.lineTo(81,27);c.lineTo(109,52);c.lineTo(117,99);c.closePath();c.fill();
      const shades=direction==='Descend'?['#826045','#af815a','#d6a06c']:['#466c80','#6793a7','#9fc9d1'];
      for(let i=0;i<13;i++){const a=Math.PI+i*Math.PI/12,x=70+Math.cos(a)*48,y=91+Math.sin(a)*58;c.fillStyle=shades[i%3];c.fillRect(Math.round(x-12),Math.round(y-9),24,19);c.fillStyle='#34463b88';c.fillRect(x-10,y+5,22,5);c.fillStyle='#d0c8a744';c.fillRect(x-9,y-9,13,2);}
      for(let i=0;i<5;i++){c.fillStyle=i%2?'#445949':'#8a9880';c.fillRect(42-i*3,85+i*4,55+i*6,3);}
      for(let i=0;i<30;i++){const x=22+grain(i,4)*99,y=24+grain(9,i)*78;if(x<40||x>100){c.fillStyle='#537c56';c.fillRect(x,y,3,5);}}
      return {image,ax:70,ay:97};
    });this.art.shadow(ctx,p.x,p.y,145);this.art.draw(ctx,sprite,p.x,p.y,2.8);
    this.text(ctx,`${portal.name} (${direction})`,p.x,p.y+80,23,layer==='surface'?'#e3dfb9':'#c9c1d8');
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
    for(const drop of registry.visible({...bounds,bottom:bounds.bottom+1000},layer)){ctx.save();if(layer==='surface')ctx.translate(0,-elevationOffset(drop.landX,drop.landY));const v=drop.visual(time);this.art.shadow(ctx,drop.landX,drop.landY,15);ctx.fillStyle=target===drop?'#ffe8a2':'#cdba87';ctx.fillRect(v.x-11,v.y-v.height-11,22,22);ctx.fillStyle=drop.resource==='meat'?'#af6455':'#697e69';ctx.fillRect(v.x-8,v.y-v.height-8,16,16);ctx.fillStyle='#fff3c1';ctx.fillRect(v.x-6,v.y-v.height-8,8,3);if(drop.resource==='oldTestament')drawOldTestament(ctx,v.x,v.y-v.height,.9);else if(drop.resource==='sulfur')drawSulfur(ctx,v.x,v.y-v.height,1);if(drop.landed(time))this.text(ctx,`${drop.amount} ${drop.resource}`,drop.landX,drop.landY-35,17,'#f0e3b8');ctx.restore();}
  }
  drawNpcTags(npcs,camera,zoom,quests){const c=this.ctx;c.save();c.font='11px EmberRunes, monospace';c.textAlign='center';for(const n of npcs){const p=worldToScreen(n.x,n.y+(n.role==='darren'?65:0),camera,zoom,this.width,this.height);c.fillStyle='#263c43';const width=Math.max(90,c.measureText(n.name).width+12);c.fillRect(p.x-width/2,p.y-110*zoom-15,width,18);c.fillStyle='#f5e3ae';c.fillText(n.name,p.x,p.y-110*zoom-2);if(quests?.task(n)){c.font='bold 20px monospace';c.fillStyle='#ffdb87';c.fillText('!',p.x,p.y-130*zoom-8);c.font='11px EmberRunes, monospace';}}c.restore();}
  drawProjectiles(ctx,registry,layer,bounds,time){for(const p of registry.visible({...bounds,bottom:bounds.bottom+1000},layer)){ctx.save();ctx.translate(p.x,p.y-(layer==='surface'?elevationOffset(p.x,p.y):0));
   if(p.type==='bow'){ctx.rotate(p.angle);ctx.fillStyle='#e0c697';ctx.fillRect(-18,-1,30,2);ctx.fillStyle='#b9cdcd';ctx.beginPath();ctx.moveTo(13,-5);ctx.lineTo(22,0);ctx.lineTo(13,5);ctx.fill();ctx.fillStyle='#d3e1cb';ctx.fillRect(-19,-4,7,3);ctx.fillRect(-19,1,7,3);}
   else if(p.kind==='log'){ctx.rotate(p.angle+Math.PI/2);ctx.fillStyle='#655440';ctx.fillRect(-35,-18,70,36);ctx.fillStyle='#96744c';ctx.fillRect(-33,-14,66,23);ctx.fillStyle='#c4a26a';ctx.fillRect(-34,-13,9,27);ctx.fillStyle='#a2825a';ctx.fillRect(-20,-10+[0,5,10,5][Math.floor((time-p.createdAt)/160)%4],49,4);}
   else if(p.kind==='holy-smoke'){ctx.translate(0,-(145-100*Math.min(1,(time-p.createdAt)/850)));ctx.globalAlpha=.75;for(let i=0;i<7;i++){ctx.fillStyle=i%2?'#bdd09a':'#799f80';const x=Math.cos(i*2.4+time*.001)*20,y=Math.sin(i*2.4)*16;ctx.fillRect(Math.round(x)-12,Math.round(y)-12,24,24);}ctx.fillStyle='#e1e5bb';ctx.fillRect(-6,-6,12,12);}else if(p.kind==='apple'){ctx.fillStyle='#b95043';ctx.fillRect(-8,-6,16,13);ctx.fillStyle='#ef9270';ctx.fillRect(-6,-5,5,4);ctx.fillStyle='#729750';ctx.fillRect(0,-10,7,3);}else {ctx.fillStyle=p.kind==='holy-smoke'?'#57826b':p.kind==='feces'?'#62503c':'#65808a';ctx.fillRect(-10,-8,20,16);ctx.fillStyle=p.kind==='holy-smoke'?'#a2ce89':p.kind==='feces'?'#927445':'#aac3bd';ctx.fillRect(-7,-8,13,6);}ctx.restore();}}
}
