'use strict';
/* Il mio cucciolo: pappa, bagnetto, gioco, nanna e coccole */
const PETS = [
  { e: '🐱', n: 'Micia', voice: 'Miao!', food: ['🐟', '🥛', '🍗', '🍪'] },
  { e: '🐶', n: 'Bobby', voice: 'Bau bau!', food: ['🦴', '🍖', '🥕', '🍪'] },
  { e: '🐰', n: 'Fiocco', voice: 'Squit squit!', food: ['🥕', '🍓', '🥬', '🍎'] },
  { e: '🐼', n: 'Bambù', voice: 'Ehi ehi!', food: ['🎋', '🍎', '🍪', '🍌'] }
];
const NEEDS = [
  { k: 'food', icon: '🍓', col: '#ff6b9d', say: 'Ho tanta fame!' },
  { k: 'clean', icon: '🫧', col: '#4dabf7', say: 'Mi fai il bagnetto?' },
  { k: 'fun', icon: '⚽', col: '#51cf66', say: 'Giochiamo insieme?' },
  { k: 'energy', icon: '💤', col: '#9775fa', say: 'Ho un po\' di sonno...' }
];

Games.pet = {
  enter(stage) {
    this.stage = stage;
    if (Store.data.pet === null) return this.choose();
    const st = Store.data.petStats || { food: 70, clean: 70, fun: 70, energy: 70, t: Date.now() };
    const hrs = (Date.now() - (st.t || Date.now())) / 3.6e6;
    for (const n of NEEDS) st[n.k] = clamp(st[n.k] - hrs * 7, 15, 100);
    st.t = Date.now(); Store.data.petStats = st; Store.save();
    this.p = PETS[Store.data.pet];
    this.mode = null;
    stage.innerHTML = `<div class="pet-room">
      <div class="pet-meters">${NEEDS.map(n => `<div class="meter" data-k="${n.k}"><span>${n.icon}</span><div class="mbar"><i style="background:${n.col}"></i></div></div>`).join('')}</div>
      <div class="pet-area">
        <div class="thought hidden"></div>
        <div class="tub hidden">🛁</div>
        <div class="pet">${this.p.e}</div>
        <div class="foam"></div>
        <div class="ball hidden">⚽</div>
      </div>
      <div class="tray hidden"></div>
      <div class="pet-actions">
        <button class="act" data-a="food" style="--c:#ff6b9d">🍓</button>
        <button class="act" data-a="clean" style="--c:#4dabf7">🛁</button>
        <button class="act" data-a="fun" style="--c:#51cf66">⚽</button>
        <button class="act" data-a="energy" style="--c:#9775fa">🌙</button>
      </div>
      <div class="night hidden"><div class="moon">🌙</div><div class="zzz">💤</div><button class="round-btn wake">☀️</button></div>
    </div>`;
    this.petEl = $('.pet', stage);
    $$('.act', stage).forEach(b => b.onclick = () => this.action(b.dataset.a));
    this.bindPet();
    this.updateMeters();
    const low = NEEDS.filter(n => st[n.k] < 50).sort((a, b) => st[a.k] - st[b.k])[0];
    Voice.say(low ? `Ciao ${nameOr()}! Sono ${this.p.n}. ${low.say}` : `Ciao ${nameOr()}! Sono ${this.p.n}! Fammi le coccole!`);
    this.tick = setInterval(() => this.idle(), 6000);
  },
  exit() { clearInterval(this.tick); clearInterval(this.sleepT); clearTimeout(this.lull); if (this.st) { this.st.t = Date.now(); Store.save(); } if (this.lg) this.lg.disconnect(); this.stage.innerHTML = ''; },
  get st() { return Store.data.petStats; },
  choose() {
    this.stage.innerHTML = `<div class="pet-choose"><div class="modal-title">Scegli il tuo cucciolo!</div>
      <div class="pet-grid">${PETS.map((p, i) => `<button class="pet-opt" data-i="${i}"><span>${p.e}</span><b>${p.n}</b></button>`).join('')}</div></div>`;
    Voice.say('Scegli il tuo cucciolo! Te ne prenderai cura tu!');
    $$('.pet-opt', this.stage).forEach(b => b.onclick = () => {
      Store.data.pet = +b.dataset.i;
      Store.data.petStats = { food: 60, clean: 60, fun: 60, energy: 80, t: Date.now() };
      Store.save(); Sound.chime(); const [x, y] = centerOf(b); FX.hearts(x, y, 10);
      setTimeout(() => this.enter(this.stage), 500);
    });
  },
  updateMeters() {
    for (const n of NEEDS) {
      const el = $(`.meter[data-k=${n.k}] i`, this.stage); if (el) el.style.width = this.st[n.k] + '%';
      $(`.meter[data-k=${n.k}]`, this.stage).classList.toggle('low', this.st[n.k] < 40);
    }
    this.st.t = Date.now(); Store.save();
    const low = NEEDS.filter(n => this.st[n.k] < 45).sort((a, b) => this.st[a.k] - this.st[b.k])[0];
    const th = $('.thought', this.stage);
    if (low && !this.mode) { th.textContent = low.icon; th.classList.remove('hidden'); } else th.classList.add('hidden');
    this.petEl.classList.toggle('sad', !!low);
    if (NEEDS.every(n => this.st[n.k] >= 90) && !this.mode) this.superHappy();
  },
  superHappy() {
    this.petEl.classList.add('dance');
    setTimeout(() => this.petEl && this.petEl.classList.remove('dance'), 2500);
    if (Store.data.petRewardDay === today()) return;
    Store.data.petRewardDay = today(); Store.save();
    Sound.win(); FX.confetti();
    Voice.say(`${this.p.n} è super felice! Sei bravissima a prenderti cura del tuo cucciolo!`);
    setTimeout(() => { if (current === 'pet') Reward.give(); }, 2500);
  },
  add(k, v) { this.st[k] = clamp(this.st[k] + v, 0, 100); this.updateMeters(); },
  bounce(cls = 'jump') { const p = this.petEl; p.classList.remove(cls); void p.offsetWidth; p.classList.add(cls); },
  bindPet() {
    let dist = 0, moved = 0, lx = 0, ly = 0, down = false;
    const area = $('.pet-area', this.stage);
    area.addEventListener('pointerdown', e => { down = true; moved = 0; lx = e.clientX; ly = e.clientY; area.setPointerCapture(e.pointerId); });
    area.addEventListener('pointermove', e => {
      if (!down) return;
      const d = Math.hypot(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY;
      if (!this.overPet(e)) return;
      dist += d; moved += d;
      if (dist > 70) {
        dist = 0;
        if (this.mode === 'bath') this.addFoam(e);
        else if (!this.mode) { FX.hearts(e.clientX, e.clientY, 2); this.add('fun', 2); if (Math.random() < 0.35) Sound.purr(); this.bounce('wiggle'); }
      }
    });
    area.addEventListener('pointerup', e => {
      down = false;
      if (moved < 10 && this.overPet(e) && !this.mode) { Sound.boing(); this.bounce(); Voice.say(this.p.voice); const [x, y] = centerOf(this.petEl); FX.hearts(x, y - 40, 3); }
    });
  },
  overPet(e) { const r = this.petEl.getBoundingClientRect(); return e.clientX > r.left - 20 && e.clientX < r.right + 20 && e.clientY > r.top - 20 && e.clientY < r.bottom + 20; },
  idle() {
    if (this.mode) return;
    for (const n of NEEDS) this.st[n.k] = clamp(this.st[n.k] - 0.6, 15, 100);
    this.updateMeters();
    if (Math.random() < 0.4) this.bounce('wiggle');
  },
  action(a) {
    Sound.click();
    if (this.mode === 'bath' && a !== 'clean') this.endBath(false);
    if (a === 'food') return this.showTray();
    $('.tray', this.stage).classList.add('hidden');
    if (a === 'clean') return this.mode === 'bath' ? this.endBath(false) : this.startBath();
    if (a === 'fun') return this.play();
    if (a === 'energy') return this.sleep();
  },
  showTray() {
    const tray = $('.tray', this.stage);
    if (!tray.classList.contains('hidden')) { tray.classList.add('hidden'); return; }
    tray.innerHTML = this.p.food.map(f => `<button class="food">${f}</button>`).join('');
    tray.classList.remove('hidden');
    Voice.say('Cosa mangiamo?');
    $$('.food', tray).forEach(b => b.onclick = () => this.feed(b));
  },
  feed(btn) {
    if (this.st.food >= 100) { Voice.say(`Sono pienissimo! Grazie ${nameOr()}!`); this.bounce('wiggle'); return; }
    const [sx, sy] = centerOf(btn), [tx, ty] = centerOf(this.petEl);
    const f = document.createElement('div'); f.className = 'flying'; f.textContent = btn.textContent;
    f.style.left = sx + 'px'; f.style.top = sy + 'px'; document.body.appendChild(f);
    requestAnimationFrame(() => { f.style.transform = `translate(${tx - sx}px, ${ty - sy}px) scale(.4)`; f.style.opacity = '0.2'; });
    Sound.whoosh();
    setTimeout(() => {
      f.remove(); Sound.munch(); this.bounce('chomp'); this.add('food', 25);
      FX.hearts(tx, ty - 50, 4);
      Voice.say(pick(['Gnam gnam!', 'Buonissimo!', 'Che bontà!', 'Gnam!']) + Babbo.line(0.25));
    }, 650);
  },
  startBath() {
    this.mode = 'bath'; this.foamN = 0; this.updateMeters();
    $('.tub', this.stage).classList.remove('hidden'); this.petEl.classList.add('in-tub');
    Voice.say('Bagnetto! Strofina il cucciolo con il dito per fare tanta schiuma!');
  },
  addFoam(e) {
    const foam = $('.foam', this.stage), r = foam.getBoundingClientRect();
    const b = document.createElement('span'); b.className = 'suds'; b.textContent = '🫧';
    b.style.left = (e.clientX - r.left) + 'px'; b.style.top = (e.clientY - r.top) + 'px'; b.style.fontSize = rand(28, 50) + 'px';
    foam.appendChild(b); Sound.pop(); this.add('clean', 5);
    if (++this.foamN >= 14) this.endBath(true);
  },
  endBath(done) {
    if (done) {
      Sound.whoosh(); setTimeout(() => Sound.chime(), 500);
      this.st.clean = 100;
      const [x, y] = centerOf(this.petEl);
      FX.burst(x, y - 80, { n: 30, colors: ['#74c0fc', '#a5d8ff', '#ffffff'], gravity: 600, speed: 200, up: 100 });
      setTimeout(() => FX.sparkle(x, y, 24), 600);
      Voice.say('Che profumo! Ora sei pulitissimo!');
    }
    this.mode = null;
    $('.foam', this.stage).innerHTML = '';
    $('.tub', this.stage).classList.add('hidden'); this.petEl.classList.remove('in-tub');
    this.updateMeters();
  },
  play() {
    const ball = $('.ball', this.stage);
    ball.classList.remove('hidden', 'roll', 'roll-l');
    Voice.say('Tocca la palla per lanciarla!');
    ball.onclick = () => {
      const dir = Math.random() < 0.5 ? 'roll' : 'roll-l';
      ball.classList.remove('roll', 'roll-l'); void ball.offsetWidth; ball.classList.add(dir);
      Sound.boing();
      this.petEl.style.setProperty('--flip', dir === 'roll' ? '1' : '-1');
      setTimeout(() => { this.bounce('jump'); this.add('fun', 18); const [x, y] = centerOf(this.petEl); FX.hearts(x, y - 40, 3); }, 500);
      setTimeout(() => { if (Math.random() < 0.5) Voice.say(pick(['Ancora! Ancora!', 'Che divertente!', 'Evviva!'])); }, 900);
      this.energyCost();
    };
  },
  energyCost() { this.st.energy = clamp(this.st.energy - 4, 15, 100); this.updateMeters(); },
  sleep() {
    this.mode = 'sleep'; this.updateMeters();
    Music.stop();
    const n = $('.night', this.stage); n.classList.remove('hidden');
    this.petEl.classList.add('sleeping');
    Voice.say('Buonanotte piccolo... facciamo la nanna. Anche il babbo dà la buonanotte a Camilla con un bacino.');
    // ninna nanna di Brahms
    const lull = ['E5', 'E5', 'G5', 0, 'E5', 'E5', 'G5', 0, 'E5', 'G5', 'C6', 'B5', 'A5', 'A5', 'G5', 0, 'D5', 'E5', 'F5', 0, 'D5', 'D5', 'E5', 'F5', 0, 'D5', 'F5', 'B5', 'A5', 'G5', 'B5', 'C6'];
    if (Sound.ctx) { this.lg = Sound.ctx.createGain(); this.lg.connect(Sound.master); lull.forEach((x, i) => { if (x) Sound.bell(NF(x), 1.4, 0.12, 1.5 + i * 0.42, this.lg); }); }
    this.sleepT = setInterval(() => { this.add('energy', 6); }, 700);
    $('.wake', n).onclick = () => this.wake();
    this.lull = setTimeout(() => this.wake(true), 15500);
  },
  wake(auto) {
    if (this.mode !== 'sleep') return;
    clearInterval(this.sleepT); clearTimeout(this.lull); if (this.lg) { this.lg.disconnect(); this.lg = null; }
    $('.night', this.stage).classList.add('hidden'); this.petEl.classList.remove('sleeping');
    this.mode = null; if (auto) this.st.energy = 100;
    Sound.chime(); this.bounce(); Voice.say('Buongiorno! Che bella dormita!');
    if (Store.data.music) Music.start();
    this.updateMeters();
  }
};
