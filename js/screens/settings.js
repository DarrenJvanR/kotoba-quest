// Settings and backup.
import * as store from '../store.js';
import { state } from '../store.js';
import { hasVoice, voiceName, speak } from '../speech.js';
import { ITEMS } from '../kana.js';
import { sfx } from '../sfx.js';
import { view, $, esc, setScreen, screens, go, confirmDialog, notify } from '../ui.js';

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});

export function applyFont() {
  document.body.classList.toggle('font-hand', state.settings.kanaFont === 'hand');
}

// Redraw after a change without jumping back to the top of the page.
function refresh() {
  const y = window.scrollY;
  showSettings();
  window.scrollTo(0, y);
}

function showSettings() {
  setScreen('settings');
  const s = state.settings;
  const seg = (id, options, current) => `<div class="seg" id="${id}">${options.map(([v, label]) => `<button data-v="${v}" class="${String(current) === String(v) ? 'on' : ''}">${label}</button>`).join('')}</div>`;
  const known = (script) => ITEMS.filter((it) => it.script === script && (state.cards[it.key]?.s || 0) >= 7).length;
  const toggle = (id, title, sub) => `<label class="setting"><div><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div><input type="checkbox" class="toggle" id="${id}" ${s[id] ? 'checked' : ''}></label>`;

  view.innerHTML = `
    <section class="panel">
      <h2>Daily quest</h2>
      <div class="setting"><div><b>New kana rows per day</b><span>A row is 3 to 12 kana</span></div>${seg('rowsPerDay', [[0, '0'], [1, '1'], [2, '2'], [3, '3']], s.rowsPerDay)}</div>
      <div class="setting"><div><b>New words per day</b><span>Only words you can already read</span></div>${seg('wordsPerDay', [[0, '0'], [5, '5'], [10, '10'], [15, '15']], s.wordsPerDay)}</div>
      <div class="setting"><div><b>Souvenir words per day</b><span>Extra words from the town you're visiting</span></div>${seg('souvenirsPerDay', [[0, '0'], [3, '3'], [5, '5'], [8, '8']], s.souvenirsPerDay)}</div>
      <div class="setting"><div><b>New phrases per day</b><span>Everyday sentences, by situation</span></div>${seg('phrasesPerDay', [[0, '0'], [2, '2'], [3, '3'], [5, '5']], s.phrasesPerDay)}</div>
      <div class="setting"><div><b>New kanji per day</b><span>Unlocks with the library in town, or skip ahead below</span></div>${seg('kanjiPerDay', [[0, '0'], [2, '2'], [3, '3'], [5, '5']], s.kanjiPerDay)}</div>
    </section>
    <section class="panel">
      <h2>Skip ahead</h2>
      <p class="muted">Already know some Japanese? Skip what you know. Skipped kana still come back now and then for a quick check.</p>
      <div class="setting"><div><b>I already know hiragana</b><span>${known('hira')} of 104 known</span></div>${known('hira') >= 104 ? '<span class="done-tag">✓ Done</span>' : '<button class="btn small" id="skipHira">Skip</button>'}</div>
      <div class="setting"><div><b>I already know katakana</b><span>${known('kata')} of 104 known</span></div>${known('kata') >= 104 ? '<span class="done-tag">✓ Done</span>' : '<button class="btn small" id="skipKata">Skip</button>'}</div>
      <label class="setting"><div><b>Start kanji now</b><span>Without building the library in town first</span></div><input type="checkbox" class="toggle" id="kanjiEarly" ${s.kanjiEarly ? 'checked' : ''}></label>
      <button class="btn wide-btn" id="kanjiOnly">Just kanji, please</button>
      <p class="hint">“Just kanji” skips both kana sets, starts kanji now, and sets new kana, words and phrases to 0 a day, so each day's quest is only kanji. You can change any of these back above.</p>
    </section>
    <section class="panel">
      <h2>Sound and look</h2>
      ${toggle('autoplay', 'Read words aloud automatically')}
      <div class="setting stack"><div><b>Speaking speed</b><span>For everything read aloud: words, phrases, stories. 🐢 next to any 🔊 is always extra slow, one sound at a time.</span></div>${seg('speechRate', [['normal', 'Normal'], ['slow', 'Slow'], ['slower', 'Slower'], ['slowest', 'Slowest']], s.speechRate)}</div>
      ${toggle('listening', 'Listening questions', 'Hear it and pick the answer')}
      ${toggle('sfx', 'Battle sound effects')}
      <div class="setting"><div><b>Kana font</b></div>${seg('kanaFont', [['gothic', '<span class="kana-gothic">あ</span> Print'], ['hand', '<span class="kana-hand">あ</span> Handwritten']], s.kanaFont)}</div>
      <div class="setting"><div><b>Japanese voice</b><span>${esc(voiceName() || 'None found on this device')}</span></div><button class="btn small" data-say="こんにちは" ${hasVoice() ? '' : 'disabled'}>Test</button></div>
      ${hasVoice() ? '' : `<p class="hint">No Japanese voice yet, so pronunciation is off. Quickest fix on Windows: open this app in <b>Microsoft Edge</b>, which has natural Japanese voices built in. Or add one: Settings → Time &amp; language → Speech → Add voices → Japanese, then restart your browser. Phones usually have one already.</p>`}
    </section>
    <section class="panel">
      <h2>Your data</h2>
      <p class="muted">Progress is saved on this device. Export a backup to move it to another one.</p>
      <div class="row">
        <button class="btn grow" id="export">Export backup</button>
        <button class="btn grow" id="import">Import backup</button>
        <input type="file" id="importFile" accept="application/json,.json" hidden>
      </div>
      ${installPrompt ? '<button class="btn primary big" id="install">Install as an app</button>' : ''}
      <button class="btn danger" id="reset">Reset all progress</button>
    </section>
    <p class="foot muted">Reviews are scheduled with FSRS, the memory model Anki uses. A new day starts at 4am. Art made locally with the Anima model.</p>`;

  const skip = async (script, label) => {
    const items = ITEMS.filter((it) => it.script === script);
    if (!await confirmDialog(`Mark all ${items.length} ${label} as known? They'll come back for a light check over the next few weeks.`, { ok: 'Skip them' })) return;
    const n = store.markKnown(items);
    refresh();
    notify(`${n} ${label} marked as known. Words and phrases that use them are now open.`);
  };
  $('#skipHira')?.addEventListener('click', () => skip('hira', 'hiragana'));
  $('#skipKata')?.addEventListener('click', () => skip('kata', 'katakana'));
  $('#kanjiEarly').onchange = (e) => {
    s.kanjiEarly = e.target.checked;
    store.save();
  };
  $('#kanjiOnly').onclick = async () => {
    if (!await confirmDialog('Skip all hiragana and katakana, start kanji now, and turn off new kana, words and phrases?', { ok: 'Just kanji' })) return;
    store.markKnown(ITEMS);
    Object.assign(s, { kanjiEarly: true, rowsPerDay: 0, wordsPerDay: 0, phrasesPerDay: 0, kanjiPerDay: Math.max(s.kanjiPerDay, 3) });
    store.save();
    refresh();
    notify(`Done. Each day's quest now teaches ${s.kanjiPerDay} new kanji, starting with their building blocks.`);
  };

  view.querySelectorAll('.seg[id]').forEach((el) => el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const key = el.id;
    s[key] = typeof s[key] === 'number' ? Number(b.dataset.v) : b.dataset.v;
    if (key === 'kanaFont') applyFont();
    store.save();
    refresh();
    if (key === 'speechRate') speak('ゆっくり はなして ください');
  }));
  ['autoplay', 'listening', 'sfx'].forEach((id) => {
    $(`#${id}`).onchange = (e) => {
      s[id] = e.target.checked;
      store.save();
      if (id === 'sfx' && s.sfx) sfx('coin');
    };
  });

  $('#export').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kotoba-quest-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $('#import').onclick = () => $('#importFile').click();
  $('#importFile').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data.cards !== 'object') throw new Error('not a backup');
      const cards = Object.keys(data.cards).length;
      if (!await confirmDialog(`Replace your current progress with this backup (${cards} cards, ${data.streak?.count || 0}-day streak)?`, { ok: 'Replace' })) return;
      store.replaceState(data);
      applyFont();
      refresh();
      notify('Backup imported. Welcome back!');
    } catch {
      notify("That file doesn't look like a Kotoba Quest backup.");
    } finally {
      e.target.value = '';
    }
  };
  $('#install')?.addEventListener('click', async () => {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    refresh();
  });
  $('#reset').onclick = async () => {
    if (!await confirmDialog('Erase all progress, streak, coins and town? This cannot be undone.', { ok: 'Erase everything', danger: true })) return;
    store.resetState();
    applyFont();
    go('home');
  };
}
screens.settings = showSettings;
