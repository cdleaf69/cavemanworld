export function frontierItemSvg(r){
const wood='#b99565',dark='#556b6a',light='#c2d6cd';
const box=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const path=(d,c)=>`<path d="${d}" fill="${c}"/>`;
switch(r.id){
case 'powered-drill':return '<g shape-rendering="crispEdges">'+path('M14 77 53 38 66 49 26 88Z',wood)+box(37,27,29,30,dark)+box(42,32,20,19,'#a9bdd5')+path('M53 26 75 8 87 20 65 42Z',light)+path('M66 13 74 8 87 20 82 27Z','#e2e4bf')+box(32,55,15,6,'#628494')+'</g>';
case 'grappling-tool':return `<path d="M22 80Q45 81 40 62L60 29" fill="none" stroke="${wood}" stroke-width="5"/>`+path('M51 18 61 27 72 15 77 20 66 32 72 44 65 48 58 35 46 36 44 28Z',light)+box(14,74,20,8,dark);
case 'wood-scooter':return box(10,66,65,8,wood)+box(64,22,5,47,light)+box(52,21,26,6,wood)+box(16,74,12,12,dark)+box(62,74,12,12,dark);
case 'reed-raft':return [0,1,2,3,4,5].map(i=>box(13+i*12,33,10,40,i%2?wood:'#cabd7b')).join('')+box(12,40,72,4,dark)+box(12,63,72,4,dark)+path('M48 18 50 58 56 59 55 18Z',wood);
case 'crystal-glider':return path('M7 58 48 18 89 58 48 44Z','#a4c1da')+path('M7 58 48 18 48 44Z','#8299c7')+box(46,22,4,52,wood)+path('M40 48 48 39 55 48 48 60Z','#ded9f4');
case 'wood-floor':return [0,1,2,3,4].map(i=>box(12,22+i*12,72,10,i%2?wood:'#c4a87b')).join('');
case 'stone-wall':return [0,1,2].map(i=>[0,1,2].map(j=>box(12+j*24,29+i*16,22,14,i%2?'#a6bdb5':'#7c9998')).join('')).join('');
case 'wood-gate':return box(10,25,9,58,dark)+box(76,25,9,58,dark)+[0,1,2,3].map(i=>box(25+i*12,32,9,45,wood)).join('')+box(21,39,52,5,dark)+box(21,65,52,5,dark);
case 'storage-chest':return box(12,39,72,37,'#896443')+box(12,30,72,16,wood)+box(23,31,5,43,'#e0c187')+box(68,31,5,43,'#e0c187')+box(44,45,9,10,'#f7d48a');
case 'drying-shack':return box(22,36,53,47,wood)+path('M10 39 48 12 87 39Z','#75956c')+box(28,48,41,4,dark)+[0,1,2].map(i=>path(`M${31+i*14} 52 ${42+i*14} 57 ${36+i*14} 75Z`,'#88b572')).join('');
case 'fish-trap':return box(15,36,66,41,'#829679')+[0,1,2,3,4].map(i=>box(20+i*12,33,5,46,wood)).join('')+box(15,40,66,5,'#d3c089')+box(15,68,66,5,'#d3c089');
case 'ore-extractor':return box(15,73,65,10,dark)+box(24,24,6,52,light)+box(68,24,6,52,light)+box(22,22,55,8,dark)+box(37,31,25,30,'#7795b2')+box(45,61,8,17,light);
case 'timber-rig':return box(16,74,65,10,wood)+box(28,17,8,60,wood)+box(29,17,42,7,wood)+box(65,24,3,34,light)+box(53,58,26,8,dark);
case 'healing-totem':return box(42,43,12,37,wood)+path('M28 40 48 15 68 40 48 62Z','#93c8cc')+path('M39 36 48 23 55 38 48 49Z','#e6eccb');
case 'tidekeeper-armor':return path('M19 25 32 15 48 23 64 15 77 25 82 44 68 47 66 81 30 81 28 47 14 44Z','#538d9b')+path('M36 34 48 28 60 34 58 63 48 74 38 63Z','#a8cbb8')+box(42,33,12,6,'#e4e6b6')+`<path d="M18 28 29 40M78 28 67 40M33 73H63" stroke="#77b9c4" stroke-width="5"/>`;
case 'diver-wrap':return path('M26 22 38 17 48 25 58 17 70 22 68 79 28 79Z','#b89b75')+box(31,35,11,28,'#76a6aa')+box(55,35,11,28,'#76a6aa')+box(37,65,23,5,'#e1d5ac');
default:return null;
}}
