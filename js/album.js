'use strict';
/* Album delle figurine e delle foto */
Games.album = {
  enter(stage) {
    this.stage = stage; this.tab = 'stk';
    stage.innerHTML = `<div class="album"><div class="album-tabs">
      <button class="atab" data-t="stk">🃏</button><button class="atab" data-t="pho">📸</button></div>
      <div class="album-head"></div><div class="album-grid"></div></div>`;
    $$('.atab', stage).forEach(b => b.onclick = () => { Sound.click(); this.tab = b.dataset.t; this.render(); });
    this.render();
    const n = Store.data.stickers.length;
    Voice.say(n ? `Hai ${n} figurine su ${STICKERS.length}! Gioca per trovarle tutte!` : 'Il tuo album è ancora vuoto. Gioca per vincere le figurine!');
  },
  exit() { this.stage.innerHTML = ''; },
  render() {
    $$('.atab', this.stage).forEach(b => b.classList.toggle('on', b.dataset.t === this.tab));
    const grid = $('.album-grid', this.stage), head = $('.album-head', this.stage);
    if (this.tab === 'stk') {
      const owned = new Set(Store.data.stickers);
      head.innerHTML = `<b>${owned.size}</b> / ${STICKERS.length} <div class="abar"><i style="width:${owned.size / STICKERS.length * 100}%"></i></div>`;
      grid.className = 'album-grid stickers';
      grid.innerHTML = STICKERS.map((s, i) => owned.has(i)
        ? `<button class="stk own ${s.r ? 'rare' : ''}" data-i="${i}">${s.e}</button>`
        : `<div class="stk empty">?</div>`).join('');
      $$('.stk.own', grid).forEach(b => b.onclick = () => {
        const s = STICKERS[+b.dataset.i];
        Sound.star(randi(0, 6)); Voice.say(s.n.charAt(0).toUpperCase() + s.n.slice(1) + (s.r ? ', rarissima!' : '!'));
        b.classList.remove('wig'); void b.offsetWidth; b.classList.add('wig');
        const [x, y] = centerOf(b); FX.sparkle(x, y, 10);
      });
    } else {
      const ph = Store.data.photos;
      head.innerHTML = ph.length ? `${ph.length} 📸` : 'Fai una foto a Stellina o salva un disegno! 📸';
      grid.className = 'album-grid photos';
      grid.innerHTML = ph.map((p, i) => `<button class="photo" data-i="${i}"><img src="${p}" alt=""></button>`).reverse().join('');
      $$('.photo', grid).forEach(b => b.onclick = () => this.view(+b.dataset.i));
    }
  },
  view(i) {
    Sound.click();
    Modal.show(`<img class="big-photo" src="${Store.data.photos[i]}" alt="">
      <div class="modal-actions"><button class="round-btn del" aria-label="Elimina">🗑️</button><button class="round-btn ok">✔</button></div>`, 'photo-view');
    $('#modal .ok').onclick = () => { Sound.click(); Modal.hide(); };
    $('#modal .del').onclick = () => {
      const b = $('#modal .del');
      if (!b.classList.contains('sure')) { b.classList.add('sure'); b.textContent = '❓'; Sound.softPop(); return; }
      Store.data.photos.splice(i, 1); Store.save(); Sound.whoosh(); Modal.hide(); this.render();
    };
  }
};
