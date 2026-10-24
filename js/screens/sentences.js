// Sentence mining: save lines from anime, games or songs and review them like any card.
import * as store from '../store.js';
import { state } from '../store.js';
import { WORDS } from '../vocab.js';
import { $, $$, esc, plural, openModal, confirmDialog } from '../ui.js';
import { libraryTabs, cardFacts } from './library.js';

// Underline words from the deck you already know, to show how much you can read.
function highlight(jp) {
  const known = WORDS.filter((w) => state.cards[w.key] && w.kana.length > 1).sort((a, b) => b.kana.length - a.kana.length);
  let html = '';
  for (let i = 0; i < jp.length;) {
    const w = known.find((k) => jp.startsWith(k.kana, i) || (k.kanji && jp.startsWith(k.kanji, i)));
    if (w) {
      const text = jp.startsWith(w.kana, i) ? w.kana : w.kanji;
      html += `<mark title="${esc(w.meaning)}">${esc(text)}</mark>`;
      i += text.length;
    } else {
      html += esc(jp[i]);
      i += 1;
    }
  }
  return html;
}

function sentencesTab(el) {
  const list = [...state.sentences].reverse();
  el.innerHTML = `
    <p class="muted">Heard a line you like in an anime, game or song? Save it here. It joins your daily reviews, and you mark how well you understood it.</p>
    <form id="mine" class="mine">
      <label><span>Japanese</span><textarea id="mJp" rows="2" required placeholder="例: きょうは いい てんきですね。"></textarea></label>
      <label><span>Meaning</span><input id="mEn" placeholder="The weather's nice today, isn't it?"></label>
      <label><span>Note <span class="muted">(optional)</span></span><input id="mNote" placeholder="ね = asking for agreement"></label>
      <label><span>Source <span class="muted">(optional)</span></span><input id="mSrc" placeholder="Show, episode, song…"></label>
      <button class="btn primary big">Save sentence</button>
    </form>
    <h3>${plural(list.length, 'sentence')}</h3>
    <div class="sentence-list">
      ${list.map((s) => `
        <button class="sentence-row" data-id="${s.id}">
          <span class="kana">${highlight(s.jp)}</span>
          <small>${esc(s.en || '')}${s.source ? ` · ${esc(s.source)}` : ''}</small>
        </button>`).join('') || '<p class="hint">No sentences yet.</p>'}
    </div>`;
  $('#mine', el).addEventListener('submit', (e) => {
    e.preventDefault();
    const jp = $('#mJp', el).value.trim();
    if (!jp) return;
    store.addSentence({ jp, en: $('#mEn', el).value.trim(), note: $('#mNote', el).value.trim(), source: $('#mSrc', el).value.trim() });
    sentencesTab(el);
  });
  $$('.sentence-row', el).forEach((b) => {
    b.onclick = () => {
      const s = state.sentences.find((x) => x.id === b.dataset.id);
      const { el: sheet, close } = openModal(`
        <div class="sentence kana">${highlight(s.jp)}</div>
        <div class="meaning center">${esc(s.en || '')}</div>
        ${s.note ? `<p class="mnemonic">${esc(s.note)}</p>` : ''}
        ${s.source ? `<p class="muted center">From: ${esc(s.source)}</p>` : ''}
        ${cardFacts(`s:${s.id}`)}
        <p class="muted center small-note">Highlighted words are ones you already know.</p>
        <button class="btn danger" id="del">Delete sentence</button>`, { onClose: () => sentencesTab(el) });
      $('#del', sheet).onclick = async () => {
        if (!await confirmDialog('Delete this sentence and its review history?', { ok: 'Delete', danger: true })) return;
        store.deleteSentence(s.id);
        close();
      };
    };
  });
}

libraryTabs.push({ id: 'sentences', label: '文 Sentences', render: sentencesTab });
