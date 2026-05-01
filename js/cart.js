// ============================================================
// CYBERNET VAULT // Cart + checkout
// ============================================================

function bindCart() {
  $('#cart-open').addEventListener('click', openCart);
  $$('[data-drawer-close]').forEach(el => el.addEventListener('click', closeCart));
  $('#checkout-btn').addEventListener('click', checkout);

  // Кнопки внутри drawer (qty, remove)
  document.body.addEventListener('click', e => {
    const inc = e.target.closest('[data-cart-inc]');
    const dec = e.target.closest('[data-cart-dec]');
    const rem = e.target.closest('[data-cart-remove]');
    if (inc) {
      const it = state.cart.find(i => i._key === inc.dataset.cartInc);
      if (it) it.qty++;
      updateCartBadge(); renderCart();
    }
    if (dec) {
      const it = state.cart.find(i => i._key === dec.dataset.cartDec);
      if (it) {
        it.qty--;
        if (it.qty <= 0) state.cart = state.cart.filter(i => i._key !== it._key);
      }
      updateCartBadge(); renderCart();
    }
    if (rem) {
      state.cart = state.cart.filter(i => i._key !== rem.dataset.cartRemove);
      updateCartBadge(); renderCart();
    }
  });
}

function openCart() {
  renderCart();
  $('#cart-drawer').classList.add('drawer--open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  $('#cart-drawer').classList.remove('drawer--open');
  document.body.style.overflow = '';
}

function addToCart(product, size, color) {
  const key = `${product.id}__${size}__${color}`;
  const existing = state.cart.find(i => i._key === key);
  if (existing) existing.qty += 1;
  else state.cart.push({ _key: key, id: product.id, size, color, qty: 1 });
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  const count = state.cart.reduce((s, i) => s + i.qty, 0);
  const badge = $('#cart-badge');
  if (count > 0) {
    badge.hidden = false;
    badge.textContent = count;
  } else {
    badge.hidden = true;
  }
}

function pulseCartBtn() {
  const btn = $('#cart-open');
  btn.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
    { duration: 320, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  );
}

function renderCart() {
  const list = $('#cart-list');
  if (!list) return;

  if (state.cart.length === 0) {
    list.innerHTML = `
      <div class="drawer__empty">
        <div class="drawer__empty-icon">${icon('bag', { size: 28 })}</div>
        <h4>Корзина пуста</h4>
        <p>Добавь что-нибудь из <a data-route="shop">магазина</a> и обменяй на CC</p>
      </div>`;
    $('#cart-foot').hidden = true;
    return;
  }

  list.innerHTML = state.cart.map(item => {
    const p = products.find(x => x.id === item.id);
    const accent = p.accent || '#818CF8';
    return `<div class="cart-item">
      <div class="cart-item__img">${(productRenderers[p.category] || svgTee)(p.color, accent)}</div>
      <div>
        <div class="cart-item__name">${p.name}</div>
        <div class="cart-item__meta">${item.size} · ${item.color}</div>
        <div class="cart-item__price"><span class="coin">¢</span> ${fmt(p.price * item.qty)} <small style="color:var(--text-dim)">CC</small></div>
        <button class="cart-item__remove" data-cart-remove="${item._key}">— УДАЛИТЬ</button>
      </div>
      <div class="cart-item__qty">
        <button data-cart-dec="${item._key}" aria-label="-">${icon('minus', { size: 14 })}</button>
        <span class="tnum">${item.qty}</span>
        <button data-cart-inc="${item._key}" aria-label="+">${icon('plus', { size: 14 })}</button>
      </div>
    </div>`;
  }).join('');

  const total = state.cart.reduce((s, i) => {
    const p = products.find(x => x.id === i.id);
    return s + p.price * i.qty;
  }, 0);
  const count = state.cart.reduce((s, i) => s + i.qty, 0);

  $('#cart-foot').hidden = false;
  $('#cart-count-text').textContent = count;
  $('#cart-total').textContent = fmt(total);

  const insufficient = total > state.user.balance;
  const warn = $('#cart-warn');
  warn.classList.toggle('drawer__warn--show', insufficient);
  $('#cart-warn-amt').textContent = fmt(Math.max(0, total - state.user.balance));
  $('#checkout-btn').disabled = insufficient;
}

async function checkout() {
  const idempotencyKey = crypto.randomUUID();
  const total = state.cart.reduce((s, i) => {
    const p = window.products.find(x => x.id === i.id);
    return s + p.price * i.qty;
  }, 0);

  if (total > state.user.balance) return;

  const checkoutBtn = $('#checkout-btn');
  checkoutBtn.disabled = true;
  checkoutBtn.textContent = 'Обработка...';

  const { data, error } = await supabaseClient.rpc('checkout_cart', {
    p_idempotency_key: idempotencyKey,
  });

  checkoutBtn.disabled = false;

  if (error) {
    toast(error.message, 'err');
    return;
  }

  const itemsCount = state.cart.reduce((s, i) => s + i.qty, 0);

  // Перезагружаем баланс и активити с сервера
  const bal = await fetchBalance();
  state.user.balance = bal.balance;
  state.cart = [];
  window.activity = await fetchActivity();

  closeCart();
  updateCartBadge();
  renderCart();
  renderBalances();
  renderActivity();
  showSuccessOverlay(data.total, itemsCount);
}

function showSuccessOverlay(total, count) {
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.innerHTML = `
    <div class="success-overlay__card">
      <div class="success-overlay__inner">
        <div class="success-overlay__icon">${icon('check', { size: 36 })}</div>
        <div class="success-overlay__eyebrow">// ORDER CONFIRMED</div>
        <h2 class="success-overlay__title">Готово, агент.</h2>
        <p class="success-overlay__desc">${count} ${count === 1 ? 'позиция отправлена' : count < 5 ? 'позиции отправлены' : 'позиций отправлено'} в обработку. Получишь пуш, когда мерч приедет в офис.</p>
        <div class="success-overlay__stats">
          <div>
            <div class="success-overlay__stat-label">Списано</div>
            <div class="success-overlay__stat-value success-overlay__stat-value--debit">−${fmt(total)} CC</div>
          </div>
          <div class="success-overlay__divider"></div>
          <div>
            <div class="success-overlay__stat-label">Остаток</div>
            <div class="success-overlay__stat-value success-overlay__stat-value--remain">${fmt(state.user.balance)} CC</div>
          </div>
        </div>
        <button class="btn btn--primary btn--block" id="success-close">
          Зашибись · продолжить
          ${icon('arrow', { size: 16 })}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  $('#success-close').onclick = () => {
    overlay.style.animation = 'fadeIn 0.25s var(--ease) reverse';
    setTimeout(() => overlay.remove(), 240);
  };
}
