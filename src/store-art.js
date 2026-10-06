export function drawStoreFloor(c,art){
 const sprite=art.sprite('underground-711-floor',()=>{const image=document.createElement('canvas');image.width=1100;image.height=850;const c=image.getContext('2d'),r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
 r(45,45,1010,775,'#353f3b');r(60,60,980,745,'#e0ddd0');for(let y=65;y<800;y+=48)for(let x=65;x<1035;x+=48){r(x,y,44,44,(x+y)%96<48?'#e9e6d9':'#d6d8cc');r(x,y+43,44,1,'#afb8ad');}
 r(65,65,970,84,'#f0ebdb');r(65,77,970,12,'#e17d2c');r(65,92,970,12,'#b84735');r(65,107,970,12,'#328252');c.textAlign='center';c.font='bold 27px monospace';c.fillStyle='#226e43';c.fillText('7 ELEVEN',550,143);r(493,736,114,64,'#354a48');r(500,739,100,60,'#81968b');r(543,742,5,46,'#ced9bd');c.font='16px monospace';c.fillStyle='#f0dfb6';c.fillText('BACK UP TO LAYER 6',550,824);return {image,ax:0,ay:0};});c.drawImage(sprite.image,0,0);
}
export function storeObjects(c,art,time){
 const sprite=art.sprite('underground-711-furniture',()=>{const image=document.createElement('canvas');image.width=1100;image.height=850;const c=image.getContext('2d'),r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
 r(100,135,260,90,'#c6cbbd');r(96,133,268,14,'#405f50');r(113,152,90,14,'#eeeee0');r(282,110,48,43,'#384c45');r(289,116,33,23,'#9bb390');r(286,151,48,8,'#7c8777');for(const [x,y]of[[115,165],[220,166]]){r(x,y,43,41,'#bc6750');r(x+4,y+4,35,15,'#d6c28a');r(x+8,y+25,26,3,'#ecdec0');}
 for(const x of [365,595]){r(x,245,110,270,'#666e5e');r(x+4,249,102,260,'#bec3ad');for(let y=275;y<500;y+=55){r(x,y,110,10,'#5c7b5f');for(let i=0;i<5;i++){r(x+9+i*19,y-24,13,23,['#ce7755','#9eb269','#d3bc72','#69959a','#b3879b'][i]);r(x+11+i*19,y-21,9,5,'#e5dec0');}}}
 r(905,100,90,280,'#475e58');for(let y=110;y<350;y+=75){r(913,y,74,67,'#a3bcba');r(918,y+4,58,54,'#54777c');for(let i=0;i<3;i++){r(923+i*17,y+22,12,28,'#d8d7ae');r(926+i*17,y+18,6,5,'#8ea989');}r(980,y+27,3,18,'#e4d9b7');}
 r(730,120,120,94,'#334c44');r(735,123,110,16,'#ad4733');c.font='bold 13px monospace';c.textAlign='center';c.fillStyle='#ffe3a3';c.fillText('LOTTERY',790,137);for(let i=0;i<4;i++){r(740+i*25,147,20,37,['#cfb05f','#749d75','#829cbb','#bc8172'][i]);r(744+i*25,151,12,18,'#d2d0b9');}r(744,190,66,10,'#7b9d61');r(817,192,18,8,'#bca267');return {image,ax:0,ay:0};});return [{y:515,draw:()=>c.drawImage(sprite.image,0,0)}];
}
export function drawDarren(c,art,n,time){
 c.save();c.fillStyle='#a18b66';c.fillRect(n.x-138,n.y-29,159,62);c.fillStyle='#bca47a';c.fillRect(n.x-133,n.y-25,149,52);c.fillStyle='#816e52';c.fillRect(n.x-77,n.y-25,2,52);
 c.translate(n.x,n.y);c.rotate(-Math.PI/2);art.player(c,{...n,x:0,y:0},{equippedTool:null,equippedGear:null},time);c.restore();c.fillStyle='#e0e4c6';c.font='14px EmberRunes,monospace';c.fillText('z Z',n.x-135,n.y-40-Math.sin(time*.002)*3);
}
