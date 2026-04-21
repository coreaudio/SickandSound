/* ===== shared.js – Sick & Sound gemeinsame Basis ===== */

/* 1. Firebase Config + Init */
const firebaseConfig = {
  apiKey: "AIzaSyBtZsr4QPHQbvO2qae6MoBoxJF5dNP2vh0",
  authDomain: "sickandsound-8a15f.firebaseapp.com",
  projectId: "sickandsound-8a15f",
  storageBucket: "sickandsound-8a15f.appspot.com",
  messagingSenderId: "32138160959",
  appId: "1:32138160959:web:a65c7f4ad7d44e757fc18a"
};

let db = null;
try {
  if (window.firebase) {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    try { firebase.analytics(); } catch(_) {}
    db = firebase.firestore();
    try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch(_) {}
  }
} catch(_) { db = null; }

/* 2. Prod/Beta Toggle */
const STATE_COLLECTION = location.search.includes("beta") ? "state_beta" : "state";

/* 3. Kernteam */
const DEFAULT_CORE = ["Chris","Daniel","Elmi","Florian","Joel","Kevin","Kiste","Marco","Meli","Simon"];
let CORE = [...DEFAULT_CORE];

/* 4. Admin-Passwort */
const ADMIN_PASSWORD = "1379";

/* 5. localStorage-Keys */
const pricesKey          = "sick_sound_prices";
const peopleKey          = "sick_sound_people";
const dataKey            = "sick_sound_data";
const historyKey         = "sick_sound_history";
const bookingsKey        = "sick_sound_bookings";
const orderKey           = "sick_sound_order";
const xpKey              = "sick_sound_xp";
const redoKey            = "sick_sound_redo";
const backupsKey         = "sick_sound_backups";
const manualChargesKey   = "sick_sound_manual_charges";
const coreKey            = "sick_sound_core";
const hdRequirementsKey  = "sick_sound_hd_requirements";
const lastBackupKey      = "lastBackup";
const buchungenBackupsKey= "buchungen_backups";

/* 6. Utility Functions */
const todayStr        = () => new Date().toISOString().slice(0, 10);
const currentMonthStr = () => new Date().toISOString().slice(0, 7);
const levelOf         = x => Math.max(1, Math.floor(Math.sqrt((+x || 0) / 75)) + 1);
const euro            = n => (Number(n) || 0).toFixed(2).replace('.', ',') + ' €';
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* 7. Modal-Helpers */
function openModal(id)  { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

/* 8. Toast */
let _toastTimer = null;
function showToast(msg, duration) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), duration || 2800);
}

/* 9. Service Worker */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js?v=22', { scope: './' }).catch(() => {});
}

/* 10. Backup-Utilities (Hauptseite / Admin – referenzieren globale page-Variablen) */
function createBackup() {
  const backupData = {
    prices, people, data, history, redoStack, bookings, columnOrder, xp,
    timestamp: new Date().toISOString()
  };
  const backups = JSON.parse(localStorage.getItem(backupsKey) || "[]");
  backups.push(backupData);
  localStorage.setItem(backupsKey, JSON.stringify(backups));
  localStorage.setItem(lastBackupKey, Date.now().toString());
  if (db) {
    db.collection("backups").add(backupData)
      .then(() => alert("Backup erfolgreich erstellt!"))
      .catch(err => console.error("Backup Fehler:", err));
  } else {
    alert("Backup erfolgreich lokal gespeichert!");
  }
}

function exportBackup() {
  const backupData = {
    prices, people, data, history, redoStack, bookings, columnOrder, xp,
    timestamp: new Date().toISOString()
  };
  const dataStr = JSON.stringify(backupData);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', `sick-sound-backup-${new Date().toISOString().slice(0,10)}.json`);
  link.click();
}

function restoreBackup(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const bd = JSON.parse(e.target.result);
      if (!confirm(`Sicher, dass Sie das Backup vom ${new Date(bd.timestamp).toLocaleString()} wiederherstellen möchten? Alle aktuellen Daten werden überschrieben.`)) return;
      prices = bd.prices || prices; people = bd.people || people; data = bd.data || data;
      history = bd.history || history; redoStack = bd.redoStack || redoStack;
      bookings = bd.bookings || bookings; columnOrder = bd.columnOrder || columnOrder; xp = bd.xp || xp;
      saveAll(); buildTable();
      alert("Backup erfolgreich wiederhergestellt!");
    } catch (err) {
      alert("Fehler beim Wiederherstellen des Backups: " + err.message);
    }
  };
  reader.readAsText(file);
}

