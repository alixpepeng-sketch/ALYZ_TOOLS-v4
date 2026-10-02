const API = 'https://www.tikwm.com/api/?url=';

export function openTikTokTool(body) {
  body.innerHTML = `
    <button id="back" class="back-btn"><span class="back-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></span><span>KEMBALI</span></button>
    <h3>TIKTOK DOWNLOADER</h3>
    <input id="url" class="input" type="text" placeholder="https://www.tiktok.com/..." autocomplete="off">
    <button id="go" class="btn">AMBIL</button>
    <div id="out"></div>`;

  const out = body.querySelector('#out');
  body.querySelector('#back').onclick = () => { body.style.display = 'none'; body.innerHTML = ''; };

  const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  body.querySelector('#go').onclick = async () => {
    const url = body.querySelector('#url').value.trim();
    if (!url) { out.innerHTML = '<div class="error">MASUKKAN LINK DULU</div>'; return; }
    out.innerHTML = '<div class="status"><span class="spin"></span>MEMPROSES...</div>';
    try {
      const res = await fetch(API + encodeURIComponent(url));
      const j = await res.json();
      const d = j && j.data;
      if (!d) throw new Error((j && j.msg) || 'Data tidak ditemukan');
      const file = d.hdplay || d.play;
      if (!file) throw new Error('Link video tidak tersedia');
      out.innerHTML = `<div class="result">${d.cover ? `<img src="${esc(d.cover)}" alt="cover">` : ''}<p>${esc(d.title)}</p><a class="btn" href="${esc(file)}" target="_blank" rel="noopener" download>DOWNLOAD VIDEO</a></div>`;
    } catch (err) {
      out.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
    }
  };
}
