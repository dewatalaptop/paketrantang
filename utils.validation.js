'use strict';

/* ============================================================
UTILS.VALIDATION.JS — PROSERVA CORE
Form Validation + Input Normalization
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
2. FIELD ERROR HANDLING
============================================================ */

/**
 * Show error message for field
 * Convention:
 * - error id: err-xxx
 * - input id: res-xxx
 */
function showFieldError (errorElId, message) {
  var el = document.getElementById(errorElId);
  if (!el) return;

  el.textContent = message;
  el.classList.add('show');

  // highlight input
  var inputId = errorElId.replace(/^err-/, 'res-');
  var input   = document.getElementById(inputId);

  if (input) {
    input.classList.add('error');
  }
}

/**
 * Clear all form errors
 */
function clearFormErrors () {
  // clear messages
  document.querySelectorAll('.form-error').forEach(function (el) {
    el.textContent = '';
    el.classList.remove('show');
  });

  // remove error styles
  document
    .querySelectorAll('.form-input.error, .form-select.error')
    .forEach(function (el) {
      el.classList.remove('error');
    });
}

/* ============================================================
3. GENERIC REQUIRED VALIDATION
============================================================ */

/**
 * Validate required field
 */
function isRequired (val) {
  return val !== null && val !== undefined && String(val).trim() !== '';
}

/**
 * Validate number min
 */
function minValue (val, min) {
  var n = parseInt(val, 10);
  return !isNaN(n) && n >= min;
}

/* ============================================================
4. DEV GUARD
============================================================ */
(function () {
  try {
    if (!window.validatePhone) {
      console.warn('[Proserva] utils.validation.js gagal load');
    }
  } catch (e) {
    console.error('[Proserva] Validation utils error:', e);
  }
})();