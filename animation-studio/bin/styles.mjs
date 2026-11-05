#!/usr/bin/env node
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {catalog,makePrompt,styleById,studioRoot,repoRoot} from '../lib/catalog.mjs';
try{
const [cmd='help',id,file]=process.argv.slice(2);
if(cmd==='list')for(const s of catalog.styles.filter(s=>!id||`${s.name} ${s.domusFit}`.toLowerCase().includes(id.toLowerCase())))console.log(`${s.id.padEnd(28)} Part ${s.part} ${s.domusFit.padEnd(12)} ${s.composition??'recipe-only'}`);
else if(cmd==='show')console.log(JSON.stringify(styleById(id),null,2));
else if(cmd==='prompt'){if(!file)throw Error('Usage: styles prompt <id> <brief.json>');console.log(makePrompt(id,JSON.parse(readFileSync(resolve(file),'utf8'))));}
else if(cmd==='doctor'){const [major,minor]=process.versions.node.split('.').map(Number);const checks={node:major>22||(major===22&&minor>=18),cards:catalog.styles.length===46,brand:existsSync(resolve(repoRoot,'brand/brand.json')),assets:existsSync(resolve(studioRoot,'public/brand/arabicDisplay.ttf')),dependencies:existsSync(resolve(studioRoot,'node_modules/remotion/package.json')),commands:existsSync(resolve(repoRoot,'.claude/commands/animation-style.md'))};console.log(JSON.stringify({checks,ready:Object.values(checks).every(Boolean),implemented:catalog.styles.filter(s=>s.composition).map(s=>s.composition),recipeOnly:42,note:'Local setup checks; not rendered-output or real-world factual verification.'},null,2));if(!Object.values(checks).every(Boolean))process.exitCode=1;}
else console.log('styles list [filter]\nstyles show <id>\nstyles prompt <id> <brief.json>\nstyles doctor');
}catch(e){console.error(e.message);process.exitCode=1;}
