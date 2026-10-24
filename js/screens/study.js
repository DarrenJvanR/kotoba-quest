// The daily session: intros and quizzes on the bottom, the battle on top, then a summary.
import * as store from '../store.js';
import { state } from '../store.js';
import { Session, isCorrect, itemFor, shuffle } from '../session.js';
import { SITUATIONS, REGISTER } from '../phrases.js';
import { Battle, BattleScene } from '../battle.js';
import { wordTip } from '../vocab.js';
import { KANJI_BY_CHAR } from '../kanji.js';
import { speak, hasVoice } from '../speech.js';
import { sfx } from '../sfx.js';
import { view, modal, $, $$, esc, plural, setKeys, setScreen, screens, go, onLeave, lantern, renderHud, audioBtn, chips, confirmDialog, wordHead } from '../ui.js';

let session = null;
// The typing question that currently owns the shared answer box.
let typing = null;
let battle = null;
let scene = null;

export const mnemonicFor = (it) => state.notes[it.key] || it.mnemonic;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function startSession() {
  const s = new Session({ voice: hasVoice });
  if (s.done) return go('home');
  setScreen('session', { tab: 'home', session: true });
  session = s;
  // A heart charm from the shop is used up at the start of the battle.
  const charmed = store.useItem('charms');
  battle = new Battle(s.questionCount, { bonusHearts: charmed ? 2 : 0 });
  view.innerHTML = `
    <div class="session-top">
      <button class="btn small ghost quit-btn" id="quit">✕ Leave</button>
      <div class="bar"><i style="width:0%"></i></div>
      <div class="combo"></div>
    </div>
    <div id="battle"></div>
    <div id="stage"></div>
    <form id="typebar" class="typebar" autocomplete="off" hidden>
      <input id="ans" class="answer" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Your answer">
      <div class="row"><button type="button" class="btn ghost" id="idk">Not sure</button><button class="btn primary grow">Check</button></div>
    </form>`;
  // The answer box is never rebuilt, so once the keyboard is open it stays open from one
  // typing question to the next (phones only open it on a tap).
  const input = $('#ans');
  input.addEventListener('input', () => typing?.onInput(input.value));
  $('#typebar').addEventListener('submit', (e) => { e.preventDefault(); typing?.onSubmit(input.value); });
  $('#idk').onclick = () => typing?.onIdk();
  scene = new BattleScene($('#battle'), battle);
  scene.start();
  if (charmed) setTimeout(() => scene?.say('💗 Heart charm: 7 hearts this battle!', 2200), 700);
  onLeave(() => {
    scene?.destroy();
    scene = null;
    session = null;
  });
  $('#quit').onclick = askLeave;
  renderStep();
}
screens.study = startSession;

async function askLeave() {
  if (!session || !modal.hidden) return;
  const leave = await confirmDialog('Leave this battle? Your answers and coins so far are saved, and you can pick up the rest later.', { ok: 'Leave battle', cancel: 'Keep fighting' });
  if (leave) go('home');
}

// Escape also offers to leave (when no dialog is already open).
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && session && modal.hidden) askLeave();
});

function setCombo(n) {
  const el = $('.combo');
  if (!el) return;
  el.textContent = n >= 2 ? `🔥 ${n}` : '';
  el.classList.toggle('hot', n >= 5);
}

function renderStep() {
  if (!session) return;
  const step = session.current();
  if (!step) return finishSession();
  setKeys(null);
  const willType = step.type === 'quiz' && (step.mode === 'type' || step.mode === 'recall');
  if (!willType) {
    typing = null;
    $('#typebar').hidden = true;
    $('#ans').blur();
  }
  $('.session-top .bar i').style.width = `${session.progress * 100}%`;
  setCombo(session.stats.combo);
  if (step.type === 'intro') renderIntro(step);
  else renderQuiz(step);
}

function advance() {
  if (!session) return;
  session.next();
  renderStep();
}

// ---- intros ----

