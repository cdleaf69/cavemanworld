// Equal base stats within a depth; the biome decides the armor's specialty.
export const MATERIALS=[
  ['copper','Copper','badlands','power',1],['quartz','Quartz','tundra','health',1],['amber','Amber','marsh','speed',1],['verdite','Verdite','woodland','health',1],['basalt','Basalt','volcanic','defense',1],
  ['obsidian','Obsidian','volcanic','power',2],['moonstone','Moonstone','tundra','defense',2],['jade','Jade','woodland','health',2],['bogiron','Bog Iron','marsh','speed',2],['sunstone','Sunstone','badlands','power',2],
  ['sylvite','Sylvite','woodland','health',3],['cryolite','Cryolite','tundra','defense',3],['malachite','Malachite','marsh','speed',3],['cobalt','Cobalt','badlands','power',3],['pyrite','Pyrite','volcanic','power',3],
  ['liferoot','Liferoot Crystal','woodland','health',4],['frostgem','Frostgem','tundra','defense',4],['aetherite','Aetherite','marsh','speed',4],['adamantite','Adamantite','badlands','power',4],['infernite','Infernite','volcanic','power',4],
].map(([id,name,biome,stat,depth])=>({id,name,biome,stat,depth,level:depth*3,rank:depth+3,minimumRank:depth+2,defense:[0,5,8,11,14][depth],damage:[0,9,15,22,30][depth],power:depth+1,yield:depth*3+3,bonus:1+(.08+depth*.07)}));
export const MATERIAL_COLORS={verdite:'#65c989',basalt:'#8895ad',jade:'#46d39d',bogiron:'#9bc06e',sunstone:'#ffb968',sylvite:'#95e981',cryolite:'#9cdafa',malachite:'#3ac1ac',cobalt:'#738fea',pyrite:'#edb659',liferoot:'#d4ed83',frostgem:'#c3efff',aetherite:'#8af3d5',adamantite:'#fa8b9d',infernite:'#ff9758'};
