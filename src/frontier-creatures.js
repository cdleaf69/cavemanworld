import {LAKES} from './world.js';
import {Creature} from './creatures.js';
import {MOUNTAINS,coastline,mountainRadius} from './frontier-world.js';
import {FISH_SPECIES} from './fish-species.js';

export class Bigfoot extends Creature{
 constructor(m){super({id:m.id+'-bigfoot',kind:'bigfoot',x:m.x,y:m.y+80,layer:'surface'});this.mountain=m;this.name=m.name+' Bigfoot';this.health=this.maxHealth=950+Math.round(m.height/8);this.respawnAt=Infinity;this.throwCount=0;this.windupUntil=0;}
 update(dt,now,player,canMove){
  this.moving=false;
  if(!this.alive){if(now>=this.respawnAt){this.alive=true;this.health=this.maxHealth;this.x=this.homeX;this.y=this.homeY;}return null;}
  if(player.layer!=='surface'||Math.hypot(player.x-this.homeX,player.y-this.homeY)>1900)return null;
  const d=Math.hypot(player.x-this.x,player.y-this.y),a=Math.atan2(player.y-this.y,player.x-this.x);this.facing=a;
  if(d<110&&now>=this.nextAttackAt){this.nextAttackAt=now+1300;return {creature:this,damage:34};}
  if(this.windupUntil){if(now<this.windupUntil)return null;this.windupUntil=0;const log=this.throwCount++%2===1;this.nextAttackAt=now+2400;
   return {creature:this,projectile:{x:this.x+Math.cos(a)*55,y:this.y+Math.sin(a)*55,angle:a,speed:log?245:340,damage:log?38:25,layer:this.layer,kind:log?'log':'feces',radius:log?28:13,lifetime:6000}};
  }
  if(d<1300&&now>=this.nextAttackAt){this.windupUntil=now+650;return null;}
  const pace=d>200?120:35,x=this.x+Math.cos(a)*pace*dt,y=this.y+Math.sin(a)*pace*dt;
  if(mountainRadius(this.mountain,x,y)<.44&&canMove(x,y,'surface',this.radius)){this.x=x;this.y=y;this.moving=true;}return null;
 }
 hit(damage,now){const result=super.hit(damage,now);if(result.dead)this.respawnAt=now+600000;return result;}
}
export function populateFrontierCreatures(registry){
 for(const m of MOUNTAINS)registry.add(new Bigfoot(m));
 const pools=[['reefCrab','seaTurtle','jellyfish'],['morayEel','mantaRay','reefShark'],['giantSquid','reefShark','morayEel']];
 for(let band=0;band<3;band++)for(let i=0;i<16;i++){
  const y=12800+i*230,x=coastline(y)+[300,950,1850][band]+(i%3)*90,kind=pools[band][i%3];
  const c=new Creature({id:`ocean-${band}-${i}`,kind,x,y,layer:'ocean'});c.health=c.maxHealth=Math.round(c.health*(1+band*.7));c.damage=Math.round(c.damage*(1+band*.35));registry.add(c);
 }
 for(const [i,f] of FISH_SPECIES.entries())if(f.habitat!=='freshwater')for(let j=0;j<3;j++){const y=12400+j*2300+i*240+Math.sin(i*3+j)*110,x=coastline(y)+150+i*140+Math.sin(i*1.7+j)*80;registry.add(new Creature({id:`sea-fish-${i}-${j}`,kind:f.id,x,y,layer:'ocean'}));}
 for(const [i,lake] of LAKES.entries())for(const [j,f] of FISH_SPECIES.filter(f=>f.habitat==='freshwater').entries())registry.add(new Creature({id:`lake-fish-${i}-${j}`,kind:f.id,x:lake.x+Math.sin(j*2.3)*lake.rx*.2,y:lake.y+Math.cos(j*2.3)*lake.ry*.2,layer:'surface'}));
 for(let i=0;i<100;i++){const y=1000+i*600,x=coastline(y)+220+(i%6)*310,kind=i%3===0?FISH_SPECIES.filter(f=>f.habitat!=='freshwater')[i%11].id:['reefCrab','jellyfish','mantaRay','reefShark','morayEel','giantSquid'][i%6];registry.add(new Creature({id:'wide-ocean-'+i,kind,x,y,layer:'ocean'}));}
 for(let i=0;i<12;i++){const y=13000+i*290,x=coastline(y)+500+(i%3)*180;registry.add(new Creature({id:'surface-sea-'+i,kind:i%2?'seaTurtle':'dolphin',x,y,layer:'surface'}));}
}
