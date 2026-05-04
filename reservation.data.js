'use strict';

/* ============================================================
RESERVATION.DATA.JS — PROSERVA CORE (STABLE REWRITE)
Safe • Compatible • Calendar-ready
============================================================ */

/* ============================================================
1. INIT SAFETY
============================================================ */

function ensureState () {
  if (!window.state) window.state = {};
  if (!state.reservations) state.reservations = {};
  if (!state.locations) state.locations = {};
}

/* ============================================================
2. HELPERS
============================================================ */

function getMonthKey (year, monthIdx) {
  return year + '-' + String(monthIdx + 1).padStart(2, '0');
}

function getMonthKeyFromDate (dateStr) {
  return dateStr ? dateStr.substring(0, 7) : null;
}

/**
 * IMPORTANT FIX:
 * support locations as object OR array
 */
function getLocationsArray () {
  if (!state.locations) return [];

  if (Array.isArray(state.locations)) return state.locations;

  return Object.values(state.locations);
}

/* ============================================================
3. GETTERS
============================================================ */

function getResForMonth (year, monthIdx) {
  ensureState();

  var key = getMonthKey(year, monthIdx);
  return state.reservations[key] || [];
}

function getResForDate (dateStr) {
  ensureState();

  if (!dateStr) return [];

  var mk = getMonthKeyFromDate(dateStr);
  var arr = state.reservations[mk] || [];

  return arr
    .filter(function (r) {
      return r.date === dateStr;
    })
    .sort(function (a, b) {
      return (a.jam || '').localeCompare(b.jam || '');
    });
}

function getAllReservations () {
  ensureState();

  return Object.values(state.reservations)
    .reduce(function (acc, arr) {
      return acc.concat(arr);
    }, [])
    .sort(function (a, b) {
      return (a.date + a.jam).localeCompare(b.date + b.jam);
    });
}

function findReservationById (id) {
  if (!id) return null;

  for (var mk in state.reservations) {
    var found = state.reservations[mk].find(function (r) {
      return r.id === id;
    });

    if (found) return found;
  }

  return null;
}

/* ============================================================
4. BUSINESS VALIDATION
============================================================ */

function isCapacityExceeded (res) {
  if (!res || !res.tempat || !res.jumlah) return false;

  var loc = getLocationsArray().find(function (l) {
    return l.name === res.tempat;
  });

  if (!loc || !loc.capacity) return false;

  return res.jumlah > loc.capacity;
}

function isTimeConflict (res, ignoreId) {
  var list = getResForDate(res.date);

  return list.some(function (r) {
    return (
      r.id !== ignoreId &&
      r.tempat === res.tempat &&
      r.jam === res.jam
    );
  });
}

function validateReservationBusiness (res, ignoreId) {

  if (isCapacityExceeded(res)) {
    showToast && showToast('Melebihi kapasitas lokasi', 'error');
    return false;
  }

  if (isTimeConflict(res, ignoreId)) {
    showToast && showToast('Slot waktu sudah terisi', 'error');
    return false;
  }

  return true;
}

/* ============================================================
5. CREATE
============================================================ */

function addReservation (res) {
  ensureState();

  if (!res || !res.date) return false;

  if (!validateReservationBusiness(res)) return false;

  var mk = getMonthKeyFromDate(res.date);

  if (!state.reservations[mk]) {
    state.reservations[mk] = [];
  }

  state.reservations[mk].push(normalizeReservation(res));

  persist();
  return true;
}

/* ============================================================
6. UPDATE (SUPPORT MOVE MONTH)
============================================================ */

function updateReservation (res) {
  ensureState();

  if (!res || !res.id || !res.date) return false;

  if (!validateReservationBusiness(res, res.id)) return false;

  var oldMk = null;
  var idx   = -1;

  for (var mk in state.reservations) {
    var i = state.reservations[mk].findIndex(function (r) {
      return r.id === res.id;
    });

    if (i !== -1) {
      oldMk = mk;
      idx = i;
      break;
    }
  }

  if (oldMk === null) return false;

  state.reservations[oldMk].splice(idx, 1);

  if (state.reservations[oldMk].length === 0) {
    delete state.reservations[oldMk];
  }

  var newMk = getMonthKeyFromDate(res.date);

  if (!state.reservations[newMk]) {
    state.reservations[newMk] = [];
  }

  state.reservations[newMk].push(normalizeReservation(res));

  persist();
  return true;
}

/* ============================================================
7. DELETE
============================================================ */

function deleteReservation (id) {
  ensureState();

  if (!id) return false;

  for (var mk in state.reservations) {

    var arr = state.reservations[mk];

    var idx = arr.findIndex(function (r) {
      return r.id === id;
    });

    if (idx !== -1) {

      arr.splice(idx, 1);

      if (arr.length === 0) {
        delete state.reservations[mk];
      }

      persist();
      return true;
    }
  }

  return false;
}

/* ============================================================
8. NORMALIZER
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
    menus: Array.isArray(r.menus) ? r.menus : [],
    createdAt: r.createdAt || Date.now(),
    thankYouSent: !!r.thankYouSent
  };
}

/* ============================================================
9. PERSISTENCE
============================================================ */

function persist () {
  try {
    saveReservations && saveReservations();
  } catch (e) {
    console.error('[RESERVATION SAVE ERROR]', e);
    showToast && showToast('Gagal menyimpan data', 'error');
  }
}

/* ============================================================
10. SAFE GUARD
============================================================ */

(function () {
  try {
    ensureState();

    if (!window.state) {
      console.warn('[Proserva] state tidak tersedia');
    }

  } catch (e) {
    console.error('[Proserva] Reservation init error:', e);
  }
})();