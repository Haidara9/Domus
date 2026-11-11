import { teamRequest,forbidden } from '../../access';
import { env } from 'cloudflare:workers';
export async function POST(req:Request){
 if(!teamRequest(req))return forbidden();
 if(req.headers.get('sec-fetch-site')==='cross-site')return Response.json({error:'طلب غير مسموح'},{status:403});
 try{const form=await req.formData();const file=form.get('file') as File;if(!file||typeof file.arrayBuffer!=='function')return Response.json({error:'اختر ملفًا'},{status:400});
 if(file.size>30*1024*1024)return Response.json({error:'حجم الملف الأقصى 30 ميغابايت. أضف رابطًا للملفات الأكبر.'},{status:400});
 const key=crypto.randomUUID();await env.BUCKET!.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:file.type||'application/octet-stream'},customMetadata:{name:file.name}});
 return Response.json({file:{key,name:file.name,type:file.type,size:file.size,url:'/api/files/'+key,at:new Date().toISOString()}});
 }catch{return Response.json({error:'تعذر رفع الملف'},{status:503});}
}
