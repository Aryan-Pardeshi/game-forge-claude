// Download the asset library (~2 GB, ~10,000 files) from npmiaman/game-forge into assets/.
// Node builtins only, no git needed. Skips files already present with the right size, so it resumes.
//   node scripts/fetch-assets.mjs [--ref main] [--jobs 16]
import { createWriteStream, existsSync, mkdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const REPO = 'npmiaman/game-forge', REF = arg('--ref', 'main'), JOBS = Number(arg('--jobs', '16'));

const res = await fetch(`https://api.github.com/repos/${REPO}/git/trees/${REF}?recursive=1`, { headers: { 'User-Agent': 'game-forge-claude' } });
if (!res.ok) { console.error(`GitHub API ${res.status}: ${await res.text()}`); process.exit(1); }
const tree = await res.json();
const all = tree.tree.filter((t) => t.type === 'blob' && t.path.startsWith('assets/'));
const todo = all.filter((t) => { const f = join(ROOT, t.path); return !existsSync(f) || statSync(f).size !== t.size; });
const total = todo.reduce((s, t) => s + t.size, 0);
console.log(`${all.length} asset files; ${todo.length} to download (${(total / 1e9).toFixed(2)} GB)`);

let done = 0, bytes = 0, failed = [], last = 0;
async function get(t) {
  const f = join(ROOT, t.path), url = `https://raw.githubusercontent.com/${REPO}/${tree.sha}/${t.path.split('/').map(encodeURIComponent).join('/')}`;
  mkdirSync(dirname(f), { recursive: true });
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await pipeline(Readable.fromWeb(r.body), createWriteStream(f + '.part'));
      renameSync(f + '.part', f);
      return;
    } catch (e) { if (i === 3) failed.push(`${t.path}: ${e.message}`); }
  }
}
const queue = [...todo];
await Promise.all(Array.from({ length: JOBS }, async () => {
  for (let t; (t = queue.shift()); ) {
    await get(t); done++; bytes += t.size;
    if (Date.now() - last > 3000 || done === todo.length) { last = Date.now(); console.log(`  ${done}/${todo.length} files, ${(bytes / 1e6).toFixed(0)} of ${(total / 1e6).toFixed(0)} MB`); }
  }
}));
if (failed.length) { console.error(`${failed.length} failed (re-run to retry):\n${failed.slice(0, 10).join('\n')}`); process.exit(1); }
writeFileSync(join(ROOT, 'assets/.full'), tree.sha);   // the SessionStart hook checks for this
console.log('assets ready');
