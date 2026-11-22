// Keyboard and pointer input. Held keys give a movement vector; one-shot
// presses (start, restart, pause, mute) are queued as bit flags and taken
// once by the loop, so a press between two frames is never lost or counted
// twice. A click on the field is a pebble throw: the loop reads the click
// point and clears it.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const RUN = new Set(['ShiftLeft', 'ShiftRight']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);

export function createInput(target) {
  const held = new Set();
  let actions = 0;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code) || DOWN.has(event.code) || LEFT.has(event.code) || RIGHT.has(event.code) || RUN.has(event.code)) {
      held.add(event.code);
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => held.clear());

  target.addEventListener('pointerdown', (event) => {
    // A click is a pebble throw; the loop converts it to field coordinates.
    click = { clientX: event.clientX, clientY: event.clientY };
    actions |= ACTION_CONFIRM;
  });

  function has(codes) {
    for (const code of codes) if (held.has(code)) return true;
    return false;
  }

  return {
    /** Normalised movement vector (-1..1 on each axis). */
    moveVector() {
      const mx = (has(RIGHT) ? 1 : 0) - (has(LEFT) ? 1 : 0);
      const my = (has(DOWN) ? 1 : 0) - (has(UP) ? 1 : 0);
      const len = Math.hypot(mx, my);
      if (len === 0) return { mx: 0, my: 0 };
      return { mx: mx / len, my: my / len };
    },
    running() {
      return has(RUN);
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last click's client coordinates, or null; cleared on read. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
