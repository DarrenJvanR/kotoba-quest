// Start-up: load every screen module (each registers itself), then show home.
import { initSpeech } from './speech.js';
import { preloadCast } from './battle.js';
import { go, currentScreen } from './ui.js';
import { applyFont } from './screens/settings.js';
import './screens/home.js';
import './screens/study.js';
import './screens/library.js';
import './screens/town.js';
import './screens/story.js';
import './screens/arcade.js';
import './screens/kanji.js';
import './screens/phrases.js';
import './screens/sentences.js';
import './screens/stats.js';

applyFont();
initSpeech(() => { if (currentScreen() === 'settings') go('settings'); });
preloadCast();
go('home');

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && currentScreen() === 'home') go('home');
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
