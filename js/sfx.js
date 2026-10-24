// Chiptune sound effects made on the fly with Web Audio (no sound files).
import { state } from './store.js';

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'square', when = 0, vol = 0.08, slide = 0 } = {}) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, { when = 0, vol = 0.12, freq = 1500 } = {}) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + when;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

const SOUNDS = {
  correct() { tone(880, 0.07); tone(1320, 0.12, { when: 0.06 }); },
  wrong() { tone(196, 0.22, { type: 'sawtooth', slide: -70, vol: 0.06 }); },
  hit() { noise(0.1, { freq: 2200 }); tone(260, 0.1, { slide: -150 }); },
  crit() { noise(0.14, { freq: 3000, vol: 0.15 }); tone(520, 0.08); tone(780, 0.14, { when: 0.05, slide: -300 }); },
  hurt() { noise(0.18, { freq: 500, vol: 0.14 }); tone(150, 0.2, { type: 'sawtooth', slide: -60, vol: 0.06 }); },
  coin() { tone(988, 0.06, { vol: 0.06 }); tone(1319, 0.16, { when: 0.06, vol: 0.06 }); },
  defeat() { [660, 520, 390, 260].forEach((f, i) => tone(f, 0.09, { when: i * 0.07, vol: 0.06 })); },
  victory() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.35 : 0.1, { when: i * 0.1, vol: 0.07 })); },
  learn() { tone(660, 0.12, { type: 'triangle', vol: 0.1 }); tone(990, 0.2, { type: 'triangle', when: 0.08, vol: 0.08 }); },
  revive() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.08, { type: 'triangle', when: i * 0.06, vol: 0.08 })); },
  build() { noise(0.05, { freq: 900 }); noise(0.05, { freq: 900, when: 0.12 }); tone(784, 0.25, { type: 'triangle', when: 0.22, vol: 0.09 }); },
};

export function sfx(name) {
  if (!state.settings.sfx) return;
  try {
    SOUNDS[name]?.();
  } catch {
    // Audio can be blocked until the first tap; a missing blip is fine.
  }
}
