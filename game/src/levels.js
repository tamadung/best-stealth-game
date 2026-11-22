// The three heists. Each level is one gallery floor: border walls, a few
// interior partitions, display cases (solid cover that blocks sight),
// bushes (walkable hiding spots), lamps (pools of light), loot, one relic
// that unlocks the exit, and guards walking waypoint loops.
//
// Coordinates are in the 1280x720 field. Patrol lanes were laid out clear of
// every wall and case, so a guard never has to path around a corner.

import { FIELD } from './config.js';

const BORDER = [
  { x: 0, y: 0, w: FIELD.width, h: 24 },
  { x: 0, y: FIELD.height - 24, w: FIELD.width, h: 24 },
  { x: 0, y: 0, w: 24, h: FIELD.height },
  { x: FIELD.width - 24, y: 0, w: 24, h: FIELD.height },
];

export const LEVELS = [
  {
    name: 'The Marble Hall',
    relicName: 'Ember Opal',
    intro: 'Lift the Ember Opal, then slip out the south-east door unseen.',
    playerStart: { x: 90, y: 630 },
    exit: { x: 1150, y: 610, w: 70, h: 46 },
    walls: [
      ...BORDER,
      { x: 380, y: 24, w: 24, h: 200 },
      { x: 880, y: 496, w: 24, h: 200 },
      { x: 560, y: 460, w: 200, h: 24 },
    ],
    cases: [
      { x: 180, y: 180, w: 110, h: 54 },
      { x: 180, y: 480, w: 110, h: 54 },
      { x: 600, y: 120, w: 110, h: 54 },
      { x: 600, y: 520, w: 110, h: 54 },
      { x: 1000, y: 180, w: 110, h: 54 },
      { x: 1000, y: 480, w: 110, h: 54 },
    ],
    bushes: [
      { x: 460, y: 140, r: 44 },
      { x: 760, y: 600, r: 44 },
      { x: 1100, y: 280, r: 44 },
      { x: 120, y: 360, r: 44 },
    ],
    lamps: [
      { x: 320, y: 120, r: 110 },
      { x: 960, y: 120, r: 110 },
      { x: 640, y: 360, r: 120 },
      { x: 320, y: 600, r: 110 },
      { x: 960, y: 600, r: 110 },
    ],
    loot: [
      { x: 240, y: 300 },
      { x: 640, y: 220 },
      { x: 1040, y: 420 },
    ],
    relic: { x: 640, y: 80 },
    guards: [
      { path: [[300, 360], [980, 360]] },
      { path: [[520, 120], [520, 600]] },
      { path: [[1180, 140], [1180, 560]] },
    ],
  },
  {
    name: 'The Vault Wing',
    relicName: 'Moon Pearl',
    intro: 'The Moon Pearl sits under the great lamp. Four guards walk the wing.',
    playerStart: { x: 90, y: 630 },
    exit: { x: 1150, y: 50, w: 70, h: 46 },
    walls: [
      ...BORDER,
      { x: 300, y: 24, w: 24, h: 260 },
      { x: 956, y: 436, w: 24, h: 260 },
      { x: 480, y: 180, w: 24, h: 220 },
      { x: 760, y: 320, w: 24, h: 220 },
      { x: 560, y: 560, w: 220, h: 24 },
    ],
    cases: [
      { x: 180, y: 140, w: 110, h: 54 },
      { x: 180, y: 520, w: 110, h: 54 },
      { x: 420, y: 420, w: 110, h: 54 },
      { x: 700, y: 140, w: 110, h: 54 },
      { x: 1000, y: 300, w: 110, h: 54 },
      { x: 1000, y: 560, w: 110, h: 54 },
    ],
    bushes: [
      { x: 1120, y: 180, r: 44 },
      { x: 120, y: 360, r: 44 },
      { x: 1160, y: 200, r: 44 },
      { x: 980, y: 640, r: 44 },
      { x: 380, y: 620, r: 44 },
    ],
    lamps: [
      { x: 240, y: 360, r: 110 },
      { x: 640, y: 300, r: 120 },
      { x: 1020, y: 360, r: 110 },
      { x: 640, y: 620, r: 100 },
      { x: 420, y: 120, r: 100 },
    ],
    loot: [
      { x: 200, y: 300 },
      { x: 560, y: 90 },
      { x: 900, y: 220 },
      { x: 1120, y: 480 },
    ],
    relic: { x: 640, y: 360 },
    guards: [
      { path: [[160, 140], [160, 580]] },
      { path: [[400, 90], [1000, 90]] },
      { path: [[880, 240], [880, 640]] },
      { path: [[560, 600], [1120, 600]] },
    ],
  },
  {
    name: 'The Rooftop Gallery',
    relicName: 'Starlight Crown',
    intro: 'Five guards, one crown, no way down but the north-west door.',
    playerStart: { x: 1180, y: 630 },
    exit: { x: 60, y: 50, w: 70, h: 46 },
    walls: [
      ...BORDER,
      { x: 360, y: 24, w: 24, h: 180 },
      { x: 896, y: 516, w: 24, h: 180 },
      { x: 600, y: 120, w: 24, h: 200 },
      { x: 600, y: 480, w: 24, h: 140 },
      { x: 200, y: 360, w: 180, h: 24 },
      { x: 900, y: 360, w: 180, h: 24 },
    ],
    cases: [
      { x: 160, y: 120, w: 110, h: 54 },
      { x: 160, y: 540, w: 110, h: 54 },
      { x: 460, y: 300, w: 110, h: 54 },
      { x: 760, y: 300, w: 110, h: 54 },
      { x: 1060, y: 120, w: 110, h: 54 },
      { x: 1060, y: 540, w: 110, h: 54 },
    ],
    bushes: [
      { x: 520, y: 60, r: 44 },
      { x: 800, y: 80, r: 44 },
      { x: 120, y: 360, r: 44 },
      { x: 1160, y: 360, r: 44 },
      { x: 640, y: 640, r: 44 },
    ],
    lamps: [
      { x: 300, y: 200, r: 110 },
      { x: 980, y: 200, r: 110 },
      { x: 640, y: 360, r: 130 },
      { x: 300, y: 540, r: 110 },
      { x: 980, y: 540, r: 110 },
    ],
    loot: [
      { x: 140, y: 240 },
      { x: 640, y: 140 },
      { x: 1140, y: 240 },
      { x: 340, y: 620 },
      { x: 940, y: 620 },
    ],
    relic: { x: 640, y: 360 },
    guards: [
      { path: [[440, 120], [440, 600]] },
      { path: [[700, 200], [1100, 200]] },
      { path: [[700, 520], [1100, 520]] },
      { path: [[180, 460], [1100, 460]] },
      { path: [[640, 80], [640, 240]] },
    ],
  },
];
