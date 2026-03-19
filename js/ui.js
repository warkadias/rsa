const app = chrome || browser;

// Auto-consent agar tidak redirect
app.storage.local.set({ userConsent: true, visitedUpdatePolicy: true });

// ============================================================
// STATE
// ============================================================
let isRunning = false;
let pollInterval = null;

// ============================================================
// TAB NAVIGATION
// ============================================================
document.querySelectorAll('#mainTabs .nav-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelectorAll('#mainTabs .nav-link').forEach(l => l.classList.remove('active'));
    this.classList.add('active');
    const tab = this.dataset.tab;
    document.getElementById('tab-search').style.display   = tab === 'search'   ? '' : 'none';
    document.getElementById('tab-schedule').style.display = tab === 'schedule' ? '' : 'none';
  });
});

// ============================================================
// LOAD & SAVE STORAGE
// ============================================================
function loadStorage() {
  app.storage.local.get([
    'searchDesktop','readCount',
    'scheduleDesktop',
    'searchMin','searchMax',
    'readMin','readMax','readPauseMin','readPauseMax',
    'scheduleMin','scheduleMax',
    'scheduleDefault','searchNiche','runningSearch'
  ], (r) => {
    if (r.searchDesktop  != null) $('#searchDesktop').val(r.searchDesktop);
    if (r.readCount      != null) { $('#readCount').val(r.readCount); $('#scheduleReadCount').val(r.readCount); }
    if (r.scheduleDesktop!= null) $('#scheduleDesktop').val(r.scheduleDesktop);
    if (r.searchMin      != null) $('#searchMin').val(r.searchMin);
    if (r.searchMax      != null) $('#searchMax').val(r.searchMax);
    if (r.readMin        != null) $('#readMin').val(r.readMin);
    if (r.readMax        != null) $('#readMax').val(r.readMax);
    if (r.readPauseMin   != null) $('#readPauseMin').val(r.readPauseMin);
    if (r.readPauseMax   != null) $('#readPauseMax').val(r.readPauseMax);
    if (r.scheduleMin    != null) $('#scheduleMin').val(r.scheduleMin);
    if (r.scheduleMax    != null) $('#scheduleMax').val(r.scheduleMax);

    // Preset highlight
    highlightPreset(parseInt(r.searchDesktop) || 20);

    // Niche
    const niche = r.searchNiche || 'Random';
    document.querySelectorAll('.niche-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.niche === niche);
    });

    // Schedule
    const sd = r.scheduleDefault || 'scheduleT1';
    document.querySelectorAll('.schedule-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.schedule === sd);
    });

    // Running state
    if (r.runningSearch) setRunningUI(true);
  });
}

function saveStorage(extra = {}) {
  const data = {
    searchDesktop:  parseInt($('#searchDesktop').val())  || 20,
    readCount:      parseInt($('#readCount').val())      || 10,
    scheduleDesktop:parseInt($('#scheduleDesktop').val())|| 20,
    searchMin:      parseInt($('#searchMin').val())      || 10,
    searchMax:      parseInt($('#searchMax').val())      || 25,
    readMin:        parseInt($('#readMin').val())        || 15,
    readMax:        parseInt($('#readMax').val())        || 30,
    readPauseMin:   parseInt($('#readPauseMin').val())   || 5,
    readPauseMax:   parseInt($('#readPauseMax').val())   || 10,
    scheduleMin:    parseInt($('#scheduleMin').val())    || 10,
    scheduleMax:    parseInt($('#scheduleMax').val())    || 25,
    ...extra
  };
  app.storage.local.set(data);
}

// ============================================================
// PRESET BUTTONS
// ============================================================
function highlightPreset(val) {
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.pc) === val);
  });
}

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const val = parseInt(this.dataset.pc);
    $('#searchDesktop').val(val);
    highlightPreset(val);
    saveStorage();
  });
});

