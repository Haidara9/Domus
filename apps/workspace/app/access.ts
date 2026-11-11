import { env } from 'cloudflare:workers';
export function teamEmail(email:string|null|undefined){return !!email&&String(env.DOMUS_TEAM_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());}
export function localPreview(){return env.DOMUS_LOCAL_PREVIEW==='1';}
export function teamRequest(req:Request){if(localPreview())return true;const email=req.headers.get('oai-authenticated-user-email');if(req.headers.get('oai-authenticated-user-id')&&teamEmail(email))return true;const secret=env.DOMUS_SERVICE_TOKEN;return !!secret&&req.headers.get('x-domus-service-token')===secret;}
export const forbidden=()=>Response.json({error:'هذا القسم خاص بفريق دوموس. استخدم رابط العرض المخصص لك.'},{status:403,headers:{'Cache-Control':'no-store'}});
export const noCache={'Cache-Control':'no-store'};
