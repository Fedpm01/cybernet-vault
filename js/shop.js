// ============================================================
// CYBERNET VAULT // Shop logic
// ============================================================

// Хелпер для безопасного доступа (приоритет на window — реальные данные из БД)
function getProductsList() {
  return window.products || (typeof products !== 'undefined' ? products : []);
}

// ---------- Filters ----------
function renderFilters() {
  const list = getProductsList();
  const counts = {};
  list.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  counts.all = list.length;

  $('#filter-categories').innerHTML = categoryDefs.map(c => `
    <li class="filters__item ${state.filters.category === c.id ? 'filters__item--active' : ''}" data-cat="${c.id}">
      <span style="display:inline-flex;align-items:center;gap:8px">
        ${icon(c.icon, { size: 14 })}
        ${c.label}
      </span>
      <span class="filters__count">${counts[c.id] || 0}</span>
    </li>
  `).join('');
}

function bindShopFilters() {
  document.body.addEventListener('click', e => {
    const cat = e.target.closest('[data-cat]');
    if (cat) {
      state.filters.category = cat.dataset.cat;
      renderFilters();
      renderShop();
    }
    const pr = e.target.closest('[data-price]');
    if (pr) {
      state.filters.price = pr.dataset.price;
      $$('#filter-price .filters__item').forEach(x => x.classList.toggle('filters__item--active', x === pr));
      renderShop();
    }
    const af = e.target.closest('#affordable-toggle');
    if (af) {
      state.filters.affordable = !state.filters.affordable;
      af.classList.toggle('filters__item--active', state.filters.affordable);
      renderShop();
    }
    const liked = e.target.closest('#liked-toggle');
    if (liked) {
      state.filters.likedOnly = !state.filters.likedOnly;
      liked.classList.toggle('filters__item--active', state.filters.likedOnly);
      renderShop();
    }
  });

  $('#sort-select')?.addEventListener('change', e => {
    state.sort = e.target.value;
    renderShop();
  });
}

function applyFiltersAndSort(list) {
  let f = list.slice();
  if (state.filters.category !== 'all') {
    f = f.filter(p => p.category === state.filters.category);
  }
  if (state.filters.price !== 'all') {
    const ranges = {
      '0-500':    [0, 500],
      '500-1000': [500, 1000],
      '1000-2000':[1000, 2000],
      '2000+':    [2000, Infinity],
    };
    const [min, max] = ranges[state.filters.price];
    f = f.filter(p => p.price >= min && p.price <= max);
  }
  if (state.filters.affordable) {
    f = f.filter(p => p.price <= state.user.balance);
  }
  if (state.filters.likedOnly) {                  // ← ДОБАВИТЬ
    f = f.filter(p => state.liked.has(p.id));
  }
  if (state.sort === 'price-asc')  f.sort((a, b) => a.price - b.price);
  if (state.sort === 'price-desc') f.sort((a, b) => b.price - a.price);
  if (state.sort === 'new')        f.sort((a, b) => (b.is_new || b.new || 0) - (a.is_new || a.new || 0));
  if (state.sort === 'popular')    f.sort((a, b) => (b.popularity || b.pop || 0) - (a.popularity || a.pop || 0));
  return f;
}

// ---------- Product card ----------
function productCard(p) {
  const renderer = productRenderers[p.category] || svgTee;
  const accent = p.accent || '#818CF8';
  const liked = state.liked.has(p.id);
  const badgeCls = p.badge === 'NEW' ? 'pcard__badge--new' : p.badge === 'HOT' ? 'pcard__badge--hot' : '';
  const badgeIcon = p.badge === 'HOT' ? icon('bolt', { size: 11 }) : p.badge === 'NEW' ? icon('sparkle', { size: 11 }) : '';
  const badgeText = p.badge === 'HOT' ? 'ТОП' : p.badge === 'NEW' ? 'NEW' : '';

  return `<article class="pcard" data-pid="${p.id}">
    <div class="pcard__img">${renderer(p.color, accent)}</div>
    ${p.badge ? `<span class="pcard__badge ${badgeCls}">${badgeIcon} ${badgeText}</span>` : ''}
    <button class="pcard__like ${liked ? 'pcard__like--active' : ''}" data-like="${p.id}" aria-label="В избранное">
      ${icon(liked ? 'heart' : 'heart-line', { size: 16 })}
    </button>
    <div class="pcard__body">
      <div class="pcard__cat">// ${categoryDefs.find(c => c.id === p.category)?.label || p.category}</div>
      <div class="pcard__name">${p.name}</div>
      <div class="pcard__row">
        <span class="pcard__price"><span class="coin">¢</span> ${fmt(p.price)} <small>CC</small></span>
        <button class="pcard__add" data-quickadd="${p.id}" aria-label="Добавить">${icon('plus', { size: 16 })}</button>
      </div>
    </div>
  </article>`;
}

