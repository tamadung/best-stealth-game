// The game's rules and state, with no drawing and no browser in it: the
// player, the guards, detection, noise, loot, the relic, the exit, pebbles
// and the score. step() advances one fixed step and returns what happened as
// bit flags, so the caller can react without the world knowing about screens
// or sound.

import { DETECTION, FIELD, GUARD, LIVES, PEBBLES, PLAYER, SCORE } from './config.js';
import { LEVELS } from './levels.js';
import { createGuard, GUARD_CHASE, sendToInvestigate, updateGuard } from './guards.js';
import { angleDiff, hasLineOfSight, inBush, isLit } from './vision.js';

export const EVENT_PICKUP = 1;
export const EVENT_RELIC = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_LEVEL_CLEAR = 8;
export const EVENT_ALARM = 16;
export const EVENT_PEBBLE = 32;
export const EVENT_NOISE = 64;
export const EVENT_WIN = 128;

function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
}

function guardSeesPlayer(guard, level, player, hiddenInBush) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const d = Math.hypot(dx, dy);
  const lit = isLit(player.x, player.y, level.lamps);
  const range = lit ? GUARD.coneRangeLit : GUARD.coneRangeDark;
  if (d > range) return false;
  if (hiddenInBush && d > GUARD.bushSpotRange) return false;
  if (angleDiff(Math.atan2(dy, dx), guard.facing) > GUARD.coneHalfAngle) return false;
  return hasLineOfSight(guard.x, guard.y, player.x, player.y, level.solids);
}

