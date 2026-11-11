import { teamRequest,forbidden } from '../../access';
import { env } from 'cloudflare:workers';
import { qc, reviews, safeUrl } from '../../model';
export const dynamic = 'force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const kinds=['property','task','post','template','metric','source','adreport','inquiry'];
function safe(req:Request){return req.headers.get('sec-fetch-site')!=='cross-site' && (!req.headers.get('origin') || req.headers.get('origin')===new URL(req.url).origin);}
export async function GET(req:Request){
 if(!teamRequest(req))return forbidden();
 try {const result=await env.DB!.prepare('SELECT * FROM records ORDER BY updated_at DESC').all();return json({records:result.results.map((r:any)=>({...JSON.parse(r.data),id:r.id,kind:r.kind,revision:r.revision,updatedAt:r.updated_at}))});}
 catch {return json({error:'تعذر تحميل البيانات. حاول تحديث الصفحة.'},503);}
}
export async function POST(req:Request){
 if(!teamRequest(req))return forbidden();
 if(!safe(req))return json({error:'الطلب غير مسموح'},403);
 try {
 const {record}=await req.json() as any;
 if(!record || !kinds.includes(record.kind)|| typeof record.id!=='string' || !/^[a-zA-Z0-9-]{1,100}$/.test(record.id))return json({error:'بيانات غير صالحة'},400);
 if(!String(record.title||'').trim())return json({error:'يرجى إدخال عنوان'},400);
 if(JSON.stringify(record).length>350000)return json({error:'البيانات أكبر من الحد المسموح'},400);
 const old=await env.DB!.prepare('SELECT data, revision FROM records WHERE id=?').bind(record.id).first<any>();
 if(old&&JSON.parse(old.data).kind!==record.kind)return json({error:'لا يمكن تغيير نوع البطاقة'},400);
 if(record.kind==='adreport'){
 if(!record.campaign||!record.currency||!/^\d{4}-\d{2}-\d{2}$/.test(record.start||'')||!/^\d{4}-\d{2}-\d{2}$/.test(record.end||'')||record.end<record.start)return json({error:'أكمل الحملة والعملة وفترة التقرير'},400);
 for(const key of ['spend','impressions','linkClicks','results','reach'])if(record[key]!==''&&record[key]!=null&&(!Number.isFinite(Number(record[key]))||Number(record[key])<0))return json({error:'قيمة إعلانية غير صالحة'},400);
 if(record.results!==''&&record.results!=null&&!record.resultType)return json({error:'نوع النتيجة مطلوب'},400);
 const other=await env.DB!.prepare("SELECT id FROM records WHERE kind='adreport' AND id<>? AND json_extract(data,'$.campaign')=? AND json_extract(data,'$.currency')=? AND json_extract(data,'$.start')<=? AND json_extract(data,'$.end')>=? LIMIT 1").bind(record.id,record.campaign,record.currency,record.end,record.start).first();if(other)return json({error:'الفترة متداخلة مع تقرير محفوظ لهذه الحملة'},409);
 }
 if(record.kind==='metric'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(record.week||'')||!['Instagram','Facebook'].includes(record.platform))return json({error:'أكمل بداية الأسبوع والمنصة'},400);
 for(const k of ['reach','engagements','followers','posts'])if(record[k]!==''&&record[k]!=null&&(!Number.isInteger(Number(record[k]))||(k!=='followers'&&Number(record[k])<0)))return json({error:'أدخل أرقام أداء صحيحة'},400);
 }
 for(const k of ['area','sourceDuration','finalDuration','maxCut'])if(record[k]!==''&&record[k]!=null&&(!Number.isFinite(Number(record[k]))||Number(record[k])<0))return json({error:'المساحة والمدد يجب أن تكون أرقامًا موجبة أو صفرًا'},400);
 if(record.kind==='post'){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(record.date||''))return json({error:'أدخل تاريخ النشر ووقته'},400);
 if(['جاهز للجدولة','منشور'].includes(record.publishStatus)){
 if(!record.ig&&!record.fb)return json({error:'اختر منصة واحدة على الأقل'},400);
 if(record.propertyId){const linked=await env.DB!.prepare('SELECT data FROM records WHERE id=? AND kind=?').bind(record.propertyId,'property').first<any>();if(!linked)return json({error:'العقار المرتبط غير موجود'},400);const p=JSON.parse(linked.data);
 if(qc(p).length||reviews.some((_,i)=>!['pass','na'].includes(p.checks?.[i]))||!p.reviewedBy||!p.reviewDate||(!p.reviewNotes&&!p.reviewEvidence))return json({error:'أكمل المراجعة البصرية وأدلتها قبل اعتماد النشر'},400);
 if(record.contentType==='Reel'&&(!p.sourceDuration||p.maxCut===''||!p.finalDuration))return json({error:'أكمل مدد الفيديو في بطاقة العقار'},400);
 }
 if(record.publishStatus==='منشور'&&((record.ig&&!safeUrl(record.igUrl||''))||(record.fb&&!safeUrl(record.fbUrl||''))))return json({error:'أدخل روابط المنشورات الفعلية'},400);
 }
 }
 const now=new Date().toISOString();
 const history=old?JSON.parse(old.data).history||[]:[];
 const data={...record,createdAt:old?JSON.parse(old.data).createdAt:now,history:[{at:now,action:old?'تحديث البطاقة':'إنشاء البطاقة',note:String(record.changeNote||'')},...history].slice(0,300)};
 delete data.revision;delete data.changeNote;
 let result;
 if(old){
 if(record.revision!==old.revision)return json({error:'عُدلت البطاقة من جلسة أخرى. حدّث البيانات قبل الحفظ.'},409);
 result=await env.DB!.prepare('UPDATE records SET data=?, revision=revision+1, updated_at=? WHERE id=? AND revision=?').bind(JSON.stringify(data),now,record.id,record.revision).run();
 }else{result=await env.DB!.prepare('INSERT INTO records (id,kind,data,revision,updated_at) VALUES (?,?,?,1,?) ON CONFLICT(id) DO NOTHING').bind(record.id,record.kind,JSON.stringify(data),now).run();}
 if(!result.meta.changes)return json({error:'تعارض في الحفظ. حدّث البيانات.'},409);
 return json({record:{...data,revision:old?old.revision+1:1,updatedAt:now}});
 }catch{return json({error:'تعذر حفظ البطاقة. لم يتم تأكيد الحفظ.'},503);}
}
export async function DELETE(req:Request){
 if(!teamRequest(req))return forbidden();
 if(!safe(req))return json({error:'الطلب غير مسموح'},403);
 try{const {id,revision}=await req.json() as any;const r=await env.DB!.prepare('DELETE FROM records WHERE id=? AND revision=?').bind(id,revision).run();if(!r.meta.changes)return json({error:'تعذر الحذف؛ حدّث البيانات.'},409);return json({ok:true});}catch{return json({error:'تعذر الحذف'},503);}
}
