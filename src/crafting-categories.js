export const CRAFT_CATEGORIES=[['tools','Tools'],['weapons','Weapons'],['armor','Armor'],['fishing','Fishing'],['building','Building'],['workshops','Workshops'],['machines','Machines'],['travel','Travel']];
export function craftingCategory(recipe){
 if(recipe.category==='resource')return 'weapons';
 if(recipe.tableTier)return 'workshops';
 if(recipe.type==='rod'||recipe.id==='fish-trap')return 'fishing';
 if(recipe.type==='transport'||recipe.type==='grapple'||recipe.id==='reed-raft')return 'travel';
 if(recipe.category==='gear')return 'armor';
 if(recipe.category==='tool')return ['axe','pickaxe'].includes(recipe.type)||recipe.id==='powered-drill'?'tools':'weapons';
 if(['drying-shack','ore-extractor','timber-rig','healing-totem'].includes(recipe.id))return 'machines';
 return 'building';
}
