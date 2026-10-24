// Arcade: three mini-games that practise what you already know. They pay a few coins
// (capped per day) but never touch your review schedule.
import * as store from '../store.js';
import { state } from '../store.js';
import { ITEMS } from '../kana.js';
import { WORDS, units } from '../vocab.js';
import { isCorrect, shuffle } from '../session.js';
import { speak } from '../speech.js';
import { sfx } from '../sfx.js';
import { view, $, $$, esc, plural, setKeys, setScreen, screens, go, onLeave, renderHud } from '../ui.js';

const learnedKana = () => ITEMS.filter((it) => state.cards[it.key]);
const learnedWords = () => WORDS.filter((w) => state.cards[w.key]);

const GAMES = [
  { id: 'rain', name: 'Kana Rain', jp: 'かなの あめ', emoji: '🌧️', desc: 'Type each falling kana before it lands.', need: () => (learnedKana().length >= 5 ? '' : 'Learn 5 kana first.'), play: () => kanaRain() },
  { id: 'match', name: 'Memory Match', jp: 'しんけいすいじゃく', emoji: '🃏', desc: 'Flip cards to pair each kana or word with its meaning.', need: () => (learnedKana().length >= 6 ? '' : 'Learn 6 kana first.'), play: () => memoryMatch() },
  { id: 'builder', name: 'Word Builder', jp: 'ことば づくり', emoji: '🧱', desc: 'Spell words from kana tiles.', need: () => (builderWords().length >= 4 ? '' : 'Learn 4 words first.'), play: () => wordBuilder() },
];

function showArcade() {
  setScreen('arcade', { tab: 'town' });
  const today = state.arcade.day === store.today() ? state.arcade.coins : 0;
  view.innerHTML = `
    <section class="panel">
      <button class="icon-btn back" id="back">← Town</button>
      <h2>🕹️ <span class="kana">ゲームセンター</span> <span class="muted">Arcade</span></h2>
      <p class="muted">Coins earned here today: 🪙 ${today} / 30</p>
      <div class="story-list">
        ${GAMES.map((g) => {
    const need = g.need();
    return `
          <button class="story-card game ${need ? 'locked' : ''}" data-g="${g.id}" ${need ? 'disabled' : ''}>
            <span class="game-emoji">${g.emoji}</span>
            <span><span class="st-title">${g.name}</span> <span class="kana muted">${g.jp}</span></span>
            <span class="muted">${g.desc}</span>
            <small>${need ? `🔒 ${need}` : `Best: ${state.arcade.best[g.id] || 0}`}</small>
          </button>`;
  }).join('')}
      </div>
    </section>`;
  $('#back').onclick = () => go('town');
  $$('.story-card.game:not([disabled])').forEach((c) => { c.onclick = () => GAMES.find((g) => g.id === c.dataset.g).play(); });
}
screens.arcade = showArcade;

function gameFrame(title) {
  setScreen('arcade-play', { tab: 'town', session: true });
  view.innerHTML = `
    <div class="session-top">
      <button class="btn small ghost quit-btn" id="quit">✕ Leave</button>
      <div class="game-title">${title}</div>
      <div class="combo" id="score"></div>
    </div>
    <div id="game"></div>`;
  $('#quit').onclick = showArcade;
  return $('#game');
}

function gameOver(game, score, coins, lines = '') {
  const r = store.arcadeReward(game, score, coins);
  renderHud();
  sfx(r.newBest ? 'victory' : 'coin');
  $('#game').innerHTML = `
    <section class="panel summary">
      <h2>${r.newBest ? 'New best score!' : 'Game over'}</h2>
      <div class="big-num center">${score}<span>points</span></div>
      ${lines}
      <div class="loot"><b>🪙 +${r.paid}</b><span>${r.capped ? 'Daily arcade limit reached. Come back tomorrow!' : `Best: ${r.best}`}</span></div>
      <button class="btn primary big" id="again">Play again</button>
      <button class="btn ghost wide-btn" id="exit">Back to the arcade</button>
    </section>`;
  $('#again').onclick = () => GAMES.find((g) => g.id === game).play();
  $('#exit').onclick = showArcade;
  $('#again').focus();
}

