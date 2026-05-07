// ============================================================
// CYBERNET VAULT // Orders page + receipt modal
// ============================================================

// Получить все заказы текущего пользователя
async function fetchMyOrders() {
  const { data, error } = await supabaseClient
    .from('orders')
    .select(`
      id, total_cc, status, created_at, fulfilled_at,
      order_items ( id, product_id, size, color, qty, price_cc )
    `)
    .order('created_at', { ascending: false });

  if (error) { console.error('fetchMyOrders error:', error); return []; }
  return data || [];
}

// Короткий ID для отображения (#A0BF5E0E из uuid)
function shortOrderId(uuid) {
  return '#' + uuid.replace(/-/g, '').slice(0, 8).toUpperCase();
}

// Превратить ISO-дату в "2 ч назад" или нормальную дату
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'вчера';
  if (d < 7) return `${d} дн. назад`;
  if (d < 30) return `${Math.floor(d / 7)} нед. назад`;
  return new Date(iso).toLocaleDateString('ru-RU');
}

// Маппинг статусов
const STATUS_LABEL = {
  pending: 'Ожидает выдачи',
  fulfilled: 'Выдан',
  cancelled: 'Отменён',
};

// Рендер списка заказов на странице
async function renderOrders() {
  const list = $('#orders-list');
  if (!list) return;

  const orders = await fetchMyOrders();

  if (orders.length === 0) {
    list.innerHTML = `
      <div style="padding:60px 24px;text-align:center;color:var(--text-muted);background:var(--bg-1);border:1px solid var(--line);border-radius:var(--radius-lg)">
        <div style="font-family:var(--font-display);font-size:22px;margin-bottom:8px">Пока пусто</div>
        <div style="font-size:14px;margin-bottom:20px">Твои покупки появятся здесь</div>
        <button class="btn btn--primary" data-route="shop">В магазин</button>
      </div>`;
    return;
  }

  const productsList = window.products || [];

  list.innerHTML = orders.map(o => {
    const firstItem = o.order_items?.[0];
    const p = firstItem ? productsList.find(x => x.id === firstItem.product_id) : null;
    const totalQty = o.order_items?.reduce((s, i) => s + i.qty, 0) || 0;
    const summary = p
      ? (totalQty > 1
          ? `${p.name} и ещё ${totalQty - 1} ${totalQty - 1 < 5 ? 'шт' : 'шт'}`
          : `${p.name} · ${firstItem.size} · ${firstItem.color}`)
      : `${totalQty} ${totalQty === 1 ? 'позиция' : 'позиций'}`;

    return `
      <div class="order-row" data-order-id="${o.id}">
        <span class="order-status order-status--${o.status}">${STATUS_LABEL[o.status] || o.status}</span>
        <div>
          <div class="order-id">${shortOrderId(o.id)}</div>
          <div class="order-summary">${summary}</div>
        </div>
        <div class="order-amount">−${fmt(o.total_cc)} CC</div>
        <div class="order-time">${relativeTime(o.created_at)}</div>
      </div>
    `;
  }).join('');
}

// Открыть квитанцию — по uuid заказа
async function openReceipt(orderUuid) {
  const orders = await fetchMyOrders();
  const o = orders.find(x => x.id === orderUuid);
  if (!o) {
    toast('Заказ не найден', 'err');
    return;
  }

  const productsList = window.products || [];
  const shortId = shortOrderId(o.id);
  const date = new Date(o.created_at);

  $('#receipt-id').textContent = shortId;
  $('#receipt-show-id').textContent = shortId;
  $('#receipt-status').innerHTML = `<span class="order-status order-status--${o.status}">${STATUS_LABEL[o.status] || o.status}</span>`;
  $('#receipt-date').textContent = date.toLocaleDateString('ru-RU');
  $('#receipt-time').textContent = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  $('#receipt-total').textContent = `−${fmt(o.total_cc)} CC`;

  // Состав заказа
$('#receipt-items').innerHTML = (o.order_items || []).map(item => {
  const p = productsList.find(x => x.id === item.product_id);
  if (!p) {
    return `
      <div class="receipt__item">
        <div class="receipt__item-img"></div>
        <div>
          <div class="receipt__item-name">${item.product_id}</div>
          <div class="receipt__item-meta">${item.size} · ${item.color}</div>
        </div>
        <div class="receipt__item-qty">×${item.qty}</div>
      </div>`;
  }
  const accent = p.accent || '#818CF8';
  const imgHtml = p.image_url
    ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" />`
    : (productRenderers[p.category] || svgTee)(p.color, accent);

  return `
    <div class="receipt__item">
      <div class="receipt__item-img">${imgHtml}</div>
      <div>
        <div class="receipt__item-name">${p.name}</div>
        <div class="receipt__item-meta">${item.size} · ${item.color} · ${fmt(item.price_cc)} CC</div>
      </div>
      <div class="receipt__item-qty">×${item.qty}</div>
    </div>
  `;
}).join('');

  // Текст инструкции в зависимости от статуса
  const instr = $('#receipt-instruction');
  if (o.status === 'pending') {
    instr.innerHTML = `Покажи этот ID <strong>${shortId}</strong> офис-менеджеру, чтобы забрать мерч из офиса.`;
    instr.style.display = 'block';
  } else if (o.status === 'fulfilled') {
    instr.innerHTML = `Заказ <strong>выдан</strong> ${o.fulfilled_at ? relativeTime(o.fulfilled_at) : ''}. Носи с гордостью.`;
    instr.style.display = 'block';
  } else if (o.status === 'cancelled') {
    instr.innerHTML = `Заказ <strong>отменён</strong>. CC возвращены на баланс.`;
    instr.style.display = 'block';
  }

  $('#receipt-modal').classList.add('receipt--open');
  document.body.style.overflow = 'hidden';
}

function closeReceipt() {
  $('#receipt-modal').classList.remove('receipt--open');
  document.body.style.overflow = '';
}

function bindOrders() {
  // Клик по заказу в списке → открыть квитанцию
  document.body.addEventListener('click', e => {
    const row = e.target.closest('[data-order-id]');
    if (row) {
      openReceipt(row.dataset.orderId);
    }
  });

  // Закрытие модалки
  $$('[data-receipt-close]').forEach(el => el.addEventListener('click', closeReceipt));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeReceipt();
  });

  // Когда переходим на страницу orders — рендерим
  document.body.addEventListener('click', e => {
    const link = e.target.closest('[data-route="orders"]');
    if (link) renderOrders();
  });
}