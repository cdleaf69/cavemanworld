import test from 'node:test';import assert from 'node:assert/strict';import {PixelArt} from '../src/pixel-art.js';
test('sprite opacity preserves roof/wall transparency set by its parent renderer',()=>{
 let drawn=null,saved=0;const ctx={globalAlpha:.18,save(){saved=this.globalAlpha;},restore(){this.globalAlpha=saved;},translate(){},scale(){},drawImage(){drawn=this.globalAlpha;}};
 PixelArt.prototype.draw.call({},ctx,{image:{width:128,height:128},ax:64,ay:64},0,0,1);assert.equal(drawn,.18);assert.equal(ctx.globalAlpha,.18);
 ctx.globalAlpha=.4;PixelArt.prototype.draw.call({},ctx,{image:{width:128,height:128},ax:64,ay:64},0,0,1,.5);assert.equal(drawn,.2);assert.equal(ctx.globalAlpha,.4);
});
