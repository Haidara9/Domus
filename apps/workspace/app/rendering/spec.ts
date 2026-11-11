import catalog from './catalog.json';
export {catalog};
export function validateSpec(s:any){
 const ids=typeof s?.mention==='string'?[...s.mention.matchAll(/@([a-z0-9_-]+)/gi)].map(x=>x[1].toLowerCase()):[];
 const style=catalog.find(x=>x.id===ids[0]);
 if(ids.length!==1||!style)throw Error('اختر منشن ستايل واحد من المكتبة.');
 if(!style.ready)throw Error('هذا الستايل مرجع يحتاج تنفيذًا.');
 if(!Array.isArray(s.files)||s.files.length<1||s.files.length>12||s.files.some((f:any)=>typeof f.key!=='string'||!/^raw\/[a-f0-9-]{36}$/.test(f.key))||new Set(s.files.map((f:any)=>f.key)).size!==s.files.length)throw Error('أضف ملفات خام صحيحة دون تكرار.');
 if(!['9:16','4:5','1:1','16:9'].includes(s.format)||!['preserve','mute'].includes(s.audio))throw Error('اختر المقاس والصوت.');
 if(typeof s.maxCut!=='number'||!Number.isFinite(s.maxCut)||s.maxCut<0||s.maxCut>120||s.minDuration!==null&&(!Number.isFinite(s.minDuration)||s.minDuration<0))throw Error('أدخل حدود المدة.');
 if(typeof s.title!=='string'||s.title.length>80||typeof s.lines!=='string'||s.lines.length>240)throw Error('اختصر النص.');
 if(['remotion','hyperframes'].includes(style.backend)&&style.id!=='frame_break'&&!s.title.trim())throw Error('أدخل النص الحقيقي للعنوان.');
 if(s.lines.split('\n').length>4)throw Error('استخدم أربعة سطور نصية كحد أقصى.');
 return {mention:'@'+style.id,styleId:style.id,backend:style.backend,files:s.files.map((f:any)=>({key:f.key,name:String(f.name||'raw').slice(0,200)})),format:s.format,audio:s.audio,noSfx:true,maxCut:s.maxCut,minDuration:s.minDuration,title:s.title,lines:s.lines};
}
