'use strict';
/* ============ Utilità ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function svgUrl(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
function loadImg(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(i); i.src = src; }); }
const NAME = 'Camilla';
function nameOr() { return NAME; }

/* ============ Salvataggio ============ */
const SAVE_KEY = 'regno-magico-v1';
const Store = {
  data: null,
  defaults() {
    return {
      name: NAME, stars: 0, stickers: [], photos: [],
      unicorn: { body: 'bianco', mane: 'arcobaleno', horn: 'oro', mark: 'stella', acc: ['brillantini'], bg: 'castello' },
      pet: null, petStats: null, petRewardDay: '',
      music: true, voice: true, lastGift: '', memoryLevel: 0, songs: {}, visits: 0
    };
  },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { }
    this.data = Object.assign(this.defaults(), d || {});
    this.data.unicorn = Object.assign(this.defaults().unicorn, this.data.unicorn || {});
    this.data.name = NAME;
  },
  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); }
    catch (e) { if (this.data.photos.length) { this.data.photos.shift(); this.save(); } }
  }
};
Store.load();

function addStars(n) {
  Store.data.stars = Math.max(0, Store.data.stars + n);
  Store.save();
  const el = $('#star-count'); if (el) el.textContent = Store.data.stars;
}

/* ============ Suoni (tutti sintetizzati) ============ */
function NF(n) {
  const m = n.match(/([A-G])(#?)(\d)/);
  const idx = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
  return 440 * Math.pow(2, (idx + (m[3] - 4) * 12 - 9) / 12);
}
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];

const Sound = {
  ctx: null, master: null, musicGain: null, noiseBuf: null,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0; this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate; this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(f, d = 0.2, { type = 'sine', vol = 0.25, when = 0, slide = 0, attack = 0.01, out } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(out || this.master); o.start(t); o.stop(t + d + 0.05);
  },
  noise(d = 0.2, { vol = 0.2, when = 0, freq = 1200, q = 1, type = 'bandpass', slide = 0 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (slide) f.frequency.exponentialRampToValueAtTime(slide, t + d);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + d + 0.05);
  },
  bell(f, d = 1.2, vol = 0.3, when = 0, out) {
    this.tone(f, d, { vol, when, out });
    this.tone(f * 2, d * 0.6, { vol: vol * 0.3, when, out });
    this.tone(f * 3.01, d * 0.3, { vol: vol * 0.1, when, out });
  },
  click() { this.tone(820, 0.07, { type: 'triangle', vol: 0.18 }); },
  pop() { this.tone(rand(500, 800), 0.12, { vol: 0.35, slide: 140 }); this.noise(0.05, { vol: 0.15, freq: 3000 }); },
  softPop() { this.tone(300, 0.1, { vol: 0.2, slide: 120 }); },
  star(n = 0) { const f = 660 * Math.pow(2, PENTA[n % PENTA.length] / 12); this.bell(f, 0.5, 0.22); this.tone(f * 1.5, 0.15, { type: 'triangle', vol: 0.06, when: 0.04 }); },
  chime() { [0, 4, 7, 12, 16].forEach((s, i) => this.bell(523.25 * Math.pow(2, s / 12), 0.8, 0.18, i * 0.07)); },
  boing() { this.tone(320, 0.4, { type: 'triangle', vol: 0.3, slide: 90 }); this.tone(480, 0.3, { type: 'sine', vol: 0.1, slide: 160, when: 0.05 }); },
  whoosh() { this.noise(0.5, { vol: 0.25, freq: 400, slide: 3000, q: 2 }); },
  shutter() { this.noise(0.08, { vol: 0.4, freq: 2500, q: 0.7 }); this.noise(0.1, { vol: 0.3, freq: 1500, when: 0.09 }); },
  munch() { for (let i = 0; i < 3; i++) this.noise(0.08, { vol: 0.3, freq: 900 + i * 150, q: 3, when: i * 0.14 }); },
  purr() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 55;
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 24;
    const lg = this.ctx.createGain(); lg.gain.value = 0.08;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 0.15); g.gain.linearRampToValueAtTime(0.0001, t + 0.9);
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
    lfo.connect(lg); lg.connect(g.gain); o.connect(f); f.connect(g); g.connect(this.master);
    o.start(t); lfo.start(t); o.stop(t + 1); lfo.stop(t + 1);
  },
  win() {
    const n = ['C5', 'E5', 'G5', 'C6'];
    n.forEach((x, i) => { this.tone(NF(x), 0.25, { type: 'triangle', vol: 0.2, when: i * 0.12 }); this.bell(NF(x), 0.6, 0.12, i * 0.12); });
    ['C5', 'E5', 'G5', 'C6', 'E6'].forEach(x => this.bell(NF(x), 1.6, 0.1, 0.55));
    for (let i = 0; i < 8; i++) this.bell(NF('C6') * Math.pow(2, PENTA[randi(0, 9)] / 12), 0.4, 0.05, 0.6 + i * 0.09);
  },
  magic() { for (let i = 0; i < 10; i++) this.bell(1046 * Math.pow(2, PENTA[(i * 3) % 11] / 12), 0.4, 0.06, i * 0.04); }
};

