import type {CSSProperties,ReactNode} from 'react';
import {AbsoluteFill,Img,Easing,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/fonts';
import b from './brand.generated.json';
loadFont({family:b.arabic,url:staticFile('brand/arabicDisplay.ttf'),weight:'200 1000'});
loadFont({family:b.latin,url:staticFile('brand/latinDisplay.ttf'),weight:'400 900'});
export const C=b.colors;
export const latinFont=b.latin;
export const bounded={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(0.22,1,0.36,1)} as const;
export const arabic:CSSProperties={fontFamily:b.arabic,direction:'rtl',letterSpacing:0};
export function useMotion(){const frame=useCurrentFrame(),{fps,durationInFrames}=useVideoConfig();return {frame:Math.min(frame,durationInFrames-fps),fps};}
export function Frame({children,demo=true,dark=false}:{children:ReactNode;demo?:boolean;dark?:boolean}){const {fps}=useVideoConfig();return <AbsoluteFill style={{...arabic,background:dark?C.ink:C.paper,color:dark?C.paper:C.ink,overflow:'hidden'}}>
<div style={{position:'absolute',top:215,left:110,right:110,height:2,background:C.copper}}/>
<div style={{position:'absolute',top:235,left:387.5,width:305,height:120,background:dark?C.paper:'transparent',zIndex:2,display:'flex',alignItems:'center',justifyContent:'center'}}><Img pauseWhenLoading premountFor={fps} src={staticFile('brand/domus-ar.png')} style={{width:265,height:100,objectFit:'contain'}}/></div>
{children}{demo?<div style={{position:'absolute',top:1360,left:110,right:110,fontSize:25,textAlign:'center'}}>نموذج توضيحي · ليس إعلانًا عقاريًا</div>:null}</AbsoluteFill>;}
export function Heading({text,size=75,top=425}:{text:string;size?:number;top?:number}){if(text.length>80)throw Error('Shorten the heading.');const {frame,fps}=useMotion();return <div style={{position:'absolute',top,left:110,right:110,overflow:'hidden',paddingBottom:12}}><div style={{fontSize:size,fontWeight:750,lineHeight:1.45,translate:`0 ${interpolate(frame,[0,.8*fps],[90,0],bounded)}px`}}>{text}</div></div>;}
