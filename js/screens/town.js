// The town you're in: spend battle coins on its buildings. Some unlock features (arcade,
// stories, kanji); the station sells tickets to other towns.
import * as store from '../store.js';
import { state } from '../store.js';
import { STORIES, unknownKana, storyText } from '../stories.js';
import { ITEMS } from '../kana.js';
import { WORDS, units } from '../vocab.js';
import { BUILDINGS, buildingArt } from '../regions.js';
import { sfx } from '../sfx.js';
import { view, $, $$, esc, plural, setScreen, screens, go, openModal, renderHud } from '../ui.js';

export { BUILDINGS };

const TOWN_NAMES = [[8, 'みやこ', 'capital'], [5, 'まち', 'town'], [2, 'むら', 'village'], [0, 'あきち', 'empty lot']];
const regionBuildings = (id) => BUILDINGS.filter((b) => b.region === id);

// The home village grows its name as you build; other towns keep theirs.
export function placeName(region = store.currentRegion()) {
  if (region.id !== 'home') return [region.kanji, region.en];
  const n = regionBuildings('home').filter((b) => store.hasBuilt(b.id)).length;
  const [, jp, en] = TOWN_NAMES.find(([min]) => n >= min);
  return [jp, en];
}

export function storiesFor(id) {
  return STORIES.filter((s) => s.building === id);
}

const canTravel = () => store.hasBuilt('station') || store.currentRegion().id !== 'home';

// Why a building has nothing to do yet, or null when something inside is ready.
// Unbuilt buildings stay locked until then, so coins never go on a place you can't use.
export function lockReason(b) {
  if (b.id === 'arcade') {
    const kana = ITEMS.filter((it) => state.cards[it.key]).length;
    const words = WORDS.filter((w) => state.cards[w.key] && units(w.kana).length >= 2 && units(w.kana).length <= 6).length;
    return kana >= 5 || words >= 4 ? null : `Learn ${5 - kana} more kana to play Kana Rain.`;
  }
  if (b.id === 'castle') {
    const left = regionBuildings('home').filter((x) => x.id !== 'castle' && !store.hasBuilt(x.id)).length;
    return left ? `Build every other building first (${left} to go).` : null;
  }
  const stories = storiesFor(b.id);
  if (!stories.length) return null;
  const missing = stories.map((st) => unknownKana(storyText(st), state.cards)).sort((x, y) => x.length - y.length)[0];
  if (!missing.length) return null;
  return `Learn ${missing.length} more kana to read its first story: ${missing.slice(0, 8).join(' ')}${missing.length > 8 ? '…' : ''}`;
}

function showTown() {
  setScreen('town');
  const here = store.currentRegion();
  const list = regionBuildings(here.id);
  const [name, en] = placeName(here);
  const next = list.find((b) => !store.hasBuilt(b.id) && !lockReason(b));
  const tile = (b) => {
    const built = store.hasBuilt(b.id);
    const locked = !!lockReason(b);
    const afford = state.coins >= b.cost && !locked;
    const fresh = built && !locked && storiesFor(b.id).some((s) => !state.stories[s.id] && !unknownKana(storyText(s), state.cards).length);
    return `
      <button class="plot ${built ? 'built' : 'empty'} ${!built && afford ? 'afford' : ''} ${locked ? 'locked' : ''}" data-b="${b.id}">
        <img class="plot-art" src="${built ? buildingArt(b) : 'art/town/lot.png'}" alt="">
        ${locked ? '<span class="plot-lock" title="Locked">🔒</span>' : built ? '' : '<span class="plot-lock">🔨</span>'}
        <span class="plot-name kana">${built ? esc(b.jp) : esc(b.en)}</span>
        <small>${built ? esc(b.en) : `🪙 ${b.cost}`}</small>
        ${fresh ? '<i class="dot" title="New story"></i>' : ''}
      </button>`;
  };
  view.innerHTML = `
    <section class="panel town-head">
      <div><span class="kana town-name">${esc(name)}</span> <span class="muted">${esc(en)}</span></div>
      <div class="coins big">🪙 ${state.coins}</div>
    </section>
    <div class="town-buttons">
      <button class="btn small" id="shop">🛒 Shop</button>
      <button class="btn small" id="stamps">📖 Stamps</button>
      ${canTravel() ? '<button class="btn small primary" id="travel">🚃 Travel</button>' : ''}
    </div>
    <section class="town">
      ${list.map(tile).join('')}
    </section>
    <p class="muted center small-note">${next ? `Next: ${esc(next.en)} for 🪙 ${next.cost}. Win battles to earn coins.` : (list.some((b) => !store.hasBuilt(b.id)) ? 'The next buildings open as you learn more kana. 🔒 shows what each one needs.' : `${esc(en)} is complete! おめでとう！`)}</p>`;
  $$('.plot').forEach((p) => { p.onclick = () => openBuilding(p.dataset.b); });
  $('#shop').onclick = () => go('shop');
  $('#stamps').onclick = () => go('stamps');
  $('#travel')?.addEventListener('click', () => go('travel'));
}
screens.town = showTown;

