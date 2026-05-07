// ============================================================
// CYBERNET VAULT // Admin panel
// ============================================================

let adminState = {
  isAdmin: false,
  orderFilter: 'pending',
  selectedUser: null,    // для grant CC modal
  editingProduct: null,  // для catalog edit modal
};
let peditImageUrl = null;  // текущий URL фото в модалке редактирования

// ---------- Bootstrap (вызывается из main.js при старте) ----------
async function initAdmin() {
  const { data, error } = await supabaseClient.rpc('is_admin');
  if (error) {
    console.error('initAdmin error:', error);
    return;
  }
  adminState.isAdmin = !!data;

  // Показать пункт "Админ" в меню
  if (adminState.isAdmin) {
    const navAdmin = $('#nav-admin');
    const navAdminMobile = $('#nav-admin-mobile');
    if (navAdmin) navAdmin.style.display = '';
    if (navAdminMobile) navAdminMobile.style.display = '';
  }
}

// ---------- Bind admin UI ----------
function bindAdmin() {
  // Tab switching
  document.body.addEventListener('click', e => {
    const tab = e.target.closest('[data-admin-tab]');
    if (tab) {
      const which = tab.dataset.adminTab;
      $$('.admin-tab').forEach(t => t.classList.toggle('admin-tab--active', t === tab));
      $$('.admin-pane').forEach(p => p.classList.toggle('admin-pane--active', p.dataset.adminPane === which));
      // При переключении вкладки подгружаем данные
      if (which === 'users') renderAdminUsers();
      if (which === 'orders') renderAdminOrders();
      if (which === 'catalog') renderAdminCatalog();
      if (which === 'tx') renderAdminTransactions();
      if (which === 'overview') renderAdminOverview();
    }

    // Order filter
    const filter = e.target.closest('[data-order-filter]');
    if (filter) {
      adminState.orderFilter = filter.dataset.orderFilter;
      $$('[data-order-filter]').forEach(b => b.classList.toggle('admin-btn-sm--primary', b === filter));
      renderAdminOrders();
    }

    // Grant CC button (на строке юзера)
    const grantBtn = e.target.closest('[data-grant-user]');
    if (grantBtn) {
      const userId = grantBtn.dataset.grantUser;
      openGrantModal(userId);
    }

    // Order action buttons
    const fulfillBtn = e.target.closest('[data-fulfill]');
    if (fulfillBtn) updateOrderStatus(fulfillBtn.dataset.fulfill, 'fulfilled');

    const cancelBtn = e.target.closest('[data-cancel-order]');
    if (cancelBtn) {
      if (confirm('Отменить заказ? CC вернутся юзеру на баланс.')) {
        updateOrderStatus(cancelBtn.dataset.cancelOrder, 'cancelled');
      }
    }

    // Product actions
    const editProductBtn = e.target.closest('[data-edit-product]');
    if (editProductBtn) openProductEditModal(editProductBtn.dataset.editProduct);

    const archiveBtn = e.target.closest('[data-archive-product]');
    if (archiveBtn) {
      if (confirm('Скрыть товар с витрины? Это действие можно отменить через БД.')) {
        archiveProduct(archiveBtn.dataset.archiveProduct);
      }
    }
  });

  // Add product button
  $('#admin-add-product')?.addEventListener('click', () => openProductEditModal(null));

  // Grant CC modal
  $$('[data-grant-close]').forEach(el => el.addEventListener('click', closeGrantModal));
  $('#grant-submit')?.addEventListener('click', submitGrant);

  // Product edit modal
  $$('[data-pedit-close]').forEach(el => el.addEventListener('click', closeProductEditModal));
  $('#pedit-submit')?.addEventListener('click', submitProductEdit);

  bindProductImageUpload();
}

