import {waterAt,RIVER_HALF_WIDTH} from './world.js';
import {BRIDGE_SPANS,RIVER_SEGMENTS,riverDistance} from './bridges.js';

export function bridgeAt(x,y,padding=0){return BRIDGE_SPANS.find(b=>{const dx=x-b.x,dy=y-b.y,along=dx*Math.cos(b.angle)+dy*Math.sin(b.angle),across=-dx*Math.sin(b.angle)+dy*Math.cos(b.angle);return along>=-14-padding&&along<=b.length+14+padding&&Math.abs(across)<=62+padding;})||null;}
export function physicalWaterAt(x,y,layer='surface'){return layer==='surface'&&(waterAt(x,y,layer)||riverDistance(x,y)<RIVER_HALF_WIDTH);}
export function updateBridgeContact(player,fromX=player.x,fromY=player.y){
 if(player.layer!=='surface'||player.underwater||player.raftId||player.vehicle?.glider){player.bridgeId=null;return;}
 // Keep an existing deck contact through a small edge margin; water entry still requires land or a jump.
 const retained=player.bridgeId&&bridgeAt(player.x,player.y,12);
 if(retained&&retained.path===player.bridgeId)return;
 const b=bridgeAt(player.x,player.y),id=b?.path;
 if(!b){player.bridgeId=null;return;}
 if(player.bridgeId===id)return;
 const enteringFromLand=!physicalWaterAt(fromX,fromY),jumpingOntoDeck=player.jumpActive&&player.jumpHeight>=22;
 if(enteringFromLand||jumpingOntoDeck)player.bridgeId=id;
}
export function startBridgeJump(player,startJump){
 if(player.swimming){if(player.layer!=='surface'||player.underwater||!bridgeAt(player.x,player.y,70))return false;player.swimming=false;const ok=startJump(player);if(ok)player.waterJump=true;else player.swimming=true;return ok;}
 return startJump(player);
}
export function riverCurrent(x,y){
 let nearest=null,best=Infinity;
 for(const s of RIVER_SEGMENTS){const [ax,ay]=s.start,[bx,by]=s.end,dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l2)),d=Math.hypot(x-ax-t*dx,y-ay-t*dy);if(d<best){best=d;nearest={dx,dy,length:Math.sqrt(l2)};}}
 if(!nearest||best>=RIVER_HALF_WIDTH)return {dx:0,dy:0};
 const speed=22+30*(1-best/RIVER_HALF_WIDTH);return {dx:nearest.dx/nearest.length*speed,dy:nearest.dy/nearest.length*speed};
}
