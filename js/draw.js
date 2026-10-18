'use strict';
/* Colora la magia: pennelli, brillantini, secchiello, timbri e disegni da colorare */
const PAINT_COLORS = ['#ff4d6d', '#ff922b', '#ffd43b', '#51cf66', '#22b8cf', '#4dabf7', '#845ef7', '#f783ac', '#8d5b3a', '#212529', '#ffffff', 'rainbow'];
const STAMPS = ['⭐', '💖', '🦋', '🌸', '🌈', '🍭', '🐱', '🦄', '👑', '🍓', '☁️', '🐠'];
const PAGES = {
  bianco: '',
  cuore: `<path d="M200 270 C60 180 40 90 110 60 C160 40 190 80 200 100 C210 80 240 40 290 60 C360 90 340 180 200 270 Z"/>
    <path d="M60 60 C45 50 48 35 60 42 C72 35 75 50 60 60 Z"/><path d="M345 230 C330 220 333 205 345 212 C357 205 360 220 345 230 Z"/>`,
  stella: `<polygon points="200,30 232,115 322,118 252,172 276,258 200,208 124,258 148,172 78,118 168,115"/>
    <circle cx="200" cy="150" r="32"/><path d="M60 250 L66 266 L82 268 L70 278 L74 294 L60 285 L46 294 L50 278 L38 268 L54 266 Z"/>`,
  fiore: `<circle cx="200" cy="70" r="38"/><circle cx="262" cy="108" r="38"/><circle cx="252" cy="176" r="38"/>
    <circle cx="148" cy="176" r="38"/><circle cx="138" cy="108" r="38"/><circle cx="200" cy="130" r="34"/>
    <path d="M200 214 L200 295"/><path d="M200 262 C170 230 130 240 120 250 C150 270 180 270 200 262 Z"/><path d="M200 270 C230 238 270 248 280 258 C250 278 220 278 200 270 Z"/>`,
  farfalla: `<ellipse cx="200" cy="155" rx="13" ry="78"/><circle cx="200" cy="70" r="18"/>
    <path d="M194 55 C185 30 170 20 160 22 M206 55 C215 30 230 20 240 22"/>
    <path d="M188 110 C150 40 60 40 60 100 C60 150 130 160 188 150 Z"/><path d="M212 110 C250 40 340 40 340 100 C340 150 270 160 212 150 Z"/>
    <path d="M188 165 C130 165 80 190 100 240 C120 280 170 250 190 200 Z"/><path d="M212 165 C270 165 320 190 300 240 C280 280 230 250 210 200 Z"/>
    <circle cx="110" cy="100" r="18"/><circle cx="290" cy="100" r="18"/>`,
  casa: `<rect x="100" y="140" width="200" height="140"/><polygon points="85,145 200,45 315,145"/><rect x="175" y="200" width="50" height="80"/>
    <rect x="120" y="165" width="40" height="40"/><rect x="240" y="165" width="40" height="40"/><circle cx="345" cy="50" r="30"/>
    <path d="M10 285 L390 285"/><rect x="250" y="60" width="25" height="45"/>`,
  pesce: `<path d="M80 150 C130 70 260 70 300 150 C260 230 130 230 80 150 Z"/><path d="M300 150 L370 95 L360 150 L370 205 Z"/>
    <circle cx="130" cy="135" r="13"/><path d="M180 95 C200 130 200 170 180 205"/><path d="M220 100 C240 130 240 170 220 200"/>
    <path d="M170 80 C190 50 230 50 250 85"/><circle cx="60" cy="80" r="12"/><circle cx="40" cy="45" r="8"/>`,
  gelato: `<polygon points="140,160 260,160 200,295"/><path d="M160 190 L230 190 M170 220 L222 220 M180 250 L212 250"/>
    <circle cx="160" cy="135" r="42"/><circle cx="240" cy="135" r="42"/><circle cx="200" cy="85" r="45"/><circle cx="215" cy="35" r="12"/>`
};
const PAGE_ICON = { bianco: '📄', cuore: '💖', stella: '⭐', fiore: '🌸', farfalla: '🦋', casa: '🏠', pesce: '🐟', gelato: '🍦' };

