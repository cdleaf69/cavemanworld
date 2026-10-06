// Preserve blend order and its exact 1.65-radius cutoff; skip unrelated regions.
export function indexBiomeInfluences(biomes,size=2048){
 const cells=new Map(),empty=[];
 for(const b of biomes){
  for(let y=Math.floor((b.center[1]-b.radii[1]*1.65)/size);y<=Math.floor((b.center[1]+b.radii[1]*1.65)/size);y++)
  for(let x=Math.floor((b.center[0]-b.radii[0]*1.65)/size);x<=Math.floor((b.center[0]+b.radii[0]*1.65)/size);x++){
   const key=`${x}:${y}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(b);
  }
 }
 return (x,y)=>cells.get(`${Math.floor(x/size)}:${Math.floor(y/size)}`)||empty;
}