function renderShop() {
  const grid = $('#shop-grid');
  if (!grid) return;
  const list = applyFiltersAndSort(getProductsList());
  grid.innerHTML = list.length
    ? list.map(productCard).join('')
    : `<div style="grid-column:1/-1;padding:60px 24px;text-align:center;color:var(--text-muted)">
         <div style="font-family:var(--font-display);font-size:22px;margin-bottom:8px">Ничего не нашли</div>
         <div style="font-size:14px">Попробуй сбросить фильтры</div>
       </div>`;
  $('#shop-count').textContent = list.length;
}

function renderFeatured() {
  const grid = $('#featured-grid');
  if (!grid) return;
  const featured = getProductsList().filter(p => p.badge).slice(0, 4);
  grid.innerHTML = featured.map(productCard).join('');
}

// ---------- Card click handlers ----------
function bindShopCards() {
  document.body.addEventListener('click', async e => {
    // Лайк — синхронизируем с БД
    const likeBtn = e.target.closest('[data-like]');
    if (likeBtn) {
      e.stopPropagation();
      const id = likeBtn.dataset.like;
      // Локально сразу — для отклика
      if (state.liked.has(id)) state.liked.delete(id);
      else state.liked.add(id);
      renderShop();
      renderFeatured();
      // В БД — в фоне
      try { await toggleLike(id); }
      catch (err) { console.error('like sync failed:', err); }
      return;
    }

    // Quick-add (+ на карточке)
    const quickAdd = e.target.closest('[data-quickadd]');
    if (quickAdd) {
      e.stopPropagation();
      const p = getProductsList().find(x => x.id === quickAdd.dataset.quickadd);
      if (!p) return;
      await addToCart(p, 'M', 'Onyx');
      return;
    }

    // Открытие карточки
    const card = e.target.closest('[data-pid]');
    if (card && !e.target.closest('[data-like], [data-quickadd]')) {
      openProduct(card.dataset.pid);
    }
  });
}

// ---------- Product modal ----------
let modalProduct = null;
let modalSize = 'M';
let modalColor = 'Onyx';

function openProduct(id) {
  const p = getProductsList().find(x => x.id === id);
  if (!p) return;
  modalProduct = p;
  modalSize = 'M';
  modalColor = colorOptions.find(c => c.hex === p.color)?.name || colorOptions[0].name;

  $('#modal-cat').textContent = '// ' + (categoryDefs.find(c => c.id === p.category)?.label || p.category);
  $('#modal-title').textContent = p.name;
  $('#modal-price').textContent = fmt(p.price);
  $('#modal-desc').textContent = p.description || p.desc || '';
  const accent = p.accent || '#818CF8';
  $('#modal-img').innerHTML = (productRenderers[p.category] || svgTee)(p.color, accent);

  $('#size-chips').innerHTML = sizes.map(s =>
    `<button class="opts__chip ${s === modalSize ? 'opts__chip--active' : ''}" data-size="${s}">${s}</button>`
  ).join('');
  $('#size-current').textContent = modalSize;

  $('#color-chips').innerHTML = colorOptions.map(c =>
    `<button class="opts__color ${c.name === modalColor ? 'opts__color--active' : ''}" data-color="${c.name}" style="background:${c.hex}" title="${c.name}"></button>`
  ).join('');
  $('#color-current').textContent = modalColor;

  $('#product-modal').classList.add('modal--open');
  document.body.style.overflow = 'hidden';
}

function closeProduct() {
  $('#product-modal').classList.remove('modal--open');
  document.body.style.overflow = '';
}

function bindModal() {
  $$('[data-modal-close]').forEach(el => el.addEventListener('click', closeProduct));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeProduct();
      closeCart();
    }
  });

  $('#size-chips').addEventListener('click', e => {
    const b = e.target.closest('[data-size]');
    if (!b) return;
    modalSize = b.dataset.size;
    $$('#size-chips .opts__chip').forEach(x => x.classList.toggle('opts__chip--active', x === b));
    $('#size-current').textContent = modalSize;
  });

  $('#color-chips').addEventListener('click', e => {
    const b = e.target.closest('[data-color]');
    if (!b) return;
    modalColor = b.dataset.color;
    $$('#color-chips .opts__color').forEach(x => x.classList.toggle('opts__color--active', x === b));
    $('#color-current').textContent = modalColor;
  });

  $('#modal-add').addEventListener('click', async () => {
    if (!modalProduct) return;
    await addToCart(modalProduct, modalSize, modalColor);
    closeProduct();
  });

  $('#modal-like').addEventListener('click', async () => {
    if (!modalProduct) return;
    const id = modalProduct.id;
    if (state.liked.has(id)) state.liked.delete(id);
    else state.liked.add(id);
    renderShop();
    renderFeatured();
    try { await toggleLike(id); }
    catch (err) { console.error('like sync failed:', err); }
  });
}