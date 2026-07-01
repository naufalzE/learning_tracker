const TABS = [
  { id: 'tracker', label: 'Sesi', icon: 'ti-clock' },
  { id: 'dashboard', label: 'Dashboard', icon: 'ti-chart-bar' },
  { id: 'goals', label: 'Target', icon: 'ti-target' },
  { id: 'burnout', label: 'Burnout', icon: 'ti-heart-rate-monitor' },
  { id: 'schedule', label: 'Jadwal AI', icon: 'ti-calendar-event' },
  { id: 'gap', label: 'Gap Materi', icon: 'ti-map-2' },
  { id: 'insights', label: 'Insight AI', icon: 'ti-sparkles' },
];

const DEFAULT_SUBJECTS = [
  { id: 's1', name: 'Pemrograman', color: '#6366f1' },
  { id: 's2', name: 'Bahasa Inggris', color: '#f59e0b' },
  { id: 's3', name: 'Matematika', color: '#a855f7' },
  { id: 's4', name: 'Desain', color: '#ec4899' },
  { id: 's5', name: 'Fisika', color: '#06b6d4' },
];
const SWATCH_COLORS = ['#6366f1','#f59e0b','#a855f7','#ec4899','#06b6d4','#10b981','#ef4444','#f97316','#14b8a6','#8b5cf6','#e11d48','#0ea5e9'];

/* ─── POMODORO ─── */
const POMODORO_SECONDS = 25 * 60; // 1 sesi pomodoro = 25 menit
let audioCtx = null;
function playChimeOnce(startOffset) {
  const now = audioCtx.currentTime + startOffset;
  // 3 nada menaik per "ding" agar jelas terdengar sebagai notifikasi, bukan alarm error
  [659.25, 783.99, 987.77].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const start = now + i * 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.45, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(start); osc.stop(start + 0.47);
  });
}
function playPomodoroChime() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Ulangi rangkaian "ding" 4x dengan jarak ~1.1s — total ±4 detik,
    // supaya tetap tertangkap walau pemakai sedang fokus/headphone.
    const REPEATS = 4, GAP = 1.1;
    for (let r = 0; r < REPEATS; r++) playChimeOnce(r * GAP);
  } catch (e) {}
}

function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
function fmtMin(m) {
  const h = Math.floor(m / 60), r = Math.round(m % 60);
  if (h <= 0) return r + 'm';
  if (r === 0) return h + 'j';
  return h + 'j ' + r + 'm';
}
function fmtClock(s) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return m + ':' + ss;
}
function subjById(id) { return state.subjects.find(s => s.id === id) || { name: '?', color: '#888' }; }
function qs(sel) { return document.querySelector(sel); }
function h(tag, attrs, content) {
  const el = document.createElement(tag);
  if (attrs) Object.assign(el, attrs);
  if (typeof content === 'string') el.innerHTML = content;
  else if (Array.isArray(content)) content.forEach(c => { if (c) el.appendChild(typeof c === 'string' ? Object.assign(document.createElement('span'), { innerHTML: c }) : c); });
  return el;
}

const SEED_SESSIONS = [
  { id: 's0', subjectId: 's1', duration: 50, understanding: 7, note: '', date: daysAgo(7) },
  { id: 's1', subjectId: 's2', duration: 25, understanding: 6, note: '', date: daysAgo(7) },
  { id: 's2', subjectId: 's1', duration: 65, understanding: 8, note: '', date: daysAgo(6) },
  { id: 's3', subjectId: 's3', duration: 40, understanding: 4, note: '', date: daysAgo(5) },
  { id: 's4', subjectId: 's4', duration: 30, understanding: 5, note: '', date: daysAgo(5) },
  { id: 's5', subjectId: 's1', duration: 80, understanding: 9, note: 'Selesai bab hooks', date: daysAgo(4) },
  { id: 's6', subjectId: 's2', duration: 20, understanding: 5, note: '', date: daysAgo(4) },
  { id: 's7', subjectId: 's3', duration: 35, understanding: 3, note: 'Kalkulus susah', date: daysAgo(3) },
  { id: 's8', subjectId: 's5', duration: 45, understanding: 4, note: '', date: daysAgo(3) },
  { id: 's9', subjectId: 's1', duration: 30, understanding: 7, note: '', date: daysAgo(2) },
  { id: 's10', subjectId: 's4', duration: 55, understanding: 8, note: '', date: daysAgo(1) },
  { id: 's11', subjectId: 's1', duration: 40, understanding: 7, note: '', date: todayISO() },
];

const SEED_GOALS = [
  { id: 'g1', title: 'Selesaikan dasar React', subjectId: 's1', deadline: daysAgo(-14), priority: 2, status: 'in_progress', milestones: [{ id: 'm1', title: 'Pahami komponen & props', done: true }, { id: 'm2', title: 'Pahami state & hooks', done: true }, { id: 'm3', title: 'Bangun mini project', done: false }] },
  { id: 'g2', title: 'Lulus TOEFL simulasi', subjectId: 's2', deadline: daysAgo(-5), priority: 1, status: 'in_progress', milestones: [{ id: 'm4', title: 'Latihan listening 10x', done: false }, { id: 'm5', title: 'Latihan reading 10x', done: false }] },
  { id: 'g3', title: 'Kuasai kalkulus dasar', subjectId: 's3', deadline: daysAgo(-30), priority: 3, status: 'in_progress', milestones: [{ id: 'm6', title: 'Limit & turunan', done: false }, { id: 'm7', title: 'Integral dasar', done: false }] },
];

const STORAGE_KEY = 'lt_v3';
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        subjects: s.subjects || [...DEFAULT_SUBJECTS],
        sessions: s.sessions || [],
        goals: s.goals || [],
        activeTab: s.activeTab || 'tracker',
        timer: { running: false, seconds: 0, subjectId: (s.timer && s.timer.subjectId) || 's1', pomodorosNotified: 0 },
        aiCache: {},
        isFirstRun: (s.sessions || []).length === 0 && (s.goals || []).length === 0
      };
    }
  } catch (e) {}
  return { subjects: [...DEFAULT_SUBJECTS], sessions: [], goals: [], activeTab: 'tracker', timer: { running: false, seconds: 0, subjectId: 's1', pomodorosNotified: 0 }, aiCache: {}, isFirstRun: true };
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ subjects: state.subjects, sessions: state.sessions, goals: state.goals, activeTab: state.activeTab, timer: { subjectId: state.timer.subjectId } })); } catch (e) {}
}

let state = loadState();
let timerInterval = null;

/* ─── THEME ─── */
function applyTheme() {
  const dark = localStorage.getItem('lt_theme') === 'dark';
  document.body.classList.toggle('dark-theme', dark);
}
function toggleTheme() {
  const dark = localStorage.getItem('lt_theme') === 'dark';
  localStorage.setItem('lt_theme', dark ? 'light' : 'dark');
  applyTheme();
  render();
}
applyTheme();

/* ─── ACHIEVEMENTS ─── */
const ACHIEVEMENTS = [
  { id: 'streak7', icon: '🔥', name: '7 Hari Beruntun', check: (s) => computeStreak(s) >= 7 },
  { id: 'hours100', icon: '🏆', name: '100 Jam Belajar', check: (s) => s.reduce((a, x) => a + x.duration, 0) >= 100 * 60 },
  { id: 'sessions25', icon: '📚', name: '25 Sesi Selesai', check: (s) => s.length >= 25 },
  { id: 'pomo10', icon: '⚡', name: '10 Sesi ≥25 Menit', check: (s) => s.filter(x => x.duration >= 25).length >= 10 },
  { id: 'goal1', icon: '🎯', name: '1 Target Tercapai', check: (s, g) => g.some(x => x.status === 'completed') },
  { id: 'understand9', icon: '🧠', name: 'Pemahaman 9+', check: (s) => s.some(x => x.understanding >= 9) },
];
function getAchievements() {
  return ACHIEVEMENTS.map(a => ({ ...a, unlocked: a.check(state.sessions, state.goals) }));
}

