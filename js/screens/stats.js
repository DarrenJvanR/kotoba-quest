// Stats: headline numbers, daily answers, accuracy, upcoming reviews and level breakdown.
import * as store from '../store.js';
import { state } from '../store.js';
import { ITEMS } from '../kana.js';
import { WORDS } from '../vocab.js';
import { KANJI } from '../kanji.js';
import { PHRASES } from '../phrases.js';
import { view, $, $$, esc, plural, setScreen, screens, go } from '../ui.js';
import { LEVEL_MARK, levelLegend } from './library.js';

const W = 320;
const H = 120;
const PAD = { l: 28, r: 6, t: 10, b: 20 };

const dayLabel = (d) => {
  const date = new Date((d * 86400000) + 4 * 3600000);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
};

// One series of bars with a recessive grid, rounded data ends and a hover tooltip.
function barChart(id, data, { colour, unit }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const top = max <= 10 ? 10 : Math.ceil(max / 10) * 10;
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / data.length;
  const bw = Math.max(3, slot - 2);
  const y = (v) => PAD.t + ih - (v / top) * ih;
  const bars = data.map((d, i) => {
    const x = PAD.l + i * slot + (slot - bw) / 2;
    const h = (d.value / top) * ih;
    const r = Math.min(4, bw / 2, h);
    const path = h > 0
      ? `M${x},${PAD.t + ih} v${-(h - r)} q0,${-r} ${r},${-r} h${bw - 2 * r} q${r},0 ${r},${r} v${h - r} z`
      : '';
    return `<g class="bar-g" data-i="${i}"><rect class="hit" x="${PAD.l + i * slot}" y="${PAD.t}" width="${slot}" height="${ih}" fill="transparent"/>${path ? `<path d="${path}" fill="${colour}"/>` : ''}</g>`;
  }).join('');
  const ticks = [0, top / 2, top].map((v) => `
    <line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/>
    <text x="${PAD.l - 4}" y="${y(v) + 3}" class="axis-label" text-anchor="end">${v}</text>`).join('');
  const labels = [0, Math.floor(data.length / 2), data.length - 1].map((i) => `<text x="${PAD.l + i * slot + slot / 2}" y="${H - 4}" class="axis-label" text-anchor="middle">${data[i].label}</text>`).join('');
  return `
    <div class="chart" id="${id}">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(unit)} per day">${ticks}${bars}${labels}</svg>
      <div class="tip" hidden></div>
    </div>`;
}

function bindBarTips(id, data) {
  const chart = $(`#${id}`);
  const tip = $('.tip', chart);
  $$('.bar-g', chart).forEach((g) => {
    const show = () => {
      const d = data[Number(g.dataset.i)];
      tip.innerHTML = d.tip;
      tip.hidden = false;
      const box = g.querySelector('.hit').getBoundingClientRect();
      const cb = chart.getBoundingClientRect();
      tip.style.left = `${Math.min(cb.width - 130, Math.max(0, box.left - cb.left - 50))}px`;
      $$('.bar-g', chart).forEach((x) => x.classList.toggle('dim', x !== g));
    };
    g.addEventListener('pointerenter', show);
    g.addEventListener('click', show);
  });
  chart.addEventListener('pointerleave', () => {
    tip.hidden = true;
    $$('.bar-g', chart).forEach((x) => x.classList.remove('dim'));
  });
}

// Accuracy over time as a 2px line with markers on days you studied.
function lineChart(id, data) {
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / data.length;
  const x = (i) => PAD.l + i * slot + slot / 2;
  const y = (v) => PAD.t + ih - (v / 100) * ih;
  const pts = data.map((d, i) => (d.value === null ? null : [x(i), y(d.value), i])).filter(Boolean);
  const line = pts.map((p, n) => `${n ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  const ticks = [0, 50, 100].map((v) => `
    <line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(v)}" y2="${y(v)}" class="grid-line"/>
    <text x="${PAD.l - 4}" y="${y(v) + 3}" class="axis-label" text-anchor="end">${v}%</text>`).join('');
  const labels = [0, Math.floor(data.length / 2), data.length - 1].map((i) => `<text x="${x(i)}" y="${H - 4}" class="axis-label" text-anchor="middle">${data[i].label}</text>`).join('');
  const hits = data.map((d, i) => `<rect class="hit" data-i="${i}" x="${PAD.l + i * slot}" y="${PAD.t}" width="${slot}" height="${ih}" fill="transparent"/>`).join('');
  return `
    <div class="chart" id="${id}">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Accuracy per day">
        ${ticks}
        ${pts.length > 1 ? `<path d="${line}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linejoin="round"/>` : ''}
        ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--blue)" stroke="var(--panel)" stroke-width="2"/>`).join('')}
        <line class="crosshair" x1="0" x2="0" y1="${PAD.t}" y2="${PAD.t + ih}" style="display:none"/>
        ${labels}${hits}
      </svg>
      <div class="tip" hidden></div>
    </div>`;
}

function bindLineTips(id, data) {
  const chart = $(`#${id}`);
  const tip = $('.tip', chart);
  const cross = $('.crosshair', chart);
  $$('.hit', chart).forEach((r) => {
    const show = () => {
      const i = Number(r.dataset.i);
      const d = data[i];
      const cx = Number(r.getAttribute('x')) + Number(r.getAttribute('width')) / 2;
      cross.setAttribute('x1', cx);
      cross.setAttribute('x2', cx);
      cross.style.display = '';
      tip.innerHTML = d.tip;
      tip.hidden = false;
      const box = r.getBoundingClientRect();
      const cb = chart.getBoundingClientRect();
      tip.style.left = `${Math.min(cb.width - 130, Math.max(0, box.left - cb.left - 50))}px`;
    };
    r.addEventListener('pointerenter', show);
    r.addEventListener('click', show);
  });
  chart.addEventListener('pointerleave', () => {
    tip.hidden = true;
    cross.style.display = 'none';
  });
}

