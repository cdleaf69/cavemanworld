export class Progression {
  constructor(level=1){this.level=Math.max(1,Math.min(20,Math.floor(level)));this.xp=0;}
  get required(){return 60+this.level*35;}
  gain(amount){if(!Number.isFinite(amount)||amount<=0)return 0;this.xp+=Math.round(amount*(this.multiplier||1));let gained=0;while(this.level<20&&this.xp>=this.required){this.xp-=this.required;this.level++;gained++;}if(this.level===20)this.xp=0;return gained;}
  upgrade(amount=1){this.level=Math.min(20,this.level+Math.max(0,Math.floor(amount)));this.xp=0;}
}
