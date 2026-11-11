import { teamRequest,noCache } from '../../access';
export async function GET(req:Request){return Response.json({isTeam:teamRequest(req)},{headers:noCache});}
