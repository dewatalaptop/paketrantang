'use strict';

/* ============================================================
RESERVATION.DATA.JS — PROSERVA CORE (SMART ENGINE FIXED)
Safe • Stable • UI Compatible • No Undefined Crash
============================================================ */

/* ============================================================
1. INIT SAFETY (🔥 HARD FIX)
============================================================ */

function ensureState () {
  if (!window.state) window.state = {};

  // 🔥 reservations MUST object
  if (!state.reservations || typeof state.reservations !== 'object') {
    state.reservations = {};
  }

  // 🔥 locations MUST array
  if (!Array.isArray(state.locations)) {
    state.locations = Object.values(state.locations || {});
  }

  // 🔥 menus MUST array (CRITICAL FIX)
  if (!Array.isArray(state.menus)) {
    state.menus = Object.values(state.menus || {});
  }

  state.calendarMeta = state.calendarMeta || {};
}


/* ============================================================
2. SAFE ARRAY HELPER (🔥 ANTI MAP ERROR)
============================================================ */

function safeArray (val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}


/* ============================================================
3. HELPERS
============================================================ */

function getMonthKey (year, monthIdx) {
  return year + '-' + String(monthIdx + 1).padStart(2, '0');
}

function getMonthKeyFromDate (dateStr) {
  return dateStr ? dateStr.substring(0, 7) : null;
}

function getLocationsArray () {
  return safeArray(state.locations);
}

function getMenusArray () {
  return safeArray(state.menus);
}


/* ============================================================
4. GETTERS (SAFE)
============================================================ */

function getResForMonth (year, monthIdx) {
  ensureState();
  return safeArray(state.reservations[getMonthKey(year, monthIdx)]);
}

function getResForDate (dateStr) {
  ensureState();

  if (!dateStr) return [];

  const mk = getMonthKeyFromDate(dateStr);
  const arr = safeArray(state.reservations[mk]);

  return arr
    .filter(r => r.date === dateStr)
    .sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));
}

function getAllReservations () {
  ensureState();

  return Object.values(state.reservations)
    .flatMap(arr => safeArray(arr))
    .sort((a, b) => (a.date + a.jam).localeCompare(b.date + b.jam));
}

function findReservationById (id) {
  if (!id) return null;

  for (const mk in state.reservations) {
    const found = safeArray(state.reservations[mk])
      .find(r => r.id === id);

    if (found) return found;
  }

  return null;
}


/* ============================================================
5. 🔥 CALENDAR META ENGINE
============================================================ */

function rebuildCalendarMeta () {
  ensureState();

  state.calendarMeta = {};

  const all = getAllReservations();

  all.forEach(r => {

    if (!r.date) return;

    if (!state.calendarMeta[r.date]) {
      state.calendarMeta[r.date] = {
        total: 0,
        pax: 0,
        dp: 0,
        locations: {}
      };
    }

    const meta = state.calendarMeta[r.date];

    meta.total += 1;
    meta.pax   += Number(r.jumlah) || 0;
    meta.dp    += Number(r.dp) || 0;

    if (!meta.locations[r.tempat]) {
      meta.locations[r.tempat] = 0;
    }

    meta.locations[r.tempat] += 1;
  });
}

function getDaySummary (dateStr) {
  ensureState();

  return state.calendarMeta[dateStr] || {
    total: 0,
    pax: 0,
    dp: 0,
    locations: {}
  };
}


/* ============================================================
6. BUSINESS VALIDATION
============================================================ */

function isCapacityExceeded (res) {
  if (!res?.tempat || !res?.jumlah) return false;

  const loc = getLocationsArray()
    .find(l => l.name === res.tempat);

  if (!loc?.capacity) return false;

  return res.jumlah > loc.capacity;
}

function isTimeConflict (res, ignoreId) {

  const list = getResForDate(res.date);

  return list.some(r =>
    r.id !== ignoreId &&
    r.tempat === res.tempat &&
    r.jam === res.jam
  );
}

function validateReservationBusiness (res, ignoreId) {

  if (isCapacityExceeded(res)) {
    showToast?.('Melebihi kapasitas lokasi', 'error');
    return false;
  }

  if (isTimeConflict(res, ignoreId)) {
    showToast?.('Slot waktu sudah terisi', 'error');
    return false;
  }

  return true;
}


/* ============================================================
7. CREATE
============================================================ */

function addReservation (res) {
  ensureState();

  if (!res?.date) return false;
  if (!validateReservationBusiness(res)) return false;

  const mk = getMonthKeyFromDate(res.date);

  state.reservations[mk] = safeArray(state.reservations[mk]);
  state.reservations[mk].push(normalizeReservation(res));

  persist();
  rebuildCalendarMeta();

  return true;
}


/* ============================================================
8. UPDATE
============================================================ */

function updateReservation (res) {
  ensureState();

  if (!res?.id || !res?.date) return false;
  if (!validateReservationBusiness(res, res.id)) return false;

  let oldMk = null;
  let idx = -1;

  for (const mk in state.reservations) {
    const arr = safeArray(state.reservations[mk]);
    const i = arr.findIndex(r => r.id === res.id);

    if (i !== -1) {
      oldMk = mk;
      idx = i;
      break;
    }
  }

  if (oldMk === null) return false;

  state.reservations[oldMk].splice(idx, 1);

  if (!state.reservations[oldMk].length) {
    delete state.reservations[oldMk];
  }

  const newMk = getMonthKeyFromDate(res.date);

  state.reservations[newMk] = safeArray(state.reservations[newMk]);
  state.reservations[newMk].push(normalizeReservation(res));

  persist();
  rebuildCalendarMeta();

  return true;
}


/* ============================================================
9. DELETE
============================================================ */

function deleteReservation (id) {
  ensureState();

  if (!id) return false;

  for (const mk in state.reservations) {

    const arr = safeArray(state.reservations[mk]);
    const idx = arr.findIndex(r => r.id === id);

    if (idx !== -1) {

      arr.splice(idx, 1);

      if (!arr.length) delete state.reservations[mk];

      persist();
      rebuildCalendarMeta();

      return true;
    }
  }

  return false;
}


/* ============================================================
10. NORMALIZER
============================================================ */

function normalizeReservation (r) {
  return {
    id: r.id,
    date: r.date,
    nama: r.nama || '',
    nomorHp: r.nomorHp || '',
    jam: r.jam || '',
    jumlah: Number(r.jumlah) || 1,
    tempat: r.tempat || '',
    dp: Number(r.dp) || 0,
    tipeDp: r.tipeDp || '',
    tambahan: r.tambahan || '',
    menus: safeArray(r.menus), // 🔥 FIX
    createdAt: r.createdAt || Date.now(),
    thankYouSent: !!r.thankYouSent
  };
}


/* ============================================================
11. PERSISTENCE
============================================================ */

function persist () {
  try {
    saveReservations?.();
  } catch (e) {
    console.error('[SAVE ERROR]', e);
    showToast?.('Gagal menyimpan data', 'error');
  }
}


/* ============================================================
12. INIT
============================================================ */

(function () {
  try {
    ensureState();
    rebuildCalendarMeta();
  } catch (e) {
    console.error('[Reservation Init Error]', e);
  }
})();