/* ─── EXPORT / IMPORT ─── */
function exportJSON() {
  const data = { subjects: state.subjects, sessions: state.sessions, goals: state.goals, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `learning-tracker-${todayISO()}.json`; a.click();
  URL.revokeObjectURL(url);
  showToast('Data diekspor sebagai JSON');
}
function exportCSV() {
  const header = ['Tanggal', 'Mata Pelajaran', 'Durasi (menit)', 'Pemahaman', 'Catatan'];
  const rows = state.sessions.map(s => [s.date, subjById(s.subjectId).name, s.duration, s.understanding, (s.note || '').replace(/,/g, ';')]);
  const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `learning-tracker-${todayISO()}.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast('Data diekspor sebagai CSV');
}
function exportXLSX() {
  if (!window.XLSX) { showToast('Library Excel gagal dimuat. Cek koneksi internet.'); return; }
  const sessRows = state.sessions.map(s => ({ Tanggal: s.date, 'Mata Pelajaran': subjById(s.subjectId).name, 'Durasi (menit)': s.duration, 'Pemahaman (1-10)': s.understanding, Mood: s.mood || '', Energi: s.energy || '', Catatan: s.note || '' }));
  const goalRows = state.goals.map(g => ({ Judul: g.title, 'Mata Pelajaran': subjById(g.subjectId).name, Kategori: GOAL_CATEGORIES[g.category] || '', Deadline: g.deadline, Status: g.status, 'Progress Milestone': `${g.milestones.filter(m => m.done).length}/${g.milestones.length}` }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sessRows), 'Sesi Belajar');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goalRows), 'Target');
  XLSX.writeFile(wb, `learning-tracker-${todayISO()}.xlsx`);
  showToast('Data diekspor sebagai Excel');
}

function exportPDFReport() {
  const sessions = state.sessions;
  const totalMin = sessions.reduce((a, s) => a + s.duration, 0);
  const avgU = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.understanding, 0) / sessions.length * 10) / 10 : 0;
  const streak = computeStreak(sessions);
  const burnout = computeBurnoutScore(sessions);
  const bySubj = {}; sessions.forEach(s => { bySubj[s.subjectId] = (bySubj[s.subjectId] || 0) + s.duration; });
  const subjRows = state.subjects.filter(s => bySubj[s.id]).map(s => `<tr><td>${s.name}</td><td>${fmtMin(bySubj[s.id])}</td></tr>`).join('');
  const goalRows = state.goals.map(g => {
    const done = g.milestones.filter(m => m.done).length, total = g.milestones.length;
    const pct = total ? Math.round(done / total * 100) : (g.manualProgress || 0);
    return `<tr><td>${g.title}</td><td>${subjById(g.subjectId).name}</td><td>${g.deadline}</td><td>${pct}%</td></tr>`;
  }).join('');
  const trendCanvas = qs('#trend-chart');
  const chartImg = trendCanvas ? trendCanvas.toDataURL('image/png') : '';
  const pieCanvas = qs('#subj-pie');
  const pieImg = pieCanvas ? pieCanvas.toDataURL('image/png') : '';
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Laporan Learning Tracker</title>
    <style>
      body{font-family:Arial,sans-serif;color:#163224;padding:32px;max-width:800px;margin:0 auto}
      h1{font-size:20px;margin-bottom:2px} .sub{color:#5c7268;font-size:12px;margin-bottom:24px}
      .metrics{display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .metric{border:1px solid #ddd;border-radius:8px;padding:12px 16px;min-width:120px}
      .metric .lbl{font-size:11px;color:#5c7268;text-transform:uppercase}
      .metric .val{font-size:22px;font-weight:700}
      h2{font-size:14px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      td,th{border:1px solid #ddd;padding:6px 8px;text-align:left}
      img{max-width:100%;margin:8px 0}
      @media print { body{padding:12px} }
    </style></head>
    <body>
      <h1>Laporan Learning Tracker</h1>
      <div class="sub">Dibuat pada ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <div class="metrics">
        <div class="metric"><div class="lbl">Total Waktu</div><div class="val">${fmtMin(totalMin)}</div></div>
        <div class="metric"><div class="lbl">Pemahaman</div><div class="val">${avgU}/10</div></div>
        <div class="metric"><div class="lbl">Streak</div><div class="val">${streak}h</div></div>
        <div class="metric"><div class="lbl">Burnout Risk</div><div class="val">${burnout}%</div></div>
      </div>
      ${chartImg ? `<h2>Tren Belajar 14 Hari</h2><img src="${chartImg}">` : ''}
      ${pieImg ? `<h2>Distribusi Waktu per Mapel</h2><img src="${pieImg}" style="max-width:320px">` : ''}
      <h2>Waktu per Mata Pelajaran</h2>
      <table><tr><th>Mata Pelajaran</th><th>Total Waktu</th></tr>${subjRows || '<tr><td colspan=2>Belum ada data</td></tr>'}</table>
      <h2>Target Belajar</h2>
      <table><tr><th>Judul</th><th>Mata Pelajaran</th><th>Deadline</th><th>Progress</th></tr>${goalRows || '<tr><td colspan=4>Belum ada target</td></tr>'}</table>
      <script>window.onload = () => setTimeout(() => window.print(), 400);<\/script>
    </body></html>`;
  const win = window.open('', '_blank');
  if (!win) { showToast('Pop-up diblokir browser — izinkan pop-up untuk export PDF'); return; }
  win.document.write(html);
  win.document.close();
  showToast('Laporan dibuka — pilih "Simpan sebagai PDF" pada dialog print');
}
function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.sessions) throw new Error('format tidak sesuai');
      state.subjects = data.subjects && data.subjects.length ? data.subjects : state.subjects;
      state.sessions = data.sessions || [];
      state.goals = data.goals || [];
      saveState(); render();
      showToast('Data berhasil diimpor');
    } catch (e) { showToast('Gagal mengimpor: file tidak valid'); }
  };
  reader.readAsText(file);
}

function computeStreak(sessions) {
  const days = new Set(sessions.map(s => s.date));
  let n = 0, cur = new Date();
  for (;;) { const iso = cur.toISOString().slice(0, 10); if (days.has(iso)) { n++; cur.setDate(cur.getDate() - 1); } else break; }
  return n;
}
function computeBurnoutScore(sessions) {
  const now = new Date();
  const last7 = sessions.filter(s => (now - new Date(s.date)) / 86400000 <= 7);
  const prev7 = sessions.filter(s => { const d = (now - new Date(s.date)) / 86400000; return d > 7 && d <= 14; });
  const mLast = last7.reduce((a, s) => a + s.duration, 0);
  const mPrev = prev7.reduce((a, s) => a + s.duration, 0);
  const avgU = last7.length ? last7.reduce((a, s) => a + s.understanding, 0) / last7.length : 0;
  let score = 0;
  if (mPrev > 0) { const drop = (mPrev - mLast) / mPrev; if (drop > 0) score += Math.min(drop * 60, 40); }
  if (avgU > 0) score += Math.max(0, (6 - avgU) * 8);
  const streak = computeStreak(sessions);
  if (streak === 0) score += 20;
  return Math.min(Math.round(score), 100);
}
function showToast(msg, opts) {
  const el = qs('#toast-el');
  const duration = (opts && opts.duration) || 2400;
  el.textContent = msg;
  el.className = 'toast' + (opts && opts.alert ? ' alert' : '');
  el.style.display = 'block';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => { el.style.display = 'none'; el.className = 'toast'; }, duration);
}

function renderTopBar() {
  qs('#topdate').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const streak = computeStreak(state.sessions);
  const sb = qs('#streak-badge');
  sb.innerHTML = `<i class="ti ti-flame" style="font-size:14px"></i> ${streak} hari`;
  sb.style.background = streak > 0 ? 'rgba(15,157,88,0.12)' : 'rgba(15,45,30,0.05)';
  sb.style.color = streak > 0 ? '#0f9d58' : '#5c7268';
  sb.style.border = `1px solid ${streak > 0 ? 'rgba(15,157,88,0.3)' : 'rgba(15,45,30,0.1)'}`;
  const themeBtn = qs('#theme-toggle-btn');
  if (themeBtn) {
    themeBtn.querySelector('i').className = 'ti ' + (localStorage.getItem('lt_theme') === 'dark' ? 'ti-sun' : 'ti-moon');
    themeBtn.onclick = toggleTheme;
  }
  const nav = qs('#nav'); nav.innerHTML = '';
  TABS.forEach(t => {
    const btn = h('button', { className: 'navbtn' + (state.activeTab === t.id ? ' active' : ''), onclick: () => { state.activeTab = t.id; saveState(); render(); } },
      `<i class="ti ${t.icon}"></i>${t.label}`);
    nav.appendChild(btn);
  });
}

function render() {
  renderTopBar();
  const main = qs('#main'); main.innerHTML = '';
  const div = document.createElement('div'); div.className = 'tab-content'; main.appendChild(div);
  if (state.activeTab === 'tracker') renderTracker(div);
  else if (state.activeTab === 'dashboard') renderDashboard(div);
  else if (state.activeTab === 'goals') renderGoals(div);
  else if (state.activeTab === 'burnout') renderBurnout(div);
  else if (state.activeTab === 'schedule') renderSchedule(div);
  else if (state.activeTab === 'gap') renderGap(div);
  else if (state.activeTab === 'insights') renderInsights(div);
}

/* ─── MODAL HELPERS ─── */
function openModal(html, onReady) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-box">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  if (onReady) onReady(overlay);
}

