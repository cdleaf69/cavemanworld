import { EXTRA_CAVES } from './world.js';
import { BIOMES, CAVE_ROOMS, DEEP_ROOMS, canWalk, biomeAt, PORTALS, DESCENTS, PLAYER_RADIUS } from './world.js';

export const CREATURE_KINDS = Object.freeze({
  rabbit: { name:'Rabbit', temperament:'neutral', health:10, speed:60, radius:19, loot:{meat:1,hide:1} },
  deer: { name:'Deer', temperament:'neutral', health:22, speed:67, radius:27, loot:{meat:3,hide:2} },
  fox: { name:'Fox', temperament:'neutral', health:18, speed:88, radius:22, loot:{meat:2,hide:2} },
  boar: { name:'Boar', temperament:'neutral', health:38, speed:62, radius:29, loot:{meat:4,hide:3,bone:1} },
  tortoise: { name:'Moss Tortoise', temperament:'neutral', health:46, speed:30, radius:27, loot:{meat:2,shell:3} },
  snowHare: { name:'Snow Hare', temperament:'neutral', health:15, speed:94, radius:19, loot:{meat:1,hide:2} },
  marshCrane: { name:'Marsh Crane', temperament:'neutral', health:20, speed:77, radius:23, loot:{meat:2,wing:2} },
  sandLizard: { name:'Sand Lizard', temperament:'neutral', health:31, speed:71, radius:25, loot:{meat:2,hide:1,shell:1} },
  caveSlime: { name:'Cave Slime', temperament:'hostile', health:24, speed:47, radius:25, damage:8, attackRange:62, aggroRange:900, loot:{venom:1,stone:2} },
  crystalBeetle: { name:'Crystal Beetle', temperament:'hostile', health:48, speed:72, radius:30, damage:13, attackRange:68, aggroRange:950, charger:true, loot:{shell:2,quartz:2} },
  emberGolem: { name:'Ember Golem', temperament:'hostile', health:68, speed:44, radius:34, damage:19, attackRange:78, aggroRange:1000, loot:{stone:3,obsidian:2} },
  caveBat: { name:'Cave Bat', temperament:'hostile', health:14, speed:66, radius:21, damage:6, attackRange:62, aggroRange:900, loot:{bone:1,wing:1} },
  caveCrawler: { name:'Cave Crawler', temperament:'hostile', health:28, speed:54, radius:30, damage:10, attackRange:67, aggroRange:850, loot:{bone:1,shell:1,iron:1} },
  rockScorpion: { name:'Rock Scorpion', temperament:'hostile', health:34, speed:58, radius:31, damage:11, attackRange:70, aggroRange:1000, ranged:true, loot:{bone:1,stone:1,venom:1} },
  stoneRam: { name:'Stone Ram', temperament:'hostile', health:42, speed:70, radius:33, damage:16, attackRange:72, aggroRange:950, charger:true, loot:{hide:2,shell:1,stone:2} },
  frostWisp: { name:'Frost Wisp', temperament:'hostile', health:35, speed:85, radius:23, damage:13, attackRange:68, aggroRange:1000, loot:{quartz:2,glimmer:1} },
  mireLeech: { name:'Mire Leech', temperament:'hostile', health:39, speed:76, radius:26, damage:15, attackRange:66, aggroRange:990, loot:{venom:2,amber:1} },
  ashMite: { name:'Ash Mite', temperament:'hostile', health:52, speed:92, radius:26, damage:18, attackRange:68, aggroRange:1050, loot:{obsidian:1,shell:2} },
});

export const DEPTH_DIFFICULTY=Object.freeze({surface:{health:1,damage:1,speed:1},cave:{health:1,damage:1,speed:1},deep:{health:1.8,damage:1.3,speed:1.08},abyss:{health:2.8,damage:1.65,speed:1.16},core:{health:4,damage:2.1,speed:1.24}});

