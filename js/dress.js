'use strict';
/* Vesti Stellina */
const DRESS_TABS = [
  { id: 'body', icon: '🎨', say: 'Il colore di Stellina' },
  { id: 'mane', icon: '💇', say: 'La criniera' },
  { id: 'horn', icon: '🦄', say: 'Il corno magico' },
  { id: 'acc', icon: '👑', say: 'Gli accessori' },
  { id: 'mark', icon: '⭐', say: 'Il simbolo magico' },
  { id: 'bg', icon: '🏞️', say: 'Lo sfondo' }
];
const ACC_SAY = { corona: 'La corona!', fiocco: 'Il fiocco!', occhiali: 'Gli occhiali a cuore!', collana: 'La collana!', fiore: 'Il fiore!', ali: 'Le ali!', brillantini: 'I brillantini!' };

Games.dress = {
  enter(stage) {
    this.stage = stage; this.tab = 'body';
    stage.innerHTML = `<div class="dress">
      <div class="dress-preview"><div class="dress-deco"></div><div class="dress-uni"></div>
        <div class="dress-btns"><button class="round-btn" data-a="rnd" aria-label="Magia a caso">🎲</button><button class="round-btn cam" data-a="photo" aria-label="Foto">📸</button></div>
      </div>
      <div class="dress-panel"><div class="dress-tabs"></div><div class="dress-opts"></div></div>
    </div>`;
    $('[data-a=rnd]', stage).onclick = () => this.random();
    $('[data-a=photo]', stage).onclick = () => this.photo();
    $('.dress-tabs', stage).innerHTML = DRESS_TABS.map(t => `<button class="tab" data-t="${t.id}">${t.icon}</button>`).join('');
    $$('.tab', stage).forEach(b => b.onclick = () => { Sound.click(); this.tab = b.dataset.t; Voice.say(DRESS_TABS.find(t => t.id === this.tab).say); this.renderOpts(); });
    this.render(); this.renderOpts();
    Voice.say('Facciamo bellissima Stellina! Scegli i colori e gli accessori!');
  },
  exit() { this.stage.innerHTML = ''; },
  render(anim) {
    const u = Store.data.unicorn;
    const box = $('.dress-uni', this.stage);
    box.innerHTML = unicornSVG(u);
    $('.dress-preview', this.stage).style.background = bgCSS(u.bg);
    $('.dress-deco', this.stage).innerHTML = bgDecoHTML(u.bg);
    if (anim) { box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop'); }
  },
  renderOpts() {
    const u = Store.data.unicorn, t = this.tab, box = $('.dress-opts', this.stage);
    $$('.tab', this.stage).forEach(b => b.classList.toggle('on', b.dataset.t === t));
    let items = [];
    if (t === 'body') items = Object.entries(UNI.body).map(([k, c]) => ({ k, html: '', style: `background:${c}`, on: u.body === k }));
    if (t === 'mane') items = Object.entries(UNI.mane).map(([k, c]) => ({ k, html: '', style: `background:linear-gradient(135deg,${c.join(',')})`, on: u.mane === k }));
    if (t === 'horn') items = Object.entries(UNI.horn).map(([k, c]) => ({ k, html: '', style: c ? `background:linear-gradient(135deg,${c[0]},${c[1]})` : 'background:linear-gradient(135deg,#ff6b9d,#ffe066,#69db7c,#4dabf7,#b197fc)', on: u.horn === k }));
    if (t === 'acc') items = Object.entries(UNI.accs).map(([k, e]) => ({ k, html: e, on: u.acc.includes(k) }));
    if (t === 'mark') items = Object.entries(UNI.marks).map(([k, e]) => ({ k, html: e, on: u.mark === k }));
    if (t === 'bg') items = Object.entries(UNI.bgs).map(([k, b]) => ({ k, html: b.icon, style: `background:linear-gradient(${b.g[0]},${b.g[1]})`, on: u.bg === k }));
    box.innerHTML = items.map(i => `<button class="opt ${i.on ? 'on' : ''}" data-k="${i.k}" style="${i.style || ''}">${i.html}</button>`).join('');
    $$('.opt', box).forEach(b => b.onclick = () => this.choose(b.dataset.k, b));
  },
  choose(k, btn) {
    const u = Store.data.unicorn, t = this.tab;
    if (t === 'acc') {
      const i = u.acc.indexOf(k);
      if (i >= 0) { u.acc.splice(i, 1); Sound.softPop(); }
      else { u.acc.push(k); Voice.say(ACC_SAY[k]); }
    } else {
      u[t] = k;
      if (t !== 'bg' && t !== 'mark') Voice.say(k.charAt(0).toUpperCase() + k.slice(1) + '!');
    }
    Store.save();
    Sound.bell(NF(pick(['C6', 'E6', 'G6', 'A6'])), 0.6, 0.2);
    const [x, y] = centerOf($('.dress-uni', this.stage)); FX.sparkle(x, y, 14);
    if (btn) { const [bx, by] = centerOf(btn); FX.sparkle(bx, by, 6); }
    this.render(true); this.renderOpts();
  },
  random() {
    const u = Store.data.unicorn;
    u.body = pick(Object.keys(UNI.body)); u.mane = pick(Object.keys(UNI.mane)); u.horn = pick(Object.keys(UNI.horn));
    u.mark = pick(Object.keys(UNI.marks).slice(1)); u.bg = pick(Object.keys(UNI.bgs));
    u.acc = shuffle(Object.keys(UNI.accs)).slice(0, randi(1, 4));
    Store.save(); Sound.magic();
    const [x, y] = centerOf($('.dress-uni', this.stage)); FX.burst(x, y, { n: 30 });
    Voice.say(pick(['Abracadabra!', 'Magia!', 'Bidibi bodibi bu!']));
    this.render(true); this.renderOpts();
  },
  async photo() {
    Sound.shutter();
    const pv = $('.dress-preview', this.stage);
    pv.classList.remove('flash'); void pv.offsetWidth; pv.classList.add('flash');
    const S = 600, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
    const c = cv.getContext('2d');
    paintBg(c, Store.data.unicorn.bg, S, S);
    const img = await loadImg(svgUrl(unicornSVG(Store.data.unicorn, { size: 480 })));
    c.drawImage(img, 60, 70, 480, 480);
    c.lineWidth = 18; c.strokeStyle = '#fff'; c.strokeRect(9, 9, S - 18, S - 18);
    Store.data.photos.push(cv.toDataURL('image/jpeg', 0.82));
    while (Store.data.photos.length > 16) Store.data.photos.shift();
    Store.save(); addStars(1);
    Voice.say('Che bella foto! L\'ho messa nel tuo album!' + Babbo.line(0.5));
  }
};
