export function openAimtkTool(body) {
  body.innerHTML = `
    <button id="back" class="back-btn"><span class="back-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></span><span>KEMBALI</span></button>
    <h3>AI MTK</h3>
    <div class="quick">
      <button data-q="25*4">25*4</button>
      <button data-q="100/4">100/4</button>
      <button data-q="12*12-24">12*12-24</button>
    </div>
    <div id="aiBox" class="chatbox" style="height:50vh"></div>
    <div class="row">
      <input id="aiInput" class="input" type="text" placeholder="Ketik hitungan atau tanya matematika..." autocomplete="off">
      <button id="aiSend" class="btn btn-inline">Kirim</button>
    </div>`;

  const box = body.querySelector('#aiBox');
  const input = body.querySelector('#aiInput');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  body.querySelector('#back').onclick = () => { body.style.display = 'none'; body.innerHTML = ''; };

  const add = (who, text) => {
    const d = document.createElement('div');
    d.className = 'msg ' + (who === 'user' ? 'me' : 'other');
    d.innerHTML = `<b>${who === 'user' ? 'KAMU' : 'AI MTK'}</b>${esc(text)}`;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
  };

  const chatReply = (t) => {
    const s = t.toLowerCase();
    if (/^(halo|hai|hi|hello|p)\b/.test(s)) return 'Halo! Saya AI MTK. Kirim hitungan seperti 25*4, atau tanya soal matematika.';
    if (s.includes('akar')) return 'Akar kuadrat dari x adalah bilangan yang jika dikuadratkan menghasilkan x. Contoh: akar 144 = 12 karena 12*12 = 144.';
    if (s.includes('persen')) return 'Persen berarti per seratus. Rumus: bagian = (persen / 100) * total. Contoh: 20% dari 150 = 20/100*150 = 30.';
    if (s.includes('luas') && s.includes('persegi panjang')) return 'Luas persegi panjang = panjang * lebar. Keliling = 2 * (panjang + lebar).';
    if (s.includes('luas') && s.includes('persegi')) return 'Luas persegi = sisi * sisi. Keliling = 4 * sisi.';
    if (s.includes('luas') && s.includes('lingkaran')) return 'Luas lingkaran = pi * r * r (pi = 3,14 atau 22/7). Keliling = 2 * pi * r.';
    if (s.includes('luas') && s.includes('segitiga')) return 'Luas segitiga = 1/2 * alas * tinggi.';
    if (s.includes('keliling')) return 'Keliling adalah jumlah panjang semua sisi bangun datar. Sebutkan bangunnya, nanti saya jelaskan rumusnya.';
    if (s.includes('pythagoras')) return 'Teorema Pythagoras: a*a + b*b = c*c, dengan c sisi miring segitiga siku-siku. Contoh 3, 4 -> 5.';
    if (s.includes('faktorial')) return 'Faktorial n! = n * (n-1) * ... * 1. Contoh: 5! = 5*4*3*2*1 = 120.';
    if (s.includes('prima')) return 'Bilangan prima hanya punya dua faktor: 1 dan dirinya sendiri. Contoh: 2, 3, 5, 7, 11, 13.';
    if (s.includes('kpk') || s.includes('fpb')) return 'KPK: kelipatan persekutuan terkecil. FPB: faktor persekutuan terbesar. Cari lewat faktorisasi prima dari tiap bilangan.';
    if (s.includes('pecahan')) return 'Penjumlahan pecahan: samakan penyebut dulu, lalu jumlahkan pembilangnya. Contoh: 1/2 + 1/3 = 3/6 + 2/6 = 5/6.';
    if (s.includes('terima kasih') || s.includes('makasih')) return 'Sama-sama! Kirim soal lain kapan saja.';
    return 'Saya hanya paham matematika. Coba kirim hitungan (contoh: 12*12-24) atau tanya: akar, persen, luas, keliling, pythagoras, faktorial, prima, KPK/FPB, pecahan.';
  };

  const handle = (raw) => {
    const t = raw.trim();
    if (!t) return;
    add('user', t);
    if (t.includes('+')) {
      add('ai', 'ERROR: operator yang diizinkan HANYA * - /');
      return;
    }
    if (/^[0-9\s*\-\/.()]+$/.test(t)) {
      if (t.includes('//')) { add('ai', 'ERROR: format hitungan tidak valid'); return; }
      try {
        const r = Function('"use strict";return (' + t + ')')();
        if (typeof r !== 'number' || !Number.isFinite(r)) throw new Error();
        add('ai', t + ' = ' + (Math.round(r * 1e10) / 1e10));
      } catch (e) {
        add('ai', 'ERROR: hitungan tidak valid');
      }
      return;
    }
    add('ai', chatReply(t));
  };

  const send = () => { const v = input.value; input.value = ''; handle(v); };
  body.querySelector('#aiSend').onclick = send;
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
  body.querySelectorAll('.quick button').forEach((b) => (b.onclick = () => handle(b.dataset.q)));

  add('ai', 'Halo! Kirim hitungan (* - /) atau tanya soal matematika.');
}
