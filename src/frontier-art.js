import {drawTable} from './table-art.js';
import {tableForTier} from './crafting-stations.js';
import {drawSulfur} from './relic-art.js';
import {drawMob} from './mob-art.js';
import {MOUNTAINS,elevationOffset,altitudeAt,coastline} from './frontier-world.js';
import {grain} from './pixel-art.js';
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const poly=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();};
const stroke=(c,points,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();};
const oval=(c,x,y,rx,ry,color)=>{for(let yy=-ry;yy<=ry;yy+=2){const r=Math.round(rx*Math.sqrt(Math.max(0,1-yy*yy/ry**2)));rect(c,x-r,y+yy,r*2,2,color);}};
function make(w=96,h=96){const image=document.createElement('canvas');image.width=w;image.height=h;return {image,c:image.getContext('2d'),ax:w/2,ay:h-8};}
export function frontierNode(art,ctx,n,time){
 const sprite=art.sprite('frontier:'+n.kind,()=>{const s=make(80,80),c=s.c;
 if(n.kind==='sulfur'){drawSulfur(c,40,54,1.7);}
 else if(n.kind==='marijuana'){rect(c,38,29,4,42,'#50774a');for(const [x,y] of [[40,29],[40,45],[40,57]]){for(const [dx,dy] of [[-20,-7],[-13,-18],[0,-23],[13,-18],[20,-7]])poly(c,[[x,y],[x+dx,y+dy],[x+dx*.75,y+dy+9]],'#4caa65');rect(c,x-3,y-8,6,8,'#b3ce70');}}
 else if(n.kind==='treasure'){rect(c,16,39,48,31,'#514b3e');rect(c,18,42,44,25,'#9f703f');rect(c,20,32,40,15,'#b98a51');rect(c,22,31,36,4,'#d1a66a');rect(c,25,34,5,32,'#e1bc65');rect(c,51,34,5,32,'#e1bc65');rect(c,37,48,8,9,'#f9d87d');rect(c,39,50,3,4,'#655e43');for(let i=0;i<4;i++){rect(c,19,46+i*5,43,1,'#79532f');rect(c,22+i*9,35,6,1,'#e0b776');}for(const x of [26,52])for(const y of [38,60])rect(c,x,y,2,2,'#fff0ba');rect(c,18,65,45,2,'#b99458');rect(c,21,51,4,1,'#c79456');rect(c,47,56,3,1,'#614a36');}
 else if(n.kind==='crystal'){poly(c,[[22,70],[19,40],[30,23],[41,41],[43,70]],'#81b8ca');poly(c,[[34,68],[38,25],[51,10],[61,29],[58,67]],'#bdc9f1');poly(c,[[38,25],[51,10],[49,58]],'#e8e8fa');poly(c,[[51,10],[61,29],[53,62]],'#858fc1');poly(c,[[22,42],[30,23],[29,60]],'#c3e6e2');rect(c,43,32,2,10,'#faffec');rect(c,25,46,2,6,'#ecfff4');rect(c,34,65,20,2,'#637b96');}
 else if(n.kind==='coral'){for(const [x,h] of [[19,25],[35,40],[52,30]]){rect(c,x,70-h,7,h,'#de9e8b');rect(c,x-9,69-h,14,5,'#f2c0a0');rect(c,x-9,63-h,5,10,'#efb392');rect(c,x+6,66-h,11,5,'#cb8fa5');}}
 else if(n.kind==='pearl'){oval(c,40,64,24,8,'#817b96');poly(c,[[18,63],[26,46],[39,40],[53,47],[62,63]],'#c3b0bb');oval(c,40,56,9,8,'#eef0d8');rect(c,36,51,4,3,'#ffffff');}
 else if(n.resource==='eagleFeather'){oval(c,40,65,25,8,'#99785c');oval(c,40,63,18,5,'#655d49');poly(c,[[36,62],[43,39],[49,39],[45,58]],'#eee3c8');}
 else {for(let i=0;i<6;i++)poly(c,[[37,71],[18+i*8,30+(i%3)*8],[42,67]],i%2?'#acb79b':'#d7d5af');}
 return s;});art.shadow(ctx,n.x,n.y,22);art.draw(ctx,sprite,n.x,n.y,1.5);
 if(n.kind==='treasure'){const phase=Math.floor(time/260)%4;if(phase<2){rect(ctx,n.x+23,n.y-45,3,8,'#eee0ad');rect(ctx,n.x+20,n.y-42,9,2,'#eee0ad');}}
}
export function aquaticOrBoss(art,ctx,m,time){
 if(!m.aquatic&&!['bigfoot','steezus','mountainLion'].includes(m.kind))return false;
 drawMob(art,ctx,m,time);return true;
}
export function drawStructure(art,ctx,s,time,player=null){
 const phase=s.fuel>0?Math.floor(time/220)%4:0;
 const crop=s.garden?.crop,stage=s.garden?.growing?Math.min(3,Math.floor(s.garden.progress/(crop.seconds/4))):crop&&s.storage[crop.id]>0?4:-1;
 const sprite=art.sprite('structure:'+s.kind+':'+(s.open?'open':'closed')+':'+(s.kind==='ore-extractor'?phase:0)+':'+(s.kind==='plant-box'?crop?.id+':'+stage:''),()=>{const v=make(128,128),c=v.c;
 if(s.tableTier){v.ay=113;drawTable(c,s.tableTier);return v;}
 switch(s.kind){
 case 'plant-box':
  v.ay=103;poly(c,[[12,69],[101,69],[117,87],[27,87]],'#71563e');rect(c,24,85,93,23,'#b28b59');rect(c,24,104,93,5,'#795d43');poly(c,[[12,69],[27,87],[27,108],[12,91]],'#91704b');rect(c,17,68,87,5,'#dcc18a');
  for(let i=0;i<8;i++)rect(c,23+i*10,77+(i%2)*4,4,2,'#96724a');
  if(stage>=0)for(let i=0;i<3;i++){
   const x=37+i*25,y=84,h=10+stage*8;rect(c,x,y-h,3,h,'#548651');poly(c,[[x,y-h+5],[x-9,y-h],[x-7,y-h+8],[x,y-h+12]],'#80b773');poly(c,[[x+2,y-h+6],[x+12,y-h+1],[x+9,y-h+10]],'#9acb7e');
   if(stage>1){if(crop.id==='carrots'){poly(c,[[x-4,y-7],[x+6,y-7],[x,y+5]],crop.color);}else if(crop.id==='berries'){for(let j=0;j<3;j++)rect(c,x-6+j*5,y-h+7+(j%2)*5,5,5,crop.color);}else if(crop.id==='moonflower'){rect(c,x-6,y-h-3,15,7,crop.color);rect(c,x-2,y-h-7,7,15,crop.color);rect(c,x,y-h-2,4,4,'#efdf9a');}else{poly(c,[[x,y-h],[x-12,y-h-12],[x-7,y-h+3],[x+12,y-h-11],[x+7,y-h+5]],crop.color);}}
  }break;
 case 'wood-floor':v.ay=64;for(let y=0;y<128;y+=13){rect(c,0,y,128,12,'#b79567');rect(c,0,y+10,128,2,'#856b50');for(let x=15;x<118;x+=35)rect(c,x,y+3,2,2,'#77624a');}break;
 case 'reed-raft':v.ay=64;for(let x=0;x<128;x+=16){rect(c,x,25,15,78,'#ad8d58');rect(c,x+2,26,4,75,'#dfbe7e');}rect(c,0,40,128,5,'#6e5c47');rect(c,0,88,128,5,'#6e5c47');rect(c,52,31,24,22,'#558f93');rect(c,60,35,8,12,'#e6d690');break;
 case 'wood-roof':v.ay=64;rect(c,0,0,128,128,'#6a5947');for(let y=0;y<128;y+=12)for(let x=(y%24?-16:0);x<128;x+=32){rect(c,x+1,y+1,30,10,y<64?'#b59467':'#957a59');rect(c,x+2,y+2,28,2,'#ccb084');}rect(c,61,0,6,128,'#d0b387');break;
 case 'wood-wall':for(let x=0;x<128;x+=12){rect(c,x,64,11,56,'#aa8254');rect(c,x+2,65,3,53,'#d4b77a');}rect(c,0,73,128,6,'#7e634a');rect(c,0,107,128,6,'#7e634a');break;
 case 'stone-wall':for(let y=69;y<120;y+=15)for(let x=(y%2?0:9);x<125;x+=25){rect(c,x,y,24,14,'#7e9796');rect(c,x+2,y+1,20,3,'#adc0b3');}break;
 case 'wood-gate':rect(c,10,43,10,78,'#7d6247');rect(c,108,43,10,78,'#7d6247');if(!s.open){for(let x=24;x<105;x+=12)rect(c,x,52,9,65,'#b59766');rect(c,22,63,85,7,'#846349');rect(c,22,99,85,7,'#846349');}break;
 case 'storage-chest':rect(c,20,67,88,48,'#77583f');rect(c,20,60,88,19,'#b28b55');rect(c,28,62,7,51,'#d1b276');rect(c,93,62,7,51,'#d1b276');rect(c,58,80,13,12,'#e5c88a');break;
 case 'drying-shack':rect(c,19,50,90,67,'#99734d');rect(c,24,54,80,63,'#bea070');poly(c,[[7,51],[64,12],[121,51]],'#748864');rect(c,18,49,92,6,'#516c59');rect(c,30,70,67,5,'#6d5840');for(let i=0;i<4;i++){rect(c,39+i*15,75,2,23,'#c4b382');poly(c,[[34+i*15,79],[46+i*15,84],[39+i*15,103]],'#82ac65');}rect(c,23,112,84,5,'#805d43');break;
 case 'fish-trap':oval(c,64,96,48,20,'#7f9071');for(let x=26;x<106;x+=10)rect(c,x,75,4,35,'#bdac78');rect(c,23,83,84,4,'#d0bd8b');rect(c,29,104,70,4,'#d0bd8b');rect(c,59,69,9,43,'#626b58');break;
 case 'ore-extractor':rect(c,24,101,82,18,'#657b85');rect(c,35,39,10,66,'#a8babe');rect(c,86,39,10,66,'#a8babe');rect(c,31,38,70,13,'#718593');rect(c,50,51,30,42,'#62778b');poly(c,[[54,58],[64,48],[76,61],[69,77],[55,74]],'#acbee5');rect(c,61,91,8,27,'#d7d1c2');for(let y=94;y<118;y+=7)rect(c,57+(phase%2)*2,y,16,3,'#829b9f');break;
 case 'timber-rig':rect(c,15,102,98,15,'#8b7251');rect(c,35,20,12,89,'#ad905b');rect(c,35,20,65,11,'#bd9f6b');rect(c,93,28,3,49,'#b2bb9d');rect(c,78,76,28,10,'#829aa0');rect(c,21,91,20,12,'#78928c');break;
 case 'healing-totem':rect(c,52,51,23,65,'#8e795b');rect(c,42,94,43,9,'#6b6e58');poly(c,[[45,47],[64,22],[83,47],[64,74]],'#9bced1');poly(c,[[51,45],[63,31],[69,47],[64,65]],'#e0e8c2');break;
 }
 return v;});
 if(s.kind!=='wood-floor')art.shadow(ctx,s.x,s.y,s.radius*.6);ctx.save();
 if(player&&player.layer===s.layer){if(s.kind==='wood-roof'&&Math.abs(player.x-s.x)<80&&Math.abs(player.y-s.y)<100)ctx.globalAlpha=.18;else if(['stone-wall','wood-wall','wood-gate'].includes(s.kind)&&Math.abs(player.x-s.x)<s.width/2+30&&player.y<s.y+12&&player.y>s.y-110)ctx.globalAlpha=.4;}ctx.translate(s.x,s.y);if(s.rotation&&['wood-floor','stone-wall','wood-wall','wood-roof','wood-gate'].includes(s.kind))ctx.rotate(s.rotation);art.draw(ctx,sprite,0,0,['wood-floor','stone-wall','wood-wall','wood-roof','wood-gate'].includes(s.kind)?1:s.kind==='reed-raft'?1.4:1.3);ctx.restore();
 if(s.kind==='healing-totem'&&s.fuel){ctx.strokeStyle='#b7e4c15a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(s.x,s.y,240,200,0,0,Math.PI*2);ctx.stroke();}
}
export function drawMountains(ctx,b,time){
 // Open slopes use baked lighting and shared elevation, without contour walls.
 for(const m of MOUNTAINS){
  if(m.x+m.rx<b.left||m.x-m.rx>b.right||m.y+m.ry<b.top||m.y-m.ry-m.height*.38>b.bottom)continue;
  const centerY=(b.top+b.bottom)/2,centerX=(b.left+b.right)/2;
  if(Math.hypot((centerX-m.x)/m.rx,(centerY-m.y)/m.ry)>.8)continue;
  for(let i=0;i<5;i++){
   const x=m.x+(grain(i,4)-.5)*m.rx*1.4+Math.sin(time*.00002+i)*40,y=m.y+m.ry*.65-m.height*.12+(grain(i,8)-.5)*m.ry*.3;
   ctx.fillStyle='#edf4e825';ctx.fillRect(x,y,230,16);ctx.fillRect(x+28,y-11,160,12);ctx.fillRect(x+55,y+15,120,9);
  }
 }
}
export function drawTransport(ctx,p,time){
 if(!p.vehicleId||p.underwater)return;ctx.save();ctx.translate(p.x,p.y);
 if(p.vehicleId==='reed-raft'&&p.swimming){for(let i=0;i<6;i++){rect(ctx,-46+i*16,-16,14,38,'#b3aa65');rect(ctx,-43+i*16,-17,5,39,'#dbc786');}rect(ctx,-47,-10,97,3,'#76664d');rect(ctx,-47,13,97,3,'#76664d');}
 else if(p.vehicleId==='wood-scooter'){rect(ctx,-27,-4,58,8,'#b88e56');rect(ctx,-20,4,10,10,'#4b5c5c');rect(ctx,17,4,10,10,'#4b5c5c');rect(ctx,26,-47,5,44,'#8da9a5');rect(ctx,12,-47,24,5,'#bd9f68');}
 else if(p.vehicleId==='crystal-glider'){
 ctx.translate(0,-(p.flightHeight||0));const side=Math.abs(Math.cos(p.facing))>.7,back=Math.sin(p.facing)<-.45,lean=Math.cos(p.facing)*.12;ctx.rotate(lean);
 const span=side?57:98,rise=back?25:39;poly(ctx,[[-span,-88],[0,-88-rise],[span,-88],[0,-98]],'#8fa8cd');poly(ctx,[[-span,-88],[0,-88-rise],[0,-98]],'#6c88b5');poly(ctx,[[0,-88-rise],[span,-88],[0,-98]],'#c2d6e5');ctx.strokeStyle='#b99560';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-span,-88);ctx.lineTo(0,-88-rise);ctx.lineTo(span,-88);ctx.moveTo(0,-88-rise);ctx.lineTo(0,-57);ctx.stroke();
 }
 ctx.restore();
}