const LEVELS = [['learning', 'Learning'], ['known', 'Known'], ['mastered', 'Mastered']];

function levelBars() {
  const decks = [
    ['Kana', ITEMS.map((i) => i.key)],
    ['Words', WORDS.map((w) => w.key)],
    ['Phrases', PHRASES.map((p) => p.key)],
    ['Kanji', KANJI.map((k) => k.key)],
    ['Sentences', state.sentences.map((s) => `s:${s.id}`)],
  ];
  const rows = decks.map(([name, keys]) => {
    const counts = Object.fromEntries(LEVELS.map(([l]) => [l, 0]));
    keys.forEach((k) => { const l = store.cardLevel(k); if (counts[l] !== undefined) counts[l] += 1; });
    const total = Math.max(1, keys.length);
    const seen = LEVELS.reduce((a, [l]) => a + counts[l], 0);
    const segs = LEVELS.filter(([l]) => counts[l]).map(([l, label]) => `
      <i class="seg-${l}" style="flex-basis:${(counts[l] / total) * 100}%" title="${label}: ${counts[l]}">${counts[l] / total > 0.12 ? `${LEVEL_MARK[l]} ${counts[l]}` : LEVEL_MARK[l]}</i>`).join('');
    return `
      <div class="lvrow">
        <div class="prog-head"><span>${name}</span><span>${seen} / ${keys.length}</span></div>
        <div class="stack">${segs}</div>
      </div>`;
  }).join('');
  return `
    ${levelLegend(LEVELS.map(([l]) => l))}
    ${rows}`;
}

function showStats() {
  setScreen('stats', { tab: 'home' });
  const d0 = store.today();
  const past = Array.from({ length: 30 }, (_, i) => d0 - 29 + i);
  const hist = past.map((d) => state.history[d] || { r: 0, c: 0 });
  const answers = past.map((d, i) => ({ label: dayLabel(d), value: hist[i].r, tip: `<b>${dayLabel(d)}</b><br>${plural(hist[i].r, 'answer')}` }));
  const accuracy = past.map((d, i) => {
    const h = hist[i];
    const v = h.r ? Math.round((h.c / h.r) * 100) : null;
    return { label: dayLabel(d), value: v, tip: `<b>${dayLabel(d)}</b><br>${v === null ? 'No study' : `${v}% of ${plural(h.r, 'answer')}`}` };
  });
  const forecast = Array.from({ length: 14 }, (_, i) => {
    const d = d0 + i;
    const n = i === 0 ? store.dueCards().length : store.dueOn(d);
    return { label: i === 0 ? 'today' : dayLabel(d), value: n, tip: `<b>${i === 0 ? 'Today' : dayLabel(d)}</b><br>${plural(n, 'review')} due` };
  });
  const tot = hist.reduce((a, h) => ({ r: a.r + h.r, c: a.c + h.c }), { r: 0, c: 0 });
  const learned = Object.keys(state.cards).length;
  const defeated = Object.values(state.defeated).reduce((a, b) => a + b, 0);
  const st = store.streakStatus();

  view.innerHTML = `
    <section class="panel">
      <button class="icon-btn back" id="back">← Home</button>
      <h2>📈 Stats</h2>
      <div class="tiles">
        <div><b>${st.count}</b><span>day streak</span></div>
        <div><b>${learned}</b><span>cards learned</span></div>
        <div><b>${tot.r ? Math.round((tot.c / tot.r) * 100) : 0}%</b><span>accuracy, 30 days</span></div>
        <div><b>${defeated}</b><span>monsters defeated</span></div>
        <div><b>${state.bestCombo}</b><span>best combo</span></div>
        <div><b>${Object.keys(state.stories).length}</b><span>stories read</span></div>
      </div>
    </section>
    <section class="panel">
      <h3 class="chart-title">Answers per day <span class="muted">last 30 days</span></h3>
      ${barChart('cAnswers', answers, { colour: 'var(--gold)', unit: 'Answers' })}
      <h3 class="chart-title">Accuracy <span class="muted">first answers each day</span></h3>
      ${lineChart('cAcc', accuracy)}
      <h3 class="chart-title">Reviews coming up <span class="muted">next 14 days</span></h3>
      ${barChart('cDue', forecast, { colour: 'var(--blue)', unit: 'Reviews' })}
      <details class="table-view">
        <summary>Show as a table</summary>
        <table>
          <thead><tr><th>Day</th><th>Answers</th><th>Accuracy</th></tr></thead>
          <tbody>${past.map((d, i) => (hist[i].r ? `<tr><td>${dayLabel(d)}</td><td>${hist[i].r}</td><td>${accuracy[i].value}%</td></tr>` : '')).reverse().join('') || '<tr><td colspan="3">No study yet</td></tr>'}</tbody>
        </table>
      </details>
    </section>
    <section class="panel">
      <h3 class="chart-title">How well you know each deck</h3>
      ${levelBars()}
    </section>`;
  $('#back').onclick = () => go('home');
  bindBarTips('cAnswers', answers);
  bindLineTips('cAcc', accuracy);
  bindBarTips('cDue', forecast);
}
screens.stats = showStats;
