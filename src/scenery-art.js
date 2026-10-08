// Shared scenery language: stepped silhouettes, a consistent dark contour,
// and a handful of broad light/shadow planes. Painted once into sprite caches.
export function sceneryPolygon(c,points,color){
 // Rasterize onto whole pixels so rounded scenery never acquires a blurred fringe.
 c.fillStyle=color;const low=Math.floor(Math.min(...points.map(p=>p[1]))),high=Math.ceil(Math.max(...points.map(p=>p[1])));
 for(let y=low;y<high;y++){const crossings=[],scan=y+.5;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[j],b=points[i];if((a[1]>scan)!==(b[1]>scan))crossings.push(a[0]+(scan-a[1])*(b[0]-a[0])/(b[1]-a[1]));}crossings.sort((a,b)=>a-b);for(let i=0;i+1<crossings.length;i+=2){const left=Math.ceil(crossings[i]-.5),right=Math.ceil(crossings[i+1]-.5);c.fillRect(left,y,right-left,1);}}
}
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
export function leafMass(c,x,y,rx,ry,p,seed=0){
 const oval=(cx,cy,rx,ry,color)=>{for(let row=-Math.round(ry);row<=Math.round(ry);row++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(row/ry)**2)));rect(c,cx-w,cy+row,w*2,1,color);}};
 // One-pixel contours round off the leaf masses without smoothing away pixels.
 oval(x,y,rx,ry,p[0]);oval(x-1,y-2,rx-1,ry-2,p[1]);
 oval(x-rx*.18,y-ry*.2,rx*.77,ry*.7,p[2]);
 oval(x-rx*.3,y-ry*.4,rx*.38,ry*.24,p[3]);
 oval(x+rx*.3,y+ry*.28,rx*.44,ry*.28,p[1]);
 for(const [dx,dy,w]of [[-.55,.28,3],[.32,.28,4],[.55,-.18,3],[-.07,.48,3]]){rect(c,x+dx*rx,y+dy*ry,w,1,p[0]);rect(c,x+dx*rx-1,y+dy*ry-1,w,1,p[2]);}

}
export function sceneryRock(c,form,p,oreColor){
 const poly=(pts,color)=>sceneryPolygon(c,pts,color);
 const silhouettes=[[[7,49],[10,35],[18,25],[29,19],[45,22],[52,32],[58,48],[49,55],[20,57]],[[6,49],[9,40],[21,33],[36,29],[49,33],[57,42],[59,51],[47,57],[17,56]],[[13,54],[12,38],[18,23],[22,12],[35,8],[42,15],[50,30],[48,55],[31,58]]];
 if(form===3){for(const [x,y,s]of[[7,43,19],[27,30,26],[42,46,16]]){poly([[x,y+10],[x+2,y-4],[x+s-7,y-7],[x+s,y+5],[x+s-3,y+13],[x+4,y+14]],p[0]);poly([[x+3,y-3],[x+s-7,y-5],[x+s-3,y+3],[x+5,y+5]],p[1]);poly([[x+5,y+6],[x+s-3,y+4],[x+s-5,y+11],[x+5,y+11]],p[2]);}return;}
 poly(silhouettes[form],p[0]);
 if(form===2){poly([[24,14],[34,11],[40,18],[39,35],[27,44],[16,44],[20,25]],p[1]);poly([[40,19],[47,32],[45,53],[30,55],[27,45],[40,36]],p[2]);poly([[21,25],[24,15],[33,12],[29,29],[18,39]],'#e3edda80');rect(c,30,35,2,10,p[0]);rect(c,28,43,3,2,p[0]);}
 else{poly(form===0?[[12,35],[20,27],[30,23],[43,25],[48,33],[37,42],[17,44]]:[[12,41],[23,36],[36,32],[46,36],[52,43],[34,47],[13,48]],p[1]);poly(form===0?[[17,46],[37,44],[47,34],[53,48],[47,52],[21,54]]:[[14,50],[35,49],[53,46],[53,51],[46,54],[18,53]],p[2]);rect(c,22,form===0?30:38,9,2,'#e3edda70');rect(c,39,44,7,2,p[0]);rect(c,37,46,3,2,p[0]);}
 if(oreColor){for(const [x,y]of[[20,35],[31,29],[39,41]]){poly([[x-2,y+7],[x,y],[x+5,y-3],[x+9,y+3],[x+7,y+9],[x+1,y+10]],p[0]);poly([[x,y+5],[x+1,y],[x+5,y-1],[x+7,y+4],[x+5,y+7]],oreColor);rect(c,x+1,y,2,4,'#fff4d6');}}
}
export function sceneryMushroom(c,x,y,size=1,color='#c28b88'){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(size,size);
 const poly=(pts,col)=>sceneryPolygon(c,pts,col);
 poly([[-3,0],[3,0],[4,20],[1,23],[-4,22],[-2,10]],'#6b6156');rect(c,-2,1,3,19,'#d1b993');rect(c,-2,2,1,16,'#f6e4bc');
 poly([[-11,1],[-11,-3],[-8,-3],[-8,-7],[-4,-9],[3,-10],[7,-7],[10,-3],[11,1],[7,4],[-7,4]],'#54474c');
 poly([[-9,-2],[-6,-6],[-2,-8],[3,-8],[6,-5],[9,-1],[6,1],[-7,1]],color);
 poly([[-6,-4],[-2,-7],[2,-7],[3,-5],[-2,-3]],'#efd6ab');rect(c,-8,2,15,1,'#c8b697');for(let i=-6;i<7;i+=4)rect(c,i,3,1,2,'#7f6c60');rect(c,4,-2,2,2,'#f4e7c5');c.restore();
}
