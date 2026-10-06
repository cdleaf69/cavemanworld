const ROOT='/assets/audio/sfx/';
export function movementSound(player,sprinting){
 if(!player.moving||player.jumpHeight>2||player.flightHeight>2||player.vehicle||player.raftId)return null;
 if(player.layer==='ocean')return {file:'splash-b.wav',interval:.75,rate:.7,volume:.12,lowpass:650};
 if(player.swimming)return {file:'splash-a.wav',interval:sprinting?.45:.65,rate:sprinting?1.12:1,volume:.25};
 return {file:player.bridgeId?'footstep02.ogg':player.layer==='surface'?'footstep00.ogg':'footstep03.ogg',interval:sprinting?.21:.4,rate:sprinting?1.15:1,volume:.12};
}
export function creatureSound(c){
 const k=c.kind;
 if(['wolf','fox','mountainLion'].includes(k))return {file:'wolf.mp3',rate:k==='fox'?1.55:k==='mountainLion'?.72:1};
 if(k==='boar'||k==='deer')return {file:'boar.ogg',rate:k==='deer'?1.35:1};
 if(k==='stoneRam')return {file:'ram.ogg',rate:.9};
 if(['marshCrane','caveBat','crystalMoth'].includes(k))return {file:'birds.ogg',duration:.65,rate:k==='marshCrane'?.85:1.4};
 if(['rabbit','snowHare','tortoise','seaTurtle','sandLizard'].includes(k))return {file:'footstep01.ogg',rate:1.5,volume:.1};
 if(k==='steezus'||k==='adam'||k==='eve')return null;
 const index=['rootStalker','voidReaper','bigfoot','magmaBrute','emberGolem','obsidianSentinel'].includes(k)?2:['caveSpider','crystalBeetle','rockScorpion','ashMite'].includes(k)?3:c.aquatic?4:1;
 return {file:`creature-${index}.wav`,rate:c.boss?.7:1,volume:c.aquatic?.12:.22,lowpass:c.aquatic?900:undefined};
}
export class GameAudio{
 constructor(){this.buffers=new Map();this.sources=new Set();this.voiceSources=new Set();this.nextStep=0;this.nextAnimal=0;this.cooldowns=new Map();this.conversation=null;this.voiceRevision=0;this.lastPosition=null;this.ready=false;this.underwaterGain=0;this.underwaterPending=false;this.events=[];this.volume=.7;try{const v=localStorage.getItem('embervale-sfx-volume');if(v!==null)this.volume=Math.max(0,Math.min(1,Number(v)||0));}catch{}}
 unlock(){
  if(!this.context){const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return;this.context=new Context();this.master=this.context.createGain();this.master.gain.value=this.volume;this.master.connect(this.context.destination);}
  this.ready=true;this.context.resume().then(()=>{this.ready=true;}).catch(()=>{});
 }
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.master)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,.04);try{localStorage.setItem('embervale-sfx-volume',String(this.volume));}catch{}}
 buffer(file){if(!this.buffers.has(file))this.buffers.set(file,fetch(ROOT+file).then(r=>{if(!r.ok)throw Error(file);return r.arrayBuffer();}).then(b=>this.context.decodeAudioData(b)).catch(()=>null));return this.buffers.get(file);}
 async play(file,{volume=.25,rate=1,pan=0,lowpass=0,duration,voice=false,voiceRevision=this.voiceRevision}={}){
  if(!this.ready||!this.volume)return null;const buffer=await this.buffer(file);if(!buffer||!this.ready||!this.volume||(voice&&voiceRevision!==this.voiceRevision))return null;
  const c=this.context,source=c.createBufferSource(),gain=c.createGain(),panner=c.createStereoPanner();source.buffer=buffer;source.playbackRate.value=rate;gain.gain.value=volume;panner.pan.value=Math.max(-.8,Math.min(.8,pan));
  let tail=source;if(lowpass){const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=lowpass;source.connect(filter);tail=filter;}tail.connect(gain);gain.connect(panner);panner.connect(this.master);
  this.sources.add(source);if(voice)this.voiceSources.add(source);source.onended=()=>{this.sources.delete(source);this.voiceSources.delete(source);source.disconnect();gain.disconnect();panner.disconnect();};
  const seconds=Math.min(duration||buffer.duration/rate,buffer.duration/rate);gain.gain.setValueAtTime(volume,c.currentTime);gain.gain.setTargetAtTime(.0001,c.currentTime+Math.max(0,seconds-.06),.015);source.start();source.stop(c.currentTime+seconds);this.events.push(file);if(this.events.length>50)this.events.shift();return source;
 }
 talk(npc=null){
  if(npc===this.conversation)return;this.voiceRevision++;for(const source of this.voiceSources)try{source.stop();}catch{}
  const previous=this.conversation;this.conversation=npc;if(!npc&&!previous)return;
  const id=String((npc||previous).id||'npc'),pitch=.9+([...id].reduce((sum,ch)=>sum+ch.charCodeAt(0),0)%7)*.06;
  void this.play(npc?'npc-hello.wav':'npc-bye.wav',{rate:pitch,volume:.4,voice:true});
 }
 update(dt,now,player,creatures,{sprinting=false,paused=false}={}){
  if(!this.ready)return;
  const underwater=(player.layer==='ocean')&&!paused&&!document.hidden;
  this.underwaterGain=Math.max(0,Math.min(.18,this.underwaterGain+(underwater?1:-1)*dt*.18));
  if(underwater&&!this.underwaterSource&&!this.underwaterPending){this.underwaterPending=true;this.buffer('underwater.ogg').then(buffer=>{if(buffer){const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(this.master);source.start();this.underwaterSource=source;this.waterGain=gain;this.events.push('underwater.ogg');}this.underwaterPending=false;});}
  if(this.waterGain)this.waterGain.gain.setTargetAtTime(this.underwaterGain,this.context.currentTime,.12);
  if(!underwater&&this.underwaterGain===0&&this.underwaterSource){this.underwaterSource.stop();this.underwaterSource.disconnect();this.waterGain.disconnect();this.underwaterSource=null;this.waterGain=null;}
  const previous=this.lastPosition;this.lastPosition={x:player.x,y:player.y,layer:player.layer};
  if(paused||document.hidden)return;
  const moved=previous&&previous.layer===player.layer?Math.hypot(player.x-previous.x,player.y-previous.y):0;
  const step=movementSound(player,sprinting);
  if(step&&moved>.01&&moved<100&&now>=this.nextStep){this.nextStep=now+step.interval*1000;const file=step.file==='footstep00.ogg'&&Math.random()>.5?'footstep01.ogg':step.file;void this.play(file,step);}
  if(previous&&previous.layer===player.layer&&!this.wasSwimming&&player.swimming)void this.play('splash-b.wav',{volume:.35});this.wasSwimming=player.swimming;
  if(now<this.nextAnimal)return;this.nextAnimal=now+2800;
  let nearest=null,distance=650;for(const c of creatures){if(!c.alive||c.layer!==player.layer||(this.cooldowns.get(c.id)||0)>now||!creatureSound(c))continue;const d=Math.hypot(c.x-player.x,c.y-player.y);if(d<distance){distance=d;nearest=c;}}
  if(nearest){this.cooldowns.set(nearest.id,now+9000+Math.random()*7000);const sound=creatureSound(nearest);void this.play(sound.file,{...sound,volume:(sound.volume||.22)*(1-distance/700),pan:(nearest.x-player.x)/650,lowpass:player.underwater?700:sound.lowpass});}
 }
}
