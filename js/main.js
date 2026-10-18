'use strict';
/* Mappa del regno, schermata iniziale, area genitori */
const GAMES = [
  { id: 'fly', emoji: '🦄', label: 'Vola!', color: '#ff8fc8', say: 'Vola con Stellina!' },
  { id: 'bubbles', emoji: '<span class="bubble-ico"></span>', label: 'Bolle', color: '#74c0fc', say: 'Le bolle magiche!' },
  { id: 'memory', emoji: '🃏', label: 'Memory', color: '#b197fc', say: 'Il memory degli animali!' },
  { id: 'dress', emoji: '👑', label: 'Stellina', color: '#ffb347', say: 'Facciamo bella Stellina!' },
  { id: 'draw', emoji: '🎨', label: 'Colora', color: '#69db7c', say: 'Disegniamo e coloriamo!' },
  { id: 'pet', emoji: '🐾', label: 'Cucciolo', color: '#ff9f7a', say: 'Il tuo cucciolo!' },
  { id: 'piano', emoji: '🎹', label: 'Musica', color: '#ffd43b', say: 'Il pianoforte magico!' },
  { id: 'album', emoji: '📒', label: 'Album', color: '#f783ac', say: 'Il tuo album delle figurine!' }
];
const UNI_PHRASES = [
  'Ti voglio tanto bene, NOME!', 'Giochiamo insieme?', 'Sei la mia migliore amica!', 'Che bella giornata magica!',
  'Facciamo una gara di stelline?', 'Ih ih! Mi fai il solletico!', 'Lo sai che sei fantastica?', 'Vuoi farmi una foto?',
  'Il mio corno brilla quando sei felice!', 'Lo sai che il tuo babbo ti vuole tantissimo bene?', 'Il babbo mi ha detto un segreto: ti vuole un bene infinito!', 'Abracadabra! Un abbraccio magico!', 'Mi fai una treccia alla criniera?'
];

const Hub = {
  built: false,
  build() {
    $('#hub-grid').innerHTML = GAMES.map((g, i) => `
      <button class="game-btn" data-g="${g.id}" style="--c:${g.color};--d:${i * 70}ms">
        <span class="gi">${g.emoji}</span><span class="gl">${g.label}</span>
      </button>`).join('');
    $$('.game-btn').forEach(b => b.onclick = () => {
      const g = GAMES.find(x => x.id === b.dataset.g);
      Sound.chime(); const [x, y] = centerOf(b); FX.sparkle(x, y, 14);
      b.classList.add('pressed');
      setTimeout(() => { b.classList.remove('pressed'); go(g.id); }, 280);
    });
    $('#hub-uni').onclick = () => this.uniTap();
    $('#gift-btn').onclick = () => {
      Store.data.lastGift = today(); Store.save();
      $('#gift-btn').classList.add('hidden');
      Reward.give();
    };
    $('#music-btn').onclick = () => {
      Store.data.music = !Store.data.music; Store.save();
      Store.data.music ? Music.start() : Music.stop();
      this.syncMusic(); Sound.click();
    };
    $('#parent-btn').onclick = () => Parent.open();
    // schermate dei giochi
    $('#games').innerHTML = GAMES.map(g => `<section id="scr-${g.id}" class="screen game">
      <button class="home-btn" aria-label="Torna alla mappa">🏠</button><div class="stage"></div></section>`).join('');
    $$('.home-btn').forEach(b => b.onclick = () => { Sound.click(); go('hub'); });
    this.built = true;
  },
  syncMusic() { $('#music-btn').classList.toggle('off', !Store.data.music); },
  refresh() {
    $('#star-count').textContent = Store.data.stars;
    $('#stk-count').textContent = Store.data.stickers.length + '/' + STICKERS.length;
    $('#gift-btn').classList.toggle('hidden', Store.data.lastGift === today());
  },
  enter() {
    if (!this.built) this.build();
    $('#hello').textContent = 'Ciao Camilla!';
    $('#hub-uni').innerHTML = unicornSVG(Store.data.unicorn);
    $('#hub').style.setProperty('--bgimg', bgCSS(Store.data.unicorn.bg));
    const petBtn = $('.game-btn[data-g=pet] .gi');
    if (petBtn && Store.data.pet !== null) petBtn.textContent = PETS[Store.data.pet].e;
    this.refresh(); this.syncMusic();
  },
  uniTap() {
    const u = $('#hub-uni'); u.classList.remove('jump'); void u.offsetWidth; u.classList.add('jump');
    const t = pick(UNI_PHRASES).replace('NOME', nameOr());
    const sp = $('#hub-speech'); sp.textContent = t; sp.classList.remove('hidden');
    clearTimeout(this.spT); this.spT = setTimeout(() => sp.classList.add('hidden'), 3500);
    Voice.say(t); Sound.magic();
    const [x, y] = centerOf(u); FX.hearts(x, y - 30, 6);
  }
};

