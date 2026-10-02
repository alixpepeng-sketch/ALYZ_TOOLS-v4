/* ============================================
   APP GENERATOR — ALIGHT MOTION PREMIUM
   Web Tools Version (fetch + ES Module)
   Flow: send-magiclink → verify-account → apply-premium
   ============================================ */

const ENDPOINT = 'https://anita-studio.netlify.app/.netlify/functions/amprem';
const COOLDOWN = 30; // detik jeda antar kirim magic link

/* ============ API CALL ============ */
async function apiPost(action, payload) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok || (data && (data.error || data.success === false || data.status === false))) {
    const msg =
      (data && (data.error || data.message || data.msg)) ||
      ('Server membalas ' + res.status);
    throw new Error(msg);
  }
  return data;
}

async function sendMagicLink(email) {
  return apiPost('send-magiclink', { email });
}

async function verifyAccount(email, rawLink) {
  return apiPost('verify-account', { email, rawLink });
}

async function applyPremium(email, idToken) {
  return apiPost('apply-premium', { email, idToken });
}

/* ============ STATE ============ */
let lastSent = 0;

/* ============ MAIN EXPORT ============ */
export function openAppGeneratorTool(body) {
  body.innerHTML = `
    <div class="field-block">
      <label>EMAIL @GMAIL.COM</label>
      <input id="amEmail" type="email" placeholder="emailkamu@gmail.com" autocomplete="off" autocapitalize="off" spellcheck="false">
    </div>
    <div id="amMsg"></div>
    <button id="amNext" class="btn btn-primary" type="button">1. KIRIM MAGIC LINK</button>
    <div class="field-block" style="margin-top:10px">
      <label>RAW MAGIC LINK (dari email)</label>
      <textarea id="amLink" rows="3" placeholder="https://..." autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    </div>
    <button id="amVerify" class="btn btn-outline" type="button" disabled>2. VERIFIKASI</button>
    <button id="amApply" class="btn btn-primary" type="button" disabled style="margin-top:8px;">3. AKTIFKAN PREMIUM</button>
    <div id="amResult"></div>
  `;

  const $ = (id) => body.querySelector('#' + id);
  const msg = $('amMsg');
  const result = $('amResult');
  const inputEmail = $('amEmail');
  const inputLink = $('amLink');
  const btnNext = $('amNext');
  const btnVerify = $('amVerify');
  const btnApply = $('amApply');

  let savedEmail = '';
  let savedIdToken = '';

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

  const emailOk = (e) => /^[a-z0-9._%+-]+@gmail\.com$/i.test(e);

  /* ===== STEP 1 : KIRIM MAGIC LINK ===== */
  btnNext.onclick = async () => {
    const email = inputEmail.value.trim();
    msg.innerHTML = '';
    result.innerHTML = '';

    if (!emailOk(email)) {
      msg.innerHTML = '<div class="error">MASUKKAN EMAIL @GMAIL.COM YANG VALID</div>';
      return;
    }

    const wait = Math.ceil(COOLDOWN - (Date.now() - lastSent) / 1000);
    if (wait > 0) {
      msg.innerHTML = '<div class="error">TUNGGU ' + wait + ' DETIK LAGI</div>';
      return;
    }

    btnNext.disabled = true;
    msg.innerHTML = '<div class="loading">MENGIRIM MAGIC LINK...</div>';

    try {
      await sendMagicLink(email);
      lastSent = Date.now();
      savedEmail = email;
      inputEmail.disabled = true;
      inputLink.focus();
      btnVerify.disabled = false;
      msg.innerHTML = '<div class="result-box">Magic link terkirim ke <b>' + esc(email) + '</b>.<br>Cek inbox/spam → copy full URL → paste di kolom bawah → klik VERIFIKASI.</div>';
    } catch (err) {
      msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
      btnNext.disabled = false;
    }
  };

  /* ===== STEP 2 : VERIFIKASI ===== */
  btnVerify.onclick = async () => {
    const link = inputLink.value.trim();
    msg.innerHTML = '';
    result.innerHTML = '';

    if (!link) {
      msg.innerHTML = '<div class="error">TEMPEL RAW MAGIC LINK DULU</div>';
      return;
    }
    if (!savedEmail) {
      msg.innerHTML = '<div class="error">KIRIM MAGIC LINK DULU (STEP 1)</div>';
      return;
    }

    btnVerify.disabled = true;
    msg.innerHTML = '<div class="loading">VERIFIKASI AKUN...</div>';

    try {
      const res = await verifyAccount(savedEmail, link);
      const idToken = res.idToken || (res.profile && res.profile.idToken);
      if (!idToken) throw new Error('idToken tidak ditemukan di response');

      savedIdToken = idToken;
      inputLink.disabled = true;
      btnApply.disabled = false;
      msg.innerHTML = '<div class="result-box">Akun <b>' + esc(savedEmail) + '</b> berhasil diverifikasi.<br>Klik tombol <b>AKTIFKAN PREMIUM</b> untuk lanjut.</div>';
    } catch (err) {
      msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
      btnVerify.disabled = false;
    }
  };

  /* ===== STEP 3 : APPLY PREMIUM ===== */
  btnApply.onclick = async () => {
    msg.innerHTML = '';
    result.innerHTML = '';

    if (!savedEmail || !savedIdToken) {
      msg.innerHTML = '<div class="error">SELESAIKAN STEP 1 & 2 DULU</div>';
      return;
    }

    btnApply.disabled = true;
    msg.innerHTML = '<div class="loading">MENGATIFKAN PREMIUM...</div>';

    try {
      const premium = await applyPremium(savedEmail, savedIdToken);
      msg.innerHTML = '';
      result.innerHTML =
        '<div class="check-circle" style="margin:14px auto;">&#10003;</div>' +
        '<h3 style="text-align:center;font-size:14px;font-weight:900;letter-spacing:2px;margin-bottom:6px;">PREMIUM AKTIF</h3>' +
        '<p style="text-align:center;font-size:12px;font-weight:700;margin-bottom:10px;">' + esc(savedEmail) + ' — 1 tahun</p>' +
        '<div class="result-box" style="font-family:SF Mono,Menlo,monospace;font-size:10px;max-height:150px;overflow:auto;">' + esc(JSON.stringify(premium, null, 2)) + '</div>';
    } catch (err) {
      msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
      btnApply.disabled = false;
    }
  };
    }
