import {LAKES} from './world.js';
import {Creature} from './creatures.js';
import {MOUNTAINS,coastline,mountainRadius} from './frontier-world.js';
import {FISH_SPECIES} from './fish-species.js';

export class MountainLion extends Creature{
 constructor(m,i){const a=i*Math.PI/4+.2,r=.48+(i%3)*.16;super({id:m.id+'-lion-'+i,kind:'mountainLion',x:m.x+Math.cos(a)*m.rx*r,y:m.y+Math.sin(a)*m.ry*r,layer:'surface'});this.mountain=m;this.health=this.maxHealth+=Math.round(m.height/100);}
 update(dt,now,player,canMove){
  const before={x:this.x,y:this.y};
  const result=super.update(dt,now,player,(x,y,layer,radius)=>mountainRadius(this.mountain,x,y)<.98&&canMove(x,y,layer,radius));
  this.moving=Math.hypot(this.x-before.x,this.y-before.y)>.1;return result;
 }
}

export class Bigfoot extends Creature{
 constructor(m){super({id:m.id+'-bigfoot',kind:'bigfoot',x:m.x,y:m.y+80,layer:'surface'});this.mountain=m;this.kind=m.boss||'bigfoot';this.name=this.kind==='steezus'?'Steezus · The Higher Power':m.name+' Bigfoot';this.health=this.maxHealth=950+Math.round(m.height/8);this.respawnAt=Infinity;this.throwCount=0;this.windupUntil=0;if(this.kind==='steezus')this.loot={eagleFeather:6,skyCrystal:4,essence:3,oldTestament:1};this.jokeIndex=0;this.powerIndex=0;this.skatingUntil=0;this.nextSmokeAt=0;this.helpers=[];}
 say(text,now){this.dialogue=text;this.dialogueUntil=now+3000;}
 update(dt,now,player,canMove){
  this.moving=false;
  if(!this.alive){if(now>=this.respawnAt){this.alive=true;this.health=this.maxHealth;this.x=this.homeX;this.y=this.homeY;}return null;}
  if(player.layer!=='surface'||Math.hypot(player.x-this.homeX,player.y-this.homeY)>1900){this.attackingUntil=0;this.skatingUntil=0;this.windupUntil=0;for(const h of this.helpers)h.alive=false;return null;}
  const d=Math.hypot(player.x-this.x,player.y-this.y),a=Math.atan2(player.y-this.y,player.x-this.x);this.facing=a;
  if(this.kind==='steezus')return this.updateSteezus(dt,now,player,canMove,d,a);
  if(d<110&&now>=this.nextAttackAt){this.nextAttackAt=now+1300;this.say(['I AM NOT A PHOTO OP.','YOU PICKED THE WRONG CRYPTID, BUD.','MY HANDS ARE RATED E FOR EVERYONE.'][this.jokeIndex++%3],now);return {creature:this,damage:34};}
  if(this.windupUntil){if(now<this.windupUntil)return null;this.windupUntil=0;const log=this.throwCount++%2===1;this.nextAttackAt=now+2400;this.say((log?['SPECIAL DELIVERY FROM THE BRANCH MANAGER.','I RECYCLED A TREE INTO YOUR PROBLEM.','CATCH. IT HAS YOUR NAME ON THE BARK.']:['YOU WANTED PROOF I EXIST? HERE IS A SAMPLE.','FARM TO FACE. LOCALLY SOURCED.','THIS IS WHY THE PARK HAS NO FIVE-STAR REVIEWS.'])[this.jokeIndex++%3],now);
   return {creature:this,projectile:{x:this.x+Math.cos(a)*55,y:this.y+Math.sin(a)*55,angle:a,speed:log?245:340,damage:log?38:25,layer:this.layer,kind:log?'log':this.kind==='steezus'?'holy-smoke':'feces',radius:log?28:13,lifetime:6000,range:log?1500:Math.max(100,d-55)}};
  }
  if(d<1300&&now>=this.nextAttackAt){this.windupUntil=now+650;return null;}
  const pace=d>200?120:35,x=this.x+Math.cos(a)*pace*dt,y=this.y+Math.sin(a)*pace*dt;
  if(mountainRadius(this.mountain,x,y)<.44&&canMove(x,y,'surface',this.radius)){this.x=x;this.y=y;this.moving=true;}return null;
 }
 updateSteezus(dt,now,player,canMove,d,a){
  if(now<this.skatingUntil){
   // Ride across the slope, turning gently rather than teleporting to the player.
   const turn=Math.atan2(Math.sin(a+.75-this.skateAngle),Math.cos(a+.75-this.skateAngle));this.skateAngle+=Math.max(-dt*1.6,Math.min(dt*1.6,turn));
   const x=this.x+Math.cos(this.skateAngle)*260*dt,y=this.y+Math.sin(this.skateAngle)*260*dt;
   if(mountainRadius(this.mountain,x,y)<.55&&canMove(x,y,this.layer,this.radius)){this.x=x;this.y=y;this.moving=true;}else this.skateAngle+=Math.PI*.5;
   if(now>=this.nextSmokeAt){this.nextSmokeAt=now+650;this.smokingUntil=now+500;return {creature:this,projectile:{x:this.x+Math.cos(a)*60,y:this.y+Math.sin(a)*60,angle:a,speed:210,damage:15,layer:this.layer,kind:'holy-smoke',radius:36,lifetime:3800,range:800}};}
   return null;
  }
  if(this.windupUntil){if(now<this.windupUntil)return null;this.windupUntil=0;const power=this.powerIndex++%3;this.nextAttackAt=now+6500;
   if(power===0){this.say('FORECAST: A CHANCE OF OLD TESTAMENT.',now);return {creature:this,hazard:{kind:'sulfur-rain',...this.rainTarget,radius:155,layer:this.layer}};}
   if(power===1){this.say('ADAM! EVE! GO TOUCH GRASS. AGGRESSIVELY.',now);return {creature:this,summon:true};}
   this.say('THOU SHALT SHRED. INHALE THE REVELATION.',now);this.skatingUntil=now+5000;this.skateAngle=a+Math.PI/2;this.nextSmokeAt=now;return null;
  }
  if(d<1350&&now>=this.nextAttackAt){this.attackingUntil=now+7500;this.windupUntil=now+600;this.rainTarget={x:player.x,y:player.y};if(this.powerIndex%3===0)this.say('BEHOLD! THE WEATHER APP HAS SPOKEN.',now);return null;}
  const pace=d>280?100:25,x=this.x+Math.cos(a)*pace*dt,y=this.y+Math.sin(a)*pace*dt;
  if(mountainRadius(this.mountain,x,y)<.44&&canMove(x,y,this.layer,this.radius)){this.x=x;this.y=y;this.moving=true;}return null;
 }
 hit(damage,now){const result=super.hit(damage,now);if(result.dead){this.attackingUntil=0;this.respawnAt=now+600000;this.skatingUntil=0;for(const h of this.helpers)h.alive=false;}return result;}
}
export class EdenHelper extends Creature{
 constructor(boss,kind,now){super({id:boss.id+'-'+kind+'-'+now,kind,x:boss.x+(kind==='adam'?-90:90),y:boss.y+80,layer:boss.layer});this.summoner=boss;this.expiresAt=now+40000;this.respawnAt=Infinity;this.appearance={id:kind,skin:kind==='adam'?'#c99671':'#ecc49c',skinLight:'#f4d7b3',hair:kind==='adam'?'#624431':'#ab7041',shirt:kind==='adam'?'#739057':'#82a96d',longHair:kind==='eve',beard:kind==='adam',freckles:kind==='eve'};}
 update(dt,now,player,canMove){if(!this.alive)return null;if(now>=this.expiresAt||!this.summoner.alive||player.layer!==this.layer||Math.hypot(player.x-this.summoner.homeX,player.y-this.summoner.homeY)>1900){this.alive=false;return null;}const strike=super.update(dt,now,player,canMove);if(strike?.projectile)strike.projectile.kind='apple';return strike;}
 hit(damage,now){const result=super.hit(damage,now);this.respawnAt=Infinity;return result;}
}
export function summonEden(boss,now){for(const h of boss.helpers)h.alive=false;boss.helpers=[new EdenHelper(boss,'adam',now),new EdenHelper(boss,'eve',now)];return boss.helpers;}
export function populateFrontierCreatures(registry){
 for(const m of MOUNTAINS){registry.add(new Bigfoot(m));for(let i=0;i<8;i++)registry.add(new MountainLion(m,i));}
 const pools=[['reefCrab','seaTurtle','jellyfish'],['morayEel','mantaRay','reefShark'],['giantSquid','reefShark','morayEel']];
 for(let band=0;band<3;band++)for(let i=0;i<16;i++){
  const y=12800+i*230,x=coastline(y)+[300,950,1850][band]+(i%3)*90,kind=pools[band][i%3];
  const c=new Creature({id:`ocean-${band}-${i}`,kind,x,y,layer:'ocean'});c.health=c.maxHealth=Math.round(c.health*(1+band*.7));c.damage=Math.round(c.damage*(1+band*.35));registry.add(c);
 }
 for(const [i,f] of FISH_SPECIES.entries())if(f.habitat!=='freshwater')for(let j=0;j<3;j++){const y=12400+j*2300+i*240+Math.sin(i*3+j)*110,x=coastline(y)+150+(i<14?i*300:4000+(i-14)*3000)+Math.sin(i*1.7+j)*80;registry.add(new Creature({id:`sea-fish-${i}-${j}`,kind:f.id,x,y,layer:'ocean'}));}
 for(const [i,lake] of LAKES.entries())for(const [j,f] of FISH_SPECIES.filter(f=>f.habitat==='freshwater').entries())registry.add(new Creature({id:`lake-fish-${i}-${j}`,kind:f.id,x:lake.x+Math.sin(j*2.3)*lake.rx*.2,y:lake.y+Math.cos(j*2.3)*lake.ry*.2,layer:'surface'}));
 for(let i=0;i<240;i++){const y=1000+(i%100)*800,x=coastline(y)+220+Math.floor(i/100)*5000+(i%6)*500,kind=i%3===0?FISH_SPECIES.filter(f=>f.habitat!=='freshwater')[i%11].id:['reefCrab','jellyfish','mantaRay','reefShark','morayEel','giantSquid'][i%6];registry.add(new Creature({id:'wide-ocean-'+i,kind,x,y,layer:'ocean'}));}
 for(let i=0;i<12;i++){const y=13000+i*290,x=coastline(y)+500+(i%3)*180;registry.add(new Creature({id:'surface-sea-'+i,kind:i%2?'seaTurtle':'dolphin',x,y,layer:'surface'}));}
}
