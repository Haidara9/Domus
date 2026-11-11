import { getChatGPTUser } from './chatgpt-auth';
import { teamEmail,localPreview } from './access';
import Workspace from './team-workspace';
import ClientPortal from './components/ClientPortal';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return localPreview()||teamEmail(user?.email)?<Workspace/>:<ClientPortal/>;}
