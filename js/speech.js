// Japanese pronunciation through the browser's built-in text-to-speech.
import { state } from './store.js';

// Speaking speed setting, and the extra-slow speed the 🐢 button always uses.
export const SPEEDS = { normal: 0.85, slow: 0.65, slower: 0.5 };
const TURTLE = 0.45;

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
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = slow ? TURTLE : SPEEDS[state.settings.speechRate] || SPEEDS.normal;
  speechSynthesis.speak(u);
}
