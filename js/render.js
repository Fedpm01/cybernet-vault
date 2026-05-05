// ============================================================
// CYBERNET VAULT // Renders for dashboard, leaderboard, profile
// ============================================================

// Хелперы для безопасного доступа к данным (window.* приоритетнее, fallback на data.js)
function getProducts()     { return window.products     || (typeof products !== 'undefined' ? products : []); }
function getActivity()     { return window.activity     || (typeof activity !== 'undefined' ? activity : []); }
function getLeaderboard()  { return window.leaderboard  || (typeof leaderboard !== 'undefined' ? leaderboard : []); }
function getAchievements() { return window.achievements || (typeof achievements !== 'undefined' ? achievements : []); }

function renderAll() {
  renderBalances();
  renderActivity();
  renderMiniBoard();
  renderLeaderboard();
  renderAchievements();
  renderFilters();
  renderShop();
  renderFeatured();
}

function renderBalances() {
  const b = fmt(state.user.balance);
  const pill = $('#balance-pill-num');
  const big  = $('#balance-big');
  const pb   = $('#profile-balance');
  if (pill) pill.textContent = b;
  if (big)  big.textContent  = b;
  if (pb)   pb.textContent   = b;
}

function renderProfileHeader() {
  if (!window.myProfile) return;
  const p = window.myProfile;
  const initials = getInitials(p.name);

  // Аватар на топбаре
  const avatarBtn = $('#avatar-btn');
  if (avatarBtn) avatarBtn.textContent = initials;

  // Имя на дашборде
  const dashName = $('#dash-name');
  if (dashName) dashName.textContent = p.name;

  // Профиль
  const profAvatar = document.querySelector('.profile-avatar');
  if (profAvatar) profAvatar.textContent = initials;

  const profName = document.querySelector('.profile-name');
  if (profName) profName.textContent = p.name;

  const profRole = document.querySelector('.profile-role');
  if (profRole) profRole.textContent = `${p.role || 'employee'} · ${p.team || '—'}`;

  // Профиль meta — заполняем из БД, не хардкод
  const meta = $('#profile-meta');
  if (meta) {
    const joined = p.created_at ? new Date(p.created_at).getFullYear() : new Date().getFullYear();
    meta.innerHTML = `
      <span class="pill">Cybernet с <strong>${joined}</strong></span>
      <span class="pill">Команда · <strong>${p.team || '—'}</strong></span>
    `;
  }

  // Скрываем хедер дашборда "Tier 03 · ARCHITECT" — пока не считаем тиры
  const heroRank = document.querySelector('.hero-rank');
  if (heroRank) heroRank.style.display = 'none';
}

function renderStats() {
  const earned = window.myWallet?.lifetime_earned || 0;
  const spent  = window.myWallet?.lifetime_spent  || 0;
  const rank   = window.myRank   || '—';
  const total  = window.totalUsers || 1;
  const streak = window.myStreak || 0;

  const stats = document.querySelectorAll('.stat-card__value');
  if (stats[0]) stats[0].textContent = fmt(earned);
  if (stats[1]) stats[1].textContent = fmt(spent);
  if (stats[2]) stats[2].innerHTML = `#${rank} <span style="font-size:14px;color:var(--text-muted);font-weight:400">из ${total}</span>`;
  if (stats[3]) stats[3].innerHTML = `${streak} <span style="font-size:14px;color:var(--text-muted);font-weight:400">дней</span>`;

  // Уберём ложные дельты пока
  document.querySelectorAll('.stat-card__delta').forEach(d => d.style.display = 'none');
  
  // Уберём ложный hint про "+320 CC за 7 дней"
  const hint = document.querySelector('.bigbalance__hint');
  if (hint) hint.style.display = 'none';
}

// ---------- Activity ----------
function activityRow(a) {
  const isIn = a.type === 'in';
  const cls  = isIn ? 'activity__icon--in'    : 'activity__icon--out';
  const acls = isIn ? 'activity__amount--in'  : 'activity__amount--out';
  const sign = isIn ? '+' : '';
  const ico  = isIn ? 'trend-up' : 'trend-down';
  return `<li class="activity__item">
    <div class="activity__icon ${cls}">${icon(ico)}</div>
    <div>
      <div class="activity__title">${a.title}</div>
      <div class="activity__time">${a.time}</div>
    </div>
    <div class="activity__amount ${acls} tnum">${sign}${fmt(a.amount)} CC</div>
  </li>`;
}

function renderActivity() {
  const list = $('#activity-list');
  const full = $('#profile-activity');
  const data = getActivity();

  if (data.length === 0) {
    const empty = `<li style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">Пока нет операций</li>`;
    if (list) list.innerHTML = empty;
    if (full) full.innerHTML = empty;
    return;
  }

  if (list) list.innerHTML = data.slice(0, 6).map(activityRow).join('');
  if (full) full.innerHTML = data.map(activityRow).join('');
}

