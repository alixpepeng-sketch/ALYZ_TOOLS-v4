/* ============================================
   APP GENERATOR — ALIGHT MOTION PREMIUM
   Match dengan CSS neubrutalism style kamu
   ============================================ */

const ENDPOINT = 'https://anita-studio.netlify.app/.netlify/functions/amprem';
const COOLDOWN = 30;

/* ============ API ============ */
async function apiPost(action, payload) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok || (data && (data.error || data.success === false))) {
    const msg = (data && (data.error || data.message || data.msg)) || ('Server ' + res.status);
    throw new Error(msg);
  }
  return data;
}

const sendMagicLink = (email) => apiPost('send-magiclink', { email });
const verifyAccount = (email, rawLink) => apiPost('verify-account', { email, rawLink });
const applyPremium = (email, idToken) => apiPost('apply-premium', { email, idToken });

/* ============ STATE ============ */
let lastSent = 0;

/* ============ MAIN ============ */
export function openAppGeneratorTool(body) {
  body.innerHTML = `
    <button id="amgBack" class="back-btn">
      <span class="back-ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </span>
      <span>KEMBALI</span>
    </button>

    <h3>APP GENERATOR</h3>

    <div class="amg-steps" id="amgSteps">
      <span class="amg-dot active"></span>
      <span class="amg-dot"></span>
      <span class="amg-dot"></span>
    </div>

    <div class="card" id="amgCard"></div>

    <div id="amgResult"></div>
  `;

  const $ = (sel) => body.querySelector(sel);
  const card = $('#amgCard');
  const dots = body.querySelectorAll('.amg-dot');
  const result = $('#amgResult');

  const backBtn = $('#amgBack');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      body.classList.add('closing');
      setTimeout(() => {
        body.classList.remove('open', 'closing');
        body.innerHTML = '';
      }, 240);
    });
  }

  let savedEmail = '';
  let savedIdToken = '';

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

  function setStep(n) {
    dots.forEach((d, i) => {
      d.classList.remove('active', 'done');
      if (i + 1 < n) d.classList.add('done');
      else if (i + 1 === n) d.classList.add('active');
    });
  }

  /* ============ STEP 1 ============ */
  function step1(prefill = '') {
    setStep(1);
    card.innerHTML = `
      <div class="label" style="margin-bottom:10px">LANGKAH 1 DARI 3</div>
      <input id="amgEmail" class="input" type="email" placeholder="emailkamu@gmail.com" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(prefill)}">
      <div id="amgMsg"></div>
      <button id="amgNext" class="btn">KIRIM MAGIC LINK</button>
    `;

    const msg = $('#amgMsg');
    const btn = $('#amgNext');
    const emailInput = $('#amgEmail');

    const go = async () => {
      const email = emailInput.value.trim();
      msg.innerHTML = '';

      if (!/^[a-z0-9._%+-]+@gmail\.com$/i.test(email)) {
        msg.innerHTML = '<div class="error">MASUKKAN EMAIL @GMAIL.COM YANG VALID</div>';
        return;
      }

      const wait = Math.ceil(COOLDOWN - (Date.now() - lastSent) / 1000);
      if (wait > 0) {
        msg.innerHTML = `<div class="error">TUNGGU ${wait} DETIK LAGI</div>`;
        return;
      }

      btn.disabled = true;
      btn.textContent = 'MENGIRIM...';
      msg.innerHTML = '<div class="status"><span class="spin"></span>MENGIRIM MAGIC LINK</div>';

      try {
        await sendMagicLink(email);
        lastSent = Date.now();
        savedEmail = email;
        setTimeout(() => step2(), 400);
      } catch (err) {
        msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
        btn.disabled = false;
        btn.textContent = 'KIRIM MAGIC LINK';
      }
    };

    btn.addEventListener('click', go);
    emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  /* ============ STEP 2 ============ */
  function step2() {
    setStep(2);
    card.innerHTML = `
      <div class="label" style="margin-bottom:10px">LANGKAH 2 DARI 3</div>
      <div class="big" style="font-size:14px;margin-bottom:14px">${esc(savedEmail)}</div>
      <p style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:14px">Magic link sudah dikirim. Buka email → salin URL verifikasi → tempel di bawah.</p>
      <input id="amgLink" class="input" type="text" placeholder="tempel magic link di sini" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div id="amgMsg2"></div>
      <button id="amgVerify" class="btn">VERIFIKASI</button>
      <button id="amgResend" class="btn btn-light">KIRIM ULANG</button>
    `;

    const msg = $('#amgMsg2');
    const btn = $('#amgVerify');
    const inputLink = $('#amgLink');

    $('#amgResend').addEventListener('click', () => step1(savedEmail));

    btn.addEventListener('click', async () => {
      const link = inputLink.value.trim();
      msg.innerHTML = '';

      if (!link) {
        msg.innerHTML = '<div class="error">TEMPEL MAGIC LINK DULU</div>';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'VERIFIKASI...';
      msg.innerHTML = '<div class="status"><span class="spin"></span>MEMVERIFIKASI AKUN</div>';

      try {
        const res = await verifyAccount(savedEmail, link);
        const idToken = res.idToken || (res.profile && res.profile.idToken);
        if (!idToken) throw new Error('idToken tidak ditemukan');
        savedIdToken = idToken;
        setTimeout(() => step3(), 400);
      } catch (err) {
        msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
        btn.disabled = false;
        btn.textContent = 'VERIFIKASI';
      }
    });
  }

  /* ============ STEP 3 ============ */
  function step3() {
    setStep(3);
    card.innerHTML = `
      <div class="label" style="margin-bottom:10px">LANGKAH 3 DARI 3</div>
      <div class="big" style="font-size:14px;margin-bottom:4px">${esc(savedEmail)}</div>
      <div style="font-size:11px;font-weight:900;letter-spacing:2px;margin-bottom:16px">STATUS: VERIFIED</div>
      <div id="amgMsg3"></div>
      <button id="amgApply" class="btn">AKTIFKAN PREMIUM</button>
    `;

    const msg = $('#amgMsg3');
    const btn = $('#amgApply');

    btn.addEventListener('click', async () => {
      msg.innerHTML = '';
      btn.disabled = true;
      btn.textContent = 'MEMPROSES...';
      msg.innerHTML = '<div class="status"><span class="spin"></span>MENGATIFKAN PREMIUM</div>';

      try {
        const premium = await applyPremium(savedEmail, savedIdToken);
        done(premium);
      } catch (err) {
        msg.innerHTML = '<div class="error">GAGAL: ' + esc(err.message) + '</div>';
        btn.disabled = false;
        btn.textContent = 'AKTIFKAN PREMIUM';
      }
    });
  }

  /* ============ DONE ============ */
  function done(premium) {
    setStep(4);
    card.innerHTML = `
      <div style="text-align:center;padding:6px 0 4px">
        <div style="width:70px;height:70px;margin:0 auto 14px;border:3px solid #000;border-radius:50%;display:grid;place-items:center;font-size:34px;font-weight:900;box-shadow:5px 5px 0 #000">&#10003;</div>
        <div style="font-size:18px;font-weight:900;letter-spacing:-.3px;margin-bottom:4px">PREMIUM AKTIF</div>
        <div style="font-size:12px;font-weight:700;margin-bottom:14px">${esc(savedEmail)} — 1 TAHUN</div>
      </div>
    `;

    result.innerHTML = `
      <div class="result">
        <div class="label" style="margin-bottom:8px">RESPONSE</div>
        <p style="font-family:SF Mono,Menlo,monospace;font-size:11px;line-height:1.5">${esc(JSON.stringify(premium, null, 2))}</p>
      </div>
      <button id="amgDone" class="btn" style="margin-top:14px">SELESAI</button>
    `;

    $('#amgDone').addEventListener('click', () => {
      body.classList.add('closing');
      setTimeout(() => {
        body.classList.remove('open', 'closing');
        body.innerHTML = '';
      }, 240);
    });
  }

  step1();
         }
