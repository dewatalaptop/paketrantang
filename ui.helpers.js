'use strict';

/* ============================================================
UI.HELPERS.JS — PROSERVA CORE (REWRITE)
Safe • Clean • UX Improved
============================================================ */

/* ============================================================
1. DOM HELPERS
============================================================ */

function $(id) {
  return document.getElementById(id);
}

function setText (id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? '';
}

function setHTML (id, html) {
  const el = $(id);
  if (el) el.innerHTML = html ?? '';
}

/**
 * Escape HTML (IMPORTANT for user input)
 */
function escapeHtml (str) {
  if (typeof str !== 'string') return str;

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================================
2. MODAL SYSTEM (IMPROVED)
============================================================ */

function openModal (id) {
  const el = $(id);
  if (!el) return;

  el.classList.add('open');
  document.body.style.overflow = 'hidden'; // lock scroll
}

function closeModal (id) {
  const el = $(id);
  if (!el) return;

  el.classList.remove('open');

  // unlock scroll only if no modal open
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.style.overflow = '';
  }
}

/**
 * Close modal when clicking overlay
 */
function initModalOverlayClose () {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

/* ============================================================
3. TOAST SYSTEM (IMPROVED)
============================================================ */

const TOAST_ICONS = {
  success: 'fas fa-check-circle',
  error:   'fas fa-times-circle',
  info:    'fas fa-info-circle',
  warning: 'fas fa-exclamation-triangle'
};

const MAX_TOAST = 4;

function showToast (message, type = 'success', duration = 3000) {

  const container = $('toast-container');
  if (!container) return;

  // limit toast
  while (container.children.length >= MAX_TOAST) {
    container.removeChild(container.firstChild);
  }

  const div = document.createElement('div');
  div.className = `toast toast-${type}`;

  div.innerHTML =
    `<i class="${TOAST_ICONS[type] || TOAST_ICONS.success}"></i>` +
    `<span>${escapeHtml(message)}</span>`;

  container.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateX(20px)';

    setTimeout(() => div.remove(), 300);
  }, duration);
}

/* ============================================================
4. FORM ERROR HANDLING
============================================================ */

function showFieldError (id, message) {
  const el = $(id);
  if (!el) return;

  el.textContent = message;
  el.classList.add('show');

  const inputId = id.replace(/^err-/, 'res-');
  const input = $(inputId);

  if (input) input.classList.add('error');
}

function clearFormErrors () {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });

  document.querySelectorAll('.form-input.error, .form-select.error')
    .forEach(el => el.classList.remove('error'));
}

/* ============================================================
5. SIDEBAR
============================================================ */

function toggleSidebar () {
  const sidebar = $('sidebar');
  const overlay = $('sidebar-overlay');

  if (!sidebar) return;

  const isOpen = sidebar.classList.contains('open');

  sidebar.classList.toggle('open', !isOpen);
  overlay?.classList.toggle('show', !isOpen);
}

function initSidebarOverlay () {
  if (!$('sidebar-overlay')) {
    const el = document.createElement('div');
    el.id = 'sidebar-overlay';
    el.onclick = toggleSidebar;
    document.body.appendChild(el);
  }
}

/* ============================================================
6. KEYBOARD SHORTCUTS
============================================================ */

function initKeyboardShortcuts () {
  document.addEventListener('keydown', e => {

    if (e.key === 'Escape') {

      // close modals
      document.querySelectorAll('.modal-overlay.open')
        .forEach(m => m.classList.remove('open'));

      // unlock scroll
      document.body.style.overflow = '';

      // close notif
      $('notif-dropdown')?.classList.remove('open');
    }
  });
}

/* ============================================================
7. DROPDOWN (FIXED AUTO CLOSE)
============================================================ */

function toggleNotifDropdown (e) {
  e?.stopPropagation?.();

  const nd = $('notif-dropdown');
  if (!nd) return;

  nd.classList.toggle('open');
}

// global click handler
document.addEventListener('click', function (e) {
  const nd  = $('notif-dropdown');
  const btn = $('notif-btn');

  if (!nd) return;

  if (nd.contains(e.target)) return;
  if (btn && btn.contains(e.target)) return;

  nd.classList.remove('open');
});

/* ============================================================
8. SMALL HELPERS
============================================================ */

function scrollTopSmooth () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function confirmAction (msg) {
  return window.confirm(msg);
}

/**
 * Debounce helper (future use)
 */
function debounce (fn, delay = 300) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ============================================================
9. SAFE GUARD
============================================================ */

(function () {
  try {
    if (!document.body) {
      console.warn('[Proserva] DOM belum siap');
    }
  } catch (e) {
    console.error('[Proserva] UI init error:', e);
  }
})();