// ============================================================
// CYBERNET VAULT // State + helpers + routing
// ============================================================

// Глобальный state приложения. Когда подключите бэкенд —
// баланс, корзина и лайки будут синхронизироваться с сервером.
const state = {
  user: {
    name: currentUser.name,
    initials: currentUser.initials,
    balance: currentUser.startBalance,
  },
  cart: [],         // [{ _key, id, size, color, qty }]
  liked: new Set(),
  route: 'dashboard',
  filters: { category: 'all', price: 'all', affordable: false, likedOnly: false },
  sort: 'popular',
};

// ---------- Утилиты ----------
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Форматирование чисел в стиле "1 234 567"
const fmt = n => n.toLocaleString('ru-RU').replace(/,/g, ' ');

// ---------- Роутинг ----------
function navigate(route) {
  state.route = route;
  $$('.page').forEach(p => p.classList.toggle('page--active', p.dataset.page === route));
  $$('.topbar__navlink').forEach(l => {
    l.classList.toggle('topbar__navlink--active', l.dataset.route === route);
  });
  $('#mobile-menu')?.classList.remove('mobile-menu--open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bindNav() {
  document.body.addEventListener('click', e => {
    const link = e.target.closest('[data-route]');
    if (!link) return;
    e.preventDefault();
    navigate(link.dataset.route);
  });

  $('#menu-toggle')?.addEventListener('click', () => {
    $('#mobile-menu').classList.toggle('mobile-menu--open');
  });
}
