'use strict';
/* Memory degli animali */
const ANIMALS = [
  ['🐱', 'il gattino'], ['🐶', 'il cagnolino'], ['🐰', 'il coniglietto'], ['🐼', 'il panda'], ['🦊', 'la volpe'],
  ['🐸', 'la rana'], ['🐵', 'la scimmietta'], ['🦁', 'il leone'], ['🐷', 'il maialino'], ['🐮', 'la mucca'],
  ['🐥', 'il pulcino'], ['🐧', 'il pinguino'], ['🦄', "l'unicorno"], ['🐢', 'la tartaruga'], ['🐙', 'il polpo'],
  ['🦋', 'la farfalla'], ['🐨', 'il koala'], ['🦒', 'la giraffa'], ['🐬', 'il delfino'], ['🦉', 'il gufo']
];
const MEM_LEVELS = [{ pairs: 3, cols: 3 }, { pairs: 4, cols: 4 }, { pairs: 6, cols: 4 }, { pairs: 8, cols: 4 }];
const BACKS = ['#ff8cc6', '#b197fc', '#74c0fc', '#63e6be'];

Games.memory = {
  enter(stage) {
    this.stage = stage;
    stage.innerHTML = `<div class="mem-wrap"><div class="mem-levels"></div><div class="mem-board"></div></div>`;
    this.resize = () => this.layout(); addEventListener('resize', this.resize);
    this.start(Math.min(Store.data.memoryLevel, MEM_LEVELS.length - 1));
    Voice.say('Trova le coppie di animali uguali!');
  },
  exit() { removeEventListener('resize', this.resize); clearTimeout(this.tm); this.stage.innerHTML = ''; },
  levelsBar() {
    $('.mem-levels', this.stage).innerHTML = MEM_LEVELS.map((l, i) => {
      const locked = i > Store.data.memoryLevel;
      return `<button class="lvl ${i === this.level ? 'on' : ''} ${locked ? 'locked' : ''}" data-l="${i}">${locked ? '🔒' : '⭐'.repeat(i + 1)}</button>`;
    }).join('');
    $$('.lvl', this.stage).forEach(b => b.onclick = () => {
      const l = +b.dataset.l;
      if (l > Store.data.memoryLevel) { Sound.softPop(); Voice.say('Questo livello si apre quando finisci quello prima!'); return; }
      Sound.click(); this.start(l);
    });
  },
  start(level) {
    this.level = level; this.open = []; this.matched = 0; this.busy = false;
    const L = MEM_LEVELS[level];
    const animals = shuffle(ANIMALS).slice(0, L.pairs);
    this.cards = shuffle([...animals, ...animals]);
    const back = BACKS[level % BACKS.length];
    const board = $('.mem-board', this.stage);
    board.innerHTML = this.cards.map((a, i) => `
      <button class="card" data-i="${i}" style="--back:${back};--d:${i * 40}ms">
        <span class="inner"><span class="face back">✨</span><span class="face front">${a[0]}</span></span>
      </button>`).join('');
    $$('.card', board).forEach(el => el.onclick = () => this.flip(el));
    this.levelsBar(); this.layout();
  },
  layout() {
    const board = $('.mem-board', this.stage); if (!board) return;
    const L = MEM_LEVELS[this.level];
    const r = { width: board.parentElement.clientWidth, height: board.parentElement.clientHeight };
    const availH = r.height - 80, availW = r.width - 24;
    let cols = L.cols, rows = Math.ceil(L.pairs * 2 / cols);
    if (availW < availH && cols > 3 && L.pairs * 2 % 3 === 0) { cols = 3; rows = L.pairs * 2 / 3; }
    const gap = 12;
    const cw = Math.min((availW - gap * (cols - 1)) / cols, ((availH - gap * (rows - 1)) / rows) * 0.8, 170);
    board.style.gridTemplateColumns = `repeat(${cols}, ${cw}px)`;
    board.style.setProperty('--cw', cw + 'px');
  },
  flip(el) {
    const i = +el.dataset.i;
    if (this.busy || el.classList.contains('flipped')) return;
    el.classList.add('flipped'); Sound.click();
    Voice.say(this.cards[i][1]);
    this.open.push(el);
    if (this.open.length < 2) return;
    const [a, b] = this.open; this.open = [];
    if (this.cards[a.dataset.i][0] === this.cards[b.dataset.i][0]) {
      this.matched++;
      setTimeout(() => {
        a.classList.add('matched'); b.classList.add('matched');
        Sound.chime();
        const [x, y] = centerOf(b); FX.sparkle(x, y, 16);
        if (this.matched * 2 === this.cards.length) this.win();
        else if (Math.random() < 0.5) setTimeout(() => Voice.say(pick(PRAISE) + Babbo.line(0.3)), 600);
      }, 350);
    } else {
      this.busy = true;
      this.tm = setTimeout(() => { a.classList.remove('flipped'); b.classList.remove('flipped'); Sound.softPop(); this.busy = false; }, 1100);
    }
  },
  win() {
    const next = this.level + 1;
    if (next < MEM_LEVELS.length && Store.data.memoryLevel < next) { Store.data.memoryLevel = next; Store.save(); }
    Sound.win(); FX.confetti();
    Voice.say(`Bravissima ${nameOr()}! Hai trovato tutte le coppie!`);
    this.tm = setTimeout(() => {
      if (current === 'memory') Reward.give(() => this.start(Math.min(next, MEM_LEVELS.length - 1)));
    }, 2200);
  }
};
