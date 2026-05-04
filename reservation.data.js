'use strict';

/* ============================================================
RESERVATION.DATA.JS — PROSERVA CORE (REWRITE)
Safe • Scalable • Business-ready
============================================================ */

/* ============================================================
1. INIT SAFETY
============================================================ */

function ensureState () {
  if (!window.state) window.state = {};
  if (!state.reservations) state.reservations = {};
}

/* ============================================================
2. MONTH KEY
============================================================ */

function getMonthKey (year, monthIdx) {
  return year + '-' + String(monthIdx + 1).padStart(2, '0');
}

function getMonthKeyFromDate (dateStr) {
  return dateStr?.substring(0, 7);
}

/* ============================================================
3. GETTERS
============================================================ */

function getResForMonth (year, monthIdx) {
  ensureState();

  const key = getMonthKey(year, monthIdx);
  return state.reservations[key] || [];
}

function getResForDate (dateStr) {
  ensureState();
  if (!dateStr) return [];

  const mk = getMonthKeyFromDate(dateStr);
  const arr = state.reservations[mk] || [];

  return arr
    .filter(r => r.date === dateStr)
    .sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));
}

function getAllReservations () {
  ensureState();

  return Object.values(state.reservations)
    .flat()
    .sort((a, b) => (a.date + a.jam).localeCompare(b.date + b.jam));
}

function findReservationById (id) {
  if (!id) return null;

  for (const mk in state.reservations) {
    const found = state.reservations[mk]?.find(r => r.id === id);
    if (found) return found;
  }

  return null;
}

/* ============================================================
4. VALIDATION ENGINE
============================================================ */

/**
 * Check kapasitas lokasi
 */
function isCapacityExceeded (res) {
  if (!res?.tempat || !res?.jumlah) return false;

  const loc = state.locations?.find(l => l.name === res.tempat);
  if (!loc) return false;

  return res.jumlah > loc.capacity;
}

/**
 * Check bentrok waktu (simple rule)
 * → lokasi sama + jam sama + tanggal sama
 */
function isTimeConflict (res, ignoreId) {
  const list = getResForDate(res.date);

  return list.some(r =>
    r.id !== ignoreId &&
    r.tempat === res.tempat &&
    r.jam === res.jam
  );
}

/**
 * Validate sebelum save
 */
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
5. CREATE
============================================================ */

function addReservation (res) {
  ensureState();

  if (!res || !res.date) return false;

  if (!validateReservationBusiness(res)) return false;

  const mk = getMonthKeyFromDate(res.date);

  if (!state.reservations[mk]) {
    state.reservations[mk] = [];
  }

  state.reservations[mk].push(normalizeReservation(res));

  persist();

  return true;
}

/* ============================================================
6. UPDATE (FIXED: SUPPORT MOVE MONTH)
============================================================ */

function updateReservation (res) {
  ensureState();

  if (!res?.id || !res?.date) return false;

  if (!validateReservationBusiness(res, res.id)) return false;

  // cari di semua bulan (karena bisa pindah tanggal)
  let oldMk = null;
  let idx = -1;

  for (const mk in state.reservations) {
    const i = state.reservations[mk].findIndex(r => r.id === res.id);
    if (i !== -1) {
      oldMk = mk;
      idx = i;
      break;
    }
  }

  if (oldMk === null) return false;

  // hapus dari lama
  state.reservations[oldMk].splice(idx, 1);

  if (state.reservations[oldMk].length === 0) {
    delete state.reservations[oldMk];
  }

  // tambah ke bulan baru
  const newMk = getMonthKeyFromDate(res.date);

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

  for (const mk in state.reservations) {

    const arr = state.reservations[mk];
    const idx = arr.findIndex(r => r.id === id);

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
9. PERSISTENCE (SAFE)
============================================================ */

function persist () {
  try {
    saveReservations?.();
  } catch (e) {
    console.error('Save error', e);
    showToast?.('Gagal menyimpan data', 'error');
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