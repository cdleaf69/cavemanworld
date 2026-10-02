import { MATERIALS } from './materials.js';
// Runtime objects are deliberately separate from the vector terrain. The
// spawner creates these from polygon zones; the terrain renderer never does.
export const TIERS = Object.freeze({
  leaf: { rank: 1, inputs: ['leaves'] },
  wood: { rank: 2, inputs: ['wood'] },
  stone: { rank: 3, inputs: ['stone'] },
  iron: { rank: 4, inputs: ['iron'] },
  copper: { rank: 3.5, inputs: ['copper'] },
  quartz: { rank: 3.5, inputs: ['quartz'] },
  amber: { rank: 3.5, inputs: ['amber'] },
  obsidian: { rank: 5, inputs: ['obsidian'] },
  moonstone: { rank: 5, inputs: ['moonstone'] },
  ...Object.fromEntries(MATERIALS.map(m=>[m.id,{rank:m.rank,inputs:[m.id]}])),
});
export const ORE_RARITY = Object.freeze({
  ...Object.fromEntries(MATERIALS.map(m=>[m.id,{weight:Math.max(1,7-m.depth),label:m.depth>=3?'rare':'uncommon'}])),
  copper:{weight:10,label:'common'},iron:{weight:8,label:'common'},
  quartz:{weight:4,label:'uncommon'},amber:{weight:4,label:'uncommon'},
  obsidian:{weight:2,label:'rare'},moonstone:{weight:1,label:'very rare'},
});

export class ResourceNode {
  constructor({ id, kind, resource, x, y, layer, zoneId, quantity = 1, radius = 20, respawnMs = 90000 }) {
    Object.assign(this, { id, kind, resource, x, y, layer, zoneId, quantity, maxQuantity: quantity, radius, respawnMs });
    this.active = true;
    this.respawnAt = 0;
    this.blocking = ['tree', 'rock', 'ore'].includes(kind);
  }
  get label() {
    return ({ tree: 'Tree', bush: 'Foraging Bush', rock: 'Boulder', ore: `${this.resource[0].toUpperCase()+this.resource.slice(1)} Deposit`, ground: {
      leaves: 'Fallen Leaves', sticks: 'Loose Stick', wood: 'Log', stone: 'Pebble', iron: 'Iron Scrap',
    }[this.resource] })[this.kind] || this.kind;
  }
  get rarity(){return this.kind==='ore'?ORE_RARITY[this.resource]?.label:null;}
  take(now, equippedTool = null) {
    if (!this.active) return { ok: false, message: 'Already gathered' };
    if (now < (this.nextHitAt || 0)) return { ok:false, cooldown:true };
    if(this.kind==='tree'&&equippedTool?.type!=='axe')return {ok:false,message:'Trees need an axe. Craft a Crude Stone Axe with 2 sticks + 2 stones (C).'};
    if(this.kind==='rock'&&equippedTool?.type!=='pickaxe')return {ok:false,message:'This boulder needs a pickaxe. Pick up small pebbles by hand.'};
    const material=MATERIALS.find(m=>m.id===this.resource);
    const minimum=material?.minimumRank||(['obsidian','moonstone'].includes(this.resource)?TIERS.iron.rank:TIERS.stone.rank);
    if (this.kind === 'ore' && !(equippedTool?.type === 'pickaxe' && TIERS[equippedTool.tier].rank >= minimum)) {
      return { ok: false, message: material?.depth>=3?`This vein needs a depth ${material.depth-1} pickaxe or better`:minimum===TIERS.iron.rank?'This rare vein needs an Iron Pickaxe (C)':'Equip a Stone Pickaxe or better (C)' };
    }
    this.nextHitAt=now+600;
    if(this.blocking){
      this.quantity-=equippedTool.power;
      if(this.quantity>0)return {ok:true,progress:true,remaining:this.quantity,loot:{}};
    }
    this.quantity=0;this.active=false;this.respawnAt=now+this.respawnMs;
    const amount=this.blocking?equippedTool.yield:1;
    const loot=this.kind==='bush'?{leaves:2,sticks:2}:{[this.resource]:amount};
    return { ok: true, resource: this.resource, amount, loot, depleted: true };
  }
  update(now) {
    if (!this.active && now >= this.respawnAt) { this.active = true; this.quantity = this.maxQuantity;this.nextHitAt=0; }
  }
}

