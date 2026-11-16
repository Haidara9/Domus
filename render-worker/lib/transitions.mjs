// Executable transitions between the uploaded clips. The shared catalog
// (apps/workspace/app/transitions-catalog.json) says which recipes are ready and how long they
// last; this file holds the FFmpeg recipe for each ready one. Recipes that need shot analysis,
// masks or tracking (shape/motion match, door or wall occlusion, day-night...) stay references.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
export const transitions=JSON.parse(fs.readFileSync(path.join(root,'apps/workspace/app/transitions-catalog.json'),'utf8'));
// kind cut: plain concat. dip/defocus: effect inside each clip's own frames, duration unchanged.
// xfade: the two clips overlap, so each join shortens the film by `seconds`.
export const engines={
 'tr-cut':{kind:'cut'},
 'tr-black':{kind:'dip',color:'0x151412'},
 'tr-beige':{kind:'dip',color:'0xF1E6D3'},
 'tr-defocus':{kind:'defocus'},
 'tr-dissolve':{kind:'xfade',mode:'fade'},
 'tr-whip':{kind:'xfade',mode:'slideleft',blurAngle:0},
 'tr-vertical':{kind:'xfade',mode:'slideup',blurAngle:90},
 'tr-directional':{kind:'xfade',mode:'hblur'},
 'tr-radial':{kind:'xfade',mode:'zoomin'},
 'tr-wipe':{kind:'xfade',mode:'smoothleft'},
 'tr-iris':{kind:'xfade',mode:'circleopen'},
 'tr-split':{kind:'xfade',mode:'vertopen'},
 'tr-push':{kind:'xfade',mode:'slideleft'}
};
export function resolveTransition(id,clipCount){
 if(id===undefined||id===null||id==='')id='tr-cut';
 const entry=typeof id==='string'?transitions.find(t=>t.id===id):null;
 if(!entry)throw Error('الترانزيشن غير موجود في مكتبة دوموس.');
 if(!entry.ready||!engines[id])throw Error('هذا الترانزيشن وصفة مرجعية تحتاج تنفيذًا قبل تشغيلها تلقائيًا.');
 const joins=Math.max(0,clipCount-1),engine=joins?engines[id]:engines['tr-cut'];
 return {id:joins?id:'tr-cut',...engine,seconds:joins?entry.seconds:0,joins,cut:engine.kind==='xfade'?+(entry.seconds*joins).toFixed(3):0};
}
const n=x=>+x.toFixed(4);
// Filters applied while encoding clip `i` (dip and defocus only). `chain` continues a video
// filter chain; `audio` continues the audio chain.
export function clipEffects(tr,{i,count,dur,w,h}){
 const first=i===0,last=i===count-1,half=tr.seconds/2;let chain='';const audio=[];
 if(tr.kind==='dip'){
  if(!first){chain+=`,fade=t=in:st=0:d=${half}:color=${tr.color}`;audio.push(`afade=t=in:st=0:d=${half}`);}
  if(!last){chain+=`,fade=t=out:st=${n(dur-half)}:d=${half}:color=${tr.color}`;audio.push(`afade=t=out:st=${n(dur-half)}:d=${half}`);}
 }
 if(tr.kind==='defocus'){
  // Cross-fade into a blurred copy of the same frames around the join; the cut itself is hard.
  const sides=[!first&&'in',!last&&'out'].filter(Boolean),sw=Math.max(2,Math.round(w/8)*2),sh=Math.max(2,Math.round(h/8)*2);
  if(sides.length){
   chain+=`,split=${sides.length+1}[m]${sides.map(s=>`[s${s}]`).join('')};`;let cur='m';
   for(const s of sides){
    const fade=s==='in'?`fade=t=out:st=0:d=${half}:alpha=1`:`fade=t=in:st=${n(dur-half)}:d=${half}:alpha=1`;
    chain+=`[s${s}]scale=${sw}:${sh},gblur=sigma=5,scale=${w}:${h}:flags=bicubic,format=yuva420p,${fade}[b${s}];[${cur}][b${s}]overlay=format=auto[o${s}];`;cur='o'+s;
   }
   chain+=`[${cur}]null`;
  }
 }
 return {chain,audio};
}
// filter_complex joining already-normalised clips (inputs 0..count-1) with xfade + acrossfade.
// Returns the graph and the labels of the joined video/audio.
export function xfadeGraph(tr,durations,{w,fps}){
 const o=tr.seconds,parts=[],windows=[];let v='v0',a='0:a',length=durations[0];
 durations.forEach((_,i)=>parts.push(`[${i}:v]settb=AVTB,fps=${fps},format=yuv420p[v${i}]`));
 for(let i=1;i<durations.length;i++){
  const offset=n(length-o);windows.push([offset,n(offset+o)]);
  parts.push(`[${v}][v${i}]xfade=transition=${tr.mode}:duration=${o}:offset=${offset}[x${i}]`,`[${a}][${i}:a]acrossfade=d=${o}:c1=tri:c2=tri[y${i}]`);
  v='x'+i;a='y'+i;length=length+durations[i]-o;
 }
 if(tr.blurAngle!==undefined){
  parts.push(`[${v}]dblur=angle=${tr.blurAngle}:radius=${Math.max(4,Math.round(w*.035))}:enable='${windows.map(([s,e])=>`between(t,${s},${e})`).join('+')}'[xb]`);v='xb';
 }
 return {graph:parts.join(';'),video:v,audio:a,length:n(length)};
}
