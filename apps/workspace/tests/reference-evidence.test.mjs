import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const asModule=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const access=fs.readFileSync('app/access.ts','utf8').replace(/import \{ env \} from 'cloudflare:workers';/,`const env={DOMUS_TEAM_EMAILS:'owner@example.test'};`);
const accessURL=asModule(access);
const source=fs.readFileSync('app/api/reference-evidence/route.ts','utf8').replace("import {teamRequest,forbidden} from '../../access';",`import {teamRequest,forbidden} from '${accessURL}';`).replace("import sheets from '../../reference-sheets.json';",`const sheets={'known':'UklGRg=='};`);
const {GET}=await import(asModule(source));
const req=(id,email)=>new Request('https://domus.example/api/reference-evidence?id='+id,{headers:email?{'oai-authenticated-user-id':'signed-user','oai-authenticated-user-email':email}:{}});
assert.equal((await GET(req('known'))).status,403);
assert.equal((await GET(req('known','client@example.test'))).status,403);
const ok=await GET(req('known','owner@example.test'));assert.equal(ok.status,200);assert.equal(ok.headers.get('cache-control'),'private, no-store');assert.equal(ok.headers.get('content-type'),'image/webp');
assert.equal((await GET(req('missing','owner@example.test'))).status,404);
assert.equal((await GET(req('toString','owner@example.test'))).status,404);
const refs=JSON.parse(fs.readFileSync('app/reference-audit.json')),sheets=JSON.parse(fs.readFileSync('app/reference-sheets.json')),transitions=JSON.parse(fs.readFileSync('app/transitions-catalog.json'));
assert.equal(transitions.length,30);assert.equal(new Set(transitions.map(t=>t.id)).size,30);assert.equal(refs.reduce((n,r)=>n+r.frames,0),4724);assert.equal(Object.keys(sheets).length,51);
for(const r of refs){assert.equal(r.events[0].start,0);assert.equal(r.events.at(-1).end,r.frames);for(let i=1;i<r.events.length;i++)assert.equal(r.events[i-1].end,r.events[i].start);for(const key of r.sheets)assert.ok(sheets[key]);}
console.log('PASS: evidence authorization, private caching, unknown IDs, 30 recipes, 51 sheets, contiguous frame ledgers');
