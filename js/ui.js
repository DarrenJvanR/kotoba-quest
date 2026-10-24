// Shared screen plumbing: routing, keyboard, HUD, and small HTML helpers.
import * as store from './store.js';
import { hasVoice, speak } from './speech.js';

export const view = document.getElementById('view');
export const modal = document.getElementById('modal');
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

let keyHandler = null;
export const setKeys = (fn) => { keyHandler = fn; };
document.addEventListener('keydown', (e) => keyHandler?.(e));
document.addEventListener('click', (e) => {
  const say = e.target.closest('[data-say]');
  if (say) speak(say.dataset.say);
});

// Screens register here so modules can navigate without importing each other.
export const screens = {};
let current = 'home';
let leaveHook = null;
export const currentScreen = () => current;
export const go = (name, ...args) => screens[name](...args);
export const onLeave = (fn) => { leaveHook = fn; };

export function setScreen(name, { tab = name, session = false } = {}) {
  leaveHook?.();
  leaveHook = null;
  current = name;
  setKeys(null);
  closeModal();
  document.body.classList.toggle('in-session', session);
  $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  renderHud();
  window.scrollTo(0, 0);
}

$('.tabs').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) go(b.dataset.tab);
});

// ---- modal ----

export function openModal(html, { onClose } = {}) {
  modal.innerHTML = `<div class="sheet panel" role="dialog"><button class="icon-btn close" aria-label="Close">✕</button>${html}</div>`;
  modal.hidden = false;
  const prevKeys = keyHandler;
  const close = () => {
    modal.hidden = true;
    modal.innerHTML = '';
    setKeys(prevKeys);
    onClose?.();
  };
  $('.close', modal).onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  setKeys((e) => { if (e.key === 'Escape') close(); });
  return { el: $('.sheet', modal), close };
}

export function closeModal() {
  modal.hidden = true;
  modal.innerHTML = '';
}

// ---- the streak lantern ----
// One illustration; an unlit lantern is the same picture greyed out.

export function lantern(lit, px = 4) {
  return `<img class="lantern ${lit ? 'is-lit' : 'is-unlit'}" src="art/lantern.png" alt="" style="height:${16 * px}px">`;
}

// ---- HUD ----

export function renderHud() {
  const lv = store.levelInfo();
  const st = store.streakStatus();
  $('#hud').innerHTML = `
    <span class="lv">Lv ${lv.level}</span>
    <span class="xpbar" title="${lv.into} / ${lv.need} XP"><i style="width:${(lv.into / lv.need) * 100}%"></i></span>
    <span class="coins" title="Coins">🪙 ${store.state.coins}</span>
    <span class="streak ${st.litToday ? 'lit' : ''}" title="Day streak">${lantern(st.litToday, 2)}<b>${st.count}</b></span>`;
}

// ---- small pieces ----

export const audioBtn = (text) => (hasVoice() ? `<button class="btn icon" data-say="${esc(text)}" aria-label="Play sound">🔊</button>` : '');
export const chips = (labels) => `<div class="chips">${labels.map((k) => `<span class="chip kana">${esc(k)}</span>`).join('')}</div>`;
