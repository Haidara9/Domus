import {teamRequest,forbidden} from '../../access';
import sheets from '../../reference-sheets.json';
export async function GET(req:Request){if(!teamRequest(req))return forbidden();const id=new URL(req.url).searchParams.get('id')||'';const s=Object.hasOwn(sheets,id)?(sheets as Record<string,string>)[id]:undefined;if(!s)return new Response('Not found',{status:404});return new Response(Uint8Array.from(atob(s),c=>c.charCodeAt(0)),{headers:{'Content-Type':'image/webp','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