// ============================================================
// NICHE PILLS
// ============================================================
document.querySelectorAll('.niche-pill').forEach(pill => {
  pill.addEventListener('click', function() {
    document.querySelectorAll('.niche-pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    app.storage.local.set({ searchNiche: this.dataset.niche });
  });
});

// ============================================================
// SCHEDULE PILLS
// ============================================================
document.querySelectorAll('.schedule-pill').forEach(pill => {
  pill.addEventListener('click', function() {
    document.querySelectorAll('.schedule-pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
    const sd = this.dataset.schedule;
    const extra = { scheduleDefault: sd };
    if (sd === 'scheduleT3') { extra.scheduleDesktop = 1; extra.readCount = 2; $('#scheduleDesktop').val(1); $('#scheduleReadCount').val(2); }
    if (sd === 'scheduleT4') { extra.scheduleDesktop = 3; extra.readCount = 5; $('#scheduleDesktop').val(3); $('#scheduleReadCount').val(5); }
    app.storage.local.set(extra);
    app.runtime.sendMessage({ message: 'scheduleUpdate' });
  });
});

// ============================================================
// INPUT EVENTS — auto-save
// ============================================================
['searchDesktop','readCount','searchMin','searchMax','readMin','readMax','readPauseMin','readPauseMax',
 'scheduleDesktop','scheduleReadCount','scheduleMin','scheduleMax'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', function() {
    if (id === 'searchDesktop') highlightPreset(parseInt(this.value));
    if (id === 'scheduleReadCount') $('#readCount').val(this.value);
    saveStorage();
  });
});

// ============================================================
// RUNNING UI STATE
// ============================================================
function setRunningUI(running) {
  isRunning = running;
  document.getElementById('btnSearch').disabled = running;
  document.getElementById('btnStop').style.display = running ? '' : 'none';
  document.getElementById('progressSection').style.display = running ? '' : 'none';
  document.getElementById('statusDot').className = 'status-dot' + (running ? ' running' : '');
  document.getElementById('statusText').textContent = running ? 'Berjalan...' : 'Idle';
  if (running) startPolling();
  else stopPolling();
}

// ============================================================
// POLLING — update progress dari storage
// ============================================================
function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(() => {
    app.storage.local.get(['runningSearch','searchCount','totalSearches','currentPhase','lastLog'], (r) => {
      if (!r.runningSearch && isRunning) {
        setRunningUI(false);
        updateProgress(r.searchCount || 0, r.totalSearches || 20, 'done', r.lastLog || '');
        return;
      }
      updateProgress(
        r.searchCount   || 0,
        r.totalSearches || 20,
        r.currentPhase  || 'searching',
        r.lastLog       || ''
      );
    });
  }, 2000);
}

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}

function updateProgress(current, total, phase, lastLog) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressCurrent').textContent = current;
  document.getElementById('progressTotal').textContent = total;
  document.getElementById('lastLogText').textContent = lastLog;

  const labels = { searching: '🔍 Pencarian PC', reading: '📖 Read to Earn', done: '✅ Selesai' };
  document.getElementById('progressLabel').textContent = labels[phase] || '🔍 Pencarian PC';

  document.getElementById('phaseSearch').className = 'phase-step' + (phase === 'searching' ? ' active' : (phase !== 'idle' ? ' done' : ''));
  document.getElementById('phaseRead').className   = 'phase-step' + (phase === 'reading'   ? ' active' : (phase === 'done' ? ' done' : ''));
  document.getElementById('phaseDone').className   = 'phase-step' + (phase === 'done'       ? ' active done' : '');

  if (phase === 'done') {
    document.getElementById('statusText').textContent = 'Selesai ✓';
    document.getElementById('statusDot').className = 'status-dot';
  }
}

// ============================================================
// ACTION BUTTONS
// ============================================================
document.getElementById('btnSearch').addEventListener('click', async () => {
  saveStorage();
  await new Promise(r => setTimeout(r, 200));
  app.runtime.sendMessage({ message: 'search' });
  setRunningUI(true);
  // Reset progress
  app.storage.local.set({ searchCount: 0, currentPhase: 'searching', lastLog: '' });
  updateProgress(0, parseInt($('#searchDesktop').val()) || 20, 'searching', '');
});

document.getElementById('btnStop').addEventListener('click', () => {
  app.storage.local.set({ runningSearch: false });
  app.runtime.sendMessage({ message: 'stop' });
  setRunningUI(false);
});

document.getElementById('btnSchedule').addEventListener('click', () => {
  saveStorage();
  app.runtime.sendMessage({ message: 'schedule' });
  const btn = document.getElementById('btnSchedule');
  btn.textContent = '✅ Jadwal Tersimpan!';
  setTimeout(() => btn.textContent = '💾 Simpan Jadwal', 2000);
});

// ============================================================
// INIT
// ============================================================
loadStorage();
