// Shared organic boundaries keep cave artwork, mining and collision aligned.
export const CAVE_LAYERS=['cave','deep','abyss','core','mantle','vault'];
export const caveDepth=layer=>Math.max(0,CAVE_LAYERS.indexOf(layer)+1);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function roomRadius(room,angle){const s=room.shapeSeed||0,a=angle-s*.37,aspect=1.2+.08*Math.sin(s),thin=.82+.06*Math.cos(s*.7),ellipse=1/Math.sqrt(Math.cos(a)**2/(aspect*aspect)+Math.sin(a)**2/(thin*thin));return room.r*ellipse*(1+.2*Math.sin(angle*3+s)+.12*Math.cos(angle*5-s*.6)+.07*Math.sin(angle*2+s*1.7));}
export function roomOutline(room,count=64,scale=1){return Array.from({length:count},(_,i)=>{const a=i*Math.PI*2/count,r=roomRadius(room,a)*scale;return {x:room.x+Math.cos(a)*r,y:room.y+Math.sin(a)*r};});}
function roomClearance(r,x,y){const dx=x-r.x,dy=y-r.y;return roomRadius(r,Math.atan2(dy,dx))-Math.hypot(dx,dy);}
const indexes=new WeakMap();
function indexGeometry(g){
 if(indexes.has(g))return indexes.get(g);
 const cells=new Map(),size=2048;
 function add(item,type,left,right,top,bottom){for(let y=Math.floor(top/size);y<=Math.floor(bottom/size);y++)for(let x=Math.floor(left/size);x<=Math.floor(right/size);x++){const key=`${x}:${y}`;if(!cells.has(key))cells.set(key,{rooms:[],segments:[],pillars:[]});cells.get(key)[type].push(item);}}
 for(const r of g.rooms)add(r,'rooms',r.x-r.r*1.8,r.x+r.r*1.8,r.y-r.r*1.8,r.y+r.r*1.8);
 for(const t of g.tunnels)for(let i=1;i<t.points.length;i++){const a=t.points[i-1],b=t.points[i],s={a,b,width:t.width,seed:(t.seed||0)+i*.43},p=t.width*.75+40;add(s,'segments',Math.min(a[0],b[0])-p,Math.max(a[0],b[0])+p,Math.min(a[1],b[1])-p,Math.max(a[1],b[1])+p);}
 for(const p of g.pillars||[])add(p,'pillars',p.x-p.r-40,p.x+p.r+40,p.y-p.r-40,p.y+p.r+40);
 indexes.set(g,cells);return cells;
}
export function caveClearance(x,y,g){
 const cell=indexGeometry(g).get(`${Math.floor(x/2048)}:${Math.floor(y/2048)}`);if(!cell)return -10000;
 let inside=-10000;
 for(const r of cell.rooms)inside=Math.max(inside,roomClearance(r,x,y));
 for(const s of cell.segments){const dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1],t=clamp(((x-s.a[0])*dx+(y-s.a[1])*dy)/(dx*dx+dy*dy||1),0,1),px=s.a[0]+dx*t,py=s.a[1]+dy*t,width=s.width*(.9+.14*Math.sin(t*Math.PI*2+s.seed));inside=Math.max(inside,width/2-Math.hypot(x-px,y-py));}
 for(const p of cell.pillars)inside=Math.min(inside,Math.hypot(x-p.x,y-p.y)-p.r);
 return inside;
}
export function naturalizeCaves(rooms,tunnels,depth,width=135000,height=84000){
 rooms.forEach((r,i)=>r.shapeSeed=i*1.371+depth*.93);
 const branches=[];
 rooms.forEach((r,i)=>{const a=i*2.399+depth,offset=r.r*.9;branches.push({width:460+(i%3)*75,seed:i,points:[[r.x+Math.cos(a)*offset*.5,r.y+Math.sin(a)*offset*.5],[r.x+Math.cos(a)*offset,r.y+Math.sin(a)*offset],[r.x+Math.cos(a+.3)*offset*1.35,r.y+Math.sin(a+.3)*offset*1.35]]});});
 for(const branch of branches)branch.points=branch.points.map(([x,y])=>[clamp(x,140,width-140),clamp(y,140,height-140)]);
 const routes=[...tunnels];tunnels.push(...branches);
 const original=[...rooms];
 routes.forEach((route,i)=>{if(i%3!==0||route.points.length<5)return;const mid=Math.floor(route.points.length/2),base=route.points[mid],previous=route.points[mid-1],next=route.points[mid+1],a=Math.atan2(next[1]-previous[1],next[0]-previous[0])+Math.PI/2*(i%2?1:-1),distance=550+(i%4)*140;
  const parent=original.reduce((best,r)=>Math.hypot(r.x-base[0],r.y-base[1])<Math.hypot(best.x-base[0],best.y-base[1])?r:best);
  const pocket={...parent,x:clamp(base[0]+Math.cos(a)*distance,300,width-300),y:clamp(base[1]+Math.sin(a)*distance,300,height-300),r:350+(i%4)*90,name:`${parent.name} · Side Grotto`,shapeSeed:i*.83+depth*1.13};rooms.push(pocket);
  tunnels.push({width:420+(i%3)*70,seed:i*.61,points:[base,[base[0]+Math.cos(a+.25)*distance*.55,base[1]+Math.sin(a+.25)*distance*.55],[pocket.x,pocket.y]]});
 });
 const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a[0]-dx*t,p.y-a[1]-dy*t);};
 const pillars=rooms.flatMap((r,i)=>i%3===0?[{x:r.x+r.r*.53,y:r.y-r.r*.36,r:95+depth*8}]:[]).filter(p=>!tunnels.some(t=>t.points.slice(1).some((b,i)=>distance(p,t.points[i],b)<p.r+150)));
 return {rooms,tunnels,pillars,depth};
}
