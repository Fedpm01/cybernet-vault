// ============================================================
// CYBERNET VAULT // Entry point
// Все модули загружены в HTML до этого файла,
// здесь только запуск.
// ============================================================

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