/* Area genitori protetta da una piccola domanda */
const Parent = {
  open() {
    Sound.click();
    const a = randi(4, 9), b = randi(3, 9);
    Modal.show(`<div class="modal-title">Area genitori</div><p class="pp">Quanto fa ${a} × ${b}?</p>
      <input id="pp-ans" type="number" inputmode="numeric" class="pp-in">
      <div class="modal-actions"><button class="round-btn" id="pp-no">✖</button><button class="round-btn" id="pp-ok">✔</button></div>`, 'parent');
    $('#pp-no').onclick = () => Modal.hide();
    $('#pp-ok').onclick = () => { if (+$('#pp-ans').value === a * b) this.panel(); else { Sound.softPop(); Modal.hide(); } };
    $('#pp-ans').focus();
  },
  panel() {
    const d = Store.data;
    Modal.show(`<div class="modal-title">Area genitori</div>
      <label class="pp-row"><input type="checkbox" id="pp-voice" ${d.voice ? 'checked' : ''}> Voce narrante</label>
      <label class="pp-row"><input type="checkbox" id="pp-music" ${d.music ? 'checked' : ''}> Musica di sottofondo</label>
      <p class="pp-small">⭐ ${d.stars} stelline · 🃏 ${d.stickers.length}/${STICKERS.length} figurine · 📸 ${d.photos.length} foto</p>
      <div class="modal-actions"><button class="text-btn danger" id="pp-reset">Ricomincia da zero</button><button class="text-btn" id="pp-save">Salva</button></div>`, 'parent');
    $('#pp-save').onclick = () => {
      d.voice = $('#pp-voice').checked; d.music = $('#pp-music').checked;
      Store.save(); d.music ? Music.start() : Music.stop(); Modal.hide(); Hub.enter(); setSplashName();
    };
    $('#pp-reset').onclick = () => {
      const b = $('#pp-reset');
      if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Sicuro? Tocca ancora'; return; }
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
      location.reload();
    };
  }
};

/* Stelline decorative di sfondo */
function skyDeco() {
  const box = $('#sky-deco'); let h = '';
  for (let i = 0; i < 26; i++) h += `<span style="left:${rand(0, 100)}%;top:${rand(0, 100)}%;animation-delay:${rand(0, 4).toFixed(2)}s;font-size:${rand(10, 26).toFixed(0)}px">${pick(['✦', '✧', '⋆', '♡'])}</span>`;
  box.innerHTML = h;
}
function setSplashName() { $('#splash-name').textContent = 'di Camilla'; }

/* Avvio */
FX.init(); Voice.init(); Babbo.start(); skyDeco(); setSplashName();
$('#splash-uni').innerHTML = unicornSVG(Store.data.unicorn);
$('#play-btn').onclick = () => {
  Sound.init();
  const first = !Store.data.visits;
  Store.data.visits++; Store.save();
  try { if (matchMedia('(pointer: coarse)').matches && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
  Sound.magic(); FX.confetti();
  go('hub');
  Babbo.last = Date.now(); Babbo.toast();
  Voice.say(first
    ? `Ciao Camilla! Benvenuta nel tuo Regno Magico! Io sono Stellina, la tua unicorna. Questo regno l'ha fatto il tuo babbo per te, perché ti vuole tanto tanto bene! Tocca un gioco per cominciare!`
    : `Bentornata Camilla! Che bello rivederti! Il tuo babbo ti vuole tanto bene! ${Store.data.lastGift !== today() ? "Oggi c'è un regalo per te!" : ''}`);
};
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('visibilitychange', () => {
  if (!Sound.ctx) return;
  if (document.hidden) { Music.stop(); if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  else if (Store.data.music && current !== 'splash' && current !== 'piano') Music.start();
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