function renderIntro(step) {
  const it = step.item;
  const isWord = it.type === 'word';
  const prev = session.steps[session.i - 1];
  if (!prev || prev.type !== 'intro' || prev.item.type !== it.type) {
    const say = { word: 'New words to learn!', phrase: 'Useful phrases!', kanji: it.radical ? 'A kanji building block!' : 'New kanji!' }[it.type];
    scene?.say(say || 'A new kana!');
    sfx('learn');
  }
  const tip = isWord ? wordTip(it) : '';
  if (it.type === 'phrase') {
    $('#stage').innerHTML = phraseCard(it, `
      <div class="row">${audioBtn(it.kana)}<button class="btn primary grow" id="next">Got it →</button></div>`);
    $('#next').onclick = advance;
    $('#next').focus();
    if (state.settings.autoplay) speak(it.kana);
    setKeys((e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
    });
    return;
  }
  if (it.type === 'kanji') {
    $('#stage').innerHTML = kanjiCard(it, `
      <div class="row"><button class="btn primary grow" id="next">Got it →</button></div>`);
    $('#next').onclick = advance;
    $('#next').focus();
    if (state.settings.autoplay && kanjiSay(it)) speak(kanjiSay(it));
    setKeys((e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
    });
    return;
  }
  $('#stage').innerHTML = isWord ? `
    <div class="card intro pop">
      <div class="tag">New word · ${esc(it.theme)}</div>
      <div class="emoji">${it.emoji}</div>
      ${wordHead(it)}
      <div class="romaji">${esc(it.romaji)}</div>
      <div class="meaning">${esc(it.meaning)}</div>
      ${it.kanji ? '' : '<div class="kanji-note">Usually written in kana, no kanji</div>'}
      ${tip ? `<p class="mnemonic">${esc(tip)}</p>` : ''}
      <div class="row">${audioBtn(it.kana)}<button class="btn primary grow" id="next">Got it →</button></div>
    </div>` : `
    <div class="card intro pop">
      <div class="tag">New kana · <span class="kana">${step.group.name}</span></div>
      <div class="glyph kana">${it.kana}</div>
      <div class="romaji">${it.romaji}</div>
      <p class="mnemonic">${esc(mnemonicFor(it))}</p>
      <div class="row">${audioBtn(it.kana)}<button class="btn primary grow" id="next">Got it →</button></div>
    </div>`;
  $('#next').onclick = advance;
  $('#next').focus();
  if (state.settings.autoplay) speak(it.kana);
  setKeys((e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); }
  });
}

// Readings are written like おお-きい・ダイ: hiragana is the Japanese (kun) reading, with the
// part after "-" spelled out in kana; katakana is the Chinese-origin (on) reading.
const kanjiReadings = (k) => (k.readings ? k.readings.split('・').filter(Boolean) : []);
const sayable = (reading) => reading.replace(/-/g, '');

// What to say aloud for a kanji: its first example word, or else its first reading.
export const kanjiSay = (k) => k.words[0]?.kana || sayable(kanjiReadings(k)[0] || '');

export function kanjiCard(k, footer = '', isNew = true) {
  const parts = k.parts.map((p) => KANJI_BY_CHAR[p]).filter(Boolean);
  const voice = hasVoice();
  const readings = kanjiReadings(k).map((r) => {
    const on = /[゠-ヿ]/.test(r);
    const title = on ? 'Chinese-origin reading (on)' : 'Japanese reading (kun)';
    return voice
      ? `<button class="reading-chip kana ${on ? 'on' : 'kun'}" data-say="${esc(sayable(r))}" title="${title}">🔊 ${esc(r)}</button>`
      : `<span class="reading-chip kana ${on ? 'on' : 'kun'}" title="${title}">${esc(r)}</span>`;
  }).join('');
  const word = (w) => (voice
    ? `<button class="kword" data-say="${esc(w.kana)}"><b class="kana">${esc(w.kanji)}</b> <span class="kana">${esc(w.kana)}</span> · ${esc(w.meaning)} <span class="say-icon">🔊</span></button>`
    : `<span class="kword"><b class="kana">${esc(w.kanji)}</b> <span class="kana">${esc(w.kana)}</span> · ${esc(w.meaning)}</span>`);
  return `
    <div class="card intro pop">
      <div class="tag">${k.radical ? 'Building block' : isNew ? 'New kanji' : 'Kanji'}</div>
      <div class="glyph kanji">${k.char}</div>
      <div class="meaning big">${esc(k.meaning)}</div>
      ${readings ? `<div class="readings">${readings}</div><div class="readings-hint">hiragana: Japanese reading · katakana: Chinese-origin reading</div>` : ''}
      ${parts.length ? `<div class="parts">Look for ${parts.map((p) => `<span class="part"><b class="kana">${p.char}</b> ${esc(p.meaning)}</span>`).join(' + ')}</div>` : ''}
      <p class="mnemonic"><span class="aid-label">Memory story · a memory aid, not the kanji's real history</span>${esc(state.notes[k.key] || k.mnemonic)}</p>
      ${k.words.length ? `<div class="kwords">${k.words.slice(0, 4).map(word).join('')}</div>` : ''}
      ${footer}
    </div>`;
}

