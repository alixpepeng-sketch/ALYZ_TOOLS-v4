/* ============================================
   APP GENERATOR — ALIGHT MOTION PREMIUM
   Web Tools Version
   Flow: send-magiclink → verify-account → apply-premium
   ============================================ */

const ENDPOINT = 'https://anita-studio.netlify.app/.netlify/functions/amprem';
const COOLDOWN = 30;

/* ============ API CALL ============ */
async function apiPost(action, payload) {
  console.log('[AM-API] Request:', action, payload);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ action, ...payload })
    });

    console.log('[AM-API] Status:', res.status);

    const text = await res.text();
    console.log('[AM-API] Raw:', text.slice(0, 300));

    let data = null;
    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error('Response bukan JSON: ' + text.slice(0, 120));
    }

    if (!res.ok || (data && (data.error || data.success === false || data.status === false))) {
      const msg = (data && (data.error || data.message || data.msg)) || ('Server ' + res.status);
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error('[AM-API] Error:', err);
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error('Koneksi gagal. Kemungkinan CORS atau server mati.');
    }
    throw err;
  }
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

    <details style="margin-top:12px;border:2px solid #000;border-radius:12px;padding:10px;background:#f4f4f4;">
      <summary style="cursor:pointer;font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;">DEBUG LOG</summary>
      <pre id="amDebug" style="font-size:10px;font-family:SF Mono,Menlo,monospace;white-space:pre-wrap;word-break:break-all;max-height:180px;overflow:auto;margin-top:8px;line-height:1.4;"></pre>
    </details>
  `;

  const $ = (id) => body.querySelector('#' + id);
  const msg = $('amMsg');
  const result = $('amResult');
  const debug = $('amDebug');
  const inputEmail = $('amEmail');
  const inputLink = $('amLink');
  const btnNext = $('amNext');
  const btnVerify = $('amVerify');
  const btnApply = $('amApply');

  let savedEmail = '';
  let savedIdToken = '';

  function log(text) {
    const time = new Date().toLocaleTimeString('id-ID');
    debug.textContent += '[' + time + '] ' + text + '\n';
    debug.scrollTop = debug.scrollHeight;
  }

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

  const emailOk = (e) => /^[a-z0-9._%+-]+@gmail\.com$/i.test(e);

  log('Tool loaded. Endpoint: ' + ENDPOINT);

  /* ===== STEP 1 : KIRIM MAGIC LINK ===== */
  btnNext.onclick = async () => {
    const email = inputEmail.value.trim();
    msg.innerHTML = '';
    result.innerHTML = '';

    if (!emailOk(email)) {
      msg.innerHTML = '<div class="error">MASUKKAN EMAIL @GMAIL.COM YANG VALID</div>';
      log('ERROR: Email tidak valid: ' + email);
      return;
    }

    const wait = Math.ceil(COOLDOWN - (Date.now() - lastSent) / 1000);
    if (wait > 0) {
      msg.innerHTML = '<div class="error">TUNGGU ' + wait + ' DETIK LAGI</div>';
      log('Cooldown aktif, tunggu ' + wait + 's');
      return;
    }

    btnNext.disabled = true;
    msg.innerHTML = '<div class="loading">MENGIRIM MAGIC LINK...</div>';
    log('Mengirim magic link ke ' + email);

    try {
      const res = await sendMagicLink(email);
      log('SUKSES kirim magic link');
      log('Response: ' + JSON.stringify(res).slice(0, 200));

      lastSent = Date.now();
      savedEmail = email;
      inputEmail.disabled = true;
      inputLink.focus();
      btnVerify.disabled = false;
      msg.innerHTML = '<div class="result-box">Magic link terkirim ke <b>' + esc(email) + '</b>.<br>Cek inbox/spam → copy full URL verifikasi → paste di kolom bawah → klik VERIFIKASI.</div>';
    } catch (err) {
      log('GAGAL: ' + err.message);
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
      log('ERROR: Link kosong');
      return;
    }
    if (!savedEmail) {
      msg.innerHTML = '<div class="error">KIRIM MAGIC LINK DULU (STEP 1)</div>';
      log('ERROR: Belum step 1');
      return;
    }

    btnVerify.disabled = true;
    msg.innerHTML = '<div class="loading">VERIFIKASI AKUN...</div>';
    log('Verifikasi akun ' + savedEmail);
    log('Link: ' + link.slice(0, 80) + '...');

    try {
      const res = await verifyAccount(savedEmail, link);
      log('SUKSES verifikasi');
      log('Response keys: ' + Object.keys(res).join(', '));

      const idToken = res.idToken || (res.profile && res.profile.idToken);
      if (!idToken) {
        log('ERROR: idToken tidak ada di response');
        throw new Error('idToken tidak ditemukan di response');
      }

      savedIdToken = idToken;
      log('idToken diperoleh, panjang: ' + idToken.length);

      inputLink.disabled = true;
      btnApply.disabled = false;
      msg.innerHTML = '<div class="result-box">Akun <b>' + esc(savedEmail) + '</b> berhasil diverifikasi.<br>Klik tombol <b>AKTIFKAN PREMIUM</b> untuk lanjut.</div>';
    } catch (err) {
      log('GAGAL verifikasi: ' + err.message);
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
      log('ERROR: Step sebelumnya belum selesai');
      return;
    }

    btnApply.disabled = true;
    msg.innerHTML = '<div class="loading">MENGATIFKAN PREMIUM...</div>';
    log('Mengaktifkan premium untuk ' + savedEmail);

    try {
      const premium = await applyPremium(savedEmail, savedIdToken);
      log('SUKSES premium aktif');
      log('Response: ' + JSON.stringify(premium).slice(0, 200));

      msg.innerHTML = '';
      result.innerHTML =
        '<div class="check-circle" style="margin:14px auto;">&#10003;</div>' +
        '<h3 style="text-align:center;font-size:14px;font-weight:900;letter-spacing:2px;margin-bottom:6px;">PREMIUM AKTIF</h3>' +
        '<p style="text-align:center;font-size:12px;font-weight:700;margin-bottom:10px;">' + esc(savedEmail) + ' — 1 tahun</p>' +
        '<div class="result-box" style="font-family:SF Mono,Menlo,monospace;font-size:10px;max-height:150px;overflow:auto;">' + esc(JSON.stringify(premium, null, 2)) + '</div>';
    } catch (err) {
      log('GAGAL premium: ' + err.message);
      msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
      btnApply.disabled = false;
    }
  };
     }
