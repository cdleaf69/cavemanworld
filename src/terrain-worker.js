import { AdventureArt } from './adventure-art.js';

// Procedural math and rasterization never block input or animation on supported browsers.
const art=new AdventureArt({worker:false});
self.onmessage=({data:{key,gx,gy,layer}})=>{
  const bitmap=art.makeTerrain(gx,gy,layer).transferToImageBitmap();
  self.postMessage({key,bitmap},[bitmap]);
};
