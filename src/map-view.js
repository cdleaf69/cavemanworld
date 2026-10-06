export function mapProjection(canvas,world,view=null){
 const fit=Math.min(canvas.width/world.width,canvas.height/world.height),zoom=view?.zoom||1;
 return {scale:fit*zoom,ox:(canvas.width-world.width*fit)/2*zoom+(view?.x||0),oy:(canvas.height-world.height*fit)/2*zoom+(view?.y||0)};
}
export class MapView{
 constructor(){this.reset();}
 reset(){this.zoom=1;this.x=0;this.y=0;}
 constrain(canvas,world){
  const fit=Math.min(canvas.width/world.width,canvas.height/world.height);
  for(const [key,size,extent]of [['x',canvas.width,world.width*fit],['y',canvas.height,world.height*fit]]){
   const start=(size-extent)/2*this.zoom,length=extent*this.zoom;
   this[key]=length<=size?(size-length)/2-start:Math.max(size-start-length,Math.min(-start,this[key]));
  }
 }
 zoomAt(x,y,factor,canvas,world){
  const next=Math.max(1,Math.min(8,this.zoom*factor)),ratio=next/this.zoom;
  this.x=x-(x-this.x)*ratio;this.y=y-(y-this.y)*ratio;this.zoom=next;this.constrain(canvas,world);
 }
 pan(dx,dy,canvas,world){this.x+=dx;this.y+=dy;this.constrain(canvas,world);}
}
