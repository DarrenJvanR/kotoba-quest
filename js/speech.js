// Japanese pronunciation through the browser's built-in text-to-speech.
import { state } from './store.js';

// Speaking speed setting, and the extra-slow speed the 🐢 button always uses. The steps are far
// apart because some phone voices barely change between nearby rates.
export const SPEEDS = { normal: 0.9, slow: 0.6, slower: 0.4, slowest: 0.25 };
const TURTLE = 0.3;
const SMALL = 'ゃゅょャュョぁぃぅぇぉァィゥェォ';

// For the 🐢 button, a single word is said one sound at a time: が っ こ う.
function syllables(text) {
  if (/\s/.test(text) || [...text].length > 8) return text;
  const out = [];
  for (const ch of text) {
    if (SMALL.includes(ch) && out.length) out[out.length - 1] += ch;
    else out.push(ch);
  }
  return out.join('、');
}

let voice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja'));
  voice = voices.find((v) => /natural|online|neural/i.test(v.name)) || voices[0] || null;
}

export function initSpeech(onChange) {
  if (!('speechSynthesis' in window)) return;
  pickVoice();
  speechSynthesis.addEventListener('voiceschanged', () => {
    pickVoice();
    onChange?.();
  });
}

export const hasVoice = () => !!voice;
export const voiceName = () => voice?.name || null;

export function speak(text, { slow = false } = {}) {
  if (!voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(slow ? syllables(text) : text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = slow ? TURTLE : SPEEDS[state.settings.speechRate] || SPEEDS.normal;
  speechSynthesis.speak(u);
}
