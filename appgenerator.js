const ENDPOINT = 'https://anita-studio.netlify.app/.netlify/functions/amprem';
const COOLDOWN = 30; // detik jeda antar kirim magic link

// Sesuaikan 2 fungsi ini dengan format request/response API amprem yang sebenarnya.
async function sendMagicLink(email) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'send', email })
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* respon bukan JSON */ }
  if (!res.ok || (data && (data.error || data.success === false || data.status === false))) {
    throw new Error((data && (data.error || data.message || data.msg)) || ('Server membalas ' + res.status));
  }
  return data;
}

async function confirmMagicLink(email, link) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', email, link })
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* respon bukan JSON */ }
  if (!res.ok || (data && (data.error || data.success === false || data.status === false))) {
    throw new Error((data && (data.error || data.message || data.msg)) || ('Server membalas ' + res.status));
  }
  return data;
}

let lastSent = 0;

export function openAppGeneratorTool(body) {
  body.innerHTML = `
    <button id="back" class="back-btn"><span class="back-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></span><span>KEMBALI</span></button>
    <h3>APP GENERATOR</h3>
    <div id="step"></div>`;

  const step = body.querySelector('#step');
  body.querySelector('#back').onclick = () => { body.style.display = 'none'; body.innerHTML = ''; };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const emailOk = (e) => /^[a-z0-9._%+-]+@gmail\.com$/i.test(e);

  function stepEmail(prefill = '') {
    step.innerHTML = `
      <p class="label" style="margin-bottom:10px">LANGKAH 1 DARI 2</p>
      <input id="email" class="input" type="email" placeholder="emailkamu@gmail.com" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(prefill)}">
      <div id="msg"></div>
      <button id="next" class="btn">KIRIM MAGIC LINK</button>`;

    const msg = step.querySelector('#msg');
    const btn = step.querySelector('#next');

    const go = async () => {
      const email = step.querySelector('#email').value.trim();
      if (!emailOk(email)) {
        msg.innerHTML = '<div class="error">MASUKKAN EMAIL @GMAIL.COM YANG VALID</div>';
        return;
      }
      const wait = Math.ceil(COOLDOWN - (Date.now() - lastSent) / 1000);
      if (wait > 0) { msg.innerHTML = `<div class="error">TUNGGU ${wait} DETIK LAGI</div>`; return; }

      btn.disabled = true;
      msg.innerHTML = '<div class="status"><span class="spin"></span>MENGIRIM MAGIC LINK...</div>';
      try {
        await sendMagicLink(email);
        lastSent = Date.now();
        stepLink(email);
      } catch (err) {
        msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
        btn.disabled = false;
      }
    };

    btn.onclick = go;
    step.querySelector('#email').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  function stepLink(email) {
    step.innerHTML = `
      <p class="label" style="margin-bottom:10px">LANGKAH 2 DARI 2</p>
      <div class="chip" style="display:inline-block;margin-bottom:14px">${esc(email)}</div>
      <p style="font-size:13px;font-weight:600;margin-bottom:14px">Magic link sudah dikirim. Buka email, salin link-nya, lalu tempel di bawah ini.</p>
      <input id="link" class="input" type="text" placeholder="Tempel magic link di sini" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div id="msg"></div>
      <button id="confirm" class="btn">CONFIRM</button>
      <button id="resend" class="btn btn-light">KIRIM ULANG</button>`;

    const msg = step.querySelector('#msg');
    const btn = step.querySelector('#confirm');

    step.querySelector('#resend').onclick = () => stepEmail(email);

    btn.onclick = async () => {
      const link = step.querySelector('#link').value.trim();
      if (!link) { msg.innerHTML = '<div class="error">TEMPEL MAGIC LINK DULU</div>'; return; }

      btn.disabled = true;
      msg.innerHTML = '<div class="status"><span class="spin"></span>MENGONFIRMASI...</div>';
      try {
        await confirmMagicLink(email, link);
        msg.innerHTML = '<div class="result"><p>BERHASIL DIKONFIRMASI</p></div>';
      } catch (err) {
        msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
      }
      btn.disabled = false;
    };
  }

  stepEmail();
}
