// Guard brains: a four-state patrol AI. A guard walks its waypoint loop,
// pauses at each point, investigates a noise or a half-seen player, chases
// when the alarm sounds, and searches the last seen spot before giving up
// and walking back to its patrol. Guards never know the player's position
// unless the world tells them: they chase a remembered point, not the player.

import { GUARD } from './config.js';
import { angleDiff } from './vision.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_CHASE = 'chase';
export const GUARD_SEARCH = 'search';

function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function moveToward(guard, tx, ty, speed, dt, solids) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return true;
  const stepX = (dx / d) * speed * dt;
  const stepY = (dy / d) * speed * dt;
  // Axis-separated movement: slide along walls instead of sticking on them.
  const nx = guard.x + stepX;
  if (!hitsSolid(nx, guard.y, guard.radius, solids)) guard.x = nx;
  const ny = guard.y + stepY;
  if (!hitsSolid(guard.x, ny, guard.radius, solids)) guard.y = ny;
  guard.facing = Math.atan2(dy, dx);
  return dist(guard.x, guard.y, tx, ty) < 6;
}

function hitsSolid(x, y, r, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    const s = solids[i];
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

export function createGuard(def, index) {
  const start = def.path[0];
  return {
    id: index,
    x: start[0],
    y: start[1],
    radius: GUARD.radius,
    facing: 0,
    state: GUARD_PATROL,
    path: def.path,
    waypoint: 1 % def.path.length,
    pause: 0,
    /** Where the guard is walking to investigate or search. */
    target: null,
    /** Seconds left in the current search or pause. */
    timer: 0,
    /** Seconds since this guard last saw the player. */
    sinceSeen: 99,
    /** True while the guard can currently see the player. */
    seesPlayer: false,
  };
}

/**
 * One fixed step. `ctx` carries the level solids, the player's position and
 * whether the world says this guard can see the player right now.
 * Returns nothing; the world reads the guard's state afterwards.
 */
export function updateGuard(guard, dt, ctx) {
  const { solids, playerX, playerY, seesPlayer, alarm } = ctx;
  guard.seesPlayer = seesPlayer;
  if (seesPlayer) {
    guard.sinceSeen = 0;
    guard.target = { x: playerX, y: playerY };
  } else {
    guard.sinceSeen += dt;
  }

  if (alarm && guard.state !== GUARD_CHASE) {
    guard.state = GUARD_CHASE;
    guard.timer = GUARD.chaseMemory;
  }

  if (guard.state === GUARD_CHASE) {
    if (seesPlayer) guard.timer = GUARD.chaseMemory;
    else guard.timer -= dt;
    if (guard.target) moveToward(guard, guard.target.x, guard.target.y, GUARD.chaseSpeed, dt, solids);
    if (guard.timer <= 0 && guard.sinceSeen > GUARD.chaseMemory) {
      guard.state = GUARD_SEARCH;
      guard.timer = GUARD.searchTime;
    }
    return;
  }

  if (guard.state === GUARD_SUSPICIOUS) {
    if (guard.target && moveToward(guard, guard.target.x, guard.target.y, GUARD.suspiciousSpeed, dt, solids)) {
      // Arrived and found nothing: look around, then go back to patrol.
      guard.timer -= dt;
      guard.facing += dt * 1.6;
      if (guard.timer <= 0) {
        guard.state = GUARD_PATROL;
        guard.target = null;
      }
    } else if (guard.target) {
      guard.timer = 1.2;
    }
    return;
  }

  if (guard.state === GUARD_SEARCH) {
    guard.timer -= dt;
    // Sweep the area: turn slowly, drift a little around the last seen spot.
    guard.facing += dt * 0.9;
    if (guard.target) {
      const a = guard.facing;
      moveToward(guard, guard.target.x + Math.cos(a) * 26, guard.target.y + Math.sin(a) * 26, GUARD.suspiciousSpeed * 0.4, dt, solids);
    }
    if (guard.timer <= 0) {
      guard.state = GUARD_PATROL;
      guard.target = null;
    }
    return;
  }

  // Patrol: walk to the next waypoint, pause, turn to the next one.
  if (guard.pause > 0) {
    guard.pause -= dt;
    if (guard.pause <= 0) {
      guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    }
    return;
  }
  const point = guard.path[guard.waypoint];
  if (moveToward(guard, point[0], point[1], GUARD.patrolSpeed, dt, solids)) {
    guard.pause = GUARD.waypointPause;
    const next = guard.path[(guard.waypoint + 1) % guard.path.length];
    guard.facing = Math.atan2(next[1] - guard.y, next[0] - guard.x);
  }
}

/** Send a guard to investigate a point (a noise, a half-seen player). */
export function sendToInvestigate(guard, x, y) {
  if (guard.state === GUARD_CHASE) return;
  guard.state = GUARD_SUSPICIOUS;
  guard.target = { x, y };
  guard.timer = 1.2;
}

/** How suspicious this guard looks right now, 0 (calm) to 1 (alarmed). */
export function guardAlertness(guard) {
  if (guard.state === GUARD_CHASE) return 1;
  if (guard.state === GUARD_SEARCH) return 0.75;
  if (guard.state === GUARD_SUSPICIOUS) return 0.5;
  return 0;
}

/** True when the guard's facing is roughly toward (x,y). Used for the "?" mark. */
export function guardLooksAt(guard, x, y) {
  return angleDiff(Math.atan2(y - guard.y, x - guard.x), guard.facing) < 0.9;
}
