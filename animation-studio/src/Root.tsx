import {Composition,Img,interpolate,staticFile} from 'remotion';
import {Frame,Heading,C,bounded,useMotion,latinFont} from './Shared';
import {valueAtProgress,requireSource,localMediaPath} from './data';
type TitleProps={title:string;subtitle:string;demo:boolean};
type EditorialProps=TitleProps&{image:string;note:string};
type ChartProps={title:string;values:number[];unit:string;demo:boolean;source:string};
type CompareProps={title:string;before:string;after:string;beforeLabel:string;afterLabel:string;demo:boolean;source:string};
export const SwissGrid=({title,subtitle,demo}:TitleProps)=>{
const {frame,fps}=useMotion(),lines=title.split('\n');if(lines.length>3||lines.some(x=>x.length>23))throw Error('Use up to three short title lines.');
return <Frame demo={demo}><svg width={1080} height={1920} style={{position:'absolute',inset:0}}>
{[110,325,540,755,970].map((x,i)=><line key={x} x1={x} x2={x} y1={390} y2={1320} stroke={C.copper} strokeOpacity={.2} pathLength={1} strokeDasharray={1} strokeDashoffset={interpolate(frame,[i*.04*fps,(.5+i*.04)*fps],[1,0],bounded)}/>)}
{[390,605,820,1035,1250].map((y,i)=><line key={y} x1={110} x2={970} y1={y} y2={y} stroke={C.copper} strokeOpacity={.2} pathLength={1} strokeDasharray={1} strokeDashoffset={interpolate(frame,[(.1+i*.04)*fps,(.7+i*.04)*fps],[1,0],bounded)}/>)}
<rect x={540} y={390} width={interpolate(frame,[.3*fps,1.2*fps],[0,430],bounded)} height={215} fill={C.copper}/><circle cx={interpolate(frame,[0,.6*fps,1.3*fps],[217.5,432.5,755],bounded)} cy={497.5} r={48} fill={C.ink}/></svg>
<div style={{position:'absolute',top:675,left:110,right:110,fontSize:100,fontWeight:800,lineHeight:1.75,textAlign:'right'}}>{lines.map((line,i)=><div key={i} style={{overflow:'hidden',height:175}}><div style={{translate:`${interpolate(frame,[(.5+i*.18)*fps,(1.4+i*.18)*fps],[120,0],bounded)}px 0`}}>{line}</div></div>)}</div>
<div style={{position:'absolute',top:1235,left:110,right:110,fontSize:31,fontFamily:latinFont,direction:'ltr',textAlign:'right'}}>{subtitle}</div></Frame>;
};
export const Editorial=({title,subtitle,image,note,demo}:EditorialProps)=>{
const {frame,fps}=useMotion();return <Frame demo={demo}><Heading text={title} top={405}/>
<div style={{position:'absolute',top:680,left:110,width:520,height:480,overflow:'hidden',clipPath:`inset(${interpolate(frame,[.5*fps,1.5*fps],[100,0],bounded)}% 0 0 0)`}}>{image?<Img pauseWhenLoading premountFor={fps} src={staticFile(localMediaPath(image))} style={{width:'100%',height:'100%',objectFit:'contain'}}/>:<svg width={520} height={480} aria-label="تكوين تجريدي لا يمثل عقارًا"><rect width={520} height={480} fill={C.paperDeep}/><rect x={70} y={75} width={190} height={280} fill={C.copper}/><circle cx={320} cy={260} r={115} fill={C.ink}/></svg>}</div>
<div style={{position:'absolute',top:690,right:110,width:280,fontSize:38,lineHeight:1.9,whiteSpace:'pre-line'}}>{subtitle}</div>
<svg width={1080} height={1920} style={{position:'absolute',inset:0}}><path d="M925 1205 C865 1228 800 1195 735 1220 C690 1238 652 1225 620 1228" fill="none" stroke={C.copper} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={interpolate(frame,[2*fps,3*fps],[1,0],bounded)}/></svg>
<div style={{position:'absolute',top:1235,right:110,fontSize:33,color:C.copper,clipPath:`inset(0 0 0 ${interpolate(frame,[2.4*fps,3.4*fps],[100,0],bounded)}%)`}}>{note}</div></Frame>;
};
export const StatChart=({title,values,unit,demo,source}:ChartProps)=>{
requireSource(demo,source);const {frame,fps}=useMotion(),p=interpolate(frame,[0,3.4*fps],[0,1],bounded),value=valueAtProgress(values,p),max=Math.max(...values,1),x=(i:number)=>125+i/(values.length-1)*820,y=(v:number)=>1170-v/max*410;
return <Frame dark demo={demo}><Heading text={title} size={64}/><div style={{position:'absolute',top:575,left:110,right:110,fontSize:162,fontWeight:800,textAlign:'center',fontVariantNumeric:'tabular-nums',direction:'ltr'}}>{Math.round(value).toLocaleString('en-US')}<span style={{fontSize:42}}>{unit}</span></div>
<svg width={1080} height={1920} style={{position:'absolute',inset:0}}><defs><clipPath id="line-reveal"><rect x={125} y={745} width={p*820} height={450}/></clipPath></defs>
{[0,.25,.5,.75,1].map(f=><g key={f}><line x1={125} x2={945} y1={y(f*max)} y2={y(f*max)} stroke={C.paper} strokeOpacity={.12}/><text x={130} y={y(f*max)-10} fontSize={19} fill={C.paper}>{Math.round(f*max)}</text></g>)}
<polyline clipPath="url(#line-reveal)" points={values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')} fill="none" stroke={C.copperLight} strokeWidth={6}/><circle cx={125+p*820} cy={y(value)} r={10} fill={C.copperLight}/>
{values.map((_,i)=><text key={i} x={x(i)} y={1210} fontSize={22} textAnchor="middle" fill={C.paper}>{i+1}</text>)}</svg>
<div style={{position:'absolute',top:1260,left:110,right:110,fontSize:24,textAlign:'center'}}>{demo?'قيم اختبار للحركة؛ لا تمثل أداء دوموس':source}</div></Frame>;
};
export const BeforeAfter=({title,before,after,beforeLabel,afterLabel,demo,source}:CompareProps)=>{
requireSource(demo,source);if((!demo&&(!before||!after))||Boolean(before)!==Boolean(after))throw Error('Supply both authorized images.');const {frame,fps}=useMotion(),split=interpolate(frame,[0,.5*fps,1.9*fps,3.4*fps],[92,92,8,50],bounded),panel={position:'absolute' as const,inset:0,width:'100%',height:'100%',objectFit:'contain' as const};
const swatch=(color:string)=><svg width={860} height={580}><rect width={860} height={580} fill={color}/><circle cx={430} cy={290} r={180} fill={C.ink}/><rect x={340} y={200} width={180} height={180} fill={C.paper}/></svg>;
return <Frame demo={demo}><Heading text={title} size={70}/><div style={{position:'absolute',left:110,top:690,width:860,height:580,overflow:'hidden',background:C.paperDeep,border:`1px solid ${C.line}`}}>{before?<Img pauseWhenLoading premountFor={fps} src={staticFile(localMediaPath(before))} style={panel}/>:swatch(C.paperDeep)}<div style={{...panel,clipPath:`inset(0 0 0 ${split}%)`}}>{after?<Img pauseWhenLoading premountFor={fps} src={staticFile(localMediaPath(after))} style={panel}/>:swatch(C.copperLight)}</div>
<div style={{position:'absolute',left:`${split}%`,top:0,bottom:0,width:4,background:C.white,translate:'-2px 0'}}/><div style={{position:'absolute',left:`${split}%`,top:260,width:60,height:60,borderRadius:30,background:C.white,color:C.ink,translate:'-30px 0',fontSize:35,textAlign:'center'}}>↔</div>
<div style={{position:'absolute',left:22,top:20,padding:'8px 18px',background:C.paper,color:C.ink,fontSize:26}}>{beforeLabel}</div><div style={{position:'absolute',right:22,top:20,padding:'8px 18px',background:C.ink,color:C.paper,fontSize:26}}>{afterLabel}</div></div></Frame>;
};
export const RemotionRoot=()=> <>
<Composition id="DomusSwissGrid" component={SwissGrid} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{title:'نرافقكم\nفي كل خطوة',subtitle:'DOMUS REAL ESTATE',demo:true}}/>
<Composition id="DomusEditorial" component={Editorial} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{title:'مساحة لرؤية أوضح',subtitle:'إيقاع هادئ\nوتفاصيل تستحق\nأن تُرى',image:'',note:'وضوح في كل خطوة',demo:true}}/>
<Composition id="DomusStatChart" component={StatChart} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{title:'حين تتحوّل الأرقام إلى قصة',values:[20,32,28,45,60],unit:'',demo:true,source:''}}/>
<Composition id="DomusBeforeAfter" component={BeforeAfter} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{title:'تفصيل واحد، رؤية مختلفة',before:'',after:'',beforeLabel:'لوحة أولى',afterLabel:'لوحة ثانية',demo:true,source:''}}/>
</>;
