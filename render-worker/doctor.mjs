import fs from 'node:fs';import path from 'node:path';import {run} from './lib/process.mjs';
const root=path.resolve(import.meta.dirname,'..');
export async function capabilities(){const checks={};
 for(const [key,cmd,args] of [['ffmpeg',process.env.DOMUS_FFMPEG||'ffmpeg',['-version']],['ffprobe',process.env.DOMUS_FFPROBE||'ffprobe',['-version']],['chromium',process.env.DOMUS_CHROMIUM||'/usr/bin/chromium',['--version']],['numpy',process.env.DOMUS_PYTHON||'python3',['-c','import numpy']]]){try{await run(cmd,args,{timeout:10000});checks[key]=true;}catch{checks[key]=false;}}
 checks.videoAdEditor=fs.existsSync(path.join(root,'tools/video-ad-editor/video-ad-editor/scripts/25_scopes.py'));
 checks.remotion=fs.existsSync(path.join(root,'animation-studio/node_modules/@remotion/cli/remotion-cli.js'));
 checks.hyperframes=fs.existsSync(path.join(root,'render-worker/node_modules/hyperframes/bin/hyperframes.mjs'));
 const core=checks.ffmpeg&&checks.ffprobe&&checks.numpy&&checks.videoAdEditor;return {checks,backends:core?['ffmpeg',...(checks.chromium&&checks.remotion?['remotion']:[]),...(checks.chromium&&checks.hyperframes?['hyperframes']:[])]:[]};}
if(process.argv[1]===import.meta.filename)console.log(JSON.stringify(await capabilities(),null,2));
