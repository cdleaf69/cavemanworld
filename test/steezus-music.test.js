import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SteezusMusic} from '../src/steezus-music.js';
test('full Steezus clip plays once on appearance, fades at the end and on death, and never loops during attacks',async()=>{
 let ended,plays=0;const audio={paused:true,ended:false,currentTime:0,duration:40,addEventListener(type,fn){ended=fn;},play(){plays++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};
 const music=new SteezusMusic(audio),p={x:0,y:0,layer:'surface'},boss={kind:'steezus',alive:true,x:100,y:0,layer:'surface'};
 music.update(1,p,[boss]);assert.equal(plays,0);music.unlock();music.update(1,p,[boss]);assert.equal(plays,1);assert.equal(audio.loop,false);
 audio.currentTime=3;music.update(1,p,[boss]);assert.equal(audio.volume,.55);audio.currentTime=39;music.update(.1,p,[boss]);assert.equal(audio.volume,.275);
 audio.paused=true;audio.ended=true;ended();await Promise.resolve();await Promise.resolve();for(let i=0;i<10;i++){boss.attackingUntil=Infinity;music.update(1,p,[boss]);}assert.equal(plays,1);assert.equal(audio.volume,0);
 boss.alive=false;music.update(1,p,[boss]);boss.alive=true;audio.ended=false;music.update(2,p,[boss]);assert.equal(plays,2);audio.currentTime=3;music.update(.1,p,[boss]);boss.alive=false;music.update(1,p,[boss]);assert.equal(audio.volume,.275);music.update(1,p,[boss]);assert.equal(audio.paused,true);assert.equal(audio.volume,0);
});
