// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between seven screens:
// title, play, paused, level-clear, caught, win and game over.
//
// ?shot=start|play|hide|exit stages that scene instead of running the loop,
// paints it twice and sets window.__shotReady for a screenshot.

import { BEST_KEY, LIVES, STEP } from './config.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_CLEAR, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT_ALARM, EVENT_CAUGHT, EVENT_LEVEL_CLEAR, EVENT_NOISE, EVENT_PEBBLE, EVENT_PICKUP, EVENT_RELIC, EVENT_WIN } from './world.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let stepAlt = false;
  let stepTimer = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    audio.unlock();
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Playing. ${LIVES} lives. Steal the relic, reach the exit unseen.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Game over. Score ${world.state.score}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound muted.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) startGame();
      else if (screen === SCREEN_CLEAR) {
        world.nextLevel();
        screen = SCREEN_PLAY;
        announce(`Gallery ${world.state.levelIndex + 1}: ${world.state.level.name}.`);
      } else if (screen === SCREEN_CAUGHT) {
        world.retryLevel();
        screen = SCREEN_PLAY;
        announce('Trying the gallery again.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
    }
  }

  function react(events) {
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_RELIC) {
      audio.relic();
      announce('Relic lifted — the exit is open!');
    }
    if (events & EVENT_PEBBLE) audio.pebble();
    if (events & EVENT_NOISE) audio.noise();
    if (events & EVENT_ALARM) {
      audio.alarm();
      announce('Alarm! Every guard is coming for you.');
    }
    if (events & EVENT_CAUGHT) {
      audio.caught();
      if (world.state.status === 'over') endGame();
      else {
        screen = SCREEN_CAUGHT;
        announce('Caught! Press Space to try the gallery again.');
      }
    }
    if (events & EVENT_LEVEL_CLEAR) {
      audio.levelClear();
      screen = SCREEN_CLEAR;
      announce(`${world.state.level.name} cleared. Score ${world.state.score}.`);
    }
    if (events & EVENT_WIN) {
      audio.win();
      screen = SCREEN_WIN;
      if (world.state.score > best) {
        best = world.state.score;
        saveBest(best);
      }
      announce(`The clean getaway! Final score ${world.state.score}.`);
    }
  }

  function step() {
    if (screen !== SCREEN_PLAY) return;
    const move = input.moveVector();
    const click = input.takeClick();
    const throwAt = click ? renderer.toField(click.clientX, click.clientY) : null;
    const events = world.step(STEP, { mx: move.mx, my: move.my, running: input.running() }, throwAt);
    // Footsteps: a soft tap every step while moving.
    if (world.state.player.moving) {
      stepTimer -= STEP;
      if (stepTimer <= 0) {
        audio.step(stepAlt);
        stepAlt = !stepAlt;
        stepTimer = world.state.player.running ? 0.22 : 0.34;
      }
    }
    react(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting guards close in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Velvet Night. Press Space or click to begin the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
