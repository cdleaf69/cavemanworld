export class SteezusMusic {
 constructor(audio=new Audio('/assets/audio/steezus-intro.mp3')) {
  this.audio=audio;audio.preload='none';audio.loop=false;audio.volume=0;
  this.unlocked=false;this.near=false;this.gain=0;this.pending=false;this.blocked=false;
  this.played=new WeakSet();this.boss=null;this.finished=true;
  audio.addEventListener?.('ended',()=>{this.finished=true;this.gain=0;audio.volume=0;});
 }
 unlock(){this.unlocked=true;this.blocked=false;}
 update(dt,player,creatures){
  for(const c of creatures)if(c.kind==='steezus'&&!c.alive)this.played.delete(c);
  const visible=c=>c.alive&&c.layer===player.layer&&Math.hypot(c.x-player.x,c.y-player.y)<1300;
  this.near=creatures.some(c=>c.kind==='steezus'&&visible(c));
  if(this.unlocked&&this.finished&&this.gain===0){
   const boss=creatures.find(c=>c.kind==='steezus'&&visible(c)&&!this.played.has(c));
   if(boss){this.boss=boss;this.played.add(boss);this.finished=false;this.audio.currentTime=0;}
  }
  const target=this.unlocked&&!this.finished&&this.boss?.alive&&this.boss.layer===player.layer&&Math.hypot(this.boss.x-player.x,this.boss.y-player.y)<1900?1:0;
  this.gain=Math.max(0,Math.min(1,this.gain+(target?1:-1)*dt/2));
  const a=this.audio,end=Number.isFinite(a.duration)?a.duration:Infinity;
  const edge=Math.max(0,Math.min(1,a.currentTime/2,(end-a.currentTime)/2));
  a.volume=.55*this.gain*edge;
  if(target&&a.paused&&!a.ended&&!this.pending&&!this.blocked){
   this.pending=true;Promise.resolve(a.play()).catch(()=>{this.blocked=true;}).finally(()=>{this.pending=false;});
  }
  if(!target&&this.gain===0&&!this.finished){a.pause();a.currentTime=0;this.finished=true;}
 }
}