// ---- Kana Rain ----
// Two ways to answer: tap mode (six romaji buttons, no keyboard; the default on phones,
// where the keyboard would cover the rain) and type mode (the default with a real keyboard).

const PAD_SIZE = 6;
const touchFirst = () => window.matchMedia('(pointer: coarse)').matches;

function kanaRain() {
  const root = gameFrame('🌧️ Kana Rain');
  const pool = learnedKana();
  const GAME_MS = 60000;
  const mode = state.settings.rainMode || (touchFirst() ? 'tap' : 'type');
  let score = 0, lives = 3, combo = 0, elapsed = 0, spawnIn = 0, last = 0, running = true;
  const drops = [];
  root.innerHTML = `
    <div class="rain-hud">
      <span id="lives"></span>
      <button class="btn small ghost" id="rainMode">${mode === 'tap' ? '⌨️ Type instead' : '👆 Tap instead'}</button>
      <span id="clock">60</span>
    </div>
    <div class="rain" id="rain"></div>
    ${mode === 'tap'
    ? '<div class="rain-pad" id="pad"></div>'
    : '<input id="rainIn" class="answer" placeholder="type romaji" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Type the romaji">'}`;
  const field = $('#rain');
  const hud = () => {
    $('#lives').textContent = '❤'.repeat(lives) + '🖤'.repeat(3 - lives);
    $('#score').textContent = `${score}`;
  };
  hud();
  $('#rainMode').onclick = () => {
    state.settings.rainMode = mode === 'tap' ? 'type' : 'tap';
    store.save();
    kanaRain();
  };

  // Pops the lowest falling kana that matches; returns false if none did.
  const pop = (matches) => {
    const hit = drops.filter((d) => !d.dead && matches(d.item)).sort((a, b) => b.y - a.y)[0];
    if (!hit) return false;
    hit.dead = true;
    combo += 1;
    score += 1 + Math.floor(combo / 5);
    hit.el.classList.add('pop-out');
    setTimeout(() => hit.el.remove(), 300);
    sfx('hit');
    hud();
    return true;
  };

  const cleanups = [];
  let onSpawn = () => {};

  if (mode === 'tap') {
    // Six buttons that keep their places; a new kana's sound replaces a button nobody needs.
    const pad = $('#pad');
    const slots = [];
    for (const it of shuffle(pool)) {
      if (slots.length >= PAD_SIZE) break;
      if (!slots.includes(it.romaji)) slots.push(it.romaji);
    }
    pad.innerHTML = slots.map((r, i) => `<button class="pad-btn" data-i="${i}">${r}</button>`).join('');
    const buttons = $$('.pad-btn', pad);
    onSpawn = (item) => {
      if (slots.includes(item.romaji)) return;
      const needed = new Set(drops.filter((d) => !d.dead).map((d) => d.item.romaji));
      let i = slots.findIndex((s) => !needed.has(s));
      if (i < 0) i = Math.floor(Math.random() * slots.length);
      slots[i] = item.romaji;
      buttons[i].textContent = item.romaji;
    };
    buttons.forEach((b) => {
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!running) return;
        const r = slots[Number(b.dataset.i)];
        if (pop((item) => item.romaji === r)) return;
        combo = 0;
        sfx('wrong');
        b.classList.remove('nope');
        void b.offsetWidth;
        b.classList.add('nope');
        setTimeout(() => b.classList.remove('nope'), 400);
      });
    });
  } else {
    const input = $('#rainIn');
    input.focus();
    input.addEventListener('input', () => {
      if (pop((item) => isCorrect(item, input.value))) input.value = '';
    });
    // When the on-screen keyboard opens, shrink the field so it and the input stay in view.
    const fit = () => {
      const vv = window.visualViewport;
      const viewH = vv ? vv.height : window.innerHeight;
      const top = field.getBoundingClientRect().top;
      const room = viewH - top - input.offsetHeight - 20;
      field.style.height = `${Math.max(150, Math.min(340, room))}px`;
    };
    window.visualViewport?.addEventListener('resize', fit);
    window.addEventListener('resize', fit);
    cleanups.push(() => {
      window.visualViewport?.removeEventListener('resize', fit);
      window.removeEventListener('resize', fit);
    });
    fit();
  }

  const tick = (t) => {
    if (!running) return;
    const dt = last ? Math.min(100, t - last) : 0;
    last = t;
    elapsed += dt;
    spawnIn -= dt;
    const h = field.clientHeight;
    const progress = elapsed / GAME_MS;
    if (spawnIn <= 0) {
      const item = pool[Math.floor(Math.random() * pool.length)];
      const el = document.createElement('div');
      el.className = 'drop kana';
      el.textContent = item.kana;
      el.style.left = `${6 + Math.random() * 78}%`;
      field.append(el);
      drops.push({ item, el, y: -40, speed: (h + 40) / (6500 - 3000 * progress) });
      onSpawn(item);
      spawnIn = 1700 - 900 * progress;
    }
    for (const d of drops) {
      if (d.dead) continue;
      d.y += d.speed * dt;
      d.el.style.transform = `translateY(${d.y}px)`;
      if (d.y > h - 34) {
        d.dead = true;
        combo = 0;
        lives -= 1;
        d.el.classList.add('missed');
        d.el.textContent = `${d.item.kana} ${d.item.romaji}`;
        setTimeout(() => d.el.remove(), 900);
        sfx('hurt');
        hud();
      }
    }
    $('#clock').textContent = Math.max(0, Math.ceil((GAME_MS - elapsed) / 1000));
    if (lives <= 0 || elapsed >= GAME_MS) {
      running = false;
      cleanups.forEach((f) => f());
      return gameOver('rain', score, Math.floor(score / 3), `<p class="muted center">${lives > 0 ? 'You survived the storm!' : 'The rain got through.'}</p>`);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  onLeave(() => {
    running = false;
    cleanups.forEach((f) => f());
  });
}

// ---- Memory Match ----

function memoryMatch() {
  const root = gameFrame('🃏 Memory Match');
  const words = learnedWords();
  const useWords = words.length >= 6 && Math.random() < 0.5;
  const answerOf = (it) => (useWords ? it.meaning : it.romaji);
  // Every answer card must be unique (ジュ and じゅ are both "ju").
  const picks = [];
  for (const it of shuffle(useWords ? words : learnedKana())) {
    if (picks.length < 6 && !picks.some((p) => answerOf(p) === answerOf(it) || p.kana === it.kana)) picks.push(it);
  }
  const cards = shuffle(picks.flatMap((it, i) => [
    { pair: i, text: it.kana, kana: true, say: it.kana },
    { pair: i, text: answerOf(it), kana: false },
  ]));
  let open = [], matched = 0, moves = 0, lock = false;
  const t0 = performance.now();
  root.innerHTML = `
    <p class="muted center">${useWords ? 'Match each word to its meaning.' : 'Match each kana to its sound.'}</p>
    <div class="memory">${cards.map((c, i) => `<button class="mcard" data-i="${i}"><span class="back">?</span><span class="front ${c.kana ? 'kana' : 'en'}">${esc(c.text)}</span></button>`).join('')}</div>`;
  $('#score').textContent = '0 moves';
  $$('.mcard').forEach((b) => {
    b.onclick = () => {
      if (lock || b.classList.contains('up')) return;
      const c = cards[Number(b.dataset.i)];
      b.classList.add('up');
      if (c.say) speak(c.say);
      open.push([b, c]);
      if (open.length < 2) return;
      moves += 1;
      $('#score').textContent = plural(moves, 'move');
      const [[b1, c1], [b2, c2]] = open;
      open = [];
      if (c1.pair === c2.pair) {
        b1.classList.add('done');
        b2.classList.add('done');
        sfx('correct');
        matched += 1;
        if (matched === picks.length) {
          const secs = Math.round((performance.now() - t0) / 1000);
          const score = Math.max(10, 100 - (moves - 6) * 8 - Math.max(0, secs - 30));
          setTimeout(() => gameOver('match', score, Math.round(score / 10), `<p class="muted center">${plural(moves, 'move')} in ${secs}s</p>`), 600);
        }
      } else {
        lock = true;
        sfx('wrong');
        setTimeout(() => { b1.classList.remove('up'); b2.classList.remove('up'); lock = false; }, 800);
      }
    };
  });
}

// ---- Word Builder ----

const builderWords = () => learnedWords().filter((w) => units(w.kana).length >= 2 && units(w.kana).length <= 6);

function wordBuilder() {
  const root = gameFrame('🧱 Word Builder');
  const rounds = shuffle(builderWords()).slice(0, 8);
  const kanaPool = learnedKana();
  let round = 0, score = 0;

  const play = () => {
    if (round >= rounds.length) return gameOver('builder', score, score * 2, `<p class="muted center">${score} of ${rounds.length} words spelled</p>`);
    const w = rounds[round];
    const answer = units(w.kana);
    const decoys = shuffle(kanaPool.filter((k) => k.script === w.script && !answer.includes(k.kana))).slice(0, 3).map((k) => k.kana);
    const tiles = shuffle([...answer, ...decoys]).map((k, i) => ({ k, i, used: false }));
    const slots = [];
    $('#score').textContent = `${round + 1} / ${rounds.length}`;

    const render = () => {
      root.innerHTML = `
        <div class="card quiz">
          <div class="prompt">Spell the word for</div>
          <div class="emoji">${w.emoji}</div>
          <div class="meaning big">${esc(w.meaning)}</div>
          <div class="slots">${answer.map((_, i) => `<button class="slot-tile kana" data-s="${i}">${slots[i] !== undefined ? tiles[slots[i]].k : ''}</button>`).join('')}</div>
          <div class="tiles">${tiles.map((t) => `<button class="tile kana" data-t="${t.i}" ${t.used ? 'disabled' : ''}>${t.k}</button>`).join('')}</div>
          <div id="fb"></div>
        </div>`;
      $$('.tile', root).forEach((b) => {
        b.onclick = () => {
          const t = tiles[Number(b.dataset.t)];
          const free = answer.findIndex((_, i) => slots[i] === undefined);
          if (free < 0) return;
          slots[free] = t.i;
          t.used = true;
          if (slots.filter((s) => s !== undefined).length === answer.length) check();
          else render();
        };
      });
      $$('.slot-tile', root).forEach((b) => {
        b.onclick = () => {
          const i = Number(b.dataset.s);
          if (slots[i] === undefined) return;
          tiles[slots[i]].used = false;
          slots[i] = undefined;
          render();
        };
      });
    };

    const check = () => {
      render();
      const built = slots.map((s) => tiles[s].k).join('');
      const ok = built === answer.join('');
      $$('.tile, .slot-tile', root).forEach((b) => { b.disabled = true; });
      speak(w.kana);
      if (ok) {
        score += 1;
        sfx('correct');
        $('#fb').innerHTML = `<div class="fb right"><span><b class="kana">${esc(w.kana)}</b> ${esc(w.romaji)}</span><span class="xp">+1</span></div>`;
        setTimeout(() => { round += 1; play(); }, 1100);
      } else {
        sfx('wrong');
        $('.slots', root).classList.add('shake');
        $('#fb').innerHTML = `<div class="fb wrong"><div>It's <b class="kana">${esc(w.kana)}</b> ${esc(w.romaji)}</div><button class="btn primary" id="cont">Next</button></div>`;
        $('#cont').onclick = () => { round += 1; play(); };
        $('#cont').focus();
      }
    };
    render();
  };
  play();
}