/* ============ Musica di sottofondo (carillon) ============ */
const Music = {
  timer: null, step: 0, next: 0, dur: 0.24,
  mel: [
    'E5', 0, 'G5', 0, 'C6', 0, 'G5', 0, 'A5', 0, 'G5', 'E5', 0, 0, 'C5', 0,
    'A5', 0, 'C6', 0, 'A5', 'G5', 'F5', 0, 'G5', 0, 'E5', 0, 'D5', 0, 0, 0,
    'E5', 0, 'G5', 0, 'C6', 0, 'D6', 0, 'E6', 0, 'D6', 'C6', 'A5', 0, 0, 0,
    'A5', 0, 'C6', 0, 'A5', 0, 'G5', 'F5', 'E5', 0, 'D5', 0, 'C5', 0, 0, 0
  ],
  bass: ['C3', 'A2', 'F2', 'G2', 'C3', 'A2', 'F2', 'G2'],
  start() {
    if (!Sound.ctx || this.timer || !Store.data.music) return;
    const g = Sound.musicGain.gain, t = Sound.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.55, t + 1.2);
    this.next = t + 0.1;
    this.timer = setInterval(() => this.tick(), 60);
  },
  stop() {
    if (!this.timer) return;
    clearInterval(this.timer); this.timer = null;
    if (!Sound.ctx) return;
    const g = Sound.musicGain.gain, t = Sound.ctx.currentTime;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 0.4);
  },
  tick() {
    const ctx = Sound.ctx;
    while (this.next < ctx.currentTime + 0.3) {
      const when = this.next - ctx.currentTime;
      const i = this.step % this.mel.length;
      const n = this.mel[i];
      if (n) Sound.bell(NF(n), 0.9, 0.09, when, Sound.musicGain);
      if (i % 8 === 0) Sound.tone(NF(this.bass[(i / 8) | 0]), 1.2, { type: 'triangle', vol: 0.1, when, out: Sound.musicGain });
      if (i % 8 === 4) Sound.tone(NF(this.bass[(i / 8) | 0]) * 1.5, 0.8, { type: 'triangle', vol: 0.05, when, out: Sound.musicGain });
      this.next += this.dur; this.step++;
    }
  }
};

/* ============ Voce narrante ============ */
const Voice = {
  v: null,
  init() {
    if (!('speechSynthesis' in window)) return;
    const choose = () => {
      const vs = speechSynthesis.getVoices().filter(v => /^it/i.test(v.lang));
      this.v = vs.find(v => /elsa|alice|isabella|federica|paola|female|donna/i.test(v.name)) ||
        vs.find(v => /google/i.test(v.name)) || vs[0] || null;
    };
    choose(); speechSynthesis.onvoiceschanged = choose;
  },
  say(t) {
    if (!Store.data.voice || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'it-IT'; if (this.v) u.voice = this.v;
      u.rate = 1; u.pitch = 1.3; u.volume = 1;
      speechSynthesis.speak(u);
    } catch (e) { }
  }
};
/* Il babbo vuole bene a Camilla: ogni tanto la voce glielo ricorda */
const BABBO = [
  'Lo sai Camilla? Il tuo babbo ti vuole tanto tanto bene!',
  'Camilla, il babbo ti vuole bene fino alla luna e ritorno!',
  'Il tuo babbo è fierissimo di te, Camilla!',
  'Un bacione grande dal babbo! Ti vuole un mondo di bene!',
  'Sai chi ti vuole bene più di tutte le stelle del cielo? Il tuo babbo!',
  'Il babbo dice: Camilla, sei il regalo più bello del mondo!',
  'Camilla, il babbo ti manda un abbraccio fortissimo!'
];
const Babbo = {
  last: 0,
  // restituisce una frase del babbo da aggiungere a un messaggio (non troppo spesso)
  line(chance = 0.5, gap = 90000) {
    const now = Date.now();
    if (now - this.last < gap || Math.random() > chance) return '';
    this.last = now; this.toast();
    return ' ' + pick(BABBO);
  },
  toast() {
    let t = $('#babbo-toast');
    if (!t) { t = document.createElement('div'); t.id = 'babbo-toast'; document.body.appendChild(t); }
    t.innerHTML = '💖 Il babbo ti vuole bene! 💖';
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    setTimeout(() => FX.hearts(innerWidth / 2, 60, 8), 200);
  },
  // durante il gioco, ogni qualche minuto, se la voce è libera
  start() {
    setInterval(() => {
      if (current === 'splash' || document.hidden || Modal.open()) return;
      if ('speechSynthesis' in window && speechSynthesis.speaking) return;
      if (Date.now() - this.last < 150000) return;
      const l = this.line(1, 0); if (l) Voice.say(l.trim());
    }, 20000);
  }
};
const PRAISE = ['Bravissima!', 'Evviva!', 'Fantastico!', 'Che brava!', 'Super!', 'Magnifico!', 'Sei un fenomeno!', 'Wow!'];

