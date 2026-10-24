// Saved progress: cards, XP, streak, daily history and settings, kept in localStorage.
import { GROUPS } from './kana.js';
import { WORDS, isUnlocked } from './vocab.js';
import { KANJI } from './kanji.js';
import { review } from './fsrs.js';

const KEY = 'kotoba-quest-v1';
const DAY_STARTS_AT_HOUR = 4; // late-night study still counts for "today"
const FREEZES_PER_MONTH = 2;

export function today(date = new Date()) {
  const local = date.getTime() - date.getTimezoneOffset() * 60000 - DAY_STARTS_AT_HOUR * 3600000;
  return Math.floor(local / 86400000);
}

const monthKey = (date = new Date()) => `${date.getFullYear()}-${date.getMonth() + 1}`;

function fresh() {
  return {
    version: 1,
    cards: {},
    notes: {},
    xp: 0,
    coins: 0,
    bestCombo: 0,
    defeated: {},
    town: { built: ['dojo'] },
    stories: {},
    arcade: { day: null, coins: 0, best: {} },
    sentences: [],
    streak: { count: 0, last: null, freezes: FREEZES_PER_MONTH, month: monthKey() },
    history: {},
    newToday: { day: null, groups: [], words: [], bonus: 0, bonusWords: 0 },
    settings: { rowsPerDay: 1, wordsPerDay: 5, kanjiPerDay: 3, autoplay: true, listening: true, sfx: true, kanaFont: 'gothic' },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const saved = JSON.parse(raw);
    const base = fresh();
    return { ...base, ...saved, settings: { ...base.settings, ...saved.settings } };
  } catch {
    return fresh();
  }
}

export const state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked (private window etc.): progress lasts for this visit only.
  }
}

export function replaceState(next) {
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, fresh(), next, { settings: { ...fresh().settings, ...next.settings } });
  save();
}

export function resetState() {
  replaceState(fresh());
}

// ---- cards ----
// Keys are the kana itself for kana cards and "w:..." for words.

export function recordReview(key, grade, correct) {
  const day = today();
  state.cards[key] = review(state.cards[key], grade, day);
  const h = state.history[day] || (state.history[day] = { r: 0, c: 0 });
  h.r += 1;
  if (correct) h.c += 1;
  pruneHistory(day);
}

function pruneHistory(day) {
  for (const k of Object.keys(state.history)) if (+k < day - 90) delete state.history[k];
}

export function dueCards(day = today()) {
  return Object.entries(state.cards).filter(([, c]) => c.due <= day).map(([k]) => k);
}

export function dueOn(day) {
  return Object.values(state.cards).filter((c) => c.due === day).length;
}

// "learning" < 7 days stability, "known" < 21, "mastered" beyond.
export function cardLevel(key) {
  const c = state.cards[key];
  if (!c) return 'unseen';
  if (!c.s || c.s < 7) return 'learning';
  if (c.s < 21) return 'known';
  return 'mastered';
}

// ---- new lessons ----

function newTodayLog() {
  const day = today();
  if (state.newToday.day !== day) state.newToday = { day, groups: [], words: [], kanji: [], bonus: 0, bonusWords: 0 };
  state.newToday.words ||= [];
  state.newToday.kanji ||= [];
  state.newToday.bonusWords ||= 0;
  return state.newToday;
}

// Rows to teach next. Rows already started today can always be finished.
export function nextNewGroups() {
  const log = newTodayLog();
  let budget = state.settings.rowsPerDay + log.bonus - log.groups.length;
  const picked = [];
  for (const g of GROUPS) {
    const unseen = g.items.filter((it) => !state.cards[it.kana]);
    if (!unseen.length) continue;
    if (log.groups.includes(g.id)) { picked.push({ group: g, items: unseen }); continue; }
    if (budget <= 0) break;
    picked.push({ group: g, items: unseen });
    budget -= 1;
  }
  return picked;
}

export function markGroupsStarted(ids) {
  const log = newTodayLog();
  for (const id of ids) if (!log.groups.includes(id)) log.groups.push(id);
  save();
}

export function addBonusRow() {
  newTodayLog().bonus += 1;
  save();
}

export function upcomingGroup() {
  return GROUPS.find((g) => g.items.some((it) => !state.cards[it.kana])) || null;
}

const WORDS_PER_BONUS = 5;

// Words to teach next: unseen words you can already read, in deck order.
export function nextNewWords() {
  const log = newTodayLog();
  const picked = WORDS.filter((w) => log.words.includes(w.key) && !state.cards[w.key]);
  let budget = state.settings.wordsPerDay + log.bonusWords * WORDS_PER_BONUS - log.words.length;
  for (const w of WORDS) {
    if (budget <= 0) break;
    if (state.cards[w.key] || log.words.includes(w.key) || !isUnlocked(w, state.cards)) continue;
    picked.push(w);
    budget -= 1;
  }
  return picked;
}

