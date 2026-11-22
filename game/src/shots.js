// The screenshot scenes behind ?shot=start|play|hide|exit. Each one stages
// the real world into a chosen moment — guards mid-patrol, the player
// sneaking, hiding, or slipping out — then the renderer paints it twice and
// main.js sets window.__shotReady. Nothing here fakes a frame: every pixel
// is the game's own renderer drawing its own state.

import { DETECTION, STEP } from './config.js';
import { GUARD_CHASE, GUARD_SUSPICIOUS, sendToInvestigate } from './guards.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function placeGuard(world, index, x, y, facing) {
  const guard = world.state.guards[index];
  guard.x = x;
  guard.y = y;
  guard.facing = facing;
  guard.pause = 0;
  return guard;
}

function placePlayer(world, x, y, facing) {
  const player = world.state.player;
  player.x = x;
  player.y = y;
  player.facing = facing;
  player.moving = true;
  player.running = false;
  return player;
}

/** Advance the world a few steps so light, cover and detection settle. */
function settle(world, seconds) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, { mx: 0, my: 0, running: false }, null);
    if (world.state.status !== 'playing') break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Any other name is the start scene.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    // Mid-heist: the player has lifted one loot piece, a guard's cone is
    // sweeping toward them, and the meter is a third full.
    world.loadLevel(0);
    placePlayer(world, 640, 300, -Math.PI / 2);
    placeGuard(world, 0, 420, 360, 0);
    placeGuard(world, 1, 520, 180, Math.PI / 2);
    placeGuard(world, 2, 1180, 420, -Math.PI / 2);
    world.state.loot[0].taken = true;
    world.state.lootTaken = 1;
    world.state.score = 100;
    world.state.detection = DETECTION.suspiciousAt;
    settle(world, 0.4);
    return { screen: SCREEN_PLAY, best: 0 };
  }

  if (name === 'hide') {
    // The player is flat inside a bush while a guard's cone washes over it:
    // the HIDDEN ring and the half-full meter tell the whole stealth story.
    world.loadLevel(0);
    placePlayer(world, 460, 140, Math.PI / 4);
    const guard = placeGuard(world, 0, 560, 140, Math.PI);
    sendToInvestigate(guard, 460, 140);
    guard.state = GUARD_SUSPICIOUS;
    placeGuard(world, 1, 520, 420, -Math.PI / 2);
    placeGuard(world, 2, 1180, 200, Math.PI);
    world.state.loot[0].taken = true;
    world.state.loot[1].taken = true;
    world.state.lootTaken = 2;
    world.state.score = 200;
    world.state.detection = 55;
    settle(world, 0.4);
    return { screen: SCREEN_PLAY, best: 200 };
  }

  if (name === 'exit') {
    // The end of the third gallery: relic lifted, exit open and glowing, the
    // player one step from the door with a guard in full chase behind.
    world.loadLevel(2);
    world.state.relicTaken = true;
    world.state.exitOpen = true;
    world.state.score = 250;
    for (const item of world.state.loot) {
      item.taken = true;
    }
    world.state.lootTaken = world.state.loot.length;
    world.state.score += 500;
    placePlayer(world, 180, 90, Math.PI);
    const chaser = placeGuard(world, 3, 420, 460, Math.PI);
    chaser.state = GUARD_CHASE;
    chaser.target = { x: 180, y: 90 };
    placeGuard(world, 0, 440, 300, -Math.PI / 2);
    placeGuard(world, 1, 700, 200, 0);
    placeGuard(world, 2, 900, 520, Math.PI / 2);
    placeGuard(world, 4, 640, 180, Math.PI / 2);
    world.state.detection = 100;
    world.state.alarm = 3;
    settle(world, 0.25);
    return { screen: SCREEN_PLAY, best: 750 };
  }

  // start: the title screen over the first gallery, guards already walking.
  world.loadLevel(0);
  placeGuard(world, 0, 640, 360, 0);
  placeGuard(world, 1, 520, 320, Math.PI / 2);
  placeGuard(world, 2, 1180, 320, -Math.PI / 2);
  settle(world, 0.5);
  return { screen: SCREEN_TITLE, best: 0 };
}

/** The four shots the maker takes, in the order they are filed. */
export const SHOT_NAMES = ['start', 'play', 'hide', 'exit'];
