import { AdventureArt } from './adventure-art.js';

// Procedural math and rasterization never block input or animation on supported browsers.
const art=new AdventureArt({worker:false});
self.onmessage=({data:{key,gx,gy,layer,kind}})=>{
  const bitmap=(kind==='atlas'?art.makeAtlas():kind==='cave-atlas'?art.makeCaveAtlas(layer):art.makeTerrain(gx,gy,layer)).transferToImageBitmap();
  self.postMessage({key,bitmap},[bitmap]);
};
