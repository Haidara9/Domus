// Linked assets: download footage/music/fonts from a URL into a production, verify, and record the
// source in media/manifest.json so a fresh clone can restore files that are too large for git.
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, renameSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ensureDir, exists, log, readJSON, writeJSON } from './util.mjs';

export const GIT_LIMIT = 95 * 1024 * 1024; // GitHub rejects files over 100 MB

// Google Drive / Dropbox share links -> direct download URLs.
export function directUrl(url) {
  const gd = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/.exec(url);
  if (gd) return `https://drive.google.com/uc?export=download&confirm=t&id=${gd[1]}`;
  if (/dropbox\.com/.test(url)) return url.replace(/([?&])dl=0/, '$1dl=1').replace(/^(?!.*[?&]dl=1)(.*)$/, (m) => (m.includes('?') ? m + '&dl=1' : m + '?dl=1'));
  return url;
}

const sha256 = (p) => new Promise((res, rej) => { const h = createHash('sha256'); createReadStream(p).on('data', (d) => h.update(d)).on('end', () => res(h.digest('hex'))).on('error', rej); });

function nameFrom(res, url) {
  const cd = res.headers.get('content-disposition') || '';
  const m = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
  if (m) return decodeURIComponent(m[1] || m[2]);
  return basename(new URL(url).pathname) || 'download.bin';
}

export async function fetchAsset(dir, url, { name } = {}) {
  const mdir = ensureDir(join(dir, 'media'));
  const manPath = join(mdir, 'manifest.json');
  const man = exists(manPath) ? readJSON(manPath) : { assets: [] };
  const known = man.assets.find((a) => a.url === url);
  if (known && exists(join(dir, known.path))) { log(`already present: ${known.path} (skipped)`); return { path: join(dir, known.path), skipped: true }; }
  const res = await fetch(directUrl(url), { redirect: 'follow' });
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status} for ${url}`);
  if ((res.headers.get('content-type') || '').includes('text/html')) throw new Error(`the link returned a web page, not a file (is it shared publicly / a direct link?): ${url}`);
  const file = name || nameFrom(res, url);
  const dest = join(mdir, file);
  if (exists(dest) && !known) throw new Error(`${relative(dir, dest)} already exists from another source; pass --name`);
  const tmp = dest + '.part';
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
  renameSync(tmp, dest);
  const size = statSync(dest).size, hash = await sha256(dest);
  const entry = { path: relative(dir, dest), url, sha256: hash, size, fetched: new Date().toISOString(), inGit: size <= GIT_LIMIT };
  man.assets = man.assets.filter((a) => a.url !== url).concat(entry);
  writeJSON(manPath, man);
  log(`fetched ${entry.path} (${(size / 1048576).toFixed(1)} MB)${entry.inGit ? '' : '  > 95 MB: kept out of git (listed in .gitignore), restore with `domus fetch <dir>`'}`);
  if (!entry.inGit) {
    const gi = join(dir, '.gitignore');
    const { appendFileSync, readFileSync } = await import('node:fs');
    const cur = exists(gi) ? readFileSync(gi, 'utf8') : '';
    if (!cur.split('\n').includes(entry.path)) appendFileSync(gi, `${entry.path}\n`);
  }
  return { path: dest, ...entry };
}

export async function restoreAssets(dir) {
  const manPath = join(dir, 'media', 'manifest.json');
  if (!exists(manPath)) { log('no media/manifest.json'); return; }
  for (const a of readJSON(manPath).assets) {
    if (exists(join(dir, a.path))) { const h = await sha256(join(dir, a.path)); log(`${h === a.sha256 ? 'ok      ' : 'CHANGED '} ${a.path}`); continue; }
    await fetchAsset(dir, a.url, { name: basename(a.path) });
  }
}
