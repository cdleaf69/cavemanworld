import test from 'node:test';
import assert from 'node:assert/strict';
import {MapView,mapProjection} from '../src/map-view.js';
import {slideStep} from '../src/sliding-motion.js';
import {caveClearance,roomRadius} from '../src/cave-shapes.js';
test('map zoom keeps the cursor on the same world point and pan stays inside map edges',()=>{
 const c={width:960,height:746},world={width:135000,height:84000},view=new MapView(),before=mapProjection(c,world,view),pointer={x:450,y:360};
 const point={x:(pointer.x-before.ox)/before.scale,y:(pointer.y-before.oy)/before.scale};view.zoomAt(pointer.x,pointer.y,3,c,world);const after=mapProjection(c,world,view);
 assert.ok(Math.abs(point.x*after.scale+after.ox-pointer.x)<1e-6);assert.ok(Math.abs(point.y*after.scale+after.oy-pointer.y)<1e-6);
 view.pan(99999,-99999,c,world);const p=mapProjection(c,world,view);assert.ok(p.ox<=0&&p.oy<=0);assert.ok(p.ox+world.width*p.scale>=c.width);assert.ok(p.oy+world.height*p.scale>=c.height);
 view.zoomAt(400,300,100,c,world);assert.equal(view.zoom,8);view.zoomAt(400,300,.0001,c,world);assert.equal(view.zoom,1);assert.equal(view.x,0);assert.equal(view.y,0);
});
test('diagonal impact preserves travel along flat and sloped walls without crossing them',()=>{
 let p=slideStep(-1,0,8,6,(x,y)=>x<=0);assert.ok(p.x<=0&&p.x>-.05);assert.ok(p.y>5.9);
 p=slideStep(0,1,8,0,(x,y)=>y>=x);assert.ok(p.y>=p.x);assert.ok(p.x>3&&p.y>3);
 p=slideStep(-1,0,8,0,x=>x<=0);assert.ok(p.x<=0);assert.ok(Math.abs(p.y)<.01);
 const corner=slideStep(-1,-1,8,8,(x,y)=>x<=0&&y<=0);assert.ok(corner.x<=0&&corner.y<=0);
});
test('glancing movement follows a round obstacle and curved cave boundary',()=>{
 let p={x:-48,y:-18},free=(x,y)=>Math.hypot(x,y)>=50;
 for(let i=0;i<20;i++){const old=p;p=slideStep(p.x,p.y,5,0,free);assert.ok(free(p.x,p.y));assert.ok(Math.hypot(p.x-old.x,p.y-old.y)<=5.01);}
 assert.ok(p.x>-20&&p.y<-40);
 const room={x:1000,y:1000,r:600,shapeSeed:2},g={rooms:[room],tunnels:[],pillars:[]},a=.7,r=roomRadius(room,a)-26;
 p={x:1000+Math.cos(a)*r,y:1000+Math.sin(a)*r};const initial={...p};free=(x,y)=>caveClearance(x,y,g)>24;
 for(let i=0;i<80;i++){p=slideStep(p.x,p.y,6,0,free);assert.ok(free(p.x,p.y));}
 assert.ok(Math.hypot(p.x-initial.x,p.y-initial.y)>100);assert.ok(Math.abs(p.y-initial.y)>30);
});