// ============================================
// OVERVIEW (KPI + recent pending orders)
// ============================================
async function renderAdminOverview() {
  const grid = $('#admin-kpi');
  if (!grid) return;

  const { data: kpi, error } = await supabaseClient.rpc('admin_get_kpi');
  if (error || !kpi) {
    grid.innerHTML = `<div class="admin-empty">Не удалось загрузить KPI</div>`;
    return;
  }

  grid.innerHTML = `
    <div class="kpi kpi--accent">
      <div class="kpi__label">${icon('user')} Всего юзеров</div>
      <div class="kpi__value tnum">${kpi.total_users || 0}</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">${icon('coin')} Баланс системы</div>
      <div class="kpi__value tnum">${fmt(kpi.total_balance || 0)}</div>
      <div class="kpi__sub">CC в обращении</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">${icon('trend-up')} Заработано всего</div>
      <div class="kpi__value tnum">${fmt(kpi.total_earned || 0)}</div>
      <div class="kpi__sub">CC за всё время</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">${icon('bag')} Потрачено</div>
      <div class="kpi__value tnum">${fmt(kpi.total_spent || 0)}</div>
      <div class="kpi__sub">CC ушло в мерч</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">${icon('package')} Pending заказов</div>
      <div class="kpi__value tnum">${kpi.pending_orders || 0}</div>
      <div class="kpi__sub">требуют выдачи</div>
    </div>
    <div class="kpi">
      <div class="kpi__label">${icon('check')} Выданные</div>
      <div class="kpi__value tnum">${kpi.fulfilled_orders || 0}</div>
    </div>
  `;

  // Update tab counts
  $('#admin-users-count').textContent = kpi.total_users || 0;
  $('#admin-orders-count').textContent = kpi.pending_orders || 0;
  $('#admin-catalog-count').textContent = kpi.total_products || 0;

  // Recent pending orders
  const { data: orders } = await supabaseClient.rpc('admin_get_orders', { p_status: 'pending' });
  const recent = (orders || []).slice(0, 5);

  $('#admin-recent-orders').innerHTML = recent.length === 0
    ? `<div class="admin-empty"><div class="admin-empty__title">Нет pending заказов</div>Все ваши коллеги получили свой мерч 🎉</div>`
    : `<div class="admin-table admin-table--orders">
        <div class="admin-table__head">
          <div>Order ID</div>
          <div>Юзер</div>
          <div>Сумма</div>
          <div>Статус</div>
          <div>Действия</div>
        </div>
        ${recent.map(orderRow).join('')}
      </div>`;
}

