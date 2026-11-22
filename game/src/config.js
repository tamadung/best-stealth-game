// Every tuning number and colour in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule
// below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  walkSpeed: 175,
  runSpeed: 285,
  /** Running is loud: guards inside this radius hear it and come to look. */
  noiseRadius: 135,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 72,
  suspiciousSpeed: 115,
  chaseSpeed: 168,
  /** Half-angle of a vision cone, in radians. */
  coneHalfAngle: 0.66,
  /** How far a guard sees a lit player; in darkness the range is halved. */
  coneRangeLit: 285,
  coneRangeDark: 150,
  /** A guard standing almost on top of a bush still spots the player inside. */
  bushSpotRange: 46,
  /** Seconds a guard waits at each patrol waypoint. */
  waypointPause: 1.1,
  /** Seconds a guard keeps chasing after losing sight before giving up. */
  chaseMemory: 2.2,
  /** Seconds a guard searches the last seen spot before returning to patrol. */
  searchTime: 3.2,
};

export const DETECTION = {
  /** Meter points per second while a lit player is inside a cone. */
  fillLit: 62,
  /** Slower in darkness: shadows buy time. */
  fillDark: 30,
  /** How fast the meter drains when nobody sees the player. */
  decay: 26,
  /** Above this the nearest guard gets suspicious and walks over to look. */
  suspiciousAt: 38,
  /** Full meter: the alarm sounds and every guard chases. */
  alarmAt: 100,
  /** Seconds the alarm stays up after the player breaks sight. */
  alarmTime: 4,
};

export const PEBBLES = 3;
export const LIVES = 3;

export const SCORE = {
  loot: 100,
  relic: 250,
  levelTimeBonus: 12,
  ghostBonus: 300,
  pebbleRefund: 25,
};

export const PALETTE = {
  backdrop: '#0a0c12',
  floor: '#232838',
  floorAlt: '#1d2231',
  floorLine: '#2e3448',
  wall: '#4a5168',
  wallTop: '#6b7390',
  caseGlass: '#7fd4ff',
  caseBase: '#3a2f22',
  bush: '#2e6b3a',
  bushDark: '#1f4d2a',
  lampGlow: '#ffcf7a',
  exit: '#58e6a0',
  exitLocked: '#8b93a3',
  player: '#e8b64c',
  playerCloak: '#7a4a2b',
  guard: '#c94f4f',
  guardHat: '#2c2f3a',
  coneLit: 'rgba(255, 205, 110, 0.30)',
  coneDark: 'rgba(255, 205, 110, 0.16)',
  coneAlarm: 'rgba(255, 70, 60, 0.38)',
  text: '#f2ead8',
  muted: '#9aa3b8',
  gold: '#f2c94c',
  danger: '#ff5a4e',
  panel: '#141824',
  panelEdge: '#3a415c',
  loot: '#ffd94d',
  relic: '#ff5fa2',
  pebble: '#c9cdd6',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'velvet-night.best';
