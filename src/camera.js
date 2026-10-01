// Camera math stays local. Multiplayer events carry world coordinates.
export const CAMERA_TILT = 0.86;
export const CENTER_ZOOM = .76;

// At the normal view, the pointer gives a little room to look around. As zoom
// increases, the offset fades to zero so magnification stays on the player.
export function mouseLookOffset(mouse,width,height,zoom,targetZoom=zoom){
  const strength=Math.max(0,Math.min(1,(CENTER_ZOOM-Math.max(zoom,targetZoom))/(CENTER_ZOOM-.68)));
  const x=(mouse.x-width/2)*.45/zoom;
  const y=(mouse.y-height/2)*.45/(zoom*CAMERA_TILT);
  const length=Math.hypot(x,y),limit=length>260?260/length:1;
  return {x:x*limit*strength,y:y*limit*strength};
}

export function worldToScreen(x,y,camera,zoom,width,height){
  return {x:width/2+zoom*(x-camera.x),y:height/2+zoom*CAMERA_TILT*(y-camera.y)};
}

export function screenToWorld(x,y,camera,zoom,width,height){
  return {x:camera.x+(x-width/2)/zoom,y:camera.y+(y-height/2)/(zoom*CAMERA_TILT)};
}

export function viewBounds(camera,zoom,width,height){
  const halfWidth=width/(2*zoom);
  const halfHeight=height/(2*zoom*CAMERA_TILT);
  return {left:camera.x-halfWidth,right:camera.x+halfWidth,top:camera.y-halfHeight,bottom:camera.y+halfHeight};
}

export function turnToward(current,target,follow){
  const difference=Math.atan2(Math.sin(target-current),Math.cos(target-current));
  return current+difference*follow;
}
