// The battle wrapped around a study session: every correct answer is a hit on the current
// monster, every miss is a hit on the hero. Total monster HP equals the session's question
// count, so the last correct answer always lands the final blow.
import { shuffle } from './session.js';
import * as store from './store.js';
import { sfx } from './sfx.js';

// Attack timing: wind-up, then the hit lands, then recovery (ms).
const ATTACK_MS = 620;
const IMPACT_MS = 300;
const WALK_IN_MS = 520;
const MAX_HEARTS = 5;
const CRIT_COMBO = 5;

// Illustrations made with Anima (kotoba-quest-art). "faces" is the way the character looks
// in the picture; it is mirrored when it needs to face the other way. Heights are in CSS px.
const CAST = {
  kitsune: { img: 'art/hero.png', faces: 'right', height: 150 },
  tengu: { img: 'art/tengu.png', faces: 'left', height: 140 },
  witch: { img: 'art/witch.png', faces: 'left', height: 148 },
  axolotl: { img: 'art/axolotl.png', faces: 'left', height: 112 },
  dragonknight: { img: 'art/dragonknight.png', faces: 'left', height: 165 },
};

export const MONSTERS = {
  axolotl: { name: 'ウーパールーパー', romaji: 'ūpā rūpā', coins: 8 },
  tengu: { name: 'てんぐ', romaji: 'tengu', coins: 10 },
  witch: { name: 'やまんば', romaji: 'yamanba', coins: 10 },
  dragonknight: { name: 'りゅうきし', romaji: 'ryūkishi', coins: 30, boss: true },
};

// ---- rules ----

function planMonsters(total) {
  const list = [];
  let rest = total;
  const boss = total >= 14;
  if (boss) rest -= 6;
  const order = shuffle(['axolotl', 'tengu', 'witch']);
  for (let i = 0; rest > 0; i++) {
    const hp = rest <= 6 ? rest : 4;
    list.push({ id: order[i % order.length], hp });
    rest -= hp;
  }
  if (boss) list.push({ id: 'dragonknight', hp: 6 });
  return list.map((m) => ({ ...MONSTERS[m.id], ...m, maxHp: m.hp }));
}

export class Battle {
  constructor(totalHits, { bonusHearts = 0 } = {}) {
    this.queue = planMonsters(totalHits);
    this.index = 0;
    this.hp = this.queue[0]?.hp || 0;
    this.maxHearts = MAX_HEARTS + bonusHearts;
    this.hearts = this.maxHearts;
    this.kos = 0;
    this.coins = 0;
    this.crits = 0;
    this.defeated = [];
  }

  get monster() {
    return this.queue[this.index] || null;
  }

  get won() {
    return this.queue.length > 0 && this.index >= this.queue.length;
  }

  hit(combo) {
    const m = this.monster;
    if (!m) return { crit: false };
    const crit = combo >= CRIT_COMBO;
    if (crit) this.crits += 1;
    this.hp -= 1;
    if (this.hp > 0) return { crit };
    this.coins += m.coins;
    this.defeated.push(m);
    store.recordDefeat(m.id, m.coins);
    this.index += 1;
    this.hp = this.monster?.hp || 0;
    return { crit, killed: m, next: this.monster };
  }

  hurt() {
    this.hearts -= 1;
    if (this.hearts > 0) return { ko: false };
    this.kos += 1;
    this.hearts = this.maxHearts;
    return { ko: true };
  }
}

// ---- sprites ----

const loaded = {};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function loadCharacter(id) {
  loaded[id] ||= loadImage(CAST[id].img).then((img) => ({ id, def: CAST[id], img }));
  return loaded[id];
}

export function preloadCast() {
  Object.keys(CAST).forEach((id) => loadCharacter(id).catch(() => {}));
}

// A character on stage: one illustration, moved by CSS (idle sway, walk bob, attack lunge).
// Timers rather than animation frames, so a battle never stalls in a background tab.
class Actor {
  // towards: 'left' or 'right', the side this actor attacks.
  constructor(char, towards) {
    const { def } = char;
    this.el = document.createElement('div');
    this.el.className = `actor towards-${towards}`;
    const img = document.createElement('img');
    img.src = def.img;
    img.alt = '';
    img.draggable = false;
    img.style.height = `${def.height}px`;
    if (def.faces !== towards) img.classList.add('flip');
    this.el.append(img);
    this.timers = [];
  }

  play(anim, { onImpact } = {}) {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.el.classList.toggle('walking', anim === 'walk');
    this.el.classList.toggle('attacking', anim === 'attack');
    if (anim !== 'attack') return Promise.resolve();
    return new Promise((resolve) => {
      this.timers.push(setTimeout(() => onImpact?.(), IMPACT_MS));
      this.timers.push(setTimeout(() => { this.el.classList.remove('attacking'); resolve(); }, ATTACK_MS));
    });
  }

  destroy() {
    this.timers.forEach(clearTimeout);
    this.el.remove();
  }
}

