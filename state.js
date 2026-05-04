'use strict';

/* ============================================================
STATE.JS — PROSERVA CORE (REWRITE)
Robust • Safe • Scalable
============================================================ */

/* ============================================================
1. DEFAULT STATE
============================================================ */

const DEFAULT_STATE = {
  version: 1,

  biz: {
    name: 'Usaha Saya',
    type: 'restoran'
  },

  menus: [],
  locations: [],
  reservations: {},

  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDate: null,

  anlChart: null,
  bcList: [],

  notifInterval: null
};

/* ============================================================
2. GLOBAL STATE (SINGLE SOURCE)
============================================================ */

var state = structuredCloneSafe(DEFAULT_STATE);

/* ============================================================
3. LOAD STATE (SAFE + NORMALIZE)
============================================================ */

function loadState () {
  try {

    const biz         = safeGet(KEYS.BIZ, DEFAULT_STATE.biz);
    const menus       = normalizeArray(DB.get(KEYS.MENUS, []));
    const locations   = normalizeArray(DB.get(KEYS.LOCATIONS, []));
    const reservations= normalizeReservations(DB.get(KEYS.RESERVATIONS, {}));

    state.biz = sanitizeBiz(biz);
    state.menus = menus;
    state.locations = locations;
    state.reservations = reservations;

  } catch (e) {
    console.error('[STATE LOAD ERROR]', e);
    hardReset();
  }
}

/* ============================================================
4. SAVE HELPERS (SAFE)
============================================================ */

function saveBiz () {
  safeSet(KEYS.BIZ, state.biz);
}

function saveMenus () {
  safeSet(KEYS.MENUS, state.menus);
}

function saveLocations () {
  safeSet(KEYS.LOCATIONS, state.locations);
}

function saveReservations () {
  safeSet(KEYS.RESERVATIONS, state.reservations);
}

/* ============================================================
5. RESET (SAFE)
============================================================ */

function resetState () {
  state = structuredCloneSafe(DEFAULT_STATE);

  persistAll();
}

function hardReset () {
  console.warn('[STATE] Hard reset triggered');
  resetState();
}

/* ============================================================
6. PERSIST ALL
============================================================ */

function persistAll () {
  saveBiz();
  saveMenus();
  saveLocations();
  saveReservations();
}

/* ============================================================
7. NORMALIZATION
============================================================ */

function normalizeArray (data) {
  if (!Array.isArray(data)) return [];
  return data.filter(Boolean);
}

function normalizeReservations (data) {
  if (!data || typeof data !== 'object') return {};

  const clean = {};

  for (const mk in data) {
    if (!Array.isArray(data[mk])) continue;

    clean[mk] = data[mk].map(normalizeReservationSafe);
  }

  return clean;
}

function normalizeReservationSafe (r) {
  if (!r || typeof r !== 'object') return null;

  return {
    id: r.id || genId?.(),
    date: r.date || '',
    nama: r.nama || '',
    nomorHp: r.nomorHp || '',
    jam: r.jam || '',
    jumlah: Number(r.jumlah) || 1,
    tempat: r.tempat || '',
    dp: Number(r.dp) || 0,
    tipeDp: r.tipeDp || '',
    tambahan: r.tambahan || '',
    menus: Array.isArray(r.menus) ? r.menus : [],
    createdAt: r.createdAt || Date.now(),
    thankYouSent: !!r.thankYouSent
  };
}

function sanitizeBiz (biz) {
  return {
    name: biz?.name || 'Usaha Saya',
    type: biz?.type || 'restoran'
  };
}

/* ============================================================
8. STORAGE WRAPPER (DEFENSIVE)
============================================================ */

function safeGet (key, fallback) {
  try {
    return DB.get(key, fallback);
  } catch (e) {
    console.warn('DB.get gagal:', key);
    return fallback;
  }
}

function safeSet (key, value) {
  try {
    DB.set(key, value);
  } catch (e) {
    console.error('DB.set gagal:', key, e);
  }
}

/* ============================================================
9. UTIL
============================================================ */

function structuredCloneSafe (obj) {
  try {
    return structuredClone(obj);
  } catch (e) {
    return JSON.parse(JSON.stringify(obj));
  }
}

/* ============================================================
10. DEV GUARD
============================================================ */

(function () {
  try {
    if (!window.DB || !window.KEYS) {
      console.warn('[Proserva] storage.js belum siap');
    }

    if (!window.state) {
      console.warn('[Proserva] state tidak terdefinisi');
    }

  } catch (e) {
    console.error('[Proserva] State init error:', e);
  }
})();