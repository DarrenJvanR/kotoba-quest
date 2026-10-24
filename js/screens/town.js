// The town: spend battle coins on buildings. Some unlock features (arcade, stories, kanji).
import * as store from '../store.js';
import { state } from '../store.js';
import { STORIES } from '../stories.js';
import { sfx } from '../sfx.js';
import { view, $, $$, esc, plural, setScreen, screens, go, openModal, renderHud } from '../ui.js';

export const BUILDINGS = [
  { id: 'dojo', jp: 'どうじょう', kanji: '道場', en: 'Dojo', emoji: '🥋', cost: 0, desc: 'Where your daily battles start.', open: 'study', openLabel: 'Start battle' },
  { id: 'arcade', jp: 'ゲームセンター', en: 'Arcade', emoji: '🕹️', cost: 40, desc: 'Three mini-games: Kana Rain, Memory Match and Word Builder.', open: 'arcade', openLabel: 'Play' },
  { id: 'teahouse', jp: 'ちゃや', kanji: '茶屋', en: 'Tea house', emoji: '🍵', cost: 60, desc: 'Granny serves tea and stories. Opens story scenes.', open: 'story', openLabel: 'Visit' },
  { id: 'garden', jp: 'にわ', kanji: '庭', en: 'Garden', emoji: '🌸', cost: 80, desc: 'Cherry trees and a new friend, Hana.', open: 'story', openLabel: 'Visit' },
  { id: 'ramen', jp: 'ラーメンや', kanji: 'ラーメン屋', en: 'Ramen shop', emoji: '🍜', cost: 90, desc: 'Order your first bowl, in Japanese.', open: 'story', openLabel: 'Visit' },
  { id: 'shrine', jp: 'じんじゃ', kanji: '神社', en: 'Shrine', emoji: '⛩️', cost: 120, desc: 'Gives one extra streak freeze every month, and a fortune to read.', open: 'story', openLabel: 'Visit' },
  { id: 'library', jp: 'としょかん', kanji: '図書館', en: 'Library', emoji: '📚', cost: 150, desc: 'Unlocks kanji lessons, taught through their building blocks.', open: 'kanji', openLabel: 'Study kanji' },
  { id: 'station', jp: 'えき', kanji: '駅', en: 'Station', emoji: '🚉', cost: 200, desc: 'Take a trip to Kyoto. Two travel stories.', open: 'story', openLabel: 'Visit' },
  { id: 'castle', jp: 'しろ', kanji: '城', en: 'Castle', emoji: '🏯', cost: 500, desc: 'The crown of every town. Pure bragging rights.' },
];

const TOWN_NAMES = [[8, 'みやこ', 'capital'], [5, 'まち', 'town'], [2, 'むら', 'village'], [0, 'あきち', 'empty lot']];

function townName() {
  const n = state.town.built.length;
  return TOWN_NAMES.find(([min]) => n >= min);
}

function storiesFor(id) {
  return STORIES.filter((s) => s.building === id);
}

function showTown() {
  setScreen('town');
  const [, name, en] = townName();
  const next = BUILDINGS.find((b) => !store.hasBuilt(b.id));
  const tile = (b) => {
    const built = store.hasBuilt(b.id);
    const afford = state.coins >= b.cost;
    const fresh = built && storiesFor(b.id).some((s) => !state.stories[s.id]);
    return `
      <button class="plot ${built ? 'built' : 'empty'} ${!built && afford ? 'afford' : ''}" data-b="${b.id}">
        <img class="plot-art" src="art/town/${built ? b.id : 'lot'}.png" alt="">
        ${built ? '' : '<span class="plot-lock">🔨</span>'}
        <span class="plot-name kana">${built ? esc(b.jp) : esc(b.en)}</span>
        <small>${built ? esc(b.en) : `🪙 ${b.cost}`}</small>
        ${fresh ? '<i class="dot" title="New story"></i>' : ''}
      </button>`;
  };
  view.innerHTML = `
    <section class="panel town-head">
      <div><span class="kana town-name">${name}</span> <span class="muted">${en}</span></div>
      <div class="coins big">🪙 ${state.coins}</div>
    </section>
    <section class="town">
      ${BUILDINGS.map(tile).join('')}
    </section>
    <p class="muted center small-note">${next ? `Next: ${esc(next.en)} for 🪙 ${next.cost}. Win battles to earn coins.` : 'Your town is complete! おめでとう！'}</p>`;
  $$('.plot').forEach((p) => { p.onclick = () => openBuilding(p.dataset.b); });
}
screens.town = showTown;

function openBuilding(id) {
  const b = BUILDINGS.find((x) => x.id === id);
  const built = store.hasBuilt(id);
  const stories = storiesFor(id);
  const { el, close } = openModal(`
    <img class="building-art" src="art/town/${built ? b.id : 'lot'}.png" alt="">
    ${built ? '' : `<p class="muted center">Not built yet. It will look like this once built:</p><img class="building-art preview" src="art/town/${b.id}.png" alt="">`}
    <div class="word kana center">${esc(b.jp)}</div>
    <div class="romaji">${b.kanji ? `<span class="kana">${esc(b.kanji)}</span> · ` : ''}${esc(b.en)}</div>
    <p class="center">${esc(b.desc)}</p>
    ${stories.length ? `<p class="muted center">${plural(stories.length, 'story')} here · ${stories.filter((s) => state.stories[s.id]).length} read</p>` : ''}
    ${built
    ? (b.open ? `<button class="btn primary big" id="enter">${b.openLabel}</button>` : '<p class="done-msg">Built ✓</p>')
    : `<button class="btn primary big" id="build" ${state.coins < b.cost ? 'disabled' : ''}>Build for 🪙 ${b.cost}</button>
       ${state.coins < b.cost ? `<p class="muted center">You need ${b.cost - state.coins} more coins.</p>` : ''}`}`);
  $('#enter', el)?.addEventListener('click', () => { close(); go(b.open, b.id); });
  $('#build', el)?.addEventListener('click', () => {
    if (!store.build(id, b.cost)) return;
    sfx('build');
    close();
    renderHud();
    showTown();
    const p = $(`.plot[data-b="${id}"]`);
    p?.classList.add('just-built');
  });
}

// Home screen panel pointing at the town.
const prevExtras = screens.homeExtras;
screens.homeExtras = () => {
  const list = prevExtras?.() || [];
  const next = BUILDINGS.find((b) => !store.hasBuilt(b.id));
  const affordable = next && state.coins >= next.cost;
  list.push({
    html: `
      <section class="panel town-teaser" id="townTeaser" role="button" tabindex="0">
        <div class="tt-art">${state.town.built.slice(-4).map((id) => `<img src="art/town/${id}.png" alt="">`).join('')}</div>
        <div>
          <b>Your town · <span class="kana">${townName()[1]}</span></b>
          <p class="muted">${next ? (affordable ? `You can build the ${esc(next.en)} now! 🔨` : `Next build: ${esc(next.en)} (🪙 ${state.coins} / ${next.cost})`) : 'Complete!'}</p>
        </div>
      </section>`,
    bind: () => {
      const t = $('#townTeaser');
      t.onclick = () => go('town');
      t.onkeydown = (e) => { if (e.key === 'Enter') go('town'); };
    },
  });
  return list;
};
