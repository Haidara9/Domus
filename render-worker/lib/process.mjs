import {spawn} from 'node:child_process';
export function run(cmd,args,{cwd,signal,timeout=600000}={}){return new Promise((resolve,reject)=>{
 const p=spawn(cmd,args,{cwd,stdio:['ignore','pipe','pipe'],detached:process.platform!=='win32',env:{...process.env,PYTHONIOENCODING:"utf-8",PYTHONUTF8:"1"}});let out='',err='';const kill=()=>{try{process.platform==='win32'?p.kill('SIGTERM'):process.kill(-p.pid,'SIGTERM');}catch{}};const t=setTimeout(kill,timeout);signal?.addEventListener('abort',kill,{once:true});
 p.stdout.on('data',x=>out=(out+x).slice(-300000));p.stderr.on('data',x=>err=(err+x).slice(-5000));p.on('error',done);p.on('close',code=>done(code?Error(cmd+' failed: '+err):null));function done(e){clearTimeout(t);signal?.removeEventListener('abort',kill);if(signal?.aborted)e=Error('cancelled');e?reject(e):resolve(out);}
});}
export const ffmpeg=(args,opts)=>run(process.env.DOMUS_FFMPEG||'ffmpeg',['-nostdin','-hide_banner','-y','-loglevel','error','-threads','2',...args],opts);
export async function probe(p,opts){return JSON.parse(await run(process.env.DOMUS_FFPROBE||'ffprobe',['-v','error','-show_streams','-show_format','-of','json',p],opts));}
