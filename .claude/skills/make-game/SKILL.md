---
name: make-game
description: Build a new browser game (or a major new mode for one) in this repo from a prompt. Use when asked to make, build, create, or prototype a game, or remix an existing one into a new game.
---

# Make a game

Target: a game that is **fun within 10 seconds of pressing play**, verified by playtest, in **under 30 minutes**.

**Time budget.** Run `date` at the start and at each step; if a step overruns, cut scope in the next one, never the verify, polish or kid-check steps. **Use the whole budget:** finishing a step early means more time for step 6, not an early hand-off. A build that hands off at 0:12 has skipped the polish the user is waiting for.

| Step | Budget | Done by |
|---|---|---|
| 1. Design | 2 min | 0:02 |
| 2. Scaffold | 1 min | 0:03 |
| 3. Core verb | 8 min | 0:11 |
| 4. Complete the loop | 4 min | 0:15 |
| 5. Verify | 3 min | 0:18 |
| 6. Polish the look | 6 min | 0:24 |
| 7. Kid check | 5 min | 0:29 |
| 8. Hand off | 1 min | 0:30 |

Scope down before you polish up: one core verb done with great feel beats five half-done systems. Scope means **features**, never looks: a 10-minute game is a smaller game that still clears the visual bar (step 5) and still gets a polish pass (step 6). When the user gives a different time ("in 15 minutes", "take an hour"), scale every row.

## 1. Design (~10 lines in your reply, then build)

- **Core verb** — what the player does every second (shoot, jump, slice, place, steer).
- **Loop** — verb → reward → escalation → fail/win → instant retry.
- **Base** — pick the closest starting point (`npm run new` with no args lists them):

| Idea shape | Start from |
|---|---|
| Anything 2D that fits nothing below | `--template blank` |
| Shooter, survivors-like, top-down action, many enemies | `--template topdown` (or `--from neon-swarm` for the polished version) |
| Platformer, side-scroller, runner | `--template platformer` |
| Turn-based, grid, tiles, logic, match-3, tactics | `--template puzzle` |
| Real rigid bodies: stacking, slingshot, golf, ragdoll | `--template physics` |
| Needs 3D | `--template 3d`: a world that already clears the visual bar (sky, sun shadows, textured ground, props, animated character). Keep that look and swap the setting (ground texture, HDRI, props, character). `--template 3d-neon` only for an abstract neon style |

- **Art & sound** — for a realistic look use the realism stack (AGENTS.md › Realistic 3D) with Rocketbox people, Poly Haven/ambientCG materials and `buildCity`/`buildCar`; otherwise pick packs from the asset library (`assets/CATALOG.md`): animated characters from whichever pack fits (`kaykit-adventurers`, `kaykit-skeletons`, `blocky-characters`, `mini-characters`, `graveyard-kit` — see the table in AGENTS.md; vary it between games), props from the matching kit, a Poly Haven texture/sky for surfaces, footsteps/impacts/voice from the sound packs. If nothing fits, `npm run assets -- add <kenney-slug>` (browse kenney.nl/assets) before falling back to procedural art.
- **Juice plan** — which feedback fires on the core verb, on reward, on damage ([game-feel.md](game-feel.md)).
- **Out of scope** — name what you're NOT building this session.

Ask the user only if the genre itself is ambiguous; otherwise pick the most fun interpretation and say what you picked.

## 2. Scaffold

`npm run new -- <slug> --template <t> --title "Title" --tagline "One line"`, then fill in `games/<slug>/GAME.md` (pitch, loop, controls) and `game.json` controls/color. GAME.md is the game's memory across sessions — keep it current as you build.

**In Game Forge Studio** (`GAME_FORGE_STUDIO` is set): now run the `choose-look` skill. It shows the user 2–3 rendered options for each key visual and you **end your turn**; continue at step 3 when their picks arrive (the clock pauses while they choose).

## 3. Build the core verb first

Get the player moving and the core verb working with feedback before anything else. Most of the work is the game's Play scene; menus, pause, game over, best score, level-up cards come from the kit (`menuScene`, `gameOverScene`, `enablePause`, `chooseCard`).
- Art + sound: the asset library via `kit/assets.ts` (models, animations, textures, skies, recorded sounds, sprite sheets) — see the Asset library section of AGENTS.md. Procedural `kit/phaser/textures.ts` / `kit/audio.ts` for abstract styles, effects and synth SFX. Feel: `Juice`.
- Every tuning number goes in the game's `config.ts` and through `tune(obj, 'Name')` so `?tune` shows live sliders.
- Systems to reuse rather than rewrite: `Director` (waves), `Upgrades` (roguelite picks), `Grid` (A*, flood fill), `Fsm` (AI/states), `Pool` + `SpatialHash` (>100 entities), `buildLevel` (ASCII levels), `TouchPad` (mobile).
- Add debug URL params as you go (`?god`, `?level=`, `?wave=`) so playtests can reach late-game states.
- Puzzle games: write a quick brute-force solver to prove each level is solvable before shipping it.

