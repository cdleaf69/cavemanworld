// Resolve against the same occupancy checks as ordinary movement. Sampling the
// contact normal also works for curved cave walls and rotated/round obstacles.
export function slideStep(x,y,dx,dy,canOccupy){
 if(canOccupy(x+dx,y+dy))return {x:x+dx,y:y+dy};
 if(!canOccupy(x,y)){
  // Existing saves or moving structures can leave a player overlapping a wall.
  if(canOccupy(x+dx,y))return {x:x+dx,y};
  if(canOccupy(x,y+dy))return {x,y:y+dy};
  return {x,y};
 }
 for(let contact=0;contact<3&&Math.hypot(dx,dy)>.001;contact++){
  if(canOccupy(x+dx,y+dy)){x+=dx;y+=dy;break;}
  let low=0,high=1;
  for(let i=0;i<12;i++){const t=(low+high)/2;if(canOccupy(x+dx*t,y+dy*t))low=t;else high=t;}
  x+=dx*low;y+=dy*low;dx*=1-low;dy*=1-low;
  let nx=0,ny=0;
  for(let i=0;i<32;i++){const a=(i+.5)*Math.PI/16,c=Math.cos(a),s=Math.sin(a);if(canOccupy(x+c*2,y+s*2)){nx+=c;ny+=s;}}
  const length=Math.hypot(nx,ny);if(length<.001)break;
  nx/=length;ny/=length;
  // Find two nearby boundary points to remove angular quantization from the
  // boolean probes. Their connecting tangent follows organic cave contours.
  const tx=-ny,ty=nx,edge=[];
  for(const side of [-1,1]){
   const bx=x+tx*side*2,by=y+ty*side*2;
   if(!canOccupy(bx+nx*4,by+ny*4)||canOccupy(bx-nx*4,by-ny*4)){edge.length=0;break;}
   let lo=-4,hi=4;for(let i=0;i<20;i++){const t=(lo+hi)/2;if(canOccupy(bx+nx*t,by+ny*t))hi=t;else lo=t;}
   edge.push({x:bx+nx*hi,y:by+ny*hi});
  }
  if(edge.length===2){const ex=edge[1].x-edge[0].x,ey=edge[1].y-edge[0].y,l=Math.hypot(ex,ey);if(l>.001){let ax=ey/l,ay=-ex/l;if(ax*nx+ay*ny<0){ax=-ax;ay=-ay;}nx=ax;ny=ay;}}
  const into=dx*nx+dy*ny;
  if(into>=-.001)break;
  dx-=nx*into;dy-=ny*into;
  if(Math.hypot(dx,dy)>.01&&canOccupy(x+nx*.025,y+ny*.025)){x+=nx*.025;y+=ny*.025;}
 }
 return {x,y};
}
