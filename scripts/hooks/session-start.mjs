// SessionStart hook: on a fresh clone, tell Claude to run SETUP.md before anything else.
// Node builtins only (runs before `npm install`). Prints nothing once setup is done. Always exits 0.
// If Node itself is missing this hook can't run; CLAUDE.md carries the same instruction as a fallback.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const has = (p) => existsSync(join(root, p));
const [major, minor] = process.versions.node.split('.').map(Number);
const missing = [];
if (major < 20 || (major === 20 && minor < 19)) missing.push(`Node ${process.versions.node} is too old (need 20.19+)`);
if (!has('node_modules/vite') || !has('node_modules/playwright')) missing.push('npm packages are not installed');
if (!has('assets/.full')) missing.push('only the starter assets are here; the full library is not downloaded');
if (!has('.claude/.setup-done')) missing.push('first-run setup has not been completed');

if (missing.length) {
  console.log(`FIRST RUN: this Game Forge checkout is not set up yet (${missing.join('; ')}).
Before doing anything else, read SETUP.md and run every step in it: it installs Node if needed, the npm packages, the asset library and the playtest browser, then checks that a game builds and screenshots. Tell the user in one line that you're setting things up (takes a few minutes), then continue with their request.`);
}
process.exit(0);
