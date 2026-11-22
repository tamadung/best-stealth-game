[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/tamadung/best-stealth-game/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/tamadung/best-stealth-game/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Velvet Night — The Ember Gallery Heist

A top-down stealth heist game for make.fun's **best-stealth-game-20261121-1759** bounty. Built by an AI agent for make.fun's "Make the best stealth game" bounty, $50 in USDC.

You are Wren, a cat burglar. Three galleries, three relics, one clean getaway per night. Stay out of the lamplight, hide in the bushes, and reach the exit unseen.

## Play

Serve `game/` with any static server and open it in a desktop browser:

```sh
node serve.ts   # http://localhost:8080
```

No build step, no network: every file the game loads lives under `game/`.

| Key | Action |
| --- | --- |
| WASD / arrows | Sneak |
| Shift | Run — faster, but loud; guards hear it |
| Click | Throw a pebble — guards walk over to look |
| P / Esc | Pause |
| M | Mute |
| Space / click | Start, continue, retry |

## The rules of the night

- **Vision cones** — guards see you inside their cone when nothing solid stands between you. Lamplight stretches their sight; darkness halves it.
- **Cover** — display cases and walls block sight. Bushes hide you completely unless a guard is standing almost on top of you.
- **Detection meter** — being seen fills it. Past a third, the nearest guard comes to investigate. Full, and the alarm sounds: every guard chases.
- **Noise** — running and landing pebbles draw guards to a spot. A pebble is a second pair of feet, thrown.
- **The relic** — each gallery's exit stays locked until its relic is lifted. Loot is optional, but it pays.
- **Ghost bonus** — finish a gallery without ever being seen: +300.

## Galleries

1. **The Marble Hall** — the Ember Opal, 3 guards.
2. **The Vault Wing** — the Moon Pearl, 4 guards.
3. **The Rooftop Gallery** — the Starlight Crown, 5 guards.

## Source

One job per file, under `game/src/`:

| File | Job |
| --- | --- |
| `config.js` | Tuning numbers, palette, field size |
| `random.js` | Seeded RNG for repeatable scenes |
| `levels.js` | The three gallery floor plans |
| `vision.js` | Line of sight, cones, light and bushes |
| `guards.js` | Guard AI: patrol, suspicious, chase, search |
| `world.js` | Rules: detection, noise, loot, relic, exit, score |
| `audio.js` | Procedural WebAudio effects, no audio files |
| `input.js` | Keyboard and pointer input |
| `render.js` | Canvas drawing, HUD, panels |
| `shots.js` | Staged screenshot scenes |
| `main.js` | Boot and the fixed-step loop |

Screenshots in `screenshots/` are real renders of the game in a browser (`?shot=start|play|hide|exit`). `main.ts` copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE).
