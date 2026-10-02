// Round bends once at load time; terrain, spawning, bridges and maps share these points.
export function roundedPathPoints(points,radius=100){
 if(points.length<3)return points.map(p=>[...p]);
 const result=[[...points[0]]];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1],incoming=Math.hypot(b[0]-a[0],b[1]-a[1]),outgoing=Math.hypot(c[0]-b[0],c[1]-b[1]);
  if(!incoming||!outgoing){result.push([...b]);continue;}
  const trim=Math.min(radius,incoming*.28,outgoing*.28);
  const start=[b[0]+(a[0]-b[0])*trim/incoming,b[1]+(a[1]-b[1])*trim/incoming];
  const end=[b[0]+(c[0]-b[0])*trim/outgoing,b[1]+(c[1]-b[1])*trim/outgoing];
  result.push(start);
  for(let j=1;j<=6;j++){const t=j/6,u=1-t;result.push([u*u*start[0]+2*u*t*b[0]+t*t*end[0],u*u*start[1]+2*u*t*b[1]+t*t*end[1]]);}
 }
 result.push([...points.at(-1)]);return result;
}
