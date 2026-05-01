// ============================================================
// CYBERNET VAULT // Custom icon set
// Один стиль — 24x24, 1.75 stroke-width, скруглённые концы.
// Используется как <svg class="icon"><use href="#i-NAME"/></svg>
// ============================================================

const ICON_SPRITE = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <!-- ===== UI / Navigation ===== -->
    <symbol id="i-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></symbol>
    <symbol id="i-lock" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></symbol>
    <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></symbol>
    <symbol id="i-arrow-up" viewBox="0 0 24 24"><path d="M12 19V5m-6 6 6-6 6 6"/></symbol>
    <symbol id="i-arrow-down" viewBox="0 0 24 24"><path d="M12 5v14m6-6-6 6-6-6"/></symbol>
    <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path d="M4 12l5 5L20 6"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
    <symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></symbol>
    <symbol id="i-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></symbol>
    <symbol id="i-dash" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>

    <!-- ===== Shop / Cart / Money ===== -->
    <symbol id="i-cart" viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h2l2 12h12l2-8H7"/></symbol>
    <symbol id="i-bag" viewBox="0 0 24 24"><path d="M5 7h14l-1 13H6L5 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></symbol>
    <symbol id="i-coin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 9h6M9 15h6M12 7v10"/></symbol>
    <symbol id="i-trend-up" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></symbol>
    <symbol id="i-trend-down" viewBox="0 0 24 24"><path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/></symbol>

    <!-- ===== Heart / Like ===== -->
    <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3.5C14 6 15.5 5 17.5 5 21 5 23 8.5 21.5 12 19 16.65 12 21 12 21z" fill="currentColor" stroke="none"/></symbol>
    <symbol id="i-heart-line" viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 5.5 3.5C14 6 15.5 5 17.5 5 21 5 23 8.5 21.5 12 19 16.65 12 21 12 21z"/></symbol>

    <!-- ===== Status badges (replaces 🔥 🌟 ✨ 🎯 etc) ===== -->
    <!-- bolt/lightning for HOT/featured -->
    <symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 10-12h-7z" fill="currentColor" stroke="none"/></symbol>
    <symbol id="i-bolt-line" viewBox="0 0 24 24"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></symbol>
    <!-- sparkle for NEW -->
    <symbol id="i-sparkle" viewBox="0 0 24 24"><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" fill="currentColor" stroke="none"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="currentColor" stroke="none"/></symbol>
    <!-- star -->
    <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3l3 6.5 7 1-5 5 1 7-6-3.5-6 3.5 1-7-5-5 7-1z" fill="currentColor" stroke="none"/></symbol>
    <symbol id="i-star-line" viewBox="0 0 24 24"><path d="M12 3l3 6.5 7 1-5 5 1 7-6-3.5-6 3.5 1-7-5-5 7-1z"/></symbol>
    <!-- trophy -->
    <symbol id="i-trophy" viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v3a3 3 0 0 1-3 3M7 5H4v3a3 3 0 0 0 3 3"/></symbol>

    <!-- ===== Achievement icons (custom geometric, no emoji) ===== -->
    <!-- target / first drop -->
    <symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></symbol>
    <!-- flame / streak (geometric, not emoji) -->
    <symbol id="i-flame" viewBox="0 0 24 24"><path d="M12 3c0 4-3 5-3 9a3 3 0 0 0 3 3 3 3 0 0 0 3-3c0-2-1-3-1-5 2 2 4 4 4 7a6 6 0 0 1-12 0c0-5 3-7 6-11z"/></symbol>
    <!-- code/braces / code saint -->
    <symbol id="i-code" viewBox="0 0 24 24"><path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2"/><path d="M10 9l-2 3 2 3M14 9l2 3-2 3"/></symbol>
    <!-- brain / mentor -->
    <symbol id="i-brain" viewBox="0 0 24 24"><path d="M12 4a3 3 0 0 0-3 3v1a3 3 0 0 0-3 3v2a3 3 0 0 0 1 2v1a3 3 0 0 0 3 3h2"/><path d="M12 4a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3v2a3 3 0 0 1-1 2v1a3 3 0 0 1-3 3h-2"/><path d="M12 4v15"/></symbol>
    <!-- diamond / drop hunter -->
    <symbol id="i-diamond" viewBox="0 0 24 24"><path d="M6 8l3-4h6l3 4-6 13z"/><path d="M3 8h18M9 4l3 17M15 4l-3 17"/></symbol>
    <!-- medal / top 5 -->
    <symbol id="i-medal" viewBox="0 0 24 24"><path d="M8 3l2 5M16 3l-2 5"/><circle cx="12" cy="14" r="6"/><path d="M10 12l2 2 3-3"/></symbol>
    <!-- whale / wave -->
    <symbol id="i-wave" viewBox="0 0 24 24"><path d="M3 12c2 0 3-3 6-3s4 3 6 3 3-3 6-3"/><path d="M3 17c2 0 3-3 6-3s4 3 6 3 3-3 6-3"/><path d="M3 7c2 0 3-3 6-3s4 3 6 3 3-3 6-3"/></symbol>
    <!-- year / calendar -->
    <symbol id="i-calendar" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></symbol>

    <!-- ===== Categories (replaces 🧥 👕 🧶 🧢 🥤 💼 🌀) ===== -->
    <symbol id="i-cat-all" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="12" cy="12" r="2"/></symbol>
    <symbol id="i-cat-tshirt" viewBox="0 0 24 24"><path d="M8 4l-4 3 1 3 2-1v11h10V9l2 1 1-3-4-3-2 2a3 3 0 0 1-4 0z"/></symbol>
    <symbol id="i-cat-hoodie" viewBox="0 0 24 24"><path d="M7 4l-3 3 1 3 2-1v11h12V9l2 1 1-3-3-3"/><path d="M9 4c0 3 1 4 3 4s3-1 3-4"/></symbol>
    <symbol id="i-cat-sweater" viewBox="0 0 24 24"><path d="M8 4l-4 3 1 3 2-1v11h10V9l2 1 1-3-4-3"/><path d="M9 9h6M9 13h6"/></symbol>
    <symbol id="i-cat-cap" viewBox="0 0 24 24"><path d="M4 14c0-5 3-8 8-8s8 3 8 8"/><path d="M2 14h20l-2 3H4z"/></symbol>
    <symbol id="i-cat-tumbler" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M7 7h10M9 11v4"/></symbol>
    <symbol id="i-cat-tote" viewBox="0 0 24 24"><path d="M5 9h14l-1 12H6z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></symbol>
    <symbol id="i-cat-sticker" viewBox="0 0 24 24"><path d="M3 12 14 3l7 7-9 11z"/><path d="M14 3v7h7"/></symbol>

    <!-- ===== Misc system icons ===== -->
    <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l8 3v5c0 5-3 9-8 10-5-1-8-5-8-10V6z"/></symbol>
    <symbol id="i-zap" viewBox="0 0 24 24"><path d="M13 3L4 14h7v7l9-11h-7z"/></symbol>
    <symbol id="i-package" viewBox="0 0 24 24"><path d="M3 7l9-4 9 4-9 4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></symbol>
    <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
    <symbol id="i-eye" viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></symbol>
  </defs>
</svg>
`;

// Inject sprite at the very start of <body>
function injectIconSprite() {
  const div = document.createElement('div');
  div.innerHTML = ICON_SPRITE;
  document.body.insertBefore(div.firstElementChild || div, document.body.firstChild);
}

// Helper: returns HTML string for an icon
// Usage: icon('cart', { size: 18, className: 'extra' })
function icon(name, opts = {}) {
  const size = opts.size || 16;
  const cls = ['icon', opts.className].filter(Boolean).join(' ');
  return `<svg class="${cls}" width="${size}" height="${size}"><use href="#i-${name}"/></svg>`;
}