// ============================================
// USERS
// ============================================
async function renderAdminUsers() {
  const list = $('#admin-users-list');
  if (!list) return;
  list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-dim)">Загрузка...</div>';

  const { data: users, error } = await supabaseClient.rpc('admin_get_users');
  if (error) {
    list.innerHTML = `<div class="admin-empty">Ошибка: ${error.message}</div>`;
    return;
  }

  list.innerHTML = users.map(u => {
    const initials = (u.name || u.email).split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    return `
      <div class="admin-table__row">
        <div class="admin-user-cell">
          <div class="admin-user-cell__avatar">${initials}</div>
          <div>
            <div class="admin-user-cell__name">${u.name || '—'} ${u.role === 'admin' ? '<span class="admin-status-pill admin-status-pill--admin" style="margin-left:6px">admin</span>' : ''}</div>
            <div class="admin-user-cell__email">${u.email}</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--text-muted)">${u.team || '—'}</div>
        <div class="admin-amount admin-amount--in">${fmt(u.balance)} CC</div>
        <div class="mono dim" style="font-size:13px">${u.orders_count || 0}</div>
        <div class="admin-actions">
          <button class="admin-btn-sm admin-btn-sm--primary" data-grant-user="${u.id}">
            ${icon('plus')} Начислить
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// ORDERS (admin queue)
// ============================================
async function renderAdminOrders() {
  const list = $('#admin-orders-list');
  if (!list) return;
  list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-dim)">Загрузка...</div>';

  const filter = adminState.orderFilter === 'all' ? null : adminState.orderFilter;
  const { data: orders, error } = await supabaseClient.rpc('admin_get_orders', { p_status: filter });

  if (error) {
    list.innerHTML = `<div class="admin-empty">Ошибка: ${error.message}</div>`;
    return;
  }

  if (!orders || orders.length === 0) {
    list.innerHTML = `<div class="admin-empty"><div class="admin-empty__title">Пусто</div>Заказы с этим статусом отсутствуют</div>`;
    return;
  }

  list.innerHTML = orders.map(orderRow).join('');
}

function orderRow(o) {
  const shortId = '#' + o.id.replace(/-/g, '').slice(0, 8).toUpperCase();
  const date = new Date(o.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return `
    <div class="admin-table__row">
      <div>
        <div class="mono" style="font-size:13px;font-weight:600;color:var(--indigo-soft)">${shortId}</div>
        <div class="mono dim" style="font-size:11px;margin-top:2px">${date}</div>
      </div>
      <div>
        <div style="font-size:14px;font-weight:500">${o.user_name || '—'}</div>
        <div class="mono dim" style="font-size:11px">${o.user_email}</div>
      </div>
      <div class="admin-amount admin-amount--out">${fmt(o.total_cc)} CC</div>
      <div><span class="admin-status-pill admin-status-pill--${o.status}">${o.status}</span></div>
      <div class="admin-actions">
        ${o.status === 'pending' ? `
          <button class="admin-btn-sm admin-btn-sm--success" data-fulfill="${o.id}">
            ${icon('check')} Выдан
          </button>
          <button class="admin-btn-sm admin-btn-sm--danger" data-cancel-order="${o.id}">
            ${icon('x')} Отмена
          </button>
        ` : ''}
        <button class="admin-btn-sm" data-order-id="${o.id}">
          ${icon('eye')} Детали
        </button>
      </div>
    </div>
  `;
}

async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabaseClient.rpc('admin_update_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) {
    toast(error.message, 'err');
    return;
  }
  toast(status === 'fulfilled' ? 'Заказ помечен как выданный' : 'Заказ отменён', 'in');
  renderAdminOrders();
  renderAdminOverview();
}

// ============================================
// CATALOG (CRUD products)
// ============================================
async function renderAdminCatalog() {
  const list = $('#admin-catalog-list');
  if (!list) return;
  list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-dim)">Загрузка...</div>';

  const { data: products_, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML = `<div class="admin-empty">Ошибка: ${error.message}</div>`;
    return;
  }

  list.innerHTML = products_.map(p => {
    const accent = p.accent || '#818CF8';
    const imgHtml = p.image_url
      ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" />`
      : (productRenderers[p.category] || svgTee)(p.color, accent);

    return `
      <div class="admin-table__row">
        <div style="width:48px;height:48px;background:var(--bg-2);border-radius:8px;overflow:hidden">
          ${imgHtml}
        </div>
        <div>
          <div style="font-size:14px;font-weight:500">${p.name}</div>
          <div class="mono dim" style="font-size:11px">${p.id} ${p.status !== 'active' ? '· archived' : ''}</div>
        </div>
        <div style="font-size:13px;color:var(--text-muted)">${p.category}</div>
        <div class="admin-amount" style="color:var(--indigo-soft)">${fmt(p.price)} CC</div>
        <div class="admin-actions">
          <button class="admin-btn-sm" data-edit-product="${p.id}">${icon('eye')} Изменить</button>
          ${p.status === 'active' ? `<button class="admin-btn-sm admin-btn-sm--danger" data-archive-product="${p.id}">${icon('x')}</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function archiveProduct(productId) {
  const { error } = await supabaseClient
    .from('products')
    .update({ status: 'archived' })
    .eq('id', productId);

  if (error) {
    toast(error.message, 'err');
    return;
  }
  toast('Товар скрыт с витрины', 'in');
  renderAdminCatalog();
  // Обновим основной каталог (если юзер ходит в магазин потом)
  window.products = await fetchProducts();
}

// ============================================
// TRANSACTIONS
// ============================================
async function renderAdminTransactions() {
  const list = $('#admin-tx-list');
  if (!list) return;
  list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-dim)">Загрузка...</div>';

  // Все транзакции с email юзера
  const { data: txs, error } = await supabaseClient
    .from('transactions')
    .select(`
      id, type, amount, source, description, created_at,
      profiles!transactions_user_id_fkey ( name, email )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    list.innerHTML = `<div class="admin-empty">Ошибка: ${error.message}</div>`;
    return;
  }

  if (!txs || txs.length === 0) {
    list.innerHTML = `<div class="admin-empty"><div class="admin-empty__title">Транзакций нет</div></div>`;
    return;
  }

  list.innerHTML = txs.map(t => {
    const date = new Date(t.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const sign = t.type === 'in' ? '+' : '−';
    return `
      <div class="admin-table__row">
        <div>
          <div style="font-size:13px;font-weight:500">${t.profiles?.name || '—'}</div>
          <div class="mono dim" style="font-size:11px">${t.profiles?.email || ''}</div>
        </div>
        <div style="font-size:13px;color:var(--text-muted)">${t.description}</div>
        <div class="mono dim" style="font-size:11px">${t.source}</div>
        <div class="admin-amount admin-amount--${t.type}">${sign}${fmt(t.amount)} CC</div>
        <div class="mono dim" style="font-size:11px">${date}</div>
      </div>
    `;
  }).join('');
}

// ============================================
// GRANT CC MODAL
// ============================================
async function openGrantModal(userId) {
  // Получим инфу о юзере
  const { data: users } = await supabaseClient.rpc('admin_get_users');
  const user = (users || []).find(u => u.id === userId);
  if (!user) {
    toast('Юзер не найден', 'err');
    return;
  }

  adminState.selectedUser = user;
  const initials = (user.name || user.email).split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();

  $('#grant-user-info').innerHTML = `
    <div class="admin-user-cell__avatar">${initials}</div>
    <div>
      <div style="font-size:14px;font-weight:500">${user.name}</div>
      <div class="mono dim" style="font-size:12px">Текущий баланс: ${fmt(user.balance)} CC</div>
    </div>
  `;

  $('#grant-amount').value = '';
  $('#grant-description').value = '';
  $('#grant-source').value = 'manual';

  $('#grant-modal').classList.add('admin-modal--open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#grant-amount').focus(), 100);
}

function closeGrantModal() {
  $('#grant-modal').classList.remove('admin-modal--open');
  document.body.style.overflow = '';
  adminState.selectedUser = null;
}

async function submitGrant() {
  const amount = parseInt($('#grant-amount').value, 10);
  const description = $('#grant-description').value.trim();
  const source = $('#grant-source').value;

  if (!amount || amount <= 0) { toast('Введи положительную сумму', 'err'); return; }
  if (!description) { toast('Опиши за что начисление', 'err'); return; }
  if (!adminState.selectedUser) return;

  const { data, error } = await supabaseClient.rpc('admin_grant_cc', {
    p_user_id: adminState.selectedUser.id,
    p_amount: amount,
    p_description: description,
    p_source: source,
  });

  if (error) {
    toast(error.message, 'err');
    return;
  }

  toast(`Начислено ${amount} CC юзеру ${adminState.selectedUser.name}`, 'in');
  closeGrantModal();
  renderAdminUsers();
  renderAdminOverview();
}

// ============================================
// PRODUCT EDIT MODAL
// ============================================
async function openProductEditModal(productId) {
  const isNew = !productId;
  adminState.editingProduct = productId;
  peditImageUrl = null;   // сброс

  $('#pedit-title').textContent = isNew ? 'Новый товар' : 'Редактирование товара';

  if (isNew) {
    $('#pedit-id').value = '';
    $('#pedit-id').disabled = false;
    $('#pedit-name').value = '';
    $('#pedit-category').value = 'hoodie';
    $('#pedit-price').value = '';
    $('#pedit-desc').value = '';
    $('#pedit-color').value = '#1A1A22';
    $('#pedit-accent').value = '#818CF8';
    $('#pedit-badge').value = '';
  } else {
    const { data: p } = await supabaseClient.from('products').select('*').eq('id', productId).single();
    if (!p) { toast('Товар не найден', 'err'); return; }
    $('#pedit-id').value = p.id;
    $('#pedit-id').disabled = true;
    $('#pedit-name').value = p.name;
    $('#pedit-category').value = p.category;
    $('#pedit-price').value = p.price;
    $('#pedit-desc').value = p.description || '';
    $('#pedit-color').value = p.color || '#1A1A22';
    $('#pedit-accent').value = p.accent || '#818CF8';
    $('#pedit-badge').value = p.badge || '';
    peditImageUrl = p.image_url || null;
  }
   // ↓ ДОБАВИТЬ: обновить превью фото
  refreshImagePreview();

  $('#product-edit-modal').classList.add('admin-modal--open');
  document.body.style.overflow = 'hidden';
}

function refreshImagePreview() {
  const preview = $('#pedit-image-preview');
  const removeBtn = $('#pedit-image-remove-btn');
  const uploadBtn = $('#pedit-image-upload-btn');
  if (!preview) return;

  if (peditImageUrl) {
    preview.innerHTML = `<img src="${peditImageUrl}" style="width:100%;height:100%;object-fit:cover" />`;
    removeBtn.style.display = '';
    uploadBtn.innerHTML = `${icon('plus')} Заменить фото`;
  } else {
    preview.innerHTML = `<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim)">SVG fallback (без фото)</span>`;
    removeBtn.style.display = 'none';
    uploadBtn.innerHTML = `${icon('plus')} Загрузить фото`;
  }
}

