// Story scenes: a short kana dialogue, line by line, then a comprehension question.
import * as store from '../store.js';
import { state } from '../store.js';
import { STORIES, CAST, unknownKana, storyText } from '../stories.js';
import { speak } from '../speech.js';
import { sfx } from '../sfx.js';
import { view, $, $$, esc, plural, setKeys, setScreen, screens, go, renderHud, audioBtn } from '../ui.js';
import { BUILDINGS, buildingArt } from '../regions.js';

const REWARD = 15;

function showStories(buildingId) {
  setScreen('story', { tab: 'town' });
  const b = BUILDINGS.find((x) => x.id === buildingId);
  const list = STORIES.filter((s) => s.building === buildingId);
  view.innerHTML = `
    <section class="panel">
      <button class="icon-btn back" id="back">← Town</button>
      <h2 class="story-place"><img src="${buildingArt(b)}" alt=""> <span class="kana">${esc(b.jp)}</span> <span class="muted">${esc(b.en)}</span></h2>
      <div class="story-list">
        ${list.map((s) => {
    const missing = unknownKana(storyText(s), state.cards);
    const done = state.stories[s.id];
    return `
          <button class="story-card ${missing.length ? 'locked' : ''}" data-s="${s.id}" ${missing.length ? 'disabled' : ''}>
            <span class="kana st-title">${esc(s.title)}</span>
            <span class="muted">${esc(s.en)}</span>
            <small>${missing.length ? `🔒 Learn ${plural(missing.length, 'more kana')} first: <span class="kana">${missing.slice(0, 8).join(' ')}</span>${missing.length > 8 ? '…' : ''}` : done ? '✓ Read · replay any time' : `New · 🪙 ${REWARD} reward`}</small>
          </button>`;
  }).join('')}
      </div>
    </section>`;
  $('#back').onclick = () => go('town');
  $$('.story-card:not([disabled])').forEach((c) => { c.onclick = () => playStory(c.dataset.s); });
}
screens.story = showStories;

function playStory(id) {
  const story = STORIES.find((s) => s.id === id);
  setScreen('story-play', { tab: 'town', session: true });
  let i = 0;
  view.innerHTML = `
    <div class="session-top">
      <button class="btn small ghost quit-btn" id="quit">✕ Leave</button>
      <div class="bar"><i style="width:0%"></i></div>
      <div class="combo"></div>
    </div>
    <section class="panel story-head"><span class="kana">${esc(story.title)}</span> <span class="muted">${esc(story.en)}</span></section>
    <div id="lines" class="lines"></div>
    <div id="controls"></div>`;
  $('#quit').onclick = () => showStories(story.building);

  const lineHtml = ([who, jp, en], n) => {
    const c = CAST[who];
    return `
      <div class="line ${who === 'me' ? 'me' : ''} pop">
        <div class="avatar" title="${esc(c.name)}">${c.emoji}<small class="kana">${esc(c.name)}</small></div>
        <div class="say">
          <div class="jp kana">${esc(jp)}</div>
          <button class="reveal" data-n="${n}">Show English</button>
          <div class="en" hidden>${esc(en)}</div>
        </div>
        ${audioBtn(jp)}
      </div>`;
  };

  const showNext = () => {
    if (i >= story.lines.length) return askQuestion();
    $('#lines').insertAdjacentHTML('beforeend', lineHtml(story.lines[i], i));
    if (state.settings.autoplay) speak(story.lines[i][1]);
    i += 1;
    $('.session-top .bar i').style.width = `${(i / (story.lines.length + 1)) * 100}%`;
    $('#controls').innerHTML = `<button class="btn primary big" id="more">${i < story.lines.length ? 'Next ▸' : 'Done reading ▸'}</button>`;
    $('#more').onclick = showNext;
    $('#more').focus();
    $('#lines').lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  $('#lines').addEventListener('click', (e) => {
    const r = e.target.closest('.reveal');
    if (!r) return;
    r.hidden = true;
    r.nextElementSibling.hidden = false;
  });

  const askQuestion = () => {
    const q = story.question;
    $('#controls').innerHTML = `
      ${story.notes?.length ? `<section class="panel notes"><h3>Grammar notes</h3>${story.notes.map((n) => `<p class="kana-ok">${esc(n)}</p>`).join('')}</section>` : ''}
      <section class="card quiz">
        <div class="prompt">${esc(q.q)}</div>
        <div class="choices list">${q.options.map((o, n) => `<button class="choice" data-n="${n}"><small>${n + 1}</small><span>${esc(o)}</span></button>`).join('')}</div>
        <div id="fb"></div>
      </section>`;
    $('.session-top .bar i').style.width = '100%';
    const pick = (btn) => {
      const n = Number(btn.dataset.n);
      const ok = n === q.answer;
      btn.classList.add(ok ? 'right' : 'wrong');
      if (!ok) { sfx('wrong'); return; }
      $$('.choice').forEach((b) => { b.disabled = true; });
      const first = !state.stories[id];
      state.stories[id] = { done: store.today() };
      if (first) state.coins += REWARD;
      store.save();
      renderHud();
      sfx(first ? 'coin' : 'correct');
      $('#fb').innerHTML = `
        <div class="fb right"><span>正解! Correct.</span><span class="xp">${first ? `+${REWARD} 🪙` : ''}</span></div>
        <button class="btn primary big" id="fin">Back to the ${esc(BUILDINGS.find((b) => b.id === story.building).en)}</button>`;
      $('#fin').onclick = () => showStories(story.building);
      $('#fin').focus();
    };
    $$('.choice').forEach((b) => { b.onclick = () => pick(b); });
    setKeys((e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) pick($$('.choice')[n - 1]);
    });
  };

  showNext();
  setKeys((e) => {
    if (e.key === 'Enter' && $('#more')) { e.preventDefault(); showNext(); }
  });
}
