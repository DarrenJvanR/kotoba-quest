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
  if (say) speak(say.dataset.say, { slow: 'slow' in say.dataset });
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

// In-app replacements for confirm() and alert(), which some browsers and home-screen
// apps silently block (confirm() then always answers "cancel").
export function confirmDialog(message, { ok = 'OK', cancel = 'Cancel', danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const { el, close } = openModal(`
      <p class="dialog-msg">${esc(message)}</p>
      <div class="row">
        <button class="btn ghost grow" id="dlgNo">${esc(cancel)}</button>
        <button class="btn ${danger ? 'danger-solid' : 'primary'} grow" id="dlgYes">${esc(ok)}</button>
      </div>`, { onClose: () => { if (!answered) resolve(false); } });
    const done = (value) => {
      answered = true;
      resolve(value);
      close();
    };
    $('#dlgYes', el).onclick = () => done(true);
    $('#dlgNo', el).onclick = () => done(false);
    $('#dlgNo', el).focus();
  });
}

export function notify(message) {
  const { el, close } = openModal(`<p class="dialog-msg">${esc(message)}</p><button class="btn primary big" id="dlgOk">OK</button>`);
  $('#dlgOk', el).onclick = close;
  $('#dlgOk', el).focus();
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

export const audioBtn = (text) => (hasVoice()
  ? `<span class="audio-pair"><button class="btn icon" data-say="${esc(text)}" aria-label="Play sound">🔊</button><button class="btn icon slow-btn" data-say="${esc(text)}" data-slow aria-label="Play slowly" title="Play slowly">🐢</button></span>`
  : '');
// A word's main line: big kanji with the kana reading under it, or just the kana.
// The kana is the main text (it's what you read); the kanji spelling sits in a labelled box.
export const wordHead = (w) => `<div class="word kana">${esc(w.kana)}</div>${w.kanji
  ? `<div class="kanji-pill"><span>in kanji</span><b class="kanji">${esc(w.kanji)}</b></div>`
  : ''}`;
export const chips = (labels) => `<div class="chips">${labels.map((k) => `<span class="chip kana">${esc(k)}</span>`).join('')}</div>`;
