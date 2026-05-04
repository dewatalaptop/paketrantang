'use strict';

/* ============================================================
UTILS.STRING.JS — PROSERVA CORE
String Helpers + HTML Safety
============================================================ */

/* ============================================================
1. ESCAPE HTML (CRITICAL)
Prevents XSS injection & broken UI
============================================================ */
function escapeHtml (str) {
  if (str === null || str === undefined) return '';

  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* ============================================================
2. TRUNCATE TEXT
============================================================ */
function truncate (str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;

  return str.slice(0, maxLen) + '…';
}

/* ============================================================
3. NAME → INITIALS (Avatar)
============================================================ */
function getInitials (name) {
  if (!name) return '?';

  var parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/* ============================================================
4. NAME → COLOR (Consistent Avatar Color)
============================================================ */
function nameToColor (name) {
  if (!name) return '#64748b';

  var hash = 0;

  for (var i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  var colors = [
    '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#06b6d4', '#3b82f6',
    '#8b5cf6', '#ec4899'
  ];

  return colors[Math.abs(hash) % colors.length];
}

/* ============================================================
5. SAFE STRING (Fallback helper)
============================================================ */
function safeStr (val) {
  if (val === null || val === undefined) return '';
  return String(val);
}

/* ============================================================
6. DEV GUARD (Optional)
============================================================ */
(function () {
  try {
    if (!window.escapeHtml) {
      console.warn('[Proserva] utils.string.js gagal load');
    }
  } catch (e) {
    console.error('[Proserva] String utils error:', e);
  }
})();