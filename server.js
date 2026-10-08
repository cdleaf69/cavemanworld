import {gzip} from 'node:zlib';
import {promisify} from 'node:util';
import {createServer} from 'node:http';
import {readFile,stat,unlink} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
import {networkInterfaces} from 'node:os';
import {LanWorld} from './src/lan-server.js';
const root=resolve(import.meta.dirname),port=Number(process.env.PORT||3000),world=new LanWorld();
// Preserve the existing shared raft during this update's server restart.
const recovery=resolve(root,'../../work/pre-update-bases.json');try{for(const s of JSON.parse(await readFile(recovery,'utf8'))){s.driver=null;world.structures.set(s.id,s);}await unlink(recovery);}catch(error){if(error.code!=='ENOENT')console.error('Base recovery:',error.message);}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.ttf':'font/ttf','.png':'image/png','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav'};
const json=(res,status,data)=>res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(data));
const compress=promisify(gzip),assets=new Map(),eventFrames=new WeakMap();let assetBytes=0;
function eventFrame(event){let frame=eventFrames.get(event);if(!frame){frame=`data: ${JSON.stringify(event)}\n\n`;eventFrames.set(event,frame);}return frame;}
async function asset(file,info){
 let entry=assets.get(file);
 if(entry&&entry.modified===info.mtimeMs&&entry.size===info.size){assets.delete(file);assets.set(file,entry);return entry;}
 if(entry){assetBytes-=entry.bytes;assets.delete(file);}
 const body=await readFile(file),zipped=body.length>1024&&['.html','.css','.js','.json','.svg','.ttf'].includes(extname(file))?await compress(body):null;
 entry={modified:info.mtimeMs,size:info.size,body,zipped,bytes:body.length+(zipped?.length||0),etag:`W/"${info.size}-${info.mtimeMs}"`};
 assets.set(file,entry);assetBytes+=entry.bytes;
 while(assets.size>64||assetBytes>32*1024*1024){const oldest=assets.keys().next().value;assetBytes-=assets.get(oldest).bytes;assets.delete(oldest);}
 return entry;
}
createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 try{
  if(url.pathname==='/api/join'&&req.method==='POST'){json(res,200,world.join());return;}
  if(url.pathname==='/api/events'){
   const p=world.players.get(url.searchParams.get('id'));if(!p||p.token!==url.searchParams.get('token')){json(res,401,{error:'Reconnect'});return;}
   res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});const send=data=>res.write(eventFrame(data));send({type:'snapshot',data:world.snapshot()});
   const listener=e=>send(e);world.listeners.add(listener);const heartbeat=setInterval(()=>{p.lastSeen=Date.now();res.write(': ping\n\n');},10000);req.on('close',()=>{clearInterval(heartbeat);world.listeners.delete(listener);});return;
  }
  if(url.pathname==='/api/action'&&req.method==='POST'){
   let body='';for await(const chunk of req){body+=chunk;if(body.length>20000){json(res,413,{error:'Request too large'});return;}}
   const {id,token,action}=JSON.parse(body);try{json(res,200,world.action(id,token,action));}catch(e){json(res,400,{error:e.message});}return;
  }
  if(url.pathname.startsWith('/api/')){json(res,404,{error:'Unknown endpoint'});return;}
  const file=resolve(root,`.${decodeURIComponent(url.pathname)==='/'?'/index.html':decodeURIComponent(url.pathname)}`);if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}const info=await stat(file);if(!info.isFile())throw Error();if(extname(file)==='.mp3'){
   const {body}=await asset(file,info),match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
   if(match){const start=Number(match[1]),end=Math.min(body.length-1,match[2]?Number(match[2]):body.length-1);if(start> end){res.writeHead(416,{'Content-Range':`bytes */${body.length}`}).end();return;}res.writeHead(206,{'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${body.length}`,'Content-Length':end-start+1});res.end(req.method==='HEAD'?undefined:body.subarray(start,end+1));return;}
   res.writeHead(200,{'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Content-Length':body.length,'Cache-Control':'no-cache'}).end(req.method==='HEAD'?undefined:body);return;
  }const headers={'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','ETag':`W/"${info.size}-${info.mtimeMs}"`,'Vary':'Accept-Encoding'};
  if(req.headers['if-none-match']===headers.ETag){res.writeHead(304,headers).end();return;}
  const entry=await asset(file,info);
  const zipped=entry.zipped&&/\bgzip\b(?!\s*;\s*q=0(?:\.0*)?(?:\s*[,;]|$))/i.test(req.headers['accept-encoding']||'');
  if(zipped)headers['Content-Encoding']='gzip';res.writeHead(200,headers).end(req.method==='HEAD'?undefined:zipped?entry.zipped:entry.body);
 }catch{res.writeHead(404).end('Not found');}
}).listen(port,'0.0.0.0',()=>{console.log(`CaveManWorld: http://localhost:${port}`);for(const addresses of Object.values(networkInterfaces()))for(const a of addresses||[])if(a.family==='IPv4'&&!a.internal)console.log(`LAN: http://${a.address}:${port}`);});
setInterval(()=>{for(const p of world.players.values())if(Date.now()-p.lastSeen>20000)world.leave(p.id);},5000).unref();

setInterval(()=>world.tick(),33).unref();
