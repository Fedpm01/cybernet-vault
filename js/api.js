// ============================================================
// CYBERNET VAULT // Data API (заменяет hardcoded data.js)
// ============================================================

// Получить все товары
async function fetchProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('status', 'active')
    .order('popularity', { ascending: false });

  if (error) {
    console.error('fetchProducts error:', error);
    return [];
  }
  return data;
}

// Получить транзакции текущего пользователя
async function fetchActivity(limit = 20) {
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) { console.error(error); return []; }

  // Преобразуем формат под фронт
  return data.map(t => ({
    type: t.type,
    title: t.description,
    amount: t.type === 'in' ? t.amount : -t.amount,
    time: timeAgo(t.created_at),
  }));
}

// Получить лидерборд
async function fetchLeaderboard() {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select(`
      id, name, team,
      wallets!inner(lifetime_earned)
    `)
    .order('wallets(lifetime_earned)', { ascending: false })
    .limit(50);

  if (error) { console.error(error); return []; }

  const myId = (await supabaseClient.auth.getUser()).data.user?.id;
  return data.map((u, i) => ({
    name: u.name,
    role: u.team,
    coins: u.wallets.lifetime_earned,
    initials: u.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase(),
    me: u.id === myId,
    delta: '0',  // позже добавим расчёт
  }));
}

// Получить баланс
async function fetchBalance() {
  const { data, error } = await supabaseClient
    .from('wallets')
    .select('balance, lifetime_earned, lifetime_spent')
    .maybeSingle();

  if (error) { console.error('fetchBalance error:', error); return null; }
  
  window.myWallet = data;  // ← сохраняем целиком
  return data;
}

// Получить ачивки
async function fetchAchievements() {
  const { data: all } = await supabaseClient.from('achievements').select('*');
  const { data: unlocked } = await supabaseClient.from('user_achievements').select('achievement_id');

  const unlockedIds = new Set((unlocked || []).map(u => u.achievement_id));
  return (all || []).map(a => ({
    name: a.name,
    desc: a.description,
    icon: a.icon,
    unlocked: unlockedIds.has(a.id),
  }));
}

// Получить корзину
async function fetchCart() {
  const { data, error } = await supabaseClient
    .from('cart_items')
    .select('*');
  if (error) { console.error(error); return []; }

  return data.map(i => ({
    _key: `${i.product_id}__${i.size}__${i.color}`,
    id: i.product_id,
    size: i.size,
    color: i.color,
    qty: i.qty,
  }));
}
async function fetchMyRank() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const { data: all, error } = await supabaseClient
    .from('wallets')
    .select('user_id, lifetime_earned')
    .order('lifetime_earned', { ascending: false });

  if (error || !all) return;
  
  window.totalUsers = all.length;
  window.myRank = all.findIndex(w => w.user_id === user.id) + 1;
}

// Добавить в корзину
async function addCartItem(productId, size, color) {
  // Если уже есть — увеличиваем qty, иначе создаём
  const { data: existing } = await supabaseClient
    .from('cart_items')
    .select('id, qty')
    .match({ product_id: productId, size, color })
    .maybeSingle();

  if (existing) {
    await supabaseClient.from('cart_items')
      .update({ qty: existing.qty + 1 })
      .eq('id', existing.id);
  } else {
    await supabaseClient.from('cart_items')
      .insert({ product_id: productId, size, color, qty: 1 });
  }
}

// Удалить из корзины
async function removeCartItem(productId, size, color) {
  await supabaseClient.from('cart_items')
    .delete()
    .match({ product_id: productId, size, color });
}

// Лайки
async function toggleLike(productId) {
  const { data: existing } = await supabaseClient
    .from('likes')
    .select('product_id')
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await supabaseClient.from('likes').delete().eq('product_id', productId);
    return false;
  } else {
    await supabaseClient.from('likes').insert({ product_id: productId });
    return true;
  }
}

// ---------- Helpers ----------
function timeAgo(iso) {
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

// Получить свой профиль
async function fetchMyProfile() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) { console.error('fetchMyProfile error:', error); return null; }
  return data;
}

// Хелпер: получить инициалы из имени
function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
}

// Установить точное qty для строки в корзине
async function setCartItemQty(productId, size, color, qty) {
  await supabaseClient.from('cart_items')
    .update({ qty })
    .match({ product_id: productId, size, color });
}