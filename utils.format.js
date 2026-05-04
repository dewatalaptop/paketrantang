'use strict';

/* ============================================================
UTILS.FORMAT.JS — PROSERVA CORE
Date + Number + Currency Formatting
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
2. DATE FORMATTING
============================================================ */

/**
 * YYYY-MM-DD → "15 Januari 2025"
 */
function formatDateDisplay (dateStr) {
  if (!dateStr) return '—';

  var p = dateStr.split('-');
  if (p.length !== 3) return dateStr;

  var y = p[0];
  var m = parseInt(p[1], 10) - 1;
  var d = parseInt(p[2], 10);

  return d + ' ' + (MONTHS_ID[m] || '') + ' ' + y;
}

/**
 * YYYY-MM-DD → "Senin, 15 Jan 2025"
 */
function formatDateFull (dateStr) {
  if (!dateStr) return '—';

  var dObj = new Date(dateStr + 'T12:00:00');
  var dow  = DAYS_ID[dObj.getDay()];

  var p = dateStr.split('-');
  var y = p[0];
  var m = parseInt(p[1], 10) - 1;
  var d = parseInt(p[2], 10);

  return dow + ', ' + d + ' ' + (MONTHS_SHORT[m] || '') + ' ' + y;
}

/**
 * Today → YYYY-MM-DD
 */
function todayStr () {
  return new Date().toISOString().split('T')[0];
}

/**
 * Build YYYY-MM-DD
 */
function buildDateStr (year, month1based, day) {
  return year + '-' +
    String(month1based).padStart(2, '0') + '-' +
    String(day).padStart(2, '0');
}

/* ============================================================
3. NUMBER / CURRENCY
============================================================ */

/**
 * 1500000 → "1.500.000"
 */
function formatRupiah (n) {
  return (parseInt(n, 10) || 0).toLocaleString('id-ID');
}

/**
 * 1500000 → "1,5jt"
 * 250000 → "250rb"
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
4. SMALL HELPERS
============================================================ */

/**
 * Pad number → 01, 02, ...
 */
function pad2 (n) {
  return n < 10 ? '0' + n : '' + n;
}

/* ============================================================
5. DEV GUARD
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