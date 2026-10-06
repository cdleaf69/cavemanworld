import {randomUUID} from 'node:crypto';
import {SURFACE,LAYERS,canWalk,waterAt,randomSurfaceSpawn,distanceToSegment} from './world.js';
import {STRUCTURE_CONFIG,structurePlacement,raftCanOccupy} from './frontier-structures.js';
import {ARMOR_PERKS} from './perks.js';
import {RECIPES} from './crafting.js';
export class LanWorld {
 constructor(){this.players=new Map();this.structures=new Map();this.listeners=new Set();this.projectiles=[];this.lastTick=0;}
 emit(type,data){const event={type,data};for(const fn of this.listeners)fn(event);}
 join(){const id=randomUUID(),token=randomUUID();this.players.set(id,{id,token,name:'Caveman '+id.slice(0,4),x:SURFACE.spawn.x,y:SURFACE.spawn.y,layer:'surface',facing:Math.PI/2,lastSeen:Date.now(),nextHit:0,nextCombat:0,health:100,maxHealth:100,lifeRevision:0,protectedUntil:Date.now()+2500});return {id,token};}
 publicPlayer(p){const {token,nextHit,nextCombat,lastSeen,protectedUntil,...data}=p;return data;}
 snapshot(){return {players:[...this.players.values()].map(p=>this.publicPlayer(p)),structures:[...this.structures.values()]};}
 leave(id){this.players.delete(id);for(const s of this.structures.values())if(s.driver===id){s.driver=null;this.emit('structure',s);}this.emit('leave',{id});}
 action(id,token,a,now=Date.now()){
 const p=this.players.get(id);if(!p||p.token!==token)throw Error('Reconnect to the local server.');p.lastSeen=now;
 const reachable=s=>s&&s.layer===p.layer&&Math.hypot(s.x-p.x,s.y-p.y)<260+s.radius;
 if(a.type==='respawn'){
  if(p.health>0)throw Error('You are still standing.');Object.assign(p,randomSurfaceSpawn(),{layer:'surface',health:p.maxHealth,protectedUntil:now+2500,lifeRevision:p.lifeRevision+1});this.emit('player',this.publicPlayer(p));return this.publicPlayer(p);
 }
 if(a.type==='strike'||a.type==='fire'){
  if(p.health<=0)throw Error('Respawn first.');if(now<p.nextCombat)throw Error('Wait for your next swing.');
  const tool=RECIPES.find(r=>r.id===p.tool&&r.category==='tool'),angle=Number(a.angle);if(!Number.isFinite(angle))throw Error('Choose an aim direction.');
  p.nextCombat=now+(tool?.cooldown||420);p.protectedUntil=0;
  const perk=ARMOR_PERKS[p.gear],damage=Math.max(1,Math.round((tool?.damage||1)*(perk?.stat==='power'?perk.base:1)));
  if(a.type==='fire'){
   if(!['bow','slingshot'].includes(tool?.type))throw Error('Equip a bow or slingshot.');const x=Number(a.x),y=Number(a.y);if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x-p.x,y-p.y)>130+(p.flightHeight||0)+(p.jumpHeight||0))throw Error('Fire from your held weapon.');
   const shot={id:randomUUID(),source:id,x,y,layer:p.layer,angle,type:tool.type,damage,speed:tool.type==='bow'?720:540,remaining:1100};this.projectiles.push(shot);this.emit('shots',this.projectiles);return {};
  }
  if(['rod','transport','waterskin','grapple'].includes(tool?.type))throw Error('Use a weapon.');
  const range=tool?.range||120,target=[...this.players.values()].filter(t=>t.id!==id&&t.health>0&&t.layer===p.layer&&Math.hypot(t.x-p.x,t.y-p.y)<range+24&&Math.abs(Math.atan2(Math.sin(Math.atan2(t.y-p.y,t.x-p.x)-angle),Math.cos(Math.atan2(t.y-p.y,t.x-p.x)-angle)))<Math.PI*.4).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  if(target&&this.clearShot(p.x,p.y,target.x,target.y,p.layer))this.hitPlayer(p,target,damage,now);return {};
 }
 if(a.type==='position'){
  if(a.lifeRevision===p.lifeRevision&&p.health>0&&Number.isFinite(a.health)&&Number.isFinite(a.maxHealth)){p.maxHealth=Math.max(100,Math.min(2000,Math.round(a.maxHealth)));p.health=Math.max(1,Math.min(p.maxHealth,Math.round(a.health)));}

  if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||!LAYERS[a.layer]||!canWalk(a.x,a.y,a.layer,12,true))throw Error('Invalid position.');
  Object.assign(p,{x:a.x,y:a.y,layer:a.layer,facing:Number.isFinite(a.facing)?a.facing:0,moving:!!a.moving,tool:RECIPES.some(r=>r.id===a.tool&&r.category==='tool')?a.tool:null,gear:RECIPES.some(r=>r.id===a.gear&&r.category==='gear')?a.gear:null,flightHeight:Math.max(0,Math.min(140,Number(a.flightHeight)||0)),jumpHeight:Math.max(0,Math.min(80,Number(a.jumpHeight)||0)),swimming:!!a.swimming,underwater:a.layer==='ocean',vehicleId:['crystal-glider','wood-scooter'].includes(a.vehicleId)?a.vehicleId:null,name:String(a.name||p.name).slice(0,24)});for(const s of this.structures.values())if(s.driver===id&&s.layer!==p.layer){s.driver=null;this.emit('structure',s);}this.emit('player',this.publicPlayer(p));return {};
 }
 if(a.type==='place'){
  const kind=a.kind;if(kind!=='campfire'&&!STRUCTURE_CONFIG[kind])throw Error('Unknown kit.');
  if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||a.layer!==p.layer||Math.hypot(a.x-p.x,a.y-p.y)>240)throw Error('Place within reach.');
  const registry={visible:(b,l)=>[...this.structures.values()].filter(s=>s.layer===l&&s.x>b.left-100&&s.x<b.right+100&&s.y>b.top-100&&s.y<b.bottom+100)};
  const valid=kind==='campfire'?{ok:!waterAt(a.x,a.y,a.layer)&&canWalk(a.x,a.y,a.layer,52)}:structurePlacement(kind,a,a.layer,registry);if(!valid.ok)throw Error(valid.message||'Choose open ground.');
  const cfg=STRUCTURE_CONFIG[kind]||{radius:42,solid:true};const s={id:randomUUID(),kind,x:a.x,y:a.y,layer:a.layer,owner:id,rotation:kind!=='reed-raft'&&!STRUCTURE_CONFIG[kind]?.tableTier&&a.rotation?Math.PI/2:0,...cfg,hits:0,open:false,fuel:0,input:0,progress:0,storage:{}};if(s.rotation&&s.width)[s.width,s.height]=[s.height,s.width];this.structures.set(s.id,s);this.emit('structure',s);return {structure:s};
 }
 const s=this.structures.get(a.id);
 if(a.type==='mine'){
  if(!reachable(s))throw Error('Move closer to the structure.');const tool=RECIPES.find(r=>r.id===a.tool&&r.category==='tool'),required=s.tableTier?(s.tableTier===1?'axe':'pickaxe'):['wood-wall','wood-roof','wood-floor','wood-gate','reed-raft'].includes(s.kind)?'axe':'pickaxe';
  if(tool?.type!==required)throw Error(`Use an ${required} on this structure.`);if(now<p.nextHit)throw Error('Wait for your next swing.');p.nextHit=now+450;s.hits++;
  if(s.hits>=3){this.structures.delete(s.id);this.emit('remove',{id:s.id,actor:id,structure:s});return {removed:true};}this.emit('structure',s);return {remaining:3-s.hits};
 }
 if(a.type==='gate'){if(!reachable(s)||s.kind!=='wood-gate')throw Error('Move closer to the gate.');s.open=!s.open;this.emit('structure',s);return {};}
 if(a.type==='board'){
  if(!reachable(s)||s.kind!=='reed-raft')throw Error('Move closer to the raft.');if(s.driver&&s.driver!==id)throw Error('The driver seat is occupied.');s.driver=s.driver===id?null:id;this.emit('structure',s);return {driver:s.driver};
 }
 if(a.type==='sail'){
  if(s?.driver!==id||s.kind!=='reed-raft'||!Number.isFinite(a.x)||!Number.isFinite(a.y))throw Error('Take the driver seat first.');
  const elapsed=Math.min(1,(now-(s.sailedAt||now-200))/1000);if(Math.hypot(a.x-s.x,a.y-s.y)>18000*elapsed+45||!raftCanOccupy(a.x,a.y))throw Error('The raft needs open water.');s.x=a.x;s.y=a.y;s.sailedAt=now;this.emit('structure',s);return {};
 }
 if(a.type==='state'){
  if(s?.owner!==id)throw Error('Only the builder can operate this machine.');const state=a.state||{};
  for(const k of ['fuel','input','progress','rawMeat','cookedMeat','rawFish','cookedFish'])if(Number.isFinite(state[k]))s[k]=Math.max(0,Math.min(100000,state[k]));
  if(state.storage&&typeof state.storage==='object')s.storage=Object.fromEntries(Object.entries(state.storage).filter(([k,v])=>k.length<60&&Number.isFinite(v)&&v>=0&&v<=100000));
  s.garden=state.garden||null;this.emit('structure',s);return {};
 }
 if(a.type==='chat'){const text=String(a.text||'').trim().slice(0,200);if(text)this.emit('chat',{id,name:p.name,text});return {};}
 throw Error('Unknown action.');
 }
 clearShot(x,y,tx,ty,layer){const steps=Math.ceil(Math.hypot(tx-x,ty-y)/12);for(let i=0;i<=steps;i++){const t=steps?i/steps:0;if(this.blocked(x+(tx-x)*t,y+(ty-y)*t,layer))return false;}return true;}
 blocked(x,y,layer){if(!canWalk(x,y,layer,5,true))return true;for(const s of this.structures.values())if(s.layer===layer&&s.solid&&!s.open&&(s.width?Math.abs(x-s.x)<s.width/2+4&&Math.abs(y-s.y)<s.height/2+4:Math.hypot(x-s.x,y-s.y)<s.radius+4))return true;return false;}
 hitPlayer(attacker,target,raw,now){if(now<(target.protectedUntil||0)||target.health<=0)return;const gear=RECIPES.find(r=>r.id===target.gear&&r.category==='gear'),perk=ARMOR_PERKS[target.gear],defense=Math.round((gear?.defense||0)*(perk?.stat==='defense'?perk.base:1)),damage=Math.max(1,raw-defense);target.health=Math.max(0,target.health-damage);target.lifeRevision++;target.protectedUntil=now+400;this.emit('pvp',{source:attacker.id,sourceName:attacker.name,target:target.id,targetName:target.name,damage,health:target.health,maxHealth:target.maxHealth,lifeRevision:target.lifeRevision,dead:target.health===0});this.emit('player',this.publicPlayer(target));}
 tick(now=Date.now()){
  const dt=Math.min(.1,Math.max(0,(now-(this.lastTick||now-33))/1000));this.lastTick=now;if(!this.projectiles.length)return;
  const players=[...this.players.values()];
  for(const s of this.projectiles){const distance=Math.min(s.remaining,s.speed*dt),steps=Math.max(1,Math.ceil(distance/10));for(let i=0;i<steps&&s.remaining>0;i++){s.x+=Math.cos(s.angle)*distance/steps;s.y+=Math.sin(s.angle)*distance/steps;s.remaining-=distance/steps;if(this.blocked(s.x,s.y,s.layer)){s.remaining=0;break;}const target=players.find(t=>t.id!==s.source&&t.health>0&&t.layer===s.layer&&distanceToSegment(s.x,s.y,t.x,t.y-(t.flightHeight||0)-(t.jumpHeight||0)-80,t.x,t.y-(t.flightHeight||0)-(t.jumpHeight||0)+8)<23);if(target){const attacker=this.players.get(s.source);if(attacker)this.hitPlayer(attacker,target,s.damage,now);s.remaining=0;break;}}}
  this.projectiles=this.projectiles.filter(s=>s.remaining>0);this.emit('shots',this.projectiles);
 }

}