const entranceSafe=(x,y,layer,radius=225)=>[...PORTALS,...DESCENTS].some(p=>p[layer]&&Math.hypot(x-p[layer].x,y-p[layer].y)<radius);
const shinyRoll=(id,layer)=>{const n=[...id].reduce((v,c)=>Math.imul(v^c.charCodeAt(0),16777619),2166136261)>>>0;return n/4294967296<({core:.42,abyss:.35,deep:.28,cave:.065}[layer]??.02);};

export class Creature {
  constructor({id,kind,x,y,layer,shiny=false}) {
    const species=CREATURE_KINDS[kind];
    if(!species)throw new Error(`Unknown creature: ${kind}`);
    Object.assign(this,{id,kind,x,y,homeX:x,homeY:y,layer,...species,shiny});
    const difficulty=DEPTH_DIFFICULTY[layer]||DEPTH_DIFFICULTY.surface;
    this.health=Math.ceil(species.health*difficulty.health);this.speed=Math.round(species.speed*difficulty.speed);this.damage=Math.ceil((species.damage||0)*difficulty.damage);
    if(shiny){this.name=`Shiny ${species.name}`;this.health=Math.ceil(this.health*1.6);this.speed=Math.round(this.speed*1.12);this.damage=Math.ceil(this.damage*1.2);this.loot={...Object.fromEntries(Object.entries(species.loot).map(([r,n])=>[r,n+1])),glimmer:({deep:2,abyss:3,core:4}[layer]||1)};}
    this.maxHealth=species.health;this.alive=true;this.facing=0;this.nextAttackAt=0;this.respawnAt=0;this.fleeUntil=0;this.hitUntil=0;
    this.maxHealth=this.health;this.windupUntil=0;this.chargeUntil=0;this.nextChargeAt=0;this.chargeHit=false;
    this.seed=[...id].reduce((n,c)=>n+c.charCodeAt(0),0);
  }
  hit(damage,now){
    if(!this.alive||damage<=0)return {ok:false};
    this.health=Math.max(0,this.health-damage);this.hitUntil=now+280;
    if(this.temperament==='neutral')this.fleeUntil=now+4200;
    if(this.health>0)return {ok:true,dead:false};
    this.alive=false;this.respawnAt=now+60000;
    return {ok:true,dead:true,loot:{...this.loot}};
  }
  update(dt,now,player,canMove=canWalk){
    if(!this.alive){if(now>=this.respawnAt){this.alive=true;this.health=this.maxHealth;this.x=this.homeX;this.y=this.homeY;}return null;}
    if(player.layer!==this.layer||Math.hypot(player.x-this.x,player.y-this.y)>1100)return null;
    const dx=player.x-this.x,dy=player.y-this.y,distance=Math.hypot(dx,dy);
    const hostile=this.temperament==='hostile';
    const portalSafe=hostile&&entranceSafe(player.x,player.y,player.layer,135);
    const chasing=hostile&&!portalSafe&&distance<this.aggroRange;
    const fleeing=!hostile&&(distance<110||now<this.fleeUntil);
    let angle;
    if(chasing)angle=Math.atan2(dy,dx);
    else if(fleeing)angle=Math.atan2(-dy,-dx);
    else angle=Math.sin(now*.0004+this.seed)*2.8;
    this.facing=angle;
    const safePosition=(x,y)=>!hostile||!entranceSafe(x,y,this.layer,210);
    if(this.charger){
      if(portalSafe){this.windupUntil=0;this.chargeUntil=0;}
      else if(this.chargeUntil>now){
        const step=this.speed*4.5*dt,mx=Math.cos(this.chargeAngle)*step,my=Math.sin(this.chargeAngle)*step;
        if(safePosition(this.x+mx,this.y)&&canMove(this.x+mx,this.y,this.layer,this.radius))this.x+=mx;else this.chargeUntil=0;
        if(safePosition(this.x,this.y+my)&&canMove(this.x,this.y+my,this.layer,this.radius))this.y+=my;else this.chargeUntil=0;
        if(!this.chargeHit&&Math.hypot(player.x-this.x,player.y-this.y)<this.radius+PLAYER_RADIUS){this.chargeHit=true;return {creature:this,damage:this.damage+5};}
        return null;
      }else if(this.windupUntil){
        if(now<this.windupUntil)return null;
        this.windupUntil=0;this.chargeUntil=now+620;this.chargeHit=false;return null;
      }else if(chasing&&distance<330&&now>=this.nextChargeAt){
        this.chargeAngle=angle;this.windupUntil=now+600;this.nextChargeAt=now+3600;return null;
      }
    }
    if(this.ranged&&chasing&&distance<480&&now>=this.nextAttackAt){
      this.nextAttackAt=now+1750;
      return {creature:this,projectile:{x:this.x+Math.cos(angle)*34,y:this.y+Math.sin(angle)*34,angle,speed:280,damage:this.damage,layer:this.layer}};
    }
    if(hostile&&chasing&&distance<this.attackRange){
      if(now>=this.nextAttackAt){this.nextAttackAt=now+1250;return {creature:this,damage:this.damage};}
      return null;
    }
    const pace=chasing?this.speed:fleeing?this.speed*1.5:this.speed*.28;
    const step=Math.min(pace*dt,35);
    if(this.ranged&&chasing&&distance<220)return null;
    // Stay near the home habitat while wandering, but pursue a nearby player.
    if(!chasing&&!fleeing&&Math.hypot(this.x-this.homeX,this.y-this.homeY)>180)angle=Math.atan2(this.homeY-this.y,this.homeX-this.x);
    const moveX=Math.cos(angle)*step,moveY=Math.sin(angle)*step;
    if(safePosition(this.x+moveX,this.y)&&canMove(this.x+moveX,this.y,this.layer,this.radius))this.x+=moveX;
    if(safePosition(this.x,this.y+moveY)&&canMove(this.x,this.y+moveY,this.layer,this.radius))this.y+=moveY;
    return null;
  }
}

