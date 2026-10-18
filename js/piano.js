'use strict';
/* Pianoforte magico con canzoncine guidate */
const KEYS = [
  { n: 'DO', f: 'C4', a: '🐘', c: '#ff6b6b' }, { n: 'RE', f: 'D4', a: '🐻', c: '#ff922b' },
  { n: 'MI', f: 'E4', a: '🦁', c: '#fcc419' }, { n: 'FA', f: 'F4', a: '🐷', c: '#51cf66' },
  { n: 'SOL', f: 'G4', a: '🐶', c: '#22b8cf' }, { n: 'LA', f: 'A4', a: '🐱', c: '#4dabf7' },
  { n: 'SI', f: 'B4', a: '🐰', c: '#845ef7' }, { n: 'DO', f: 'C5', a: '🐥', c: '#f06595' }
];
// note: indice del tasto + durata (1 = semiminima)
const SONGS = [
  { id: 'brilla', icon: '⭐', name: 'Brilla brilla la stellina', notes: '0 0 4 4 5 5 4:2 3 3 2 2 1 1 0:2 4 4 3 3 2 2 1:2 4 4 3 3 2 2 1:2 0 0 4 4 5 5 4:2 3 3 2 2 1 1 0:2' },
  { id: 'martino', icon: '🔔', name: 'Fra Martino', notes: '0 1 2 0 0 1 2 0 2 3 4:2 2 3 4:2 4:.5 5:.5 4:.5 3:.5 2 0 4:.5 5:.5 4:.5 3:.5 2 0 0 4 0:2 0 4 0:2' },
  { id: 'fattoria', icon: '🐮', name: 'Nella vecchia fattoria', notes: '4 4 4 1 2 2 1:2 6 6 5 5 4:2 4 4 4 1 2 2 1:2 6 6 5 5 4:2' }
];
const parseSong = s => s.notes.split(' ').map(x => { const [k, d] = x.split(':'); return { k: +k, d: d ? +d : 1 }; });

Games.piano = {
  enter(stage) {
    this.stage = stage; this.song = null; this.pos = 0; this.playing = false;
    stage.innerHTML = `<div class="piano">
      <div class="songs"><button class="song on" data-s="">🎹</button>${SONGS.map(s => `<button class="song" data-s="${s.id}">${s.icon}${Store.data.songs[s.id] ? '<i>✔</i>' : ''}</button>`).join('')}</div>
      <div class="keys">${KEYS.map((k, i) => `<button class="key" data-i="${i}" style="--c:${k.c}"><span class="ka">${k.a}</span><span class="kn">${k.n}</span><span class="hint">👆</span></button>`).join('')}</div>
    </div>`;
    $$('.key', stage).forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); this.press(+b.dataset.i, b); }));
    $$('.song', stage).forEach(b => b.onclick = () => this.pickSong(b.dataset.s));
    Voice.say('Suona il pianoforte magico! Oppure scegli una canzoncina in alto.');
  },
  exit() { this.playing = false; clearTimeout(this.tm); this.stage.innerHTML = ''; },
  pickSong(id) {
    Sound.click();
    $$('.song', this.stage).forEach(b => b.classList.toggle('on', b.dataset.s === id));
    this.song = id ? SONGS.find(s => s.id === id) : null;
    this.seq = this.song ? parseSong(this.song) : null; this.pos = 0;
    if (this.song) Voice.say(this.song.name + '! Tocca il tasto che brilla!');
    else Voice.say('Suona come vuoi!');
    this.showNext();
  },
  showNext() {
    $$('.key', this.stage).forEach(b => b.classList.remove('next'));
    if (this.seq && this.pos < this.seq.length) $(`.key[data-i="${this.seq[this.pos].k}"]`, this.stage).classList.add('next');
  },
  press(i, el) {
    if (this.playing) return;
    Sound.init();
    Sound.bell(NF(KEYS[i].f), 1.3, 0.35);
    Sound.tone(NF(KEYS[i].f) / 2, 0.6, { type: 'triangle', vol: 0.08 });
    el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
    const r = el.getBoundingClientRect();
    FX.burst(r.left + r.width / 2, r.top + r.height * 0.3, { n: 2, emojis: ['🎵', '🎶', '✨'], speed: 80, size: 30, gravity: -160, life: 1.3, up: 80 });
    if (!this.seq) return;
    if (i === this.seq[this.pos].k) {
      this.pos++;
      if (this.pos >= this.seq.length) { this.finish(); return; }
      this.showNext();
    }
  },
  async finish() {
    $$('.key', this.stage).forEach(b => b.classList.remove('next'));
    const first = !Store.data.songs[this.song.id];
    Store.data.songs[this.song.id] = true; Store.save();
    Sound.chime(); FX.confetti();
    Voice.say(`Bravissima ${nameOr()}! Ora ascolta la tua canzone!`);
    this.playing = true;
    await sleep(2600);
    const keys = $$('.key', this.stage);
    for (const n of this.seq) {
      if (!this.playing) return;
      Sound.bell(NF(KEYS[n.k].f), 1.2, 0.3);
      const el = keys[n.k]; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
      await sleep(n.d * 420);
    }
    this.playing = false;
    if (current !== 'piano') return;
    const id = this.song.id;
    if (first) Reward.give(() => this.pickSong(id));
    else { addStars(3); Sound.win(); Voice.say('Tre stelline per te! Suonane un\'altra!'); this.pickSong(id); }
  }
};