// ---------- Mini leaderboard на dashboard ----------
function renderMiniBoard() {
  const list = $('#mini-board-list');
  if (!list) return;

  const lb = getLeaderboard();
  if (lb.length === 0) {
    list.innerHTML = `<li style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">Пригласи команду 🎯</li>`;
    return;
  }

  list.innerHTML = lb.slice(0, 6).map((u, i) => {
    const rank = i + 1;
    const cls  = `mini-rank--${rank}`;
    return `<li class="mini-row ${u.me ? 'mini-row--me' : ''}">
      <span class="mini-rank ${rank <= 3 ? cls : ''}">${rank}</span>
      <div class="lb-row__avatar" style="width:32px;height:32px;font-size:11px">${u.initials}</div>
      <div>
        <div class="mini-row__name">${u.name}${u.me ? ' <span class="mono dim" style="font-size:10px">// you</span>' : ''}</div>
        <div class="mini-row__role">${u.role || '—'}</div>
      </div>
      <div class="mini-row__coins"><span class="coin">¢</span> ${fmt(u.coins)}</div>
    </li>`;
  }).join('');
}

// ---------- Leaderboard page ----------
function renderLeaderboard() {
  const podium = $('#podium');
  const body   = $('#lb-table-body');
  if (!podium || !body) return;

  const lb = getLeaderboard();

  if (lb.length === 0) {
    podium.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:60px 24px;background:var(--bg-1);border:1px solid var(--line);border-radius:var(--radius-lg)">
      <div style="font-family:var(--font-display);font-size:22px;margin-bottom:8px">Пока пусто</div>
      <div style="font-size:14px">Пригласи команду — пьедестал зажжётся</div>
    </div>`;
    body.innerHTML = '';
    return;
  }

  const top3 = lb.slice(0, 3);
  // Order: 2nd · 1st · 3rd для пьедестала. Если в лидерборде меньше 3 — используем undefined-safe filter
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const ranks = order.map(u => lb.indexOf(u) + 1);

  podium.innerHTML = order.map((u, i) => `
    <div class="podium podium--${ranks[i]}">
      <div class="podium__rank">#${ranks[i]}</div>
      <div class="podium__avatar">${u.initials}</div>
      <div class="podium__name">${u.name}</div>
      <div class="podium__role">${u.role || '—'}</div>
      <div class="podium__coins"><span class="coin">¢</span> ${fmt(u.coins)}</div>
    </div>
  `).join('');

  body.innerHTML = lb.map((u, i) => {
    const rank = i + 1;
    const dnum = parseInt(u.delta, 10) || 0;
    const dcls = dnum > 0 ? '' : (dnum < 0 ? 'lb-row__delta--down' : 'lb-row__delta--same');
    const ico  = dnum > 0 ? 'arrow-up' : dnum < 0 ? 'arrow-down' : 'dash';
    return `<div class="lb-row ${u.me ? 'lb-row--me' : ''}">
      <div class="lb-row__rank">${rank}</div>
      <div class="lb-row__user">
        <div class="lb-row__avatar">${u.initials}</div>
        <div>
          <div class="lb-row__name">${u.name}${u.me ? ' <span class="mono dim" style="font-size:10px">· ты</span>' : ''}</div>
          <div class="lb-row__role">${u.role || '—'}</div>
        </div>
      </div>
      <div class="lb-row__delta ${dcls}" data-hide-mobile>${icon(ico, { size: 11 })} ${u.delta === '0' ? 'без изменений' : Math.abs(dnum) + ' позиции'}</div>
      <div class="lb-row__coins"><span class="coin">¢</span> ${fmt(u.coins)}</div>
    </div>`;
  }).join('');
}

// ---------- Achievements ----------
function renderAchievements() {
  const grid = $('#achievements');
  if (!grid) return;

  const data = getAchievements();
  const unlocked = data.filter(a => a.unlocked).length;
  const counter = $('#achv-count');
  if (counter) counter.textContent = unlocked;

  grid.innerHTML = data.map(a => `
    <div class="achv ${a.unlocked ? 'achv--unlocked' : 'achv--locked'}">
      <div class="achv__icon">${icon(a.unlocked ? a.icon : 'lock', { size: 22 })}</div>
      <div class="achv__name">${a.name}</div>
      <div class="achv__desc">${a.desc}</div>
    </div>
  `).join('');
}

// ---------- Toast ----------
function toast(msg, type = 'in') {
  const wrap = $('#toast-wrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = `toast ${type === 'err' ? 'toast--err' : ''}`;
  el.innerHTML = `
    <div class="toast__icon">${icon(type === 'err' ? 'x' : 'check', { size: 14 })}</div>
    <span>${msg}</span>
  `;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastIn 0.3s var(--ease) reverse';
    setTimeout(() => el.remove(), 280);
  }, 2400);
}