function openBuilding(id) {
  const b = BUILDINGS.find((x) => x.id === id);
  const built = store.hasBuilt(id);
  const stories = storiesFor(id);
  const why = lockReason(b);
  const { el, close } = openModal(`
    <img class="building-art" src="${built ? buildingArt(b) : 'art/town/lot.png'}" alt="">
    ${built ? '' : `<p class="muted center">Not built yet. It will look like this once built:</p><img class="building-art preview" src="${buildingArt(b)}" alt="">`}
    <div class="word kana center">${esc(b.jp)}</div>
    <div class="romaji">${b.kanji ? `<span class="kana">${esc(b.kanji)}</span> · ` : ''}${esc(b.en)}</div>
    <p class="center">${esc(b.desc)}</p>
    ${stories.length ? `<p class="muted center">${plural(stories.length, 'story')} here · ${stories.filter((s) => state.stories[s.id]).length} read</p>` : ''}
    ${why ? `<p class="hint center">🔒 ${esc(why)}</p>` : ''}
    ${built
    ? `${b.open ? `<button class="btn primary big" id="enter">${b.openLabel}</button>` : '<p class="done-msg">Built ✓</p>'}
       ${b.id === 'station' ? '<button class="btn big" id="tickets">🚃 Train tickets</button>' : ''}`
    : `<button class="btn primary big" id="build" ${state.coins < b.cost || why ? 'disabled' : ''}>${why ? '🔒 Locked for now' : `Build for 🪙 ${b.cost}`}</button>
       ${!why && state.coins < b.cost ? `<p class="muted center">You need ${b.cost - state.coins} more coins.</p>` : ''}`}`);
  $('#enter', el)?.addEventListener('click', () => { close(); go(b.open, b.id); });
  $('#tickets', el)?.addEventListener('click', () => { close(); go('travel'); });
  $('#build', el)?.addEventListener('click', () => {
    if (lockReason(b) || !store.build(id, b.cost)) return;
    sfx('build');
    close();
    renderHud();
    showTown();
    $(`.plot[data-b="${id}"]`)?.classList.add('just-built');
  });
}

// Home screen panel pointing at the town you're in.
const prevExtras = screens.homeExtras;
screens.homeExtras = () => {
  const list = prevExtras?.() || [];
  const here = store.currentRegion();
  const mine = regionBuildings(here.id);
  const next = mine.find((b) => !store.hasBuilt(b.id) && !lockReason(b));
  const affordable = next && state.coins >= next.cost;
  const allBuilt = mine.every((b) => store.hasBuilt(b.id));
  const shown = mine.filter((b) => store.hasBuilt(b.id)).slice(-4);
  list.push({
    html: `
      <section class="panel town-teaser" id="townTeaser" role="button" tabindex="0">
        <div class="tt-art">${shown.map((b) => `<img src="${buildingArt(b)}" alt="">`).join('') || '<img src="art/town/lot.png" alt="">'}</div>
        <div>
          <b>${here.id === 'home' ? 'Your town' : 'Visiting'} · <span class="kana">${esc(placeName(here)[0])}</span></b>
          <p class="muted">${next ? (affordable ? `You can build the ${esc(next.en)} now! 🔨` : `Next build: ${esc(next.en)} (🪙 ${state.coins} / ${next.cost})`) : allBuilt ? 'Complete!' : 'More buildings open as you learn kana. 🔒'}</p>
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
