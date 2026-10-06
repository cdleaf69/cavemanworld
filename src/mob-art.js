import {fishSpecies} from './fish-species.js';
// Original, hand-shaped pixel creatures. Every frame is baked once; texture stays
// anchored to the body, while joints and fins animate in a bounded six-frame cycle.
const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
const oval=(c,x,y,rx,ry,color)=>{for(let dy=-Math.ceil(ry);dy<=ry;dy++){const w=Math.floor(rx*Math.sqrt(Math.max(0,1-dy*dy/(ry*ry))));r(c,x-w,y+dy,w*2+1,1,color);}};
function poly(c,points,color){const lo=Math.ceil(Math.min(...points.map(p=>p[1]))),hi=Math.floor(Math.max(...points.map(p=>p[1])));for(let y=lo;y<=hi;y++){const xs=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)r(c,Math.ceil(xs[i]),y,Math.floor(xs[i+1])-Math.ceil(xs[i])+1,1,color);}}
function line(c,points,color,width=1){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],steps=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let n=0;n<=steps;n++){const t=steps?n/steps:0;r(c,a[0]+(b[0]-a[0])*t-width/2,a[1]+(b[1]-a[1])*t-width/2,width,width,color);}}}
const shift=(hex,n)=>'#'+hex.slice(1).match(/../g).map(v=>Math.max(0,Math.min(255,parseInt(v,16)+n)).toString(16).padStart(2,'0')).join('');
function palette(base){return [shift(base,-65),shift(base,-32),base,shift(base,25),shift(base,52)];}
function mass(c,x,y,rx,ry,p){oval(c,x,y,rx,ry,p[0]);oval(c,x,y-1,rx-1,ry-2,p[1]);oval(c,x-2,y-3,rx-3,ry-4,p[2]);oval(c,x-4,y-ry*.35,Math.max(2,rx*.65),Math.max(2,ry*.33),p[3]);}
// Faceted planes follow the shoulder, flank and jaw rather than shaded ellipses.
function angularMass(c,x,y,rx,ry,p){
 const plane=(xx,yy,w,h,color)=>poly(c,[[xx-w,yy-h*.35],[xx-w*.72,yy-h*.85],[xx-w*.18,yy-h],[xx+w*.65,yy-h*.76],[xx+w,yy-h*.22],[xx+w*.82,yy+h*.6],[xx+w*.24,yy+h],[xx-w*.72,yy+h*.72]],color);
 plane(x,y,rx,ry,p[0]);plane(x,y-1,rx-1,ry-2,p[1]);plane(x-1,y-2,rx-3,ry-4,p[2]);
 poly(c,[[x-rx*.7,y-ry*.5],[x-rx*.1,y-ry*.78],[x+rx*.56,y-ry*.55],[x+rx*.28,y-ry*.15],[x-rx*.55,y-ry*.1]],p[3]);
}
function eye(c,x,y,color='#f4e6b1',angry=false){r(c,x,y,6,4,color);r(c,x+3,y+1,2,3,'#202736');r(c,x,y,1,1,'#fff7dc');if(angry)line(c,[[x-1,y-2],[x+6,y]],'#302b38',2);}
function fur(c,x,y,w,h,p,seed=0){for(let i=0;i<16;i++){const xx=x+(i*17+seed*3)%w,yy=y+(i*11+seed)%h;line(c,[[xx,yy],[xx-2,yy+3],[xx+1,yy+2]],p[i%2?1:3]);}}
function leg(c,x,y,bend,p,front=true){const knee=x+bend*.6,foot=x+bend;line(c,[[x,y],[knee,y+12],[foot,y+24]],p[0],5);line(c,[[x-1,y],[knee-1,y+12],[foot-1,y+22]],p[front?2:1],3);r(c,foot-4,y+23,10,4,p[0]);r(c,foot-3,y+23,6,1,p[3]);}
const stride=phase=>[0,3,3,0,-3,-3][phase];
function quadruped(c,kind,phase,variant){
 const deer=kind==='deer',ram=kind==='stoneRam',boar=kind==='boar',fox=kind==='fox',lion=kind==='mountainLion';
 const p=palette(deer?'#ab8050':ram?'#93988c':boar?'#987457':fox?'#dc8549':lion?'#c6a173':'#89949f'),s=stride(phase),y=deer?83:89,headY=deer?55:boar?83:74;
 // Far limbs are painted first, then the rib cage and near limbs.
 leg(c,43,y-2,-s,p,false);leg(c,76,y-2,s,p,false);
 if(fox){poly(c,[[38,88],[23,83],[10,68],[8,54],[18,55],[27,70],[46,78]],p[0]);poly(c,[[37,84],[23,78],[13,63],[14,55],[21,64],[32,74]],p[2]);poly(c,[[13,63],[9,54],[18,53],[24,66]],'#f2e7c4');}
 else if(lion){line(c,[[35,88],[15,84],[8,72],[9,59+s]],p[0],6);line(c,[[34,87],[15,82],[11,70],[12,60+s]],p[2],3);}
 else if(!deer&&!ram&&!boar)poly(c,[[39,83],[15,92],[10,88],[27,76],[46,74]],p[1]);
 const belly=deer?12:boar?18:fox?11:lion?14:15;
 angularMass(c,57,y-10,deer?28:boar?32:31,belly,p);
 // Raised shoulders, a tucked abdomen and a distinct haunch make the animal lean.
 poly(c,[[36,y-18],[45,y-21],[50,y-13],[47,y+1],[39,y+4],[32,y-2]],p[2]);
 poly(c,[[57,y-3],[67,y-8],[77,y-7],[81,y+3],[73,y+7],[64,y+2]],p[1]);
 line(c,[[36,y-20],[46,y-23],[59,y-21],[72,y-20]],p[3],2);
 poly(c,[[72,y-12],[74,headY+5],[88,headY-5],[94,headY+9],[87,y+8]],p[0]);poly(c,[[75,y-13],[78,headY+4],[87,headY-2],[90,headY+8],[83,y+2]],p[2]);
 leg(c,39,y,s,p);leg(c,78,y,-s,p);
 angularMass(c,91,headY,boar?16:fox?12:14,boar?12:fox?9:10,p);
 if(lion){mass(c,83,headY-11,5,5,p);mass(c,97,headY-13,5,5,p);}else{poly(c,[[88,headY-9],[86,headY-24],[97,headY-13]],p[0]);poly(c,[[89,headY-11],[89,headY-19],[94,headY-12]],fox?'#efb799':p[3]);}
 poly(c,[[96,headY+1],[112,headY+6],[112,headY+12],[96,headY+14],[88,headY+7]],p[1]);poly(c,[[98,headY+4],[110,headY+7],[107,headY+10],[96,headY+10]],deer?'#dbbd87':fox?'#f5ddac':p[3]);r(c,109,headY+6,5,4,p[0]);eye(c,94,headY-5,undefined,!deer&&!fox);
 if(deer){for(const x of [84,96]){line(c,[[x,44],[x-3,32],[x+3,20],[x+2,11]],'#514336',3);line(c,[[x-2,34],[x-11,26],[x-12,19]],'#98734a',2);line(c,[[x,26],[x+9,19],[x+10,12]],'#d6b184',2);}for(let i=0;i<8;i++)r(c,39+i%4*8,75+Math.floor(i/4)*5,3,2,'#dbc096');}
 if(ram){mass(c,88,headY-11,12,13,palette('#cbb183'));oval(c,90,headY-10,7,8,p[0]);line(c,[[80,headY-16],[85,headY-22],[94,headY-18],[98,headY-9]],'#ebd8a7',2);for(let i=0;i<4;i++)poly(c,[[38+i*12,75],[42+i*12,64],[51+i*12,77]],p[i%2?1:3]);}
 if(boar){poly(c,[[101,headY+13],[110,headY+3],[108,headY+16],[102,headY+19]],'#f5e3b6');for(let i=0;i<8;i++)poly(c,[[33+i*6,y-22],[36+i*6,y-30-(i%3)*2],[40+i*6,y-22]],p[0]);}
 if(!deer){fur(c,38,y-19,43,17,p,variant);if(fox||kind==='wolf'){for(let i=0;i<5;i++)poly(c,[[69+i*3,headY+4+i*2],[66+i*3,headY+16+i*2],[75+i*3,headY+12+i*2]],fox?'#f0cc94':p[3]);}if(kind==='wolf')poly(c,[[37,71],[49,69],[63,71],[71,75],[62,78],[42,78]],p[1]);if(lion){line(c,[[58,75],[66,79],[77,78]],p[3],2);r(c,87,headY+8,5,3,'#e9d2a3');}if(!fox&&!lion&&!boar&&!ram)poly(c,[[75,headY+5],[71,headY+23],[78,headY+19],[85,headY+25],[85,headY+7]],'#c4d0c8');}
 line(c,[[103,headY+13],[108,headY+13]],p[0]);
}
function hare(c,kind,phase){const p=palette(kind==='snowHare'?'#d9e4dd':'#c6a885'),s=stride(phase);angularMass(c,54,96,22,16,p);angularMass(c,78,85,16,16,p);angularMass(c,74,59,5,22,p);angularMass(c,85,58,5,24,p);line(c,[[74,42],[74,71]],'#c69091',2);line(c,[[85,38],[85,70]],'#c69091',2);oval(c,30,94,7,7,'#f0ead0');poly(c,[[45+s,99],[58+s,103],[64+s,109],[71+s,111],[71+s,116],[49+s,116],[42+s,109]],p[0]);poly(c,[[47+s,102],[56+s,106],[61+s,112],[67+s,112],[67+s,114],[50+s,114]],p[2]);line(c,[[78,97],[78-s,110],[84-s,113]],p[0],5);line(c,[[78,98],[78-s,110]],p[2],3);r(c,76-s,111,18,5,p[1]);eye(c,83,82);r(c,91,91,4,3,'#a7786a');line(c,[[87,95],[99,93]],'#715c4d');fur(c,41,89,26,13,p);}
function turtle(c,sea,phase){const p=palette(sea?'#71b69a':'#91a974'),s=stride(phase);for(const [x,y] of [[32,94],[40,110],[77,110]]){poly(c,[[x,90],[x-12,y+s],[x-5,y+5+s],[x+9,y]],p[1]);line(c,[[x-8,y+s],[x,y+2+s]],p[3],2);}angularMass(c,59,90,31,24,palette(sea?'#4d9280':'#718551'));poly(c,[[48,73],[64,70],[76,85],[70,99],[52,103],[41,89]],p[0]);poly(c,[[50,76],[62,74],[72,85],[67,96],[54,98],[45,87]],p[2]);for(const [a,b] of [[[48,73],[38,80]],[[41,89],[31,96]],[[52,103],[47,112]],[[70,99],[79,107]],[[76,85],[86,84]],[[64,70],[70,69]]])line(c,[a,b],p[0],2);angularMass(c,94,93,15,9,p);eye(c,99,88);line(c,[[100,98],[111,97]],p[0]);r(c,50,75,10,2,p[4]);if(!sea){for(let i=0;i<5;i++)poly(c,[[37+i*11,76],[39+i*11,69-(i%2)*4],[43+i*11,77]],'#a4bb72');}}
function crane(c,phase){const p=palette('#cbd9d6'),s=stride(phase);line(c,[[55,95],[56+s,113],[47+s,117]],'#9a784e',3);line(c,[[69,94],[69-s,113],[77-s,117]],'#bd9563',3);angularMass(c,58,83,22,13,p);poly(c,[[37,80],[17,95],[42,91]],'#41586b');poly(c,[[41,78],[63,74],[76,87],[57,92]],'#8babae');line(c,[[73,81],[85,70],[83,48]],p[0],9);line(c,[[74,80],[83,68],[81,48]],p[3],5);angularMass(c,84,43,11,9,p);r(c,78,35,9,3,'#e47764');eye(c,87,41);poly(c,[[94,44],[116,48],[94,50]],'#d9b979');line(c,[[43,83],[57,89],[67,85]],'#edf2db',2);}
function reptile(c,kind,phase){const p=palette(kind==='sandLizard'?'#cfa96a':'#6b9b8d'),s=stride(phase);line(c,[[51,93],[34,96],[18,87],[9,89+s]],p[0],9);line(c,[[51,91],[34,94],[19,86],[9,89+s]],p[2],5);for(const x of [43,76])for(const sign of [-1,1])line(c,[[x,87],[x+sign*9,99+s*sign],[x+sign*16,108]],p[1],5);angularMass(c,62,88,30,12,p);angularMass(c,93,86,17,10,p);eye(c,98,82);line(c,[[100,93],[114,92]],p[0]);for(let i=0;i<9;i++){r(c,41+i*7,82+(i%2)*5,3,2,p[4]);}poly(c,[[83,95],[100,96],[108,92],[105,99],[86,99]],p[3]);}
function arthropod(c,kind,phase){
 const spider=kind==='caveSpider',scorpion=kind==='rockScorpion',beetle=kind==='crystalBeetle',crab=kind==='reefCrab',mite=kind==='ashMite';const p=palette(spider?'#796695':scorpion?'#b79872':beetle?'#659cb4':crab?'#da8b70':mite?'#a77470':'#859688'),s=stride(phase);
 for(let i=0;i<4;i++)for(const sign of [-1,1]){const x=64+sign*(12+i*2),yy=78+i*8;line(c,[[x,yy],[x+sign*18,yy-11+s*(i%2?1:-1)],[x+sign*26,yy+11]],p[0],4);line(c,[[x,yy],[x+sign*18,yy-10+s*(i%2?1:-1)],[x+sign*24,yy+10]],p[2],2);}
 if(scorpion){line(c,[[61,74],[44,57],[43,36],[55,24],[68,29],[70,42]],p[0],12);line(c,[[60,71],[46,56],[46,37],[56,28],[67,32]],p[2],7);poly(c,[[67,29],[78,40],[72,53],[68,43]],'#e0c08c');for(let i=0;i<4;i++)line(c,[[44+i*2,36+i*8],[51+i*2,36+i*8]],p[0],2);}
 angularMass(c,64,84,beetle?26:spider?23:21,beetle?29:spider?23:18,p);angularMass(c,64,105,17,10,p);
 if(beetle){line(c,[[64,59],[64,97]],p[0],3);for(const x of [49,76])poly(c,[[x-7,80],[x-3,56],[x+5,50],[x+9,78],[x,88]],'#8fe7dc');for(const x of [49,76])line(c,[[x-2,59],[x,78]],'#e0fff0',2);poly(c,[[56,100],[54,89],[61,93],[64,80],[68,96],[76,88],[73,103]],'#bedbbf');}
 else if(spider){for(const x of [53,62,71]){oval(c,x,98,3,3,'#e9a7cb');r(c,x,98,1,2,'#fff1d2');}poly(c,[[54,107],[55,116],[62,109]],'#e5d7b8');poly(c,[[69,108],[72,116],[74,106]],'#e5d7b8');line(c,[[54,70],[64,64],[74,70],[64,81],[54,70]],p[4],2);}
 else if(crab||scorpion){for(const sign of [-1,1]){const x=64+sign*34;line(c,[[64+sign*16,96],[x,86],[x+sign*4,71-s]],p[1],6);angularMass(c,x+sign*4,67-s,11,15,p);poly(c,[[x,57-s],[x+sign*7,63-s],[x,70-s]],'#283e47');}for(const x of [57,70]){r(c,x,91,3,11,p[3]);eye(c,x-2,90);}}
 else{for(let i=0;i<4;i++)line(c,[[51,72+i*8],[76,73+i*8]],p[0],2);for(const x of [56,70])eye(c,x,100,'#f0bd79',true);for(let i=0;i<4;i++)poly(c,[[48+i*9,70],[51+i*9,59],[56+i*9,72]],mite?'#e9a663':p[3]);}
}
function serpent(c,kind,phase){const frost=kind==='frostSerpent',p=palette(frost?'#8bbecb':kind==='morayEel'?'#608f82':kind==='mireLeech'?'#8c945d':'#6ea3b8');for(let i=0;i<13;i++){const x=17+i*6,y=96+Math.sin(i*.6+phase*Math.PI/3)*5;mass(c,x,y,8+(i/4),6+(i/5),p);r(c,x-2,y-3,3,2,p[4]);}mass(c,101,87,15,14,p);poly(c,[[101,89],[118,86],[117,101],[98,102]],p[0]);r(c,104,95,12,3,'#b76b8b');eye(c,104,81,'#f3e6ad',true);for(const x of [104,112])poly(c,[[x,91],[x+2,97],[x+4,90]],'#f2f0ce');if(frost)for(let i=0;i<7;i++)poly(c,[[29+i*11,89],[33+i*11,77-i%2*5],[39+i*11,91]],'#d6f7e6');}
function slime(c,kind,phase){const p=palette(kind==='caveSlime'?'#75b49f':'#929857'),s=stride(phase),leech=kind==='mireLeech';if(leech){serpent(c,kind,phase);mass(c,104,87,12,13,p);oval(c,108,90,8,8,p[0]);for(let i=0;i<5;i++)r(c,102+i*2,85+(i%2)*8,2,3,'#e6d8b2');return;}mass(c,64,94+s/2,kind==='bogSpitter'?30:32,kind==='bogSpitter'?23:21-s/2,p);poly(c,[[32,105],[31,113],[48,116],[60,113],[76,117],[96,112],[94,103]],p[1]);oval(c,53,82,12,6,p[4]);for(const x of [51,73])eye(c,x,91,'#e1eab2',kind==='bogSpitter');oval(c,66,105,7,5,p[0]);if(kind==='bogSpitter'){mass(c,94,102,11,8,p);oval(c,102,102,6,5,p[0]);for(let i=0;i<7;i++)mass(c,39+i*7,79+i%2*5,3,3,palette('#d7c578'));for(const x of [38,84])poly(c,[[x,85],[x+2,61],[x+10,80]],p[2]);}else{r(c,55,104,4,3,'#e7e6c2');for(const [x,y] of [[42,99],[79,82],[86,103]])oval(c,x,y,3,2,p[3]);}}
function batOrMoth(c,moth,phase){const p=palette(moth?'#b19ccf':'#8478a4'),wing=[0,7,12,7,0,-4][phase];for(const sign of [-1,1]){const x=64;poly(c,[[x+sign*5,84],[x+sign*22,51-wing],[x+sign*48,56-wing],[x+sign*53,91+wing],[x+sign*38,80],[x+sign*25,101],[x+sign*10,97]],p[0]);poly(c,[[x+sign*10,82],[x+sign*23,55-wing],[x+sign*43,60-wing],[x+sign*45,84+wing],[x+sign*28,89],[x+sign*18,93]],p[2]);line(c,[[x+sign*9,88],[x+sign*23,58-wing],[x+sign*29,87]],p[3],2);if(moth){mass(c,x+sign*29,71-wing/2,9,11,palette('#80c5bd'));poly(c,[[x+sign*30,66-wing/2],[x+sign*35,73-wing/2],[x+sign*29,80-wing/2],[x+sign*25,74-wing/2]],'#e3f7d8');}}mass(c,64,87,9,20,p);if(!moth){poly(c,[[57,76],[54,62],[62,73],[68,73],[74,62],[71,79]],p[2]);eye(c,57,80,'#f6bd86');eye(c,68,80,'#f6bd86');poly(c,[[59,91],[61,97],[63,91]],'#f0e1ba');}else{line(c,[[60,71],[53,60],[49,62]],p[3],2);line(c,[[67,70],[75,59],[80,62]],p[3],2);r(c,59,82,3,3,'#fff4cf');r(c,68,82,3,3,'#fff4cf');}}
function rockMonster(c,kind,phase){const magma=kind==='magmaBrute',p=palette(kind==='obsidianSentinel'?'#4e475d':magma?'#4c4145':'#736a68'),glow=kind==='obsidianSentinel'?'#bd8aeb':'#ffb455',s=stride(phase);const plate=(points)=>{poly(c,points,p[0]);const cx=points.reduce((n,p)=>n+p[0],0)/points.length,cy=points.reduce((n,p)=>n+p[1],0)/points.length;poly(c,points.map(([x,y])=>[cx+(x-cx)*.85,cy+(y-cy)*.85]),p[2]);poly(c,[points[0],points[1],[cx,cy]],p[3]);};
 for(const [x,ss] of [[42,s],[77,-s]]){line(c,[[x,88],[x+ss,106]],glow,6);plate([[x-9,89],[x+9,88],[x+13+ss,110],[x+8+ss,117],[x-13+ss,117],[x-14+ss,108]]);}
 for(const [x,ss] of [[28,-s],[99,s]]){line(c,[[x,57],[x-ss,89]],glow,8);plate([[x-9,56],[x+10,57],[x+8-ss,76],[x-9-ss,81],[x-13-ss,68]]);plate([[x-10-ss,80],[x+9-ss,77],[x+15-ss,99],[x+5-ss,106],[x-15-ss,98]]);for(let i=0;i<3;i++)r(c,x-8+i*7-ss,99,3,4,p[3]);}
 plate([[40,51],[56,43],[84,49],[94,67],[84,90],[44,93],[33,71]]);line(c,[[59,49],[55,62],[68,69],[60,82],[65,91]],glow,3);line(c,[[56,62],[40,67]],'#f1d075',2);plate([[41,52],[53,50],[59,60],[52,74],[39,70]]);plate([[75,52],[89,58],[87,73],[70,70],[65,60]]);plate([[50,25],[72,21],[83,36],[76,52],[53,53],[42,39]]);r(c,51,36,9,4,glow);r(c,67,34,10,4,glow);line(c,[[56,45],[64,43],[73,44]],p[0],3);
 if(magma){for(const x of [22,37,89,104])poly(c,[[x-7,60],[x-4,41],[x+3,37],[x+9,58]],p[0]);for(let i=0;i<6;i++)poly(c,[[46+i*7,51],[48+i*7,42-i%2*5],[52+i*7,51]],'#e78b49');r(c,63,69,3,5,'#ffe5a0');}else if(kind==='obsidianSentinel'){poly(c,[[50,26],[54,11],[62,24],[69,7],[76,24]],p[3]);poly(c,[[60,60],[68,54],[74,64],[66,77]],'#e0b8ff');}else{line(c,[[56,28],[63,31],[70,26]],glow,2);r(c,60,71,5,4,'#f6d383');}
}
function stalker(c,phase){const p=palette('#496d5b'),s=stride(phase);for(const [x,ss] of [[47,s],[78,-s]]){line(c,[[x,80],[x-ss,98],[x+ss,112],[x-6+ss,118]],p[0],7);line(c,[[x-1,81],[x-ss-1,98],[x+ss-1,110]],p[2],3);}poly(c,[[50,50],[67,43],[82,56],[79,82],[70,91],[48,82],[43,65]],p[0]);poly(c,[[54,53],[64,48],[72,57],[68,86],[52,78]],p[2]);line(c,[[63,52],[57,67],[65,77]],'#a4b28c',2);for(const [x,sign] of [[47,-1],[79,1]]){line(c,[[x,54],[x+sign*12,70],[x+sign*8,87],[x+sign*18,100+s]],p[0],6);line(c,[[x,56],[x+sign*10,71],[x+sign*6,87]],p[2],3);for(let i=0;i<3;i++)line(c,[[x+sign*18,99+s],[x+sign*(18+i*3),110+s]],'#b6b58b',2);}mass(c,66,36,15,16,p);poly(c,[[51,37],[61,44],[79,39],[74,51],[62,54],[51,45]],'#bdad7a');r(c,56,37,7,4,'#f2cf85');r(c,70,36,7,4,'#f2cf85');line(c,[[58,47],[73,45]],p[0],3);for(const x of [57,63,70])r(c,x,45,2,3,'#eee6b4');for(const [x,sign] of [[54,-1],[76,1]]){line(c,[[x,25],[x+sign*6,14],[x+sign*3,5]],'#554d3e',3);line(c,[[x+sign*5,16],[x+sign*14,11],[x+sign*17,3]],'#9aa77e',2);}for(const [x,y] of [[43,55],[82,60],[60,18]])poly(c,[[x,y],[x-8,y-7],[x-2,y-11],[x+7,y-2]],'#8bb982');}
function reaper(c,phase){const p=palette('#7b708e'),s=stride(phase);poly(c,[[63,31],[77,42],[90,77],[81,116],[72,105],[61,118],[52,107],[39,114],[43,77],[49,44]],p[0]);poly(c,[[60,44],[72,42],[83,77],[75,105],[65,96],[57,107],[51,97],[46,106],[49,71]],p[2]);line(c,[[55,60],[51,84],[59,100]],p[3],2);line(c,[[69,61],[75,86],[71,98]],p[1],3);mass(c,64,41,17,18,p);oval(c,64,46,11,13,'#313342');r(c,56,42,5,4,'#a8ead8');r(c,68,42,5,4,'#a8ead8');poly(c,[[60,48],[64,44],[67,50]],'#bbb4b8');for(const x of [59,63,68])r(c,x,54,2,4,'#e6ddc0');line(c,[[46,66],[32,80],[30,94+s]],p[1],7);line(c,[[81,66],[92,78],[101,66]],p[2],7);line(c,[[98,48],[105,105]],'#ab997c',3);poly(c,[[98,47],[104,33],[120,29],[116,34],[107,40],[105,54]],'#c2d8cc');line(c,[[104,35],[114,31]],'#edf3d5',2);}
function wisp(c,phase){const p=palette('#8bbad7'),s=stride(phase);for(let i=0;i<4;i++)poly(c,[[47+i*10,87],[45+i*10+s,108-i%2*8],[57+i*10,92]],p[1]);mass(c,64,74+s/2,21,24,p);poly(c,[[46,69],[49,55],[43,42],[61,55],[65,35],[72,53],[83,47],[79,68]],p[3]);r(c,53,69,7,5,'#fff4c9');r(c,70,69,7,5,'#fff4c9');r(c,55,70,2,3,'#41566c');r(c,73,70,2,3,'#41566c');poly(c,[[58,81],[64,75],[71,81],[65,88]],'#466281');r(c,50,60,3,3,'#e6fff0');line(c,[[54,92],[62,96],[72,90]],p[4],2);}
function burrower(c,phase){const p=palette('#bca16e'),s=stride(phase);for(let i=0;i<6;i++){mass(c,29+i*12,100-Math.sin(i*.6)*13,11,13,p);line(c,[[24+i*12,91-Math.sin(i*.6)*13],[27+i*12,107-Math.sin(i*.6)*13]],p[0],2);}mass(c,97,77+s/2,19,20,p);oval(c,103,80+s/2,11,13,p[0]);for(let i=0;i<5;i++){poly(c,[[94+i*4,69+s/2],[96+i*4,76+s/2],[98+i*4,69+s/2]],'#f5e3b7');poly(c,[[94+i*4,91+s/2],[96+i*4,84+s/2],[98+i*4,91+s/2]],'#d9c998');}poly(c,[[82,69],[78,54],[85,61],[94,58],[91,70]],p[3]);eye(c,87,64,'#e9bf6e',true);}
function bigfoot(c,phase,throwing){const p=palette('#8c7054'),skin=palette('#b79a72'),s=stride(phase);for(const [x,ss] of [[44,s],[81,-s]]){leg(c,x,89,ss,p);mass(c,x+ss,112,15,6,p);}mass(c,64,72,29,31,p);poly(c,[[43,50],[47,89],[63,101],[83,89],[88,55],[70,48]],p[1]);mass(c,62,66,18,15,p);fur(c,44,49,40,42,p,2);for(const [x,sign] of [[34,-1],[95,1]]){const elbow=x+sign*5,y=throwing&&sign===1?39:82+s*sign;line(c,[[x,55],[elbow,y],[x+sign*4,throwing&&sign===1?19:101]],p[0],16);line(c,[[x-2,55],[elbow-2,y],[x+sign*4-2,throwing&&sign===1?19:99]],p[2],10);mass(c,x+sign*4,throwing&&sign===1?17:101,10,9,skin);for(let i=0;i<3;i++)line(c,[[x+sign*4-6+i*4,throwing&&sign===1?13:98],[x+sign*4-6+i*4,throwing&&sign===1?20:104]],skin[1],1);}mass(c,64,33,24,26,p);poly(c,[[44,29],[50,18],[74,17],[84,29],[78,48],[65,56],[49,46]],skin[1]);mass(c,64,33,18,17,skin);poly(c,[[46,18],[50,6],[62,4],[69,8],[78,7],[84,19]],p[2]);line(c,[[48,26],[59,25]],p[0],4);line(c,[[69,25],[80,24]],p[0],4);eye(c,51,29,'#f1d29a',true);eye(c,70,28,'#f1d29a',true);mass(c,65,39,7,5,skin);r(c,60,41,3,2,p[0]);r(c,69,41,3,2,p[0]);line(c,[[55,47],[65,49],[76,46]],p[0],3);r(c,58,46,13,2,'#ddc9a2');fur(c,45,70,36,23,p);}
function steezus(c,phase,throwing,smoking=false){
 const skin=palette('#c89772'),robe=palette('#e5d6ac'),hair=palette('#805438'),s=0;
 // A sun-disc halo, leaf crown, heavy shades, flowing robe and peace-sign hand.
 oval(c,64,23,29,18,'#987a49');oval(c,64,22,27,16,'#f2d777');oval(c,64,22,23,12,'#514950');oval(c,64,22,21,10,'#d7bd77');
 for(const [x,y] of [[30,17],[96,17],[38,4],[88,4]]){r(c,x,y,3,7,'#f6e4a4');r(c,x-2,y+2,7,2,'#f6e4a4');}
 for(const [x,ss] of [[49,s],[77,-s]]){line(c,[[x,95],[x+ss,111]],skin[1],7);mass(c,x+ss,115,11,4,skin);r(c,x-8+ss,114,18,2,'#6a4839');r(c,x-1+ss,111,3,6,'#745037');}
 poly(c,[[46,53],[79,53],[87,72],[96,109],[78,114],[65,108],[49,113],[33,108],[42,72]],robe[0]);poly(c,[[48,56],[76,56],[84,77],[89,106],[77,108],[65,102],[50,108],[39,104],[46,76]],robe[2]);
 for(const x of [49,61,76])line(c,[[x,67],[x-3,88],[x-5,105]],robe[1],2);line(c,[[47,55],[72,57],[77,71],[51,94]],'#799b8a',9);line(c,[[47,55],[69,59],[75,72],[52,91]],'#b7ceab',3);
 line(c,[[43,58],[28,70],[28,85]],robe[0],12);line(c,[[43,59],[30,70],[30,83]],robe[2],8);mass(c,28,87,8,7,skin);
 line(c,[[83,57],[96,67],[100,throwing?38:57]],robe[0],12);line(c,[[83,57],[95,67],[99,throwing?38:57]],robe[3],8);mass(c,100,throwing?37:54,7,8,skin);const yy=throwing?24:40;line(c,[[97,yy+13],[94,yy],[96,yy-2]],skin[3],3);line(c,[[102,yy+13],[105,yy],[107,yy+1]],skin[3],3);
 if(smoking){line(c,[[83,57],[83,71],[73,50]],robe[0],12);line(c,[[83,57],[82,68],[73,50]],robe[2],8);mass(c,73,49,6,5,skin);}
 mass(c,64,37,24,29,hair);poly(c,[[44,30],[46,52],[42,64],[50,60],[55,69],[72,66],[80,55],[85,63],[82,30]],hair[1]);mass(c,64,36,18,19,skin);
 poly(c,[[45,23],[49,14],[61,11],[71,13],[80,19],[83,32],[76,27],[69,18],[58,19],[50,28]],hair[2]);line(c,[[49,19],[59,14],[69,16]],hair[3],2);
 line(c,[[47,34],[80,34]],'#473c40',3);for(const x of [48,67]){r(c,x,31,14,10,'#25353b');r(c,x+2,32,10,7,'#497b79');line(c,[[x+3,32],[x+8,32],[x+3,37]],'#a5dace',1);}r(c,61,33,7,2,'#75574a');mass(c,64,44,4,4,skin);
 poly(c,[[47,45],[53,48],[58,45],[63,49],[71,46],[79,43],[76,61],[68,69],[58,67],[50,59]],hair[1]);line(c,[[53,48],[61,52],[73,49]],'#e9c4a0',2);line(c,[[55,53],[62,56],[72,52]],'#493935',2);r(c,58,53,10,2,'#f2dec1');for(const x of [54,60,69])line(c,[[x,58],[x+2,63]],hair[3],1);
 // Hand-painted leaf insignia and an ember-tipped spliff, not a borrowed sprite.
 for(const [dx,dy] of [[-9,-3],[-6,-10],[0,-13],[6,-10],[9,-3]])poly(c,[[65,84],[65+dx,84+dy],[65+dx*.5,87]],'#478467');r(c,64,84,2,8,'#38624f');
 line(c,[[75,49],[87,44]],'#e8e6c7',4);r(c,86,42,4,4,'#d68c56');r(c,89,41,2,3,'#f6d77c');line(c,[[91,39],[95,32],[91,27],[94,22]],'#bbd8bd',1);
 if(smoking){for(let i=0;i<4;i++){r(c,88+i*4,37-i*7,9+i*2,5,'#b9ccaa');r(c,90+i*4,36-i*7,5,2,'#e0e4be');}}
 for(const [x,y] of [[50,15],[64,11],[77,18]])poly(c,[[x,y+4],[x-5,y-1],[x,y-6],[x+4,y],[x,y+4]],'#659e67');
}
function aquatic(c,kind,phase){const f=fishSpecies(kind),p=palette(f?.color||(kind==='reefShark'?'#759daa':kind==='dolphin'?'#84b8c8':kind==='mantaRay'?'#6f91b4':'#bc97d2')),s=stride(phase);
 if(kind==='seaTurtle'){turtle(c,true,phase);return;}
 if(kind==='reefCrab'){arthropod(c,kind,phase);return;}
 if(kind==='morayEel'||f?.rank===15){serpent(c,kind,phase);if(f){line(c,[[102,73],[98,52],[111,47]],'#82c6d4',2);oval(c,112,48,5,5,'#eef4ba');for(let i=0;i<9;i++)r(c,27+i*9,88+Math.sin(i*.6+phase*Math.PI/3)*5,3,2,'#b8f9e5');}return;}
 if(kind==='mantaRay'||f?.rank===12){poly(c,[[64,65],[48,80],[13,66-s],[8,75],[27,101],[48,111],[63,103],[82,112],[108,94],[119,72],[112,65+s],[81,80]],p[0]);poly(c,[[64,69],[48,85],[17,72-s],[32,96],[51,104],[64,98],[82,104],[109,74+s],[80,85]],p[2]);mass(c,64,87,14,20,p);line(c,[[64,101],[70,113],[80,118]],p[1],3);for(const x of [52,72])eye(c,x,81);for(let i=0;i<9;i++)r(c,32+i*7,86+i%3*4,2,2,p[4]);return;}
 if(kind==='jellyfish'||kind==='giantSquid'){const squid=kind==='giantSquid';for(let i=0;i<7;i++){const x=38+i*8;line(c,[[x,80],[x+Math.sin(i+phase)*5,95],[x+Math.sin(i+phase+1)*9,110],[x+Math.sin(i+phase+2)*12,118]],p[0],4);line(c,[[x,81],[x+Math.sin(i+phase)*5,95],[x+Math.sin(i+phase+1)*9,110]],p[3],2);for(let j=0;j<3;j++)r(c,x+Math.sin(i+phase)*4,92+j*7,2,2,'#e9d8c5');}if(squid){poly(c,[[64,27],[43,61],[38,85],[58,88],[89,80],[85,57]],p[0]);poly(c,[[64,32],[47,62],[46,80],[80,77],[78,56]],p[2]);poly(c,[[48,64],[32,67],[36,84],[48,80]],p[1]);poly(c,[[80,62],[97,68],[89,82],[80,78]],p[1]);}else{mass(c,64,69+s/2,29,22,p);line(c,[[39,72+s/2],[47,83+s/2],[79,83+s/2],[88,71+s/2]],p[4],2);oval(c,61,62+s/2,11,7,'#e1e9d5');}for(const x of [52,72])eye(c,x,75+s/2);return;}
 const rank=f?.rank||0,shark=kind==='reefShark',dolphin=kind==='dolphin',sun=rank===13,angler=rank===17,crown=rank===18,sturgeon=rank===11,sword=rank===9;
 const cy=88,rx=sun?23:angler?31:rank===2?39:rank===8?39:rank===10?29:rank===14?34:36,ry=sun?28:angler?26:rank===10?22:rank===1?9:rank===2?8:rank===3?12:rank===4?18:rank===6?17:rank===7?20:rank===8?18:rank===9?12:rank===11?11:rank===14?20:15;
 poly(c,[[36,cy],[13,cy-15+s],[17,cy-2+s],[10,cy+18+s],[38,cy+7]],p[0]);poly(c,[[32,cy],[17,cy-10+s],[21,cy+1+s],[15,cy+12+s],[35,cy+4]],p[2]);
 if(shark||dolphin)poly(c,[[51,cy-ry+2],[65,cy-39],[73,cy-13]],p[1]);
 else if(!angler)poly(c,[[43,cy-ry+3],[53,cy-ry-11],[71,cy-ry-(rank===16?30:9)],[83,cy-ry+5]],p[1]);
 mass(c,68,cy,rx,ry,p);poly(c,[[44,cy+6],[61,cy+ry-1],[85,cy+ry-2],[99,cy+7],[88,cy+11],[62,cy+ry-5]],p[4]);poly(c,[[60,cy+3],[69+s,cy+23],[80,cy+7]],p[1]);line(c,[[67,cy+7],[72+s,cy+18]],p[3],2);
 if(shark||dolphin){poly(c,[[91,cy-8],[119,cy+(dolphin?-3:2)],[108,cy+7],[90,cy+10]],p[2]);poly(c,[[101,cy+1],[115,cy+2],[109,cy+6],[98,cy+6]],p[4]);for(let i=0;i<3;i++)line(c,[[80+i*4,cy-3],[78+i*4,cy+4]],p[0],1);if(shark)for(let i=0;i<4;i++)poly(c,[[99+i*4,cy+4],[101+i*4,cy+7],[103+i*4,cy+4]],'#fff3d2');}
 else{line(c,[[91,cy-3],[88,cy+8]],p[0],2);if(sword)poly(c,[[98,cy-1],[124,cy-3],[100,cy+4]],p[3]);}
 eye(c,93,cy-7,'#eee9c4',shark||angler||crown);line(c,[[101,cy+8],[110,cy+7]],p[0],1);
 if(!shark&&!dolphin){for(let row=0;row<3;row++)for(let col=0;col<8;col++){const x=43+col*6+(row%2)*3,y=cy-ry+7+row*5;if(x<87)line(c,[[x,y],[x+2,y+2],[x+4,y]],row%2?p[1]:p[3]);}
 if(rank===4||rank===7||rank===8)for(let i=0;i<5;i++)line(c,[[47+i*7,cy-ry+4],[46+i*7,cy+5]],rank===4?p[0]:p[3],2);
 if(rank===1)line(c,[[43,88],[86,88]],'#edf6dd',2);if(rank===2)line(c,[[40,84],[92,83]],p[0],2);if(rank===3){line(c,[[47,81],[88,79]],'#f6ffef',2);for(let i=0;i<5;i++)r(c,52+i*7,82,2,2,p[0]);}if(rank===8){for(const x of [75,83,91])poly(c,[[x,101],[x+4,108],[x+7,101]],'#dbcf80');}if(rank===14){poly(c,[[45,92],[39,103],[49,110],[62,97]],p[1]);poly(c,[[77,99],[82,115],[97,106],[94,95]],p[2]);}if(rank===5||rank===6)for(let i=0;i<10;i++)r(c,45+i*5,cy-5-(i%3)*3,2,2,p[0]);
 if(sturgeon||rank===14){for(let i=0;i<5;i++)poly(c,[[42+i*10,cy-ry+4],[47+i*10,cy-ry-8],[52+i*10,cy-ry+4]],p[4]);line(c,[[105,cy+9],[110,cy+16]],p[2],2);}
 if(rank===16){for(let i=0;i<6;i++){line(c,[[48+i*5,cy-14],[54+i*5,cy-37+i*2]],p[3],1);r(c,53+i*5,cy-30+i*2,2,2,'#f8e1ae');}}
 if(angler||crown){oval(c,102,cy+4,12,13,p[0]);for(let i=0;i<5;i++){poly(c,[[92+i*5,cy-5],[94+i*5,cy+2],[97+i*5,cy-5]],'#f3ebc7');poly(c,[[93+i*4,cy+15],[94+i*4,cy+9],[97+i*4,cy+15]],'#dce9bf');}line(c,[[86,cy-ry],[89,cy-45],[103,cy-48],[110,cy-38]],p[2],2);oval(c,111,cy-36,5,5,'#e8ffd2');for(let i=0;i<5;i++)r(c,46+i*9,cy+(i%2)*4,3,2,'#ceffcc');}
 if(crown){for(const x of [49,63,78])poly(c,[[x,cy-16],[x+2,cy-37],[x+7,cy-27],[x+11,cy-15]],'#e3c378');line(c,[[51,cy-24],[52,cy-31]],'#fff0b3',2);}}
}
function surfaceDetail(c,kind){
 // Coherent two-pixel clusters break up flat faces. Highlights stop at internal
 // edges, leaving eyes, teeth, and material seams crisp; the mask is baked once.
 const pixels=c.getImageData(0,0,128,128),d=pixels.data,copy=new Uint8ClampedArray(d);
 const organic=['bigfoot','wolf','fox','boar','mountainLion','deer','rootStalker'].includes(kind),rock=['emberGolem','magmaBrute','obsidianSentinel'].includes(kind);
 for(let y=8;y<117;y++)for(let x=9;x<117;x++){
  const i=(y*128+x)*4;if(!copy[i+3])continue;
  const l=Math.max(copy[i],copy[i+1],copy[i+2]);if(l>223||l<53)continue;
  // Only interiors of a matching color patch receive texture.
  const j=i+4,k=i+128*4;if(copy[j+3]!==255||copy[k+3]!==255||Math.abs(copy[i]-copy[j])>12||Math.abs(copy[i+1]-copy[k+1])>12)continue;
  const gx=Math.floor(x/2),gy=Math.floor(y/2),n=((Math.imul(gx,374761393)^Math.imul(gy,668265263))>>>0)%37;
  if(n>(organic?12:rock?9:5))continue;
  const delta=n<3?15:n<7?-17:7;
  for(let channel=0;channel<3;channel++)d[i+channel]=Math.min(255,Math.max(0,d[i+channel]+delta));
 }
 c.putImageData(pixels,0,0);
 if(rock){const p=kind==='obsidianSentinel'?['#342c42','#bda4c6']:['#4b383c','#c4ad94'];for(const [x,y] of [[47,62],[78,63],[51,100],[83,102],[27,87],[103,88]]){line(c,[[x,y],[x+4,y+2],[x+2,y+7],[x+7,y+9]],p[0],1);r(c,x-2,y-2,4,1,p[1]);}for(const x of [50,71])r(c,x,29,3,1,p[1]);}
 if(kind==='bigfoot'){for(const [x,y] of [[44,63],[77,62],[51,85],[72,83],[29,61],[98,65],[41,98],[82,99]])for(let i=0;i<3;i++)line(c,[[x+i*3,y],[x+i*3-2,y+5]],i%2?'#b3966e':'#614c3e',1);line(c,[[53,22],[59,19],[70,20]],'#cfb185',1);line(c,[[54,35],[58,37]],'#8a704f',1);line(c,[[73,35],[77,33]],'#8a704f',1);}
 if(kind==='rootStalker'){for(const [x,y] of [[55,57],[68,66],[52,76],[64,83]]){line(c,[[x,y],[x+2,y+5],[x-1,y+10]],'#273e3b',2);line(c,[[x+2,y],[x+4,y+5]],'#98ae7c',1);}poly(c,[[75,59],[88,51],[87,61],[95,61],[84,68]],'#496b57');poly(c,[[46,56],[34,47],[37,59],[31,65],[44,64]],'#496b57');}
 if(kind==='voidReaper'){for(let i=0;i<4;i++)line(c,[[57,65+i*4],[62,67+i*4],[71,65+i*4]],'#b5b3b2',1);line(c,[[64,65],[64,80]],'#414154',1);}
 if(kind==='caveSpider'){for(const [x,y] of [[56,91],[65,90],[73,92]]){r(c,x,y,2,2,'#f5b888');r(c,x,y,1,1,'#ffefd2');}line(c,[[52,79],[61,84],[74,80]],'#443949',1);}
 if(['crystalBeetle','caveCrawler','ashMite'].includes(kind)){for(let i=0;i<4;i++){r(c,48,74+i*7,4,1,'#bfcaad');r(c,76,75+i*7,3,1,'#c5d5b9');}}
}
export const MOB_ART_KINDS=['rabbit','snowHare','deer','fox','boar','wolf','mountainLion','stoneRam','tortoise','marshCrane','sandLizard','caveSpider','crystalBeetle','caveCrawler','rockScorpion','ashMite','frostSerpent','mireLeech','caveSlime','bogSpitter','caveBat','crystalMoth','emberGolem','obsidianSentinel','magmaBrute','rootStalker','voidReaper','frostWisp','duneBurrower','bigfoot','steezus','reefCrab','seaTurtle','dolphin','jellyfish','mantaRay','reefShark','morayEel','giantSquid'];
export function makeMobSprite(kind,phase=0,variant=0,shiny=false,throwing=false,smoking=false){
 const image=typeof document==='undefined'?new OffscreenCanvas(128,128):document.createElement('canvas');image.width=image.height=128;const c=image.getContext('2d',{willReadFrequently:true});
 if(['deer','fox','boar','wolf','mountainLion','stoneRam'].includes(kind))quadruped(c,kind,phase,variant);
 else if(['rabbit','snowHare'].includes(kind))hare(c,kind,phase);
 else if(kind==='tortoise')turtle(c,false,phase);
 else if(kind==='marshCrane')crane(c,phase);
 else if(kind==='sandLizard')reptile(c,kind,phase);
 else if(['caveSpider','crystalBeetle','caveCrawler','rockScorpion','ashMite'].includes(kind))arthropod(c,kind,phase);
 else if(kind==='frostSerpent')serpent(c,kind,phase);
 else if(['caveSlime','bogSpitter','mireLeech'].includes(kind))slime(c,kind,phase);
 else if(['caveBat','crystalMoth'].includes(kind))batOrMoth(c,kind==='crystalMoth',phase);
 else if(['emberGolem','obsidianSentinel','magmaBrute'].includes(kind))rockMonster(c,kind,phase);
 else if(kind==='rootStalker')stalker(c,phase);
 else if(kind==='voidReaper')reaper(c,phase);
 else if(kind==='frostWisp')wisp(c,phase);
 else if(kind==='duneBurrower')burrower(c,phase);
 else if(kind==='bigfoot')bigfoot(c,phase,throwing);
 else if(kind==='steezus')steezus(c,phase,throwing,smoking);
 else if(fishSpecies(kind)||['reefCrab','seaTurtle','dolphin','jellyfish','mantaRay','reefShark','morayEel','giantSquid'].includes(kind))aquatic(c,kind,phase);
 else throw Error('Missing creature art: '+kind);
 surfaceDetail(c,kind);
 // Two restrained color variants and the existing shiny reward treatment. No
 // per-frame random noise, interpolation, stretching, or runtime pixel readback.
 if(shiny||variant){const pixels=c.getImageData(0,0,128,128);for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3]){pixels.data[i]=Math.min(255,pixels.data[i]+(shiny?20:5));pixels.data[i+1]=Math.min(255,pixels.data[i+1]+(shiny?14:2));pixels.data[i+2]=Math.max(0,pixels.data[i+2]-(shiny?10:4));}c.putImageData(pixels,0,0);}
 const pixels=c.getImageData(0,0,128,128).data;let top=120;for(let y=0;y<120;y++){let found=false;for(let x=0;x<128;x++)if(pixels[(y*128+x)*4+3]){found=true;break;}if(found){top=y;break;}}
 return {image,ax:64,ay:120,headroom:120-top};
}
export function mobArtScale(kind){const f=fishSpecies(kind);return ['bigfoot','steezus'].includes(kind)?2:kind==='rabbit'||kind==='snowHare'?.9:f?(f.rank>=15?1.35+(f.rank-15)*.25:.65+f.rank*.025):kind==='giantSquid'?1.5:kind==='deer'?1.25:kind==='magmaBrute'?1.5:kind==='obsidianSentinel'||kind==='emberGolem'?1.35:1.05;}
export function drawMob(art,ctx,m,time){
 const f=fishSpecies(m.kind),always=m.aquatic||['frostWisp','voidReaper','caveBat','crystalMoth'].includes(m.kind),phase=m.moving||always?Math.floor((time+(m.seed||0)*31)/140)%6:0,throwing=['bigfoot','steezus'].includes(m.kind)&&(m.windupUntil>time||m.smokingUntil>time),variant=(m.seed||0)%2;
 if(Math.cos(m.facing)<-.35)m.visualFlip=true;else if(Math.cos(m.facing)>.35)m.visualFlip=false;
 const smoking=m.kind==='steezus'&&m.smokingUntil>time;
 const sprite=art.sprite(`detailed-mob:${m.kind}:${phase}:${variant}:${!!m.shiny}:${throwing}:${smoking}`,()=>makeMobSprite(m.kind,phase,variant,m.shiny,throwing,smoking));
 const hover=m.kind==='steezus'?26+Math.sin(time*.003)*9:0;ctx.save();if(hover)ctx.translate(0,-hover);
 if(m.kind==='steezus'&&m.skatingUntil>time){ctx.save();ctx.translate(m.x,m.y+5);ctx.rotate(Math.cos(m.skateAngle||0)*.12);ctx.fillStyle='#4c3a32';ctx.fillRect(-64,-8,128,11);ctx.fillStyle='#ba8a5e';ctx.fillRect(-60,-8,120,4);ctx.fillStyle='#629879';ctx.fillRect(-32,-6,64,3);for(const x of [-44,44]){ctx.fillStyle='#353c45';ctx.fillRect(x-8,4,16,14);ctx.fillStyle='#c1b59c';ctx.fillRect(x-3,7,6,6);}ctx.restore();}
 ctx.restore();art.shadow(ctx,m.x,m.y,m.radius*.9);const scale=mobArtScale(m.kind);art.draw(ctx,sprite,m.x,m.y-hover,scale,1,!['bigfoot','steezus'].includes(m.kind)&&m.visualFlip===true);
 // Exact silhouette headroom keeps nameplates above taller antlers, wings, and bosses.
 m.artTagHeight=Math.max(m.artTagHeight||0,sprite.headroom*scale+8+hover,(m.kind==='deer'?112:m.kind==='bigfoot'?121:['rootStalker','obsidianSentinel'].includes(m.kind)?120:['caveBat','crystalMoth'].includes(m.kind)?82:f?.rank>=15?80:66)*scale+8);
}
