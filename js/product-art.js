// ============================================================
// CYBERNET VAULT // Product SVG art
// Стилизованные иллюстрации товаров. Цвет акцента —
// индиго/вайолет, чтобы соответствовать палитре сайта.
// ============================================================

// Подбираем цвет обводки по светлоте основы — чтобы тёмные товары
// были видны на тёмном фоне
function strokeFor(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return 'rgba(0,0,0,0.3)';
  const [r, g, b] = m.map(x => parseInt(x, 16));
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma < 60 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.3)';
}

const ART_BG = '#1F1F26';

function svgTee(color, accent = '#818CF8') {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${ART_BG}"/>
    <g transform="translate(200,210)">
      <path d="M-130,-90 L-90,-130 L-50,-105 Q-25,-90 0,-90 Q25,-90 50,-105 L90,-130 L130,-90 L100,-50 L80,-60 L80,140 L-80,140 L-80,-60 L-100,-50 Z"
            fill="${color}" stroke="${strokeFor(color)}" stroke-width="1.5"/>
      <path d="M-50,-105 Q-25,-70 0,-70 Q25,-70 50,-105" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2"/>
      <text x="0" y="35" text-anchor="middle" fill="${accent}" font-family="JetBrains Mono, monospace" font-weight="700" font-size="22" letter-spacing="2">CYBERNET</text>
      <circle cx="0" cy="65" r="3" fill="${accent}"/>
      <line x1="-20" y1="65" x2="-7" y2="65" stroke="${accent}" stroke-width="2"/>
      <line x1="7" y1="65" x2="20" y2="65" stroke="${accent}" stroke-width="2"/>
    </g>
  </svg>`;
}

function svgHoodie(color, accent = '#818CF8') {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${ART_BG}"/>
    <g transform="translate(200,200)">
      <path d="M-140,-80 L-100,-130 Q-70,-110 -40,-100 Q-30,-70 -30,-50 L30,-50 Q30,-70 40,-100 Q70,-110 100,-130 L140,-80 L110,-30 L90,-40 L90,150 L-90,150 L-90,-40 L-110,-30 Z"
            fill="${color}" stroke="${strokeFor(color)}" stroke-width="1.5"/>
      <path d="M-40,-100 Q-30,-50 0,-30 Q30,-50 40,-100 Q30,-95 0,-95 Q-30,-95 -40,-100 Z" fill="rgba(0,0,0,0.25)"/>
      <line x1="0" y1="-20" x2="0" y2="80" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
      <rect x="-50" y="40" width="100" height="40" rx="6" fill="rgba(0,0,0,0.18)"/>
      <text x="0" y="0" text-anchor="middle" fill="${accent}" font-family="Unbounded, sans-serif" font-weight="800" font-size="14" letter-spacing="1.5">CYBERNET</text>
      <text x="0" y="18" text-anchor="middle" fill="${accent}" font-family="JetBrains Mono, monospace" font-weight="500" font-size="9" letter-spacing="3" opacity="0.7">// AI</text>
    </g>
  </svg>`;
}

function svgCap(color, accent = '#818CF8') {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${ART_BG}"/>
    <g transform="translate(200,220)">
      <path d="M-100,-30 Q-100,-100 0,-100 Q100,-100 100,-30 L100,10 L-100,10 Z" fill="${color}" stroke="${strokeFor(color)}" stroke-width="1.5"/>
      <path d="M-100,10 L160,10 Q160,30 130,40 L-100,40 Z" fill="${color}" stroke="${strokeFor(color)}" stroke-width="1.5"/>
      <path d="M-100,-30 Q-100,-100 0,-100 Q100,-100 100,-30" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="1"/>
      <line x1="0" y1="-100" x2="0" y2="-30" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
      <circle cx="0" cy="-95" r="4" fill="${color}" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>
      <text x="0" y="-50" text-anchor="middle" fill="${accent}" font-family="JetBrains Mono, monospace" font-weight="700" font-size="14" letter-spacing="2">C/N</text>
    </g>
  </svg>`;
}

function svgTumbler(color, accent = '#818CF8') {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${ART_BG}"/>
    <g transform="translate(200,200)">
      <path d="M-50,-150 L50,-150 L60,-130 L60,140 Q60,160 0,160 Q-60,160 -60,140 L-60,-130 Z" fill="${color}" stroke="${strokeFor(color)}" stroke-width="1.5"/>
      <ellipse cx="0" cy="-130" rx="60" ry="10" fill="rgba(255,255,255,0.05)" stroke="${strokeFor(color)}" stroke-width="1.5"/>
      <rect x="-50" y="-145" width="100" height="8" rx="4" fill="rgba(0,0,0,0.4)"/>
      <text x="0" y="20" text-anchor="middle" fill="${accent}" font-family="Unbounded, sans-serif" font-weight="800" font-size="22" letter-spacing="1">CN</text>
      <text x="0" y="50" text-anchor="middle" fill="${accent}" font-family="JetBrains Mono, monospace" font-weight="500" font-size="9" letter-spacing="3" opacity="0.7">// 2026</text>
      <line x1="-30" y1="80" x2="30" y2="80" stroke="${accent}" stroke-width="1" opacity="0.5"/>
    </g>
  </svg>`;
}

