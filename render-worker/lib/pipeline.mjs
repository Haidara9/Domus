import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {run,ffmpeg,probe} from './process.mjs';
import {validateSpec} from './catalog.mjs';
import {resolveTransition,clipEffects,xfadeGraph} from './transitions.mjs';
const fileHash=async(p)=>{const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(p))h.update(chunk);return h.digest('hex');};
const root=path.resolve(import.meta.dirname,'../..');
const formats={'9:16':[1080,1920],'4:5':[1080,1350],'1:1':[1080,1080],'16:9':[1920,1080]};
const OUTRO_SECONDS=2.6,encode=crf=>['-c:v','libx264','-preset','fast','-crf',String(crf),'-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ac','2'];
export async function executeJob(spec,inputs,dir,{signal,progress=async()=>{},testSize}={}){
 spec=validateSpec(spec);if(inputs.length!==spec.files.length)throw Error('missing raw input');fs.mkdirSync(dir,{recursive:true});const [w,h]=testSize||formats[spec.format],fps=30;
 const tr=resolveTransition(spec.transition,inputs.length),outro=spec.styleId==='domus-logo-outro',counter=spec.styleId==='domus-counter';
 // Clips joined by an overlap transition are encoded a second time, so keep the first pass near-lossless.
 const clipCrf=tr.kind==='xfade'?12:18;
 if(counter)fs.copyFileSync(path.join(root,'brand/fonts/english/PlayfairDisplay/static/PlayfairDisplay-Regular.ttf'),path.join(dir,'playfair.ttf'));
 const probes=await Promise.all(inputs.map(f=>probe(f,{signal})));let sourceDuration=0;const pieces=[],durations=[],ledger=[];
 for(let i=0;i<inputs.length;i++){
 const m=probes[i],v=m.streams.find(s=>s.codec_type==='video');if(!v||!Number.isFinite(Number(m.format.duration))||Number(m.format.duration)<=0)throw Error('invalid video');
 if(['smpte2084','arib-std-b67'].includes(v.color_transfer))throw Error('HDR source requires an approved color transform before this preset.');
 const seconds=Number(m.format.duration);if(seconds>1800||sourceDuration+seconds>1800)throw Error('maximum production duration is 30 minutes');sourceDuration+=seconds;const frames=Math.ceil(seconds*fps),dur=frames/fps;ledger.push({name:spec.files[i].name,duration:seconds,frames,sha256:await fileHash(inputs[i])});
 if(tr.joins&&dur<tr.seconds*2+.2)throw Error(`clip ${i+1} (${seconds.toFixed(2)}s) is too short for transition ${tr.id}; it needs at least ${(tr.seconds*2+.2).toFixed(2)}s`);
 const file=path.join(dir,`segment-${i}.mp4`),last=i===inputs.length-1;let vf=`scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=0x151412,setsar=1,fps=${fps}`;
 if(spec.styleId==='domus-warm')vf+=',eq=contrast=1.02:saturation=1.03:brightness=0.005,colorbalance=rs=0.012:bs=-0.008';
 if(spec.styleId==='digital_zoom')vf+=`,scale=${Math.ceil(w*1.03/2)*2}:${Math.ceil(h*1.03/2)*2},crop=${w}:${h}`;
 const fx=clipEffects(tr,{i,count:inputs.length,dur,w,h});let graph=`[0:v]${vf},tpad=stop_mode=clone:stop_duration=0.1${fx.chain}`;const af=['aresample=48000','apad',`atrim=duration=${dur}`,'asetpts=PTS-STARTPTS',...fx.audio];
 // The logo card follows the last clip: dip its final 0.4s to the card's paper colour.
 if(outro&&last){graph+=`,fade=t=out:st=${+(dur-.4).toFixed(4)}:d=0.4:color=0xF1E6D3`;af.push(`afade=t=out:st=${+(dur-.4).toFixed(4)}:d=0.4`);}
 if(counter){const x=Math.round(w*.07),y=Math.round(h*.8),label=`${String(i+1).padStart(2,'0')} / ${String(inputs.length).padStart(2,'0')}`;graph+=`,drawbox=x=${x}:y=${y-Math.round(w*.022)}:w=${Math.round(w*.07)}:h=${Math.max(2,Math.round(w*.003))}:color=0xA86F3F:t=fill,drawtext=fontfile=playfair.ttf:text='${label}':fontsize=${Math.round(w*.036)}:fontcolor=0xF1E6D3:x=${x}:y=${y}:shadowcolor=0x151412@0.55:shadowx=2:shadowy=2`;}
 graph+=',format=yuv420p[v]';
 const hasAudio=spec.audio==='preserve'&&m.streams.some(s=>s.codec_type==='audio');const args=['-i',inputs[i]];if(!hasAudio)args.push('-f','lavfi','-i','anullsrc=r=48000:cl=stereo');
 args.push('-filter_complex',graph,'-map','[v]','-map',hasAudio?'0:a:0':'1:a:0','-af',af.join(','),'-t',String(dur),...encode(clipCrf),file);await ffmpeg(args,{signal,cwd:dir});pieces.push(file);durations.push(dur);
 }
 let added=0,tail=null;if(outro){tail=await logoCard(dir,{w,h,fps,signal});added=OUTRO_SECONDS;}
 // Assembly keeps every clip in upload order. No editorial source selection, generative footage, speed ramp or added SFX.
 const base=path.join(dir,'base.mp4');
 if(tr.kind==='xfade'){
 const g=xfadeGraph(tr,durations,{w,fps});let graph=g.graph,video=g.video,audio=g.audio;const args=pieces.flatMap(f=>['-i',f]);
 if(tail){const k=pieces.length;args.push('-i',tail);graph+=`;[${k}:v]settb=AVTB,fps=${fps},format=yuv420p[tv];[${video}][${audio}][tv][${k}:a]concat=n=2:v=1:a=1[cv][ca]`;video='cv';audio='ca';}
 await ffmpeg([...args,'-filter_complex',graph,'-map',`[${video}]`,'-map',`[${audio}]`,...encode(18),base],{signal,timeout:3600000});
 }else{
 fs.writeFileSync(path.join(dir,'concat.txt'),[...pieces,...(tail?[tail]:[])].map(f=>`file '${path.basename(f)}'`).join('\n'));
 await ffmpeg(['-f','concat','-safe','1','-i',path.join(dir,'concat.txt'),'-c','copy',base],{signal});
 }
 const before=await probe(base,{signal}),frames=before.streams.find(s=>s.codec_type==='video').nb_frames,totalFrames=Number(frames)||Math.round(Number(before.format.duration)*fps);
 await progress('rendering');let visual=base;
 if(spec.backend==='remotion')visual=await remotion(spec,base,dir,{w,h,fps,totalFrames,signal});
 if(spec.backend==='hyperframes')visual=await hyperframes(spec,base,dir,{w,h,fps,totalFrames,signal});
 const final=path.join(dir,'review.mp4');
 if(visual===base)fs.copyFileSync(base,final);else await ffmpeg(['-i',visual,'-i',base,'-map','0:v:0','-map','1:a:0','-c','copy','-t',String(totalFrames/fps),'-movflags','+faststart',final],{signal});
 // Seconds the logo card adds are not allowed to hide seconds a transition removed from the footage.
 await progress('checking');await ffmpeg(['-i',final,'-f','null','-'],{signal});const out=await probe(final,{signal}),actual=Number(out.format.duration),durationCut=Math.max(0,sourceDuration-(actual-added));
 const min=Math.max(spec.minDuration||0,sourceDuration-spec.maxCut),pass=actual-added+1/fps>=min&&durationCut<=spec.maxCut+1/fps&&out.streams.some(s=>s.codec_type==='video');
 const geometry='No geometry synthesis. Preserve aspect with padding; digital_zoom explicitly crops 3%.'+(tr.joins&&tr.kind!=='cut'?` Transition ${tr.id} only blends, blurs or slides the existing frames at each join.`:'');
 const report={pass,sourceDuration,finalDuration:actual,addedDuration:added,maxCut:spec.maxCut,minDuration:min,actualCut:durationCut,addedSfx:false,audio:spec.audio,backend:spec.backend,styleId:spec.styleId,transition:{id:tr.id,kind:tr.kind,seconds:tr.seconds,joins:tr.joins,plannedCut:tr.cut},dimensions:[w,h],fps,inputEvidence:ledger,geometry,grade:spec.styleId==='domus-warm'?'proposed mild warm recipe; not recovered reference LUT':'no color grade',visualReview:'required',at:new Date().toISOString()};
 fs.writeFileSync(path.join(dir,'qc.json'),JSON.stringify(report,null,2));if(!pass)throw Error('duration QC failed');
 // Read-only analysis from the already pinned Video Ad Editor, no plugin installation or model download.
 const scopes=path.join(root,'tools/video-ad-editor/video-ad-editor/scripts/25_scopes.py');if(!fs.existsSync(scopes))throw Error('Restore the pinned tools/video-ad-editor submodule before running.');
 await run(process.env.DOMUS_PYTHON||'python3',[scopes,final,'--n','3','--json',path.join(dir,'scopes.json')],{signal});report.scopes=JSON.parse(fs.readFileSync(path.join(dir,'scopes.json')));fs.writeFileSync(path.join(dir,'qc.json'),JSON.stringify(report,null,2));return {file:final,report};
}
// Paper-coloured end card with the original Arabic DOMUS logo fading in. Silent, fixed length.
async function logoCard(dir,{w,h,fps,signal}){
 const file=path.join(dir,'outro.mp4'),logoWidth=Math.floor(Math.min(816,w*.46)/2)*2;
 await ffmpeg(['-f','lavfi','-i',`color=c=0xF1E6D3:s=${w}x${h}:r=${fps}:d=${OUTRO_SECONDS}`,'-loop','1','-framerate',String(fps),'-t',String(OUTRO_SECONDS),'-i',path.join(root,'brand/logos/domus-ar.png'),'-f','lavfi','-t',String(OUTRO_SECONDS),'-i','anullsrc=r=48000:cl=stereo',
 '-filter_complex',`[1:v]scale=${logoWidth}:-2:flags=lanczos,format=rgba,fade=t=in:st=0.25:d=0.6:alpha=1[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2:format=auto,setsar=1,format=yuv420p[v]`,'-map','[v]','-map','2:a:0','-t',String(OUTRO_SECONDS),...encode(18),file],{signal});return file;
}
async function remotion(spec,base,dir,{w,h,fps,totalFrames,signal}){
 const project=path.join(root,'animation-studio'),publicDir=path.join(dir,'remotion-public');fs.mkdirSync(path.join(publicDir,'brand'),{recursive:true});fs.copyFileSync(base,path.join(publicDir,'base.mp4'));fs.copyFileSync(path.join(root,'brand/fonts/arabic/Cairo/Cairo-VariableFont_slnt,wght.ttf'),path.join(publicDir,'brand/cairo.ttf'));
 const props={src:'base.mp4',title:spec.title,lines:spec.lines,styleId:spec.styleId,width:w,height:h,frames:totalFrames,fps};const p=path.join(dir,'remotion-props.json');fs.writeFileSync(p,JSON.stringify(props));const out=path.join(dir,'remotion.mp4');
 await run(process.execPath,[path.join(project,'node_modules/@remotion/cli/remotion-cli.js'),'render','src/AutoEdit.tsx','DomusAutoEdit',out,'--props='+p,'--public-dir='+publicDir,'--browser-executable='+(process.env.DOMUS_CHROMIUM||'/usr/bin/chromium'),'--concurrency=1','--codec=h264','--muted','--log=error'],{cwd:project,signal});return out;
}
async function hyperframes(spec,base,dir,{w,h,fps,totalFrames,signal}){
 const hf=path.join(dir,'hyperframes');fs.mkdirSync(hf,{recursive:true});fs.copyFileSync(base,path.join(hf,'base.mp4'));fs.copyFileSync(path.join(root,'brand/fonts/arabic/Cairo/Cairo-VariableFont_slnt,wght.ttf'),path.join(hf,'cairo.ttf'));
 const gsap=path.join(root,'animation-studio/node_modules/gsap/dist/gsap.min.js');const fallback=path.join(root,'render-worker/node_modules/gsap/dist/gsap.min.js');fs.copyFileSync(fs.existsSync(gsap)?gsap:fallback,path.join(hf,'gsap.min.js'));
 fs.writeFileSync(path.join(hf,'DESIGN.md'),'DOMUS explicit identity: black #151412, beige #F1E6D3, bronze #A86F3F. Cairo. Preserve the property. No generated architecture, no added SFX.');
 const {hyperframesHTML}=await import('./hyperframes-html.mjs');fs.writeFileSync(path.join(hf,'index.html'),hyperframesHTML(spec,{w,h,fps,totalFrames}));const out=path.join(dir,'hyperframes.mp4'),cli=path.join(root,'render-worker/node_modules/hyperframes/bin/hyperframes.mjs');
 process.env.HYPERFRAMES_BROWSER_PATH||=process.env.DOMUS_CHROMIUM||'/usr/bin/chromium';
 await run(process.execPath,[cli,'lint',hf],{cwd:hf,signal});await run(process.execPath,[cli,'validate',hf],{cwd:hf,signal});await run(process.execPath,[cli,'inspect',hf],{cwd:hf,signal});await run(process.execPath,[cli,'render','--output',out,'--fps','30','--quality','standard','--workers','1'],{cwd:hf,signal});return out;
}
