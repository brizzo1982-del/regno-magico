'use strict';
/* Vola con Stellina: guida l'unicorna e raccogli le stelline */
const RAINBOW = ['#ff6b9d', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#b197fc'];
function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

Games.fly = {
  enter(stage) {
    this.stage = stage;
    stage.innerHTML = `<canvas class="full"></canvas>
      <div class="hud"><div class="bar"><div class="fill"></div></div><span class="bar-goal">⭐</span></div>`;
    this.cv = $('canvas', stage); this.ctx = this.cv.getContext('2d');
    this.fill = $('.fill', stage);
    this.resize = () => {
      this.W = stage.clientWidth; this.H = stage.clientHeight;
      this.dpr = Math.min(2, devicePixelRatio || 1);
      this.cv.width = this.W * this.dpr; this.cv.height = this.H * this.dpr;
      this.k = clamp(Math.min(this.W, this.H) / 600, 0.6, 1.4);
    };
    this.resize(); addEventListener('resize', this.resize);
    this.img = new Image(); this.img.src = svgUrl(unicornSVG(Store.data.unicorn, { wings: true }));
    this.reset();
    const setT = e => { const r = this.cv.getBoundingClientRect(); this.u.ty = clamp(e.clientY - r.top, 40, this.H - 40); this.u.tx = clamp(e.clientX - r.left, this.W * 0.1, this.W * 0.55); };
    this.cv.addEventListener('pointerdown', e => { this.cv.setPointerCapture(e.pointerId); setT(e); });
    this.cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'mouse') setT(e); });
    Voice.say('Tocca lo schermo e guida Stellina! Prendi tante stelline!');
    this.last = performance.now();
    this.loop = t => { const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.update(dt); this.draw(); this.raf = requestAnimationFrame(this.loop); };
    this.raf = requestAnimationFrame(this.loop);
  },
  exit() { cancelAnimationFrame(this.raf); removeEventListener('resize', this.resize); this.stage.innerHTML = ''; },
  reset() {
    this.goal = 30; this.count = 0; this.items = []; this.trail = []; this.texts = []; this.t = 0; this.spawnT = 1;
    this.done = false; this.magnet = 0; this.combo = 0; this.cloudSaid = 0;
    this.u = { x: this.W * 0.25, y: this.H * 0.5, tx: this.W * 0.25, ty: this.H * 0.5, spin: 0, hit: 0 };
    this.bgClouds = Array.from({ length: 7 }, () => ({ x: rand(0, this.W), y: rand(0.05, 0.6) * this.H, s: rand(0.6, 1.4), v: rand(0.15, 0.4) }));
    this.hillOff = 0; this.fill.style.width = '0%';
  },
  spawn() {
    const r = Math.random();
    let type = 'star';
    if (r < 0.1) type = 'heart'; else if (r < 0.16) type = 'gem'; else if (r < 0.2 && !this.magnet) type = 'rainbow';
    else if (r < 0.32 && this.count >= 3) type = 'cloud';
    const k = this.k;
    this.items.push({
      type, x: this.W + 60, y0: rand(this.H * 0.12, this.H * 0.85), y: 0, ph: rand(0, 6),
      r: (type === 'cloud' ? 42 : type === 'star' ? 26 : 28) * k, rot: 0, sp: type === 'cloud' ? 0.75 : 1
    });
  },
  collect(it) {
    const [ox, oy] = this.offset();
    let n = 1, txt = '+1';
    if (it.type === 'heart') { n = 2; txt = '💖+2'; FX.hearts(ox + it.x, oy + it.y, 5); }
    if (it.type === 'gem') { n = 3; txt = '💎+3'; }
    if (it.type === 'rainbow') { n = 1; this.magnet = 6; txt = '🌈 Magia!'; Sound.magic(); Voice.say('Arcobaleno magico! Le stelline vengono da te!'); }
    this.count = Math.min(this.goal, this.count + n);
    Sound.star(this.combo++);
    FX.sparkle(ox + it.x, oy + it.y, 10);
    this.texts.push({ x: it.x, y: it.y, txt, life: 1 });
    this.fill.style.width = (this.count / this.goal * 100) + '%';
    if (this.count === 10 || this.count === 20) Voice.say(pick(PRAISE) + ' Continua così!' + Babbo.line(0.4));
    if (this.count >= this.goal && !this.done) this.finish();
  },
  hitCloud(it) {
    it.dead = true; this.u.hit = 1; this.combo = 0;
    Sound.boing();
    const lost = Math.min(2, this.count); this.count -= lost;
    this.fill.style.width = (this.count / this.goal * 100) + '%';
    for (let i = 0; i < 10; i++) this.texts.push({ x: it.x + rand(-30, 30), y: it.y + rand(0, 30), txt: '💧', life: rand(0.6, 1), vy: 160 });
    if (this.t - this.cloudSaid > 8) { this.cloudSaid = this.t; Voice.say(pick(['Oh! Una nuvoletta birichina!', 'Ops! Attenta alle nuvole grigie!', 'Brrr, che pioggia!'])); }
  },
  finish() {
    this.done = true;
    Sound.win(); FX.confetti();
    Voice.say(`Fantastico ${nameOr()}! Hai preso tutte le stelline!`);
    setTimeout(() => { if (current === 'fly') Reward.give(() => this.reset()); }, 2200);
  },
  offset() { const r = this.cv.getBoundingClientRect(); return [r.left, r.top]; },
  update(dt) {
    this.t += dt;
    const u = this.u, k = this.k, speed = 230 * k * (this.done ? 1.6 : 1);
    u.x += (u.tx - u.x) * Math.min(1, dt * 4);
    u.y += (u.ty - u.y) * Math.min(1, dt * 5);
    if (u.hit > 0) { u.hit -= dt; u.spin += dt * 14; } else u.spin *= 0.85;
    this.magnet = Math.max(0, this.magnet - dt);
    this.hillOff += speed * dt;
    const size = Math.max(115, 150 * k);
    for (const p of this.trail) p.x -= speed * dt;
    this.trail.push({ x: u.x - size * 0.38, y: u.y + size * 0.08 + Math.sin(this.t * 4) * 4 });
    while (this.trail.length > 46) this.trail.shift();
    for (const c of this.bgClouds) { c.x -= speed * c.v * dt; if (c.x < -150) { c.x = this.W + 150; c.y = rand(0.05, 0.6) * this.H; } }
    if (!this.done) { this.spawnT -= dt; if (this.spawnT <= 0) { this.spawnT = rand(0.4, 0.75); this.spawn(); } }
    const uy = u.y + Math.sin(this.t * 4) * 4;
    for (const it of this.items) {
      it.x -= speed * it.sp * dt; it.rot += dt * 2;
      it.y = it.y0 + Math.sin(this.t * 3 + it.ph) * 14 * k;
      if (this.magnet > 0 && it.type !== 'cloud') {
        const dx = u.x - it.x, dy = uy - it.y, d = Math.hypot(dx, dy);
        if (d < 420 * k) { it.x += dx / d * 520 * k * dt; it.y0 += dy / d * 520 * k * dt; }
      }
      const d = Math.hypot(it.x - u.x, it.y - uy);
      if (d < size * 0.36 + it.r) {
        if (it.type === 'cloud') { if (u.hit <= 0 && !this.done) this.hitCloud(it); }
        else { it.dead = true; this.collect(it); }
      }
    }
    this.items = this.items.filter(it => !it.dead && it.x > -80);
    for (const tx of this.texts) { tx.life -= dt; tx.y -= (tx.vy ? -tx.vy : 60) * dt; }
    this.texts = this.texts.filter(t => t.life > 0);
  },
  draw() {
    const c = this.ctx, W = this.W, H = this.H, k = this.k, p = this.count / this.goal;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, lerpColor('#8fd3ff', '#b197fc', p)); g.addColorStop(1, lerpColor('#ffe3f1', '#ffc078', p));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // sole
    const sx = W * 0.82, sy = H * (0.18 + p * 0.1);
    const sg = c.createRadialGradient(sx, sy, 10, sx, sy, 110 * k);
    sg.addColorStop(0, 'rgba(255,240,150,1)'); sg.addColorStop(0.4, 'rgba(255,220,120,.6)'); sg.addColorStop(1, 'rgba(255,220,120,0)');
    c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, 110 * k, 0, 7); c.fill();
    c.fillStyle = '#fff3a8'; c.beginPath(); c.arc(sx, sy, 40 * k, 0, 7); c.fill();
    // nuvole bianche
    c.fillStyle = 'rgba(255,255,255,.85)';
    for (const cl of this.bgClouds) this.cloudShape(c, cl.x, cl.y, 50 * cl.s * k);
    // colline
    this.hill(c, H * 0.82, 40 * k, 0.004, 0.35, '#b2f2bb');
    this.hill(c, H * 0.9, 30 * k, 0.006, 0.6, '#8ce99a', true);
    // scia arcobaleno
    if (this.trail.length > 2) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      RAINBOW.forEach((col, b) => {
        c.strokeStyle = col; c.lineWidth = 7 * k; c.globalAlpha = 0.9;
        c.beginPath();
        this.trail.forEach((pt, i) => { const y = pt.y + (b - 2.5) * 6.5 * k + Math.sin(i * 0.4 + this.t * 6) * 2; i ? c.lineTo(pt.x, y) : c.moveTo(pt.x, y); });
        c.stroke();
      });
      c.globalAlpha = 1;
    }
    // oggetti
    for (const it of this.items) {
      c.save(); c.translate(it.x, it.y);
      if (it.type === 'star') {
        c.shadowColor = '#fff6a0'; c.shadowBlur = 18;
        c.rotate(Math.sin(it.rot) * 0.3);
        drawStar(c, 0, 0, it.r, 5, 0.5); c.fillStyle = '#ffd43b'; c.fill();
        c.shadowBlur = 0; c.lineWidth = 3; c.strokeStyle = '#f59f00'; c.stroke();
        c.fillStyle = '#7a4b00'; c.beginPath(); c.arc(-6 * k, -2 * k, 2.4 * k, 0, 7); c.arc(6 * k, -2 * k, 2.4 * k, 0, 7); c.fill();
        c.strokeStyle = '#7a4b00'; c.lineWidth = 2; c.beginPath(); c.arc(0, 3 * k, 5 * k, 0.2, Math.PI - 0.2); c.stroke();
      } else if (it.type === 'cloud') {
        c.fillStyle = '#a5b1c2'; this.cloudShape(c, 0, 0, it.r);
        c.fillStyle = '#495057';
        c.beginPath(); c.arc(-12 * k, -2 * k, 3.5 * k, 0, 7); c.arc(12 * k, -2 * k, 3.5 * k, 0, 7); c.fill();
        c.strokeStyle = '#495057'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 12 * k, 7 * k, Math.PI + 0.4, -0.4); c.stroke();
        c.fillStyle = '#74c0fc';
        for (let i = 0; i < 3; i++) { const yy = ((this.t * 90 + i * 20) % 40) * k; c.beginPath(); c.ellipse((i - 1) * 16 * k, it.r * 0.6 + yy, 2.5 * k, 5 * k, 0, 0, 7); c.fill(); }
      } else {
        c.font = (it.r * 1.9) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.rotate(Math.sin(it.rot * 1.5) * 0.2);
        c.fillText(it.type === 'heart' ? '💖' : it.type === 'gem' ? '💎' : '🌈', 0, 0);
      }
      c.restore();
    }
    // unicorna
    const u = this.u, size = Math.max(115, 150 * k), by = u.y + Math.sin(this.t * 4) * 4;
    if (this.magnet > 0) {
      const mg = c.createRadialGradient(u.x, by, size * 0.2, u.x, by, size * 0.8);
      mg.addColorStop(0, 'rgba(255,255,255,.0)'); mg.addColorStop(0.7, `hsla(${(this.t * 200) % 360},90%,70%,.35)`); mg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = mg; c.beginPath(); c.arc(u.x, by, size * 0.8, 0, 7); c.fill();
    }
    c.save(); c.translate(u.x, by);
    c.rotate(clamp((u.ty - u.y) * 0.002, -0.35, 0.35) + Math.sin(u.spin) * 0.4);
    if (u.hit > 0 && Math.floor(u.hit * 12) % 2) c.globalAlpha = 0.5;
    if (this.img.complete) c.drawImage(this.img, -size / 2, -size / 2, size, size);
    c.restore(); c.globalAlpha = 1;
    // testi
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const tx of this.texts) {
      c.globalAlpha = Math.min(1, tx.life * 2);
      c.font = `700 ${26 * k}px Fredoka, sans-serif`; c.fillStyle = '#fff'; c.strokeStyle = '#d6336c'; c.lineWidth = 5;
      c.strokeText(tx.txt, tx.x, tx.y); c.fillText(tx.txt, tx.x, tx.y);
    }
    c.globalAlpha = 1;
    if (this.t < 3.5 && !this.done) {
      c.globalAlpha = Math.min(1, 3.5 - this.t);
      c.font = `${60 * k}px serif`; c.fillText('👆', W * 0.4, H * 0.5 + Math.sin(this.t * 6) * 30);
      c.globalAlpha = 1;
    }
  },
  cloudShape(c, x, y, r) {
    c.beginPath();
    c.arc(x - r * 0.6, y + r * 0.1, r * 0.55, 0, 7); c.arc(x, y - r * 0.2, r * 0.7, 0, 7);
    c.arc(x + r * 0.65, y + r * 0.1, r * 0.5, 0, 7); c.arc(x, y + r * 0.25, r * 0.55, 0, 7);
    c.fill();
  },
  hill(c, base, amp, freq, par, col, flowers) {
    const off = this.hillOff * par, W = this.W, H = this.H;
    c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, base - Math.sin((x + off) * freq) * amp - Math.sin((x + off) * freq * 2.3) * amp * 0.4);
    c.lineTo(W, H); c.closePath(); c.fill();
    if (flowers) {
      const step = 70; const start = -(off % step);
      for (let x = start; x < W + step; x += step) {
        const id = Math.floor((x + off) / step);
        const y = base - Math.sin((x + off) * freq) * amp - Math.sin((x + off) * freq * 2.3) * amp * 0.4 + 14;
        c.fillStyle = ['#ff8cc6', '#ffe066', '#ffffff', '#b197fc'][Math.abs(id) % 4];
        for (let i = 0; i < 5; i++) { const a = i * 1.256; c.beginPath(); c.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, 7); c.fill(); }
        c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill();
      }
    }
  }
};
