# First-run setup (for Claude)

You are Claude Code in a fresh clone of Game Forge. Run these steps **in order, before the user's first request**, then carry on with that request. Each step checks first, so re-running is safe. Tell the user in plain words what you're doing ("Installing Node.js…", "Downloading the playtest browser (~150 MB)…"); they don't need to type anything.

Work from the repo root. On Windows you may be in PowerShell 5.1: no `&&` (use `;` or separate commands), quote every path, and `$env:PATH` instead of `$PATH`.

## 1. Node.js 20.19 or newer

```
node --version
```

If it prints `v20.19` or newer (v22, v24…), skip to step 2. Otherwise install the LTS:

| OS | Command | Fallback (no admin / command missing) |
|---|---|---|
| Windows | `winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements` | Download `https://nodejs.org/dist/latest-v22.x/node-v22.*-win-x64.zip` (look up the exact name in `https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt`), unzip into `.tools/node`, then `$env:PATH = "$PWD\.tools\node;$env:PATH"` |
| macOS | `brew install node` | Download the `darwin-arm64` (or `darwin-x64`) `.tar.gz` from the same folder, extract into `.tools/node`, then `export PATH="$PWD/.tools/node/bin:$PATH"` |
| Linux | `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh \| bash`, then `. ~/.nvm/nvm.sh; nvm install --lts` | The `linux-x64` `.tar.xz` into `.tools/node`, same PATH line as macOS |

After winget, the current shell doesn't see the new `node` yet. Refresh PATH for this session instead of asking for a restart:
`$env:PATH = [Environment]::GetEnvironmentVariable('PATH','Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH','User')`
Then run `node --version` again. If a fallback was used, tell the user once that `.tools/node` is in the repo and how to add it to PATH for their own terminal.

## 2. npm packages

Skip if `node_modules/vite` and `node_modules/playwright` both exist and `package-lock.json` hasn't changed since. Otherwise:

```
npm install
```

## 3. Playtest browser (Chromium for Playwright)

```
npx playwright install chromium
```

Already-installed browsers are skipped automatically. On Linux, if launching fails with missing libraries, run `npx playwright install --with-deps chromium` (needs sudo; ask the user).

## 4. Git (optional)

Git isn't needed to make games. If `git --version` fails, just mention that installing it (Windows: `winget install Git.Git`; macOS: `xcode-select --install`) lets them track changes.

## 5. Check it works

```
npm run check
npm run shot -- blast-ball --seconds 3
```

Open one screenshot it lists and confirm the game rendered (a 3D scene, not a black or blank page). The first `shot` can take a minute or two (software rendering, antivirus scanning Chromium).

## 6. Mark setup done

Write today's date to `.claude/.setup-done` (it's gitignored), for example `node -e "require('fs').writeFileSync('.claude/.setup-done', new Date().toISOString())"`. The SessionStart hook then stays quiet in later sessions.

Tell the user: **"Setup done. Describe the game you want and I'll build it."** Then follow CLAUDE.md for their request.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `EPERM … mkdir` or `rename` on Windows | A file watcher or antivirus holds the folder. Wait a second and retry once; edit files in place instead of deleting folders. |
| `npm install` hangs or `ETIMEDOUT` | Corporate proxy: `npm config set proxy http://host:port` and `https-proxy`, or `$env:HTTPS_PROXY`. |
| `Get-FileHash` / `iex` "is not recognized" | PowerShell 7 leaked its `PSModulePath` into Windows PowerShell 5.1. Run `Remove-Item Env:PSModulePath` in that shell, then retry. |
| `running scripts is disabled on this system` | `npm.ps1` blocked by execution policy: call `npm.cmd` / `npx.cmd` instead, or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (ask the user first). |
| First screenshot times out | Slow GPU or antivirus scanning Chromium. Retry once; `shot.mjs` already waits up to 2 minutes. |
| `node` not found after install | Refresh PATH (step 1) or open a new terminal. |
