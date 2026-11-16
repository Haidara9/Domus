// Writes the style list the workspace UI imports, from the worker's catalog (single source:
// render-worker/lib/catalog.mjs). Run after adding or changing a style:
//   node render-worker/bin/sync-catalog.mjs
import fs from 'node:fs';
import path from 'node:path';
import {catalog} from '../lib/catalog.mjs';
const target=path.resolve(import.meta.dirname,'../../apps/workspace/app/rendering/catalog.json');
fs.writeFileSync(target,JSON.stringify(catalog,null,2));
console.log('wrote',catalog.length,'styles,',catalog.filter(s=>s.ready).length,'ready');
