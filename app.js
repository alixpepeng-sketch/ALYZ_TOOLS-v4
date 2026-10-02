import { openTikTokTool } from './tools/tiktok.js';
import { openYtTool } from './tools/yt.js';
import { openPinTool } from './tools/pin.js';
import { openTikMp3Tool } from './tools/tikmp3.js';
import { openYtMp3Tool } from './tools/ytmp3.js';
import { openKalkuTool } from './tools/kalku.js';
import { openAimtkTool } from './tools/aimtk.js';
import { openAppGeneratorTool } from './appgenerator.js';

const $ = (s) => document.querySelector(s);
const USER_KEY = 'alyz_user';
const CHAT_KEY = 'alyz_chats';

const TOOLS = [
  { n: '01', name: 'TIKTOK', desc: 'Download video', fn: openTikTokTool },
  { n: '02', name: 'YOUTUBE', desc: 'Download video', fn: openYtTool },
  { n: '03', name: 'PINTEREST', desc: 'Download media', fn: openPinTool },
  { n: '04', name: 'TIKTOK MP3', desc: 'Ambil audio', fn: openTikMp3Tool },
  { n: '05', name: 'YOUTUBE MP3', desc: 'Ambil audio', fn: openYtMp3Tool },
  { n: '06', name: 'KALKULATOR', desc: 'Hitung cepat', fn: openKalkuTool },
  { n: '07', name: 'AI MTK', desc: 'Chat matematika', fn: openAimtkTool },
  { n: '08', name: 'APP GENERATOR', desc: 'Segera hadir', fn: openAppGeneratorTool }
];

/* ---------- LOGIN ---------- */
function getUser() {
  try { return localStorage.getItem(USER_KEY); } catch (e) { return null; }
}

function showError(msg) {
  $('#loginError').innerHTML = `<div class="error">${msg}</div>`;
}

function doLogin(name) {
  name = (name || '').trim();
  if (!(name.startsWith('@') && name.length >= 3)) {
    showError('USERNAME HARUS DIAWALI @');
    return;
  }
  localStorage.setItem(USER_KEY, name);
  enterApp();
}

const rand = (n) => Math.floor(Math.random() * Math.pow(10, n)).toString().padStart(n, '0');

$('#btnLogin').onclick = () => doLogin($('#username').value);
$('#username').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin($('#username').value); });
$('#btnGuest').onclick = () => doLogin('@guest' + rand(3));
$('#btnGoogle').onclick = () => doLogin('@google' + rand(4));

function enterApp() {
  $('#loginView').style.display = 'none';
  $('#appView').style.display = 'block';
  $('#profName').textContent = getUser();
  $('#userChip').textContent = getUser();
  $('#avatar').textContent = getUser().charAt(1).toUpperCase();
  switchTab('tools');
  renderChat();
}

/* ---------- TOOLS GRID ---------- */
const IC = [
  '<rect x="7" y="2.5" width="10" height="19" rx="3"/><path d="M11 10v4l3-2z"/>',
  '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>',
  '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.5"/>',
  '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  '<path d="M4 15v-3a8 8 0 0116 0v3"/><rect x="3" y="14" width="4" height="7" rx="2"/><rect x="17" y="14" width="4" height="7" rx="2"/>',
  '<rect x="5" y="2.5" width="14" height="19" rx="3"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path d="M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/>',
  '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
  '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>'
];
const tb = $('#toolBody');
function openTool(fn) {
  tb.classList.remove('closing', 'open');
  tb.style.display = 'block';
  tb.scrollTop = 0;
  void tb.offsetWidth;
  tb.classList.add('open');
  fn(tb);
}
function closeTool() {
  if (tb.classList.contains('closing')) return;
  tb.classList.add('closing');
  setTimeout(() => { tb.style.display = 'none'; tb.innerHTML = ''; tb.classList.remove('closing', 'open'); }, 250);
}
tb.addEventListener('click', (e) => {
  if (e.target.closest('#back')) { e.stopPropagation(); closeTool(); }
}, true);

const grid = $('#toolGrid');
TOOLS.forEach((t, i) => {
  const b = document.createElement('button');
  b.className = 'tool';
  b.style.setProperty('--i', i);
  b.innerHTML = `<span class="tool-top"><span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${IC[i]}</svg></span><span class="num">${t.n}</span></span><span><span class="name">${t.name}</span><span class="desc">${t.desc}</span></span>`;
  b.onclick = () => openTool(t.fn);
  grid.appendChild(b);
});

document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) { try { navigator.vibrate && navigator.vibrate(6); } catch (_) {} }
});

/* ---------- NAV ---------- */
const TABS = ['tools', 'chat', 'profil'];
function switchTab(tab) {
  const map = { tools: '#tabTools', chat: '#tabChat', profil: '#tabProfil' };
  Object.values(map).forEach((s) => { $(s).style.display = 'none'; $(s).classList.remove('show'); });
  const el = $(map[tab]);
  el.style.display = 'block';
  void el.offsetWidth;
  el.classList.add('show');
  $('#nav').style.setProperty('--i', TABS.indexOf(tab));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  if (tab === 'chat') renderChat();
  tb.style.display = 'none';
  tb.innerHTML = '';
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.nav-btn').forEach((b) => (b.onclick = () => switchTab(b.dataset.tab)));

/* ---------- CHAT GLOBAL ---------- */
let channel = null;
try { channel = new BroadcastChannel('alyz_chat'); } catch (e) { /* tidak didukung */ }

function loadChats() {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY)) || []; } catch (e) { return []; }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let shown = 0;
function renderChat() {
  const box = $('#chatBox');
  const me = getUser();
  const list = loadChats();
  if (!list.length) {
    box.innerHTML = '<div class="empty">BELUM ADA PESAN</div>';
    return;
  }
  box.innerHTML = list.map((m, i) =>
    `<div class="msg ${m.user === me ? 'me' : 'other'}${shown && i >= shown ? ' pop' : ''}"><b>${esc(m.user)}</b>${esc(m.text)}</div>`
  ).join('');
  shown = list.length;
  box.scrollTop = box.scrollHeight;
}

function sendChat() {
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) return;
  const list = loadChats();
  list.push({ user: getUser(), text, t: Date.now() });
  const trimmed = list.slice(-200);
  localStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
  if (channel) channel.postMessage('update');
  input.value = '';
  renderChat();
}

$('#chatSend').onclick = sendChat;
$('#chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
if (channel) channel.onmessage = () => renderChat();
window.addEventListener('storage', (e) => { if (e.key === CHAT_KEY) renderChat(); });

/* ---------- PROFIL ---------- */
$('#btnLogout').onclick = () => {
  localStorage.removeItem(USER_KEY);
  $('#appView').style.display = 'none';
  $('#loginView').style.display = 'flex';
  $('#username').value = '';
  $('#loginError').innerHTML = '';
};

/* ---------- INIT ---------- */
$('#loginView').style.display = 'flex';
if (getUser()) enterApp();
