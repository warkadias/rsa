// Rewards Search Automator - Modified (PC Only + Read to Earn)
// sw.js — background service worker (no ES module imports needed)

let searchDesktop, searchMin, searchMax;
let readMin, readMax, readPauseMin, readPauseMax;
let scheduleDesktop, scheduleMin, scheduleMax, scheduleDefault;
let runningSearch, userConsent, blinkTimer;

const app = chrome || browser;

// ============================================================
// INSTALL / UPDATE
// ============================================================
app.runtime.onInstalled.addListener((e) => {
  if (e.reason === 'install') {
    app.storage.local.set({
      searchDesktop: 20, searchMin: 10, searchMax: 25,
      scheduleDesktop: 20, scheduleMin: 10, scheduleMax: 25,
      scheduleDefault: 'scheduleT1',
      userConsent: true, readCount: 10,
      readMin: 15, readMax: 30, readPauseMin: 5, readPauseMax: 10,
      dateInstalledOn: new Date().toLocaleString(),
    });
  } else if (e.reason === 'update') {
    runningSearch = false;
    app.storage.local.set({ runningSearch: false, lastUpdatedOn: new Date().toLocaleString() });
  }
});

app.runtime.onStartup.addListener(async () => {
  await fetchStorage();
  app.storage.local.get(['runningSearch'], async (r) => {
    runningSearch = r.runningSearch;
    if (runningSearch) { app.storage.local.set({ runningSearch: false }); runningSearch = false; }
    if (scheduleDefault !== 'scheduleT1') {
      runningSearch = true;
      app.storage.local.set({ runningSearch: true });
      await delay(3000);
      initializeSearches(scheduleDesktop, scheduleMin, scheduleMax);
    }
  });
});

// ============================================================
// DELAY (interruptible)
// ============================================================
async function delay(ms) {
  const start = Date.now();
  await new Promise(resolve => {
    const tick = () => {
      if (!runningSearch) resolve();
      else if (Date.now() - start >= ms) resolve();
      else setTimeout(tick, 50);
    };
    tick();
  });
}

// ============================================================
// WAIT FOR TAB LOAD
// ============================================================
function waitForTabLoad(tid, timeoutMs = 15000) {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      app.tabs.onUpdated.removeListener(fn);
      resolve('timeout');
    }, timeoutMs);
    function fn(id, info) {
      if (id === tid && info.status === 'complete') {
        clearTimeout(timer);
        app.tabs.onUpdated.removeListener(fn);
        resolve('complete');
      }
    }
    app.tabs.onUpdated.addListener(fn);
  });
}

// ============================================================
// LOG TO STORAGE (UI polling)
// ============================================================
function logProgress(searchCount, totalSearches, phase, lastLog) {
  app.storage.local.set({ searchCount, totalSearches, currentPhase: phase, lastLog });
}

// ============================================================
// PC SEARCH
// ============================================================
async function search(tabId, searches, minDelay, maxDelay) {
  await delay(500);
  for (let i = 0; i < searches; i++) {
    if (!runningSearch) return;
    const wait = (Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay) * 1000;
    console.log(`[Search] ${i+1}/${searches} — delay ${wait/1000}s`);
    logProgress(i, searches, 'searching', `🔍 Mencari ${i+1}/${searches}...`);
    await delay(3000);
    try { await app.tabs.sendMessage(tabId, { message: 'menu', niche: 'random' }); } catch(e) {}
    await delay(wait - 3000 > 0 ? wait - 3000 : 1000);
    let resp;
    try { resp = await app.tabs.sendMessage(tabId, { message: 'search' }); } catch(e) {}
    if (resp) {
      logProgress(i + 1, searches, 'searching', `✅ Selesai ${i+1}/${searches}`);
      await delay(100);
    } else {
      logProgress(i, searches, 'searching', `⚠️ Gagal ${i+1} — reload`);
      try { await app.tabs.reload(tabId); await waitForTabLoad(tabId, 10000); await delay(3000); } catch(e) {}
      i--;
    }
    if (i === searches - 1) await delay(wait);
  }
}

// ============================================================
// READ TO EARN — ambil URL dari Google Apps Script JSON
// ============================================================
const JSON_SOURCE = 'https://script.google.com/macros/s/AKfycbwJ4x1yQMEn5a2dCXDDdkP9SrKRIyXjd3PpKGUBztcak1z3LeHV5--6vP7At8UrbeYy4g/exec';