/* ============ Effetti: coriandoli, brillantini, cuori ============ */
function drawStar(c, x, y, r, pts = 5, inner = 0.5) {
  c.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / pts, rr = i % 2 ? r * inner : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}
const FX = {
  cv: null, ctx: null, parts: [], running: false, dpr: 1,
  COLORS: ['#ff6b9d', '#ffd43b', '#4dabf7', '#9775fa', '#51cf66', '#ff922b', '#ffffff'],
  init() {
    this.cv = $('#fx'); this.ctx = this.cv.getContext('2d');
    const rs = () => { this.dpr = Math.min(2, devicePixelRatio || 1); this.cv.width = innerWidth * this.dpr; this.cv.height = innerHeight * this.dpr; };
    rs(); addEventListener('resize', rs);
  },
  burst(x, y, { n = 16, emojis = null, colors = this.COLORS, speed = 280, size = 9, gravity = 380, life = 1, up = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(speed * 0.3, speed);
      this.parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - up, g: gravity, life: rand(life * 0.6, life), max: life,
        size: rand(size * 0.6, size * 1.3), color: pick(colors), e: emojis ? pick(emojis) : null,
        shape: pick(['c', 's', 's']), rot: rand(0, 6), vr: rand(-6, 6)
      });
    }
    this.run();
  },
  hearts(x, y, n = 6) { this.burst(x, y, { n, emojis: ['💖', '💕', '💗', '💓'], speed: 160, size: 26, gravity: -120, life: 1.4, up: 120 }); },
  sparkle(x, y, n = 12) { this.burst(x, y, { n, colors: ['#fff', '#ffd43b', '#ffe8f5', '#d0bfff'], speed: 200, size: 8, gravity: 0, life: 0.8 }); },
  confetti() {
    for (let i = 0; i < 150; i++) {
      this.parts.push({
        x: rand(0, innerWidth), y: rand(-innerHeight * 0.6, -10), vx: rand(-60, 60), vy: rand(120, 320), g: 60,
        life: 4.5, max: 4.5, size: rand(7, 13), color: pick(this.COLORS), shape: pick(['r', 'r', 's', 'c']), rot: rand(0, 6), vr: rand(-8, 8), wob: rand(0, 6)
      });
    }
    this.run();
  },
  run() {
    if (this.running) return; this.running = true;
    let last = performance.now();
    const loop = t => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      const c = this.ctx; c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
      this.parts = this.parts.filter(p => (p.life -= dt) > 0);
      for (const p of this.parts) {
        p.vy += p.g * dt; p.x += p.vx * dt + (p.wob !== undefined ? Math.sin(t / 300 + p.wob) * 1.2 : 0); p.y += p.vy * dt; p.rot += p.vr * dt;
        c.globalAlpha = Math.min(1, p.life / (p.max * 0.4));
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        if (p.e) { c.font = p.size + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.rotate(-p.rot * 0.8); c.fillText(p.e, 0, 0); }
        else {
          c.fillStyle = p.color;
          if (p.shape === 'c') { c.beginPath(); c.arc(0, 0, p.size / 2, 0, 7); c.fill(); }
          else if (p.shape === 'r') c.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          else { drawStar(c, 0, 0, p.size * 0.7, 4, 0.35); c.fill(); }
        }
        c.restore();
      }
      c.globalAlpha = 1;
      if (this.parts.length) requestAnimationFrame(loop);
      else { c.clearRect(0, 0, innerWidth, innerHeight); this.running = false; }
    };
    requestAnimationFrame(loop);
  }
};
function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }

/* ============ Finestra modale ============ */
const Modal = {
  show(html, cls = '') { const m = $('#modal'); m.className = 'show ' + cls; m.innerHTML = '<div class="modal-card">' + html + '</div>'; return m; },
  hide() { const m = $('#modal'); m.className = ''; m.innerHTML = ''; },
  open() { return $('#modal').classList.contains('show'); }
};