export function phraseCard(p, footer = '', isNew = true) {
  const sit = SITUATIONS[p.situation];
  return `
    <div class="card intro pop">
      <div class="tag">${isNew ? 'New phrase' : 'Phrase'} · ${sit.emoji} ${esc(sit.name)}</div>
      <div class="sentence kana">${esc(p.jp)}</div>
      <div class="romaji phrase-romaji">${esc(p.romaji)}</div>
      <div class="meaning big">${esc(p.en)}</div>
      <div class="register reg-${p.register}">${REGISTER[p.register]}</div>
      ${p.note ? `<p class="mnemonic">${esc(p.note)}</p>` : ''}
      ${footer}
    </div>`;
}

// ---- quizzes ----

const PROMPTS = {
  pmeaning: () => 'What does this mean?',
  psay: () => 'How would you say this?',
  pgap: () => 'Fill the gap',
  pbuild: () => 'Put the words in order',
  plisten: () => 'What did you hear?',
  kmeaning: (it) => (it.radical ? 'What does this building block mean?' : 'What does this kanji mean?'),
  kchar: () => 'Which kanji means this?',
  kread: () => 'How is this word read?',
  sentence: () => 'Do you understand this sentence?',
  type: () => 'What sound is this?',
  pick: () => 'Which kana makes this sound?',
  listen: (it) => (it.type === 'word' ? 'What does this word mean?' : 'Which kana do you hear?'),
  meaning: () => 'What does this mean?',
  reverse: () => 'Which word means this?',
  recall: () => 'How do you say this in Japanese?',
};

function promptHtml(step) {
  const it = step.item;
  const p = `<div class="prompt">${PROMPTS[step.mode](it)}</div>`;
  switch (step.mode) {
    case 'type': return `${p}<div class="glyph kana">${it.kana}</div>`;
    case 'pick': return `${p}<div class="romaji big">${it.romaji}</div>${audioBtn(it.kana)}`;
    case 'listen': return `${p}<button class="btn listen" data-say="${esc(it.kana)}">🔊 Play again</button>`;
    case 'meaning': return `${p}${wordHead(it)}`;
    case 'reverse':
    case 'recall': return `${p}<div class="emoji">${it.emoji}</div><div class="meaning big">${esc(it.meaning)}</div>`;
    case 'kmeaning': return `${p}<div class="glyph kanji">${it.char}</div>`;
    case 'kchar': return `${p}<div class="meaning big">${esc(it.meaning)}</div>`;
    case 'pmeaning': return `${p}<div class="sentence kana">${esc(it.jp)}</div>`;
    case 'psay': return `${p}<div class="tag">${SITUATIONS[it.situation].emoji} ${esc(SITUATIONS[it.situation].name)}</div><div class="meaning big">${esc(it.en)}</div>`;
    case 'pgap': return `${p}<div class="sentence kana">${it.chunks.map((c, i) => (i === step.gap ? '<span class="gap">　　　</span>' : esc(c))).join(' ')}</div><div class="muted">${esc(it.en)}</div>`;
    case 'plisten': return `${p}<button class="btn listen" data-say="${esc(it.kana)}">🔊 Play again</button>`;
    case 'kread': return `${p}<div class="word kanji">${esc(step.readWord.kanji)}</div><div class="muted">meaning: ${esc(step.readWord.meaning)}</div>`;
    default: return p;
  }
}