export class Tool {
  constructor({ id, type, tier, durability = 100, power, yield:harvestYield, damage,range=120,cooldown=420,knockback=0 }) {
    if (!['pickaxe', 'axe', 'rock', 'club', 'rod', 'bow', 'slingshot','sword','spear','warhammer','transport','grapple'].includes(type)) throw new Error(`Unknown tool: ${type}`);
    if (!TIERS[tier]) throw new Error(`Unknown tier: ${tier}`);
    Object.assign(this, { id, type, tier, durability,range,cooldown,knockback, power:power??(tier==='iron'?3:1), yield:harvestYield??(tier==='iron'?6:3), damage:damage??2 });
  }
}

export class Gear {
  constructor({ id, slot, tier, durability = 100, defense }) {
    if (!['head', 'body', 'hands', 'feet'].includes(slot)) throw new Error(`Unknown gear slot: ${slot}`);
    if (!TIERS[tier]) throw new Error(`Unknown tier: ${tier}`);
    Object.assign(this, { id, slot, tier, durability, defense:defense??0 });
  }
}

export class Decoration {
  constructor({ id, kind, x, y, layer, zoneId }) { Object.assign(this, { id, kind, x, y, layer, zoneId }); }
}

export class SpawnableRegistry {
  constructor() { this.nodes = new Map(); this.decorations = new Map(); this.cells=new Map(); }
  clear() { this.nodes.clear(); this.decorations.clear(); this.cells.clear(); }
  cellKey(item){return `${item.layer}:${Math.floor(item.x/512)}:${Math.floor(item.y/512)}`;}
  index(item,type){const key=this.cellKey(item);if(!this.cells.has(key))this.cells.set(key,{nodes:new Set(),decorations:new Set()});this.cells.get(key)[type].add(item);}
  addNode(node) { const old=this.nodes.get(node.id);if(old)this.cells.get(this.cellKey(old))?.nodes.delete(old);this.nodes.set(node.id, node);this.index(node,'nodes'); }
  addDecoration(decoration) { const old=this.decorations.get(decoration.id);if(old)this.cells.get(this.cellKey(old))?.decorations.delete(old);this.decorations.set(decoration.id, decoration);this.index(decoration,'decorations'); }
  remove(id) { for(const type of ['nodes','decorations']){const item=this[type].get(id);if(item)this.cells.get(this.cellKey(item))?.[type].delete(item);this[type].delete(id);} }
  *query(bounds,layer,type){for(let y=Math.floor(bounds.top/512);y<=Math.floor(bounds.bottom/512);y++)for(let x=Math.floor(bounds.left/512);x<=Math.floor(bounds.right/512);x++){const cell=this.cells.get(`${layer}:${x}:${y}`);if(cell)yield* cell[type];}}
  update(now) { for (const node of this.nodes.values()) node.update(now); }
  visible(bounds, layer) {
    const inBounds = item => item.layer === layer && item.x >= bounds.left - 130 && item.x <= bounds.right + 130 && item.y >= bounds.top - 130 && item.y <= bounds.bottom + 130;
    return {
      nodes: [...this.query({left:bounds.left-130,right:bounds.right+130,top:bounds.top-130,bottom:bounds.bottom+130},layer,'nodes')].filter(n => n.active && inBounds(n)),
      decorations: [...this.query({left:bounds.left-130,right:bounds.right+130,top:bounds.top-130,bottom:bounds.bottom+130},layer,'decorations')].filter(inBounds),
    };
  }
  nearest(x, y, layer, range = 130) {
    let nearest = null, best = range;
    for (const node of this.query({left:x-range-160,right:x+range+160,top:y-range-160,bottom:y+range+160},layer,'nodes')) {
      if (!node.active || node.layer !== layer) continue;
      const d = Math.hypot(x - node.x, y - node.y) - node.radius;
      if (d < best) { nearest = node; best = d; }
    }
    return nearest;
  }
  blocks(x, y, layer, playerRadius = 24) {
    // Resource nodes and scenery are visual and gatherable, not movement obstacles.
    return false;
  }
  at(x,y,layer){
    let hit=null,best=Infinity;
    for(const node of this.query({left:x-180,right:x+180,top:y-120,bottom:y+360},layer,'nodes')){
      if(!node.active||node.layer!==layer)continue;
      const distance=Math.hypot(x-node.x,y-node.y);
      const scale=node.scale||1;
      const canopy=node.kind==='tree'&&((x-node.x)/(80*scale))**2+((y-node.y+125*scale)/(115*scale))**2<1;
      const shrub=node.kind==='bush'&&((x-node.x)/(48*scale))**2+((y-node.y+35*scale)/(44*scale))**2<1;
      if((distance<node.radius+18||canopy||shrub)&&distance<best){hit=node;best=distance;}
    }
    return hit;
  }
}
