export const BOW_FORMS=[
 {name:'Wood Bow',tier:'wood',damage:12,cooldown:550},
 {name:'Bound Bow',tier:'wood',damage:14,cooldown:535,level:1,cost:{wood:4,hide:2}},
 {name:'Reinforced Bow',tier:'iron',damage:18,cooldown:515,level:3,cost:{iron:5,wood:5,sinew:2}},
 {name:'Quartz Recurve',tier:'quartz',damage:25,cooldown:485,level:3,cost:{quartz:8,sinew:3,wing:3}},
 {name:'Moonstone Longbow',tier:'moonstone',damage:36,cooldown:450,level:6,cost:{moonstone:10,sinew:4,fang:3}},
 {name:'Cobalt Warbow',tier:'cobalt',damage:52,cooldown:405,level:9,cost:{cobalt:14,sinew:5,essence:4}},
 {name:'Adamantite Greatbow',tier:'adamantite',damage:76,cooldown:350,level:12,cost:{adamantite:18,infernite:8,essence:8}},
];
export const bowForm=item=>BOW_FORMS[item?.bowLevel||0];
export const nextBowForm=item=>BOW_FORMS[(item?.bowLevel||0)+1];
export function evolveBow(inventory,id){const item=inventory.owned.get(id),next=nextBowForm(item);if(item?.type!=='bow'||!next)return {ok:false,message:'This bow is fully evolved.'};if(inventory.progression.level<next.level)return {ok:false,message:`Requires level ${next.level}.`};if(Object.entries(next.cost).some(([r,n])=>inventory.resources[r]<n))return {ok:false,message:'Bring the materials shown.'};for(const [r,n] of Object.entries(next.cost))inventory.consume(r,n);item.bowLevel=(item.bowLevel||0)+1;Object.assign(item,{name:next.name,tier:next.tier,damage:next.damage,cooldown:next.cooldown,baseDamage:next.damage});return {ok:true,message:`Evolved into ${next.name}!`};}
export function equipmentRecipe(recipe,item){return item?.type==='bow'?{...recipe,...bowForm(item),bowLevel:item.bowLevel||0,id:recipe.id}:recipe;}