function pageSVG(key, w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
    <g fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${PAGES[key] || ''}</g></svg>`;
}
function hexRgb(h) { const c = parseInt(h.slice(1), 16); return [c >> 16, c >> 8 & 255, c & 255]; }
function hslHex(hh) { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = `hsl(${hh},90%,60%)`; return c.fillStyle; }

Games.draw = {
  enter(stage) {
    this.stage = stage;
    this.tool = 'brush'; this.color = PAINT_COLORS[0]; this.size = 1; this.stamp = 0; this.hue = 0; this.undo = []; this.page = 'bianco';
    stage.innerHTML = `<div class="draw">
      <div class="draw-tools">
        <button class="tl" data-t="brush">🖌️</button><button class="tl" data-t="glitter">✨</button>
        <button class="tl" data-t="fill">🪣</button><button class="tl" data-t="stamp">${STAMPS[0]}</button>
        <button class="tl" data-t="eraser">🧽</button>
        <span class="sep"></span>
        <button class="tl size" data-a="size"><i></i></button>
        <button class="tl" data-a="pages">🖼️</button><button class="tl" data-a="undo">↩️</button>
        <button class="tl" data-a="clear">🗑️</button><button class="tl cam" data-a="save">📸</button>
      </div>
      <div class="draw-canvas"><canvas class="paint"></canvas><canvas class="over"></canvas></div>
      <div class="draw-colors">${PAINT_COLORS.map(c => `<button class="col ${c === 'rainbow' ? 'rb' : ''}" data-c="${c}" style="${c === 'rainbow' ? '' : 'background:' + c}"></button>`).join('')}</div>
    </div>`;
    this.cv = $('.paint', stage); this.ctx = this.cv.getContext('2d', { willReadFrequently: true });
    this.ov = $('.over', stage); this.octx = this.ov.getContext('2d', { willReadFrequently: true });
    const dc = $('.draw-canvas', stage), r = { width: dc.clientWidth, height: dc.clientHeight };
    this.cv.width = this.ov.width = Math.round(r.width); this.cv.height = this.ov.height = Math.round(r.height);
    this.clear(); this.setPage('bianco');
    $$('.tl[data-t]', stage).forEach(b => b.onclick = () => {
      Sound.click();
      if (b.dataset.t === 'stamp' && this.tool === 'stamp') { this.stamp = (this.stamp + 1) % STAMPS.length; b.textContent = STAMPS[this.stamp]; }
      this.tool = b.dataset.t; this.syncUI();
      Voice.say({ brush: 'Pennello', glitter: 'Brillantini magici!', fill: 'Secchiello: tocca un pezzo del disegno per colorarlo!', stamp: 'Timbrini! Tocca ancora per cambiarli', eraser: 'Gomma' }[this.tool]);
    });
    $$('.col', stage).forEach(b => b.onclick = () => { Sound.click(); this.color = b.dataset.c; if (this.tool === 'eraser' || this.tool === 'stamp') this.tool = 'brush'; this.syncUI(); });
    $('[data-a=size]', stage).onclick = () => { Sound.click(); this.size = (this.size + 1) % 3; this.syncUI(); };
    $('[data-a=undo]', stage).onclick = () => { Sound.softPop(); const d = this.undo.pop(); if (d) this.ctx.putImageData(d, 0, 0); };
    $('[data-a=clear]', stage).onclick = () => { Sound.whoosh(); this.pushUndo(); this.clear(); };
    $('[data-a=pages]', stage).onclick = () => this.choosePage();
    $('[data-a=save]', stage).onclick = () => this.save();
    this.cv.addEventListener('pointerdown', e => this.down(e));
    this.cv.addEventListener('pointermove', e => this.move(e));
    this.cv.addEventListener('pointerup', () => this.drawing = false);
    this.cv.addEventListener('pointercancel', () => this.drawing = false);
    this.syncUI();
    Voice.say('Disegna quello che vuoi! Tocca la cornice per scegliere un disegno da colorare.');
  },
  exit() { this.stage.innerHTML = ''; },
  syncUI() {
    $$('.tl[data-t]', this.stage).forEach(b => b.classList.toggle('on', b.dataset.t === this.tool));
    $$('.col', this.stage).forEach(b => b.classList.toggle('on', b.dataset.c === this.color && this.tool !== 'eraser'));
    const i = $('[data-a=size] i', this.stage); const s = [10, 18, 28][this.size]; i.style.width = i.style.height = s + 'px';
  },
  clear() { this.ctx.fillStyle = '#fff'; this.ctx.fillRect(0, 0, this.cv.width, this.cv.height); },
  async setPage(key) {
    this.page = key;
    this.octx.clearRect(0, 0, this.ov.width, this.ov.height);
    if (!PAGES[key]) return;
    const img = await loadImg(svgUrl(pageSVG(key, this.ov.width, this.ov.height)));
    const pad = 12;
    this.octx.drawImage(img, pad, pad, this.ov.width - pad * 2, this.ov.height - pad * 2);
  },
  choosePage() {
    Sound.click();
    Modal.show(`<div class="modal-title">Scegli un disegno</div><div class="page-grid">${Object.keys(PAGES).map(k => `<button class="page-btn" data-p="${k}">${PAGE_ICON[k]}</button>`).join('')}</div>`, 'pages');
    Voice.say('Che cosa vuoi colorare?');
    $$('#modal .page-btn').forEach(b => b.onclick = () => { Sound.magic(); Modal.hide(); this.pushUndo(); this.clear(); this.setPage(b.dataset.p); if (b.dataset.p !== 'bianco') Voice.say('Usa il secchiello per colorare in un attimo!'); });
  },
  pushUndo() { this.undo.push(this.ctx.getImageData(0, 0, this.cv.width, this.cv.height)); if (this.undo.length > 12) this.undo.shift(); },
  pos(e) { const r = this.cv.getBoundingClientRect(); return [(e.clientX - r.left) * this.cv.width / r.width, (e.clientY - r.top) * this.cv.height / r.height]; },
  curColor() {
    if (this.tool === 'eraser') return '#ffffff';
    if (this.color === 'rainbow') return `hsl(${this.hue % 360},90%,60%)`;
    return this.color;
  },
  down(e) {
    this.cv.setPointerCapture(e.pointerId);
    const [x, y] = this.pos(e);
    this.pushUndo();
    if (this.tool === 'fill') {
      const col = this.color === 'rainbow' ? hslHex(randi(0, 360)) : this.color;
      this.flood(x, y, col); Sound.magic(); FX.sparkle(e.clientX, e.clientY, 10); return;
    }
    if (this.tool === 'stamp') {
      const s = [50, 80, 120][this.size];
      this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(rand(-0.3, 0.3));
      this.ctx.font = s + 'px serif'; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle';
      this.ctx.fillText(STAMPS[this.stamp], 0, 0); this.ctx.restore();
      Sound.pop(); FX.sparkle(e.clientX, e.clientY, 8); return;
    }
    this.drawing = true; this.lx = x; this.ly = y;
    this.dot(x, y);
  },
  move(e) {
    if (!this.drawing) return;
    const [x, y] = this.pos(e);
    const d = Math.hypot(x - this.lx, y - this.ly);
    if (d < 1) return;
    this.hue += d * 0.6;
    const c = this.ctx, w = [8, 16, 30][this.size] * (this.tool === 'eraser' ? 1.8 : 1);
    if (this.tool === 'glitter') {
      for (let i = 0; i < Math.max(2, d / 4); i++) {
        const t = Math.random(), gx = this.lx + (x - this.lx) * t + rand(-w, w), gy = this.ly + (y - this.ly) * t + rand(-w, w);
        c.fillStyle = Math.random() < 0.3 ? '#ffd43b' : this.color === 'rainbow' ? `hsl(${rand(0, 360)},90%,65%)` : shade(this.color === '#ffffff' ? '#ffe8f5' : this.color, randi(-30, 60));
        if (Math.random() < 0.18) { drawStar(c, gx, gy, rand(4, 9), 4, 0.35); c.fill(); }
        else { c.beginPath(); c.arc(gx, gy, rand(1.5, 3.5), 0, 7); c.fill(); }
      }
      if (Math.random() < 0.15) Sound.bell(NF(pick(['C6', 'E6', 'G6', 'A6', 'C7'])), 0.3, 0.05);
    } else {
      c.strokeStyle = this.curColor(); c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(this.lx, this.ly); c.lineTo(x, y); c.stroke();
    }
    this.lx = x; this.ly = y;
  },
  dot(x, y) {
    if (this.tool === 'glitter') return;
    const c = this.ctx; c.fillStyle = this.curColor();
    c.beginPath(); c.arc(x, y, [8, 16, 30][this.size] * (this.tool === 'eraser' ? 1.8 : 1) / 2, 0, 7); c.fill();
  },
  flood(fx, fy, hex) {
    const w = this.cv.width, h = this.cv.height, x0 = fx | 0, y0 = fy | 0;
    if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return;
    const img = this.ctx.getImageData(0, 0, w, h), d = img.data;
    const ov = this.octx.getImageData(0, 0, w, h).data;
    const [r, g, b] = hexRgb(hex);
    const i0 = (y0 * w + x0) * 4;
    if (ov[i0 + 3] > 90) return;
    const sr = d[i0], sg = d[i0 + 1], sb = d[i0 + 2];
    if (Math.abs(sr - r) + Math.abs(sg - g) + Math.abs(sb - b) < 8) return;
    const tol = 70, seen = new Uint8Array(w * h);
    const ok = p => { const i = p * 4; return !seen[p] && ov[i + 3] <= 90 && Math.abs(d[i] - sr) + Math.abs(d[i + 1] - sg) + Math.abs(d[i + 2] - sb) <= tol; };
    const stack = [x0, y0];
    while (stack.length) {
      const y = stack.pop(), x = stack.pop();
      const row = y * w;
      if (!ok(row + x)) continue;
      let xl = x; while (xl > 0 && ok(row + xl - 1)) xl--;
      let xr = x; while (xr < w - 1 && ok(row + xr + 1)) xr++;
      let up = false, dn = false;
      for (let xi = xl; xi <= xr; xi++) {
        const p = row + xi, i = p * 4;
        seen[p] = 1; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
        if (y > 0) { const m = ok(p - w); if (m && !up) { stack.push(xi, y - 1); up = true; } else if (!m) up = false; }
        if (y < h - 1) { const m = ok(p + w); if (m && !dn) { stack.push(xi, y + 1); dn = true; } else if (!m) dn = false; }
      }
    }
    this.ctx.putImageData(img, 0, 0);
  },
  save() {
    Sound.shutter();
    const W = 500, H = Math.round(500 * this.cv.height / this.cv.width);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.drawImage(this.cv, 0, 0, W, H); c.drawImage(this.ov, 0, 0, W, H);
    Store.data.photos.push(cv.toDataURL('image/jpeg', 0.8));
    while (Store.data.photos.length > 16) Store.data.photos.shift();
    Store.save(); addStars(1);
    const [x, y] = centerOf(this.cv); FX.burst(x, y, { n: 30 });
    Voice.say(`Che capolavoro ${nameOr()}! L'ho messo nel tuo album!`);
    if (!this.rewarded) { this.rewarded = true; setTimeout(() => { if (current === 'draw') Reward.give(() => { }); }, 1500); }
  }
};
