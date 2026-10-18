'use strict';
/* Stellina, l'unicorna personalizzabile (SVG vettoriale) */
const UNI = {
  body: { bianco: '#ffffff', rosa: '#ffd6ea', lilla: '#e6d6ff', azzurro: '#cfeeff', menta: '#ccf5e3', giallo: '#fff2b3', pesca: '#ffdcc7' },
  mane: {
    arcobaleno: ['#ff6b9d', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#b197fc'],
    rosa: ['#ff5fa2', '#ff8cc6', '#ffb8dc'], viola: ['#845ef7', '#9775fa', '#d0bfff'],
    azzurro: ['#339af0', '#74c0fc', '#a5d8ff'], oro: ['#f59f00', '#fcc419', '#ffe066'],
    menta: ['#20c997', '#63e6be', '#c3fae8'], fragola: ['#ff4d6d', '#ffffff', '#ff8fa3']
  },
  horn: { oro: ['#ffd43b', '#f59f00'], argento: ['#f1f3f5', '#adb5bd'], rosa: ['#ffc9e3', '#f06595'], arcobaleno: null, cristallo: ['#c5f6fa', '#3bc9db'] },
  marks: { nessuno: '🚫', stella: '⭐', cuore: '💖', arcobaleno: '🌈', luna: '🌙', fiore: '🌸' },
  accs: { corona: '👑', fiocco: '🎀', occhiali: '😎', collana: '📿', fiore: '🌺', ali: '🕊️', brillantini: '✨' },
  bgs: {
    castello: { g: ['#ffd6ec', '#c9e7ff'], icon: '🏰', deco: [['🏰', 12, 78, 22], ['☁️', 75, 14, 12], ['☁️', 20, 10, 9], ['✨', 85, 50, 7], ['🌈', 82, 80, 14]] },
    prato: { g: ['#bfe9ff', '#c8f7c5'], icon: '🌷', deco: [['☀️', 85, 12, 14], ['🌷', 10, 88, 9], ['🌼', 25, 92, 7], ['🌳', 88, 78, 18], ['🦋', 15, 30, 8]] },
    spazio: { g: ['#2b1b5a', '#6b3fa0'], icon: '🪐', deco: [['🌙', 82, 14, 14], ['⭐', 12, 18, 7], ['⭐', 30, 8, 5], ['🪐', 14, 80, 15], ['✨', 88, 70, 8], ['⭐', 60, 6, 5]] },
    mare: { g: ['#aee9ff', '#3fa9f5'], icon: '🌊', deco: [['🐚', 12, 90, 9], ['🐠', 85, 30, 10], ['🫧', 15, 30, 7], ['🌊', 80, 88, 15], ['🐬', 82, 62, 13]] },
    dolci: { g: ['#ffe3f3', '#fff1c1'], icon: '🍭', deco: [['🍭', 10, 80, 14], ['🧁', 86, 84, 12], ['🍬', 18, 15, 8], ['🍩', 84, 16, 10], ['🍓', 50, 92, 7]] }
  }
};

function shade(hex, amt) {
  const c = parseInt(hex.slice(1), 16);
  const f = v => clamp(v + amt, 0, 255);
  return '#' + ((1 << 24) | (f(c >> 16) << 16) | (f(c >> 8 & 255) << 8) | f(c & 255)).toString(16).slice(1);
}

let _uid = 0;
function unicornSVG(o, { size, wings = false } = {}) {
  const id = 'u' + (++_uid);
  const L = '#6b4a7a';
  const body = UNI.body[o.body] || '#ffffff', far = shade(body, -26);
  const mane = UNI.mane[o.mane] || UNI.mane.arcobaleno;
  const hornC = UNI.horn[o.horn];
  const acc = new Set(o.acc || []); if (wings) acc.add('ali');
  const sw = `stroke="${L}" stroke-width="3" stroke-linejoin="round"`;
  const blob = (pts) => pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2] + 2.6}" fill="${L}"/>`).join('') +
    pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="${mane[i % mane.length]}"/>`).join('');
  const sparkle = (x, y, r, c = '#ffd43b') => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${c}"/>`;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"${size ? ` width="${size}" height="${size}"` : ''}>`;
  s += `<defs><linearGradient id="${id}h" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#ff6b9d"/><stop offset=".25" stop-color="#ffe066"/><stop offset=".5" stop-color="#69db7c"/>
    <stop offset=".75" stop-color="#4dabf7"/><stop offset="1" stop-color="#b197fc"/></linearGradient>
    <linearGradient id="${id}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffd6f0"/></linearGradient></defs>`;

  if (acc.has('brillantini')) s += sparkle(22, 40, 9) + sparkle(182, 132, 8, '#ff8cc6') + sparkle(38, 182, 6, '#74c0fc') + sparkle(186, 22, 6, '#b197fc');

  // coda
  s += blob([[44, 108, 13], [33, 114, 13], [25, 126, 12], [21, 139, 11], [23, 152, 10], [30, 163, 8]]);
  // zampe (prima del corpo così le attaccature restano nascoste)
  const hoof = mane[0];
  for (const [x, c] of [[72, far], [134, far], [52, body], [116, body]]) {
    s += `<rect x="${x}" y="130" width="15" height="50" rx="7" fill="${c}" ${sw}/>`;
    s += `<rect x="${x}" y="171" width="15" height="11" rx="4" fill="${hoof}" ${sw}/>`;
  }
  // corpo
  s += `<ellipse cx="95" cy="118" rx="56" ry="34" fill="${body}" ${sw}/>`;
  // simbolo sul fianco
  s += markSVG(o.mark, 76, 124, L);
  // criniera dietro al collo
  s += blob([[131, 42, 13], [122, 53, 13], [115, 65, 13], [110, 78, 12], [108, 91, 11], [110, 103, 9]]);
  // ali
  if (acc.has('ali')) {
    s += `<path d="M98 100 C92 62 62 44 36 50 C50 58 55 64 57 70 C43 70 37 79 39 87 C52 85 62 87 70 91 C62 93 60 99 62 104 C76 100 88 102 98 106 Z" fill="url(#${id}w)" ${sw}/>`;
    s += `<path d="M90 96 C80 80 66 70 52 66 M86 100 C76 92 66 90 56 88" stroke="#e8b6d8" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
  // testa e collo
  s += `<ellipse cx="150" cy="60" rx="28" ry="24" fill="${body}" ${sw}/>`;
  s += `<path d="M113 92 Q116 70 134 50 L166 66 Q154 88 148 112 Z" fill="${body}"/>`;
  s += `<path d="M113 92 Q116 70 134 50 M166 66 Q154 88 148 112" fill="none" ${sw} stroke-linecap="round"/>`;
  // orecchio
  s += `<path d="M131 46 L127 20 L148 37 Z" fill="${body}" ${sw}/><path d="M133 40 L131 27 L142 36 Z" fill="#ffb3d1"/>`;
  // muso
  s += `<ellipse cx="176" cy="72" rx="15" ry="12" fill="${shade(body, -8)}" ${sw}/>`;
  s += `<circle cx="185" cy="68" r="1.9" fill="${L}"/>`;
  s += `<path d="M171 79 Q178 84 186 77" stroke="${L}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  // occhio
  s += `<circle cx="156" cy="56" r="7.5" fill="#3b2a4a"/><circle cx="158.8" cy="52.8" r="2.8" fill="#fff"/><circle cx="153.6" cy="59.4" r="1.4" fill="#fff"/>`;
  s += `<path d="M150 50 l-4.5 -4 M154 48.2 l-2 -5 M158.5 48.5 l1.2 -5" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>`;
  s += `<circle cx="155" cy="71" r="5.5" fill="#ff8fb8" opacity=".6"/>`;
  // ciuffo
  s += blob([[139, 37, 10], [129, 41, 9]]);
  // corno
  const hf = hornC ? hornC[0] : `url(#${id}h)`, hs = hornC ? hornC[1] : '#ffffff';
  s += `<path d="M145 38 L160 40 L168 4 Z" fill="${hf}" ${sw}/>`;
  s += `<path d="M152.6 27.8 L162.4 29.2 M158.1 19.3 L164.4 20.2 M163.2 11.5 L166.2 11.9" stroke="${hs}" stroke-width="2.5" stroke-linecap="round"/>`;
  // accessori
  if (acc.has('collana')) {
    const pearls = [[115, 90], [121, 96], [128, 100], [135, 102], [142, 102], [149, 99]];
    s += pearls.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${['#fff', '#ffc9e3', '#d0bfff'][i % 3]}" stroke="${L}" stroke-width="1.5"/>`).join('');
    s += `<path d="M136 106 C130 100 131 95 136 99 C141 95 142 100 136 106 Z" fill="#ff4d8d" stroke="${L}" stroke-width="1.5"/>`;
  }
  if (acc.has('fiocco')) {
    s += `<path d="M44 102 L26 92 L28 113 Z M44 102 L62 92 L60 113 Z" fill="#ff5fa2" ${sw}/><circle cx="44" cy="102" r="5" fill="#ff9ccf" ${sw}/>`;
  }
  if (acc.has('corona')) {
    s += `<path d="M133 41 L136 22 L144 32 L151 17 L158 32 L166 24 L167 43 Q150 36 133 41 Z" fill="#ffd43b" ${sw}/>`;
    s += `<circle cx="151" cy="28" r="3" fill="#ff6b9d"/><circle cx="142" cy="35" r="2.2" fill="#4dabf7"/><circle cx="160" cy="35" r="2.2" fill="#69db7c"/>`;
  }
  if (acc.has('occhiali')) {
    s += `<path d="M156 68 C138 58 143 42 156 50 C169 42 174 58 156 68 Z" fill="rgba(255,105,180,.32)" stroke="#e64980" stroke-width="3.2" stroke-linejoin="round"/>`;
    s += `<path d="M142 52 L128 49" stroke="#e64980" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (acc.has('fiore')) {
    const cx = 122, cy = 34;
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; s += `<circle cx="${cx + Math.cos(a) * 6.5}" cy="${cy + Math.sin(a) * 6.5}" r="5.2" fill="#ff8cc6" stroke="${L}" stroke-width="1.6"/>`; }
    s += `<circle cx="${cx}" cy="${cy}" r="4" fill="#ffe066" stroke="${L}" stroke-width="1.6"/>`;
  }
  s += '</svg>';
  return s;
}

function markSVG(m, x, y, L) {
  const st = `stroke="${L}" stroke-width="2"`;
  switch (m) {
    case 'stella': {
      let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.5 : 11; p += `${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)} `; }
      return `<polygon points="${p}" fill="#ffd43b" ${st} stroke-linejoin="round"/>`;
    }
    case 'cuore': return `<path d="M${x} ${y + 9} C${x - 14} ${y} ${x - 9} ${y - 12} ${x} ${y - 4} C${x + 9} ${y - 12} ${x + 14} ${y} ${x} ${y + 9} Z" fill="#ff4d8d" ${st}/>`;
    case 'arcobaleno': return ['#ff6b9d', '#ffe066', '#4dabf7'].map((c, i) => `<path d="M${x - 13 + i * 4} ${y + 6} A${13 - i * 4} ${13 - i * 4} 0 0 1 ${x + 13 - i * 4} ${y + 6}" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join('');
    case 'luna': return `<path d="M${x + 4} ${y - 11} A11 11 0 1 0 ${x + 8} ${y + 8} A8 8 0 1 1 ${x + 4} ${y - 11} Z" fill="#ffe066" ${st}/>`;
    case 'fiore': {
      let s = ''; for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; s += `<circle cx="${x + Math.cos(a) * 6}" cy="${y + Math.sin(a) * 6}" r="4.8" fill="#b197fc" ${st}/>`; }
      return s + `<circle cx="${x}" cy="${y}" r="3.6" fill="#ffe066" ${st}/>`;
    }
    default: return '';
  }
}

/* Disegna sfondo + decorazioni su un canvas (per le foto) */
function paintBg(c, key, w, h) {
  const b = UNI.bgs[key] || UNI.bgs.castello;
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, b.g[0]); g.addColorStop(1, b.g[1]);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  for (const [e, x, y, s] of b.deco) { c.font = (s / 100 * w) + 'px serif'; c.fillText(e, x / 100 * w, y / 100 * h); }
}
function bgDecoHTML(key) {
  const b = UNI.bgs[key] || UNI.bgs.castello;
  return b.deco.map(([e, x, y, s]) => `<span class="deco" style="left:${x}%;top:${y}%;font-size:${s * 0.9}cqmin">${e}</span>`).join('');
}
function bgCSS(key) { const b = UNI.bgs[key] || UNI.bgs.castello; return `linear-gradient(${b.g[0]}, ${b.g[1]})`; }