async function uploadProductImage(file) {
  if (file.size > 3 * 1024 * 1024) {
    toast('Файл слишком большой, максимум 3 МБ', 'err');
    return null;
  }

  const productId = $('#pedit-id').value.trim();
  if (!productId) {
    toast('Сначала укажи ID товара', 'err');
    return null;
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${productId}/main.${ext}`;

  toast('Загружаю...', 'in');

  // Удалим старые форматы, если есть
  for (const oldExt of ['png', 'jpg', 'jpeg', 'webp']) {
    if (oldExt !== ext) {
      await supabaseClient.storage.from('products').remove([`${productId}/main.${oldExt}`]);
    }
  }

  const { error: uploadError } = await supabaseClient.storage
    .from('products')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    toast('Ошибка загрузки: ' + uploadError.message, 'err');
    return null;
  }

  const { data: { publicUrl } } = supabaseClient.storage.from('products').getPublicUrl(path);
  return `${publicUrl}?t=${Date.now()}`;  // cache-bust
}

function bindProductImageUpload() {
  $('#pedit-image-upload-btn')?.addEventListener('click', () => {
    $('#pedit-image-input').click();
  });

  $('#pedit-image-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadProductImage(file);
    if (url) {
      peditImageUrl = url;
      refreshImagePreview();
      toast('Фото загружено', 'in');
    }
    e.target.value = '';   // сброс input чтобы можно было загрузить тот же файл повторно
  });

  $('#pedit-image-remove-btn')?.addEventListener('click', async () => {
    if (!confirm('Убрать фото? Товар вернётся к SVG-иллюстрации.')) return;
    
    // Если есть продукт и старый URL — удалить файл из storage
    const productId = $('#pedit-id').value.trim();
    if (productId && peditImageUrl) {
      for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
        await supabaseClient.storage.from('products').remove([`${productId}/main.${ext}`]);
      }
    }
    peditImageUrl = null;
    refreshImagePreview();
  });
}

function closeProductEditModal() {
  $('#product-edit-modal').classList.remove('admin-modal--open');
  document.body.style.overflow = '';
}

async function submitProductEdit() {
  const id = $('#pedit-id').value.trim();
  const name = $('#pedit-name').value.trim();
  const category = $('#pedit-category').value;
  const price = parseInt($('#pedit-price').value, 10);
  const description = $('#pedit-desc').value.trim();
  const color = $('#pedit-color').value.trim();
  const accent = $('#pedit-accent').value.trim();
  const badge = $('#pedit-badge').value || null;

  if (!id || !name || !price) {
    toast('Заполни ID, название и цену', 'err');
    return;
  }

  const payload = { 
    id, name, category, price, description, color, accent, badge, 
    image_url: peditImageUrl,
    status: 'active' 
  };

  const { error } = adminState.editingProduct
    ? await supabaseClient.from('products').update(payload).eq('id', adminState.editingProduct)
    : await supabaseClient.from('products').insert(payload);

  if (error) {
    toast(error.message, 'err');
    return;
  }

  toast(adminState.editingProduct ? 'Товар обновлён' : 'Товар создан', 'in');
  closeProductEditModal();
  renderAdminCatalog();
  // Обновим публичный каталог
  window.products = await fetchProducts();
}