import {env} from 'cloudflare:workers';
export const json=(d:unknown,s=200)=>Response.json(d,{status:s,headers:{'Cache-Control':'no-store'}});
export const safe=(r:Request)=>r.headers.get('sec-fetch-site')!=='cross-site'&&(!r.headers.get('origin')||r.headers.get('origin')===new URL(r.url).origin);
export const db=()=>env.DB!;
export const bucket=()=>env.BUCKET!;
// Dedicated bearer grants queue access only. It is never accepted by teamRequest or client routes.
export function agentAccess(r:Request){const token=env.DOMUS_RENDER_TOKEN;return !!token&&token.length>=32&&r.headers.get('x-domus-render-token')===token;}
export const UUID=/^[a-f0-9-]{36}$/;
