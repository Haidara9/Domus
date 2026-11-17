#!/usr/bin/env node
// DOMUS music and sound-effect library: list, check files against the catalogs, print credits.
//   node library/bin/audio.mjs list music [--mood calm] [--no-credit] [--max-bpm 90]
//   node library/bin/audio.mjs list sfx [--category whoosh]
//   node library/bin/audio.mjs verify                 every file exists and matches its sha256
//   node library/bin/audio.mjs credits <id> [<id>...] paste-ready credit lines for a caption
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
export const kinds = { music: 'music/catalog.json', sfx: 'sfx/catalog.json' };
export function load(kind) {
  if (!kinds[kind]) throw new Error(`Unknown library "${kind}". Use music or sfx.`);
  const catalog = JSON.parse(fs.readFileSync(path.join(root, kinds[kind]), 'utf8'));
  return catalog.items.map((item) => ({ ...item, kind, path: path.join(root, kind, item.file) }));
}
export const all = () => [...load('music'), ...load('sfx')];
export function verify() {
  const problems = [];
  const ids = new Set();
  for (const item of all()) {
    if (ids.has(item.id)) problems.push(`${item.id}: duplicate id`);
    ids.add(item.id);
    if (!item.licence || !item.licence_url || !item.source_url) problems.push(`${item.id}: licence or source missing`);
    if (item.attribution_required && !item.credit) problems.push(`${item.id}: needs a credit line`);
    if (!fs.existsSync(item.path)) { problems.push(`${item.id}: file missing (${item.file})`); continue; }
    const sha = crypto.createHash('sha256').update(fs.readFileSync(item.path)).digest('hex');
    if (sha !== item.sha256) problems.push(`${item.id}: sha256 differs from the catalog`);
  }
  return problems;
}
export function credits(ids) {
  const items = all();
  return ids.map((id) => {
    const item = items.find((x) => x.id === id);
    if (!item) throw new Error(`"${id}" is not in the library.`);
    return { id, required: !!item.attribution_required, line: item.credit || `${item.title} — ${item.author} (${item.licence}, no credit required)` };
  });
}
function main(argv) {
  const [command, ...rest] = argv;
  const flag = (name) => { const i = rest.indexOf('--' + name); return i < 0 ? undefined : rest[i + 1] ?? true; };
  if (command === 'list') {
    const kind = rest[0];
    let items = load(kind);
    if (flag('mood')) items = items.filter((x) => (x.moods || []).includes(flag('mood')));
    if (flag('category')) items = items.filter((x) => x.category === flag('category'));
    if (rest.includes('--no-credit')) items = items.filter((x) => !x.attribution_required);
    if (flag('max-bpm')) items = items.filter((x) => x.bpm && x.bpm <= Number(flag('max-bpm')));
    for (const x of items) {
      const detail = kind === 'music'
        ? `${String(x.duration_s).padStart(6)}s ${String(x.bpm ?? '?').padStart(5)} bpm  ${(x.moods || []).join(', ')}`
        : `${String(x.duration_s).padStart(6)}s  ${x.category}`;
      console.log(`${x.id.padEnd(34)} ${detail}  [${x.licence}${x.attribution_required ? ', credit required' : ''}]  ${path.relative(process.cwd(), x.path)}`);
    }
    console.log(`${items.length} item(s)`);
  } else if (command === 'verify') {
    const problems = verify();
    for (const p of problems) console.error(p);
    console.log(problems.length ? `${problems.length} problem(s)` : `ok: ${all().length} files match their catalogs`);
    process.exitCode = problems.length ? 1 : 0;
  } else if (command === 'credits') {
    const lines = credits(rest);
    for (const c of lines) console.log(c.line);
    if (lines.some((c) => c.required)) console.log('\nAt least one track above is CC BY: its credit line must appear in the post caption or the video.');
  } else {
    console.log('Usage: audio.mjs list music|sfx [--mood m] [--category c] [--no-credit] [--max-bpm n] | verify | credits <id...>');
  }
}
if (process.argv[1] === import.meta.filename) main(process.argv.slice(2));
