const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
export function drawNpcHair(c,style,back,side){
 const hair=style.hair||'#634b39',skin=style.skin||'#e4ad80',shine=style.hairHighlight||'#ffffff35';
 const kind=style.hairStyle||(style.bald?'bald':style.curly?'curls':style.longHair?'long':'classic');
 const r=(x,y,w,h,color=hair)=>rect(c,x,y,w,h,color);
 if(kind==='bald'||kind==='shaved'){
  r(14,6,17,5,kind==='shaved'?hair:skin);r(17,4,11,2,kind==='shaved'?hair:skin);
  if(back){r(13,10,19,12,skin);r(17,23,11,2,skin);if(kind==='shaved')r(14,10,17,8,hair);}
  if(kind==='bald'){r(12,11,2,5);r(31,11,2,5);r(17,6,9,1,shine);}return;
 }
 if(kind==='classic'){
  r(12,8,3,8);r(14,5,16,6);r(17,3,11,3,'#785638');r(11,10,3,6);r(29,8,4,7);r(31,13,2,4);
  r(15,6,9,2,'#a27849');r(16,9,4,3);r(25,9,5,2);
 }else if(kind==='curls'){
  r(12,7,21,5);for(const [x,y]of [[10,7],[14,3],[20,2],[26,3],[31,7],[10,12],[31,12]]){r(x,y,5,5);r(x+1,y,2,1,shine);}
 }else if(kind==='mohawk'){
  r(14,7,16,4);r(side?21:19,1,6,11);r(side?22:20,0,3,6,shine);r(12,11,2,4);r(31,11,2,4);
 }else if(kind==='slick'){
  r(13,6,19,5);r(16,3,13,3);r(11,11,3,4);r(30,10,3,5);
  r(15,5,12,1,shine);r(17,7,12,1,shine);r(24,9,6,2);r(22,6,1,4,'#292f36');
 }else if(kind==='braids'){
  r(13,6,19,5);r(16,3,13,3);for(let y=10;y<29;y+=3){r(10,y,4,3);r(31,y,4,3);r(11,y,1,2,shine);r(32,y,1,2,shine);}r(10,28,4,2,'#e5bb66');r(31,28,4,2,'#e5bb66');
 }else if(kind==='ponytail'){
  r(13,6,19,5);r(16,3,13,3);r(12,10,3,5);r(30,10,3,5);const x=side?9:29;r(x,10,5,15);r(x+1,11,2,12,shine);r(x,11,5,2,'#b99164');
 }else if(kind==='long'){
  r(13,5,19,7);r(17,3,11,3);r(10,10,4,18);r(31,10,4,18);r(11,11,1,14,shine);r(32,12,1,12,shine);r(21,5,2,6,skin);
 }else if(kind==='swept'){
  r(12,6,21,5);r(15,3,15,3);r(11,10,4,5);r(29,10,4,4);r(15,10,7,2);r(16,5,11,1,shine);r(14,7,8,1,shine);
 }
 if(back){r(13,10,19,12);r(14,21,17,2);r(17,23,11,2);r(15,11,2,7,shine);if(kind==='classic'){r(17,23,11,2,'#785638');r(15,11,3,8,'#785638');r(16,11,1,5,'#986d43');}if(kind==='ponytail')r(19,15,6,14);if(kind==='long')r(13,19,19,9);}
}
export const DEALER_APPEARANCE={id:'casino-dealer',skin:'#c89073',skinLight:'#e4b18f',skinShade:'#a56c54',hair:'#c7c6b2',hairHighlight:'#f5edd1',hairStyle:'slick',shirt:'#705782'};
export const SHOPKEEPER_APPEARANCE={id:'general-merchant',skin:'#ad785a',skinLight:'#ce9c78',skinShade:'#85513f',hair:'#35393c',hairStyle:'braids',shirt:'#78905c'};
export const SMITH_APPEARANCE={id:'town-smith',skin:'#ddb68d',skinLight:'#f0cda2',skinShade:'#b38764',hair:'#8d4b34',hairStyle:'mohawk',beard:true,shirt:'#8d7060'};
