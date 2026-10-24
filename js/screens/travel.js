// Travel: train tickets to other towns, and the stamp book you fill as you visit places.
import * as store from '../store.js';
import { state } from '../store.js';
import { REGIONS, REGION_ORDER, BUILDINGS, buildingArt } from '../regions.js';
import { sfx } from '../sfx.js';
import { view, $, $$, esc, setScreen, screens, go, renderHud, confirmDialog, notify } from '../ui.js';
import { storiesFor, placeName } from './town.js';

function showTravel() {
  setScreen('travel', { tab: 'town' });
  const here = store.currentRegion();
  const card = (r) => {
    const st = r.id === 'home' ? { visited: true, goals: [] } : store.ticketStatus(r.id);
    const isHere = r.id === here.id;
    let action;
    if (isHere) action = '<span class="done-tag">📍 You are here</span>';
    else if (st.visited) action = `<button class="btn primary" data-go="${r.id}">Travel</button>`;
    else action = `<button class="btn ${st.ready && st.afford ? 'primary' : ''}" data-buy="${r.id}" ${st.ready && st.afford ? '' : 'disabled'}>${st.ready ? `🎫 ${r.ticket}` : '🔒 Locked'}</button>`;
    const goals = st.visited ? '' : st.goals.map((g) => `
      <div class="goal ${g.have >= g.need ? 'met' : ''}">
        <span>${g.have >= g.need ? '✓' : '○'} ${Math.min(g.have, g.need)} / ${g.need} ${g.label}</span>
        <i style="width:${Math.min(100, (g.have / g.need) * 100)}%"></i>
      </div>`).join('');
    return `
      <div class="panel trip ${isHere ? 'here' : ''}">
        <div class="trip-head">
          <div><span class="kana trip-name">${esc(r.kanji)}</span> <span class="muted">${esc(r.jp)} · ${esc(r.en)}</span></div>
          ${action}
        </div>
        ${r.blurb ? `<p class="muted">${esc(r.blurb)}</p>` : ''}
        ${goals}
        ${!st.visited && st.ready && !st.afford ? `<p class="muted small-note">You need ${r.ticket - state.coins} more coins for the ticket.</p>` : ''}
      </div>`;
  };
  view.innerHTML = `
    <section class="panel town-head">
      <div><button class="icon-btn back" id="back">← Town</button><div><span class="kana town-name">えき</span> <span class="muted">Train tickets</span></div></div>
      <div class="coins big">🪙 ${state.coins}</div>
    </section>
    ${REGION_ORDER.map((id) => card(REGIONS[id])).join('')}
    <p class="muted center small-note">A ticket needs coins and a learning goal, so every town is one you can read. Once bought, you can travel back and forth for free. More towns are coming.</p>`;
  $('#back').onclick = () => go('town');
  $$('[data-go]').forEach((b) => {
    b.onclick = () => {
      store.travelTo(b.dataset.go);
      sfx('build');
      go('town');
    };
  });
  $$('[data-buy]').forEach((b) => {
    b.onclick = async () => {
      const r = REGIONS[b.dataset.buy];
      if (!await confirmDialog(`Buy a ticket to ${r.en} for 🪙 ${r.ticket}? Its souvenir words and phrases join your daily quest, and its monsters join your battles.`, { ok: 'Buy ticket' })) return;
      if (!store.buyTicket(r.id)) return;
      sfx('victory');
      renderHud();
      go('town');
      notify(`ようこそ、${r.kanji}へ！ Welcome to ${r.en}. Build its places to read new stories and collect stamps.`);
    };
  });
}
screens.travel = showTravel;

// ---- stamp book ----
// One stamp per place with stories, pressed the first time you finish one of them.

function stampFor(b) {
  const done = storiesFor(b.id).map((s) => state.stories[s.id]?.done).filter((d) => d !== undefined);
  return done.length ? Math.min(...done) : null;
}

const dateOf = (day) => {
  const d = new Date(day * 86400000 + 4 * 3600000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};

function showStamps() {
  setScreen('stamps', { tab: 'town' });
  const pages = REGION_ORDER.filter((id) => store.hasVisited(id)).map((id) => {
    const r = REGIONS[id];
    const places = BUILDINGS.filter((b) => b.region === id && storiesFor(b.id).length);
    const stamped = places.filter((b) => stampFor(b) !== null);
    const complete = stamped.length === places.length;
    const claimed = state.travel?.claimed?.[id];
    return `
      <section class="panel stamp-page">
        <div class="trip-head">
          <div><span class="kana trip-name">${esc(id === 'home' ? placeName(r)[0] : r.kanji)}</span> <span class="muted">${esc(r.en)}</span></div>
          <span class="muted">${stamped.length} / ${places.length}</span>
        </div>
        <div class="stamps">
          ${places.map((b) => {
    const day = stampFor(b);
    return day !== null
      ? `<div class="stamp"><span class="stamp-ink kana">${esc(b.kanji || b.jp)}</span><small>${dateOf(day)}</small></div>`
      : `<div class="stamp empty"><img src="${buildingArt(b)}" alt=""><small>${esc(b.en)}</small></div>`;
  }).join('')}
        </div>
        ${complete && !claimed ? `<button class="btn primary big" data-claim="${id}">Collect the page reward: 🪙 ${r.bookBonus}</button>` : ''}
        ${claimed ? '<p class="done-tag center">✓ Page complete, reward collected</p>' : ''}
        ${!complete ? '<p class="muted small-note">Finish a story at a place to press its stamp. A full page pays a coin reward.</p>' : ''}
      </section>`;
  });
  view.innerHTML = `
    <section class="panel town-head">
      <div><button class="icon-btn back" id="back">← Town</button><div><span class="kana town-name">スタンプ</span> <span class="muted">Stamp book</span></div></div>
      <div class="coins big">🪙 ${state.coins}</div>
    </section>
    ${pages.join('')}`;
  $('#back').onclick = () => go('town');
  $$('[data-claim]').forEach((b) => {
    b.onclick = () => {
      const r = REGIONS[b.dataset.claim];
      if (!store.claimBook(r.id, r.bookBonus)) return;
      sfx('victory');
      renderHud();
      showStamps();
    };
  });
}
screens.stamps = showStamps;
