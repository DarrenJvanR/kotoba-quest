// Kanji in the library: a grid by level, details with parts and example words.
import * as store from '../store.js';
import { state } from '../store.js';
import { KANJI, KANJI_BY_KEY } from '../kanji.js';
import { $, $$, esc, plural, screens, go, openModal } from '../ui.js';
import { libraryTabs, cardFacts, levelBadge, levelLegend } from './library.js';
import { kanjiCard } from './study.js';

function kanjiTab(el) {
  const built = store.kanjiOpen();
  const seen = KANJI.filter((k) => state.cards[k.key]).length;
  el.innerHTML = `
    ${levelLegend()}
    ${built
    ? `<p class="muted">${seen} of ${KANJI.length} learned · ${state.settings.kanjiPerDay} new a day in your quest (change it in Settings).</p>`
    : '<p class="hint">Build the 📚 Library in town to start kanji lessons, or start them now from Settings → Skip ahead. You can browse them here already.</p>'}
    <div class="grid c5 kanji-grid">${KANJI.map((k) => `
      <button class="cell lv-${store.cardLevel(k.key)} ${k.radical ? 'radical' : ''}" data-k="${k.key}">
        <span class="kanji">${k.char}</span><small>${esc(k.meaning.split(',')[0])}</small>
      </button>`).join('')}</div>`;
  $$('.cell', el).forEach((b) => {
    b.onclick = () => {
      const k = KANJI_BY_KEY[b.dataset.k];
      const { el: sheet } = openModal(`
        ${kanjiCard(k, '', false)}
        ${levelBadge(k.key)}
        ${cardFacts(k.key)}
        <label class="note">Your own story <span class="muted">(used in lessons instead)</span>
          <textarea id="note" rows="2" placeholder="Write a picture that works for you…">${esc(state.notes[k.key] || '')}</textarea>
        </label>`, { onClose: () => kanjiTab(el) });
      $('#note', sheet).addEventListener('input', (e) => {
        const v = e.target.value.trim();
        if (v) state.notes[k.key] = v;
        else delete state.notes[k.key];
        store.save();
      });
    };
  });
}

libraryTabs.push({ id: 'kanji', label: '漢字 Kanji', render: kanjiTab });

// The library building in town opens straight onto this tab.
screens.kanji = () => go('library', 'kanji');

const prevProgress = screens.homeProgress;
screens.homeProgress = () => {
  const html = prevProgress?.() || '';
  if (!store.kanjiOpen()) return html;
  const seen = KANJI.filter((k) => state.cards[k.key]).length;
  const known = KANJI.filter((k) => ['known', 'mastered'].includes(store.cardLevel(k.key))).length;
  return `${html}
    <div class="prog">
      <div class="prog-head"><span>Kanji 漢字</span><span>${seen} / ${KANJI.length}</span></div>
      <div class="bar double"><i class="seen" style="width:${(seen / KANJI.length) * 100}%"></i><i class="known" style="width:${(known / KANJI.length) * 100}%"></i></div>
    </div>`;
};
