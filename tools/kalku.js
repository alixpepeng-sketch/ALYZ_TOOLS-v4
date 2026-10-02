export function openKalkuTool(body) {
  const keys = ['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='];
  const ops = ['C','DEL','%','/','*','-','+','='];
  body.innerHTML = `
    <button id="back" class="back-btn"><span class="back-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></span><span>KEMBALI</span></button>
    <h3>KALKULATOR</h3>
    <div class="calc-display" id="disp">0</div>
    <div class="calc-grid">${keys.map((k) =>
      `<button data-k="${k}" class="${ops.includes(k) ? 'op' : ''} ${k === '=' ? 'wide' : ''}">${k}</button>`).join('')}
    </div>`;

  const disp = body.querySelector('#disp');
  let expr = '';
  const show = () => { disp.textContent = expr || '0'; };

  body.querySelector('#back').onclick = () => { body.style.display = 'none'; body.innerHTML = ''; };

  body.querySelectorAll('.calc-grid button').forEach((b) => {
    b.onclick = () => {
      const k = b.dataset.k;
      if (k === 'C') expr = '';
      else if (k === 'DEL') expr = expr.slice(0, -1);
      else if (k === '=') {
        try {
          const clean = expr.replace(/%/g, '/100');
          if (!clean || !/^[0-9+\-*/.()\s]+$/.test(clean) || clean.includes('//')) throw 0;
          const r = Function('"use strict";return (' + clean + ')')();
          if (!Number.isFinite(r)) throw 0;
          expr = String(Math.round(r * 1e10) / 1e10);
        } catch (e) { expr = ''; disp.textContent = 'ERROR'; return; }
      } else expr += k;
      show();
    };
  });
}
