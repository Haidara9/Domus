// Real SQLite executes exactly the route SQL through a D1-compatible test adapter.
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';import ts from '../../apps/workspace/node_modules/typescript/lib/typescript.js';
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('apps/workspace/drizzle/0001_common_swarm.sql','utf8').replaceAll('--> statement-breakpoint',''));
const asModule=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const sql={prepare(q){let args=[];const api={bind(...a){args=a;return api},async first(){return db.prepare(q).get(...args)||null},async run(){return {meta:{changes:db.prepare(q).run(...args).changes}}},async all(){return {results:db.prepare(q).all(...args)}}};return api;}};
const env={DOMUS_RENDER_TOKEN:'test-render-bearer-token-32-chars-long',DB:sql};globalThis.__testEnv=env;
const source=fs.readFileSync('apps/workspace/app/rendering/server.ts','utf8').replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__testEnv;');const server=asModule(source);
const route=fs.readFileSync('apps/workspace/app/api/render-agent/route.ts','utf8').replace("'../../rendering/server'",JSON.stringify(server));const {POST,GET,PUT}=await import(asModule(route));
const worker='10000000-0000-0000-0000-000000000001';const req=(b,auth=true)=>new Request('https://domus.example/api/render-agent',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{'x-domus-render-token':env.DOMUS_RENDER_TOKEN}:{})},body:JSON.stringify(b)});
const body=async b=>{const r=await POST(req(b));return {status:r.status,data:await r.json()}};
test('queue denies anonymous, isolates leases, serializes competing claims, never retries failed jobs',async()=>{
 assert.equal((await POST(req({action:'claim'},false))).status,403);await body({action:'heartbeat',workerId:worker,backends:['ffmpeg']});
 const now=new Date().toISOString(),spec={backend:'ffmpeg',files:[{key:'raw/private'}]};db.prepare('INSERT INTO render_jobs(id,request_id,status,data,created_at,updated_at) VALUES(?,?,?,?,?,?)').run('10000000-0000-0000-0000-000000000003','request','queued',JSON.stringify({spec,events:[]}),now,now);
 const claims=await Promise.all([body({action:'claim',workerId:worker}),body({action:'claim',workerId:worker})]);assert.equal(claims.filter(r=>r.data.job).length,1);const job=claims.find(r=>r.data.job).data.job;
 assert.equal((await body({action:'stage',id:job.id,lease:crypto.randomUUID(),stage:'rendering'})).status,409);
 assert.equal((await body({action:'stage',id:job.id,lease:job.lease,stage:'checking'})).status,409);
 const file=new Request('https://domus.example/api/render-agent?'+new URLSearchParams({id:job.id,lease:job.lease,key:'raw/other'}),{headers:{'x-domus-render-token':env.DOMUS_RENDER_TOKEN}});assert.equal((await GET(file)).status,403);
 assert.equal((await body({action:'stage',id:job.id,lease:job.lease,stage:'rendering'})).status,200);
 assert.equal((await body({action:'stage',id:job.id,lease:job.lease,stage:'failed',error:'test'})).status,200);
 assert.equal((await body({action:'claim',workerId:worker})).data.job,null);assert.equal((await body({action:'heartbeat',workerId:worker,backends:['ffmpeg'],id:job.id,lease:job.lease})).data.ok,false);
});