/* ============ Figurine e premi ============ */
const STICKERS = [
  { e: '🦄', n: "l'unicorno", r: 1 }, { e: '🧚', n: 'la fatina', r: 1 }, { e: '🐉', n: 'il draghetto', r: 1 },
  { e: '👑', n: 'la corona', r: 1 }, { e: '💎', n: 'il diamante', r: 1 }, { e: '🏰', n: 'il castello', r: 1 },
  { e: '🌈', n: "l'arcobaleno" }, { e: '🐬', n: 'il delfino' }, { e: '🦋', n: 'la farfalla' }, { e: '🌸', n: 'il fiore di ciliegio' },
  { e: '🍭', n: 'il lecca lecca' }, { e: '🧁', n: 'il cupcake' }, { e: '🐱', n: 'il gattino' }, { e: '🐰', n: 'il coniglietto' },
  { e: '🦊', n: 'la volpe' }, { e: '🐼', n: 'il panda' }, { e: '🌟', n: 'la stella magica' }, { e: '🍓', n: 'la fragola' },
  { e: '🐢', n: 'la tartaruga' }, { e: '🦜', n: 'il pappagallo' }, { e: '🐙', n: 'il polpo' }, { e: '🎀', n: 'il fiocco' },
  { e: '🍦', n: 'il gelato' }, { e: '🐝', n: "l'ape" }, { e: '🌙', n: 'la luna' }, { e: '🐞', n: 'la coccinella' },
  { e: '🦒', n: 'la giraffa' }, { e: '🐧', n: 'il pinguino' }, { e: '🎠', n: 'la giostra' }, { e: '🍩', n: 'la ciambella' },
  { e: '🐳', n: 'la balena' }, { e: '🦩', n: 'il fenicottero' }, { e: '🐨', n: 'il koala' }, { e: '🍉', n: "l'anguria" },
  { e: '🐠', n: 'il pesciolino' }, { e: '🎈', n: 'il palloncino' }
];

const Reward = {
  give(onAgain) {
    const owned = new Set(Store.data.stickers);
    const avail = STICKERS.map((s, i) => i).filter(i => !owned.has(i));
    let idx, dup = false;
    if (avail.length) {
      const w = avail.flatMap(i => STICKERS[i].r ? [i] : [i, i, i]);
      idx = pick(w); Store.data.stickers.push(idx);
    } else { idx = randi(0, STICKERS.length - 1); dup = true; }
    const complete = !dup && Store.data.stickers.length === STICKERS.length;
    addStars(dup ? 10 : 5);
    const s = STICKERS[idx];
    Sound.magic();
    Modal.show(`<div class="gift-wrap"><div class="gift-box" id="gbox">🎁</div><div class="tap-hint">👆</div></div>
      <div class="modal-title">Un regalo per te!</div>`, 'reward');
    Voice.say('Hai vinto un regalo! Toccalo per aprirlo!');
    $('#gbox').onclick = () => {
      Sound.whoosh(); setTimeout(() => Sound.win(), 150);
      FX.confetti();
      const label = s.n.replace(/^(il |la |l'|lo )/, '');
      Modal.show(`
        <div class="reveal ${s.r ? 'rare' : ''}"><div class="rays"></div><div class="stk-big">${s.e}</div></div>
        <div class="modal-title">${label.charAt(0).toUpperCase() + label.slice(1)}${s.r ? ' ✨' : ''}</div>
        <div class="reward-stars">+${dup ? 10 : 5} ⭐</div>
        <div class="modal-actions">
          ${onAgain ? '<button class="round-btn again" aria-label="Gioca ancora">🔁</button>' : ''}
          <button class="round-btn ok" aria-label="Fatto">${onAgain ? '🏠' : '✔'}</button>
        </div>`, 'reward');
      let msg = `Evviva ${nameOr()}! Hai trovato ${s.n}!`;
      if (s.r) msg += ' È una figurina rarissima!';
      if (dup) msg = `Evviva! Hai già ${s.n}, allora ti regalo dieci stelline!`;
      if (complete) msg = `Incredibile ${nameOr()}! Hai completato tutto l'album! Sei la regina del Regno Magico!`;
      Voice.say(msg + Babbo.line(0.6));
      const again = $('#modal .again');
      if (again) again.onclick = () => { Sound.click(); Modal.hide(); onAgain(); };
      $('#modal .ok').onclick = () => { Sound.click(); Modal.hide(); if (onAgain) go('hub'); else Hub.refresh(); };
    };
  }
};

/* ============ Navigazione ============ */
const Games = {};
let current = 'splash';
function go(id) {
  if (Games[current] && Games[current].exit) Games[current].exit();
  if (Modal.open()) Modal.hide();
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = id === 'hub' ? $('#hub') : $('#scr-' + id);
  el.classList.add('active');
  current = id;
  if (id === 'hub') Hub.enter();
  else Games[id].enter(el.querySelector('.stage'));
  if (id === 'piano') Music.stop(); else if (Store.data.music) Music.start();
}
