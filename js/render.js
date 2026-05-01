// ============================================================
// CYBERNET VAULT // Renders for dashboard, leaderboard, profile
// ============================================================

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
  $('#balance-pill-num').textContent = b;
  $('#balance-big').textContent = b;
  const pb = $('#profile-balance');
  if (pb) pb.textContent = b;
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
  if (list) list.innerHTML = activity.slice(0, 6).map(activityRow).join('');
  const full = $('#profile-activity');
  if (full) full.innerHTML = activity.map(activityRow).join('');
}

// ---------- Mini leaderboard на dashboard ----------
function renderMiniBoard() {
  const list = $('#mini-board-list');
  if (!list) return;
  list.innerHTML = leaderboard.slice(0, 6).map((u, i) => {
    const rank = i + 1;
    const cls  = `mini-rank--${rank}`;
    return `<li class="mini-row ${u.me ? 'mini-row--me' : ''}">
      <span class="mini-rank ${rank <= 3 ? cls : ''}">${rank}</span>
      <div class="lb-row__avatar" style="width:32px;height:32px;font-size:11px">${u.initials}</div>
      <div>
        <div class="mini-row__name">${u.name}${u.me ? ' <span class="mono dim" style="font-size:10px">// you</span>' : ''}</div>
        <div class="mini-row__role">${u.role}</div>
      </div>
      <div class="mini-row__coins"><span class="coin">¢</span> ${fmt(u.coins)}</div>
    </li>`;
  }).join('');
}

// ---------- Leaderboard page ----------
function renderLeaderboard() {
  const podium = $('#podium');
  if (!podium) return;
  const top3 = leaderboard.slice(0, 3);
  // Order: 2nd · 1st · 3rd для пьедестала
  const order = [top3[1], top3[0], top3[2]];
  const ranks = [2, 1, 3];
  podium.innerHTML = order.map((u, i) => `
    <div class="podium podium--${ranks[i]}">
      <div class="podium__rank">#${ranks[i]}</div>
      <div class="podium__avatar">${u.initials}</div>
      <div class="podium__name">${u.name}</div>
      <div class="podium__role">${u.role}</div>
      <div class="podium__coins"><span class="coin">¢</span> ${fmt(u.coins)}</div>
    </div>
  `).join('');

  $('#lb-table-body').innerHTML = leaderboard.map((u, i) => {
    const rank = i + 1;
    const dnum = parseInt(u.delta, 10);
    const dcls = dnum > 0 ? '' : (dnum < 0 ? 'lb-row__delta--down' : 'lb-row__delta--same');
    const ico  = dnum > 0 ? 'arrow-up' : dnum < 0 ? 'arrow-down' : 'dash';
    return `<div class="lb-row ${u.me ? 'lb-row--me' : ''}">
      <div class="lb-row__rank">${rank}</div>
      <div class="lb-row__user">
        <div class="lb-row__avatar">${u.initials}</div>
        <div>
          <div class="lb-row__name">${u.name}${u.me ? ' <span class="mono dim" style="font-size:10px">· ты</span>' : ''}</div>
          <div class="lb-row__role">${u.role}</div>
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
  const unlocked = achievements.filter(a => a.unlocked).length;
  $('#achv-count').textContent = unlocked;
  grid.innerHTML = achievements.map(a => `
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
