import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const original=JSON.parse(fs.readFileSync(path.join(root,'animation-studio/catalog/styles.json')));
const executable=[
 {id:'domus-clean',name:'دوموس · قصّ نظيف',backend:'ffmpeg',look:'وصل الخام بالترتيب، الحفاظ على الكادر والصوت، بلا تقصير.'},
 {id:'domus-warm',name:'دوموس · دفء هادئ',backend:'ffmpeg',look:'تعديل لوني خفيف مقترح، بلا إعادة بناء المكان.'},
 {id:'swiss-grid',name:'Swiss Grid · DOMUS',backend:'remotion',look:'عنوان من المالك مع شبكة برونزية صغيرة فوق الخام؛ تكييف أصلي لدوموس.'},
 {id:'magazine-layout-and-note',name:'Editorial · DOMUS',backend:'remotion',look:'شريط عنوان تحريري فوق الفيديو الحقيقي.'},
 {id:'checklist',name:'Checklist · DOMUS',backend:'hyperframes',look:'قائمة معلومات يكتبها المالك، بلا قيم تجريبية.'},
 {id:'digital_zoom',name:'Digital Zoom · DOMUS',backend:'ffmpeg',look:'تكبير رقمي محدود 3%، ليس حركة كاميرا أو عدسة جديدة.'},
 {id:'frame_break',name:'Frame · DOMUS',backend:'hyperframes',look:'إطار بيج متحرك حول الخام؛ لا فصل شخص أو تغيير خلفية.'},
 {id:'headline-highlight',name:'عنوان وإضاءة خط · DOMUS',backend:'hyperframes',look:'عنوان عربي كامل مع خط برونزي متحرك.'}
].map(x=>({...x,ready:true,source:'DOMUS adaptation'}));
const extra16=['orbit','couch_wall','ui_world','frame_break','digital_zoom','phone_mockup','checklist','headline_wall','zoom_through_cut','chart_grow','pull_back_reveal','green_screen','paper_cut','doodle_boil','cover_story','glass_type'];
const brody=['over-the-shoulder','glass-graph','freeze-frame','tier-list','text-behind','color-grade'];
export const catalog=[...executable,...original.styles.filter(s=>!executable.some(e=>e.id===s.id)).map(s=>({id:s.id,name:s.name,backend:'remotion',ready:false,source:'Shaan Johari · indexed guide',look:s.look,requires:s.medium==='3d'?'بناء مشهد ثلاثي الأبعاد وأصول ومراجعة':'بناء مشهد والتحقق منه',originalComposition:s.composition})),...extra16.filter(id=>!executable.some(e=>e.id===id)).map(id=>({id,name:id,backend:'motion-pack',ready:false,source:'ملف 16 حركة المرفق',look:'مرجع حركة للمقدّم، يحتاج أصولًا وقناع شخص ومراجعة؛ لا يطبّق على هندسة العقار.'})),...brody.map(id=>({id:'brody-'+id,name:id,backend:'remotion',ready:false,source:'Brody · prompt pack',look:'مرجع يحتاج تنفيذًا وقيمًا موثقة وقناعًا أو تتبعًا عند الحاجة.'})),{id:'keyboard-copy-loop',name:'Keyboard Copy Loop',backend:'3d',ready:false,source:'Claude motion prompt pack',look:'مرجع تحريك مجسم/شخصية مستقل؛ الأصول الأصلية غير مرفقة.'}];
export function resolveMention(text){
 const ids=[...text.matchAll(/@([a-z0-9_-]+)/gi)].map(x=>x[1].toLowerCase());
 if(ids.length!==1)throw Error('اختر منشن ستايل واحد من القائمة.');
 const style=catalog.find(x=>x.id===ids[0]);
 if(!style)throw Error('المنشن غير موجود في مكتبة دوموس.');
 if(!style.ready)throw Error('هذا الستايل مرجع يحتاج تنفيذًا قبل تشغيله تلقائيًا.');
 return style;
}
export function validateSpec(s){
 if(!s||typeof s.mention!=='string')throw Error('اختر الستايل.');
 const style=resolveMention(s.mention);
 if(!Array.isArray(s.files)||!s.files.length||s.files.length>12)throw Error('أضف بين 1 و12 فيديو خامًا.');
 if(s.files.some(f=>typeof f.key!=='string'||!/^raw\/[a-f0-9-]{36}$/.test(f.key)))throw Error('ملف خام غير صالح.');
 if(new Set(s.files.map(f=>f.key)).size!==s.files.length)throw Error('الملف مكرر.');
 if(!['9:16','4:5','1:1','16:9'].includes(s.format))throw Error('اختر مقاس الفيديو.');
 if(!['preserve','mute'].includes(s.audio))throw Error('اختر حفظ الصوت الأصلي أو كتمه.');
 if(typeof s.maxCut!=='number'||!Number.isFinite(s.maxCut)||s.maxCut<0||s.maxCut>120)throw Error('أدخل حد التقصير المسموح.');
 if(s.minDuration!==null&&(!Number.isFinite(s.minDuration)||s.minDuration<0))throw Error('المدة الدنيا غير صالحة.');
 if(typeof s.title!=='string'||s.title.length>80||typeof s.lines!=='string'||s.lines.length>240)throw Error('اختصر النص.');
 if(['remotion','hyperframes'].includes(style.backend)&&!s.title.trim()&&style.id!=='frame_break')throw Error('أدخل النص الحقيقي للعنوان.');
 if(s.lines.split('\n').length>4)throw Error('استخدم أربعة سطور نصية كحد أقصى.');
 return {mention:'@'+style.id,styleId:style.id,backend:style.backend,files:s.files.map(f=>({key:f.key,name:String(f.name||'raw').slice(0,200)})),format:s.format,audio:s.audio,noSfx:true,maxCut:s.maxCut,minDuration:s.minDuration,title:s.title,lines:s.lines};
}
