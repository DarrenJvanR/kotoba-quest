// Settings and backup.
import * as store from '../store.js';
import { state } from '../store.js';
import { hasVoice, voiceName } from '../speech.js';
import { sfx } from '../sfx.js';
import { view, $, esc, setScreen, screens, go } from '../ui.js';

let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
});

export function applyFont() {
  document.body.classList.toggle('font-hand', state.settings.kanaFont === 'hand');
}

function showSettings() {
  setScreen('settings');
  const s = state.settings;
  const seg = (id, options, current) => `<div class="seg" id="${id}">${options.map(([v, label]) => `<button data-v="${v}" class="${String(current) === String(v) ? 'on' : ''}">${label}</button>`).join('')}</div>`;
  const toggle = (id, title, sub) => `<label class="setting"><div><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div><input type="checkbox" class="toggle" id="${id}" ${s[id] ? 'checked' : ''}></label>`;

  view.innerHTML = `
    <section class="panel">
      <h2>Daily quest</h2>
      <div class="setting"><div><b>New kana rows per day</b><span>A row is 3 to 12 kana</span></div>${seg('rowsPerDay', [[0, '0'], [1, '1'], [2, '2'], [3, '3']], s.rowsPerDay)}</div>
      <div class="setting"><div><b>New words per day</b><span>Only words you can already read</span></div>${seg('wordsPerDay', [[0, '0'], [5, '5'], [10, '10'], [15, '15']], s.wordsPerDay)}</div>
      <div class="setting"><div><b>New kanji per day</b><span>Unlocks with the library in town</span></div>${seg('kanjiPerDay', [[0, '0'], [2, '2'], [3, '3'], [5, '5']], s.kanjiPerDay)}</div>
    </section>
    <section class="panel">
      <h2>Sound and look</h2>
      ${toggle('autoplay', 'Read words aloud automatically')}
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
    <p class="foot muted">Reviews are scheduled with FSRS, the memory model Anki uses. A new day starts at 4am. Battle sprites come from your bestiary.</p>`;

  view.querySelectorAll('.seg[id]').forEach((el) => el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const key = el.id;
    s[key] = typeof s[key] === 'number' ? Number(b.dataset.v) : b.dataset.v;
    if (key === 'kanaFont') applyFont();
    store.save();
    showSettings();
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
      if (!confirm('Replace your current progress with this backup?')) return;
      store.replaceState(data);
      applyFont();
      showSettings();
    } catch {
      alert("That file doesn't look like a Kotoba Quest backup.");
    }
  };
  $('#install')?.addEventListener('click', async () => {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    showSettings();
  });
  $('#reset').onclick = () => {
    if (!confirm('Erase all progress, streak, coins and town? This cannot be undone.')) return;
    store.resetState();
    applyFont();
    go('home');
  };
}
screens.settings = showSettings;