## 4. Complete the loop

Menu → play → game over → instant retry (R/Space). Score + persisted best. Escalation over time. Mute on M, pause on Esc (both free via the kit).

## 5. Verify

Done means all of:
- `npm run check` passes (a hook also type-checks after every edit).
- `npm run shot -- <slug> --gpu --seconds 20` exits clean, AND you open every screenshot it lists (exact paths, don't guess names) and `__playtest` state shows the loop progressing (score rising, enemies dying, levels reached). Use `--eval` to force states the bot can't reach.
- **The visual bar.** It is the floor, not the goal. Every game needs:
  - **3D:** `realism(game, { sun })` from `kit/three/realism.ts` (sky, image lighting, shadows, AO, bloom, tone mapping), or `bootThree` + `loadHdri(scene, '<id>', { background: true })` with shadows on. Never a black or flat void above the world.
  - **Every visible surface is textured or a library model.** Ground, walls, platforms and big rocks use a PBR texture (`loadTexture`, ~1 repeat per 3 m) or a textured model (Poly Haven rocks, cliffs and props for a realistic look). Never a large flat-coloured primitive: a box or icosahedron with one colour reads as placeholder art at any size.
  - **What the player holds or drives is a model,** not stacked boxes: a gun from `blaster-kit`, a car from `car-kit`, a sword from the dungeon kits. First person: the weapon fills the lower-right corner, lit by the scene, with recoil.
  - **Dressing:** at least 3 kinds of props in every view (cover, debris, plants, lights, signs), placed in clusters rather than a uniform scatter, plus something in the far distance (cliffs, skyline, mountains, HDRI) so the world has depth.
  - **The core verb is a light show:** a muzzle flash or swing trail with a short-lived `PointLight`, tracers or projectiles that glow under bloom, impact sparks or debris (`kit/three/debris.ts`, `particle-pack` sprites), hit flash on the target, and camera shake on big hits.
  - **Enemies and pickups read at a glance:** big enough on screen in the gameplay screenshot to see what they are, with a coloured silhouette or rim against the background.
  - **2D:** sprites from a pack, or one deliberate procedural style with a palette; a background with depth (gradient, parallax or tiles), never a flat fill.
  - **HUD:** readable over the scene and fits at 1280×720: no wrapped labels, overlapping panels or text off-screen. Check it in the screenshots.
- Every item in [game-feel.md](game-feel.md) is present or consciously skipped.
- fps ≥ 55 in the `--gpu` run. **Buy fps with render settings, never with looks.** On a slow GPU (integrated graphics often gives 20–30 fps at first), lower the cost per pixel: `maxPixelRatio: 1` or a 0.75 render scale, a 2048 shadow map, AO at half resolution or off, fewer shadow-casting lights, instancing for repeated props, fog to shorten the draw distance. Don't delete models, textures, props or effects to hit the number; a game that looks worse at 60 fps is the wrong trade.

## 6. Polish the look

Spend the rest of the time on how the game looks, in rounds:
1. `npm run shot -- <slug> --gpu --seconds 20` and open the gameplay screenshots.
2. Imagine the screenshot on a Steam store page next to a shipped indie game. Write the **3 weakest things on screen** (a flat-coloured rock, a boxy gun, empty sand, tiny enemies, no flash when shooting, a plain HUD panel) and fix those three: swap in library models and textures, add props, lights, particles and colour.
3. Re-shoot and compare against the last round. Keep fps ≥ 55.

Repeat until the step's time is up; usually 2–3 rounds. Write what changed in GAME.md's Status.

## 7. Kid check

Run the `kid-check` skill: find the 5 things a kid would say look wrong, stage a small tested fix for each (`npm run fixes`), and list them in chat so the user can say "fix 2" and get it instantly.

## 8. Hand off

Run `npm run thumbs -- <slug>` (title-screen thumbnail for the arcade and Studio). Tell the user: how long the build took, `npm run play -- <slug>` (opens it), the 5 kid-check problems (numbered, kid-phrased, with "say fix 2 / fix all"), the controls, `?tune` for live sliders, what you tuned for fun, what you'd add next. Update GAME.md's Status and Ideas.
