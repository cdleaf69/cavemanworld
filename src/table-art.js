import {tableForTier} from './crafting-stations.js';
// One design supplies both the inventory illustration and the placed workshop.
function parts(tier){
 const c=tableForTier(tier).color,w='#b99565',d='#465965',l='#dfd6aa';
 const p=[],r=(x,y,width,height,fill)=>p.push({x,y,width,height,fill}),path=(shape,fill)=>p.push({shape,fill});
 if(tier===1){
  r(18,51,8,32,w);r(70,51,8,32,w);r(10,43,76,12,'#73563f');r(9,40,78,6,c);r(21,66,50,5,w);
  r(22,25,22,15,d);r(18,21,30,6,l);r(57,17,5,24,w);r(52,16,18,7,d);r(29,32,9,3,c);
 }else if(tier===2){
  path('M22 55h52l8 28H14z',d);r(20,72,57,3,'#899a93');path('M10 24h26v-9h26v9h24L73 40H29z',c);r(31,40,40,15,d);r(23,24,49,4,l);r(47,58,17,11,'#262d38');r(51,61,9,6,'#e99957');
 }else if(tier===3){
  r(15,55,8,27,d);r(74,55,8,27,d);r(12,48,73,8,c);path('M13 46l20-17h44l8 17z',d);r(36,56,27,22,d);r(40,61,19,12,c);
  path('M33 27 43 5 53 27 43 42z',c);path('M43 5 43 36 37 27z',l);path('M61 28 69 16 75 28 69 38z',c);r(22,67,52,4,l);
 }else if(tier===4){
  path('M12 40h73v14H12z',c);r(19,54,12,29,d);r(67,54,12,29,d);r(16,73,68,7,c);r(36,49,26,29,d);
  path('M35 35 48 16 62 35 48 53z',c);path('M44 28h8v13h-8z',l);r(8,9,9,31,d);r(79,9,9,31,d);r(8,9,25,5,c);r(63,9,25,5,c);
  for(const x of [21,71]){r(x,58,3,3,l);r(x,64,3,5,l);}
 }else if(tier===5){
  path('M16 43h66l9 40H7z',d);r(18,62,61,4,c);r(32,49,30,29,'#332e39');r(36,55,23,20,'#e77b50');r(41,60,13,14,'#ffd791');
  path('M8 17h23V7h31v10h26L75 35H23z',c);r(30,35,36,8,d);r(33,13,27,3,l);r(71,45,9,31,'#768791');
 }else{
  path('M18 61h60l7 22H11z',d);r(22,77,52,3,c);path('M41 54h14v13H41z',c);
  path('M13 19 30 5h35l18 14v30L65 61H30L13 49z',c);path('M21 22 34 13h27l14 9v23L61 53H34L21 45z','#2b3945');
  path('M48 17 62 34 48 50 34 34z',c);path('M48 17v28l-8-11z',l);for(const [x,y]of [[18,24],[71,24],[28,8],[61,8],[28,51],[61,51]])r(x,y,4,4,l);
 }
 return p;
}
export function tableSvg(tier){return '<g shape-rendering="crispEdges">'+parts(tier).map(p=>p.shape?`<path d="${p.shape}" fill="${p.fill}"/>`:`<rect x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" fill="${p.fill}"/>`).join('')+'</g>';}
export function drawTable(c,tier){c.save();c.scale(1.3,1.3);for(const p of parts(tier)){c.fillStyle=p.fill;if(p.shape)c.fill(new Path2D(p.shape));else c.fillRect(p.x,p.y,p.width,p.height);}c.restore();}
