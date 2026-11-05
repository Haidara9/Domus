export function valueAtProgress(values:readonly number[],progress:number):number{
 if(values.length<2||values.some(v=>!Number.isFinite(v)||v<0))throw Error('Supply two or more finite nonnegative values.');
 const pos=Math.min(1,Math.max(0,progress))*(values.length-1),i=Math.min(values.length-2,Math.floor(pos));
 return values[i]+(values[i+1]-values[i])*(pos-i);
}
export function requireSource(demo:boolean,reference:string){if(!demo&&!reference.trim())throw Error('Confirmed source required.');}
export function localMediaPath(path:string){if(!/^media\/[\p{L}\p{N} _./()-]+$/u.test(path)||path.split('/').some(s=>s==='..'||s==='.')||path.endsWith('/'))throw Error('Use a safe path under public/media.');return path;}
