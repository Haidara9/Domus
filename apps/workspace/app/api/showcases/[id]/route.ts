import {readShowcase,showcaseAccess,clientDTO} from '../../../showcase-data';
import {teamRequest,noCache} from '../../../access';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const s=await readShowcase(id);if(!s||!showcaseAccess(req,s))return Response.json({error:'العرض غير متاح لهذا الحساب. تواصل مع فريق دوموس.'},{status:404,headers:noCache});return Response.json({showcase:clientDTO(s),isTeam:teamRequest(req)},{headers:noCache});}