// Fallback jika JSON gagal diambil
const FALLBACK_SOURCES = [
  'https://www.msn.com/id-id/berita/nasional',
  'https://www.msn.com/id-id/berita/teknologi',
  'https://www.msn.com/id-id/berita/bisnis',
  'https://www.msn.com/id-id/hiburan',
  'https://www.msn.com/id-id/olahraga',
  'https://www.msn.com/id-id/berita/dunia',
  'https://www.msn.com/id-id/kesehatan',
  'https://www.msn.com/id-id/otomotif',
  'https://www.msn.com/id-id/gaya-hidup',
  'https://www.msn.com/id-id/keuangan',
];

async function fetchArticleList() {
  try {
    logProgress(0, 0, 'reading', '🌐 Mengambil daftar artikel...');
    const resp = await fetch(JSON_SOURCE);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    // Pastikan array dan punya field url
    if (Array.isArray(data) && data.length > 0 && data[0].url) {
      console.log(`[Read] Berhasil ambil ${data.length} artikel dari JSON`);
      return data; // array of { timestamp, title, url, status, points }
    }
    throw new Error('Format JSON tidak valid');
  } catch(e) {
    console.log('[Read] Gagal fetch JSON:', e.message, '— pakai fallback');
    logProgress(0, 0, 'reading', '⚠️ Gagal ambil JSON, pakai fallback...');
    return FALLBACK_SOURCES.map(url => ({ url, title: url }));
  }
}

async function runReadToEarn(count) {
  console.log(`[Read] Mulai ${count} artikel`);

  // Ambil daftar artikel dari JSON
  const allArticles = await fetchArticleList();

  // Acak & ambil sejumlah count
  const toRead = allArticles
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  console.log(`[Read] Akan membaca ${toRead.length} artikel`);

  for (let i = 0; i < toRead.length; i++) {
    if (!runningSearch) break;

    const article = toRead[i];
    const title = article.title
      ? (article.title.length > 50 ? article.title.slice(0, 50) + '…' : article.title)
      : article.url;

    logProgress(i, count, 'reading', `📖 [${i+1}/${count}] ${title}`);
    console.log(`[Read] ${i+1}/${count} — ${article.url}`);

    let readTab;
    try {
      // Buka tab dan langsung fokus agar scroll & interaksi berjalan normal
      readTab = await app.tabs.create({ url: article.url, active: true });
      await waitForTabLoad(readTab.id, 15000);
      await delay(1500);

      // Pastikan tab ini benar-benar aktif & terfokus
      await app.tabs.update(readTab.id, { active: true });
      await app.windows.update((await app.tabs.get(readTab.id)).windowId, { focused: true });
      await delay(500);

      // Scroll seperti membaca
      await app.scripting.executeScript({
        target: { tabId: readTab.id },
        func: async () => {
          const s = ms => new Promise(r => setTimeout(r, ms));
          // Fokuskan window agar scroll smooth bekerja
          window.focus();
          await s(300);
          const h = document.body.scrollHeight || 3000;
          const steps = 8 + Math.floor(Math.random() * 6);
          for (let j = 0; j <= steps; j++) {
            window.scrollTo({ top: (h / steps) * j, behavior: 'smooth' });
            await s(700 + Math.random() * 1300);
          }
          await s(500);
          window.scrollBy({ top: -(Math.random() * 200 + 100), behavior: 'smooth' });
        },
      });

      // Baca sesuai pengaturan readMin–readMax
      const rt = (readMin + Math.floor(Math.random() * (readMax - readMin + 1))) * 1000;
      await delay(rt);
      logProgress(i + 1, count, 'reading', `✅ [${i+1}/${count}] Selesai: ${title}`);

    } catch(e) {
      console.log(`[Read] Error artikel ${i+1}:`, e.message);
      logProgress(i + 1, count, 'reading', `⚠️ [${i+1}/${count}] Error, lanjut...`);
    }

    // Tutup tab artikel
    if (readTab) { try { await app.tabs.remove(readTab.id); } catch(e) {} }

    // Jeda antar artikel sesuai pengaturan
    if (i < toRead.length - 1) {
      const pause = (readPauseMin + Math.floor(Math.random() * (readPauseMax - readPauseMin + 1))) * 1000;
      await delay(pause);
    }
  }
  console.log('[Read] Semua artikel selesai!');
}