function showBackupList() {
  const backups = JSON.parse(localStorage.getItem(backupsKey) || "[]");
  const el = document.getElementById('backupList');
  if (!el) return;
  if (!backups.length) { el.innerHTML = '<div class="sub">Keine lokalen Backups gefunden.</div>'; return; }
  el.innerHTML = backups.map((backup, index) => `
    <div class="backup-item">
      <span>${new Date(backup.timestamp).toLocaleString()}</span>
      <button class="btn small" onclick="restoreLocalBackup(${index})">Wiederherstellen</button>
    </div>`).join('');
}

function restoreLocalBackup(index) {
  const backups = JSON.parse(localStorage.getItem(backupsKey) || "[]");
  if (index < 0 || index >= backups.length) return;
  const bd = backups[index];
  if (!confirm(`Sicher, dass Sie das Backup vom ${new Date(bd.timestamp).toLocaleString()} wiederherstellen möchten? Alle aktuellen Daten werden überschrieben.`)) return;
  prices = bd.prices || prices; people = bd.people || people; data = bd.data || data;
  history = bd.history || history; redoStack = bd.redoStack || redoStack;
  bookings = bd.bookings || bookings; columnOrder = bd.columnOrder || columnOrder; xp = bd.xp || xp;
  saveAll(); buildTable();
  alert("Backup erfolgreich wiederhergestellt!");
}

function openBackupModal() { openModal('backupModal'); }

/* 11. Bottom-Nav */
function renderBottomNav(activePage) {
  // Neue Seite sofort off-screen positionieren und hereingleiten lassen
  const _enterFrom = sessionStorage.getItem('swipe_enter_from');
  if (_enterFrom) {
    sessionStorage.removeItem('swipe_enter_from');
    const _app = document.querySelector('.app');
    if (_app) {
      const _w = window.innerWidth;
      _app.style.transition = 'none';
      _app.style.transform  = `translateX(${_enterFrom === 'left' ? -_w : _w}px)`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        _app.style.transition = 'transform .22s cubic-bezier(.25,.46,.45,.94)';
        _app.style.transform  = 'translateX(0)';
      }));
    }
  }
  // Swipe-Navigation zwischen Seiten (wird nach Render eingerichtet)
  setTimeout(() => _setupSwipeNav(activePage), 0);
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  const tabs = [
    { page: 'index',         href: 'index.html',            label: 'Liste',       icon: 'M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z' },
    { page: 'hausdienst',    href: 'hausdienst.html#check',  label: 'Hausdienst',  icon: 'M12 3l9 7-1.2 1.6L18 10.1V20h-5v-6H11v6H6v-9.9L4.2 11.6 3 10z' },
    { page: 'einkaufsliste', href: 'einkaufsliste.html',     label: 'Einkauf',     icon: 'M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14.6l.1-.1L8.2 12h7.4c.8 0 1.4-.4 1.7-1l3.9-7-1.7-1-3.9 7H8.5l-.1-.3L5.5 4H2v2h2l3.6 7.6-1.3 2.4c-.1.2-.2.5-.2.7 0 1.1.9 2 2 2h12v-2H8c-.1 0-.2-.1-.2-.2l.4-1.9z' },
    { page: 'rangliste',     href: 'rangliste.html',         label: 'Rang',        icon: 'M7 17H3V7h4v10zm7 0h-4V3h4v14zm7 0h-4v-8h4v8z' },
    { page: 'bewertungen',   href: 'bewertungen.html',       label: 'Bewertungen', icon: 'M12 1l3.09 6.26L22 8.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 13.14 2 8.27l6.91-1.01L12 1z' },
    { page: 'buchungen',     href: 'buchungen.html',         label: 'Buchungen',   icon: 'M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5L14 3.5z' },
    { page: 'kalender',      href: 'kalender.html',          label: 'Kalender',    icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zM7 12h5v5H7z' },
  ];
  nav.innerHTML = tabs.map(t =>
    `<a class="tab${t.page === activePage ? ' active' : ''}" href="${t.href}">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="${t.icon}"/></svg>
      <span>${t.label}</span>
    </a>`
  ).join('');
}

