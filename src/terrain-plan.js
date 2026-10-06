// Four chunks of breathing room without letting a distant zoom churn the cache.
export function terrainPlan(bounds,layer,width,height){
 const size=512,padding=2048,cx=(bounds.left+bounds.right)/1024,cy=(bounds.top+bounds.bottom)/1024,jobs=[];
 for(let gy=Math.max(0,Math.floor((bounds.top-padding)/size));gy<=Math.min(Math.ceil(height/size)-1,Math.floor((bounds.bottom+padding)/size));gy++)
 for(let gx=Math.max(0,Math.floor((bounds.left-padding)/size));gx<=Math.min(Math.ceil(width/size)-1,Math.floor((bounds.right+padding)/size));gx++){
  const visible=gx*size<bounds.right&&(gx+1)*size>bounds.left&&gy*size<bounds.bottom&&(gy+1)*size>bounds.top;
  jobs.push({key:`${layer}:${gx}:${gy}`,gx,gy,layer,visible,distance:(gx+.5-cx)**2+(gy+.5-cy)**2});
 }
 jobs.sort((a,b)=>Number(b.visible)-Number(a.visible)||a.distance-b.distance);
 const visibleCount=jobs.findIndex(j=>!j.visible);
 return jobs.slice(0,Math.max(448,visibleCount<0?jobs.length:visibleCount));
}
