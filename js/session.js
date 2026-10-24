// One study session: due reviews first, then today's new kana rows, then new words.
// Only the first answer of the day for each card is graded; misses come back a few steps later.
import { BY_KANA, ITEMS, lookalikes } from './kana.js';
import { WORDS, WORD_BY_KEY, isWordCorrect } from './vocab.js';
import { KANJI, KANJI_BY_KEY } from './kanji.js';
import { Rating } from './fsrs.js';
import * as store from './store.js';

const RETRY_GAP = 4;

function sentenceItem(id) {
  const s = store.state.sentences.find((x) => x.id === id);
  return s && { key: `s:${id}`, type: 'sentence', kana: s.jp, ...s };
}

export function itemFor(key) {
  if (key.startsWith('w:')) return WORD_BY_KEY[key];
  if (key.startsWith('k:')) return KANJI_BY_KEY[key];
  if (key.startsWith('s:')) return sentenceItem(key.slice(2));
  return BY_KANA[key];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isCorrect(item, input) {
  if (item.type === 'word') return isWordCorrect(item, input);
  const raw = input.trim();
  const v = raw.toLowerCase().replace(/\s+/g, '');
  return item.answers.includes(v) || raw === item.kana;
}

// Answer speed tells us how well it is known, so no self-rating buttons are needed
// (except for your own mined sentences, which you grade yourself).
export function gradeFor({ correct, ms, mode, isNew, item, selfGrade }) {
  if (selfGrade) return selfGrade;
  if (!correct) return Rating.Again;
  let g;
  if (mode === 'type' || mode === 'recall') {
    const easy = item.type === 'word' ? 4000 + 500 * item.units.length : 3000;
    const slow = item.type === 'word' ? 12000 : 8000;
    g = ms <= easy ? Rating.Easy : ms <= slow ? Rating.Good : Rating.Hard;
  } else {
    g = ms <= (item.type === 'kana' ? 6000 : 7000) ? Rating.Good : Rating.Hard;
  }
  return isNew ? Math.min(g, Rating.Good) : g;
}

// Three wrong kana: look-alikes first, then other kana the learner has met.
function kanaChoices(item, pool) {
  const sameSound = (x) => x.answers.some((a) => item.answers.includes(a));
  const sameShape = (x) => (x.kana.length > 1) === (item.kana.length > 1);
  const picked = [];
  const add = (strict) => (x) => {
    if (picked.length >= 3 || !x || x.kana === item.kana || x.script !== item.script) return;
    if (sameSound(x) || picked.includes(x) || (strict && !sameShape(x))) return;
    picked.push(x);
  };
  shuffle(lookalikes(item.kana).map((k) => BY_KANA[k]).filter((x) => pool.has(x.key))).forEach(add(true));
  shuffle(ITEMS.filter((x) => pool.has(x.key))).forEach(add(true));
  shuffle(ITEMS).forEach(add(true));
  shuffle(ITEMS).forEach(add(false));
  return shuffle([item, ...picked]);
}

// Three wrong words: same theme and already met first.
function wordChoices(item, pool) {
  const picked = [];
  const add = (x) => {
    if (picked.length >= 3 || x === item || x.kana === item.kana || x.meaning === item.meaning || picked.includes(x)) return;
    picked.push(x);
  };
  const met = WORDS.filter((w) => pool.has(w.key));
  shuffle(met.filter((w) => w.theme === item.theme)).forEach(add);
  shuffle(met).forEach(add);
  shuffle(WORDS.filter((w) => w.theme === item.theme)).forEach(add);
  shuffle(WORDS).forEach(add);
  return shuffle([item, ...picked]);
}

// Kanji choices are shown as meanings or as characters; for readings, as deck words.
function kanjiChoices(item, pool, mode) {
  if (mode === 'kread') {
    const word = item.readWord;
    const others = shuffle(WORDS.filter((w) => w.kanji && w.kana !== word.kana && w.key !== word.key));
    const met = others.filter((w) => pool.has(w.key));
    return shuffle([word, ...[...met, ...others].filter((w, i, a) => a.indexOf(w) === i).slice(0, 3)]);
  }
  const picked = [];
  const add = (x) => {
    if (picked.length >= 3 || x === item || x.meaning === item.meaning || picked.includes(x)) return;
    picked.push(x);
  };
  shuffle(KANJI.filter((k) => pool.has(k.key) && k.radical === item.radical)).forEach(add);
  shuffle(KANJI.filter((k) => pool.has(k.key))).forEach(add);
  shuffle(KANJI).forEach(add);
  return shuffle([item, ...picked]);
}

export class Session {
  constructor({ voice }) {
    this.voice = voice;
    this.steps = [];
    this.i = 0;
    this.stats = { answered: 0, correct: 0, combo: 0, bestCombo: 0, xp: 0, learned: [] };

    const due = shuffle(store.dueCards()).map(itemFor).filter(Boolean);
    this.reviewCount = due.length;
    for (const it of due) this.steps.push(this.quiz(it, { first: true }));

    const newItems = [];
    for (const { group, items } of store.nextNewGroups()) {
      for (const it of items) this.steps.push({ type: 'intro', item: it, group });
      for (const it of shuffle(items)) this.steps.push(this.quiz(it, { first: true, isNew: true, mode: 'pick' }));
      for (const it of shuffle(items)) this.steps.push(this.quiz(it, { mode: 'type' }));
      newItems.push(...items);
    }
    const words = store.nextNewWords();
    for (const w of words) this.steps.push({ type: 'intro', item: w });
    for (const w of shuffle(words)) this.steps.push(this.quiz(w, { first: true, isNew: true, mode: 'meaning' }));
    for (const w of shuffle(words)) this.steps.push(this.quiz(w, { mode: 'reverse' }));
    newItems.push(...words);
    const kanji = store.nextNewKanji();
    for (const k of kanji) this.steps.push({ type: 'intro', item: k });
    for (const k of shuffle(kanji)) this.steps.push(this.quiz(k, { first: true, isNew: true, mode: 'kmeaning' }));
    for (const k of shuffle(kanji)) this.steps.push(this.quiz(k, { mode: 'kchar' }));
    newItems.push(...kanji);

    this.newCount = newItems.length;
    this.pool = new Set([...Object.keys(store.state.cards), ...newItems.map((it) => it.key)]);
    // Every original question ends in exactly one correct answer, so this is the battle's total HP.
    this.questionCount = this.steps.filter((s) => s.type === 'quiz').length;
  }

  quiz(item, { first = false, isNew = false, mode } = {}) {
    return { type: 'quiz', item, first, isNew, mode: mode || this.pickMode(item) };
  }

  pickMode(item) {
    const r = Math.random();
    const listen = this.voice() && store.state.settings.listening;
    if (item.type === 'sentence') return 'sentence';
    if (item.type === 'kanji') {
      if (!item.radical && item.words.length && r < 0.3) return 'kread';
      return r < 0.65 ? 'kmeaning' : 'kchar';
    }
    if (item.type === 'word') {
      if (listen && r < 0.15) return 'listen';
      if (r < 0.45) return 'meaning';
      if (r < 0.7) return 'reverse';
      return 'recall';
    }
    if (listen && r < 0.2) return 'listen';
    if (r < 0.4) return 'pick';
    return 'type';
  }

  get done() {
    return this.i >= this.steps.length;
  }

  get progress() {
    return this.steps.length ? this.i / this.steps.length : 1;
  }

  current() {
    const step = this.steps[this.i];
    if (!step) return null;
    if (step.type === 'intro') {
      if (step.group) store.markGroupsStarted([step.group.id]);
      else if (step.item.type === 'kanji') store.markKanjiStarted(step.item.key);
      else store.markWordStarted(step.item.key);
    }
    if (step.type === 'quiz') {
      const it = step.item;
      if (step.mode === 'listen' && !this.voice()) step.mode = it.type === 'word' ? 'meaning' : 'pick';
      if (step.mode === 'kread' && !step.readWord) step.readWord = shuffle(it.words)[0];
      const needsChoices = !['type', 'recall', 'sentence'].includes(step.mode);
      if (needsChoices && !step.choices) {
        if (it.type === 'kanji') step.choices = kanjiChoices({ ...it, readWord: step.readWord }, this.pool, step.mode);
        else if (it.type === 'word') step.choices = wordChoices(it, this.pool);
        else step.choices = kanaChoices(it, this.pool);
      }
    }
    return step;
  }

  submit(correct, ms, selfGrade) {
    const step = this.steps[this.i];
    const s = this.stats;
    if (step.first) {
      store.recordReview(step.item.key, gradeFor({ correct, ms, mode: step.mode, isNew: step.isNew, item: step.item, selfGrade }), correct);
      s.answered += 1;
      if (correct) s.correct += 1;
      if (step.isNew) s.learned.push(step.item);
    }
    let gained = 0;
    if (correct) {
      s.combo += 1;
      s.bestCombo = Math.max(s.bestCombo, s.combo);
      gained = step.first ? 10 + Math.min(s.combo, 10) : 3;
    } else {
      s.combo = 0;
      const retryMode = { word: 'meaning', kanji: 'kmeaning', sentence: 'sentence' }[step.item.type] || 'type';
      const retry = this.quiz(step.item, { mode: retryMode });
      this.steps.splice(Math.min(this.i + RETRY_GAP, this.steps.length), 0, retry);
    }
    s.xp += gained;
    store.state.xp += gained;
    store.state.bestCombo = Math.max(store.state.bestCombo, s.bestCombo);
    store.save();
    return { correct, gained, combo: s.combo };
  }

  next() {
    this.i += 1;
    return this.current();
  }
}