/* 12. Swipe-Navigation mit Drag-Effekt (ganzer Screen) */
function _setupSwipeNav(activePage) {
  const ORDER = ['index','hausdienst','einkaufsliste','rangliste','bewertungen','buchungen','kalender'];
  const HREFS = {
    index:         'index.html',
    hausdienst:    'hausdienst.html',
    einkaufsliste: 'einkaufsliste.html',
    rangliste:     'rangliste.html',
    bewertungen:   'bewertungen.html',
    buchungen:     'buchungen.html',
    kalender:      'kalender.html',
  };

  const idx = ORDER.indexOf(activePage);
  if (idx === -1) return;

  // Nachbarseiten (zirkulär) vorausladen
  const _prefetch = href => {
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = href;
    document.head.appendChild(l);
  };
  _prefetch(HREFS[ORDER[(idx - 1 + ORDER.length) % ORDER.length]]);
  _prefetch(HREFS[ORDER[(idx + 1) % ORDER.length]]);

  const MIN_DX       = 55;
  const MAX_DY_RATIO = 0.5;

  function isHScrollable(el) {
    while (el && el !== document.body) {
      const ov = getComputedStyle(el).overflowX;
      if ((ov === 'auto' || ov === 'scroll') && el.scrollWidth > el.clientWidth) return true;
      el = el.parentElement;
    }
    return false;
  }

  const app = document.querySelector('.app');
  if (!app) return;

  // Peek-Panel: zeigt Zielseiten hinter .app (sichtbar wenn .app weggeschoben wird)
  const LABELS = {
    index:'Liste', hausdienst:'Hausdienst', einkaufsliste:'Einkauf',
    rangliste:'Rang', bewertungen:'Bewertungen', buchungen:'Buchungen', kalender:'Kalender',
  };
  const prevKey = ORDER[(idx - 1 + ORDER.length) % ORDER.length];
  const nextKey = ORDER[(idx + 1) % ORDER.length];
  const chevL = `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
  const chevR = `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;
  const peekItem = (label, chev) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(148,163,184,.45);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${chev}<span>${label}</span></div>`;
  const peek = document.createElement('div');
  peek.style.cssText = 'position:fixed;inset:0;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:0 24px;pointer-events:none;';
  peek.innerHTML = peekItem(LABELS[prevKey], chevL) + peekItem(LABELS[nextKey], chevR);
  document.body.appendChild(peek);

  let startX = 0, startY = 0, tracking = false;

  document.addEventListener('touchstart', e => {
    startX   = e.touches[0].clientX;
    startY   = e.touches[0].clientY;
    tracking = !isHScrollable(e.target);
    if (tracking) app.style.transition = 'none';
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!tracking) return;
    const dx = e.touches[0].clientX - startX;
    const dy = Math.abs(e.touches[0].clientY - startY);

    // Geste zu vertikal → abbrechen und zurückschnappen
    if (dy > Math.abs(dx) * MAX_DY_RATIO && Math.abs(dx) < 18) {
      tracking = false;
      app.style.transition = 'transform .25s ease-out';
      app.style.transform  = 'translateX(0)';
      return;
    }

    app.style.transform = `translateX(${dx * 0.88}px)`;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!tracking) return;
    tracking = false;

    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);

    let target = null;
    if (Math.abs(dx) >= MIN_DX && dy <= Math.abs(dx) * MAX_DY_RATIO) {
      // Zirkulär: letzter → erster und umgekehrt
      if (dx < 0) target = HREFS[ORDER[(idx + 1) % ORDER.length]];
      if (dx > 0) target = HREFS[ORDER[(idx - 1 + ORDER.length) % ORDER.length]];
    }

    if (target) {
      // Richtung für Slide-in auf der neuen Seite speichern
      sessionStorage.setItem('swipe_enter_from', dx > 0 ? 'left' : 'right');
      app.style.transition = 'transform .2s ease-in';
      app.style.transform  = `translateX(${dx > 0 ? window.innerWidth : -window.innerWidth}px)`;
      setTimeout(() => { location.href = target; }, 185);
    } else {
      // Zurückschnappen
      app.style.transition = 'transform .28s ease-out';
      app.style.transform  = 'translateX(0)';
    }
  }, { passive: true });
}
