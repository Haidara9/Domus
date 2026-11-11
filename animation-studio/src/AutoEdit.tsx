import {registerRoot,Composition,AbsoluteFill,OffthreadVideo,staticFile,useCurrentFrame,useVideoConfig,interpolate,Easing} from 'remotion';
import {loadFont} from '@remotion/fonts';
loadFont({family:'CairoAuto',url:staticFile('brand/cairo.ttf'),weight:'200 1000'});
type Props={src:string;title:string;lines:string;styleId:string;width:number;height:number;fps:number;frames:number};
const Auto=({src,title,lines,styleId}:Props)=>{const f=useCurrentFrame(),{fps,width,height}=useVideoConfig();return <AbsoluteFill style={{background:'#151412'}}>
<OffthreadVideo src={staticFile(src)} muted style={{width:'100%',height:'100%',objectFit:'contain'}}/>
<div dir="rtl" style={{position:'absolute',right:'7%',left:'7%',bottom:'18%',fontFamily:'CairoAuto',color:'#F1E6D3',background:'rgba(21,20,18,.9)',padding:'3%',borderRight:'4px solid #A86F3F',opacity:interpolate(f,[.15*fps,.8*fps,3.5*fps,4*fps],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}),translate:`0 ${interpolate(f,[.15*fps,.8*fps],[height*.02,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.22,1,.36,1)})}px`}}>
{styleId==='swiss-grid'&&<div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(#A86F3F22 1px,transparent 1px),linear-gradient(90deg,#A86F3F22 1px,transparent 1px)',backgroundSize:width*.05,opacity:.6}}/>}
<div style={{position:'relative',fontSize:width*.048,fontWeight:700,whiteSpace:'pre-line',lineHeight:1.6}}>{title}</div><div style={{position:'relative',fontSize:width*.029,lineHeight:1.7,whiteSpace:'pre-line'}}>{lines}</div></div></AbsoluteFill>};
registerRoot(()=> <Composition id="DomusAutoEdit" component={Auto} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{src:'base.mp4',title:'',lines:'',styleId:'swiss-grid',width:1080,height:1920,fps:30,frames:150}} calculateMetadata={({props})=>({width:props.width,height:props.height,fps:props.fps,durationInFrames:props.frames})}/>);
