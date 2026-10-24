// Japanese pronunciation through the browser's built-in text-to-speech.
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

export function speak(text) {
  if (!voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 0.85;
  speechSynthesis.speak(u);
}
