// The shop: spend battle coins on streak freezes, heart charms and hint scrolls.
import * as store from '../store.js';
import { state, SHOP } from '../store.js';
import { sfx } from '../sfx.js';
import { view, $, $$, esc, setScreen, screens, go, renderHud, notify } from '../ui.js';

function showShop() {
  setScreen('shop', { tab: 'town' });
  view.innerHTML = `
    <section class="panel town-head">
      <div><button class="icon-btn back" id="back">← Town</button><div><span class="kana town-name">おみせ</span> <span class="muted">Shop</span></div></div>
      <div class="coins big">🪙 ${state.coins}</div>
    </section>
    <section class="shop-list">
      ${SHOP.map((it) => {
    const have = store.owned(it.id);
    const full = have + it.qty > it.max;
    const poor = state.coins < it.price;
    return `
        <div class="panel shop-item">
          <div class="shop-icon">${it.emoji}</div>
          <div class="shop-body">
            <b>${esc(it.name)}${it.qty > 1 ? ` ×${it.qty}` : ''}</b>
            <p class="muted">${esc(it.desc)}</p>
            <span class="shop-have">You have ${have}${it.max < 30 ? ` / ${it.max}` : ''}</span>
          </div>
          <button class="btn ${poor || full ? '' : 'primary'} shop-buy" data-id="${it.id}" ${poor || full ? 'disabled' : ''}>${full ? 'Full' : `🪙 ${it.price}`}</button>
        </div>`;
  }).join('')}
    </section>
    <p class="muted center small-note">Earn coins by winning battles, reading stories and playing in the arcade.</p>`;
  $('#back').onclick = () => go('town');
  $$('.shop-buy').forEach((b) => {
    b.onclick = () => {
      const it = SHOP.find((x) => x.id === b.dataset.id);
      if (!store.buy(it.id)) return;
      sfx('coin');
      renderHud();
      showShop();
      if (it.id === 'charm' && store.owned('charm') === 1) notify('Your next battle will start with 7 hearts.');
    };
  });
}
screens.shop = showShop;
