// ============================================================
// CYBERNET VAULT // Data layer
// Когда подключите бэкенд — эти массивы заменяются на fetch()
// из API. Структура данных останется такой же.
// ============================================================

// ---------- Текущий пользователь ----------
const currentUser = {
  name: 'Анвар Каримов',
  initials: 'AK',
  role: 'Senior AI Engineer',
  team: 'Engineering',
  joined: '2024',
  tier: 3,
  tierName: 'ARCHITECT',
  streak: 14,
  startBalance: 2480,
  lifetimeEarned: 8920,
  lifetimeSpent: 6440,
  rank: 7,
  totalUsers: 142,
};

// ---------- Каталог ----------
const products = [
  {
    id: 'core-hoodie', name: 'Core Hoodie', category: 'hoodie',
    price: 1800, color: '#1A1A22', accent: '#818CF8',
    desc: 'Флагманский худи Cybernet. Плотный 350gsm хлопок, бойфренд-крой, минималистичный лого спереди и крупный signature-принт на спине. Лимитированная партия — раз в квартал.',
    badge: 'HOT', tags: ['premium', 'classic'], pop: 98, new: 0,
  },
  {
    id: 'matrix-tee', name: 'Matrix Tee', category: 'tshirt',
    price: 480, color: '#1A1A22', accent: '#818CF8',
    desc: 'Чёрная футболка из органического хлопка с monochrome принтом нейросети. Тонкий джерси, oversized fit. Базовый старт коллекции.',
    badge: 'HOT', tags: ['classic'], pop: 95, new: 0,
  },
  {
    id: 'indigo-tee', name: 'Indigo Drop Tee', category: 'tshirt',
    price: 520, color: '#4F46E5', accent: '#FFFFFF',
    desc: 'Сигнатурный индиго Cybernet. Heavyweight cotton, единственный цвет, в который команда влюбилась с первой партии.',
    badge: 'NEW', tags: ['drop'], pop: 88, new: 1,
  },
  {
    id: 'whisper-cap', name: 'Whisper Cap', category: 'cap',
    price: 380, color: '#1A1A22', accent: '#818CF8',
    desc: '6-панельная классика. Регулируемый ремешок, тоновая вышивка на лбу — едва заметная, очень дорогая.',
    badge: null, tags: ['classic'], pop: 76, new: 0,
  },
  {
    id: 'indigo-cap', name: 'Indigo Snap Cap', category: 'cap',
    price: 420, color: '#4F46E5', accent: '#FFFFFF',
    desc: 'Snapback в фирменном индиго с контрастной вышивкой. Дроп ограничен.',
    badge: 'NEW', tags: ['drop'], pop: 72, new: 1,
  },
  {
    id: 'tumbler-onyx', name: 'Onyx Tumbler 500ml', category: 'tumbler',
    price: 680, color: '#22222A', accent: '#818CF8',
    desc: 'Двойная стенка из нержавейки. Держит 12 часов холодным, 6 — горячим. Тихий стелс-логотип на корпусе.',
    badge: null, tags: ['daily'], pop: 84, new: 0,
  },
  {
    id: 'tumbler-cream', name: 'Cream Tumbler 500ml', category: 'tumbler',
    price: 680, color: '#EFE9D8', accent: '#1E1B4B',
    desc: 'Кремовая версия флагманского тамблера. Soft-touch покрытие, лазерная гравировка.',
    badge: null, tags: ['daily'], pop: 79, new: 0,
  },
  {
    id: 'core-sweater', name: 'Core Sweater', category: 'sweater',
    price: 1450, color: '#3A3A44', accent: '#818CF8',
    desc: 'Тяжёлый трикотажный свитер. Плотная вязка, ребристые манжеты. Минимализм и тепло уральской зимы.',
    badge: null, tags: ['premium'], pop: 81, new: 0,
  },
  {
    id: 'cream-sweater', name: 'Cream Heritage Sweater', category: 'sweater',
    price: 1650, color: '#EFE9D8', accent: '#1E1B4B',
    desc: 'Премиум вариант — слегка приглушённый, но фирменный.',
    badge: 'NEW', tags: ['premium', 'drop'], pop: 70, new: 1,
  },
  {
    id: 'tote-onyx', name: 'Cyber Tote', category: 'tote',
    price: 320, color: '#1A1A22', accent: '#818CF8',
    desc: 'Ёмкая шопер-сумка из плотного канваса. Усиленные ручки. Влезает 15" ноутбук, бутылка и обед.',
    badge: null, tags: ['daily'], pop: 65, new: 0,
  },
  {
    id: 'sticker-pack', name: 'Sticker Pack · Vol.2', category: 'sticker',
    price: 120, color: '#4F46E5', accent: '#FFFFFF',
    desc: 'Набор из 8 виниловых стикеров. Ноутбук, бутылка, чемодан — куда угодно.',
    badge: null, tags: ['cheap'], pop: 92, new: 0,
  },
  {
    id: 'violet-hoodie', name: 'Violet Edition Hoodie', category: 'hoodie',
    price: 2100, color: '#A78BFA', accent: '#1E1B4B',
    desc: 'Самая редкая коллаборация. Цвет вайолет, цена соответствующая. 50 штук на всю команду.',
    badge: 'HOT', tags: ['premium', 'drop'], pop: 99, new: 1,
  },
];

