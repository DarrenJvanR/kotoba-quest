// FSRS-4.5 spaced repetition (open-spaced-repetition), default weights.
// A card is { s: stability in days, d: difficulty 1-10, last, due (day numbers), reps, lapses }.

const W = [0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824,
  1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466];
const DECAY = -0.5;
const FACTOR = 19 / 81;
const RETENTION = 0.9;
const MAX_INTERVAL = 365;

export const Rating = { Again: 1, Hard: 2, Good: 3, Easy: 4 };

const clampD = (d) => Math.min(10, Math.max(1, d));
const initD = (g) => clampD(W[4] - (g - 3) * W[5]);

export function retrievability(elapsedDays, s) {
  return Math.pow(1 + FACTOR * elapsedDays / s, DECAY);
}

function nextD(d, g) {
  return clampD(W[7] * initD(Rating.Good) + (1 - W[7]) * (d - W[6] * (g - 3)));
}

function recallS(d, s, r, g) {
  const hard = g === Rating.Hard ? W[15] : 1;
  const easy = g === Rating.Easy ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * hard * easy);
}

function forgetS(d, s, r) {
  const fs = W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);
  return Math.min(fs, s);
}

export function intervalFor(s) {
  const days = s / FACTOR * (Math.pow(RETENTION, 1 / DECAY) - 1);
  return Math.min(MAX_INTERVAL, Math.max(1, Math.round(days)));
}

// Grade a card once per day. New and forgotten cards always come back tomorrow
// (a learning step), whatever their stability says.
export function review(card, grade, today) {
  let s, d;
  if (!card || !card.s) {
    s = W[grade - 1];
    d = initD(grade);
  } else {
    const r = retrievability(Math.max(0, today - card.last), card.s);
    s = grade === Rating.Again ? forgetS(card.d, card.s, r) : recallS(card.d, card.s, r, grade);
    d = nextD(card.d, grade);
  }
  const isNew = !card || !card.s;
  return {
    s, d,
    last: today,
    due: today + (isNew || grade === Rating.Again ? 1 : intervalFor(s)),
    reps: (card?.reps || 0) + 1,
    lapses: (card?.lapses || 0) + (!isNew && grade === Rating.Again ? 1 : 0),
  };
}
