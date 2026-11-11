import {teamRequest,forbidden} from '../../access';
import {validateSpec} from '../../rendering/spec';
import {db,bucket,json,safe,UUID} from '../../rendering/server';
export async function GET(req:Request){
 if(!teamRequest(req))return forbidden();
 const url=new URL(req.url),id=url.searchParams.get('id');
 if(id&&url.searchParams.has('download')){const r=await db().prepare('SELECT data,status FROM render_jobs WHERE id=?').bind(id).first<any>();if(!r||r.status!=='needs_review')return json({error:'النتيجة ليست جاهزة'},404);const d=JSON.parse(r.data),key=d.resultKey;if(!key)return json({error:'لا توجد نتيجة'},404);const o=await bucket().get(key);return o?new Response(o.body,{headers:{'Content-Type':'video/mp4','Cache-Control':'private, no-store','Content-Disposition':'attachment; filename="DOMUS-review.mp4"'}}):json({error:'الملف غير موجود'},404);}
 try{await db().prepare("UPDATE render_jobs SET status='interrupted',lease=NULL,updated_at=? WHERE status IN ('preparing','rendering','checking') AND updated_at<?").bind(new Date().toISOString(),new Date(Date.now()-120000).toISOString()).run();const [jobs,workers]=await Promise.all([db().prepare('SELECT id,status,data,created_at,updated_at FROM render_jobs ORDER BY created_at DESC LIMIT 40').all(),db().prepare('SELECT id,data,updated_at FROM render_workers ORDER BY updated_at DESC LIMIT 5').all()]);return json({jobs:jobs.results.map((r:any)=>({...JSON.parse(r.data),id:r.id,status:r.status,createdAt:r.created_at,updatedAt:r.updated_at})),workers:workers.results.map((r:any)=>({...JSON.parse(r.data),id:r.id,online:Date.now()-Date.parse(r.updated_at)<90000,at:r.updated_at}))});}catch{return json({error:'تعذر قراءة قائمة الرندر'},503);}
}
export async function POST(req:Request){
 if(!teamRequest(req))return forbidden();if(!safe(req))return json({error:'طلب غير مسموح'},403);
 try{const body:any=await req.json();if(body.action==='cancel'){const r=await db().prepare("UPDATE render_jobs SET status='cancelled',lease=NULL,updated_at=? WHERE id=? AND status IN ('queued','preparing','rendering','checking')").bind(new Date().toISOString(),body.id).run();return json({ok:!!r.meta.changes});}
 const spec=validateSpec(body.spec);if(!UUID.test(body.requestId))return json({error:'معرّف طلب غير صالح'},400);
 for(const f of spec.files){const o=await bucket().head(f.key);if(!o||!o.httpMetadata?.contentType?.startsWith('video/'))return json({error:'أكمل رفع جميع ملفات الخام قبل البدء.'},400);}
 const old=await db().prepare('SELECT id,data FROM render_jobs WHERE request_id=?').bind(body.requestId).first<any>();if(old){if(JSON.stringify(JSON.parse(old.data).spec)!==JSON.stringify(spec))return json({error:'الطلب المحفوظ مختلف؛ حدّث الصفحة.'},409);return json({id:old.id});}
 const pending=await db().prepare("SELECT COUNT(*) as n FROM render_jobs WHERE status IN ('queued','preparing','rendering','checking')").first<any>();if(pending.n>=10)return json({error:'القائمة ممتلئة؛ انتظر انتهاء المهام.'},429);
 const id=crypto.randomUUID(),now=new Date().toISOString();await db().prepare("INSERT INTO render_jobs(id,request_id,status,data,created_at,updated_at) VALUES(?,?,'queued',?,?,?) ON CONFLICT(request_id) DO NOTHING").bind(id,body.requestId,JSON.stringify({spec,events:[{at:now,stage:'queued'}]}),now,now).run();const row=await db().prepare('SELECT id FROM render_jobs WHERE request_id=?').bind(body.requestId).first<any>();return json({id:row.id});
 }catch(e:any){return json({error:e.message||'تعذر بدء الطلب'},400);}
}
