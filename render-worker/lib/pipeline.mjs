import fs from 'node:fs';
const fileHash=async(p)=>{const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(p))h.update(chunk);return h.digest('hex');};import path from 'node:path';import crypto from 'node:crypto';
import {run,ffmpeg,probe} from './process.mjs';import {validateSpec} from './catalog.mjs';
const root=path.resolve(import.meta.dirname,'../..');
const formats={'9:16':[1080,1920],'4:5':[1080,1350],'1:1':[1080,1080],'16:9':[1920,1080]};
export async function executeJob(spec,inputs,dir,{signal,progress=async()=>{},testSize}={}){
 spec=validateSpec(spec);if(inputs.length!==spec.files.length)throw Error('missing raw input');fs.mkdirSync(dir,{recursive:true});const [w,h]=testSize||formats[spec.format],fps=30;
 const probes=await Promise.all(inputs.map(f=>probe(f,{signal})));let sourceDuration=0;const pieces=[],ledger=[];
 for(let i=0;i<inputs.length;i++){
 const m=probes[i],v=m.streams.find(s=>s.codec_type==='video');if(!v||!Number.isFinite(Number(m.format.duration))||Number(m.format.duration)<=0)throw Error('invalid video');
 if(['smpte2084','arib-std-b67'].includes(v.color_transfer))throw Error('HDR source requires an approved color transform before this preset.');
 const seconds=Number(m.format.duration);if(seconds>1800||sourceDuration+seconds>1800)throw Error('maximum production duration is 30 minutes');sourceDuration+=seconds;const frames=Math.ceil(seconds*fps),dur=frames/fps;ledger.push({name:spec.files[i].name,duration:seconds,frames,sha256:await fileHash(inputs[i])});
 const file=path.join(dir,`segment-${i}.mp4`);let vf=`scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=0x151412,setsar=1,fps=${fps}`;
 if(spec.styleId==='domus-warm')vf+=',eq=contrast=1.02:saturation=1.03:brightness=0.005,colorbalance=rs=0.012:bs=-0.008';
 if(spec.styleId==='digital_zoom')vf+=`,scale=${Math.ceil(w*1.03/2)*2}:${Math.ceil(h*1.03/2)*2},crop=${w}:${h}`;
 const hasAudio=spec.audio==='preserve'&&m.streams.some(s=>s.codec_type==='audio');const args=['-i',inputs[i]];if(!hasAudio)args.push('-f','lavfi','-i','anullsrc=r=48000:cl=stereo');
 args.push('-map','0:v:0','-map',hasAudio?'0:a:0':'1:a:0','-vf',vf+',tpad=stop_mode=clone:stop_duration=0.1','-af',`aresample=48000,apad,atrim=duration=${dur},asetpts=PTS-STARTPTS`,'-t',String(dur),'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ac','2',file);await ffmpeg(args,{signal});pieces.push(file);
 }
 // Full-length assembly. No editorial source selection, generative footage, speed ramp or added SFX.
 fs.writeFileSync(path.join(dir,'concat.txt'),pieces.map(f=>`file '${path.basename(f)}'`).join('\n'));
 const base=path.join(dir,'base.mp4');await ffmpeg(['-f','concat','-safe','1','-i',path.join(dir,'concat.txt'),'-c','copy',base],{signal});
 const before=await probe(base,{signal}),frames=before.streams.find(s=>s.codec_type==='video').nb_frames,totalFrames=Number(frames)||Math.round(Number(before.format.duration)*fps);
 await progress('rendering');let visual=base;
 if(spec.backend==='remotion')visual=await remotion(spec,base,dir,{w,h,fps,totalFrames,signal});
 if(spec.backend==='hyperframes')visual=await hyperframes(spec,base,dir,{w,h,fps,totalFrames,signal});
 const final=path.join(dir,'review.mp4');
 if(visual===base)fs.copyFileSync(base,final);else await ffmpeg(['-i',visual,'-i',base,'-map','0:v:0','-map','1:a:0','-c','copy','-t',String(totalFrames/fps),'-movflags','+faststart',final],{signal});
 await progress('checking');await ffmpeg(['-i',final,'-f','null','-'],{signal});const out=await probe(final,{signal}),actual=Number(out.format.duration),durationCut=Math.max(0,sourceDuration-actual);
 const min=Math.max(spec.minDuration||0,sourceDuration-spec.maxCut),pass=actual+1/fps>=min&&durationCut<=spec.maxCut+1/fps&&out.streams.some(s=>s.codec_type==='video');
 const report={pass,sourceDuration,finalDuration:actual,maxCut:spec.maxCut,minDuration:min,actualCut:durationCut,addedSfx:false,audio:spec.audio,backend:spec.backend,styleId:spec.styleId,dimensions:[w,h],fps,inputEvidence:ledger,geometry:'No geometry synthesis. Preserve aspect with padding; digital_zoom explicitly crops 3%.',grade:spec.styleId==='domus-warm'?'proposed mild warm recipe; not recovered reference LUT':'no color grade',visualReview:'required',at:new Date().toISOString()};
 fs.writeFileSync(path.join(dir,'qc.json'),JSON.stringify(report,null,2));if(!pass)throw Error('duration QC failed');
 // Read-only analysis from the already pinned Video Ad Editor, no plugin installation or model download.
 const scopes=path.join(root,'tools/video-ad-editor/video-ad-editor/scripts/25_scopes.py');if(!fs.existsSync(scopes))throw Error('Restore the pinned tools/video-ad-editor submodule before running.');
 await run(process.env.DOMUS_PYTHON||'python3',[scopes,final,'--n','3','--json',path.join(dir,'scopes.json')],{signal});report.scopes=JSON.parse(fs.readFileSync(path.join(dir,'scopes.json')));fs.writeFileSync(path.join(dir,'qc.json'),JSON.stringify(report,null,2));return {file:final,report};
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
