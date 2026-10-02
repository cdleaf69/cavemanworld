export const FRONTIER_RESOURCES={
 rawMarijuana:['Fresh Marijuana','Sparse clustered plants on mountain plateaus','Dry one plant harvest for 30 seconds in a fueled drying shack.','✿'],
 driedMarijuana:['Dried Marijuana','Drying shack','Use for +50% maximum health and +50% XP for 60 seconds. Refreshes duration; does not stack.','✿'],
 alpineFiber:['Alpine Fiber','Mountain plateau tufts','Glider cloth, climbing equipment, and advanced fishing lines.','⌁'],
 skyCrystal:['Sky Crystal','Mountain summit crystals','High-altitude power source for technical tools and buildings.','✦'],
 eagleFeather:['Eagle Feather','Summit nests and Bigfoot','Lightweight transport and quest material.','⌁'],
 bigfootFur:['Bigfoot Fur','Defeat a mountain Bigfoot','Boss trophy and reinforced clothing.','▣'],
 pearl:['Pearl','Ocean floor shells and treasure','Fishing quests and diving equipment.','◉'],
 coral:['Coral','Ocean floor outcrops','Breathing armor and sea crafting.','✧'],
 seaScale:['Sea Scale','Ocean wildlife','Rafts and aquatic equipment.','◇'],
 seaEssence:['Sea Essence','Deep ocean predators and treasure','The fisherman’s final trial and technical equipment.','✦'],
 sunkenRelic:['Sunken Relic','Deep ocean treasure chests','Final fisherman quest offering.','▣'],
};
export const FRONTIER_RECIPES=[
 {id:'reef-rod',name:'Reef Rod',category:'tool',type:'rod',tier:'iron',damage:3,level:3,cost:{wood:8,iron:6,sinew:4,coral:3},detail:'Reinforced line unlocks larger sea catches.'},
 {id:'abyss-rod',name:'Abyss Rod',category:'tool',type:'rod',tier:'moonstone',damage:5,level:6,cost:{moonstone:8,alpineFiber:6,skyCrystal:3,pearl:4},detail:'Deep-water line for the largest and most valuable fish.'},
 {id:'tidekeeper-armor',name:'Tidekeeper Armor',category:'gear',slot:'body',tier:'iron',defense:22,questOnly:true,level:1,cost:{},detail:'Fisherman quest 10 reward. Breathe underwater indefinitely while equipped.'},
 {id:'summit-armor',name:'Summit Ranger Armor',category:'gear',slot:'body',tier:'stone',defense:18,level:7,cost:{bigfootFur:5,skyCrystal:4,alpineFiber:8},detail:'Bigfoot fur and summit fibers reinforce this expedition armor.'},
 {id:'diver-wrap',name:'Diver Wrap',category:'gear',slot:'body',tier:'wood',defense:7,level:2,cost:{hide:8,shell:8,coral:3},detail:'Doubles the normal diving breath reserve.'},
 {id:'wood-scooter',name:'Woodland Scooter',category:'tool',type:'transport',tier:'wood',damage:0,level:2,cost:{wood:16,iron:4,hide:3},detail:'Select on the hotbar for 1.8× land travel. Cannot climb mountain slopes.'},
 {id:'reed-raft',name:'Reed Raft',category:'tool',type:'transport',tier:'wood',damage:0,level:2,cost:{wood:18,leaves:12,sinew:4},detail:'Select while on water for fast surface travel and offshore fishing. V dives beneath it.'},
 {id:'crystal-glider',name:'Crystal Glider',category:'tool',type:'transport',tier:'moonstone',damage:0,level:6,cost:{alpineFiber:12,eagleFeather:6,skyCrystal:5,wood:12},detail:'3.2× land travel; gains a further downhill boost on mountains.'},
 {id:'grappling-tool',name:'Climbing Grapple',category:'tool',type:'grapple',tier:'iron',damage:0,level:4,cost:{iron:10,sinew:8,alpineFiber:4},detail:'Click nearby ground to pull yourself along a clear route. Walls still block the rope.'},
 {id:'powered-drill',name:'Crystal Drill',category:'tool',type:'pickaxe',tier:'adamantite',power:22,yield:28,damage:24,level:9,cost:{adamantite:8,cobalt:8,skyCrystal:6,essence:4},detail:'A geared crystal motor cuts ore much faster than ordinary pickaxes.'},
 ...[
 ['drying-shack','Drying Shack',{wood:20,stone:10,leaves:12},3,'Load fresh marijuana and wood; dries each unit in 30 seconds.'],
 ['wood-floor','Wood Foundation',{wood:4},1,'A flat base floor. Snap adjacent pieces into a platform.'],
 ['stone-wall','Stone Wall',{stone:8,wood:2},2,'Solid base wall. R rotates before placement.'],
 ['wood-gate','Wood Gate',{wood:8,iron:2},2,'Open or close with E. Only a closed gate blocks movement.'],
 ['storage-chest','Storage Chest',{wood:10,iron:2},2,'Store resources in your base and withdraw them later.'],
 ['fish-trap','Baited Fish Trap',{wood:10,sinew:4,iron:2},3,'Place in shallow water. Each leaf bait catches one fish every 45 seconds.'],
 ['ore-extractor','Ore Extractor',{iron:16,cobalt:6,skyCrystal:3},6,'Place near cave ore. Fuel with wood; uses your best pickaxe and the actual deposit.'],
 ['timber-rig','Timber Rig',{wood:18,iron:10,sinew:5},4,'Place near a tree. Fuel with wood; uses your best crafted axe on that tree.'],
 ['healing-totem','Restoration Totem',{essence:6,skyCrystal:3,wood:10},5,'Fuel with essence. Restores nearby health; useful in caves.'],
 ].map(([id,name,cost,level,detail])=>({id,name,cost,level,detail,category:'structure',tier:level>=5?'iron':'wood'})),
];
export const TRANSPORT={
 'wood-scooter':{land:1.8,water:.4},'reed-raft':{land:.75,water:2.3,boat:true},'crystal-glider':{land:3.2,water:.8,glider:true},
};
