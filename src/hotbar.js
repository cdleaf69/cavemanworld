import { RECIPES } from './crafting.js';

export class Hotbar {
  constructor(size=6){this.slots=Array(size).fill(null);this.selected=0;}
  get current(){return this.slots[this.selected];}
  select(index){if(index<0||index>=this.slots.length)return false;this.selected=index;return true;}
  assign(kind,id){
    if(!this.allowed({kind,id}))return -1;
    const old=this.slots.findIndex(slot=>slot?.kind===kind&&slot.id===id);
    if(old>=0){this.selected=old;return old;}
    const empty=this.slots.findIndex(slot=>!slot);
    const index=empty>=0?empty:this.selected;
    this.slots[index]={kind,id};this.selected=index;return index;
  }
  allowed(slot,inventory=null){
    if(!slot)return true;
    const recipe=RECIPES.find(r=>r.id===slot.id);
    if(slot.kind==='equipment')return recipe?.category==='tool'&&(!inventory||inventory.owned.has(slot.id));
    if(slot.kind==='structure')return recipe?.category==='structure'&&(!inventory||(inventory.structures[slot.id]||0)>0);
    return slot.kind==='resource'&&['cookedMeat','cookedFish','driedMarijuana'].includes(slot.id)&&(!inventory||(inventory.resources[slot.id]||0)>0);
  }
  place(index,slot,inventory,fromIndex=null){
    if(index<0||index>=this.slots.length||!this.allowed(slot,inventory))return false;
    if(fromIndex!==null){
      if(fromIndex<0||fromIndex>=this.slots.length||!this.slots[fromIndex])return false;
      [this.slots[index],this.slots[fromIndex]]=[this.slots[fromIndex],this.slots[index]];
    }else{
      const previous=this.slots.findIndex(s=>s?.kind===slot.kind&&s.id===slot.id);
      if(previous>=0&&previous!==index)this.slots[previous]=null;
      this.slots[index]={kind:slot.kind,id:slot.id};
    }
    return true;
  }
  clear(index){if(index<0||index>=this.slots.length)return false;this.slots[index]=null;return true;}
  removeDepleted(inventory){
    for(let i=0;i<this.slots.length;i++){
      const slot=this.slots[i];
      if(slot&&!this.allowed(slot,inventory))this.slots[i]=null;
    }
  }
}