export function createWorld() {
  const state = {
    levelIndex: 0,
    level: null,
    player: { x: 0, y: 0, facing: -Math.PI / 2, moving: false, running: false, lit: false, hidden: false },
    guards: [],
    loot: [],
    relicTaken: false,
    exitOpen: false,
    pebbles: PEBBLES,
    pebble: null,
    lives: LIVES,
    score: 0,
    detection: 0,
    alarm: 0,
    alarmRaised: false,
    time: 0,
    levelTime: 0,
    lootTaken: 0,
    seenThisLevel: false,
    status: 'playing',
  };

  function loadLevel(index) {
    const level = LEVELS[index];
    state.levelIndex = index;
    // Solids are walls plus display cases; computed once per level load.
    level.solids = [...level.walls, ...level.cases];
    state.level = level;
    state.player.x = level.playerStart.x;
    state.player.y = level.playerStart.y;
    state.player.facing = -Math.PI / 2;
    state.guards = level.guards.map((def, i) => createGuard(def, i));
    state.loot = level.loot.map((spot) => ({ x: spot.x, y: spot.y, taken: false }));
    state.relicTaken = false;
    state.exitOpen = false;
    state.pebbles = PEBBLES;
    state.pebble = null;
    state.detection = 0;
    state.alarm = 0;
    state.alarmRaised = false;
    state.levelTime = 0;
    state.lootTaken = 0;
    state.seenThisLevel = false;
    state.status = 'playing';
  }

  function reset() {
    state.lives = LIVES;
    state.score = 0;
    state.time = 0;
    loadLevel(0);
  }

  /** Throw a pebble toward (x,y): it lands, clicks, and guards come to look. */
  function throwPebble(x, y) {
    if (state.pebbles <= 0 || state.pebble || state.status !== 'playing') return false;
    state.pebbles -= 1;
    state.pebble = { x, y, landed: false, timer: 0.9, tx: x, ty: y, sx: state.player.x, sy: state.player.y };
    return true;
  }

  function movePlayer(dt, mx, my, running) {
    const player = state.player;
    const speed = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const len = Math.hypot(mx, my);
    player.moving = len > 0;
    player.running = running && len > 0;
    if (!player.moving) return;
    const nx = mx / len;
    const ny = my / len;
    player.facing = Math.atan2(ny, nx);
    const solids = state.level.solids;
    const stepX = nx * speed * dt;
    const stepY = ny * speed * dt;
    if (!solids.some((s) => circleHitsRect(player.x + stepX, player.y, PLAYER.radius, s))) {
      player.x += stepX;
    }
    if (!solids.some((s) => circleHitsRect(player.x, player.y + stepY, PLAYER.radius, s))) {
      player.y += stepY;
    }
    player.x = Math.max(24 + PLAYER.radius, Math.min(FIELD.width - 24 - PLAYER.radius, player.x));
    player.y = Math.max(24 + PLAYER.radius, Math.min(FIELD.height - 24 - PLAYER.radius, player.y));
  }

  /**
   * One fixed step. `input` is {mx, my, running}; `throwAt` is a point to toss
   * a pebble at, or null. Returns event bit flags.
   */
  function step(dt, input, throwAt) {
    let events = 0;
    if (state.status !== 'playing') return events;
    state.time += dt;
    state.levelTime += dt;
    const level = state.level;
    const player = state.player;

    if (throwAt && throwPebble(throwAt.x, throwAt.y)) events |= EVENT_PEBBLE;

    movePlayer(dt, input.mx, input.my, input.running);

    // Light and cover where the player stands, right now.
    player.lit = isLit(player.x, player.y, level.lamps);
    player.hidden = inBush(player.x, player.y, level.bushes);

    // The pebble flies, lands, and clicks: nearby guards investigate.
    if (state.pebble) {
      const p = state.pebble;
      p.timer -= dt;
      const t = Math.max(0, 1 - p.timer / 0.9);
      p.x = p.sx + (p.tx - p.sx) * t;
      p.y = p.sy + (p.ty - p.sy) * t;
      if (p.timer <= 0 && !p.landed) {
        p.landed = true;
        p.timer = 0.4;
        events |= EVENT_NOISE;
        for (const guard of state.guards) {
          if (Math.hypot(guard.x - p.x, guard.y - p.y) < 320) sendToInvestigate(guard, p.x, p.y);
        }
      } else if (p.landed && p.timer <= 0) {
        state.pebble = null;
      }
    }

    // Running is loud: guards close by come to look.
    if (player.running) {
      for (const guard of state.guards) {
        if (Math.hypot(guard.x - player.x, guard.y - player.y) < PLAYER.noiseRadius) {
          sendToInvestigate(guard, player.x, player.y);
          events |= EVENT_NOISE;
        }
      }
    }

    // Detection: any guard with the player in its cone fills the meter.
    let seen = false;
    let fillRate = 0;
    for (const guard of state.guards) {
      const canSee = guardSeesPlayer(guard, level, player, player.hidden);
      if (canSee) {
        seen = true;
        fillRate = Math.max(fillRate, player.lit ? DETECTION.fillLit : DETECTION.fillDark);
      }
      updateGuard(guard, dt, {
        solids: level.solids,
        playerX: player.x,
        playerY: player.y,
        seesPlayer: canSee,
        alarm: state.alarm > 0,
      });
    }
    if (seen) {
      state.detection = Math.min(DETECTION.alarmAt, state.detection + fillRate * dt);
      state.seenThisLevel = true;
      if (state.detection >= DETECTION.suspiciousAt) {
        for (const guard of state.guards) {
          if (guard.seesPlayer && guard.state !== GUARD_CHASE) sendToInvestigate(guard, player.x, player.y);
        }
      }
      if (state.detection >= DETECTION.alarmAt && state.alarm <= 0) {
        state.alarm = DETECTION.alarmTime;
        events |= EVENT_ALARM;
      }
    } else {
      state.detection = Math.max(0, state.detection - DETECTION.decay * dt);
    }
    if (state.alarm > 0) {
      state.alarm -= dt;
      if (state.alarm <= 0) state.alarm = 0;
    }

    // Caught: a chasing guard touches the player.
    for (const guard of state.guards) {
      if (guard.state === GUARD_CHASE && Math.hypot(guard.x - player.x, guard.y - player.y) < guard.radius + PLAYER.radius - 2) {
        state.lives -= 1;
        events |= EVENT_CAUGHT;
        state.status = state.lives <= 0 ? 'over' : 'caught';
        return events;
      }
    }

    // Loot and the relic.
    for (const item of state.loot) {
      if (!item.taken && Math.hypot(item.x - player.x, item.y - player.y) < PLAYER.radius + 16) {
        item.taken = true;
        state.lootTaken += 1;
        state.score += SCORE.loot;
        events |= EVENT_PICKUP;
      }
    }
    if (!state.relicTaken && Math.hypot(level.relic.x - player.x, level.relic.y - player.y) < PLAYER.radius + 18) {
      state.relicTaken = true;
      state.exitOpen = true;
      state.score += SCORE.relic;
      events |= EVENT_RELIC;
    }

    // The exit, once the relic is lifted.
    const exit = level.exit;
    if (state.exitOpen && player.x > exit.x && player.x < exit.x + exit.w && player.y > exit.y && player.y < exit.y + exit.h) {
      const ghost = !state.seenThisLevel;
      state.score += Math.max(0, Math.round((120 - state.levelTime) * SCORE.levelTimeBonus / 10)) * 10;
      if (ghost) state.score += SCORE.ghostBonus;
      if (state.levelIndex + 1 >= LEVELS.length) {
        state.status = 'won';
        events |= EVENT_WIN;
      } else {
        state.status = 'clear';
        events |= EVENT_LEVEL_CLEAR;
      }
    }
    return events;
  }

  /** After a caught screen, restart this level with one life fewer. */
  function retryLevel() {
    loadLevel(state.levelIndex);
  }

  /** After a level-clear screen, step into the next gallery. */
  function nextLevel() {
    loadLevel(state.levelIndex + 1);
  }

  reset();
  return { state, reset, step, retryLevel, nextLevel, loadLevel };
}

// Number of heists, for the HUD and the win screen.
export const LEVEL_TOTAL = LEVELS.length;
