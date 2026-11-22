// Procedural sound only: every effect is a small WebAudio patch, no audio
// files. The context starts on the first user gesture; until then the game
// is silent, and M mutes everything.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (ctx) return ctx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noiseBurst(dur, vol, lowpass) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(t0);
  }

  return {
    /** Call from any user gesture so the browser allows sound. */
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    /** Soft shoe tap, alternating pitch so steps do not drone. */
    step(alt) {
      noiseBurst(0.06, 0.12, alt ? 500 : 380);
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.25);
      tone(1318, 0.18, 'sine', 0.2, 1760);
    },
    relic() {
      tone(523, 0.16, 'triangle', 0.3);
      tone(659, 0.16, 'triangle', 0.3);
      tone(784, 0.3, 'triangle', 0.3);
    },
    pebble() {
      noiseBurst(0.08, 0.2, 900);
      tone(1400, 0.07, 'square', 0.12, 900);
    },
    noise() {
      tone(220, 0.1, 'square', 0.1, 160);
    },
    /** Two-note alarm sting when the meter fills. */
    alarm() {
      tone(440, 0.22, 'sawtooth', 0.22, 620);
      tone(620, 0.3, 'sawtooth', 0.22, 440);
    },
    caught() {
      tone(330, 0.4, 'sawtooth', 0.25, 110);
      noiseBurst(0.25, 0.2, 400);
    },
    levelClear() {
      tone(523, 0.14, 'triangle', 0.28);
      tone(659, 0.14, 'triangle', 0.28);
      tone(784, 0.14, 'triangle', 0.28);
      tone(1046, 0.34, 'triangle', 0.28);
    },
    win() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => {
        setTimeout(() => tone(f, 0.3, 'triangle', 0.28), i * 130);
      });
    },
  };
}
