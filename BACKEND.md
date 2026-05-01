# BACKEND.md — Supabase для Cybernet Vault
## Пошаговый гайд для того, кто впервые подключает бэкенд

> Этот гайд написан для человека, у которого нет опыта с бэкендом. Каждый шаг — самодостаточный. Если что-то не получается — пиши Claude (мне), я разберу конкретный момент.

**Что мы делаем:** превращаем твой статичный прототип в реальное приложение с базой данных, авторизацией, и сохранением покупок.

**Сколько времени:** 2-3 выходных дня, если идёшь по гайду без пропусков.

**Стоимость:** **$0/мес** на старте (бесплатный тариф Supabase покрывает до 50 000 пользователей).

---

## Содержание

1. [Что такое Supabase и почему мы его выбрали](#1-что-такое-supabase)
2. [Регистрация и создание проекта](#2-регистрация)
3. [Создание таблиц через SQL Editor](#3-таблицы)
4. [Row Level Security — кто что видит](#4-rls)
5. [Заполнение тестовыми данными (seed)](#5-seed)
6. [Подключение Supabase к фронтенду](#6-подключение)
7. [Замена data.js на запросы к БД](#7-замена-данных)
8. [Авторизация — login/signup через Supabase](#8-авторизация)
9. [Корзина и checkout с реальной транзакцией](#9-checkout)
10. [Деплой на Vercel](#10-деплой)
11. [Что дальше: SSO, webhooks, админка](#11-дальше)
12. [Чек-лист безопасности перед запуском](#12-безопасность)

---

## 1. Что такое Supabase

Supabase — это **готовый бэкенд в облаке**. Тебе не нужно писать сервер, настраивать БД, поднимать API. Всё уже работает, ты только пишешь SQL-схему и используешь готовые методы из JavaScript-библиотеки.

Что ты получаешь сразу:

- **PostgreSQL база данных** — настоящая, не игрушечная
- **Авторизация** — login/signup/SSO/password reset
- **Auto-API** — для каждой таблицы автоматически работают `select / insert / update / delete`
- **Row Level Security (RLS)** — безопасность на уровне БД ("каждый видит только свои покупки")
- **Storage** — для аватарок и картинок мерча
- **Realtime** — лидерборд обновляется в реальном времени

**Главный плюс:** код в твоём фронтенде вместо
```js
const products = [...]; // hardcoded
```
будет
```js
const { data: products } = await supabase.from('products').select('*');
```

Всё. Никакого "напиши API endpoint, потом fetch к нему".

---

## 2. Регистрация

### 2.1 Создай аккаунт

1. Открой https://supabase.com
2. Нажми **Start your project** → войди через GitHub (рекомендую) или email
3. После входа нажми **New project**

### 2.2 Создай проект

Заполни:
- **Name:** `cybernet-vault`
- **Database Password:** придумай надёжный пароль и **сохрани его в менеджер паролей** (1Password, Bitwarden). Это пароль от твоей БД, его потерять = потерять прямой доступ к БД.
- **Region:** ближайший к тебе. Для Узбекистана — **Frankfurt (eu-central-1)**.
- **Pricing Plan:** Free

Нажми **Create new project**. Подожди ~2 минуты пока всё поднимется.

### 2.3 Найди свои ключи

После создания проекта открой **Settings → API**. Запомни (или скопируй в блокнот):

- **Project URL** — типа `https://xxxxxxxxxxxxxxxxx.supabase.co`
- **anon public key** — длинный JWT-токен, начинается с `eyJ...`

Эти два значения мы будем использовать на фронте.

> ⚠️ **Никогда не коммить `service_role` key в код.** Это admin-ключ, он обходит все правила безопасности. `anon` ключ — безопасный, его можно класть в фронтенд (так и задумано Supabase).

---

## 3. Таблицы

Открой **SQL Editor** в левом меню Supabase. Нажми **+ New query** и вставь весь SQL ниже одним блоком, потом нажми **Run**.

```sql
-- ===========================================
-- CYBERNET VAULT // Database schema
-- ===========================================

-- Профили пользователей (расширение auth.users)
-- Supabase сам создаёт таблицу auth.users для логинов,
-- мы добавляем "прицепом" свои поля
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  team text,
  role text default 'employee',         -- 'employee' | 'admin'
  tier int default 1,
  created_at timestamptz default now()
);

-- Кошельки. Один к одному с profiles.
create table public.wallets (
  user_id uuid references public.profiles on delete cascade primary key,
  balance int not null default 500 check (balance >= 0),  -- стартовый бонус
  lifetime_earned int not null default 500,
  lifetime_spent int not null default 0,
  updated_at timestamptz default now()
);

-- Транзакции CC (audit log, нельзя удалять)
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in ('in', 'out')),
  amount int not null check (amount > 0),
  source text not null,           -- 'manual' | 'github_pr' | 'order' | 'bonus' | 'achievement'
  ref_id text,                    -- ID связанной сущности (заказа, PR, ачивки)
  description text not null,
  idempotency_key text unique,    -- защита от дублей
  created_at timestamptz default now()
);
create index idx_tx_user_created on public.transactions (user_id, created_at desc);

-- Каталог товаров
create table public.products (
  id text primary key,
  name text not null,
  category text not null,         -- 'hoodie' | 'tshirt' | 'cap' | etc
  price int not null check (price > 0),
  description text,
  color text,
  accent text,
  badge text,                     -- 'HOT' | 'NEW' | null
  popularity int default 0,
  is_new boolean default false,
  status text default 'active',   -- 'active' | 'sold_out' | 'archived'
  created_at timestamptz default now()
);

-- Варианты товара (размер + цвет = SKU с остатками)
create table public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id text references public.products on delete cascade not null,
  size text not null,
  color text not null,
  stock int not null default 0 check (stock >= 0),
  unique (product_id, size, color)
);

-- Корзина
create table public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  product_id text references public.products not null,
  size text not null,
  color text not null,
  qty int not null default 1 check (qty > 0),
  added_at timestamptz default now(),
  unique (user_id, product_id, size, color)
);

-- Заказы
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  total_cc int not null check (total_cc >= 0),
  status text not null default 'pending',  -- 'pending' | 'fulfilled' | 'cancelled'
  idempotency_key text unique,
  created_at timestamptz default now(),
  fulfilled_at timestamptz
);
create index idx_orders_user_created on public.orders (user_id, created_at desc);

-- Позиции в заказе
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders on delete cascade not null,
  product_id text references public.products not null,
  size text not null,
  color text not null,
  qty int not null check (qty > 0),
  price_cc int not null            -- цена на момент заказа
);

-- Достижения
create table public.achievements (
  id text primary key,             -- 'first_drop', 'streak_7', etc
  name text not null,
  description text not null,
  icon text not null,              -- 'target' | 'flame' | 'code' | etc
  reward_cc int default 0,
  criteria jsonb                   -- описание условия (для авто-проверки)
);

-- Открытые ачивки пользователей
create table public.user_achievements (
  user_id uuid references public.profiles on delete cascade,
  achievement_id text references public.achievements,
  unlocked_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

-- Лайки
create table public.likes (
  user_id uuid references public.profiles on delete cascade,
  product_id text references public.products on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);
```

Если SQL Editor покажет "Success. No rows returned" — всё ок, таблицы созданы. Можешь зайти в **Table Editor** слева и увидеть их там.

---

## 4. RLS

**Row Level Security** — это правила вида "пользователь A может видеть/менять только то, что относится к нему". Без этого любой залогиненный пользователь сможет читать/менять чужие данные через API.

В том же SQL Editor запусти:

```sql
-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

-- Включаем RLS на всех таблицах
alter table public.profiles      enable row level security;
alter table public.wallets       enable row level security;
alter table public.transactions  enable row level security;
alter table public.products      enable row level security;
alter table public.product_variants enable row level security;
alter table public.cart_items    enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.achievements  enable row level security;
alter table public.user_achievements enable row level security;
alter table public.likes         enable row level security;

-- ============== PROFILES ==============
-- Любой залогиненный видит все профили (для лидерборда нужны имена)
create policy "profiles read all"
  on public.profiles for select
  to authenticated
  using (true);

-- Менять можно только свой профиль
create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ============== WALLETS ==============
-- Видишь только свой кошелёк
create policy "wallets read own"
  on public.wallets for select
  to authenticated
  using (auth.uid() = user_id);

-- Кошелёк меняется ТОЛЬКО через server-side функции (не через клиент)
-- поэтому INSERT/UPDATE policies не создаём — клиент их трогать не должен

-- ============== TRANSACTIONS ==============
-- Видишь только свои транзакции
create policy "transactions read own"
  on public.transactions for select
  to authenticated
  using (auth.uid() = user_id);

-- Создавать может только сервер (через Edge Functions с service_role)

-- ============== PRODUCTS ==============
-- Все залогиненные видят все товары
create policy "products read all"
  on public.products for select
  to authenticated
  using (status = 'active');

create policy "variants read all"
  on public.product_variants for select
  to authenticated
  using (true);

-- ============== CART ==============
-- Своя корзина — полный доступ
create policy "cart full access own"
  on public.cart_items for all
  to authenticated
  using (auth.uid() = user_id);

-- ============== ORDERS ==============
-- Видишь свои заказы
create policy "orders read own"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

-- Создавать заказ через RPC-функцию (см. шаг 9)

create policy "order_items read own"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- ============== ACHIEVEMENTS ==============
create policy "achievements read all"
  on public.achievements for select
  to authenticated
  using (true);

create policy "user_achievements read own"
  on public.user_achievements for select
  to authenticated
  using (auth.uid() = user_id);

-- ============== LIKES ==============
create policy "likes read own"
  on public.likes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "likes insert own"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "likes delete own"
  on public.likes for delete
  to authenticated
  using (auth.uid() = user_id);
```

Запусти. Всё. Теперь даже если кто-то стащит твой `anon` ключ — он не сможет прочитать чужие транзакции или поменять чужой баланс.

---

## 5. Seed

Заполним каталог тестовыми данными. В SQL Editor:

```sql
-- ===========================================
-- SEED DATA
-- ===========================================

-- Каталог
insert into public.products (id, name, category, price, description, color, accent, badge, popularity, is_new) values
('core-hoodie',     'Core Hoodie',           'hoodie',  1800, 'Флагманский худи Cybernet. Плотный 350gsm хлопок, бойфренд-крой.', '#1A1A22', '#818CF8', 'HOT',  98, false),
('matrix-tee',      'Matrix Tee',            'tshirt',   480, 'Чёрная футболка из органического хлопка с monochrome принтом.',     '#1A1A22', '#818CF8', 'HOT',  95, false),
('indigo-tee',      'Indigo Drop Tee',       'tshirt',   520, 'Сигнатурный индиго Cybernet. Heavyweight cotton.',                  '#4F46E5', '#FFFFFF', 'NEW',  88, true),
('whisper-cap',     'Whisper Cap',           'cap',      380, '6-панельная классика. Регулируемый ремешок, тоновая вышивка.',      '#1A1A22', '#818CF8', null,   76, false),
('indigo-cap',      'Indigo Snap Cap',       'cap',      420, 'Snapback в фирменном индиго. Дроп ограничен.',                      '#4F46E5', '#FFFFFF', 'NEW',  72, true),
('tumbler-onyx',    'Onyx Tumbler 500ml',    'tumbler',  680, 'Двойная стенка из нержавейки. 12 ч холодным, 6 ч горячим.',         '#22222A', '#818CF8', null,   84, false),
('tumbler-cream',   'Cream Tumbler 500ml',   'tumbler',  680, 'Кремовая версия флагманского тамблера.',                            '#EFE9D8', '#1E1B4B', null,   79, false),
('core-sweater',    'Core Sweater',          'sweater', 1450, 'Тяжёлый трикотажный свитер. Плотная вязка, ребристые манжеты.',     '#3A3A44', '#818CF8', null,   81, false),
('cream-sweater',   'Cream Heritage Sweater','sweater', 1650, 'Премиум вариант — слегка приглушённый, но фирменный.',              '#EFE9D8', '#1E1B4B', 'NEW',  70, true),
('tote-onyx',       'Cyber Tote',            'tote',     320, 'Шопер-сумка из плотного канваса. Усиленные ручки.',                 '#1A1A22', '#818CF8', null,   65, false),
('sticker-pack',    'Sticker Pack · Vol.2',  'sticker',  120, 'Набор из 8 виниловых стикеров.',                                    '#4F46E5', '#FFFFFF', null,   92, false),
('violet-hoodie',   'Violet Edition Hoodie', 'hoodie',  2100, 'Самая редкая коллаборация. 50 штук на всю команду.',                '#A78BFA', '#1E1B4B', 'HOT',  99, true);

-- Варианты (размеры × цвета). Для всех товаров создаём базовые SKU.
insert into public.product_variants (product_id, size, color, stock)
select p.id, s.size, c.color, 50
from public.products p
cross join (values ('XS'),('S'),('M'),('L'),('XL'),('XXL')) s(size)
cross join (values ('Onyx'),('Indigo'),('Cream'),('Violet')) c(color)
where p.category in ('hoodie','tshirt','sweater');

-- Для остальных — без размера, только цвет
insert into public.product_variants (product_id, size, color, stock)
select p.id, 'one-size', c.color, 100
from public.products p
cross join (values ('Onyx'),('Indigo'),('Cream'),('Violet')) c(color)
where p.category not in ('hoodie','tshirt','sweater');

-- Каталог достижений
insert into public.achievements (id, name, description, icon, reward_cc) values
('first_drop',  'First Drop',     'Первая покупка',          'target',   50),
('streak_7',    'Streak Keeper',  '7 дней активности',       'flame',    100),
('code_saint',  'Code Saint',     '100 ревью',               'code',     300),
('hackmaster',  'Hackmaster',     'Победа в хакатоне',       'trophy',   800),
('mentor',      'Mentor',         '10 сессий с джунами',     'brain',    150),
('drop_hunter', 'Drop Hunter',    'Купил 5 limited',         'diamond',  200),
('top_5',       'Top 5',          'Войти в топ-5',           'medal',    500),
('whale',       'Whale',          'Накопить 20 000 CC',      'wave',     0),
('year_one',    'Year One',       '1 год в Cybernet',        'calendar', 1000);
```

---

## 6. Подключение

В index.html, **перед** строкой `<script src="js/icons.js"></script>`, добавь:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
```

Создай новый файл `js/supabase-client.js`:

```js
// ============================================================
// CYBERNET VAULT // Supabase client
// ============================================================

const SUPABASE_URL = 'https://xxxxxxxxxxxxxxxxx.supabase.co';  // <-- твой Project URL
const SUPABASE_ANON_KEY = 'eyJhbGc...';                         // <-- твой anon key

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

**Замени** значения на свои (из шага 2.3).

---

## 7. Замена данных

Открой `js/data.js`. Сейчас там захардкоженные массивы. Заменим на функции, которые тянут данные из Supabase.

Создай новый файл `js/api.js`:

```js
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
    .single();

  if (error) { console.error(error); return null; }
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
```

Подключи в HTML после `data.js`:

```html
<script src="js/api.js"></script>
```

И в `js/main.js` замени `renderAll()` на:

```js
document.addEventListener('DOMContentLoaded', async () => {
  injectIconSprite();
  bindAuth();
  bindNav();
  bindCart();
  bindModal();
  bindShopFilters();
  bindShopCards();

  // Если уже залогинен — сразу грузим данные и показываем app
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) {
    await loadAllData();
    showApp();
  } else {
    showAuth();
  }
});

async function loadAllData() {
  // Параллельно тянем всё
  const [products_, activity_, lb, bal, ach, cart] = await Promise.all([
    fetchProducts(), fetchActivity(), fetchLeaderboard(),
    fetchBalance(), fetchAchievements(), fetchCart(),
  ]);

  // Записываем в глобальные переменные, которые ожидают рендеры
  window.products = products_;
  window.activity = activity_;
  window.leaderboard = lb;
  window.achievements = ach;
  state.user.balance = bal?.balance || 0;
  state.cart = cart;

  renderAll();
  updateCartBadge();
}
```

> Если в HTML параллельно подключены и `data.js` (с захардкоженными данными), и `api.js` — получишь конфликт. Когда переходишь на бэкенд — **удали `<script src="js/data.js"></script>` из HTML**, оставь только `api.js`.

---

## 8. Авторизация

В Supabase, в **Authentication → Providers**, включи **Email**.

Замени `js/auth.js`:

```js
function bindAuth() {
  $$('.auth__tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.auth__tab').forEach(t => t.classList.remove('auth__tab--active'));
      tab.classList.add('auth__tab--active');
      const which = tab.dataset.tab;
      $$('.auth__pane').forEach(p => p.hidden = p.dataset.pane !== which);
    });
  });

  $('#form-login')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#login-email').value;
    const password = $('#login-pw').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      toast(error.message, 'err');
      return;
    }
    await loadAllData();
    showApp();
  });

  $('#form-signup')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    const firstName = form.querySelectorAll('input[type="text"]')[0].value;
    const lastName = form.querySelectorAll('input[type="text"]')[1].value;
    const team = form.querySelector('select').value;

    // Только корпоративные email
    if (!email.endsWith('@cybernet.ai')) {
      toast('Регистрация только для @cybernet.ai', 'err');
      return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email, password,
      options: { data: { name: `${firstName} ${lastName}`, team } }
    });
    if (error) { toast(error.message, 'err'); return; }

    toast('Аккаунт создан · стартовый бонус +500 CC', 'in');
    await loadAllData();
    showApp();
  });
}

async function logout() {
  await supabaseClient.auth.signOut();
  state.cart = [];
  showAuth();
}

function showApp() {
  $('#shell-auth').classList.remove('shell--active');
  $('#shell-app').classList.add('shell--active');
  window.scrollTo({ top: 0 });
}
function showAuth() {
  $('#shell-app').classList.remove('shell--active');
  $('#shell-auth').classList.add('shell--active');
}

function quickLogin() {
  // Demo SSO — для прототипа можно оставить так
  toast('SSO ещё не настроен — используй email', 'err');
}
```

### Auto-create profile + wallet на signup

В Supabase когда новый пользователь регистрируется через `auth.signUp`, у него создаётся запись только в `auth.users`. Нам нужно автоматически создавать ещё `profiles` и `wallets`. Делается через триггер.

В SQL Editor:

```sql
-- Триггер: после регистрации создать profile + wallet + начислить бонус
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, team)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'team', 'Engineering')
  );

  insert into public.wallets (user_id, balance, lifetime_earned)
  values (new.id, 500, 500);

  insert into public.transactions (user_id, type, amount, source, description)
  values (new.id, 'in', 500, 'bonus', 'Welcome bonus');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Теперь регистрация работает end-to-end: создаёт юзера, профиль, кошелёк, начисляет 500 CC.

---

## 9. Checkout

Это **самая важная часть** — здесь нельзя ошибиться. Покупка должна быть **атомарной**: либо списались CC и создался заказ, либо ничего не произошло. Никаких "списались, но заказ не создался" быть не должно.

Делается через **PostgreSQL функцию** (RPC), которую вызывает фронтенд.

В SQL Editor:

```sql
-- ===========================================
-- CHECKOUT (idempotent, atomic)
-- ===========================================
create or replace function public.checkout_cart(p_idempotency_key text)
returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total int;
  v_balance int;
  v_order_id uuid;
  v_existing_order uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Проверяем что не дубль
  select id into v_existing_order
  from public.orders
  where idempotency_key = p_idempotency_key;

  if v_existing_order is not null then
    return json_build_object('order_id', v_existing_order, 'duplicate', true);
  end if;

  -- Считаем total из корзины
  select coalesce(sum(p.price * c.qty), 0)
  into v_total
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_user_id;

  if v_total = 0 then
    raise exception 'Cart is empty';
  end if;

  -- Проверяем баланс
  select balance into v_balance
  from public.wallets
  where user_id = v_user_id
  for update;  -- блокировка строки на время транзакции

  if v_balance < v_total then
    raise exception 'Insufficient CC: need %, have %', v_total, v_balance;
  end if;

  -- Создаём заказ
  insert into public.orders (user_id, total_cc, idempotency_key, status)
  values (v_user_id, v_total, p_idempotency_key, 'pending')
  returning id into v_order_id;

  -- Копируем позиции из корзины в order_items
  insert into public.order_items (order_id, product_id, size, color, qty, price_cc)
  select v_order_id, c.product_id, c.size, c.color, c.qty, p.price
  from public.cart_items c
  join public.products p on p.id = c.product_id
  where c.user_id = v_user_id;

  -- Списываем CC
  update public.wallets
  set balance = balance - v_total,
      lifetime_spent = lifetime_spent + v_total,
      updated_at = now()
  where user_id = v_user_id;

  -- Записываем транзакцию
  insert into public.transactions (user_id, type, amount, source, ref_id, description, idempotency_key)
  values (v_user_id, 'out', v_total, 'order', v_order_id::text,
          'Order #' || substring(v_order_id::text, 1, 8),
          p_idempotency_key);

  -- Очищаем корзину
  delete from public.cart_items where user_id = v_user_id;

  return json_build_object('order_id', v_order_id, 'total', v_total, 'duplicate', false);
end;
$$;

grant execute on function public.checkout_cart(text) to authenticated;
```

В `js/cart.js` замени функцию `checkout` на:

```js
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
```

**Что важно:**
- `crypto.randomUUID()` создаёт уникальный ключ для каждого нажатия "Обменять". Если юзер случайно дважды кликнет — второй вызов вернёт уже существующий заказ, новых списаний не будет.
- Вся логика выполняется атомарно в одной транзакции БД. Если что-то упадёт посередине (например, отвалится сеть) — БД откатит всё назад.
- `for update` блокирует строку кошелька на время транзакции, чтобы никто другой параллельно не списал тот же баланс.

---

## 10. Деплой

Когда всё работает локально, нужно выложить в интернет.

### Через Vercel (рекомендую — бесплатно и быстро)

1. Создай репозиторий на GitHub: `cybernet-vault`. Залей туда папку `cybernet-vault/`.
2. Открой https://vercel.com → войди через GitHub.
3. **Add New → Project** → выбери репозиторий → **Deploy**.

Vercel сам определит что это статический сайт и опубликует. Получишь URL вида `cybernet-vault.vercel.app`.

### Свой домен (опционально)

Если у Cybernet есть домен (например, `vault.cybernet.ai`):
1. В Vercel Project → **Settings → Domains** → добавь.
2. В DNS-провайдере домена создай CNAME запись на `cname.vercel-dns.com`.

### Защита от посторонних

Поскольку это **внутренний** инструмент, добавь Vercel password protection:
- **Settings → Deployment Protection → Vercel Authentication** или **Password Protection**.

И/или ограничь signup через RLS — только `@cybernet.ai` email-адреса.

---

## 11. Дальше

Когда базовая версия заработает, вот что добавить пошагово:

### 11.1 Google Workspace SSO

Если у Cybernet есть корпоративный Google Workspace, можно сделать вход в один клик.

1. В Supabase → **Authentication → Providers → Google** → включить.
2. В Google Cloud Console создать OAuth 2.0 client.
3. Скопировать Client ID и Secret в Supabase.
4. На фронте кнопка "SSO" вызовет:
   ```js
   await supabaseClient.auth.signInWithOAuth({
     provider: 'google',
     options: { redirectTo: window.location.origin },
   });
   ```

В Google Cloud можно ограничить вход только пользователям из домена `cybernet.ai` — тогда никто посторонний физически не сможет войти.

### 11.2 Webhook для автоматического начисления CC

Например, "+20 CC за каждый PR на GitHub".

1. Создай **Edge Function** в Supabase: **Edge Functions → Create function → `github-webhook`**.
2. Код функции:
   ```ts
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
   const supabase = createClient(
     Deno.env.get('SUPABASE_URL')!,
     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // <-- service role, не anon!
   );

   Deno.serve(async (req) => {
     const event = await req.json();
     // Слушаем только pull_request.merged
     if (event.action !== 'closed' || !event.pull_request?.merged) {
       return new Response('skipped');
     }

     const githubLogin = event.pull_request.user.login;
     // Найти юзера по email или metadata, начислить CC
     // ... твоя логика ...

     return new Response('ok');
   });
   ```
3. В GitHub репозитории Cybernet → **Settings → Webhooks** → добавить URL твоей Edge Function.

### 11.3 Админ-панель

Самый простой вариант — отдельная страница `/admin` с проверкой `role === 'admin'` на профиле. Для ручных начислений CC, изменения товаров, обработки заказов.

### 11.4 Realtime лидерборд

Supabase из коробки умеет realtime:
```js
supabaseClient
  .channel('leaderboard-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' },
    () => fetchLeaderboard().then(renderLeaderboard))
  .subscribe();
```

Когда у кого-то в команде меняется баланс — лидерборд обновляется на твоём экране без рефреша.

---

## 12. Безопасность

Перед тем как пускать команду, проверь:

- [ ] **RLS включён на всех таблицах** (Table Editor → каждая таблица → должен быть значок "RLS enabled")
- [ ] **Anon key в коде, service_role key — НЕТ нигде в репозитории**. Service role используется только в Edge Functions.
- [ ] **Баланс нельзя поменять с клиента**. Все изменения через checkout_cart() и админские RPC. Проверь: в Network tab DevTools при checkout не должно быть прямого UPDATE на wallets.
- [ ] **Idempotency key используется** при checkout (проверь — попробуй кликнуть "Обменять" 5 раз подряд, должен создаться один заказ).
- [ ] **Регистрация ограничена корп-доменом** — `@cybernet.ai` only.
- [ ] **Бэкапы БД** — Supabase делает их автоматически, но проверь в **Database → Backups** что они есть.
- [ ] **2FA на твоём Supabase аккаунте** включён (**Account → Security**).
- [ ] **Vercel password protection** или SSO на деплое — внешний мир не должен видеть страницу логина.

---

## Что делать если застрял

1. **Ошибка в SQL** — копируй текст ошибки и пиши Claude, я разберу.
2. **На фронте ничего не грузится** — открой DevTools (F12), вкладка Console. Скриньте ошибки → Claude.
3. **Транзакция не списывает CC** — проверь что RLS-политики правильные, и что checkout_cart() вызывается через `.rpc()`, а не через `.from('orders').insert()`.
4. **Не могу залогиниться** — в Supabase **Authentication → Users** проверь что юзер создался. Если нет — проблема со стороны signup (email подтверждение?).

---

## Бонус: что я могу для тебя сделать

Когда дойдёшь до конкретного шага и упрёшься — напиши мне:
- **"Помоги адаптировать `shop.js` под Supabase"** → перепишу под живые данные.
- **"Сделай админ-страницу для начисления CC"** → отдельный HTML + JS.
- **"Настрой webhook от GitHub"** → пошагово с кодом.
- **"Добавь email-уведомления о доставке заказа"** → через Resend + Edge Function.

Если идёшь по гайду и что-то не сходится — это нормально. Скрин ошибки + вопрос — и поедем дальше.

Удачи 🚀

---

*BACKEND.md · Cybernet Vault · версия 1.0*
