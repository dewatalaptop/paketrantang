'use strict';

/* ============================================================
UTILS.FORMAT.JS — PROSERVA CORE (STABLE VERSION)
Date • Time • Currency • Locale-safe
============================================================ */

/* ============================================================
1. CONSTANTS
============================================================ */

var MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

var MONTHS_SHORT = MONTHS_ID.map(function (m) {
  return m.slice(0, 3);
});

var DAYS_ID = [
  'Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'
];

/* ============================================================
2. SAFE DATE PARSER (ANTI TIMEZONE BUG)
============================================================ */

/**
 * Parse YYYY-MM-DD safely (no timezone shift)
 */
function parseDateLocal (dateStr) {
  if (!dateStr) return null;

  var p = dateStr.split('-');
  if (p.length !== 3) return null;

  var y = parseInt(p[0], 10);
  var m = parseInt(p[1], 10) - 1;
  var d = parseInt(p[2], 10);

  return new Date(y, m, d);
}

/* ============================================================
3. DATE FORMATTERS
============================================================ */

/**
 * YYYY-MM-DD → "15 Januari 2025"
 */
function formatDateDisplay (dateStr) {
  var d = parseDateLocal(dateStr);
  if (!d) return dateStr || '—';

  return d.getDate() + ' ' +
         MONTHS_ID[d.getMonth()] + ' ' +
         d.getFullYear();
}

/**
 * YYYY-MM-DD → "Senin, 15 Jan 2025"
 */
function formatDateFull (dateStr) {
  var d = parseDateLocal(dateStr);
  if (!d) return dateStr || '—';

  return DAYS_ID[d.getDay()] + ', ' +
         d.getDate() + ' ' +
         MONTHS_SHORT[d.getMonth()] + ' ' +
         d.getFullYear();
}

/**
 * Calendar label → "April 2025"
 */
function formatMonthYear (year, monthIdx) {
  return MONTHS_ID[monthIdx] + ' ' + year;
}

/* ============================================================
4. DATE GENERATORS (FIXED)
============================================================ */

/**
 * Today → YYYY-MM-DD (LOCAL SAFE)
 */
function todayStr () {
  var now = new Date();

  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, '0');
  var d = String(now.getDate()).padStart(2, '0');

  return y + '-' + m + '-' + d;
}

/**
 * Build YYYY-MM-DD
 */
function buildDateStr (year, month1based, day) {
  return year + '-' +
    String(month1based).padStart(2, '0') + '-' +
    String(day).padStart(2, '0');
}

/**
 * Compare date string
 */
function isSameDate (a, b) {
  return a === b;
}

/* ============================================================
5. NUMBER & CURRENCY
============================================================ */

/**
 * 1500000 → "1.500.000"
 */
function formatRupiah (n) {
  return (parseInt(n, 10) || 0).toLocaleString('id-ID');
}

/**
 * 1500000 → "1,5jt"
 */
function formatRupiahK (n) {
  n = parseInt(n, 10) || 0;

  if (n >= 1000000) {
    return (n / 1000000)
      .toFixed(1)
      .replace('.', ',') + 'jt';
  }

  if (n >= 1000) {
    return Math.round(n / 1000) + 'rb';
  }

  return formatRupiah(n);
}

/* ============================================================
6. SMALL HELPERS
============================================================ */

function pad2 (n) {
  return n < 10 ? '0' + n : '' + n;
}

/* ============================================================
7. DEV GUARD
============================================================ */

(function () {
  try {
    if (!window.formatDateDisplay) {
      console.warn('[Proserva] utils.format.js gagal load');
    }
  } catch (e) {
    console.error('[Proserva] Format utils error:', e);
  }
})();