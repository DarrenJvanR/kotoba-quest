// Phrases in the library: grouped by situation, with level symbols and a detail view.
import * as store from '../store.js';
import { state } from '../store.js';
import { PHRASES, PHRASE_BY_KEY, SITUATIONS } from '../phrases.js';
import { unknownKana } from '../stories.js';
import { $$, esc, plural, screens, openModal, audioBtn } from '../ui.js';
import { libraryTabs, cardFacts, levelBadge, levelLegend, LEVEL_LABEL, LEVEL_MARK } from './library.js';
import { phraseCard } from './study.js';

function phrasesTab(el) {
  const learned = PHRASES.filter((p) => state.cards[p.key]).length;
  const ready = store.readyPhraseCount();
  const row = (p) => {
    const level = store.cardLevel(p.key);
    const locked = !state.cards[p.key] && !store.phraseUnlocked(p);
    return `
      <button class="word-row phrase-row lv-edge-${level} ${locked ? 'locked' : ''}" data-p="${p.key}">
        <span class="kana">${esc(p.jp)}</span>
        <span class="wr-meaning">${esc(p.en)}</span>
        <span class="lvmark lv-${level}" title="${LEVEL_LABEL[level]}">${locked ? '🔒' : LEVEL_MARK[level]}</span>
      </button>`;
  };
  el.innerHTML = `
    ${levelLegend()}
    <p class="muted">${plural(learned, 'phrase')} learned · ${ready} ready to learn · ${state.settings.phrasesPerDay} new a day in your quest. 🔒 phrases open once you know their kana.</p>
    ${Object.entries(SITUATIONS).map(([id, s]) => `
      <h3>${s.emoji} ${esc(s.name)}</h3>
      <div class="word-list">${PHRASES.filter((p) => p.situation === id).map(row).join('')}</div>`).join('')}`;
  $$('.phrase-row', el).forEach((b) => {
    b.onclick = () => {
      const p = PHRASE_BY_KEY[b.dataset.p];
      const missing = state.cards[p.key] ? [] : unknownKana(p.jp, state.cards);
      openModal(`
        ${phraseCard(p, `<div class="center">${audioBtn(p.kana)}</div>`, false)}
        ${levelBadge(p.key)}
        ${cardFacts(p.key)}
        ${missing.length ? `<p class="hint">Opens once you've learned <span class="kana">${missing.join(' ')}</span>.</p>` : ''}`, { onClose: () => phrasesTab(el) });
    };
  });
}

libraryTabs.unshift({ id: 'phrases', label: '会話 Phrases', render: phrasesTab });

const prevProgress = screens.homeProgress;
screens.homeProgress = () => {
  const seen = PHRASES.filter((p) => state.cards[p.key]).length;
  const known = PHRASES.filter((p) => ['known', 'mastered'].includes(store.cardLevel(p.key))).length;
  return `
    <div class="prog">
      <div class="prog-head"><span>Phrases 会話 <span class="muted">(${store.readyPhraseCount()} ready)</span></span><span>${seen} / ${PHRASES.length}</span></div>
      <div class="bar double"><i class="seen" style="width:${(seen / PHRASES.length) * 100}%"></i><i class="known" style="width:${(known / PHRASES.length) * 100}%"></i></div>
    </div>
    ${prevProgress?.() || ''}`;
};
