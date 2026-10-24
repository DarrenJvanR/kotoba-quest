// Saved progress: cards, XP, streak, daily history and settings, kept in localStorage.
import { GROUPS, ITEMS } from './kana.js';
import { REGIONS } from './regions.js';
import { WORDS, isUnlocked } from './vocab.js';
import { KANJI } from './kanji.js';
import { PHRASES } from './phrases.js';
import { unknownKana } from './stories.js';
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
    travel: { current: 'home', visited: ['home'], claimed: {} },
    stories: {},
    arcade: { day: null, coins: 0, best: {} },
    items: { charms: 0, hints: 0 },
    sentences: [],
    streak: { count: 0, last: null, freezes: FREEZES_PER_MONTH, month: monthKey() },
    history: {},
    newToday: { day: null, groups: [], words: [], bonus: 0, bonusWords: 0 },
    settings: { rowsPerDay: 1, wordsPerDay: 5, souvenirsPerDay: 3, phrasesPerDay: 3, kanjiPerDay: 3, autoplay: true, speechRate: 'normal', listening: true, sfx: true, kanaFont: 'gothic' },
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
  if (state.newToday.day !== day) state.newToday = { day, groups: [], words: [], phrases: [], kanji: [], bonus: 0, bonusWords: 0 };
  state.newToday.words ||= [];
  state.newToday.phrases ||= [];
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

// Souvenir words and phrases of the town you're in come first, so arriving in Kyoto feels like it.
function hereFirst(list) {
  const here = state.travel?.current;
  if (!here || here === 'home') return list;
  return [...list.filter((x) => x.region === here), ...list.filter((x) => x.region !== here)];
}

