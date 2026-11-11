import {agentAccess,db,bucket,json,UUID} from '../../rendering/server';
export async function GET(req:Request){
 if(!agentAccess(req))return json({error:'unauthorized'},403);
 const u=new URL(req.url),id=u.searchParams.get('id')||'',lease=u.searchParams.get('lease')||'';
 const row=await db().prepare("SELECT data,status FROM render_jobs WHERE id=? AND lease=? AND status IN ('preparing','rendering','checking')").bind(id,lease).first<any>();if(!row)return json({error:'lease expired'},409);
 const d=JSON.parse(row.data),key=u.searchParams.get('key');if(!d.spec.files.some((f:any)=>f.key===key))return json({error:'file denied'},403);const o=await bucket().get(key!);return o?new Response(o.body,{headers:{'Content-Type':o.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'no-store'}}):json({error:'file missing'},404);
}
export async function POST(req:Request){
 if(!agentAccess(req))return json({error:'unauthorized'},403);
 try{const b:any=await req.json(),now=new Date().toISOString();
 if(b.action==='heartbeat'){
 if(!UUID.test(b.workerId)||!Array.isArray(b.backends))return json({error:'bad worker'},400);
 await db().prepare('INSERT INTO render_workers(id,data,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at').bind(b.workerId,JSON.stringify({name:'DOMUS renderer',backends:b.backends.filter((x:any)=>['ffmpeg','remotion','hyperframes'].includes(x))}),now).run();
 if(b.id&&b.lease){const r=await db().prepare("UPDATE render_jobs SET updated_at=? WHERE id=? AND lease=? AND status IN ('preparing','rendering','checking')").bind(now,b.id,b.lease).run();return json({ok:!!r.meta.changes});}return json({ok:true});}
 if(b.action==='claim'){
 const worker=await db().prepare('SELECT data,updated_at FROM render_workers WHERE id=?').bind(b.workerId).first<any>();if(!worker||Date.now()-Date.parse(worker.updated_at)>90000)return json({error:'heartbeat required'},409);
 const backends=JSON.parse(worker.data).backends;if(!backends.length)return json({job:null});const lease=crypto.randomUUID();
 const row=await db().prepare(`UPDATE render_jobs SET status='preparing',lease=?,worker_id=?,updated_at=? WHERE id=(SELECT id FROM render_jobs WHERE status='queued' AND json_extract(data,'$.spec.backend') IN (${backends.map(()=>'?').join(',')}) ORDER BY created_at LIMIT 1) AND status='queued' RETURNING id,data`).bind(lease,b.workerId,now,...backends).first<any>();return json({job:row?{id:row.id,lease,...JSON.parse(row.data)}:null});}
 if(!UUID.test(b.id)||!UUID.test(b.lease))return json({error:'bad lease'},400);
 const row=await db().prepare("SELECT data,status FROM render_jobs WHERE id=? AND lease=? AND status IN ('preparing','rendering','checking')").bind(b.id,b.lease).first<any>();if(!row)return json({error:'lease expired'},409);const d=JSON.parse(row.data);
 if(b.action==='upload_begin'){
 if(row.status!=='checking'||!Number.isInteger(b.size)||b.size<=0||b.size>1024**3)return json({error:'bad output'},400);
 const key='renders/'+b.id+'/'+crypto.randomUUID()+'.mp4';const up=await bucket().createMultipartUpload(key,{httpMetadata:{contentType:'video/mp4'}});d.outputUpload={key,uploadId:up.uploadId,size:b.size};const r=await db().prepare('UPDATE render_jobs SET data=?,updated_at=? WHERE id=? AND lease=?').bind(JSON.stringify(d),now,b.id,b.lease).run();if(!r.meta.changes){await up.abort();return json({error:'lease expired'},409);}return json({chunkSize:8*1024**2});}
 if(b.action==='complete'){
 if(row.status!=='checking'||!d.outputUpload||!Array.isArray(b.parts)||b.parts.length!==Math.ceil(d.outputUpload.size/(8*1024**2))||b.parts.some((p:any,i:number)=>p.partNumber!==i+1||typeof p.etag!=='string')||b.report?.pass!==true)return json({error:'incomplete output'},400);
 const output=await bucket().resumeMultipartUpload(d.outputUpload.key,d.outputUpload.uploadId).complete(b.parts);if(output.size!==d.outputUpload.size){await bucket().delete(output.key);return json({error:'output size mismatch'},400);}
 d.resultKey=output.key;d.report=b.report;delete d.outputUpload;d.events=[...(d.events||[]),{at:now,stage:'needs_review'}];const r=await db().prepare("UPDATE render_jobs SET status='needs_review',data=?,lease=NULL,updated_at=? WHERE id=? AND lease=? AND status='checking'").bind(JSON.stringify(d),now,b.id,b.lease).run();if(!r.meta.changes){await bucket().delete(output.key);return json({error:'lease expired'},409);}return json({ok:true});}
 const allowed:any={preparing:['rendering','failed'],rendering:['checking','failed'],checking:['failed']};if(!allowed[row.status]?.includes(b.stage))return json({error:'invalid transition'},409);
 d.events=[...(d.events||[]),{at:now,stage:b.stage}].slice(-30);if(b.stage==='failed')d.error=String(b.error||'تعذر الرندر').slice(0,500);
 const r=await db().prepare('UPDATE render_jobs SET status=?,data=?,updated_at=?,lease=CASE WHEN ?=\'failed\' THEN NULL ELSE lease END WHERE id=? AND lease=? AND status=?').bind(b.stage,JSON.stringify(d),now,b.stage,b.id,b.lease,row.status).run();return r.meta.changes?json({ok:true}):json({error:'lease expired'},409);
 }catch{return json({error:'render service error'},503);}
}
export async function PUT(req:Request){
 if(!agentAccess(req))return json({error:'unauthorized'},403);const u=new URL(req.url),part=Number(u.searchParams.get('part')),id=u.searchParams.get('id'),lease=u.searchParams.get('lease');
 const row=await db().prepare("SELECT data FROM render_jobs WHERE id=? AND lease=? AND status='checking'").bind(id,lease).first<any>();if(!row)return json({error:'lease expired'},409);const d=JSON.parse(row.data),up=d.outputUpload;if(!up||!Number.isInteger(part)||part<1||part>128)return json({error:'invalid part'},400);const bytes=await req.arrayBuffer(),count=Math.ceil(up.size/(8*1024**2)),expected=part<count?8*1024**2:up.size-(part-1)*8*1024**2;if(bytes.byteLength!==expected)return json({error:'invalid part size'},400);
 try{return json(await bucket().resumeMultipartUpload(up.key,up.uploadId).uploadPart(part,bytes));}catch{return json({error:'part failed'},503);}
}
