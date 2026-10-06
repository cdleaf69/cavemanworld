// Seeded asymmetric coastlines: bays, fingers and broad shoulders, shared by
// habitat polygons and terrain color so the atlas agrees with the walkable world.
const TAU=Math.PI*2;
export function biomeRadius(b,a){const s=b.seed*.731;return Math.max(.53,1+.21*Math.sin(a*3+s)+.14*Math.sin(a*5-s*.7)+.09*Math.cos(a*9+s*1.3)+.13*Math.sin(a+s*.2));}
export function naturalBiomePolygon(b,count=128){return Array.from({length:count},(_,i)=>{const a=i*TAU/count,r=biomeRadius(b,a);return {x:b.center[0]+Math.cos(a)*b.radii[0]*r,y:b.center[1]+Math.sin(a)*b.radii[1]*r};});}
export function biomeBlend(b,x,y){const nx=(x-b.center[0])/b.radii[0],ny=(y-b.center[1])/b.radii[1];if(Math.abs(nx)>1.65||Math.abs(ny)>1.65)return 0;const radius=biomeRadius(b,Math.atan2(ny,nx)),d=Math.hypot(nx,ny);return Math.max(0,Math.min(1,(radius+.08-d)/.23));}