// Words to teach next: unseen words you can already read, in deck order. While visiting a
// town, its souvenir words have their own daily allowance on top of the usual words.
export function nextNewWords() {
  const log = newTodayLog();
  const here = state.travel?.current || 'home';
  const picked = WORDS.filter((w) => log.words.includes(w.key) && !state.cards[w.key]);
  const fresh = (w) => !state.cards[w.key] && !log.words.includes(w.key) && regionOpen(w) && isUnlocked(w, state.cards);
  const startedHere = log.words.filter((k) => WORDS.find((w) => w.key === k)?.region === here).length;
  let souvenirs = here === 'home' ? 0 : (state.settings.souvenirsPerDay ?? 3) - startedHere;
  for (const w of WORDS) {
    if (souvenirs <= 0) break;
    if (w.region !== here || !fresh(w)) continue;
    picked.push(w);
    souvenirs -= 1;
  }
  let budget = state.settings.wordsPerDay + log.bonusWords * WORDS_PER_BONUS - (log.words.length - startedHere);
  for (const w of hereFirst(WORDS)) {
    if (budget <= 0) break;
    if (!fresh(w) || picked.includes(w)) continue;
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
  return WORDS.filter((w) => !state.cards[w.key] && regionOpen(w) && isUnlocked(w, state.cards)).length;
}

// Phrases unlock like words: once every kana in them has been learned.
export const phraseUnlocked = (p) => regionOpen(p) && unknownKana(p.jp, state.cards).length === 0;

export function nextNewPhrases() {
  const log = newTodayLog();
  const picked = PHRASES.filter((p) => log.phrases.includes(p.key) && !state.cards[p.key]);
  let budget = state.settings.phrasesPerDay - log.phrases.length;
  for (const p of hereFirst(PHRASES)) {
    if (budget <= 0) break;
    if (state.cards[p.key] || log.phrases.includes(p.key) || !phraseUnlocked(p)) continue;
    picked.push(p);
    budget -= 1;
  }
  return picked;
}

export function markPhraseStarted(key) {
  const log = newTodayLog();
  if (!log.phrases.includes(key)) log.phrases.push(key);
  save();
}

export function readyPhraseCount() {
  return PHRASES.filter((p) => !state.cards[p.key] && phraseUnlocked(p)).length;
}

// Kanji lessons open with the library in town, or straight away with "Skip ahead".
export const kanjiOpen = () => hasBuilt('library') || !!state.settings.kanjiEarly;

// "I already know these": cards start strong and come back for a light check over the
// next few weeks, spread out so they don't all land on one day.
export function markKnown(items) {
  const day = today();
  let n = 0;
  for (const it of items) {
    if ((state.cards[it.key]?.s || 0) >= 7) continue;
    state.cards[it.key] = { s: 20, d: 4, last: day, due: day + 5 + (n % 25), reps: 1, lapses: 0, skipped: true };
    n += 1;
  }
  save();
  return n;
}

// Kanji to teach next (library must be built). A kanji waits until its parts are known
// or are being taught earlier in the same session.
export function nextNewKanji() {
  if (!kanjiOpen()) return [];
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

// ---- travel ----

const travel = () => (state.travel ||= { current: 'home', visited: ['home'], claimed: {} });

// Souvenir words and phrases only open once you've been to their town.
export const regionOpen = (item) => !item.region || travel().visited.includes(item.region);
export const currentRegion = () => REGIONS[travel().current] || REGIONS.home;
export const hasVisited = (id) => travel().visited.includes(id);

// What a ticket still needs: a list of { label, have, need } goals, plus whether coins suffice.
export function ticketStatus(id) {
  const r = REGIONS[id];
  const goals = [];
  if (r.requires?.hira) goals.push({ label: 'hiragana learned', have: ITEMS.filter((it) => it.script === 'hira' && state.cards[it.key]).length, need: r.requires.hira });
  if (r.requires?.kata) goals.push({ label: 'katakana learned', have: ITEMS.filter((it) => it.script === 'kata' && state.cards[it.key]).length, need: r.requires.kata });
  if (r.requires?.words) goals.push({ label: 'words learned', have: WORDS.filter((w) => !w.region && state.cards[w.key]).length, need: r.requires.words });
  if (r.requires?.kanji) goals.push({ label: 'kanji learned', have: KANJI.filter((k) => state.cards[k.key]).length, need: r.requires.kanji });
  return { goals, ready: goals.every((g) => g.have >= g.need), afford: state.coins >= (r.ticket || 0), visited: hasVisited(id) };
}

export function buyTicket(id) {
  const r = REGIONS[id];
  const st = ticketStatus(id);
  if (st.visited || !st.ready || !st.afford) return false;
  state.coins -= r.ticket;
  travel().visited.push(id);
  travel().current = id;
  save();
  return true;
}

export function travelTo(id) {
  if (!hasVisited(id)) return false;
  travel().current = id;
  save();
  return true;
}

export function claimBook(id, coins) {
  if (travel().claimed[id]) return false;
  travel().claimed[id] = today();
  state.coins += coins;
  save();
  return true;
}

// ---- shop ----

export const SHOP = [
  { id: 'freeze', name: 'Streak freeze', emoji: '❄️', price: 60, max: 5, qty: 1, desc: 'Covers one missed day so your lantern stays lit. Bought freezes never expire.' },
  { id: 'charm', name: 'Heart charm', emoji: '💗', price: 40, max: 3, qty: 1, desc: 'Your next battle starts with 7 hearts instead of 5. One is used at the start of each battle.' },
  { id: 'hints', name: 'Hint scrolls', emoji: '💡', price: 30, max: 30, qty: 3, desc: 'Tap 💡 in a battle question to rule out two wrong answers or get the first letters. Hinted cards come back a little sooner.' },
];

const inventory = () => (state.items ||= { charms: 0, hints: 0 });

export function owned(id) {
  if (id === 'freeze') return state.streak.freezes;
  return inventory()[id === 'charm' ? 'charms' : 'hints'] || 0;
}

export function buy(id) {
  const item = SHOP.find((x) => x.id === id);
  if (!item || state.coins < item.price || owned(id) + item.qty > item.max) return false;
  state.coins -= item.price;
  if (id === 'freeze') state.streak.freezes += item.qty;
  else inventory()[id === 'charm' ? 'charms' : 'hints'] += item.qty;
  save();
  return true;
}

// Takes one charm or hint from the bag; false when there are none.
export function useItem(kind) {
  const bag = inventory();
  if (!bag[kind]) return false;
  bag[kind] -= 1;
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
    // Top up to the monthly allowance; freezes bought in the shop are kept.
    state.streak.freezes = Math.max(state.streak.freezes, freezesPerMonth());
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
