// popup_open.js — buka ui.html di tab baru
(function() {
  function openUI() {
    try {
      const url = chrome.runtime.getURL('ui.html');
      chrome.tabs.query({}, function(tabs) {
        try {
          const existing = tabs && tabs.find(function(t) {
            return t.url && t.url.indexOf('ui.html') !== -1;
          });
          if (existing) {
            chrome.tabs.update(existing.id, { active: true });
          } else {
            chrome.tabs.create({ url: url });
          }
        } catch(e2) {
          // Fallback: minta background buka tab
          chrome.runtime.sendMessage({ message: 'openUI' });
        }
        window.close();
      });
    } catch(e) {
      // Fallback terakhir: langsung ke background
      chrome.runtime.sendMessage({ message: 'openUI' });
      window.close();
    }
  }

  // Klik tombol
  var btn = document.getElementById('openBtn');
  if (btn) btn.addEventListener('click', openUI);

  // Auto-open saat popup muncul (tanpa perlu klik)
  openUI();
})();