/* ─── TRACKER ─── */
function renderTracker(el) {
  const t = state.timer;
  const todays = state.sessions.filter(s => s.date === todayISO());
  const todayMin = todays.reduce((a, s) => a + s.duration, 0);

  if (!state.subjects.find(s => s.id === t.subjectId) && state.subjects.length > 0) {
    state.timer.subjectId = state.subjects[0].id;
  }

  el.innerHTML = `
    ${state.isFirstRun ? `<div class="firstrun-banner"><div class="firstrun-text"><strong>Selamat datang!</strong> Tracker masih kosong. Muat data contoh untuk melihat tampilan penuh, atau langsung mulai catat sesimu.</div><button class="btn" id="load-seed-btn" style="white-space:nowrap;flex-shrink:0"><i class="ti ti-database-import"></i>Muat contoh</button></div>` : ""}
    <div class="card">
      <div class="card-title">Timer belajar</div>
      <div class="card-sub">Pilih mata pelajaran lalu mulai sesi fokusmu</div>
      <div class="chips" id="subj-chips"></div>
      <div class="timer-block">
        <div class="timer-digits${t.running ? " running" : ""}" id="timer-display">${fmtClock(t.seconds)}</div>
        <div class="timer-label" id="timer-subj">${subjById(t.subjectId).name}</div>
      </div>
      <div class="btn-row" id="timer-btns"></div>
    </div>
    <div id="log-form-wrap"></div>
    <div class="card">
      <div class="section-header">
        <div>
          <div class="card-title">Hari ini</div>
          <div class="card-sub" style="margin-bottom:0">${todays.length} sesi · ${fmtMin(todayMin)}</div>
        </div>
      </div>
      <div class="session-list" id="today-sessions"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">Kalender Belajar</div>
      <div class="card-sub">Klik tanggal untuk melihat sesi hari itu</div>
      <div class="cal-header">
        <button class="cal-nav-btn" id="cal-prev"><i class="ti ti-chevron-left"></i></button>
        <div class="cal-month-label" id="cal-month-label"></div>
        <button class="cal-nav-btn" id="cal-next"><i class="ti ti-chevron-right"></i></button>
      </div>
      <div class="cal-grid" id="cal-dow-row"></div>
      <div class="cal-grid" id="cal-grid" style="margin-top:4px"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">Riwayat sebelumnya</div>
      <div class="filter-row" id="history-filter-row"></div>
      <input type="text" id="history-search" placeholder="Cari mata pelajaran atau catatan...">
      <div class="session-list scroll-list" id="prev-sessions"></div>
    </div>
    <div class="card">
      <div class="section-header" style="margin-bottom:12px">
        <div class="card-title" style="margin-bottom:0">Kelola mata pelajaran</div>
        <button class="btn" id="add-subj-btn" style="font-size:12px;padding:6px 12px"><i class="ti ti-plus"></i>Tambah</button>
      </div>
      <div id="subj-manage-list"></div>
    </div>`;

  if (state.isFirstRun) {
    const seedBtn = qs('#load-seed-btn');
    if (seedBtn) seedBtn.onclick = () => {
      state.sessions = [...SEED_SESSIONS];
      state.goals = [...SEED_GOALS];
      state.isFirstRun = false;
      saveState();
      showToast('✓ Data contoh dimuat!');
      render();
    };
  }

  state.subjects.forEach(s => {
    const chip = h('button', { className: 'chip' + (t.subjectId === s.id ? ' active' : ''), onclick: () => { if (!t.running) { state.timer.subjectId = s.id; renderTracker(el); } } },
      `<span class="dot" style="background:${s.color}"></span>${s.name}`);
    qs('#subj-chips').appendChild(chip);
  });

  function updateTimerUI() {
    const d = qs('#timer-display');
    if (d) { d.textContent = fmtClock(state.timer.seconds); d.className = 'timer-digits' + (state.timer.running ? ' running' : ''); }
  }
  function tickTimer() {
    state.timer.seconds++;
    const completedPomodoros = Math.floor(state.timer.seconds / POMODORO_SECONDS);
    if (completedPomodoros > state.timer.pomodorosNotified) {
      state.timer.pomodorosNotified = completedPomodoros;
      playPomodoroChime();
      showToast(`🍅 Sesi Pomodoro ${completedPomodoros} selesai — waktunya istirahat sebentar!`, { alert: true, duration: 7000 });
    }
    updateTimerUI();
  }
  if (t.running && !timerInterval) { timerInterval = setInterval(tickTimer, 1000); }

  const btns = qs('#timer-btns');
  if (!t.running) {
    btns.appendChild(h('button', { className: 'btn primary', onclick: () => { state.timer.running = true; timerInterval = setInterval(tickTimer, 1000); renderTracker(el); } }, `<i class="ti ti-player-play"></i>${t.seconds > 0 ? 'Lanjutkan' : 'Mulai sesi'}`));
    if (t.seconds > 0) {
      btns.appendChild(h('button', { className: 'btn', onclick: () => { state.timer.seconds = 0; state.timer.pomodorosNotified = 0; renderTracker(el); } }, '<i class="ti ti-rotate"></i>Reset'));
      btns.appendChild(h('button', { className: 'btn', onclick: () => { showLogForm(); } }, '<i class="ti ti-check"></i>Selesai & catat'));
    }
  } else {
    btns.appendChild(h('button', { className: 'btn danger', onclick: () => { clearInterval(timerInterval); timerInterval = null; state.timer.running = false; showLogForm(); } }, '<i class="ti ti-player-stop"></i>Selesai & catat'));
  }

  function showLogForm() {
    const wrap = qs('#log-form-wrap');
    let u = 7;
    wrap.innerHTML = `<div class="add-form">
      <div class="card-title" style="margin-bottom:2px">Seberapa paham?</div>
      <div class="card-sub">Skor jujur membantu analisis AI lebih akurat</div>
      <div class="range-wrap">
        <span class="edge">1</span>
        <input type="range" min="1" max="10" step="1" value="7" id="u-range">
        <span class="edge">10</span>
        <span class="range-val" id="u-val">7</span>
      </div>
      <label class="field-label">Catatan (opsional)</label>
      <input type="text" placeholder="Topik yang dipelajari, kesulitan, dll..." id="note-input">
      <div style="display:flex;gap:10px">
        <div style="flex:1">
          <label class="field-label">Mood</label>
          <select id="mood-input">
            <option value="senang">😊 Senang</option>
            <option value="netral" selected>😐 Netral</option>
            <option value="lelah">😫 Lelah</option>
            <option value="stres">😖 Stres</option>
          </select>
        </div>
        <div style="flex:1">
          <label class="field-label">Energi</label>
          <select id="energy-input">
            <option value="tinggi">⚡ Tinggi</option>
            <option value="sedang" selected>🔋 Sedang</option>
            <option value="rendah">🪫 Rendah</option>
          </select>
        </div>
      </div>
      <div class="btn-row" style="margin-top:4px">
        <button class="btn primary" id="save-sess-btn"><i class="ti ti-device-floppy"></i>Simpan sesi</button>
        <button class="btn" id="cancel-sess-btn">Batal</button>
      </div>
    </div>`;
    qs('#u-range').addEventListener('input', e => { u = +e.target.value; qs('#u-val').textContent = u; });
    qs('#save-sess-btn').onclick = () => {
      const note = qs('#note-input').value.trim();
      const mins = Math.round(state.timer.seconds / 60) || 1;
      state.sessions.unshift({ id: 'sess-' + Date.now(), subjectId: state.timer.subjectId, duration: mins, understanding: u, note, mood: qs('#mood-input').value, energy: qs('#energy-input').value, date: todayISO() });
      state.timer.seconds = 0; state.timer.running = false; state.timer.pomodorosNotified = 0;
      clearInterval(timerInterval); timerInterval = null;
      state.isFirstRun = false;
      showToast('✓ Sesi tersimpan!');
      state.aiCache = {};
      saveState(); render();
    };
    qs('#cancel-sess-btn').onclick = () => { wrap.innerHTML = ''; state.timer.seconds = 0; state.timer.running = false; state.timer.pomodorosNotified = 0; clearInterval(timerInterval); timerInterval = null; render(); };
  }

  function renderSessionRow(s, container) {
    const subj = subjById(s.subjectId);
    const cls = s.understanding >= 7 ? 'good' : s.understanding >= 4 ? 'med' : 'bad';
    const dateStr = s.date !== todayISO() ? `<span style="font-size:11px;color:var(--text-dim);margin-left:2px">${new Date(s.date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>` : '';
    const row = document.createElement('div');
    row.className = 'session-row clickable';
    row.style.flexWrap = 'wrap';
    row.innerHTML = `
      <div class="session-left" style="flex:1;min-width:0">
        <span class="dot" style="background:${subj.color};flex-shrink:0"></span>
        <div style="min-width:0">
          <div style="display:flex;align-items:center;gap:4px">${subj.name}${dateStr}</div>
          ${s.note ? `<div class="session-note">${s.note}</div>` : ''}
        </div>
      </div>
      <div class="session-right">
        <span class="dur-text">${fmtMin(s.duration)}</span>
        <span class="badge ${cls}">${s.understanding}/10</span>
        <button class="icon-btn" title="Edit"><i class="ti ti-pencil"></i></button>
        <button class="icon-btn del" title="Hapus"><i class="ti ti-trash"></i></button>
      </div>`;
    const MOOD_LABELS = { senang: '😊 Senang', netral: '😐 Netral', lelah: '😫 Lelah', stres: '😖 Stres' };
    const ENERGY_LABELS = { tinggi: '⚡ Tinggi', sedang: '🔋 Sedang', rendah: '🪫 Rendah' };
    function openEditModal() {
      openModal(`
        <div class="modal-title"><i class="ti ti-pencil"></i> Edit sesi — ${subj.name}</div>
        <label class="field-label">Skor pemahaman</label>
        <div class="range-wrap">
          <span class="edge">1</span>
          <input type="range" id="m-range" min="1" max="10" step="1" value="${s.understanding}">
          <span class="edge">10</span>
          <span class="range-val" id="m-val">${s.understanding}</span>
        </div>
        <label class="field-label">Durasi (menit)</label>
        <input type="text" id="m-dur" value="${s.duration}" style="margin-bottom:10px">
        <label class="field-label">Catatan</label>
        <input type="text" id="m-note" value="${s.note || ''}" placeholder="Topik, kesulitan, dll...">
        <div style="display:flex;gap:10px">
          <div style="flex:1"><label class="field-label">Mood</label>
            <select id="m-mood">${Object.entries(MOOD_LABELS).map(([k, v]) => `<option value="${k}" ${s.mood === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          </div>
          <div style="flex:1"><label class="field-label">Energi</label>
            <select id="m-energy">${Object.entries(ENERGY_LABELS).map(([k, v]) => `<option value="${k}" ${s.energy === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          </div>
        </div>
        <div class="btn-row" style="margin-top:8px">
          <button class="btn primary" id="m-save">Simpan</button>
          <button class="btn" id="m-cancel">Batal</button>
        </div>`, (overlay) => {
        let uVal = s.understanding;
        overlay.querySelector('#m-range').oninput = e => { uVal = +e.target.value; overlay.querySelector('#m-val').textContent = uVal; };
        overlay.querySelector('#m-save').onclick = () => {
          s.understanding = uVal;
          s.note = overlay.querySelector('#m-note').value.trim();
          s.mood = overlay.querySelector('#m-mood').value;
          s.energy = overlay.querySelector('#m-energy').value;
          const durVal = parseInt(overlay.querySelector('#m-dur').value);
          if (durVal > 0) s.duration = durVal;
          state.aiCache = {}; saveState(); overlay.remove(); renderTracker(el);
          showToast('✓ Sesi diperbarui!');
        };
        overlay.querySelector('#m-cancel').onclick = () => overlay.remove();
      });
    }
    function openDetailModal() {
      const dateFmt = new Date(s.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      openModal(`
        <div class="modal-title" style="display:flex;align-items:center;gap:7px"><span class="dot" style="background:${subj.color}"></span>Detail Sesi</div>
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:14px">${dateFmt}</div>
        <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Topik / Mapel</span><strong>${subj.name}</strong></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Durasi</span><strong>${fmtMin(s.duration)}</strong></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Pemahaman</span><strong>${s.understanding}/10</strong></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Mood</span><strong>${MOOD_LABELS[s.mood] || '—'}</strong></div>
          <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Energi</span><strong>${ENERGY_LABELS[s.energy] || '—'}</strong></div>
          ${s.note ? `<div><div style="color:var(--text-muted);margin-bottom:4px">Catatan</div><div style="background:var(--surface-2);border:1px solid var(--border);border-radius:6px;padding:10px 12px">${s.note}</div></div>` : ''}
        </div>
        <div class="btn-row">
          <button class="btn primary" id="detail-edit-btn"><i class="ti ti-pencil"></i>Edit sesi</button>
          <button class="btn" id="detail-close-btn">Tutup</button>
        </div>`, (overlay) => {
        overlay.querySelector('#detail-edit-btn').onclick = () => { overlay.remove(); openEditModal(); };
        overlay.querySelector('#detail-close-btn').onclick = () => overlay.remove();
      });
    }
    row.addEventListener('click', (e) => { if (e.target.closest('.icon-btn')) return; openDetailModal(); });
    const [editBtn, delBtn] = row.querySelectorAll('.icon-btn');
    delBtn.onclick = (e) => {
      e.stopPropagation();
      state.sessions = state.sessions.filter(x => x.id !== s.id);
      state.aiCache = {}; saveState(); renderTracker(el);
    };
    editBtn.onclick = (e) => { e.stopPropagation(); openEditModal(); };
    container.appendChild(row);
  }

  const todayEl = qs('#today-sessions');
  if (todays.length === 0) { todayEl.innerHTML = '<div class="empty"><i class="ti ti-coffee"></i>Belum ada sesi hari ini</div>'; }
  else todays.forEach(s => renderSessionRow(s, todayEl));

  let historyFilter = 'all';
  let historySearch = '';
  let selectedCalDate = null;
  let calViewDate = new Date();
  const HISTORY_FILTERS = [
    { id: 'all', label: 'Semua' },
    { id: 'today', label: 'Hari Ini' },
    { id: 'week', label: 'Minggu Ini' },
    { id: 'month', label: 'Bulan Ini' },
  ];
  function matchesFilter(s) {
    if (selectedCalDate) return s.date === selectedCalDate;
    const now = new Date(); const d = (now - new Date(s.date)) / 86400000;
    if (historyFilter === 'today') return s.date === todayISO();
    if (historyFilter === 'week') return d <= 7;
    if (historyFilter === 'month') return d <= 30;
    return true;
  }
  function refreshHistory() {
    const prevEl = qs('#prev-sessions'); if (!prevEl) return;
    prevEl.innerHTML = '';
    const q = historySearch.trim().toLowerCase();
    const prev = state.sessions
      .filter(matchesFilter)
      .filter(s => !q || subjById(s.subjectId).name.toLowerCase().includes(q) || (s.note || '').toLowerCase().includes(q))
      .slice(0, 100);
    if (prev.length === 0) { prevEl.innerHTML = `<div class="empty">${selectedCalDate ? 'Tidak ada sesi di tanggal ini' : 'Tidak ada riwayat yang cocok'}</div>`; }
    else prev.forEach(s => renderSessionRow(s, prevEl));
  }
  const filterRow = qs('#history-filter-row');
  function renderFilterChips() {
    filterRow.innerHTML = '';
    HISTORY_FILTERS.forEach(f => {
      const chip = h('button', { className: 'chip' + (!selectedCalDate && f.id === historyFilter ? ' active' : ''), onclick: () => { historyFilter = f.id; selectedCalDate = null; renderFilterChips(); refreshHistory(); renderCalendar(); } }, f.label);
      filterRow.appendChild(chip);
    });
    if (selectedCalDate) {
      const dLabel = new Date(selectedCalDate + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const chip = h('button', { className: 'chip active', onclick: () => { selectedCalDate = null; renderFilterChips(); refreshHistory(); renderCalendar(); } }, `<i class="ti ti-x"></i>${dLabel}`);
      filterRow.appendChild(chip);
    }
  }
  renderFilterChips();
  qs('#history-search').oninput = (e) => { historySearch = e.target.value; refreshHistory(); };
  refreshHistory();

  /* ─── CALENDAR ─── */
  function renderCalendar() {
    const monthLabelEl = qs('#cal-month-label');
    const dowEl = qs('#cal-dow-row');
    const gridEl = qs('#cal-grid');
    if (!monthLabelEl) return;
    monthLabelEl.textContent = calViewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    dowEl.innerHTML = '';
    ['M', 'S', 'S', 'R', 'K', 'J', 'S'].forEach(d => { dowEl.innerHTML += `<div class="cal-dow">${d}</div>`; });
    gridEl.innerHTML = '';
    const year = calViewDate.getFullYear(), month = calViewDate.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDate = {}; state.sessions.forEach(s => { byDate[s.date] = (byDate[s.date] || 0) + s.duration; });
    for (let i = 0; i < firstDow; i++) gridEl.appendChild(h('div', { className: 'cal-cell empty' }));
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = iso === todayISO();
      const isSelected = iso === selectedCalDate;
      const hasActivity = byDate[iso] > 0;
      const cell = h('div', {
        className: 'cal-cell' + (isToday ? ' today' : '') + (isSelected ? ' selected' : ''),
        title: hasActivity ? fmtMin(byDate[iso]) + ' belajar' : 'Tidak ada sesi',
        onclick: () => { selectedCalDate = isSelected ? null : iso; renderFilterChips(); refreshHistory(); renderCalendar(); }
      }, `${day}${hasActivity ? '<div class="cal-dot"></div>' : ''}`);
      gridEl.appendChild(cell);
    }
  }
  qs('#cal-prev').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() - 1); renderCalendar(); };
  qs('#cal-next').onclick = () => { calViewDate.setMonth(calViewDate.getMonth() + 1); renderCalendar(); };
  renderCalendar();

  const subjList = qs('#subj-manage-list');
  if (state.subjects.length === 0) { subjList.innerHTML = '<div class="empty" style="padding:12px 0">Belum ada mata pelajaran</div>'; }
  state.subjects.forEach(subj => {
    const row = document.createElement('div');
    row.className = 'subj-manage-row';
    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <span class="dot" style="background:${subj.color};width:10px;height:10px"></span>
        <span style="font-size:13px">${subj.name}</span>
      </div>
      <div style="display:flex;gap:4px">
        <button class="icon-btn" title="Edit"><i class="ti ti-pencil"></i></button>
        <button class="icon-btn del" title="Hapus"><i class="ti ti-trash"></i></button>
      </div>`;
    const [editS, delS] = row.querySelectorAll('.icon-btn');
    delS.onclick = () => {
      if (state.subjects.length <= 1) { showToast('Minimal 1 mata pelajaran'); return; }
      if (!confirm(`Hapus "${subj.name}"?`)) return;
      state.subjects = state.subjects.filter(x => x.id !== subj.id);
      if (state.timer.subjectId === subj.id) state.timer.subjectId = state.subjects[0]?.id || '';
      saveState(); renderTracker(el);
    };
    editS.onclick = () => openSubjModal(subj, el);
    subjList.appendChild(row);
  });

  qs('#add-subj-btn').onclick = () => openSubjModal(null, el);
}

function openSubjModal(existing, trackerEl) {
  let selectedColor = existing ? existing.color : SWATCH_COLORS[0];
  openModal(`
    <div class="modal-title">${existing ? 'Edit' : 'Tambah'} mata pelajaran</div>
    <label class="field-label">Nama</label>
    <input type="text" id="sn-name" value="${existing ? existing.name : ''}" placeholder="Contoh: Machine Learning">
    <label class="field-label">Warna</label>
    <div class="color-swatches" id="sn-swatches">
      ${SWATCH_COLORS.map(c => `<div class="swatch${c === selectedColor ? ' selected' : ''}" style="background:${c}" data-color="${c}"></div>`).join('')}
    </div>
    <div class="btn-row" style="margin-top:6px">
      <button class="btn primary" id="sn-save">Simpan</button>
      <button class="btn" id="sn-cancel">Batal</button>
    </div>`, (overlay) => {
    overlay.querySelectorAll('.swatch').forEach(sw => {
      sw.onclick = () => {
        selectedColor = sw.dataset.color;
        overlay.querySelectorAll('.swatch').forEach(x => x.classList.remove('selected'));
        sw.classList.add('selected');
      };
    });
    overlay.querySelector('#sn-save').onclick = () => {
      const name = overlay.querySelector('#sn-name').value.trim();
      if (!name) { showToast('Nama tidak boleh kosong'); return; }
      if (existing) { existing.name = name; existing.color = selectedColor; }
      else { state.subjects.push({ id: 'subj-' + Date.now(), name, color: selectedColor }); }
      saveState(); overlay.remove(); renderTracker(trackerEl);
      showToast(existing ? '✓ Diperbarui!' : '✓ Mata pelajaran ditambahkan!');
    };
    overlay.querySelector('#sn-cancel').onclick = () => overlay.remove();
  });
}

/* ─── DASHBOARD ─── */
function renderDashboard(el) {
  const sessions = state.sessions;
  const totalMin = sessions.reduce((a, s) => a + s.duration, 0);
  const avgU = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.understanding, 0) / sessions.length * 10) / 10 : 0;
  const streak = computeStreak(sessions);
  const burnout = computeBurnoutScore(sessions);
  const bColor = burnout >= 70 ? '#ef4444' : burnout >= 40 ? '#f59e0b' : '#10b981';

  el.innerHTML = `
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">Ringkasan</div>
      <div class="metrics-grid">
        <div class="metric"><div class="metric-label">Total Waktu</div><div class="metric-val">${fmtMin(totalMin)}</div><div class="metric-note">${sessions.length} sesi tercatat</div></div>
        <div class="metric"><div class="metric-label">Pemahaman</div><div class="metric-val">${avgU}<span style="font-size:14px;color:var(--text-muted)">/10</span></div><div class="metric-note">rata-rata semua sesi</div></div>
        <div class="metric"><div class="metric-label">Streak</div><div class="metric-val" style="color:#10b981">${streak}<span style="font-size:14px;color:var(--text-muted)">h</span></div><div class="metric-note">hari beruntun</div></div>
        <div class="metric"><div class="metric-label">Burnout Risk</div><div class="metric-val" style="color:${bColor}">${burnout}<span style="font-size:14px;color:var(--text-muted)">%</span></div><div class="metric-note">${burnout >= 70 ? 'Perlu istirahat' : burnout >= 40 ? 'Perhatikan ritme' : 'Kondisi baik'}</div></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">Aktivitas 14 hari</div>
      <div class="card-sub">Hover untuk lihat detail</div>
      <div id="heatmap-wrap" class="heatmap"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">Tren belajar 14 hari</div>
      <div class="card-sub">Total menit per hari</div>
      <canvas id="trend-chart" height="140"></canvas>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">Waktu per mata pelajaran</div>
      <div id="subj-bars"></div>
      <canvas id="subj-pie" height="200" style="margin-top:8px"></canvas>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">Jam Belajar</div>
      <div class="card-sub">Total waktu belajar berdasarkan rentang waktu</div>
      <div class="range-toggle" id="hours-range-toggle"></div>
      <div class="metric-val" id="hours-range-val" style="font-size:28px;margin-bottom:2px"></div>
      <div class="metric-note" id="hours-range-note"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">Statistik</div>
      <div class="stats-grid" id="stats-grid"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">Achievement</div>
      <div class="card-sub">Lencana yang sudah dan belum kamu raih</div>
      <div class="ach-grid" id="ach-grid"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">Ekspor & Impor Data</div>
      <div class="btn-row">
        <button class="btn" id="export-json-btn"><i class="ti ti-file-export"></i>Export JSON</button>
        <button class="btn" id="export-csv-btn"><i class="ti ti-file-spreadsheet"></i>Export CSV</button>
        <button class="btn" id="export-xlsx-btn"><i class="ti ti-file-type-xls"></i>Export Excel</button>
        <button class="btn" id="export-pdf-btn"><i class="ti ti-file-type-pdf"></i>Export PDF</button>
        <button class="btn" id="import-json-btn"><i class="ti ti-file-import"></i>Import JSON</button>
        <input type="file" id="import-json-input" accept="application/json" style="display:none">
      </div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">Zona Berbahaya</div>
      <div class="card-sub">Hapus semua sesi, target, dan kembali ke tampilan kosong (termasuk data contoh)</div>
      <div class="btn-row">
        <button class="btn danger" id="reset-data-btn"><i class="ti ti-trash"></i>Reset Semua Data</button>
      </div>
    </div>`;

  /* Jam belajar per rentang waktu */
  const HOUR_RANGES = [
    { id: 'week', label: 'Per Minggu', days: 7 },
    { id: 'month', label: 'Per Bulan', days: 30 },
    { id: 'year', label: 'Per Tahun', days: 365 },
  ];
  let hoursRange = 'week';
  function refreshHoursRange() {
    const r = HOUR_RANGES.find(x => x.id === hoursRange);
    const now = new Date();
    const filtered = sessions.filter(s => (now - new Date(s.date)) / 86400000 <= r.days);
    const total = filtered.reduce((a, s) => a + s.duration, 0);
    qs('#hours-range-val').textContent = fmtMin(total);
    qs('#hours-range-note').textContent = `${filtered.length} sesi dalam ${r.days} hari terakhir`;
  }
  const hoursToggle = qs('#hours-range-toggle');
  HOUR_RANGES.forEach(r => {
    const chip = h('button', { className: 'chip' + (r.id === hoursRange ? ' active' : ''), onclick: () => { hoursRange = r.id; hoursToggle.querySelectorAll('.chip').forEach(c => c.classList.remove('active')); chip.classList.add('active'); refreshHoursRange(); } }, r.label);
    hoursToggle.appendChild(chip);
  });
  refreshHoursRange();

  qs('#export-json-btn').onclick = exportJSON;
  qs('#export-csv-btn').onclick = exportCSV;
  qs('#export-xlsx-btn').onclick = exportXLSX;
  qs('#export-pdf-btn').onclick = exportPDFReport;
  qs('#import-json-btn').onclick = () => qs('#import-json-input').click();
  qs('#import-json-input').onchange = (e) => { if (e.target.files[0]) importJSON(e.target.files[0]); };
  qs('#reset-data-btn').onclick = () => {
    openModal(`
      <div class="modal-title">Hapus semua data?</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;line-height:1.6">Semua sesi, target, dan riwayat (termasuk data contoh) akan dihapus permanen dan tracker kembali kosong. Tindakan ini tidak bisa dibatalkan.</div>
      <div class="btn-row">
        <button class="btn danger" id="confirm-reset-btn"><i class="ti ti-trash"></i>Ya, hapus semua</button>
        <button class="btn" id="cancel-reset-btn">Batal</button>
      </div>`, (overlay) => {
      overlay.querySelector('#confirm-reset-btn').onclick = () => {
        state.sessions = [];
        state.goals = [];
        state.isFirstRun = true;
        state.activeTab = 'tracker';
        saveState();
        overlay.remove();
        showToast('✓ Semua data telah dihapus');
        render();
      };
      overlay.querySelector('#cancel-reset-btn').onclick = () => overlay.remove();
    });
  };

  /* Statistik */
  const statsEl = qs('#stats-grid');
  const durations = sessions.map(s => s.duration);
  const longest = durations.length ? Math.max(...durations) : 0;
  const avgFocus = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const bySubjStat = {}; sessions.forEach(s => { if (!bySubjStat[s.subjectId]) bySubjStat[s.subjectId] = { total: 0, u: 0, n: 0 }; bySubjStat[s.subjectId].total += s.duration; bySubjStat[s.subjectId].u += s.understanding; bySubjStat[s.subjectId].n++; });
  const statList = Object.entries(bySubjStat).map(([id, d]) => ({ id, avgU: d.u / d.n }));
  const bestSubj = statList.sort((a, b) => b.avgU - a.avgU)[0];
  const worstSubj = statList.sort((a, b) => a.avgU - b.avgU)[0];
  const totalPomo = sessions.filter(s => s.duration >= 25).length;
  const doneGoals = state.goals.filter(g => g.status === 'completed').length;
  const completionRate = state.goals.length ? Math.round(doneGoals / state.goals.length * 100) : 0;
  const statsData = [
    { label: 'Rata-rata Fokus', val: fmtMin(avgFocus) },
    { label: 'Sesi Terpanjang', val: fmtMin(longest) },
    { label: 'Mapel Terbaik', val: bestSubj ? subjById(bestSubj.id).name : '—' },
    { label: 'Mapel Terlemah', val: worstSubj ? subjById(worstSubj.id).name : '—' },
    { label: 'Total Pomodoro', val: totalPomo },
    { label: 'Target Tercapai', val: `${completionRate}%` },
  ];
  statsData.forEach(s => { statsEl.innerHTML += `<div class="metric"><div class="metric-label">${s.label}</div><div class="metric-val" style="font-size:18px">${s.val}</div></div>`; });

  /* Achievements */
  const achEl = qs('#ach-grid');
  getAchievements().forEach(a => {
    achEl.innerHTML += `<div class="ach-badge ${a.unlocked ? 'unlocked' : ''}"><div class="ach-icon">${a.icon}</div><div class="ach-name">${a.name}</div></div>`;
  });

  const hmWrap = qs('#heatmap-wrap');
  for (let i = 13; i >= 0; i--) {
    const date = daysAgo(i);
    const dayMin = sessions.filter(s => s.date === date).reduce((a, s) => a + s.duration, 0);
    const intensity = dayMin === 0 ? 0 : dayMin < 30 ? 1 : dayMin < 60 ? 2 : dayMin < 90 ? 3 : 4;
    const colors = ['rgba(15,45,30,0.06)', 'rgba(15,157,88,0.25)', 'rgba(15,157,88,0.45)', 'rgba(15,157,88,0.7)', '#0f9d58'];
    const cell = h('div', { title: `${new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}: ${fmtMin(dayMin)}`, className: 'hm-cell' });
    cell.style.background = colors[intensity];
    hmWrap.appendChild(cell);
  }

  const subjBars = qs('#subj-bars');
  const bySubj = {}; sessions.forEach(s => { bySubj[s.subjectId] = (bySubj[s.subjectId] || 0) + s.duration; });
  const maxMin = Math.max(...Object.values(bySubj), 1);
  state.subjects.forEach(subj => {
    const m = bySubj[subj.id] || 0; if (!m) return;
    const pct = Math.round(m / maxMin * 100);
    subjBars.innerHTML += `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px"><span style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:${subj.color}"></span>${subj.name}</span><span style="font-family:var(--mono);font-size:11.5px;color:var(--text-muted)">${fmtMin(m)}</span></div><div class="prog-wrap"><div class="prog-fill" style="width:${pct}%;background:${subj.color}"></div></div></div>`;
  });

  /* ── CHART.JS: tren 14 hari ── */
  if (window.Chart) {
    const labels = []; const dataVals = [];
    for (let i = 13; i >= 0; i--) {
      const date = daysAgo(i);
      labels.push(new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
      dataVals.push(sessions.filter(s => s.date === date).reduce((a, s) => a + s.duration, 0));
    }
    const gridColor = getComputedStyle(document.body).getPropertyValue('--border').trim() || 'rgba(0,0,0,0.08)';
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-muted').trim() || '#666';
    const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#0f7a4f';
    const trendCanvas = qs('#trend-chart');
    if (trendCanvas) {
      if (trendCanvas._chart) trendCanvas._chart.destroy();
      trendCanvas._chart = new Chart(trendCanvas, {
        type: 'line',
        data: { labels, datasets: [{ label: 'Menit belajar', data: dataVals, borderColor: accentColor, backgroundColor: accentColor + '33', fill: true, tension: 0.35, pointRadius: 2 }] },
        options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } }, y: { ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } } } }
      });
    }
    const pieCanvas = qs('#subj-pie');
    if (pieCanvas && Object.keys(bySubj).length) {
      if (pieCanvas._chart) pieCanvas._chart.destroy();
      const pieLabels = state.subjects.filter(s => bySubj[s.id]).map(s => s.name);
      const pieData = state.subjects.filter(s => bySubj[s.id]).map(s => bySubj[s.id]);
      const pieColors = state.subjects.filter(s => bySubj[s.id]).map(s => s.color);
      pieCanvas._chart = new Chart(pieCanvas, {
        type: 'doughnut',
        data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: pieColors, borderWidth: 0 }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 }, boxWidth: 10 } } } }
      });
    }
  }
}

/* ─── GOALS ─── */
const GOAL_CATEGORIES = { akademik: '🎓 Akademik', skill: '🛠️ Skill', sertifikasi: '📜 Sertifikasi', lainnya: '📌 Lainnya' };
const REPEAT_LABELS = { none: 'Tidak berulang', weekly: 'Mingguan', monthly: 'Bulanan' };

function renderGoals(el) {
  let showForm = false;
  let goalSearch = '';
  let goalSort = 'deadline';

  function getFilteredSortedGoals() {
    const q = goalSearch.trim().toLowerCase();
    let list = state.goals.filter(g => !q || g.title.toLowerCase().includes(q) || subjById(g.subjectId).name.toLowerCase().includes(q));
    const now = new Date();
    if (goalSort === 'newest') list = [...list].sort((a, b) => (b.id > a.id ? 1 : -1));
    else if (goalSort === 'oldest') list = [...list].sort((a, b) => (a.id > b.id ? 1 : -1));
    else if (goalSort === 'deadline') list = [...list].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    else if (goalSort === 'priority') list = [...list].sort((a, b) => a.priority - b.priority);
    return list;
  }

  function rerender() {
    el.innerHTML = '';

    /* reminder banner */
    const now = new Date();
    const dueSoon = state.goals.filter(g => g.status !== 'completed' && g.reminderEnabled !== false && Math.ceil((new Date(g.deadline) - now) / 86400000) <= (g.reminderDays || 3) && Math.ceil((new Date(g.deadline) - now) / 86400000) >= 0);
    if (dueSoon.length > 0) {
      const banner = h('div', { className: 'goal-reminder-banner' }, `<i class="ti ti-bell-ringing"></i> ${dueSoon.length} target mendekati deadline: ${dueSoon.map(g => g.title).join(', ')}`);
      el.appendChild(banner);
    }

    /* toolbar: add + search + sort */
    const toolbarTop = h('div', { style: 'display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px' });
    const addBtn = h('button', { className: 'btn' + (showForm ? '' : ' primary'), onclick: () => { showForm = !showForm; rerender(); } },
      showForm ? 'Batal' : '<i class="ti ti-plus"></i>Tambah target');
    toolbarTop.appendChild(addBtn);
    el.appendChild(toolbarTop);

    const goalToolbar = h('div', { className: 'goal-toolbar' });
    goalToolbar.innerHTML = `
      <input type="text" id="goal-search-input" placeholder="Cari target..." value="${goalSearch}">
      <select id="goal-sort-select">
        <option value="deadline" ${goalSort === 'deadline' ? 'selected' : ''}>Deadline terdekat</option>
        <option value="newest" ${goalSort === 'newest' ? 'selected' : ''}>Terbaru</option>
        <option value="oldest" ${goalSort === 'oldest' ? 'selected' : ''}>Terlama</option>
        <option value="priority" ${goalSort === 'priority' ? 'selected' : ''}>Prioritas</option>
      </select>`;
    el.appendChild(goalToolbar);
    qs('#goal-search-input').oninput = (e) => { goalSearch = e.target.value; rerender(); };
    qs('#goal-sort-select').onchange = (e) => { goalSort = e.target.value; rerender(); };
    if (qs('#goal-search-input')) { const inp = qs('#goal-search-input'); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }

    if (showForm) {
      const form = h('div', { className: 'add-form' });
      form.innerHTML = `<div class="card-title" style="margin-bottom:2px">Target baru</div>
        <div class="card-sub">Berdasarkan prinsip SMART</div>
        <label class="field-label">Judul target</label>
        <input type="text" id="g-title" placeholder="Contoh: Kuasai bab integral">
        <label class="field-label">Mata pelajaran</label>
        <select id="g-subj">${state.subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}</select>
        <label class="field-label">Kategori</label>
        <select id="g-category">${Object.entries(GOAL_CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <label class="field-label">Deadline</label>
        <input type="date" id="g-deadline" value="${daysAgo(-14)}">
        <label class="field-label">Langkah pertama</label>
        <input type="text" id="g-ms1" placeholder="Milestone 1">
        <input type="text" id="g-ms2" placeholder="Milestone 2 (opsional)">
        <div style="display:flex;gap:10px;align-items:flex-end">
          <div style="flex:1">
            <label class="field-label">Ulangi target</label>
            <select id="g-repeat">${Object.entries(REPEAT_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
          </div>
          <div style="flex:1">
            <label class="field-label" style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="g-reminder" checked style="width:auto;margin:0"> Reminder deadline</label>
            <input type="text" id="g-reminder-days" value="3" placeholder="Hari sebelum deadline" style="margin-top:6px">
          </div>
        </div>
        <div class="btn-row" style="margin-top:6px">
          <button class="btn primary" id="save-goal-btn"><i class="ti ti-device-floppy"></i>Simpan</button>
        </div>`;
      el.appendChild(form);
      qs('#save-goal-btn').onclick = () => {
        const title = qs('#g-title').value.trim(); if (!title) return;
        const ms = [];
        const m1 = qs('#g-ms1').value.trim(); if (m1) ms.push({ id: 'm' + Date.now(), title: m1, done: false });
        const m2 = qs('#g-ms2').value.trim(); if (m2) ms.push({ id: 'm' + (Date.now() + 1), title: m2, done: false });
        state.goals.push({
          id: 'g' + Date.now(), title, subjectId: qs('#g-subj').value, deadline: qs('#g-deadline').value,
          category: qs('#g-category').value, priority: 2, status: 'in_progress', milestones: ms,
          repeat: qs('#g-repeat').value, reminderEnabled: qs('#g-reminder').checked,
          reminderDays: parseInt(qs('#g-reminder-days').value) || 3, manualProgress: 0
        });
        showForm = false; showToast('✓ Target tersimpan!'); saveState(); rerender();
      };
    }

    getFilteredSortedGoals().forEach(goal => {
      const subj = subjById(goal.subjectId);
      const doneCount = goal.milestones.filter(m => m.done).length;
      const total = goal.milestones.length;
      const pct = total ? Math.round(doneCount / total * 100) : (goal.manualProgress || 0);
      const daysLeft = Math.ceil((new Date(goal.deadline) - now) / 86400000);
      const catLabel = GOAL_CATEGORIES[goal.category] || '';

      const card = h('div', { className: 'card' });
      card.innerHTML = `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px">${goal.title}</div>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="display:flex;align-items:center;gap:5px"><span class="dot" style="background:${subj.color}"></span><span style="font-size:12px;color:var(--text-muted)">${subj.name}</span></span>
            ${catLabel ? `<span class="goal-cat-tag">${catLabel}</span>` : ''}
            ${goal.repeat && goal.repeat !== 'none' ? `<span class="goal-cat-tag"><i class="ti ti-repeat" style="font-size:10px"></i> ${REPEAT_LABELS[goal.repeat]}</span>` : ''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <span class="days-chip" style="${daysLeft <= (goal.reminderDays || 3) && daysLeft >= 0 && goal.status !== 'completed' ? 'background:var(--red-soft);color:var(--red);border-color:var(--red-border)' : ''}">${daysLeft > 0 ? daysLeft + 'h lagi' : daysLeft === 0 ? 'Hari ini' : Math.abs(daysLeft) + 'h lewat'}</span>
          <button class="icon-btn goal-edit-btn" title="Edit target"><i class="ti ti-pencil"></i></button>
          <button class="icon-btn del goal-del-btn" title="Hapus target"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--text-muted);margin-bottom:5px"><span>${total ? 'Progres milestone' : 'Progres manual'}</span><span>${total ? doneCount + '/' + total + ' ' : ''}(${pct}%)</span></div>
      <div class="prog-wrap" style="margin-bottom:12px"><div class="prog-fill" style="width:${pct}%;background:${subj.color}"></div></div>
      <div id="ms-${goal.id}"></div>`;
      el.appendChild(card);

      card.querySelector('.goal-edit-btn').onclick = () => {
        openModal(`
          <div class="modal-title"><i class="ti ti-pencil"></i> Edit target</div>
          <label class="field-label">Judul target</label>
          <input type="text" id="eg-title" value="${goal.title}">
          <label class="field-label">Mata pelajaran</label>
          <select id="eg-subj">${state.subjects.map(s => `<option value="${s.id}" ${s.id === goal.subjectId ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
          <label class="field-label">Kategori</label>
          <select id="eg-category">${Object.entries(GOAL_CATEGORIES).map(([k, v]) => `<option value="${k}" ${goal.category === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <label class="field-label">Deadline</label>
          <input type="date" id="eg-deadline" value="${goal.deadline}">
          ${!total ? `<label class="field-label">Progres manual (%)</label><input type="text" id="eg-progress" value="${goal.manualProgress || 0}">` : ''}
          <div style="display:flex;gap:10px;align-items:flex-end">
            <div style="flex:1">
              <label class="field-label">Ulangi target</label>
              <select id="eg-repeat">${Object.entries(REPEAT_LABELS).map(([k, v]) => `<option value="${k}" ${(goal.repeat || 'none') === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
            </div>
            <div style="flex:1">
              <label class="field-label" style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="eg-reminder" ${goal.reminderEnabled !== false ? 'checked' : ''} style="width:auto;margin:0"> Reminder</label>
              <input type="text" id="eg-reminder-days" value="${goal.reminderDays || 3}" style="margin-top:6px">
            </div>
          </div>
          <div class="btn-row" style="margin-top:8px">
            <button class="btn primary" id="eg-save">Simpan</button>
            <button class="btn" id="eg-cancel">Batal</button>
          </div>`, (overlay) => {
          overlay.querySelector('#eg-save').onclick = () => {
            const title = overlay.querySelector('#eg-title').value.trim();
            if (!title) return;
            goal.title = title;
            goal.subjectId = overlay.querySelector('#eg-subj').value;
            goal.category = overlay.querySelector('#eg-category').value;
            goal.deadline = overlay.querySelector('#eg-deadline').value;
            goal.repeat = overlay.querySelector('#eg-repeat').value;
            goal.reminderEnabled = overlay.querySelector('#eg-reminder').checked;
            goal.reminderDays = parseInt(overlay.querySelector('#eg-reminder-days').value) || 3;
            const progInput = overlay.querySelector('#eg-progress');
            if (progInput) goal.manualProgress = Math.max(0, Math.min(100, parseInt(progInput.value) || 0));
            saveState(); overlay.remove(); rerender();
            showToast('✓ Target diperbarui!');
          };
          overlay.querySelector('#eg-cancel').onclick = () => overlay.remove();
        });
      };

      card.querySelector('.goal-del-btn').onclick = () => {
        if (!confirm(`Hapus target "${goal.title}"?`)) return;
        state.goals = state.goals.filter(g => g.id !== goal.id);
        saveState(); rerender();
      };

      const msEl = card.querySelector('#ms-' + goal.id);
      goal.milestones.forEach(ms => {
        const row = h('div', { className: 'milestone' });
        const chk = h('div', { className: 'ms-check' + (ms.done ? ' done' : ''), onclick: () => { ms.done = !ms.done; goal.status = goal.milestones.every(m => m.done) ? 'completed' : 'in_progress'; saveState(); rerender(); } }, ms.done ? '<i class="ti ti-check" style="font-size:10px"></i>' : '');
        const lbl = h('span', { style: `font-size:13px;flex:1;color:${ms.done ? 'var(--text-muted)' : 'var(--text)'};text-decoration:${ms.done ? 'line-through' : 'none'}`, onclick: () => { ms.done = !ms.done; goal.status = goal.milestones.every(m => m.done) ? 'completed' : 'in_progress'; saveState(); rerender(); } }, ms.title);
        const editMs = h('button', { className: 'icon-btn', title: 'Edit milestone', onclick: (e) => {
          e.stopPropagation();
          openModal(`
            <div class="modal-title"><i class="ti ti-pencil"></i> Edit milestone</div>
            <label class="field-label">Judul milestone</label>
            <input type="text" id="ems-title" value="${ms.title}">
            <div class="btn-row" style="margin-top:8px">
              <button class="btn primary" id="ems-save">Simpan</button>
              <button class="btn" id="ems-cancel">Batal</button>
            </div>`, (overlay) => {
            const input = overlay.querySelector('#ems-title');
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
            const save = () => {
              const title = overlay.querySelector('#ems-title').value.trim();
              if (!title) return;
              ms.title = title;
              saveState(); overlay.remove(); rerender();
              showToast('✓ Milestone diperbarui!');
            };
            overlay.querySelector('#ems-save').onclick = save;
            input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') save(); });
            overlay.querySelector('#ems-cancel').onclick = () => overlay.remove();
          });
        } }, '<i class="ti ti-pencil" style="font-size:11px"></i>');
        const delMs = h('button', { className: 'icon-btn del', title: 'Hapus milestone', onclick: (e) => { e.stopPropagation(); goal.milestones = goal.milestones.filter(x => x.id !== ms.id); saveState(); rerender(); } }, '<i class="ti ti-x" style="font-size:11px"></i>');
        row.appendChild(chk); row.appendChild(lbl); row.appendChild(editMs); row.appendChild(delMs); msEl.appendChild(row);
      });
    });
  }
  rerender();
}

/* ─── BURNOUT ─── */
function renderBurnout(el) {
  const score = computeBurnoutScore(state.sessions);
  const now = new Date();
  const last7 = state.sessions.filter(s => (now - new Date(s.date)) / 86400000 <= 7);
  const prev7 = state.sessions.filter(s => { const d = (now - new Date(s.date)) / 86400000; return d > 7 && d <= 14; });
  const mLast = last7.reduce((a, s) => a + s.duration, 0);
  const mPrev = prev7.reduce((a, s) => a + s.duration, 0);
  const avgU = last7.length ? Math.round(last7.reduce((a, s) => a + s.understanding, 0) / last7.length * 10) / 10 : 0;
  const streak = computeStreak(state.sessions);
  const durationDrop = mPrev > 0 ? Math.round((mPrev - mLast) / mPrev * 100) : 0;
  const color = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981';
  const label = score >= 70 ? 'Risiko Tinggi' : score >= 40 ? 'Perlu Perhatian' : 'Kondisi Baik';

  el.innerHTML = `
    <div class="card" style="text-align:center;padding:28px 20px">
      <div style="font-family:var(--mono);font-size:60px;font-weight:700;color:${color};line-height:1;letter-spacing:-0.03em">${score}<span style="font-size:24px">%</span></div>
      <div style="font-size:14px;font-weight:600;margin-top:8px;color:${color}">${label}</div>
      <div class="burnout-meter" style="max-width:240px;margin:14px auto 0">
        <div class="burnout-fill" style="width:${score}%;background:${color}"></div>
      </div>
      <div style="font-size:11px;color:var(--text-dim);margin-top:8px">Berdasarkan perubahan pola belajar otomatis</div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">Indikator sinyal</div>
      <div class="metric" style="margin-bottom:8px">
        <div class="metric-label"><i class="ti ti-clock"></i> Durasi 7 hari terakhir</div>
        <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${durationDrop > 30 ? '#ef4444' : durationDrop > 10 ? '#f59e0b' : '#10b981'}">${fmtMin(mLast)} <span style="font-size:12px;font-weight:400;color:var(--text-muted)">${durationDrop > 0 ? '−' + durationDrop + '%' : '+' + Math.abs(durationDrop) + '%'} vs minggu lalu</span></div>
      </div>
      <div class="metric" style="margin-bottom:8px">
        <div class="metric-label"><i class="ti ti-brain"></i> Pemahaman rata-rata (7 hari)</div>
        <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${avgU < 5 ? '#ef4444' : avgU < 7 ? '#f59e0b' : '#10b981'}">${avgU}<span style="font-size:12px;font-weight:400;color:var(--text-muted)">/10</span></div>
      </div>
      <div class="metric">
        <div class="metric-label"><i class="ti ti-flame"></i> Streak belajar</div>
        <div style="font-size:18px;font-weight:600;font-family:var(--mono);color:${streak === 0 ? '#ef4444' : streak < 3 ? '#f59e0b' : '#10b981'}">${streak}<span style="font-size:12px;font-weight:400;color:var(--text-muted)"> hari beruntun</span></div>
      </div>
    </div>
    <div class="card" style="border-color:${color}33">
      <div class="card-title" style="margin-bottom:8px">Rekomendasi</div>
      <div style="font-size:13px;color:var(--text-muted);line-height:1.7">
        ${score >= 70
          ? '<span style="color:#ef4444;font-weight:600">Tanda burnout cukup tinggi.</span> Kurangi target harian, sisipkan jeda 2 hari tanpa belajar formal, dan coba sesi singkat 15–20 menit daripada memaksakan sesi panjang.'
          : score >= 40
          ? '<span style="color:#f59e0b;font-weight:600">Perlu perhatian.</span> Ritme belajarmu mulai berubah. Variasikan materi — ganti pelajaran berat dengan yang lebih ringan. Pastikan tidur cukup.'
          : '<span style="color:#10b981;font-weight:600">Kondisi baik.</span> Pertahankan ritme saat ini. Pastikan sesi konsisten dan sisipkan review mingguan agar pemahaman tetap solid.'}
      </div>
    </div>`;
}

/* ─── SCHEDULE ─── */
function renderSchedule(el) {
  const sessions = state.sessions;
  const byDay = {};
  sessions.forEach(s => { const d = new Date(s.date + 'T00:00:00').getDay(); byDay[d] = (byDay[d] || 0) + s.duration; });
  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const maxDay = Math.max(...Object.values(byDay), 1);
  const bySubj = {}; sessions.forEach(s => { bySubj[s.subjectId] = (bySubj[s.subjectId] || 0) + s.duration; });
  const sortedSubj = Object.entries(bySubj).sort((a, b) => b[1] - a[1]);
  const mostStudied = sortedSubj[0] ? subjById(sortedSubj[0][0]).name : '—';
  const leastStudied = sortedSubj[sortedSubj.length - 1] ? subjById(sortedSubj[sortedSubj.length - 1][0]).name : '—';
  const peakDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
  const peakDayName = peakDay ? DAY_NAMES[+peakDay[0]] : '—';

  el.innerHTML = `
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">Pola aktivitas harian</div>
      <div class="card-sub">Total durasi per hari dalam semua sesi tercatat</div>
      <div id="sched-days" style="margin-top:4px"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:8px">Rekomendasi minggu ini</div>
      <div style="font-size:13px;color:var(--text-muted);line-height:1.7;margin-bottom:14px">
        Puncak aktivitasmu ada di hari <span style="color:var(--text);font-weight:600">${peakDayName}</span> — jadwalkan materi paling menantang di sini.
        Paling banyak dipelajari: <span style="color:var(--text);font-weight:600">${mostStudied}</span>. Paling sedikit: <span style="color:var(--text);font-weight:600">${leastStudied}</span> — tambah minimal 1 sesi.
      </div>
      <div id="rec-slots"></div>
    </div>`;

  const daysEl = qs('#sched-days');
  DAY_NAMES.forEach((name, i) => {
    const m = byDay[i] || 0;
    const pct = Math.round(m / maxDay * 100);
    daysEl.innerHTML += `<div class="sched-row"><span class="sched-day">${name}</span><div class="sched-bar-bg"><div class="sched-bar-fill" style="width:${pct}%"></div></div><span class="sched-time">${fmtMin(m)}</span></div>`;
  });

  const today = new Date().getDay();
  const suggestions = [
    { day: (today + 1) % 7, subj: leastStudied, duration: '30–45 menit', note: 'Materi tertinggal' },
    { day: (today + 3) % 7, subj: mostStudied, duration: '60 menit', note: 'Sesi fokus' },
    { day: (today + 5) % 7, subj: 'Review', duration: '20 menit', note: 'Ulang materi minggu ini' },
  ];
  const recSlots = qs('#rec-slots');
  suggestions.forEach(s => {
    recSlots.innerHTML += `<div class="rec-slot"><i class="ti ti-calendar-event"></i><div><div class="rec-slot-title">${DAY_NAMES[s.day]} — ${s.subj}</div><div class="rec-slot-sub">${s.duration} · ${s.note}</div></div></div>`;
  });
}

/* ─── GAP ─── */
function renderGap(el) {
  const sessions = state.sessions;
  const bySubj = {};
  sessions.forEach(s => {
    if (!bySubj[s.subjectId]) bySubj[s.subjectId] = { total: 0, count: 0 };
    bySubj[s.subjectId].total += s.understanding;
    bySubj[s.subjectId].count++;
  });
  const gaps = Object.entries(bySubj).map(([id, d]) => {
    const avg = d.total / d.count;
    return { id, avg: Math.round(avg * 10) / 10, count: d.count, subj: subjById(id) };
  }).sort((a, b) => a.avg - b.avg);

  el.innerHTML = `
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">Knowledge Gap Mapping</div>
      <div class="card-sub">Skor rendah = prioritas belajar lebih tinggi</div>
      <div style="margin-top:8px" id="gap-bars"></div>
    </div>
    <div class="card" id="gap-recs">
      <div class="card-title" style="margin-bottom:10px">Prioritas belajar</div>
      <div id="gap-rec-list"></div>
    </div>`;

  const gapBars = qs('#gap-bars');
  gaps.forEach(g => {
    const pct = Math.round(g.avg / 10 * 100);
    const color = g.avg >= 7 ? '#10b981' : g.avg >= 5 ? '#f59e0b' : '#ef4444';
    const label = g.avg >= 7 ? 'Baik' : g.avg >= 5 ? 'Perhatian' : 'Gap';
    gapBars.innerHTML += `<div class="gap-row"><span class="gap-subj"><span class="dot" style="background:${g.subj.color}"></span>${g.subj.name}</span><div class="gap-bar-bg"><div class="gap-bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="gap-score">${g.avg}/10</span><span style="font-size:11px;color:${color};min-width:60px;text-align:right">${label}</span></div>`;
  });

  const recList = qs('#gap-rec-list');
  const weakSubjs = gaps.filter(g => g.avg < 6);
  if (weakSubjs.length === 0) { recList.innerHTML = '<div class="empty">Semua mata pelajaran dalam kondisi baik!</div>'; }
  else weakSubjs.forEach((g, i) => {
    recList.innerHTML += `<div style="display:flex;gap:12px;padding:12px;background:var(--red-soft);border:1px solid var(--red-border);border-radius:var(--radius-sm);margin-bottom:8px"><span style="font-family:var(--mono);font-size:20px;font-weight:700;color:var(--red);opacity:0.5">0${i + 1}</span><div><div style="font-size:13px;font-weight:600;margin-bottom:3px;color:var(--red)">${g.subj.name} — rata-rata ${g.avg}/10</div><div style="font-size:12.5px;color:var(--text-muted)">Ulang materi dasar sebelum lanjut ke topik berikutnya. Tambah minimal 2 sesi fokus minggu ini.</div></div></div>`;
  });
}

/* ─── INSIGHTS ─── */
function renderInsights(el) {
  const sessions = state.sessions;
  const goals = state.goals;

  el.innerHTML = `
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">📅 Laporan Mingguan</div>
      <div class="card-sub">Ringkasan otomatis performa belajarmu minggu ini</div>
      <div class="report-grid" id="weekly-report-grid"></div>
      <div id="weekly-report-text" style="font-size:12.5px;color:var(--text-muted);line-height:1.7"></div>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:2px">AI Pattern Analysis</div>
      <div class="card-sub">Didukung Google Gemini — analisis mendalam pola belajarmu</div>
      <div id="ai-result" class="ai-bubble loading">Menganalisis pola belajarmu...</div>
      <button class="btn" id="refresh-ai-btn"><i class="ti ti-refresh"></i>Perbarui analisis</button>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">Insight otomatis</div>
      <div id="rule-insights"></div>
    </div>`;

  /* ── LAPORAN MINGGUAN (rule-based) ── */
  (function buildWeeklyReport() {
    const now = new Date();
    const thisWeek = sessions.filter(s => (now - new Date(s.date)) / 86400000 <= 7);
    const lastWeek = sessions.filter(s => { const d = (now - new Date(s.date)) / 86400000; return d > 7 && d <= 14; });
    const minThis = thisWeek.reduce((a, s) => a + s.duration, 0);
    const minLast = lastWeek.reduce((a, s) => a + s.duration, 0);
    const productivity = minLast > 0 ? Math.round((minThis - minLast) / minLast * 100) : (minThis > 0 ? 100 : 0);
    const bySubjWeek = {};
    thisWeek.forEach(s => { if (!bySubjWeek[s.subjectId]) bySubjWeek[s.subjectId] = { total: 0, n: 0 }; bySubjWeek[s.subjectId].total += s.understanding; bySubjWeek[s.subjectId].n++; });
    const hardest = Object.entries(bySubjWeek).map(([id, d]) => ({ id, avg: d.total / d.n })).sort((a, b) => a.avg - b.avg)[0];
    const hardestName = hardest ? subjById(hardest.id).name : '—';
    let saran = 'Belum cukup data minggu ini — mulai catat sesi belajar agar laporan lebih akurat.';
    if (thisWeek.length > 0) {
      if (productivity < -10) saran = 'Waktu belajar menurun dibanding minggu lalu. Coba jadwalkan sesi pendek tapi konsisten setiap hari.';
      else if (productivity > 10) saran = 'Momentum belajarmu naik! Pertahankan ritme ini, tapi tetap sisipkan waktu istirahat agar tidak burnout.';
      else saran = `Fokuskan waktu tambahan ke ${hardestName} minggu depan karena pemahamannya masih paling rendah.`;
    }
    qs('#weekly-report-grid').innerHTML = `
      <div class="report-metric"><div class="rm-val">${fmtMin(minThis)}</div><div class="rm-label">Belajar Minggu Ini</div></div>
      <div class="report-metric"><div class="rm-val" style="color:${productivity >= 0 ? 'var(--green)' : 'var(--red)'}">${productivity >= 0 ? '+' : ''}${productivity}%</div><div class="rm-label">Produktivitas</div></div>
      <div class="report-metric"><div class="rm-val" style="font-size:14px">${hardestName}</div><div class="rm-label">Topik Tersulit</div></div>
      <div class="report-metric"><div class="rm-val" style="font-size:14px">${thisWeek.length}</div><div class="rm-label">Sesi Minggu Ini</div></div>`;
    qs('#weekly-report-text').innerHTML = `<strong style="color:var(--text)">Saran minggu depan:</strong> ${saran}`;
  })();

  function buildRuleInsights() {
    const now = new Date();
    const last7 = sessions.filter(s => (now - new Date(s.date)) / 86400000 <= 7);
    const prev7 = sessions.filter(s => { const d = (now - new Date(s.date)) / 86400000; return d > 7 && d <= 14; });
    const mLast = last7.reduce((a, s) => a + s.duration, 0);
    const mPrev = prev7.reduce((a, s) => a + s.duration, 0);
    const ins = [];
    if (mPrev > 0) {
      const ch = (mLast - mPrev) / mPrev;
      if (ch <= -0.3) ins.push({ type: 'warning', title: 'Waktu belajar menurun tajam', body: `Durasi turun ${Math.abs(Math.round(ch * 100))}% vs minggu lalu. Cek ritme dan istirahatmu.` });
      else if (ch >= 0.3) ins.push({ type: 'positive', title: 'Momentum belajar meningkat', body: `Durasi naik ${Math.round(ch * 100)}% vs minggu lalu. Pertahankan tapi sisipkan istirahat.` });
    }
    const bySubjU = {}; sessions.forEach(s => { if (!bySubjU[s.subjectId]) bySubjU[s.subjectId] = []; bySubjU[s.subjectId].push(s.understanding); });
    Object.entries(bySubjU).forEach(([id, scores]) => { const avg = scores.reduce((a, b) => a + b, 0) / scores.length; if (avg <= 5 && scores.length >= 2) ins.push({ type: 'danger', title: `Gap di ${subjById(id).name}`, body: `Rata-rata pemahaman ${avg.toFixed(1)}/10 dari ${scores.length} sesi. Ulang materi dasar.` }); });
    goals.filter(g => g.status !== 'completed').forEach(g => {
      const dl = Math.ceil((new Date(g.deadline) - now) / 86400000);
      const done = g.milestones.filter(m => m.done).length;
      if (dl <= 7 && done < g.milestones.length) ins.push({ type: 'warning', title: `"${g.title}" mendekati tenggat`, body: `${dl} hari lagi, baru ${done}/${g.milestones.length} milestone selesai.` });
    });
    if (ins.length === 0) ins.push({ type: 'info', title: 'Belum cukup data', body: 'Catat lebih banyak sesi agar insight lebih tajam.' });
    return ins;
  }

  const ruleEl = qs('#rule-insights');
  buildRuleInsights().forEach(ins => {
    ruleEl.innerHTML += `<div class="insight ${ins.type}"><div class="insight-title">${ins.title}</div><div class="insight-body">${ins.body}</div></div>`;
  });

  function formatAiText(raw) {
    const esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const withBold = esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const paragraphs = withBold.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length <= 1) {
      return withBold.split(/\n/).map(p => p.trim()).filter(Boolean).map(p => `<p>${p}</p>`).join('');
    }
    return paragraphs.map(p => `<p>${p.replace(/\n/g, ' ')}</p>`).join('');
  }

  async function fetchAI() {
    const resultEl = qs('#ai-result'); if (!resultEl) return;
    const cacheKey = JSON.stringify(sessions.map(s => s.id)).slice(0, 80) + '|' + JSON.stringify(goals.map(g => `${g.id}:${g.milestones.filter(m => m.done).length}:${g.status}`)).slice(0, 80);
    if (state.aiCache[cacheKey]) { resultEl.className = 'ai-bubble ready'; resultEl.innerHTML = formatAiText(state.aiCache[cacheKey]); return; }
    resultEl.className = 'ai-bubble loading'; resultEl.textContent = 'Menganalisis pola belajarmu dengan AI...';
    const now = new Date();
    const goalsSummary = goals.length ? goals.map(g => {
      const done = g.milestones.filter(m => m.done).length;
      const totalM = g.milestones.length;
      const dl = Math.ceil((new Date(g.deadline) - now) / 86400000);
      const subjName = g.subjectId ? subjById(g.subjectId).name : '-';
      const statusLabel = g.status === 'completed' ? 'TERCAPAI' : (dl < 0 ? 'LEWAT DEADLINE' : `${dl} hari lagi`);
      return `"${g.title}" (subjek: ${subjName}): ${done}/${totalM} milestone, status ${statusLabel}`;
    }).join('; ') : 'Belum ada target yang dibuat.';
    const summary = `Data: ${sessions.length} sesi. Subjek: ${[...new Set(sessions.map(s => subjById(s.subjectId).name))].join(', ')}. Avg pemahaman: ${sessions.length ? Math.round(sessions.reduce((a, s) => a + s.understanding, 0) / sessions.length * 10) / 10 : 0}/10. Total waktu: ${fmtMin(sessions.reduce((a, s) => a + s.duration, 0))}. Streak: ${computeStreak(sessions)} hari. Burnout: ${computeBurnoutScore(sessions)}%. Per subjek: ${state.subjects.map(s => { const ss = sessions.filter(x => x.subjectId === s.id); if (!ss.length) return null; const avg = Math.round(ss.reduce((a, x) => a + x.understanding, 0) / ss.length * 10) / 10; return `${s.name}: ${ss.length} sesi, avg ${avg}/10, total ${fmtMin(ss.reduce((a, x) => a + x.duration, 0))}`; }).filter(Boolean).join('; ')}. Target belajar: ${goalsSummary}.`;
    const systemPrompt = 'Kamu adalah asisten learning analytics. Analisis data belajar mahasiswa dan berikan insight singkat dalam bahasa Indonesia. Format: 3-4 paragraf singkat (maks 200 kata), pisahkan setiap paragraf dengan baris kosong (double newline). Boleh menebalkan istilah penting dengan **teks**. Jangan gunakan bullet point atau heading. WAJIB bahas: (1) apakah target/goal yang dibuat sudah tercapai, mendekati deadline, atau tertinggal — sebut nama targetnya, jangan cuma total jam belajar; (2) mata pelajaran/materi mana yang pemahamannya masih rendah berdasarkan avg understanding per subjek; (3) risiko burnout; (4) satu rekomendasi konkret dan spesifik (bukan generik "pertahankan semangat"). Nada: supportif, to-the-point, berbasis data, jangan cuma memuji jumlah jam belajar.';
    const userPrompt = `Data belajar:\n${summary}\n\nEvaluasi progress target-targetku (tercapai/belum/mendekati deadline) dan materi mana yang masih perlu diperkuat, lalu beri 1 rekomendasi terpenting.`;
    try {
      // Memanggil Netlify Function (server-side) agar API key Gemini tidak terekspos di browser.
      // Lihat netlify/functions/gemini.js — key dibaca dari environment variable GEMINI_API_KEY.
      const resp = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: systemPrompt, prompt: userPrompt })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Gagal memanggil AI');
      const text = data.text || 'Tidak ada respons dari AI.';
      state.aiCache[cacheKey] = text;
      if (qs('#ai-result')) { qs('#ai-result').className = 'ai-bubble ready'; qs('#ai-result').innerHTML = formatAiText(text); }
    } catch (e) {
      if (qs('#ai-result')) { qs('#ai-result').className = 'ai-bubble'; qs('#ai-result').textContent = 'Tidak dapat terhubung ke AI. Pastikan GEMINI_API_KEY sudah diset di Netlify (Site settings → Environment variables), lalu redeploy.'; }
    }
  }
  fetchAI();
  qs('#refresh-ai-btn').onclick = () => { state.aiCache = {}; fetchAI(); };
}

render();
