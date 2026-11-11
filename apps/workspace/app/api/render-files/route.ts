import {teamRequest,forbidden} from '../../access';import {db,bucket,json,safe,UUID} from '../../rendering/server';
export async function POST(req:Request){
 if(!teamRequest(req))return forbidden();if(!safe(req))return json({error:'طلب غير مسموح'},403);
 try{const b:any=await req.json();
 if(b.action==='begin'){
 if(!Number.isInteger(b.size)||b.size<=0||b.size>1024**3||!/^video\/(mp4|quicktime|webm|x-matroska|x-msvideo|x-m4v)$/.test(b.type))return json({error:'ارفع فيديو حتى 1 GB.'},400);
 const id=crypto.randomUUID(),key='raw/'+id,name=String(b.name||'raw').slice(0,200);const u=await bucket().createMultipartUpload(key,{httpMetadata:{contentType:b.type},customMetadata:{name}});await db().prepare('INSERT INTO render_uploads VALUES (?,?,?,?,?,?,?)').bind(id,key,u.uploadId,name,b.type,b.size,new Date().toISOString()).run();return json({id,chunkSize:8*1024**2});}
 if(!UUID.test(b.id))return json({error:'رفع غير صالح'},400);const row=await db().prepare('SELECT * FROM render_uploads WHERE id=?').bind(b.id).first<any>();if(!row)return json({error:'جلسة الرفع غير موجودة'},404);const upload=bucket().resumeMultipartUpload(row.key,row.upload_id);
 if(b.action==='abort'){await upload.abort();await db().prepare('DELETE FROM render_uploads WHERE id=?').bind(b.id).run();return json({ok:true});}
 if(b.action!=='complete'||!Array.isArray(b.parts)||b.parts.length!==Math.ceil(row.size/(8*1024**2))||b.parts.some((p:any,i:number)=>p.partNumber!==i+1||typeof p.etag!=='string'))return json({error:'الرفع ناقص'},400);
 const obj=await upload.complete(b.parts);if(obj.size!==row.size){await bucket().delete(row.key);await db().prepare('DELETE FROM render_uploads WHERE id=?').bind(b.id).run();return json({error:'حجم الملف لا يطابق الرفع'},400);}await db().prepare('DELETE FROM render_uploads WHERE id=?').bind(b.id).run();return json({file:{key:row.key,name:row.name,type:row.mime,size:row.size}});
 }catch{return json({error:'تعذر إكمال رفع الفيديو؛ أعد الرفع يدويًا.'},503);}
}
export async function PUT(req:Request){
 if(!teamRequest(req))return forbidden();if(!safe(req))return json({error:'طلب غير مسموح'},403);
 const u=new URL(req.url),id=u.searchParams.get('id')||'',part=Number(u.searchParams.get('part'));if(!UUID.test(id)||!Number.isInteger(part)||part<1||part>128)return json({error:'جزء غير صالح'},400);
 const row=await db().prepare('SELECT * FROM render_uploads WHERE id=?').bind(id).first<any>();if(!row)return json({error:'جلسة الرفع غير موجودة'},404);const bytes=await req.arrayBuffer(),expected=part<Math.ceil(row.size/(8*1024**2))?8*1024**2:row.size-(part-1)*8*1024**2;if(bytes.byteLength!==expected)return json({error:'حجم الجزء غير صالح'},400);
 try{const p=await bucket().resumeMultipartUpload(row.key,row.upload_id).uploadPart(part,bytes);return json(p);}catch{return json({error:'تعذر رفع الجزء'},503);}
}
