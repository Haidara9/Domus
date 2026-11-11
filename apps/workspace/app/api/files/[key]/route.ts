import { teamRequest,forbidden } from '../../../access';
import { env } from 'cloudflare:workers';
export async function GET(req:Request,{params}:{params:Promise<{key:string}>}){
 if(!teamRequest(req))return forbidden();
 const {key}=await params;const file=await env.BUCKET!.get(key);if(!file)return new Response('الملف غير موجود',{status:404});
 const type=file.httpMetadata?.contentType||'application/octet-stream';const inline=/^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm)|audio\/)/.test(type);
 return new Response(file.body,{headers:{'Content-Type':type,'Content-Disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(file.customMetadata?.name||key)}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, max-age=3600'}});
}
