import { canWalk, PORTALS, DESCENTS } from './world.js';

const DROP_LIFETIME=300000;
const LANDING_MS=650;

export class LootDrop {
  constructor({id,resource,amount,x,y,layer,spawnAt,angle=0,distance=65}){
    Object.assign(this,{id,resource,amount,x,y,layer,spawnAt,active:true});
    const landingX=x+Math.cos(angle)*distance,landingY=y+Math.sin(angle)*distance;
    this.landX=canWalk(landingX,landingY,layer,12)?landingX:x;
    this.landY=canWalk(landingX,landingY,layer,12)?landingY:y;
  }
  landed(now){return now-this.spawnAt>=LANDING_MS;}
  visual(now){
    const t=Math.max(0,Math.min(1,(now-this.spawnAt)/LANDING_MS));
    const glide=1-(1-t)**3;
    return {x:this.x+(this.landX-this.x)*glide,y:this.y+(this.landY-this.y)*glide,height:Math.sin(Math.PI*t)*32};
  }
}

export class LootRegistry {
  constructor(){this.drops=[];this.serial=0;}
  spawn(loot,x,y,layer,now){
    const entries=Object.entries(loot);
    for(let i=0;i<entries.length;i++){
      const [resource,amount]=entries[i],angle=-Math.PI/2+i*Math.PI*2/entries.length+.35;
      this.drops.push(new LootDrop({id:`drop-${++this.serial}`,resource,amount,x,y,layer,spawnAt:now,angle,distance:53+(i%2)*24}));
    }
  }
  update(now){this.drops=this.drops.filter(d=>d.active&&now-d.spawnAt<DROP_LIFETIME);}
  visible(bounds,layer){return this.drops.filter(d=>d.active&&d.layer===layer&&d.landX>bounds.left-120&&d.landX<bounds.right+120&&d.landY>bounds.top-120&&d.landY<bounds.bottom+120);}
  nearest(x,y,layer,now,range=125){let closest=null,best=range;for(const d of this.drops){if(!d.active||d.layer!==layer||!d.landed(now))continue;const distance=Math.hypot(x-d.landX,y-d.landY);if(distance<best){closest=d;best=distance;}}return closest;}
  collect(drop){if(!drop?.active)return false;drop.active=false;return true;}
}

export class RockProjectile {
  constructor({x,y,angle,speed,damage,layer,sourceId,createdAt}){
    Object.assign(this,{x,y,angle,speed,damage,layer,sourceId,createdAt,active:true});
    this.vx=Math.cos(angle)*speed;this.vy=Math.sin(angle)*speed;
  }
  update(dt,now,player){
    if(!this.active)return null;
    if(now-this.createdAt>2800||player.layer!==this.layer){this.active=false;return null;}
    const steps=Math.max(1,Math.ceil(this.speed*dt/12));
    for(let i=0;i<steps;i++){
      const x=this.x+this.vx*dt/steps,y=this.y+this.vy*dt/steps;
      if(!canWalk(x,y,this.layer,9)||[...PORTALS,...DESCENTS].some(p=>p[this.layer]&&Math.hypot(x-p[this.layer].x,y-p[this.layer].y)<210)){this.active=false;return null;}
      this.x=x;this.y=y;
      const playerSafe=[...PORTALS,...DESCENTS].some(p=>p[player.layer]&&Math.hypot(player.x-p[player.layer].x,player.y-p[player.layer].y)<225);
      if(!playerSafe&&Math.hypot(player.x-x,player.y-y)<31){this.active=false;return {damage:this.damage,sourceId:this.sourceId};}
    }
    return null;
  }
}

export class ProjectileRegistry {
  constructor(){this.projectiles=[];}
  launch(data,sourceId,now){this.projectiles.push(new RockProjectile({...data,sourceId,createdAt:now}));}
  update(dt,now,player){const hits=[];for(const projectile of this.projectiles){const hit=projectile.update(dt,now,player);if(hit)hits.push(hit);}this.projectiles=this.projectiles.filter(p=>p.active);return hits;}
  visible(bounds,layer){return this.projectiles.filter(p=>p.active&&p.layer===layer&&p.x>bounds.left-60&&p.x<bounds.right+60&&p.y>bounds.top-60&&p.y<bounds.bottom+60);}
  clear(){this.projectiles.length=0;}
}
