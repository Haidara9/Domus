#!/usr/bin/env node
// DOMUS Super Editor CLI. Run `domus help` for the command list.
import { copyFileSync, readFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import * as T from '../src/timeline.mjs';
import { ensureDir, exists, fmtTime, log, probe, readJSON, setVerbose, writeJSON, LIBRARY_DIR } from '../src/util.mjs';

const HELP = `DOMUS Super Editor — timeline engine

Project
  new <dir> [--title T] [--format reel-9x16|feed-4x5|square-1x1|wide-16x9|wide-4k|cinema-239] [--fps 30]
  import <dir> <files...> [--copy]          add media (probed); files outside <dir> are copied to <dir>/media
  analyze <dir> [mediaId...]                shots, exposure, sharpness, motion, best windows + shot sheets
  show <dir>                                timeline table          validate <dir>   check without rendering

Edit (every edit is snapshotted in versions/)
  add-clip <dir> <mediaId> [--in s] [--out s] [--at index] [--camera move[:amount]] [--focus x,y]
           [--zoom z] [--grade preset] [--transition type[:dur]] [--speed x] [--stabilize] [--label txt]
  add <dir> text|animation|vfx <component> --start s --dur s [--props JSON]
  add <dir> audio music|vo|ambience|source --path file --start s [--in s] [--dur s] [--gain dB] [--fade-in s] [--fade-out s]
  add <dir> audio sfx <type> --start s [--gain dB] [--params JSON]
  trim <dir> <id> [--in s] [--out s] [--start s] [--dur s]      slip <dir> <id> <delta>
  split <dir> <clipId> <timelineTime>       move <dir> <id> <index|time>      rm <dir> <id>
  set <dir> <id|timeline> key.path=<json> [...]   e.g. set p v3 camera='{"move":"push-in","amount":0.06}'
  beats <dir> <audio> [--snap] [--tolerance 0.25] [--bpm N]   detect beats; --snap moves cuts onto beats
  match <dir> [--ref clipId] [--apply]      shot-match exposure/cast between clips
  history <dir>    revert <dir> <v>    diff <dir> <vA> [vB]

Output
  still <dir> <t> [--format f]              fast preview frame (base + overlays)
  render <dir> [--format f|all] [--draft] [--from s --to s] [--no-qc]
  qc <dir> <file>                           contact <video> [out.png]
  export-hf <dir>                           HyperFrames composition for Studio editing
  library [components|transitions|grades|sfx|formats]

Options: --verbose`;

function parse(argv) {
  const pos = [], o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const nx = argv[i + 1];
      if (nx === undefined || nx.startsWith('--')) o[k] = true; else { o[k] = nx; i++; }
    } else pos.push(a);
  }
  return { pos, o };
}

const num = (x) => (x === undefined ? undefined : Number(x));
const json = (s, what) => { try { return JSON.parse(s); } catch { throw new Error(`${what}: invalid JSON: ${s}`); } };
function value(s) { try { return JSON.parse(s); } catch { return s; } }

function commit(dir, tl, msg) {
  const v = T.validate(tl);
  if (!v.ok) throw new Error(`Edit rejected (timeline would be invalid):\n - ${v.errors.join('\n - ')}`);
  v.warnings.forEach((w) => log(`  ! ${w}`));
  const ver = T.save(dir, tl, msg);
  log(`saved v${ver}: ${msg}`);
}