// ============================================================
// INITIALIZE SEARCHES
// ============================================================
async function initializeSearches(desk, min, max) {
  app.alarms.clear('schedule');
  runningSearch = true;
  app.storage.local.set({ runningSearch: true, searchCount: 0, currentPhase: 'searching', lastLog: '🚀 Memulai...' });
  console.log('[Bot] Started at', new Date().toLocaleString());

  // Blink badge
  let blink = true;
  blinkTimer = setInterval(() => {
    app.action.setBadgeText({ text: blink ? '•' : '' });
    app.action.setBadgeBackgroundColor({ color: [0, 114, 255, 255] });
    blink = !blink;
  }, 500);

  // Buka tab Bing
  const tab = await app.tabs.create({ url: 'https://www.bing.com/' });
  const tabId = parseInt(tab.id);
  await waitForTabLoad(tabId, 12000);
  await delay(2000);

  // PC Search
  if (desk > 0 && runningSearch) {
    await search(tabId, desk + 2, min, max);
  }
  try { await app.tabs.remove(tabId); } catch(e) {}

  // Read to Earn
  if (runningSearch) {
    const stored = await app.storage.local.get(['readCount']);
    const rc = parseInt(stored.readCount) || 10;
    if (rc > 0) await runReadToEarn(rc);
  }

  // Selesai
  clearInterval(blinkTimer);
  app.action.setBadgeText({ text: '' });
  logProgress(desk, desk, 'done', '🎉 Semua misi selesai!');

  if (runningSearch) {
    await app.tabs.create({ url: 'https://rewards.bing.com/pointsbreakdown' });
    app.notifications?.create('done', {
      type: 'basic', iconUrl: '/ico/128.png',
      title: 'Rewards Bot Selesai ✅',
      message: `${desk} pencarian + Read to Earn tuntas!`
    });
  }

  if (scheduleDefault === 'scheduleT3') {
    app.alarms.create('schedule', { when: Date.now() + 300000 + Math.random() * 60000 });
  } else if (scheduleDefault === 'scheduleT4') {
    app.alarms.create('schedule', { when: Date.now() + 900000 + Math.random() * 150000 });
  }

  app.storage.local.set({ runningSearch: false });
  runningSearch = false;
}

// ============================================================
// ALARMS
// ============================================================
app.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'schedule') {
    runningSearch = true;
    await fetchStorage();
    await delay(500);
    initializeSearches(scheduleDesktop, scheduleMin, scheduleMax);
  }
});


// ============================================================
// OPEN UI — via background (fallback)
// ============================================================
function openUITab() {
  const url = app.runtime.getURL('ui.html');
  app.tabs.query({}, (tabs) => {
    const existing = tabs.find(t => t.url && t.url.includes('ui.html'));
    if (existing) app.tabs.update(existing.id, { active: true });
    else app.tabs.create({ url });
  });
}

// If no popup is defined, clicking icon triggers this
try { app.action.onClicked.addListener(() => openUITab()); } catch(e) {}

// ============================================================
// MESSAGES
// ============================================================
app.runtime.onMessage.addListener(async (request) => {
  await fetchStorage();
  if (request.message === 'openUI') {
    openUITab();
    return;
  } else if (request.message === 'search') {
    runningSearch = true;
    await delay(500);
    initializeSearches(searchDesktop, searchMin, searchMax);
  } else if (request.message === 'stop') {
    runningSearch = false;
    clearInterval(blinkTimer);
    app.action.setBadgeText({ text: '' });
    app.storage.local.set({ runningSearch: false, currentPhase: 'idle', lastLog: '🛑 Dihentikan' });
  } else if (request.message === 'schedule') {
    runningSearch = true;
    await fetchStorage();
    if (scheduleDefault !== 'scheduleT1' && scheduleDefault !== 'scheduleT2') {
      await delay(500);
      initializeSearches(scheduleDesktop, scheduleMin, scheduleMax);
    }
  } else if (request.message === 'scheduleUpdate') {
    await fetchStorage();
  }
});

// ============================================================
// FETCH STORAGE
// ============================================================
async function fetchStorage() {
  return new Promise(resolve => {
    app.storage.local.get([
      'searchDesktop','searchMin','searchMax',
      'scheduleDesktop','scheduleMin','scheduleMax',
      'scheduleDefault','runningSearch','readCount','userConsent',
      'readMin','readMax','readPauseMin','readPauseMax'
    ], (r) => {
      searchDesktop  = parseInt(r.searchDesktop)  || 20;
      searchMin      = parseInt(r.searchMin)      || 10;
      searchMax      = parseInt(r.searchMax)      || 25;
      scheduleDesktop= parseInt(r.scheduleDesktop)|| 20;
      scheduleMin    = parseInt(r.scheduleMin)    || 10;
      scheduleMax    = parseInt(r.scheduleMax)    || 25;
      scheduleDefault= r.scheduleDefault          || 'scheduleT1';
      runningSearch  = r.runningSearch            || false;
      userConsent    = r.userConsent !== undefined ? r.userConsent : true;
      readMin        = parseInt(r.readMin)        || 15;
      readMax        = parseInt(r.readMax)        || 30;
      readPauseMin   = parseInt(r.readPauseMin)   || 5;
      readPauseMax   = parseInt(r.readPauseMax)   || 10;
      resolve();
    });
  });
}

console.log('[RSA Modified] Service worker aktif ✅');