// ---------- Активити ----------
const activity = [
  { type: 'in',  title: 'Code review #2401 — Auth refactor', amount: 80,   time: '2 часа назад' },
  { type: 'out', title: 'Cybernet Onyx Tumbler 500ml',       amount: -680, time: 'вчера, 18:42' },
  { type: 'in',  title: 'Sprint MVP shipped — Vault v2',     amount: 250,  time: '2 дня назад' },
  { type: 'in',  title: 'Помощь джунам · 4 сессии',          amount: 60,   time: '3 дня назад' },
  { type: 'out', title: 'Indigo Drop Tee · S',               amount: -520, time: '4 дня назад' },
  { type: 'in',  title: 'Hackathon: 1-е место',              amount: 800,  time: 'неделю назад' },
  { type: 'in',  title: 'Bug bounty — критикал в API',       amount: 200,  time: 'неделю назад' },
  { type: 'out', title: 'Sticker Pack Vol.2',                amount: -120, time: '2 нед. назад' },
  { type: 'in',  title: 'Tech talk: Vector Search 101',      amount: 150,  time: '2 нед. назад' },
  { type: 'out', title: 'Whisper Cap',                       amount: -380, time: '3 нед. назад' },
];

// ---------- Лидерборд ----------
const leaderboard = [
  { name: 'Малика Юсупова',   role: 'AI Research',       coins: 14820, delta: '+2', initials: 'МЮ' },
  { name: 'Бахтияр Рахимов',  role: 'Engineering',       coins: 13400, delta: '0',  initials: 'БР' },
  { name: 'Лейла Усманова',   role: 'Engineering',       coins: 12750, delta: '+1', initials: 'ЛУ' },
  { name: 'Тимур Касымов',    role: 'Product',           coins: 11200, delta: '-2', initials: 'ТК' },
  { name: 'Нодира Эргашева',  role: 'Design',            coins: 10380, delta: '+3', initials: 'НЭ' },
  { name: 'Жасур Каримов',    role: 'AI Research',       coins: 9450,  delta: '0',  initials: 'ЖК' },
  { name: 'Анвар Каримов',    role: 'Engineering',       coins: 8920,  delta: '+3', initials: 'AK', me: true },
  { name: 'Севара Турсунова', role: 'Operations',        coins: 8210,  delta: '-1', initials: 'СТ' },
  { name: 'Рустам Хамидов',   role: 'Engineering',       coins: 7800,  delta: '+1', initials: 'РХ' },
  { name: 'Дилфуза Алиева',   role: 'Sales & Marketing', coins: 7340,  delta: '0',  initials: 'ДА' },
  { name: 'Шохрух Мирзаев',   role: 'Engineering',       coins: 6900,  delta: '-2', initials: 'ШМ' },
  { name: 'Камила Юлдашева',  role: 'Design',            coins: 6420,  delta: '+1', initials: 'КЮ' },
];

// ---------- Достижения ----------
// icon — теперь ссылка на наш кастомный набор, не emoji
const achievements = [
  { name: 'First Drop',    desc: 'Первая покупка',         icon: 'target',    unlocked: true },
  { name: 'Streak Keeper', desc: '7 дней активности',      icon: 'flame',     unlocked: true },
  { name: 'Code Saint',    desc: '100 ревью',              icon: 'code',      unlocked: true },
  { name: 'Hackmaster',    desc: 'Победа в хакатоне',      icon: 'trophy',    unlocked: true },
  { name: 'Mentor',        desc: '10 сессий с джунами',    icon: 'brain',     unlocked: true },
  { name: 'Drop Hunter',   desc: 'Купил 5 limited',        icon: 'diamond',   unlocked: false },
  { name: 'Top 5',         desc: 'Войти в топ-5',          icon: 'medal',     unlocked: false },
  { name: 'Whale',         desc: 'Накопить 20 000 CC',     icon: 'wave',      unlocked: false },
  { name: 'Year One',      desc: '1 год в Cybernet',       icon: 'calendar',  unlocked: false },
];

// ---------- Категории каталога ----------
// icon — наш кастомный set; никаких эмодзи
const categoryDefs = [
  { id: 'all',     label: 'Все категории', icon: 'cat-all' },
  { id: 'hoodie',  label: 'Худи',          icon: 'cat-hoodie' },
  { id: 'tshirt',  label: 'Футболки',      icon: 'cat-tshirt' },
  { id: 'sweater', label: 'Свитеры',       icon: 'cat-sweater' },
  { id: 'cap',     label: 'Кепки',         icon: 'cat-cap' },
  { id: 'tumbler', label: 'Тамблеры',      icon: 'cat-tumbler' },
  { id: 'tote',    label: 'Сумки',         icon: 'cat-tote' },
  { id: 'sticker', label: 'Стикеры',       icon: 'cat-sticker' },
];

// ---------- Опции товара ----------
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const colorOptions = [
  { id: 'onyx',   name: 'Onyx',   hex: '#1A1A22' },
  { id: 'indigo', name: 'Indigo', hex: '#4F46E5' },
  { id: 'cream',  name: 'Cream',  hex: '#EFE9D8' },
  { id: 'violet', name: 'Violet', hex: '#A78BFA' },
];
