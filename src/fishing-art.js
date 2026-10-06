export function drawFishingWater(c,fishing,time){
 const {x,y}=fishing.castPoint,ready=fishing.ready,stir=fishing.disturbance||ready;
 if(stir){
  const shade=ready?'#206984':'#257e97',a=time*.003;
  c.fillStyle=shade;c.fillRect(x+Math.cos(a)*19-7,y+Math.sin(a)*9+3,14,3);c.fillRect(x+Math.cos(a)*19+7,y+Math.sin(a)*9+2,3,4);
  for(let i=0;i<3;i++){const phase=(time/750+i/3)%1,r=7+phase*(ready?32:24);c.globalAlpha=(1-phase)*.75;c.strokeStyle=ready?'#f6df95':'#cef2df';c.lineWidth=2;c.beginPath();c.ellipse(x,y+3,r,r*.48,0,0,Math.PI*2);c.stroke();}
  c.globalAlpha=1;
  for(let i=0;i<5;i++){const a=i*2.4+time*.003,r=14+(i%2)*9;c.fillStyle=i%2?'#e7fff0':'#88d9da';c.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r*.5,3,2);}
 }
 const bob=ready?Math.sin(time*.023)*3:Math.sin(time*.004);
 c.fillStyle='#e7efec';c.fillRect(x-5,y-5+bob,10,6);c.fillStyle=ready?'#deb572':'#87969b';c.fillRect(x-5,y+1+bob,10,7);
 if(fishing.fish){
  c.fillStyle='#3f342c';c.fillRect(x-47,y-39,94,13);c.fillStyle='#d4bb89';c.fillRect(x-45,y-37,90,9);c.fillStyle=fishing.escapeAt-time<4000?'#dc805b':'#619e77';c.fillRect(x-45,y-37,90*fishing.progress/100,9);
  c.fillStyle='#fff0c2';c.font='11px EmberRunes, monospace';c.textAlign='center';c.fillText('REEL! CLICK!',x,y-45);
 }
}
export function baitImage(bait){
 const shapes={worms:'<path d="M10 15h13v5H13v6h18v-9h6v17H10V15z" fill="#b98576"/><path d="M12 16h9M13 27h16" stroke="#ebbe9b" stroke-width="2"/><path d="M15 17v4M19 17v4M18 27v5M24 27v5M33 20h4M33 25h4" stroke="#805c59" stroke-width="2"/>','grub-bait':'<path d="M10 17h5v-5h17v5h5v15h-5v5H15v-5h-5z" fill="#ccc795"/><path d="M14 17h16v5H14z" fill="#ede6b6"/><path d="M16 25v10M23 25v10M30 25v8" stroke="#97945f" stroke-width="2"/><path d="M12 24h6v5h-6z" fill="#9c724f"/>','glow-bait':'<path d="M10 16h8v-5h12v6h7v14h-7v7H17v-6h-7z" fill="#56a994"/><path d="M16 16h13v5H16zm3 10h12v8H19z" fill="#b6f0b4"/><path d="M7 8h3v4H7zm30 3h3v4h-3zm0 26h4v3h-4z" fill="#e6f8c1"/>','royal-bait':'<path d="M10 17h28v22H10z" fill="#a46f50"/><path d="M10 12h28v7H10z" fill="#ecc67e"/><path d="M14 21h20v13H14z" fill="#dbc791"/><path d="M20 24h8v7h-8z" fill="#b9805b"/><path d="M11 8l5 2 3-5 5 4 6-4 2 5 5-2-3 5H15z" fill="#ecc67e"/>','abyss-bait':'<path d="M9 17l9-9h13l8 9v15l-8 8H18l-9-8z" fill="#6c608e"/><path d="M17 15h14v17H17z" fill="#ab99db"/><path d="M22 18h6v11h-6z" fill="#eff0bd"/><path d="M11 25h5v3h-5zm20-8h5v3h-5zm-5 18h8v3h-8z" fill="#94d7c3"/>'};
 const image=document.createElement('img');image.className='bait-art';image.alt= bait.name;image.width=48;image.height=48;image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g shape-rendering="crispEdges">${shapes[bait.id]}</g></svg>`);return image;
}