function show(tl) {
  const { clips, duration } = T.layout(tl);
  log(`${tl.title}  ${tl.format} ${tl.width}x${tl.height} @${tl.fps}fps  duration ${fmtTime(duration)} (${T.layout(tl).frames}f)  grade:${tl.grade?.global || '-'}`);
  log('\nVIDEO (V1, magnetic)');
  for (const c of clips) {
    const m = tl.media[c.media];
    const tr = c.transition?.type && c.transition.type !== 'cut' ? ` -> ${c.transition.type} ${T.transitionDur(c, tl.fps)}s` : '';
    log(`  ${c.id.padEnd(4)} ${fmtTime(c.start)}-${fmtTime(c.end)}  ${c.media} [${m?.kind === 'image' ? 'still' : `${c.in.toFixed(2)}-${c.out.toFixed(2)}`}]${c.speed && c.speed !== 1 ? ` ${c.speed}x` : ''}${c.ramp ? ' ramp' : ''}  cam:${c.camera?.move || 'static'}${c.grade ? ` grade:${typeof c.grade === 'string' ? c.grade : c.grade.preset || 'custom'}` : ''}${tr}${c.label ? `  "${c.label}"` : ''}`);
  }
  for (const tr of ['animation', 'vfx', 'text']) {
    if (!tl.tracks[tr].length) continue;
    log(`\n${tr.toUpperCase()}`);
    for (const it of tl.tracks[tr]) log(`  ${it.id.padEnd(4)} ${fmtTime(it.start)}-${fmtTime(it.start + it.dur)}  ${it.component}  ${(it.props?.title || it.props?.text || it.props?.label || '').toString().slice(0, 40)}`);
  }
  if (tl.tracks.audio.length) {
    log('\nAUDIO');
    for (const a of tl.tracks.audio) log(`  ${a.id.padEnd(4)} ${fmtTime(a.start)}  ${a.kind}${a.type ? ':' + a.type : ''} ${a.path ? basename(a.path) : ''} ${a.gain !== undefined ? a.gain + 'dB' : ''}`);
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, o } = parse(rest);
  if (o.verbose) setVerbose(true);
  const dir = pos[0] && resolve(pos[0]);
  switch (cmd) {
    case undefined: case 'help': case '--help': log(HELP); return;

    case 'new': {
      if (exists(join(dir, 'timeline.json'))) throw new Error(`${dir} already has a timeline.json`);
      ensureDir(dir); ['media', 'analysis', 'docs', 'renders'].forEach((d) => ensureDir(join(dir, d)));
      const tl = T.createTimeline({ title: o.title || basename(dir), format: o.format || 'reel-9x16', fps: num(o.fps) });
      T.save(dir, tl, 'new project');
      const tpl = resolve(LIBRARY_DIR, '..', 'productions', '_template');
      for (const f of ['brief.md', 'shotlist.md', 'notes.md']) if (exists(join(tpl, f)) && !exists(join(dir, 'docs', f))) copyFileSync(join(tpl, f), join(dir, 'docs', f));
      log(`created ${dir} (${tl.format} ${tl.width}x${tl.height} @${tl.fps})`);
      return;
    }

    case 'import': {
      let tl = T.load(dir);
      for (const f of pos.slice(1)) {
        let p = resolve(f);
        let rel = relative(dir, p);
        if (rel.startsWith('..') || o.copy) { const dst = join(ensureDir(join(dir, 'media')), basename(p)); if (!exists(dst)) copyFileSync(p, dst); p = dst; rel = relative(dir, dst); }
        const info = await probe(p);
        if (!['video', 'image', 'audio'].includes(info.kind)) { log(`skip ${f}: unsupported`); continue; }
        const { mediaId } = await import('../src/analyze.mjs');
        const id = mediaId(tl, p);
        tl = structuredClone(tl);
        tl.media[id] = { path: rel, kind: info.kind, duration: info.duration, width: info.width, height: info.height, fps: info.fps, hasAudio: info.hasAudio, hdr: ['smpte2084', 'arib-std-b67'].includes(info.colorTransfer) || undefined };
        log(`  ${id.padEnd(18)} ${info.kind.padEnd(5)} ${info.width || ''}x${info.height || ''} ${info.duration ? info.duration.toFixed(2) + 's' : ''} ${info.fps ? info.fps.toFixed(2) + 'fps' : ''}${tl.media[id].hdr ? ' HDR(!)' : ''}`);
      }
      commit(dir, tl, `import ${pos.length - 1} file(s)`);
      return;
    }

    case 'analyze': {
      const tl = T.load(dir);
      const A = await import('../src/analyze.mjs');
      const ids = pos.length > 1 ? pos.slice(1) : Object.keys(tl.media);
      const outDir = ensureDir(join(dir, 'analysis'));
      for (const id of ids) {
        const m = tl.media[id]; if (!m) throw new Error(`unknown media ${id}`);
        if (m.kind !== 'video') { if (m.kind === 'image') { const r = await A.analyzeImage(resolve(dir, m.path)); writeJSON(join(outDir, `${id}.json`), r); log(`${id}: still ${r.info.width}x${r.info.height} — ${r.suggestion}`); } continue; }
        const r = await A.analyzeVideo(resolve(dir, m.path), { cacheDir: join(dir, 'cache') });
        writeJSON(join(outDir, `${id}.json`), r);
        const sheet = await A.shotSheet(r, join(outDir, `${id}.shots.png`)).catch((e) => { log(`  sheet failed: ${e.message.split('\n')[0]}`); return null; });
        log(`${id}: ${r.shots.length} shot(s)${sheet ? ` -> ${relative(process.cwd(), sheet)}` : ''}`);
        for (const s of r.shots) log(`  #${String(s.index).padEnd(3)} ${s.start.toFixed(2)}-${s.end.toFixed(2)}s  score ${s.score}  luma ${s.luma}  blur ${s.blur}  ${s.movement}  best ${s.bestWindow.join('-')}  ${s.flags.join(' ')}`);
      }
      return;
    }

    case 'show': show(T.load(dir)); return;
    case 'validate': {
      const v = T.validate(T.load(dir), { root: dir });
      v.errors.forEach((e) => log(`✗ ${e}`)); v.warnings.forEach((w) => log(`! ${w}`));
      log(v.ok ? 'timeline OK' : 'timeline INVALID'); if (!v.ok) process.exitCode = 1; return;
    }

    case 'add-clip': {
      const tl0 = T.load(dir);
      const extra = {};
      if (o.camera) { const [move, amount] = String(o.camera).split(':'); extra.camera = { move, ...(amount ? { amount: Number(amount) } : {}) }; }
      if (o.focus || o.zoom) extra.reframe = { ...(o.focus ? { focus: String(o.focus).split(',').map(Number) } : {}), ...(o.zoom ? { zoom: Number(o.zoom) } : {}) };
      if (o.grade) extra.grade = o.grade;
      if (o.transition) { const [type, d] = String(o.transition).split(':'); extra.transition = { type, ...(d ? { dur: Number(d) } : {}) }; }
      if (o.speed) extra.speed = Number(o.speed);
      if (o.stabilize) extra.stabilize = {};
      if (o.label) extra.label = o.label;
      const { tl, id } = T.addClip(tl0, { media: pos[1], in: num(o.in) ?? 0, out: num(o.out), at: num(o.at), ...extra });
      commit(dir, tl, `add clip ${id} (${pos[1]})`); return;
    }

    case 'add': {
      const track = pos[1];
      let item;
      if (track === 'audio') {
        const kind = pos[2];
        item = { kind, start: num(o.start) ?? 0 };
        if (kind === 'sfx') { item.type = pos[3]; if (o.params) item.params = json(o.params, '--params'); if (o.path) { item.path = o.path; delete item.type; } }
        else { item.path = o.path ? relative(dir, resolve(o.path)) : undefined; }
        if (o.in) item.in = num(o.in); if (o.dur) item.dur = num(o.dur);
        if (o.gain !== undefined) item.gain = num(o.gain);
        if (o.fadeIn) item.fadeIn = num(o.fadeIn); if (o.fadeOut) item.fadeOut = num(o.fadeOut);
        if (o.noDuck) item.duck = false;
      } else {
        item = { component: pos[2], start: num(o.start) ?? 0, dur: num(o.dur) ?? 3, props: o.props ? json(o.props, '--props') : {} };
      }
      const { tl, id } = T.addItem(T.load(dir), track, item);
      commit(dir, tl, `add ${track} ${id}`); return;
    }

    case 'trim': commit(dir, T.trim(T.load(dir), pos[1], { in: num(o.in), out: num(o.out), start: num(o.start), dur: num(o.dur) }), `trim ${pos[1]}`); return;
    case 'slip': commit(dir, T.slip(T.load(dir), pos[1], Number(pos[2])), `slip ${pos[1]} ${pos[2]}`); return;
    case 'split': { const { tl, id } = T.split(T.load(dir), pos[1], Number(pos[2])); commit(dir, tl, `split ${pos[1]} at ${pos[2]} -> ${id}`); return; }
    case 'move': commit(dir, T.move(T.load(dir), pos[1], Number(pos[2])), `move ${pos[1]} -> ${pos[2]}`); return;
    case 'rm': commit(dir, T.remove(T.load(dir), pos[1]), `remove ${pos[1]}`); return;
    case 'set': {
      let tl = T.load(dir);
      for (const kv of pos.slice(2)) { const i = kv.indexOf('='); tl = T.setProp(tl, pos[1], kv.slice(0, i), value(kv.slice(i + 1))); }
      commit(dir, tl, `set ${pos[1]} ${pos.slice(2).map((s) => s.split('=')[0]).join(',')}`); return;
    }

    case 'beats': {
      const { detectBeats } = await import('../src/analyze.mjs');
      const r = await detectBeats(resolve(pos[1] ? dir : '.', pos[1]), { bpm: num(o.bpm) });
      const out = join(ensureDir(join(dir, 'analysis')), `beats_${basename(pos[1]).replace(/\.[^.]+$/, '')}.json`);
      writeJSON(out, r);
      log(`${r.bpm} BPM, ${r.beats.length} beats, ${r.downbeats.length} downbeats, ${r.onsets.length} onsets -> ${relative(process.cwd(), out)}`);
      if (o.snap) {
        const { tl, changes } = T.snapCutsToBeats(T.load(dir), o.snap === 'downbeats' ? r.downbeats : r.beats, { tolerance: num(o.tolerance) ?? 0.25 });
        changes.forEach((c) => log(`  ${c.id}: cut ${c.from}s -> ${c.to}s`));
        if (changes.length) commit(dir, tl, `snap ${changes.length} cut(s) to beats`); else log('no cuts within tolerance');
      }
      return;
    }

    case 'match': {
      const { matchShots } = await import('../src/analyze.mjs');
      let tl = T.load(dir);
      const r = await matchShots(tl, dir, { reference: o.ref, strength: num(o.strength) ?? 0.7 });
      for (const c of r.corrections) log(`  ${c.id.padEnd(4)} Y ${c.measured.Y} U ${c.measured.U} V ${c.measured.V}  -> exposure ${c.match.exposure} rm ${c.match.rm} bm ${c.match.bm}`);
      if (o.apply) {
        for (const c of r.corrections) {
          const clip = tl.tracks.video.find((x) => x.id === c.id);
          const g = typeof clip.grade === 'string' ? { preset: clip.grade } : { ...(clip.grade || {}) };
          if (!g.preset && tl.grade?.global) g.preset = tl.grade.global;
          tl = T.setProp(tl, c.id, 'grade', { ...g, match: c.match });
        }
        commit(dir, tl, `shot match (ref ${r.reference})`);
      }
      return;
    }

    case 'history': for (const h of T.history(dir)) log(`v${h.v}  ${h.time}  ${h.message}`); return;
    case 'revert': log(`now v${T.revert(dir, Number(pos[1]))}`); return;
    case 'diff': {
      const f = (v) => readJSON(join(dir, 'versions', `${String(v).padStart(4, '0')}.json`));
      const a = f(pos[1]), b = pos[2] ? f(pos[2]) : T.load(dir);
      const d = T.diff(a, b); log(d.length ? d.join('\n') : 'no differences'); return;
    }

    case 'still': {
      const { still } = await import('../src/render.mjs');
      log(await still(dir, Number(pos[1]), { format: o.format })); return;
    }
    case 'render': {
      const { render } = await import('../src/render.mjs');
      const formats = o.format === 'all' ? Object.keys(T.FORMATS).filter((f) => f !== 'wide-4k' && f !== 'cinema-239') : [o.format];
      for (const f of formats) await render(dir, { format: f, quality: o.draft ? 'draft' : 'final', from: num(o.from), to: num(o.to), noQc: !!o.noQc });
      return;
    }
    case 'qc': {
      const { qc } = await import('../src/qc.mjs');
      const tl = T.load(dir); const file = resolve(pos[1]);
      const p = await probe(file);
      await qc(file, { tl, expect: { width: tl.width, height: tl.height, fps: tl.fps, duration: T.layout(tl).duration, hasAudio: p.hasAudio }, outDir: join(dir, 'renders'), name: basename(file).replace(/\.[^.]+$/, '') });
      return;
    }
    case 'contact': {
      const { contactSheet } = await import('../src/qc.mjs');
      const file = resolve(pos[0]);
      log(await contactSheet(file, pos[1] ? resolve(pos[1]) : file.replace(/\.[^.]+$/, '.contact.png'))); return;
    }
    case 'export-hf': {
      const { exportHyperFrames } = await import('../src/hyperframes.mjs');
      log(await exportHyperFrames(dir)); return;
    }
    case 'library': {
      const what = pos[0] || 'components';
      if (what === 'formats') for (const [k, f] of Object.entries(T.FORMATS)) log(`${k.padEnd(12)} ${f.width}x${f.height} @${f.fps}  ${f.label}`);
      if (what === 'grades') for (const [k, g] of Object.entries(readJSON(join(LIBRARY_DIR, 'color', 'grades.json')))) if (!k.startsWith('_')) log(`${k.padEnd(22)} ${g.description}`);
      if (what === 'transitions') for (const [k, g] of Object.entries(readJSON(join(LIBRARY_DIR, 'transitions', 'transitions.json')))) if (!k.startsWith('_')) log(`${k.padEnd(14)} ${g.engine.padEnd(6)} ${String(g.dur).padEnd(5)} ${g.when}`);
      if (what === 'sfx') { const { SFX } = await import('../src/audio.mjs'); log(Object.keys(SFX).join(', ')); }
      if (what === 'components') {
        const { readdirSync } = await import('node:fs');
        for (const f of readdirSync(join(LIBRARY_DIR, 'motion', 'components')).sort()) {
          const code = readFileSync(join(LIBRARY_DIR, 'motion', 'components', f), 'utf8');
          for (const m of code.matchAll(/D\.register\('(\w+)',\s*\{\s*description:\s*'([^']*)'/g)) log(`${m[1].padEnd(16)} [${f.replace('.js', '')}] ${m[2]}`);
        }
      }
      return;
    }
    default: throw new Error(`Unknown command "${cmd}". Run: domus help`);
  }
}

main().catch((e) => { console.error(`error: ${e.message}`); process.exitCode = 1; });