function svgSweater(color, accent = '#818CF8') {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${ART_BG}"/>
    <g transform="translate(200,210)">
      <path d="M-140,-90 L-90,-130 L-40,-100 L-30,-80 L30,-80 L40,-100 L90,-130 L140,-90 L110,-50 L90,-60 L90,150 L-90,150 L-90,-60 L-110,-50 Z" fill="${color}" stroke="${strokeFor(color)}" stroke-width="1.5"/>
      <rect x="-90" y="125" width="180" height="25" fill="rgba(0,0,0,0.25)"/>
      <path d="M-110,-30 L-90,-50 M110,-30 L90,-50" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
      <g opacity="0.85">
        <line x1="-60" y1="-30" x2="-60" y2="100" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <line x1="-30" y1="-30" x2="-30" y2="100" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <line x1="0" y1="-30" x2="0" y2="100" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <line x1="30" y1="-30" x2="30" y2="100" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <line x1="60" y1="-30" x2="60" y2="100" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
      </g>
      <text x="0" y="20" text-anchor="middle" fill="${accent}" font-family="Unbounded, sans-serif" font-weight="800" font-size="13" letter-spacing="2">CYBERNET</text>
    </g>
  </svg>`;
}

function svgTote(color, accent = '#818CF8') {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${ART_BG}"/>
    <g transform="translate(200,200)">
      <path d="M-60,-120 Q-60,-150 -40,-150 Q-20,-150 -20,-120 M60,-120 Q60,-150 40,-150 Q20,-150 20,-120" fill="none" stroke="${color}" stroke-width="6"/>
      <path d="M-110,-110 L110,-110 L130,140 L-130,140 Z" fill="${color}" stroke="${strokeFor(color)}" stroke-width="1.5"/>
      <text x="0" y="0" text-anchor="middle" fill="${accent}" font-family="Unbounded, sans-serif" font-weight="900" font-size="28" letter-spacing="1">CN/</text>
      <text x="0" y="30" text-anchor="middle" fill="${accent}" font-family="JetBrains Mono, monospace" font-weight="500" font-size="10" letter-spacing="3" opacity="0.8">CYBERNET // AI</text>
    </g>
  </svg>`;
}

function svgSticker(color, accent = '#818CF8') {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="${ART_BG}"/>
    <g transform="translate(200,200)">
      <path d="M-110,-60 L60,-110 L130,40 L40,130 L-90,90 Z" fill="${color}" stroke="${strokeFor(color)}" stroke-width="2"/>
      <path d="M-110,-60 L60,-110 L130,40 L40,130 L-90,90 Z" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="3 3" transform="scale(0.92)"/>
      <text x="0" y="-10" text-anchor="middle" fill="${accent}" font-family="Unbounded, sans-serif" font-weight="900" font-size="34" letter-spacing="1">C/N</text>
      <text x="0" y="22" text-anchor="middle" fill="${accent}" font-family="JetBrains Mono, monospace" font-weight="700" font-size="11" letter-spacing="3">CYBERNET AI</text>
      <line x1="-50" y1="40" x2="50" y2="40" stroke="${accent}" stroke-width="1" opacity="0.6"/>
    </g>
  </svg>`;
}

const productRenderers = {
  tshirt: svgTee,
  hoodie: svgHoodie,
  cap: svgCap,
  tumbler: svgTumbler,
  sweater: svgSweater,
  tote: svgTote,
  sticker: svgSticker,
};
