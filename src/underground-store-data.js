export const STORE_LAYER='seven-eleven';
export const UNDERGROUND_STORE={id:STORE_LAYER,layer:STORE_LAYER,name:'Underground 7-Eleven · Layer 7',type:'convenience'};
export const STORE_FIXTURES=[{x:230,y:185,width:260,height:100},{x:950,y:240,width:90,height:280},{x:420,y:380,width:110,height:270},{x:650,y:380,width:110,height:270},{x:790,y:170,width:120,height:95}];
export const LOTTERY_SPOT={x:790,y:280};
export const DARREN={id:'darren',name:'Darren',role:'darren',layer:STORE_LAYER,x:875,y:655,homeX:875,homeY:655,fixed:true,facing:Math.PI/2,moving:false,appearance:{id:'darren',skin:'#704b38',skinLight:'#98694d',skinShade:'#50392e',hair:'#272925',shirt:'#7d7963',hairStyle:'curls',beard:true,sleeping:true,patched:true}};
export const DARREN_ONLY=['rawMarijuana','driedMarijuana','marijuanaSeeds','bigfootFur','oldTestament','steezusBook','sulfur'];
export const darrenOnly=id=>DARREN_ONLY.includes(id);
