// Drawing only: the world's state and the current screen in, pixels out.
// The 1280x720 playfield is scaled to fit the window and centred, the
// margin filled with the backdrop colour. Flat shapes, radial light pools
// and canvas text for the HUD and the panels.

import { FIELD, FONT, GUARD, LIVES, PALETTE, PLAYER } from './config.js';
import { GUARD_CHASE, GUARD_SEARCH, GUARD_SUSPICIOUS, guardAlertness } from './guards.js';
import { LEVEL_TOTAL } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 150, line: 32, bottom: 74 };

function cachedLabel(prefix) {
  let value = null;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const bestLabel = cachedLabel('Best ');
  const timeLabel = cachedLabel('');
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align ?? 'left';
    context.fillText(value, x, y);
  }

  function plainText(value, x, y, size, color, align) {
    if (!fonts.has('p' + size)) fonts.set('p' + size, `${size}px ${FONT}`);
    context.font = fonts.get('p' + size);
    context.fillStyle = color;
    context.textAlign = align ?? 'left';
    context.fillText(value, x, y);
  }

  function circle(x, y, r, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }

  function drawFloor(level) {
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    // Checkerboard tiles, faint, so the floor reads as a gallery floor.
    context.fillStyle = PALETTE.floorAlt;
    for (let ty = 0; ty < 9; ty += 1) {
      for (let tx = 0; tx < 16; tx += 1) {
        if ((tx + ty) % 2 === 0) context.fillRect(tx * 80, ty * 80, 80, 80);
      }
    }
    context.strokeStyle = PALETTE.floorLine;
    context.lineWidth = 1;
    for (let tx = 0; tx <= 16; tx += 1) {
      context.beginPath();
      context.moveTo(tx * 80, 0);
      context.lineTo(tx * 80, FIELD.height);
      context.stroke();
    }
    for (let ty = 0; ty <= 9; ty += 1) {
      context.beginPath();
      context.moveTo(0, ty * 80);
      context.lineTo(FIELD.width, ty * 80);
      context.stroke();
    }
    // Lamp pools: warm light on the floor, and the dark between them.
    for (const lamp of level.lamps) {
      const glow = context.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
      glow.addColorStop(0, 'rgba(255, 207, 122, 0.34)');
      glow.addColorStop(0.7, 'rgba(255, 207, 122, 0.12)');
      glow.addColorStop(1, 'rgba(255, 207, 122, 0)');
      context.fillStyle = glow;
      context.beginPath();
      context.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
      context.fill();
      circle(lamp.x, lamp.y, 7, PALETTE.lampGlow);
      circle(lamp.x, lamp.y, 3, '#fff3d0');
    }
  }

  function drawWalls(level) {
    for (const wall of level.walls) {
      context.fillStyle = PALETTE.wall;
      context.fillRect(wall.x, wall.y, wall.w, wall.h);
      context.fillStyle = PALETTE.wallTop;
      context.fillRect(wall.x, wall.y, wall.w, 4);
    }
  }

  function drawCases(level) {
    for (const box of level.cases) {
      context.fillStyle = PALETTE.caseBase;
      context.fillRect(box.x, box.y, box.w, box.h);
      context.fillStyle = 'rgba(127, 212, 255, 0.28)';
      context.fillRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
      context.strokeStyle = PALETTE.caseGlass;
      context.lineWidth = 2;
      context.strokeRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
      context.beginPath();
      context.moveTo(box.x + 8, box.y + box.h - 8);
      context.lineTo(box.x + box.w - 20, box.y + 8);
      context.stroke();
    }
  }

  function drawBushes(level) {
    for (const bush of level.bushes) {
      circle(bush.x, bush.y, bush.r, PALETTE.bushDark);
      circle(bush.x - 12, bush.y - 8, bush.r * 0.55, PALETTE.bush);
      circle(bush.x + 14, bush.y + 6, bush.r * 0.6, PALETTE.bush);
      circle(bush.x + 4, bush.y - 14, bush.r * 0.5, PALETTE.bush);
      circle(bush.x - 4, bush.y + 14, bush.r * 0.45, '#3a7d47');
    }
  }

  function drawExit(level, open) {
    const exit = level.exit;
    context.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    context.fillRect(exit.x, exit.y, exit.w, exit.h);
    context.fillStyle = 'rgba(0,0,0,0.35)';
    context.fillRect(exit.x + 6, exit.y + 6, exit.w - 12, exit.h - 12);
    if (open) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 280);
      context.fillStyle = `rgba(88, 230, 160, ${0.25 + pulse * 0.25})`;
      context.fillRect(exit.x - 6, exit.y - 6, exit.w + 12, exit.h + 12);
      text('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 7, 20, '#062b18', 'center');
    } else {
      plainText('LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5, 13, PALETTE.text, 'center');
    }
  }

  function drawLoot(state) {
    for (const item of state.loot) {
      if (item.taken) continue;
      const bob = Math.sin(performance.now() / 300 + item.x) * 2;
      context.fillStyle = PALETTE.loot;
      context.beginPath();
      context.moveTo(item.x, item.y - 12 + bob);
      context.lineTo(item.x + 9, item.y + bob);
      context.lineTo(item.x, item.y + 12 + bob);
      context.lineTo(item.x - 9, item.y + bob);
      context.closePath();
      context.fill();
      context.fillStyle = '#fff6c9';
      context.beginPath();
      context.moveTo(item.x, item.y - 6 + bob);
      context.lineTo(item.x + 4, item.y + bob);
      context.lineTo(item.x, item.y + 6 + bob);
      context.lineTo(item.x - 4, item.y + bob);
      context.closePath();
      context.fill();
    }
    const relic = state.level.relic;
    if (!state.relicTaken) {
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 240);
      context.fillStyle = `rgba(255, 95, 162, ${0.25 * pulse})`;
      context.beginPath();
      context.arc(relic.x, relic.y, 30 + pulse * 6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.relic;
      context.beginPath();
      context.moveTo(relic.x, relic.y - 16);
      context.lineTo(relic.x + 13, relic.y);
      context.lineTo(relic.x, relic.y + 16);
      context.lineTo(relic.x - 13, relic.y);
      context.closePath();
      context.fill();
      context.fillStyle = '#ffd7ea';
      context.beginPath();
      context.moveTo(relic.x, relic.y - 7);
      context.lineTo(relic.x + 5, relic.y);
      context.lineTo(relic.x, relic.y + 7);
      context.lineTo(relic.x - 5, relic.y);
      context.closePath();
      context.fill();
    }
  }

  function drawCone(guard, level) {
    const lit = guard.seesPlayer;
    const range = guard.state === GUARD_CHASE ? GUARD.coneRangeLit : GUARD.coneRangeLit;
    const color = guard.state === GUARD_CHASE ? PALETTE.coneAlarm : lit ? PALETTE.coneLit : PALETTE.coneDark;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(guard.x, guard.y);
    context.arc(guard.x, guard.y, range, guard.facing - GUARD.coneHalfAngle, guard.facing + GUARD.coneHalfAngle);
    context.closePath();
    context.fill();
    context.strokeStyle = color.replace(/[\d.]+\)$/, '0.55)');
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(guard.x, guard.y);
    context.arc(guard.x, guard.y, range, guard.facing - GUARD.coneHalfAngle, guard.facing + GUARD.coneHalfAngle);
    context.closePath();
    context.stroke();
  }

  function drawGuards(state) {
    for (const guard of state.guards) {
      drawCone(guard, state.level);
    }
    for (const guard of state.guards) {
      // Body: red coat, dark hat, facing tick.
      circle(guard.x, guard.y, guard.radius, PALETTE.guard);
      circle(guard.x, guard.y, guard.radius * 0.62, '#e8e2d2');
      context.fillStyle = PALETTE.guardHat;
      context.beginPath();
      context.arc(guard.x, guard.y - 2, guard.radius * 0.62, Math.PI, 0);
      context.fill();
      context.fillRect(guard.x - guard.radius * 0.62, guard.y - 4, guard.radius * 1.24, 4);
      const fx = guard.x + Math.cos(guard.facing) * (guard.radius + 7);
      const fy = guard.y + Math.sin(guard.facing) * (guard.radius + 7);
      context.strokeStyle = '#fff';
      context.lineWidth = 2.5;
      context.beginPath();
      context.moveTo(guard.x + Math.cos(guard.facing) * guard.radius, guard.y + Math.sin(guard.facing) * guard.radius);
      context.lineTo(fx, fy);
      context.stroke();
      // State mark above the head: ? suspicious, ! chasing, … searching.
      const alert = guardAlertness(guard);
      if (guard.state === GUARD_CHASE) text('!', guard.x, guard.y - guard.radius - 10, 26, PALETTE.danger, 'center');
      else if (guard.state === GUARD_SUSPICIOUS) text('?', guard.x, guard.y - guard.radius - 10, 24, PALETTE.gold, 'center');
      else if (guard.state === GUARD_SEARCH) text('…', guard.x, guard.y - guard.radius - 8, 22, PALETTE.muted, 'center');
      else if (alert > 0) {
        context.fillStyle = 'rgba(242, 201, 76, 0.9)';
        context.fillRect(guard.x - 12, guard.y - guard.radius - 8, 24, 4);
      }
    }
  }

  function drawPlayer(state) {
    const player = state.player;
    const pebble = state.pebble;
    if (pebble) circle(pebble.x, pebble.y, 5, PALETTE.pebble);
    // Hidden ring: gold when lit (seen easily), teal when in shadow or bush.
    const ring = player.hidden ? '#58e6c8' : player.lit ? PALETTE.gold : '#7fa8ff';
    context.strokeStyle = ring;
    context.lineWidth = 2.5;
    context.beginPath();
    context.arc(player.x, player.y, PLAYER.radius + 6, 0, Math.PI * 2);
    context.stroke();
    // Hooded burglar: cloak, hood, face shadow, facing tick.
    context.fillStyle = PALETTE.playerCloak;
    context.beginPath();
    context.moveTo(player.x, player.y - PLAYER.radius);
    context.lineTo(player.x + PLAYER.radius, player.y + PLAYER.radius * 0.8);
    context.lineTo(player.x - PLAYER.radius, player.y + PLAYER.radius * 0.8);
    context.closePath();
    context.fill();
    circle(player.x, player.y - 3, PLAYER.radius * 0.72, PALETTE.player);
    context.fillStyle = '#2b2118';
    context.beginPath();
    context.arc(player.x, player.y - 3, PLAYER.radius * 0.45, 0, Math.PI * 2);
    context.fill();
    const fx = player.x + Math.cos(player.facing) * (PLAYER.radius + 6);
    const fy = player.y + Math.sin(player.facing) * (PLAYER.radius + 6);
    context.strokeStyle = '#fff';
    context.lineWidth = 2.5;
    context.beginPath();
    context.moveTo(player.x + Math.cos(player.facing) * PLAYER.radius * 0.6, player.y - 3 + Math.sin(player.facing) * PLAYER.radius * 0.6);
    context.lineTo(fx, fy - 3);
    context.stroke();
    // Running noise ring, so the player sees how loud they are.
    if (player.running) {
      context.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      context.lineWidth = 1.5;
      context.beginPath();
      context.arc(player.x, player.y, 135, 0, Math.PI * 2);
      context.stroke();
    }
    if (player.hidden) {
      plainText('HIDDEN', player.x, player.y - PLAYER.radius - 12, 13, '#58e6c8', 'center');
    } else if (player.lit) {
      plainText('IN LIGHT', player.x, player.y - PLAYER.radius - 12, 13, PALETTE.gold, 'center');
    }
  }

  function drawHud(state, best) {
    const level = state.level;
    context.textBaseline = 'top';
    text(scoreLabel(state.score), 28, 18, 26, PALETTE.text, 'left');
    text(`Gallery ${state.levelIndex + 1}/${LEVEL_TOTAL} · ${level.name}`, FIELD.width / 2, 18, 24, PALETTE.text, 'center');
    const mins = Math.floor(state.levelTime / 60);
    const secs = Math.floor(state.levelTime % 60);
    text(timeLabel(`${mins}:${String(secs).padStart(2, '0')}`), FIELD.width - 28, 18, 24, PALETTE.text, 'right');
    // Second row: lives, loot, relic, pebbles.
    context.textBaseline = 'alphabetic';
    for (let i = 0; i < LIVES; i += 1) {
      context.fillStyle = i < state.lives ? PALETTE.danger : 'rgba(255,255,255,0.15)';
      context.beginPath();
      context.arc(40 + i * 26, 66, 8, 0, Math.PI * 2);
      context.fill();
    }
    plainText(`Loot ${state.lootTaken}/${state.loot.length}`, 110, 71, 18, PALETTE.text, 'left');
    plainText(state.relicTaken ? `◆ ${level.relicName} taken` : `◇ Steal the ${level.relicName}`, 250, 71, 18, state.relicTaken ? PALETTE.relic : PALETTE.muted, 'left');
    plainText(`Pebbles ${state.pebbles}`, 560, 71, 18, PALETTE.text, 'left');
    plainText(state.exitOpen ? 'EXIT OPEN →' : 'Exit locked', 700, 71, 18, state.exitOpen ? PALETTE.exit : PALETTE.muted, 'left');
    // Detection meter, bottom centre: the most important number in the game.
    const meterW = 320;
    const meterX = (FIELD.width - meterW) / 2;
    const meterY = FIELD.height - 58;
    context.fillStyle = 'rgba(0,0,0,0.55)';
    context.fillRect(meterX - 10, meterY - 8, meterW + 20, 30);
    plainText('SEEN', meterX - 10, meterY + 12, 15, state.detection > 38 ? PALETTE.danger : PALETTE.muted, 'right');
    context.fillStyle = 'rgba(255,255,255,0.18)';
    context.fillRect(meterX, meterY, meterW, 14);
    const fill = state.detection / 100;
    context.fillStyle = fill > 0.66 ? PALETTE.danger : fill > 0.38 ? PALETTE.gold : '#7fa8ff';
    context.fillRect(meterX, meterY, meterW * fill, 14);
    if (state.alarm > 0) {
      text('!! ALARM !!', FIELD.width / 2, 100, 30, PALETTE.danger, 'center');
    }
    plainText('WASD move · Shift run (loud) · Click throw pebble · P pause · M mute', FIELD.width / 2, FIELD.height - 14, 14, PALETTE.muted, 'center');
  }

  function drawPanel(title, lines, prompt, accent) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(10, 12, 18, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = accent ?? PALETTE.panelEdge;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 74, 46, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      plainText(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 20, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 22, PALETTE.gold, 'center');
  }

  function drawField(state) {
    drawFloor(state.level);
    drawCases(state.level);
    drawBushes(state.level);
    drawExit(state.level, state.exitOpen);
    drawLoot(state);
    drawGuards(state);
    drawPlayer(state);
    drawWalls(state.level);
  }

  /** Paint one frame: the field, then the HUD or a panel for the screen. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state);
    if (screen === SCREEN_TITLE) {
      drawPanel(
        'VELVET NIGHT',
        [
          'A cat burglar, three galleries, one crown.',
          'Stay out of the lamplight. Hide in the bushes.',
          'Lift the relic, then reach the EXIT unseen.',
          'Guards patrol, grow suspicious, and chase when seen.',
          best > 0 ? bestLabel(best) : 'No heist yet — make it a clean one.',
        ],
        'Press Space or click to begin the heist',
      );
      return;
    }
    drawHud(state, best);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The guards wait. The lamplight does not.'], 'Press P to keep sneaking');
    } else if (screen === SCREEN_CLEAR) {
      drawPanel(
        `${state.level.name} — cleared`,
        [
          `Loot ${state.lootTaken}/${state.loot.length} · Score ${state.score}`,
          state.seenThisLevel ? 'Spotted at least once — the ghost bonus slipped away.' : 'GHOST: never seen. +300',
          `Next: ${LEVELS[state.levelIndex + 1].name}`,
        ],
        'Press Space for the next gallery',
        PALETTE.exit,
      );
    } else if (screen === SCREEN_CAUGHT) {
      drawPanel(
        'Caught!',
        [
          'A guard laid hands on you in the dark.',
          state.lives > 0 ? `${state.lives} ${state.lives === 1 ? 'life' : 'lives'} left — the gallery resets.` : '',
        ],
        'Press Space to try this gallery again',
        PALETTE.danger,
      );
    } else if (screen === SCREEN_WIN) {
      drawPanel(
        'THE CLEAN GETAWAY',
        [
          `All three galleries emptied. Final score ${state.score}.`,
          bestLabel(best),
          'Wren vanishes into the velvet night.',
        ],
        'Press Space to run it back',
        PALETTE.gold,
      );
    } else if (screen === SCREEN_OVER) {
      drawPanel(
        'The night wins',
        [`Final score ${state.score}.`, bestLabel(best)],
        'Press Space to start over',
        PALETTE.danger,
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return {
    draw,
    /** Convert a client (mouse) point to playfield coordinates. */
    toField(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const px = (clientX - rect.left) * ratio;
      const py = (clientY - rect.top) * ratio;
      return { x: (px - view.x) / view.scale, y: (py - view.y) / view.scale };
    },
  };
}

