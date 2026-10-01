export const TOWNS=[
 {id:'hearth',name:'Hearthside',x:10600,y:7600,biome:'heartlands',connection:[11250,6480],approach:[[11250,6480],[11600,6480],[11600,7600],[10600,7600]],casino:true},
 {id:'fern',name:'Fernhaven',x:40700,y:9000,biome:'woodland',connection:[38700,8500],casino:true},
 {id:'lotus',name:'Lotus Rest',x:39200,y:28400,biome:'marsh',connection:[36900,29400],approach:[[36900,29400],[36900,30000],[39200,30000],[39200,28400]],casino:false},
 {id:'aurora',name:'Aurora Camp',x:45300,y:4000,biome:'tundra',connection:[46400,2400],approach:[[46400,2400],[46600,3000],[46600,4000],[45300,4000]],casino:false},
];
export const TOWN_BUILDINGS=[{id:'lucky-hearth',town:'hearth',name:'The Lucky Hearth',sign:'LUCKY HEARTH',type:'casino',layer:'casino',x:9900,y:7470,width:360,height:180}];
for(const t of TOWNS){
 for(const [type,dx,dy,suffix,sign] of [['shop',-440,-330,'General Shop','GENERAL SHOP'],['smith',440,-330,'Blacksmith','BLACKSMITH'],['house',-440,330,'West House','HOME'],['house',440,330,'East House','HOME']]){
  const id=`${t.id}-${type}${type==='house'?(dx<0?'-west':'-east'):''}`;
  TOWN_BUILDINGS.push({id,town:t.id,name:`${t.name} ${suffix}`,sign,type,layer:id,x:t.x+dx,y:t.y+dy,width:360,height:180,biome:t.biome});
 }
 if(t.casino&&t.id!=='hearth')TOWN_BUILDINGS.push({id:`${t.id}-casino`,town:t.id,name:`${t.name} Casino`,sign:'FERN FORTUNE',type:'casino',layer:`${t.id}-casino`,x:t.x,y:t.y-650,width:360,height:180,biome:t.biome});
}
export const VILLAGE_HUTS=[{x:8580,y:6590,r:110},{x:8780,y:6400,r:115},{x:9380,y:6550,r:120},{x:9510,y:7220,r:110},{x:9020,y:7540,r:120},{x:8510,y:7120,r:108}];
for(const [i,h] of VILLAGE_HUTS.entries())TOWN_BUILDINGS.push({id:`village-house-${i+1}`,name:`Village House ${i+1}`,sign:'HOME',type:'house',layer:`village-house-${i+1}`,x:h.x,y:h.y,width:h.r*2,height:h.r*2,hut:true,biome:'heartlands'});
export const buildingForLayer=layer=>TOWN_BUILDINGS.find(b=>b.layer===layer)||null;
export const INTERIOR_SIZE={width:1100,height:850,spawn:{x:550,y:700}};
export const INTERIOR_FIXTURES=[{x:550,y:225,width:340,height:100}];
export const INTERIOR_ACTIVITY={x:550,y:345};
export const fixturesForBuilding=b=>b.type==='house'?[...INTERIOR_FIXTURES,{x:220,y:470,width:180,height:200},{x:850,y:500,width:150,height:100}]:INTERIOR_FIXTURES;
