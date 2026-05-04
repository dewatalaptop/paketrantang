'use strict';

/* ============================================================
UTILS.VALIDATION.JS — PROSERVA CORE (REWRITE)
Robust • Safe • Reusable
============================================================ */

/* ============================================================
1. PHONE VALIDATION (IMPROVED)
============================================================ */

/**
 * Clean digits only
 */
function extractDigits (raw) {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '');
}

/**
 * Normalize phone:
 * 08xxx → 628xxx
 * +628xxx → 628xxx
 */
function normalizePhone (raw) {
  let digits = extractDigits(raw);

  if (!digits) return '';

  // remove leading +
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  }

  // handle 8xxx (missing 0)
  if (digits.startsWith('8')) {
    digits = '62' + digits;
  }

  return digits;
}

/**
 * Validate Indonesian phone
 */
function validatePhone (raw) {
  const phone = normalizePhone(raw);

  // must start with 62
  if (!phone.startsWith('62')) return false;

  // typical length 10–14
  if (phone.length < 10 || phone.length > 14) return false;

  return true;
}

/* ============================================================
2. STRING VALIDATION
============================================================ */

/**
 * Required check
 */
function isRequired (val) {
  return val !== null && val !== undefined && String(val).trim() !== '';
}

/**
 * Safe string (basic sanitize)
 */
function sanitizeText (val, maxLen) {
  if (!val) return '';

  let str = String(val).trim();

  // remove excessive spaces
  str = str.replace(/\s+/g, ' ');

  if (maxLen && str.length > maxLen) {
    str = str.slice(0, maxLen);
  }

  return str;
}

/* ============================================================
3. NUMBER VALIDATION
============================================================ */

function toInt (val, fallback = 0) {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

function minValue (val, min) {
  const n = toInt(val, null);
  return n !== null && n >= min;
}

/* ============================================================
4. GENERIC FIELD VALIDATOR (NEW)
============================================================ */

/**
 * Validate object fields with rules
 * Example:
 * validateFields(data, {
 *   nama: { required: true },
 *   hp: { phone: true },
 *   jumlah: { min: 1 }
 * })
 */
function validateFields (data, rules) {
  const errors = {};

  Object.keys(rules).forEach(key => {
    const val = data[key];
    const rule = rules[key];

    // required
    if (rule.required && !isRequired(val)) {
      errors[key] = 'Wajib diisi';
      return;
    }

    // phone
    if (rule.phone && val && !validatePhone(val)) {
      errors[key] = 'Nomor tidak valid';
      return;
    }

    // min number
    if (rule.min !== undefined && !minValue(val, rule.min)) {
      errors[key] = `Minimal ${rule.min}`;
      return;
    }
  });

  return errors;
}

/* ============================================================
5. DEV GUARD
============================================================ */

(function () {
  try {
    if (!window.validatePhone) {
      console.warn('[Proserva] validation utils gagal load');
    }
  } catch (e) {
    console.error('[Proserva] Validation error:', e);
  }
})();