export function markWordStarted(key) {
  const log = newTodayLog();
  if (!log.words.includes(key)) log.words.push(key);
  save();
}

export function addBonusWords() {
  newTodayLog().bonusWords += 1;
  save();
}

export function readyWordCount() {
  return WORDS.filter((w) => !state.cards[w.key] && isUnlocked(w, state.cards)).length;
}

// Kanji to teach next (library must be built). A kanji waits until its parts are known
// or are being taught earlier in the same session.
export function nextNewKanji() {
  if (!hasBuilt('library')) return [];
  const log = newTodayLog();
  const picked = KANJI.filter((k) => log.kanji.includes(k.key) && !state.cards[k.key]);
  let budget = state.settings.kanjiPerDay - log.kanji.length;
  const ready = (k) => k.parts.every((p) => state.cards[`k:${p}`] || picked.some((x) => x.char === p));
  for (const k of KANJI) {
    if (budget <= 0) break;
    if (state.cards[k.key] || log.kanji.includes(k.key)) continue;
    if (!ready(k)) break;
    picked.push(k);
    budget -= 1;
  }
  return picked;
}

export function markKanjiStarted(key) {
  const log = newTodayLog();
  if (!log.kanji.includes(key)) log.kanji.push(key);
  save();
}

// ---- mined sentences ----
// Sentences you collect yourself. They become cards due today.

export function addSentence({ jp, en, note, source }) {
  const id = Date.now().toString(36);
  state.sentences.push({ id, jp, en, note, source, added: today() });
  state.cards[`s:${id}`] = { due: today(), reps: 0, lapses: 0 };
  save();
  return id;
}

export function deleteSentence(id) {
  state.sentences = state.sentences.filter((s) => s.id !== id);
  delete state.cards[`s:${id}`];
  save();
}

// ---- town ----

export const hasBuilt = (id) => state.town.built.includes(id);

export function build(id, cost) {
  if (hasBuilt(id) || state.coins < cost) return false;
  state.coins -= cost;
  state.town.built.push(id);
  if (id === 'shrine') state.streak.freezes += 1;
  save();
  return true;
}

// Arcade coins are capped per day so games can't replace the daily quest.
const ARCADE_DAILY_CAP = 30;

export function arcadeReward(game, score, coins) {
  const day = today();
  if (state.arcade.day !== day) Object.assign(state.arcade, { day, coins: 0 });
  const paid = Math.max(0, Math.min(coins, ARCADE_DAILY_CAP - state.arcade.coins));
  state.arcade.coins += paid;
  state.coins += paid;
  const best = state.arcade.best[game] || 0;
  if (score > best) state.arcade.best[game] = score;
  save();
  return { paid, best: Math.max(best, score), newBest: score > best, capped: paid < coins };
}

// ---- battle rewards ----

export function recordDefeat(monsterId, coins) {
  state.defeated[monsterId] = (state.defeated[monsterId] || 0) + 1;
  state.coins += coins;
  save();
}

// ---- streak ----

// The shrine in town adds one freeze a month.
export const freezesPerMonth = () => FREEZES_PER_MONTH + (hasBuilt('shrine') ? 1 : 0);

function refreshFreezes() {
  const m = monthKey();
  if (state.streak.month !== m) {
    state.streak.month = m;
    state.streak.freezes = freezesPerMonth();
  }
}

// Missed days are covered by freezes while any are left; otherwise the streak resets.
export function streakStatus() {
  refreshFreezes();
  const { count, last, freezes } = state.streak;
  const day = today();
  if (last === null) return { count: 0, litToday: false, freezes, needFreezes: 0 };
  if (last === day) return { count, litToday: true, freezes, needFreezes: 0 };
  const missed = day - last - 1;
  if (missed > freezes) return { count: 0, litToday: false, freezes, needFreezes: 0, broken: count > 0 };
  return { count, litToday: false, freezes, needFreezes: missed };
}

export function lightStreak() {
  const status = streakStatus();
  if (status.litToday) return { ...status, usedFreezes: 0 };
  state.streak.freezes -= status.needFreezes;
  state.streak.count = status.count + 1;
  state.streak.last = today();
  save();
  return { ...streakStatus(), usedFreezes: status.needFreezes };
}

// ---- XP ----

export function levelInfo(xp = state.xp) {
  let level = 1;
  let need = 100;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need = 100 + (level - 1) * 50;
  }
  return { level, into: rest, need };
}