export class CreatureRegistry {
  constructor(){this.creatures=[];}
  add(creature){this.creatures.push(creature);}
  visible(bounds,layer){return this.creatures.filter(c=>c.alive&&c.layer===layer&&c.x>bounds.left-90&&c.x<bounds.right+90&&c.y>bounds.top-90&&c.y<bounds.bottom+90);}
  nearby(x,y,layer,range){return this.creatures.filter(c=>c.alive&&c.layer===layer&&Math.hypot(c.x-x,c.y-y)<range+c.radius);}
  update(dt,now,player,canMove){const attacks=[];for(const creature of this.creatures){const attack=creature.update(dt,now,player,canMove);if(attack)attacks.push(attack);}return attacks;}
}

export function populateCreatures(registry){
  registry.creatures.length=0;
  // The village has visible, approachable wildlife from the first minute.
  const starters=[['rabbit',9340,6870],['fox',8600,6910],['deer',9660,6970],['tortoise',9400,7350]];
  for(const [kind,x,y] of starters){const id=`village-${kind}-${x}`;registry.add(new Creature({id,kind,x,y,layer:'surface',shiny:shinyRoll(id,'surface')}));}
  for(const biome of BIOMES){
    for(let i=0;i<10;i++){
      const angle=i*2.399+biome.seed,rad=720+(i%3)*390;
      const x=Math.round(biome.center[0]+Math.cos(angle)*rad),y=Math.round(biome.center[1]+Math.sin(angle)*rad);
      if(biomeAt(x,y,'surface').id!==biome.id||!canWalk(x,y,'surface',35)||PORTALS.some(p=>Math.hypot(x-p.surface.x,y-p.surface.y)<260))continue;
      const pool=({woodland:['deer','fox','boar','rabbit'],marsh:['marshCrane','tortoise','boar','rabbit'],tundra:['snowHare','deer','fox'],badlands:['sandLizard','tortoise','fox','boar'],volcanic:['sandLizard','boar','tortoise','fox']})[biome.id]||['rabbit','deer','fox','boar','tortoise'];
      const id=`${biome.id}-${biome.seed}-animal-${i}`;registry.add(new Creature({id,kind:pool[i%pool.length],x,y,layer:'surface',shiny:shinyRoll(id,'surface')}));
    }
  }
  for(const [roomIndex,room] of CAVE_ROOMS.entries()){
    for(let i=0;i<4;i++){
      const angle=i*2.2+roomIndex*.8,radius=room.r*.57;
      const habitat=room.name.toLowerCase(),native=habitat.includes('frost')?'frostWisp':habitat.includes('mire')||habitat.includes('glow')?'mireLeech':habitat.includes('ash')?'ashMite':null;
      let x=Math.round(room.x+Math.cos(angle)*radius),y=Math.round(room.y+Math.sin(angle)*radius);
      if(native&&i===3)for(let attempt=0;attempt<16;attempt++){
        const a=attempt*Math.PI/8+roomIndex*.31,cx=Math.round(room.x+Math.cos(a)*room.r*.72),cy=Math.round(room.y+Math.sin(a)*room.r*.72);
        if(canWalk(cx,cy,'cave',34)&&!entranceSafe(cx,cy,'cave',190)){x=cx;y=cy;break;}
      }
      if(!canWalk(x,y,'cave',34)||entranceSafe(x,y,'cave',190))continue;
      const id=`cave-${roomIndex}-${i}`,kind=native&&i===3?native:['caveBat','caveCrawler','caveSlime'][(i+roomIndex)%3];registry.add(new Creature({id,kind,x,y,layer:'cave',shiny:shinyRoll(id,'cave')}));
    }
    if(roomIndex%2===0){
      const angle=roomIndex*.8+Math.PI*.35,x=Math.round(room.x+Math.cos(angle)*room.r*.57),y=Math.round(room.y+Math.sin(angle)*room.r*.57);
      const id=`cave-${roomIndex}-scorpion`;if(canWalk(x,y,'cave',34)&&!entranceSafe(x,y,'cave',190))registry.add(new Creature({id,kind:'rockScorpion',x,y,layer:'cave',shiny:shinyRoll(id,'cave')}));
    }
  }
  for(const [roomIndex,room] of DEEP_ROOMS.entries())for(let i=0;i<6;i++){
    const angle=i*1.047+roomIndex*.63,radius=room.r*.62,x=Math.round(room.x+Math.cos(angle)*radius),y=Math.round(room.y+Math.sin(angle)*radius);
    if(!canWalk(x,y,'deep',35)||entranceSafe(x,y,'deep',190))continue;
    const native=room.biome==='deep-tundra'?'frostWisp':room.biome==='deep-marsh'?'mireLeech':room.biome==='deep-volcanic'?'ashMite':null;
    const id=`deep-${roomIndex}-${i}`,kind=i===5&&native?native:['caveBat','crystalBeetle','rockScorpion','stoneRam','caveSlime','caveCrawler'][i];
    registry.add(new Creature({id,kind,x,y,layer:'deep',shiny:shinyRoll(id,'deep')||roomIndex===4&&i===3}));
  }
  for(const [layer,data] of Object.entries(EXTRA_CAVES))for(const [i,r] of data.rooms.entries())for(let j=0;j<4;j++){
    const pool=['emberGolem','crystalBeetle','rockScorpion','stoneRam','caveCrawler','caveSlime'];
    const native=r.biome.includes('tundra')?'frostWisp':r.biome.includes('marsh')?'mireLeech':r.biome.includes('volcanic')?'ashMite':null;
    const id=`${layer}-${i}-${j}`,kind=j===3&&native?native:pool[(i+j)%pool.length],m=new Creature({id,kind,x:r.x+Math.cos(j*1.57)*330,y:r.y+Math.sin(j*1.57)*330,layer,shiny:shinyRoll(id,layer)});
    if(!canWalk(m.x,m.y,layer,m.radius)||entranceSafe(m.x,m.y,layer,190))continue;
    m.loot={...m.loot,[r.material]:2};registry.add(m);
  }
  return registry.creatures.length;
}
