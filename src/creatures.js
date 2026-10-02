import { EXTRA_CAVES } from './world.js';
import { BIOMES, CAVE_ROOMS, DEEP_ROOMS, canWalk, biomeAt, PORTALS, DESCENTS, PLAYER_RADIUS } from './world.js';

export const CREATURE_KINDS = Object.freeze({
  wolf:{name:'Grey Wolf',temperament:'neutral',health:40,speed:100,radius:26,loot:{meat:3,hide:2,sinew:2,fang:1}},
  caveSpider:{name:'Cave Spider',temperament:'hostile',health:25,speed:104,radius:24,damage:8,attackRange:58,aggroRange:950,loot:{sinew:2,fang:1,venom:1}},
  rootStalker:{name:'Root Stalker',temperament:'hostile',health:42,speed:59,radius:31,damage:12,attackRange:80,aggroRange:950,loot:{wood:3,sinew:1,verdite:1}},
  frostSerpent:{name:'Frost Serpent',temperament:'hostile',health:40,speed:83,radius:27,damage:14,attackRange:85,aggroRange:1080,loot:{fang:2,quartz:2,essence:1}},
  duneBurrower:{name:'Dune Burrower',temperament:'hostile',health:48,speed:65,radius:30,damage:13,attackRange:72,aggroRange:940,charger:true,loot:{shell:2,fang:1,sinew:1,copper:1}},
  bogSpitter:{name:'Bog Spitter',temperament:'hostile',health:33,speed:48,radius:27,damage:12,attackRange:65,aggroRange:1000,ranged:true,loot:{venom:2,sinew:1,amber:1}},
  obsidianSentinel:{name:'Obsidian Sentinel',temperament:'hostile',health:90,speed:35,radius:37,damage:23,attackRange:90,aggroRange:1000,loot:{obsidian:3,essence:2,stone:3}},
  crystalMoth:{name:'Crystal Moth',temperament:'hostile',health:30,speed:111,radius:22,damage:11,attackRange:65,aggroRange:1100,loot:{wing:3,essence:2,moonstone:1}},
  voidReaper:{name:'Void Reaper',temperament:'hostile',health:58,speed:99,radius:27,damage:21,attackRange:92,aggroRange:1150,loot:{essence:3,fang:2,glimmer:1}},
  magmaBrute:{name:'Magma Brute',temperament:'hostile',health:100,speed:46,radius:39,damage:26,attackRange:88,aggroRange:1100,charger:true,loot:{infernite:2,essence:2,shell:2}},
  rabbit: { name:'Rabbit', temperament:'neutral', health:10, speed:60, radius:19, loot:{meat:1,hide:1} },
  deer: { name:'Deer', temperament:'neutral', health:22, speed:67, radius:27, loot:{meat:3,hide:2} },
  fox: { name:'Fox', temperament:'neutral', health:18, speed:88, radius:22, loot:{meat:2,hide:2} },
  boar: { name:'Boar', temperament:'neutral', health:38, speed:62, radius:29, loot:{meat:4,hide:3,bone:1,sinew:2} },
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

export const DEPTH_DIFFICULTY=Object.freeze({surface:{health:1,damage:1,speed:1},cave:{health:1.35,damage:1.15,speed:1.45},deep:{health:3.2,damage:1.65,speed:1.8},abyss:{health:6,damage:2.3,speed:2.15},core:{health:10,damage:3,speed:2.5}});

const entranceSafe=(x,y,layer,radius=225)=>[...PORTALS,...DESCENTS].some(p=>p[layer]&&Math.hypot(x-p[layer].x,y-p[layer].y)<radius);
const shinyRoll=(id,layer)=>{const n=[...id].reduce((v,c)=>Math.imul(v^c.charCodeAt(0),16777619),2166136261)>>>0;return n/4294967296<({core:.42,abyss:.35,deep:.28,cave:.065}[layer]??.02);};

export class Creature {
  constructor({id,kind,x,y,layer,shiny=false}) {
    const species=CREATURE_KINDS[kind];
    if(!species)throw new Error(`Unknown creature: ${kind}`);
    Object.assign(this,{id,kind,x,y,homeX:x,homeY:y,layer,...species,shiny});
    const difficulty=DEPTH_DIFFICULTY[layer]||DEPTH_DIFFICULTY.surface;
    this.health=Math.ceil(species.health*difficulty.health);this.speed=Math.round(species.speed*difficulty.speed);this.damage=Math.ceil((species.damage||0)*difficulty.damage);
    this.aggroRange=(species.aggroRange||0)*(1.3+(['cave','deep','abyss','core'].indexOf(layer)+1)*.08);this.alertUntil=0;
    if(shiny){this.name=`Shiny ${species.name}`;this.health=Math.ceil(this.health*1.6);this.speed=Math.round(this.speed*1.12);this.damage=Math.ceil(this.damage*1.2);this.loot={...Object.fromEntries(Object.entries(species.loot).map(([r,n])=>[r,n+1])),glimmer:({deep:2,abyss:3,core:4}[layer]||1)};}
    this.maxHealth=species.health;this.alive=true;this.facing=0;this.nextAttackAt=0;this.respawnAt=0;this.fleeUntil=0;this.hitUntil=0;
    this.maxHealth=this.health;this.windupUntil=0;this.chargeUntil=0;this.nextChargeAt=0;this.chargeHit=false;
    this.seed=[...id].reduce((n,c)=>n+c.charCodeAt(0),0);
  }
  hit(damage,now){
    if(!this.alive||damage<=0)return {ok:false};
    this.health=Math.max(0,this.health-damage);this.hitUntil=now+280;
    if(this.temperament==='hostile')this.alertUntil=now+6000;
    if(this.temperament==='neutral')this.fleeUntil=now+4200;
    if(this.health>0)return {ok:true,dead:false};
    this.alive=false;this.respawnAt=now+60000;
    return {ok:true,dead:true,loot:{...this.loot}};
  }
  update(dt,now,player,canMove=canWalk){
    if(!this.alive){if(now>=this.respawnAt){this.alive=true;this.health=this.maxHealth;this.x=this.homeX;this.y=this.homeY;}return null;}
    if(player.layer!==this.layer||Math.hypot(player.x-this.x,player.y-this.y)>Math.max(1100,this.aggroRange*1.4))return null;
    const dx=player.x-this.x,dy=player.y-this.y,distance=Math.hypot(dx,dy);
    const hostile=this.temperament==='hostile';
    const portalSafe=hostile&&entranceSafe(player.x,player.y,player.layer,135);
    const chasing=hostile&&!portalSafe&&(distance<this.aggroRange||now<this.alertUntil&&distance<this.aggroRange*1.4);
    if(chasing&&distance<this.aggroRange)this.alertUntil=now+4000;
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
  for(const biome of BIOMES){
    for(let i=0;i<10;i++){
      const angle=i*2.399+biome.seed,rad=720+(i%3)*390;
      const x=Math.round(biome.center[0]+Math.cos(angle)*rad),y=Math.round(biome.center[1]+Math.sin(angle)*rad);
      if(biomeAt(x,y,'surface').id!==biome.id||!canWalk(x,y,'surface',35)||PORTALS.some(p=>Math.hypot(x-p.surface.x,y-p.surface.y)<260))continue;
      const pool=({woodland:['deer','fox','boar','rabbit','wolf'],marsh:['marshCrane','tortoise','boar','rabbit'],tundra:['snowHare','deer','fox'],badlands:['sandLizard','tortoise','fox','boar'],volcanic:['sandLizard','boar','tortoise','fox']})[biome.id]||['rabbit','deer','fox','boar','tortoise'];
      const id=`${biome.id}-${biome.seed}-animal-${i}`;registry.add(new Creature({id,kind:pool[i%pool.length],x,y,layer:'surface',shiny:shinyRoll(id,'surface')}));
    }
  }
  for(const [layer,rooms] of [['cave',CAVE_ROOMS],['deep',DEEP_ROOMS],...Object.entries(EXTRA_CAVES).map(([l,g])=>[l,g.rooms])]){
    const depth=['cave','deep','abyss','core'].indexOf(layer)+1;
    for(const [roomIndex,room] of rooms.entries()){
      const biome=(room.biome||'woodland').replace('deep-','');
      const local=({woodland:['rootStalker','caveSpider','caveBat'],tundra:['frostWisp','frostSerpent','caveBat'],marsh:['mireLeech','bogSpitter','caveSlime'],badlands:['duneBurrower','rockScorpion','stoneRam'],volcanic:['ashMite','emberGolem','rockScorpion']})[biome]||['caveSpider','caveCrawler'];
      const pool=depth===1?local:depth===2?[...local,'crystalBeetle','crystalMoth']:depth===3?[local[0],local[1],'crystalMoth','obsidianSentinel','voidReaper']:[local[0],'voidReaper','obsidianSentinel','magmaBrute','crystalMoth'];
      for(let i=0;i<7+depth*2;i++){
        const angle=i*2.399+roomIndex*.71,radius=room.r*(.35+(i%3)*.18),x=Math.round(room.x+Math.cos(angle)*radius),y=Math.round(room.y+Math.sin(angle)*radius);
        if(!canWalk(x,y,layer,40)||entranceSafe(x,y,layer,250))continue;
        const id=`${layer}-${roomIndex}-${i}`,kind=pool[(i+roomIndex)%pool.length],m=new Creature({id,kind,x,y,layer,shiny:shinyRoll(id,layer)});
        const material=room.material;if(material)m.loot={...m.loot,[material]:1+depth};registry.add(m);
      }
    }
  }
  return registry.creatures.length;
}
