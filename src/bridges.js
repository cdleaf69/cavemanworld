import { PATHS, RIVER, distanceToSegment } from './world.js';

export const RIVER_SEGMENTS=RIVER.slice(1).map((end,index)=>{
  const start=RIVER[index];
  return {start,end,left:Math.min(start[0],end[0])-120,right:Math.max(start[0],end[0])+120,top:Math.min(start[1],end[1])-120,bottom:Math.max(start[1],end[1])+120};
});

export function riverDistance(x,y,segments=RIVER_SEGMENTS){
  let nearest=Infinity;
  for(const segment of segments){
    if(x<segment.left||x>segment.right||y<segment.top||y>segment.bottom)continue;
    nearest=Math.min(nearest,distanceToSegment(x,y,...segment.start,...segment.end));
  }
  return nearest;
}

function buildBridgeSpans(){
  const spans=[];
  for(const path of PATHS)for(let index=1;index<path.points.length;index++){
    const [ax,ay]=path.points[index-1],[bx,by]=path.points[index];
    const length=Math.hypot(bx-ax,by-ay),steps=Math.ceil(length/8);
    let runStart=-1;
    for(let i=0;i<=steps;i++){
      const t=i/steps,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;
      const wet=riverDistance(x,y)<108;
      if(wet&&runStart<0)runStart=i;
      if((!wet||i===steps)&&runStart>=0){
        const begin=Math.max(0,runStart/steps*length-25),end=Math.min(length,(wet?i:i-1)/steps*length+25);
        if(end-begin>45)spans.push({x:ax+(bx-ax)*begin/length,y:ay+(by-ay)*begin/length,angle:Math.atan2(by-ay,bx-ax),length:end-begin,path:path.name});
        runStart=-1;
      }
    }
  }
  return spans;
}

export const BRIDGE_SPANS=buildBridgeSpans();
