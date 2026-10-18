'use strict';
/* Bolle magiche: scoppia le bolle del colore richiesto */
const BCOL = [
  { n: 'rosa', c: '#ff6bb5' }, { n: 'azzurre', c: '#4dabf7' }, { n: 'verdi', c: '#51cf66' },
  { n: 'gialle', c: '#fcc419' }, { n: 'viola', c: '#9775fa' }, { n: 'arancioni', c: '#ff922b' }
];
const BEMO = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐸', '🐥', '🐟', '🍓', '🍒', '🌸', '⭐', '🐞', '🦋', '🐨', '🐷'];

Games.bubbles = {
  enter(stage) {
    this.stage = stage;
    stage.innerHTML = `<canvas class="full"></canvas>
      <div class="bub-banner"><span class="bub-dot"></span><span class="bub-label"></span><span class="bub-prog"></span></div>`;
    this.cv = $('canvas', stage); this.ctx = this.cv.getContext('2d');
    this.resize = () => {
      this.W = stage.clientWidth; this.H = stage.clientHeight;
      this.dpr = Math.min(2, devicePixelRatio || 1);
      this.cv.width = this.W * this.dpr; this.cv.height = this.H * this.dpr;
      this.k = clamp(Math.min(this.W, this.H) / 600, 0.65, 1.4);
    };
    this.resize(); addEventListener('resize', this.resize);
    this.cv.addEventListener('pointerdown', e => this.tap(e));
    this.reset();
    this.last = performance.now();
    this.loop = t => { const dt = Math.min(0.05, (t - this.last) / 1000); this.last = t; this.update(dt); this.draw(); this.raf = requestAnimationFrame(this.loop); };
    this.raf = requestAnimationFrame(this.loop);
  },
  exit() { cancelAnimationFrame(this.raf); removeEventListener('resize', this.resize); this.stage.innerHTML = ''; },
  reset() {
    this.rounds = shuffle(BCOL).slice(0, 3); this.round = 0; this.need = 8; this.got = 0;
    this.bubbles = []; this.spawnT = 0; this.t = 0; this.done = false; this.combo = 0; this.wrong = 0;
    for (let i = 0; i < 6; i++) this.spawn(rand(0.2, 1));
    this.setRound(true);
  },
  setRound(first) {
    const col = this.rounds[this.round];
    $('.bub-dot', this.stage).style.background = col.c;
    $('.bub-label', this.stage).textContent = col.n.toUpperCase();
    this.updateProg();
    Voice.say((first ? 'Scoppia le bolle ' : pick(PRAISE) + Babbo.line(0.4) + ' Ora scoppia le bolle ') + col.n + '!');
  },
  updateProg() { $('.bub-prog', this.stage).textContent = '●'.repeat(this.got) + '○'.repeat(this.need - this.got); },
  spawn(yf = 1.1) {
    const target = this.rounds[this.round];
    let col;
    const r = Math.random();
    if (r < 0.04) col = { n: 'oro', c: '#ffd700', gold: true };
    else if (r < 0.5) col = target;
    else col = pick(BCOL);
    const rr = rand(42, 62) * this.k;
    this.bubbles.push({ x: rand(rr, this.W - rr), y: this.H * yf + rr, r: rr, col, e: pick(BEMO), v: rand(55, 105) * this.k, ph: rand(0, 6), s: 0 });
  },
  tap(e) {
    if (this.done) return;
    const rc = this.cv.getBoundingClientRect(), x = e.clientX - rc.left, y = e.clientY - rc.top;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (Math.hypot(b.x - x, b.y - y) < b.r * 1.15) {
        this.bubbles.splice(i, 1);
        const target = this.rounds[this.round];
        if (b.col === target || b.col.gold) {
          Sound.star(this.combo++); Sound.pop();
          FX.burst(e.clientX, e.clientY, { colors: [b.col.c, '#fff', b.col.c], n: 18, speed: 300 });
          if (b.col.gold) { addStars(2); FX.sparkle(e.clientX, e.clientY, 20); Voice.say('Una bolla d\'oro! Due stelline!'); }
          this.got++; this.updateProg();
          if (this.got >= this.need) this.nextRound();
        } else {
          Sound.softPop(); this.combo = 0;
          FX.burst(e.clientX, e.clientY, { colors: [b.col.c, '#fff'], n: 8, speed: 160 });
          if (++this.wrong % 3 === 0) Voice.say('Cerca le bolle ' + target.n + '!');
        }
        return;
      }
    }
  },
  nextRound() {
    this.round++; this.got = 0;
    if (this.round >= this.rounds.length) {
      this.done = true; this.updateProg();
      Sound.win(); FX.confetti(); Voice.say(`Bravissima ${nameOr()}! Hai scoppiato tutte le bolle!`);
      for (const b of this.bubbles) b.popAt = rand(0, 1.2);
      setTimeout(() => { if (current === 'bubbles') Reward.give(() => this.reset()); }, 2300);
      return;
    }
    Sound.chime(); this.setRound(false);
  },
  update(dt) {
    this.t += dt;
    if (!this.done) { this.spawnT -= dt; if (this.spawnT <= 0 && this.bubbles.length < 14) { this.spawnT = rand(0.45, 0.8); this.spawn(); } }
    const rc = this.cv.getBoundingClientRect();
    for (const b of this.bubbles) {
      b.y -= b.v * dt; b.x += Math.sin(this.t * 1.5 + b.ph) * 20 * dt; b.s = Math.min(1, b.s + dt * 3);
      if (b.popAt !== undefined && (b.popAt -= dt) <= 0) { b.dead = true; Sound.pop(); FX.burst(rc.left + b.x, rc.top + b.y, { colors: [b.col.c, '#fff'], n: 10 }); }
    }
    this.bubbles = this.bubbles.filter(b => !b.dead && b.y > -b.r * 2);
  },
  draw() {
    const c = this.ctx, W = this.W, H = this.H;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#c5f6fa'); g.addColorStop(1, '#e5dbff');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // raggi di luce
    c.save(); c.globalAlpha = 0.18; c.fillStyle = '#fff';
    for (let i = 0; i < 6; i++) { const x = (i / 6) * W + Math.sin(this.t * 0.3 + i) * 30; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x - 80, H); c.lineTo(x - 160, H); c.fill(); }
    c.restore();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const b of this.bubbles) {
      const r = b.r * (0.6 + 0.4 * b.s);
      const sq = 1 + Math.sin(this.t * 4 + b.ph) * 0.04;
      c.save(); c.translate(b.x, b.y); c.scale(sq, 2 - sq);
      const gr = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
      gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.35, b.col.c + '99'); gr.addColorStop(1, b.col.c + 'ee');
      c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      c.lineWidth = 3; c.strokeStyle = b.col.c; c.stroke();
      c.font = (r * 0.95) + 'px serif'; c.fillText(b.e, 0, r * 0.06);
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-r * 0.42, -r * 0.45, r * 0.18, r * 0.1, -0.7, 0, 7); c.fill();
      if (b.col.gold) { c.fillStyle = '#fff'; drawStar(c, r * 0.5, -r * 0.6, r * 0.2, 4, 0.35); c.fill(); }
      c.restore();
    }
  }
};
