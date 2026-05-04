'use strict';

/* ============================================================
UTILS.VALIDATION.JS — PROSERVA CORE (CLEAN VERSION)
Validation + Normalization (NO UI SIDE EFFECT)
============================================================ */

/* ============================================================
1. PHONE VALIDATION
============================================================ */

/**
 * Validate phone number (10–13 digit)
 */
function validatePhone (raw) {
  if (!raw) return false;

  var digits = String(raw).replace(/\D/g, '');

  return digits.length >= 10 && digits.length <= 13;
}

/**
 * Normalize phone:
 * 08xxx → 628xxx
 */
function normalizePhone (raw) {
  if (!raw) return '';

  var digits = String(raw).replace(/\D/g, '');

  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }

  if (digits.startsWith('62')) {
    return digits;
  }

  return digits;
}

/* ============================================================
2. GENERIC VALIDATORS
============================================================ */

/**
 * Required field
 */
function isRequired (val) {
  return val !== null &&
         val !== undefined &&
         String(val).trim() !== '';
}

/**
 * Minimum number
 */
function minValue (val, min) {
  var n = parseInt(val, 10);
  return !isNaN(n) && n >= min;
}

/**
 * Safe integer parse
 */
function toInt (val, fallback) {
  var n = parseInt(val, 10);
  return isNaN(n) ? (fallback || 0) : n;
}

/**
 * Trim string safely
 */
function cleanString (val) {
  return (val || '').toString().trim();
}

/* ============================================================
3. COMPOSITE VALIDATION (OPTIONAL USE)
============================================================ */

/**
 * Validate reservation basic fields (no UI)
 * Return: { valid: boolean, errors: {} }
 */
function validateReservationBasic (data) {

  var errors = {};

  if (!isRequired(data.nama)) {
    errors.nama = 'Nama wajib';
  }

  if (!isRequired(data.jam)) {
    errors.jam = 'Jam wajib';
  }

  if (!minValue(data.jumlah, 1)) {
    errors.jumlah = 'Minimal 1 orang';
  }

  if (!isRequired(data.tempat)) {
    errors.tempat = 'Pilih lokasi';
  }

  if (data.nomorHp && !validatePhone(data.nomorHp)) {
    errors.nomorHp = 'Nomor tidak valid';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: errors
  };
}

/* ============================================================
4. DEV GUARD
============================================================ */

(function () {
  try {
    if (!window.normalizePhone) {
      console.warn('[Proserva] utils.validation.js gagal load');
    }
  } catch (e) {
    console.error('[Proserva] Validation utils error:', e);
  }
})();