function choiceLabel(step, c) {
  if (c.type === 'chunk') return `<span class="kana">${esc(c.text)}</span>`;
  if (c.type === 'phrase') return step.mode === 'psay' ? `<span class="kana">${esc(c.jp)}</span>` : `<span>${esc(c.en)}</span>`;
  if (c.type === 'kanji') return step.mode === 'kchar' ? `<span class="kanji">${c.char}</span>` : `<span>${esc(c.meaning)}</span>`;
  if (step.mode === 'kread') return `<span class="kana">${esc(c.kana)}</span>`;
  if (c.type === 'kana') return `<span class="kana">${c.kana}</span>`;
  if (step.mode === 'reverse') return `<span class="kana">${esc(c.kana)}</span>`;
  return `<span>${esc(c.meaning)}</span>`;
}

function renderQuiz(step) {
  const it = step.item;
  const stage = $('#stage');
  const t0 = performance.now();
  const typed = step.mode === 'type' || step.mode === 'recall';
  let answerKey = it.key;
  if (step.mode === 'kread') answerKey = step.readWord.key;
  if (step.mode === 'pgap') answerKey = `gap:${it.chunks[step.gap]}`;
  let answered = false;

  // Hint scrolls from the shop: one per question. A hinted answer is graded no higher than
  // "hard", so the card comes back sooner.
  const hintHtml = () => (store.owned('hints') && !step.hinted
    ? `<button type="button" class="btn small ghost hint-btn" id="hint">💡 Hint <b>${store.owned('hints')}</b></button>`
    : '');
  const takeHint = () => {
    if (answered || step.hinted || !store.useItem('hints')) return false;
    step.hinted = true;
    sfx('learn');
    return true;
  };

  if (step.mode === 'sentence') {
    stage.innerHTML = `
      <div class="card quiz">
        <div class="prompt">${PROMPTS.sentence()}</div>
        <div class="sentence kana">${esc(it.jp)}</div>
        ${audioBtn(it.jp)}
        <div id="reveal"><button class="btn primary big" id="show">Show meaning</button></div>
        <div id="fb"></div>
      </div>`;
    if (state.settings.autoplay) speak(it.jp);
    const show = () => {
      $('#reveal').innerHTML = `
        <div class="meaning">${esc(it.en || '(no translation saved)')}</div>
        ${it.note ? `<p class="mnemonic">${esc(it.note)}</p>` : ''}
        <div class="grades">
          <button class="btn" data-g="1"><small>1</small> Forgot</button>
          <button class="btn" data-g="2"><small>2</small> Hard</button>
          <button class="btn primary" data-g="3"><small>3</small> Got it</button>
        </div>`;
      $$('.grades .btn').forEach((b) => { b.onclick = () => selfGrade(Number(b.dataset.g)); });
      setKeys((e) => { if (['1', '2', '3'].includes(e.key)) selfGrade(Number(e.key)); });
    };
    const selfGrade = (g) => {
      if (answered) return;
      $$('.grades .btn').forEach((b) => { b.disabled = true; });
      finishSelf(g);
    };
    $('#show').onclick = show;
    $('#show').focus();
    setKeys((e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  } else if (step.mode === 'pbuild') {
    // Tap the chunks in order; tap a placed chunk to send it back.
    let tiles = shuffle(it.chunks.map((text, i) => ({ text, i })));
    for (let n = 0; n < 5 && tiles.map((t) => t.text).join(' ') === it.jp; n++) tiles = shuffle(tiles);
    const placed = [];
    const draw = () => {
      stage.innerHTML = `
        <div class="card quiz">
          ${promptHtml(step)}
          <div class="meaning big">${esc(it.en)}</div>
          <div class="build-line">${placed.map((t, n) => `<button class="chunk placed kana" data-n="${n}">${esc(t.text)}</button>`).join('') || '<span class="muted">Tap the words below</span>'}</div>
          <div class="build-tiles">${tiles.map((t, n) => `<button class="chunk kana" data-t="${n}" ${placed.includes(t) ? 'disabled' : ''}><small>${n + 1}</small>${esc(t.text)}</button>`).join('')}</div>
          <div class="hint-row">${answered ? '' : hintHtml()}</div>
          <div id="fb"></div>
        </div>`;
      $$('.chunk[data-t]', stage).forEach((b) => { b.onclick = () => place(tiles[Number(b.dataset.t)]); });
      $('#hint', stage)?.addEventListener('click', () => {
        if (!takeHint()) return;
        const wrongAt = placed.findIndex((t, n) => t.text !== it.chunks[n]);
        if (wrongAt >= 0) placed.splice(wrongAt);
        const next = tiles.find((t) => !placed.includes(t) && t.text === it.chunks[placed.length]);
        if (next) place(next);
        else draw();
      });
      $$('.chunk.placed', stage).forEach((b) => { b.onclick = () => { if (answered) return; placed.splice(Number(b.dataset.n), 1); draw(); }; });
    };
    const place = (t) => {
      if (answered || placed.includes(t)) return;
      placed.push(t);
      draw();
      if (placed.length === tiles.length) {
        const built = placed.map((x) => x.text).join(' ');
        $$('.chunk', stage).forEach((b) => { b.disabled = true; });
        finish(built === it.jp, built === it.jp ? null : built);
      }
    };
    draw();
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= tiles.length) place(tiles[n - 1]);
      if (e.key === 'Backspace' && placed.length && !answered) { placed.pop(); draw(); }
    });
  } else if (typed) {
    stage.innerHTML = `
      <div class="card quiz">
        ${promptHtml(step)}
        <div class="hint-row">${hintHtml()}<span class="hint-text" id="hintText"></span></div>
        <div id="fb"></div>
      </div>`;
    const input = $('#ans');
    const bar = $('#typebar');
    input.value = '';
    input.placeholder = step.mode === 'recall' ? 'type it in romaji or kana' : 'type it in romaji';
    bar.classList.remove('done');
    bar.hidden = false;
    typing = {
      // Kana answers are short enough to accept the moment they're right.
      onInput: (v) => { if (!answered && it.type === 'kana' && isCorrect(it, v)) finish(true); },
      onSubmit: (v) => {
        if (answered) { if (session?.steps[session.i] === step) advance(); return; }
        if (v.trim()) finish(isCorrect(it, v), v.trim());
      },
      onIdk: () => { if (!answered) finish(false); },
    };
    input.focus({ preventScroll: true });
    $('#hint')?.addEventListener('click', () => {
      if (!takeHint()) return;
      const shown = it.romaji.slice(0, it.type === 'kana' ? 1 : Math.min(2, it.romaji.length - 1) || 1);
      $('#hintText').textContent = `Starts with “${shown}…”`;
      $('#hint').remove();
      input.focus();
    });
  } else {
    const textual = ['meaning', 'listen', 'kmeaning', 'pmeaning', 'psay', 'plisten'].includes(step.mode) && it.type !== 'kana';
    const wordGrid = ['reverse', 'kread', 'pgap'].includes(step.mode);
    stage.innerHTML = `
      <div class="card quiz">
        ${promptHtml(step)}
        <div class="choices ${textual ? 'list' : ''} ${wordGrid ? 'words' : ''}">
          ${step.choices.map((c, i) => `<button class="choice" data-k="${esc(c.key)}"><small>${i + 1}</small>${choiceLabel(step, c)}</button>`).join('')}
        </div>
        <div class="hint-row">${hintHtml()}</div>
        <div id="fb"></div>
      </div>`;
    const buttons = $$('.choice', stage);
    buttons.forEach((b) => { b.onclick = () => choose(b); });
    $('#hint')?.addEventListener('click', () => {
      if (!takeHint()) return;
      shuffle(buttons.filter((b) => b.dataset.k !== answerKey)).slice(0, 2).forEach((b) => { b.disabled = true; b.classList.add('ruled-out'); });
      $('#hint').remove();
    });
    if (step.mode === 'listen' || step.mode === 'plisten') speak(it.kana);
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= buttons.length) choose(buttons[n - 1]);
    });
  }

  function choose(btn) {
    if (answered || btn.disabled) return;
    const ok = btn.dataset.k === answerKey;
    $$('.choice', stage).forEach((b) => { b.disabled = true; });
    btn.classList.add(ok ? 'right' : 'wrong');
    stage.querySelector(`.choice[data-k="${CSS.escape(answerKey)}"]`).classList.add('right');
    const picked = itemFor(btn.dataset.k);
    finish(ok, ok ? null : picked);
  }

  // Mined sentences: "Forgot" counts as a miss, anything else as a hit.
  function finishSelf(grade) {
    finish(grade > 1, null, grade);
  }

  function finish(correct, given, selfGrade) {
    if (answered || !session) return;
    answered = true;
    const res = session.submit(correct, performance.now() - t0, selfGrade, step.hinted);
    $('.hint-row', stage)?.replaceChildren();
    if (correct) scene?.heroAttack(battle.hit(res.combo));
    else {
      sfx('wrong');
      scene?.monsterAttack(battle.hurt());
    }
    renderHud();
    setCombo(res.combo);
    // The answer box stays focused (keyboard open) but takes no more answers for this question.
    if (typed) $('#typebar').classList.add('done');
    const card = stage.querySelector('.card');
    const spoken = step.mode === 'kread' ? step.readWord.kana : it.type === 'kanji' ? kanjiSay(it) : it.kana;
    if (spoken && it.type !== 'sentence' && (state.settings.autoplay || !correct)) speak(spoken);
    let answerLine;
    if (step.mode === 'kread') answerLine = `<b class="kana">${esc(step.readWord.kanji)}</b> <span class="kana">${esc(step.readWord.kana)}</span> · ${esc(step.readWord.meaning)}`;
    else if (it.type === 'kanji') answerLine = `<b class="kana">${it.char}</b> ${esc(it.meaning)} <span class="kana muted">${esc(it.readings)}</span>`;
    else if (it.type === 'sentence') answerLine = correct ? 'Nice! It\'ll come back later.' : 'It\'ll come back again soon.';
    else if (it.type === 'phrase') answerLine = `<b class="kana">${esc(it.jp)}</b><br><span>${esc(it.romaji)}</span> · ${esc(it.en)}`;
    else if (it.type === 'word') answerLine = `<b class="kana">${it.kanji ? `${esc(it.kanji)}（${esc(it.kana)}）` : esc(it.kana)}</b> <span>${esc(it.romaji)}</span> · ${esc(it.meaning)}`;
    else answerLine = `<b class="kana">${it.kana}</b> = ${it.romaji}`;

    if (correct) {
      card.classList.add('flash-right');
      $('#fb').innerHTML = `<div class="fb right"><span>${answerLine}</span><span class="xp">+${res.gained} XP</span></div>`;
      const t = setTimeout(advance, { word: 1300, phrase: 1700 }[it.type] || 900);
      setKeys((e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(t); advance(); } });
      return;
    }
    card.classList.add('shake');
    let note = '';
    if (typeof given === 'string') note = `<div class="muted">You ${step.mode === 'pbuild' ? 'built' : 'typed'} “${esc(given)}”</div>`;
    else if (given?.type === 'phrase') note = `<div class="muted">You picked ${esc(given.jp)} (${esc(given.en)})</div>`;
    else if (given) note = `<div class="muted">You picked ${given.type === 'word' ? `${esc(given.kana)} (${esc(given.meaning)})` : given.type === 'kanji' ? `${given.char} (${esc(given.meaning)})` : `“${esc(given.romaji)}”`}</div>`;
    let help;
    if (it.type === 'word') help = `${it.emoji} ${esc(wordTip(it) || (it.kanji ? `Kanji: ${it.kanji}` : ''))}`;
    else if (it.type === 'sentence') help = esc(it.en || '');
    else if (it.type === 'phrase') help = esc(it.note || '');
    else help = esc(mnemonicFor(it));
    $('#fb').innerHTML = `
      <div class="fb wrong">
        <div>${answerLine}</div>
        ${note}
        ${help.trim() ? `<p class="mnemonic">${help}</p>` : ''}
        <button class="btn primary" id="cont">Continue</button>
      </div>`;
    $('#cont').onclick = advance;
    $('#cont').focus();
    setKeys((e) => { if (e.key === 'Enter') { e.preventDefault(); advance(); } });
  }
}

