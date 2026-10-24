// Home: streak lantern, today's quest and overall progress.
import * as store from '../store.js';
import { state } from '../store.js';
import { ITEMS } from '../kana.js';
import { WORDS } from '../vocab.js';
import { view, $, esc, plural, setKeys, setScreen, screens, go, lantern, chips } from '../ui.js';

function progressBar(label, items, keyOf) {
  const seen = items.filter((it) => state.cards[keyOf(it)]).length;
  const known = items.filter((it) => ['known', 'mastered'].includes(store.cardLevel(keyOf(it)))).length;
  const pct = (n) => (n / items.length) * 100;
  return `
    <div class="prog">
      <div class="prog-head"><span>${label}</span><span>${seen} / ${items.length}</span></div>
      <div class="bar double"><i class="seen" style="width:${pct(seen)}%"></i><i class="known" style="width:${pct(known)}%"></i></div>
    </div>`;
}

function activity() {
  const d0 = store.today();
  const days = Array.from({ length: 14 }, (_, i) => d0 - 13 + i);
  const counts = days.map((d) => state.history[d]?.r || 0);
  const max = Math.max(10, ...counts);
  const total = counts.reduce((a, b) => a + b, 0);
  return `
    <div class="activity">
      <div class="prog-head"><span>Last 14 days</span><span>${plural(total, 'answer')}</span></div>
      <div class="act-bars">${counts.map((r, i) => `<i class="${r ? 'on' : ''} ${i === 13 ? 'today' : ''}" style="height:${Math.max(8, (r / max) * 100)}%" title="${plural(r, 'answer')}"></i>`).join('')}</div>
    </div>`;
}

function showHome() {
  setScreen('home');
  const st = store.streakStatus();
  const due = store.dueCards().length;
  const newKana = store.nextNewGroups().flatMap((g) => g.items);
  const newWords = store.nextNewWords();
  const newKanji = store.nextNewKanji();
  const newPhrases = store.nextNewPhrases();
  const extras = (screens.homeExtras?.() || []);
  const upcoming = store.upcomingGroup();
  const readyWords = store.readyWordCount();
  const tomorrow = store.dueOn(store.today() + 1);
  const newCount = newKana.length + newWords.length + newKanji.length + newPhrases.length;
  const mins = Math.max(1, Math.round((due * 7 + newKana.length * 35 + (newWords.length + newKanji.length) * 30 + newPhrases.length * 45 + extras.reduce((a, e) => a + (e.seconds || 0), 0)) / 60));

  let msg;
  if (st.litToday) msg = 'Your lantern is lit for today. Nice work!';
  else if (st.broken) msg = 'Your lantern went out. Light a new one today.';
  else if (st.needFreezes) msg = `You missed ${plural(st.needFreezes, 'day')}. A streak freeze will cover it when you finish today's quest.`;
  else if (st.count) msg = "Finish today's quest to keep your lantern lit.";
  else msg = "Finish today's quest to light your first lantern.";

  let quest;
  if (due || newCount) {
    quest = `
      <div class="stats3 quest-tiles">
        <div><b>${due}</b><span>reviews</span></div>
        <div><b>${newKana.length}</b><span>new kana</span></div>
        <div><b>${newWords.length}</b><span>new words</span></div>
        <div><b>${newPhrases.length}</b><span>new phrases</span></div>
        ${store.kanjiOpen() ? `<div><b>${newKanji.length}</b><span>new kanji</span></div>` : ''}
      </div>
      ${newCount ? chips([...newKana, ...newWords, ...newKanji].map((it) => it.kana)) : ''}
      ${newPhrases.length ? `<div class="phrase-preview">${newPhrases.map((p) => `<div><span class="kana">${esc(p.jp)}</span> <span class="muted">${esc(p.en)}</span></div>`).join('')}</div>` : ''}
      <button class="btn primary big" id="start">⚔️ Start battle · about ${plural(mins, 'min')}</button>`;
  } else {
    quest = `
      <p class="done-msg">All done for today ✓</p>
      <p class="muted center">${tomorrow ? `Come back tomorrow for ${plural(tomorrow, 'review')}.` : 'Come back tomorrow.'}</p>
      ${upcoming ? `<button class="btn big" id="extra">Learn an extra row: <span class="kana">${upcoming.name}</span></button>` : ''}
      ${readyWords ? `<button class="btn big" id="extraWords">Learn 5 more words (${readyWords} ready)</button>` : ''}`;
  }

  view.innerHTML = `
    <section class="panel hero">
      <div class="hero-lantern ${st.litToday ? 'lit' : ''}">${lantern(st.litToday, 5)}</div>
      <div class="hero-text">
        <div class="big-num">${st.count}<span>day streak</span></div>
        <div class="freezes" title="Streak freezes cover missed days.">${'❄'.repeat(st.freezes) || '–'} <span>${plural(st.freezes, 'freeze')} left</span></div>
        <p class="muted">${msg}</p>
      </div>
    </section>
    <section class="panel">
      <h2>Today's quest</h2>
      ${quest}
    </section>
    ${extras.map((e) => e.html).join('')}
    <section class="panel">
      <h2>Progress</h2>
      ${progressBar('Hiragana ひらがな', ITEMS.filter((it) => it.script === 'hira'), (it) => it.key)}
      ${progressBar('Katakana カタカナ', ITEMS.filter((it) => it.script === 'kata'), (it) => it.key)}
      ${progressBar(`Words ことば <span class="muted">(${readyWords} ready to learn)</span>`, WORDS, (w) => w.key)}
      ${screens.homeProgress?.() || ''}
      ${activity()}
      <button class="btn ghost wide-btn" id="stats">📈 See all stats</button>
    </section>`;

  $('#start')?.addEventListener('click', () => go('study'));
  $('#extra')?.addEventListener('click', () => { store.addBonusRow(); go('study'); });
  $('#extraWords')?.addEventListener('click', () => { store.addBonusWords(); go('study'); });
  $('#stats').onclick = () => go('stats');
  extras.forEach((e) => e.bind?.());
  setKeys((e) => { if (e.key === 'Enter' && $('#start')) go('study'); });
}
screens.home = showHome;
