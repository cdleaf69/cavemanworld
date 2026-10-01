export function weaponDamage(tool){return tool?.damage??1;}
export function armorReduction(gear,multiplier=1){return Math.round((gear?.defense??0)*multiplier);}

export class PlayerVitals {
  constructor(maxHealth=100){this.maxHealth=maxHealth;this.health=maxHealth;this.invulnerableUntil=0;}
  setMaxHealth(maxHealth){
    const next=Math.max(1,Math.round(maxHealth));
    if(next===this.maxHealth)return;
    this.health=Math.min(next,Math.max(1,Math.round(this.health*next/this.maxHealth)));
    this.maxHealth=next;
  }
  takeDamage(raw,gear,now,defenseMultiplier=1){
    if(this.health<=0||now<this.invulnerableUntil)return {damage:0,dead:false};
    const damage=Math.max(1,raw-armorReduction(gear,defenseMultiplier));
    this.health=Math.max(0,this.health-damage);this.invulnerableUntil=now+400;
    return {damage,dead:this.health===0};
  }
  heal(amount){const before=this.health;this.health=Math.min(this.maxHealth,this.health+amount);return this.health-before;}
  respawn(now){this.health=this.maxHealth;this.invulnerableUntil=now+2500;}
}

export function attackTarget(creatures,player,range=120,arc=Math.PI*.75){
  let target=null,best=Infinity;
  for(const creature of creatures){
    if(!creature.alive||creature.layer!==player.layer)continue;
    const dx=creature.x-player.x,dy=creature.y-player.y,distance=Math.hypot(dx,dy)-creature.radius;
    if(distance>range||distance>=best)continue;
    const difference=Math.atan2(Math.sin(Math.atan2(dy,dx)-player.facing),Math.cos(Math.atan2(dy,dx)-player.facing));
    if(Math.abs(difference)<=arc/2){target=creature;best=distance;}
  }
  return target;
}