export function drawSeafloor(art,ctx,b,time){
 for(let gy=Math.floor(b.top/230);gy<=Math.ceil(b.bottom/230);gy++)for(let gx=Math.floor(b.left/220);gx<=Math.ceil(b.right/220);gx++){
  if(grain(gx,gy,71)<.60)continue;const x=gx*220+grain(gx,gy,73)*150,y=gy*230+grain(gx,gy,75)*150;if(x<coastline(y)+20)continue;
  const sprite=art.sprite('kelp:'+gx%3,()=>{const s=make(48,70),c=s.c;for(let i=0;i<4;i++){const px=12+i*8;rect(c,px,22+i*3,3,41-i*3,'#397b77');for(let j=0;j<3;j++)poly(c,[[px,34+j*11],[px+(i%2?-8:10),25+j*11],[px+3,41+j*11]],i%2?'#6bb59d':'#559e8e');}return s;});art.draw(ctx,sprite,x,y,1.4);
 }
 // Bubbles shimmer within fixed cells; they do not scroll the water texture.
 for(let i=0;i<12;i++){const x=b.left+grain(i,82)*(b.right-b.left),y=b.top+grain(i,83)*(b.bottom-b.top),phase=(Math.floor(time/350)+i)%4;ctx.strokeStyle='#b7e4dc45';ctx.lineWidth=1;ctx.strokeRect(x,y+(phase%2),phase<2?4:3,phase<2?4:3);}
}