// ---- summary ----

function starsFor(acc, kos) {
  if (!kos && acc >= 90) return 3;
  if (!kos || acc >= 75) return 2;
  return 1;
}

async function finishSession() {
  const s = session.stats;
  const b = battle;
  setKeys(null);
  $('#stage').innerHTML = '';
  await scene?.queue;
  await wait(b.won ? 900 : 200);
  if (!session) return;

  const before = store.streakStatus();
  const allDone = store.dueCards().length === 0;
  const streak = allDone ? store.lightStreak() : before;
  const newlyLit = allDone && !before.litToday;
  const acc = s.answered ? Math.round((s.correct / s.answered) * 100) : 100;
  const stars = starsFor(acc, b.kos);
  const bonus = stars * 5;
  state.coins += bonus;
  store.save();
  setScreen('summary', { tab: 'home' });

  const tomorrow = store.dueOn(store.today() + 1);
  const upcoming = store.upcomingGroup();
  const more = !upcoming && store.readyWordCount() > 0;
  const defeated = b.defeated.map((m) => `<span class="chip kana">${esc(m.name)}</span>`).join('');

  view.innerHTML = `
    <section class="panel summary">
      <div class="hero-lantern ${streak.litToday ? 'lit' : ''} ${newlyLit ? 'ignite' : ''}">${lantern(streak.litToday, 7)}</div>
      <h2>${newlyLit ? `Day ${streak.count}! Lantern lit.` : 'Session complete!'}</h2>
      ${streak.usedFreezes ? `<p class="muted center">Used ${plural(streak.usedFreezes, 'streak freeze')} to cover missed days.</p>` : ''}
      <div class="stars" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div>
      <div class="stats3">
        <div><b>${acc}%</b><span>accuracy</span></div>
        <div><b>+${s.xp}</b><span>XP</span></div>
        <div><b>${s.bestCombo}</b><span>best combo</span></div>
      </div>
      <div class="loot">
        <div><b>🪙 +${b.coins + bonus}</b><span>${b.coins} from monsters, ${bonus} star bonus</span></div>
        ${b.kos ? `<div class="muted">Knocked out ${plural(b.kos, 'time')}, revived by the lantern.</div>` : ''}
      </div>
      ${defeated ? `<h3>Defeated</h3><div class="chips">${defeated}</div>` : ''}
      ${s.learned.length ? `<h3>Learned today</h3>${chips(s.learned.map((it) => it.jp || it.kana))}` : ''}
      <p class="muted center">Tomorrow: ${plural(tomorrow, 'review')}.</p>
      <button class="btn primary big" id="home">Back home</button>
      ${upcoming ? `<button class="btn ghost" id="extra">Learn another row: <span class="kana">${upcoming.name}</span></button>` : ''}
      ${more ? '<button class="btn ghost" id="extraWords">Learn 5 more words</button>' : ''}
    </section>`;
  $('#home').onclick = () => go('home');
  $('#home').focus();
  $('#extra')?.addEventListener('click', () => { store.addBonusRow(); startSession(); });
  $('#extraWords')?.addEventListener('click', () => { store.addBonusWords(); startSession(); });
  setKeys((e) => { if (e.key === 'Enter') { e.preventDefault(); go('home'); } });
}