// ---- scene ----

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const heartSvg = (full) => `<svg viewBox="0 0 7 6" width="14" height="12" shape-rendering="crispEdges">${HEART.flatMap((row, y) => [...row].map((c, x) => (c === '#' ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${full ? (y < 2 && x > 0 && x < 3 ? '#ff9a8a' : '#e8443a') : '#3e3874'}"/>` : ''))).join('')}</svg>`;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class BattleScene {
  constructor(container, battle) {
    this.battle = battle;
    container.innerHTML = `
      <div class="stage">
        <div class="hud-hero"><div class="hearts"></div></div>
        <div class="hud-foe"><div class="foe-name"><span class="kana"></span><small></small></div><div class="hp"><i></i></div></div>
        <div class="slot hero-slot"></div>
        <div class="slot foe-slot"></div>
        <div class="bubble" hidden></div>
        <div class="fx"></div>
      </div>`;
    this.root = container.firstElementChild;
    this.q = (s) => this.root.querySelector(s);
    this.queue = Promise.resolve();
    this.renderHearts();
  }

  async start() {
    const hero = await loadCharacter('kitsune');
    this.hero = new Actor(hero, 'right');
    this.q('.hero-slot').append(this.hero.el);
    if (this.battle.monster) await this.spawn(this.battle.monster, false);
    else this.q('.hud-foe').hidden = true;
  }

  async spawn(m, walkIn = true) {
    const char = await loadCharacter(m.id);
    this.foe?.destroy();
    this.foe = new Actor(char, 'left');
    this.foe.el.classList.toggle('boss', !!m.boss);
    this.q('.foe-slot').append(this.foe.el);
    this.q('.foe-name .kana').textContent = m.name;
    this.q('.foe-name small').textContent = m.romaji;
    this.q('.hud-foe').classList.toggle('boss', !!m.boss);
    this.q('.hud-foe').hidden = false;
    this.renderHp();
    if (walkIn) {
      this.foe.el.classList.add('walk-in');
      this.foe.play('walk');
      await wait(WALK_IN_MS);
      this.foe.el.classList.remove('walk-in');
      this.foe.play('idle');
    }
  }

  renderHp() {
    const m = this.battle.monster;
    if (!m) return;
    this.q('.hp i').style.width = `${(this.battle.hp / m.maxHp) * 100}%`;
  }

  renderHearts() {
    this.q('.hearts').innerHTML = Array.from({ length: this.battle.maxHearts }, (_, i) => heartSvg(i < this.battle.hearts)).join('');
  }

  float(text, side, cls = '') {
    const el = document.createElement('div');
    el.className = `float ${side} ${cls}`;
    el.textContent = text;
    this.q('.fx').append(el);
    setTimeout(() => el.remove(), 1100);
  }

  say(text, ms = 1400) {
    const b = this.q('.bubble');
    b.textContent = text;
    b.hidden = false;
    clearTimeout(this.sayTimer);
    this.sayTimer = setTimeout(() => { b.hidden = true; }, ms);
  }

  // A quick swipe drawn over whoever was hit.
  slash(side, crit = false) {
    const el = document.createElement('div');
    el.className = `slash ${side} ${crit ? 'crit' : ''}`;
    this.q('.fx').append(el);
    setTimeout(() => el.remove(), 400);
  }

  flash(actor, cls) {
    actor.el.classList.remove(cls);
    void actor.el.offsetWidth;
    actor.el.classList.add(cls);
    setTimeout(() => actor.el.classList.remove(cls), 450);
  }

  // Animations queue up so quick answers never overlap.
  enqueue(fn) {
    this.queue = this.queue.then(fn).catch(() => {});
    return this.queue;
  }

  heroAttack(result) {
    return this.enqueue(async () => {
      if (!this.hero || !this.foe) return;
      this.hero.el.classList.add('lunge-right');
      await this.hero.play('attack', {
        onImpact: () => {
          this.flash(this.foe, 'hit');
          this.slash('foe', result.crit);
          sfx(result.crit ? 'crit' : 'hit');
          this.float(result.crit ? 'CRIT!' : '-1', 'foe', result.crit ? 'crit' : '');
          if (!result.killed) this.renderHp();
          else this.q('.hp i').style.width = '0%';
        },
      });
      this.hero.el.classList.remove('lunge-right');
      if (!result.killed) return;
      this.foe.el.classList.add('die');
      sfx('defeat');
      await wait(550);
      this.float(`+${result.killed.coins} 🪙`, 'foe', 'coin');
      sfx('coin');
      if (result.next) {
        await this.spawn(result.next);
      } else {
        this.q('.hud-foe').hidden = true;
        this.foe.destroy();
        this.foe = null;
        this.hero.el.classList.add('cheer');
        sfx('victory');
        this.say('勝った! Victory!', 2400);
      }
    });
  }

  monsterAttack(result) {
    return this.enqueue(async () => {
      if (!this.hero || !this.foe) return;
      this.foe.el.classList.add('lunge-left');
      await this.foe.play('attack', {
        onImpact: () => {
          this.flash(this.hero, 'hurt');
          this.slash('hero');
          sfx('hurt');
          this.float('-♥', 'hero', 'dmg');
          this.renderHearts();
        },
      });
      this.foe.el.classList.remove('lunge-left');
      if (result.ko) {
        this.hero.el.classList.add('ko');
        await wait(700);
        this.hero.el.classList.remove('ko');
        sfx('revive');
        this.say('The lantern relights! Hearts restored.', 2000);
        this.renderHearts();
      }
    });
  }

  destroy() {
    this.hero?.destroy();
    this.foe?.destroy();
    clearTimeout(this.sayTimer);
  }
}
