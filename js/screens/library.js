// Library: kana charts and the word list, coloured by how well each is known.
import * as store from '../store.js';
import { state } from '../store.js';
import { GROUPS, BY_KANA } from '../kana.js';
import { WORDS, WORD_BY_KEY, isUnlocked, wordTip } from '../vocab.js';
import { view, $, $$, esc, plural, setScreen, screens, openModal, audioBtn, wordHead } from '../ui.js';

export const LEVEL_LABEL = { unseen: 'Not learned yet', learning: 'Learning', known: 'Known', mastered: 'Mastered' };
// Every level also has a symbol, so it never depends on telling colours apart.
export const LEVEL_MARK = { unseen: '', learning: '•', known: '••', mastered: '★' };

export const levelLegend = (levels = Object.keys(LEVEL_LABEL)) => `
  <div class="legend">${levels.map((k) => `<span><i class="lv-${k}">${LEVEL_MARK[k]}</i>${k === 'unseen' ? 'New' : LEVEL_LABEL[k]}</span>`).join('')}</div>`;

// Extra tabs (kanji, sentences) register here: { id, label, render(el), }
export const libraryTabs = [];

function chartLayout(group) {
  const it = group.items;
  if (group.section === 'combo') return it;
  if (group.id.endsWith('-ya')) return [it[0], null, it[1], null, it[2]];
  if (group.id.endsWith('-wa')) return [it[0], null, null, null, it[1], it[2], null, null, null, null];
  return it;
}

export function cardFacts(key) {
  const c = state.cards[key];
  if (!c) return '';
  const day = store.today();
  const next = c.due <= day ? 'today' : c.due - day === 1 ? 'tomorrow' : `in ${c.due - day} days`;
  return `
    <div class="stats3 small">
      <div><b>${next}</b><span>next review</span></div>
      <div><b>${c.s < 10 ? c.s.toFixed(1) : Math.round(c.s)}d</b><span>memory strength</span></div>
      <div><b>${c.reps}</b><span>times reviewed</span></div>
    </div>`;
}

export const levelBadge = (key) => {
  const level = store.cardLevel(key);
  return `<div class="center"><span class="badge lv-${level}">${LEVEL_MARK[level]} ${LEVEL_LABEL[level]}</span></div>`;
};

function kanaTab(el, script) {
  const groups = GROUPS.filter((g) => g.script === script);
  const cell = (it) => (it
    ? `<button class="cell lv-${store.cardLevel(it.key)}" data-k="${it.kana}"><span class="kana">${it.kana}</span><small>${it.romaji}</small></button>`
    : '<span class="cell empty"></span>');
  const section = (key, title, cols) => `
    <h3>${title}</h3>
    <div class="grid c${cols}">${groups.filter((g) => g.section === key).flatMap(chartLayout).map(cell).join('')}</div>`;
  el.innerHTML = `${legend()}${section('basic', 'Basic', 5)}${section('voiced', 'Voiced ゛ and ゜', 5)}${section('combo', 'Combos', 3)}`;
  $$('.cell[data-k]', el).forEach((b) => { b.onclick = () => openKana(b.dataset.k, () => kanaTab(el, script)); });
}

const legend = () => levelLegend();

function openKana(kana, refresh) {
  const it = BY_KANA[kana];
  const { el } = openModal(`
    <div class="glyph kana">${it.kana}</div>
    <div class="romaji">${it.romaji} ${audioBtn(it.kana)}</div>
    ${levelBadge(it.key)}
    ${cardFacts(it.key)}
    <h3>Memory story</h3>
    <p class="mnemonic">${esc(it.mnemonic)}</p>
    <label class="note">Your own story <span class="muted">(used in lessons instead)</span>
      <textarea id="note" rows="2" placeholder="Write a picture that works for you…">${esc(state.notes[kana] || '')}</textarea>
    </label>`, { onClose: refresh });
  $('#note', el).addEventListener('input', (e) => {
    const v = e.target.value.trim();
    if (v) state.notes[kana] = v;
    else delete state.notes[kana];
    store.save();
  });
}

function wordsTab(el) {
  const seen = WORDS.filter((w) => state.cards[w.key]);
  const ready = WORDS.filter((w) => !state.cards[w.key] && store.regionOpen(w) && isUnlocked(w, state.cards));
  const locked = WORDS.length - seen.length - ready.length;
  const row = (w) => {
    const level = store.cardLevel(w.key);
    return `
    <button class="word-row lv-edge-${level}" data-w="${esc(w.key)}">
      <span class="emoji-s">${w.emoji}</span>
      <span class="kana">${esc(w.kana)}</span>
      <span class="wr-meaning">${esc(w.meaning)}</span>
      <span class="lvmark lv-${level}" title="${LEVEL_LABEL[level]}" aria-label="${LEVEL_LABEL[level]}">${LEVEL_MARK[level]}</span>
    </button>`;
  };
  el.innerHTML = `
    ${legend()}
    <p class="muted">${plural(seen.length, 'word')} learned · ${ready.length} ready to learn · ${locked} unlock as you learn more kana</p>
    ${seen.length ? `<h3>Learned</h3><div class="word-list">${seen.map(row).join('')}</div>` : '<p class="hint">Words you learn in your daily quest show up here.</p>'}
    ${ready.length ? `<h3>Ready to learn</h3><div class="word-list dim">${ready.slice(0, 30).map(row).join('')}</div>${ready.length > 30 ? `<p class="muted center">…and ${ready.length - 30} more</p>` : ''}` : ''}`;
  $$('.word-row', el).forEach((b) => { b.onclick = () => openWord(b.dataset.w); });
}

export function openWord(key) {
  const w = WORD_BY_KEY[key];
  const tip = wordTip(w);
  openModal(`
    <div class="emoji center">${w.emoji}</div>
    <div class="center">${wordHead(w)}</div>
    <div class="romaji">${esc(w.romaji)} ${audioBtn(w.kana)}</div>
    <div class="meaning center">${esc(w.meaning)}</div>
    ${w.kanji ? '' : '<div class="kanji-note center">Usually written in kana, no kanji</div>'}
    ${levelBadge(w.key)}
    ${cardFacts(w.key)}
    ${tip ? `<p class="mnemonic">${esc(tip)}</p>` : ''}`);
}

function showLibrary(tab = 'hira') {
  setScreen('library');
  const tabs = [['hira', 'ひらがな'], ['kata', 'カタカナ'], ['words', 'ことば Words'], ...libraryTabs.map((t) => [t.id, t.label])];
  view.innerHTML = `
    <section class="panel">
      <div class="seg wide scroll" id="libtabs">${tabs.map(([id, l]) => `<button data-t="${id}" class="${id === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div id="libbody"></div>
    </section>`;
  const body = $('#libbody');
  if (tab === 'hira' || tab === 'kata') kanaTab(body, tab);
  else if (tab === 'words') wordsTab(body);
  else libraryTabs.find((t) => t.id === tab)?.render(body);
  $('#libtabs').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) showLibrary(b.dataset.t);
  });
}
screens.library = showLibrary;
