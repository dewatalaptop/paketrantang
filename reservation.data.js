'use strict';

/* ============================================================
RESERVATION.DATA.JS — PROSERVA CORE
Reservation Data Layer (CRUD + Query)
============================================================ */

/* ============================================================
1. MONTH KEY HELPER
Format: 2025-04
============================================================ */
function getMonthKey (year, monthIdx) {
  return year + '-' + String(monthIdx + 1).padStart(2, '0');
}

/* ============================================================
2. GETTERS
============================================================ */

/**
 * Get all reservations for a month
 */
function getResForMonth (year, monthIdx) {
  var key = getMonthKey(year, monthIdx);
  return state.reservations[key] || [];
}

/**
 * Get all reservations for a specific date
 * dateStr: YYYY-MM-DD
 */
function getResForDate (dateStr) {
  if (!dateStr) return [];

  var mk = dateStr.substring(0, 7);

  var arr = state.reservations[mk] || [];

  return arr.filter(function (r) {
    return r.date === dateStr;
  });
}

/**
 * Get all reservations (flatten)
 */
function getAllReservations () {
  return Object.values(state.reservations || {})
    .reduce(function (acc, arr) {
      return acc.concat(arr);
    }, []);
}

/**
 * Find reservation by ID
 */
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
3. CREATE
============================================================ */

/**
 * Add new reservation
 */
function addReservation (res) {
  if (!res || !res.date) return false;

  var mk = res.date.substring(0, 7);

  if (!state.reservations[mk]) {
    state.reservations[mk] = [];
  }

  state.reservations[mk].push(res);

  saveReservations();
  return true;
}

/* ============================================================
4. UPDATE
============================================================ */

/**
 * Update reservation (by id)
 */
function updateReservation (res) {
  if (!res || !res.id || !res.date) return false;

  var mk = res.date.substring(0, 7);
  var arr = state.reservations[mk];

  if (!arr) return false;

  var idx = arr.findIndex(function (r) {
    return r.id === res.id;
  });

  if (idx === -1) return false;

  arr[idx] = res;

  saveReservations();
  return true;
}

/* ============================================================
5. DELETE
============================================================ */

/**
 * Delete reservation by ID
 */
function deleteReservation (id) {
  if (!id) return false;

  for (var mk in state.reservations) {

    var arr = state.reservations[mk];

    var idx = arr.findIndex(function (r) {
      return r.id === id;
    });

    if (idx !== -1) {
      arr.splice(idx, 1);

      // cleanup empty month bucket
      if (arr.length === 0) {
        delete state.reservations[mk];
      }

      saveReservations();
      return true;
    }
  }

  return false;
}

/* ============================================================
6. SAFE GUARD
============================================================ */
(function () {
  try {
    if (!window.state) {
      console.warn('[Proserva] state belum tersedia sebelum reservation.data.js');
    }
  } catch (e) {
    console.error('[Proserva] Reservation data init error:', e);
  }
})();