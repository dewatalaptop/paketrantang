'use strict';

/* ============================================================
UI.HELPERS.JS — PROSERVA CORE
DOM Utilities + UI Components
============================================================ */

/* ============================================================
1. DOM HELPERS
============================================================ */

function $(id) {
  return document.getElementById(id);
}

function setText (id, value) {
  var el = $(id);
  if (el) el.textContent = value;
}

function setHTML (id, html) {
  var el = $(id);
  if (el) el.innerHTML = html;
}

/* ============================================================
2. MODAL SYSTEM
============================================================ */

function openModal (id) {
  var el = $(id);
  if (el) el.classList.add('open');
}

function closeModal (id) {
  var el = $(id);
  if (el) el.classList.remove('open');
}

/**
 * Close modal when clicking overlay
 */
function initModalOverlayClose () {
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

/* ============================================================
3. TOAST NOTIFICATION
============================================================ */

var TOAST_ICONS = {
  success: 'fas fa-check-circle',
  error:   'fas fa-times-circle',
  info:    'fas fa-info-circle',
  warning: 'fas fa-exclamation-triangle'
};

function showToast (message, type, duration) {
  type     = type     || 'success';
  duration = duration || 3000;

  var container = $('toast-container');
  if (!container) return;

  var div = document.createElement('div');
  div.className = 'toast toast-' + type;

  div.innerHTML =
    '<i class="' + (TOAST_ICONS[type] || TOAST_ICONS.success) + '"></i>' +
    '<span>' + message + '</span>';

  container.appendChild(div);

  setTimeout(function () {
    div.style.opacity = '0';
    div.style.transform = 'translateX(20px)';

    setTimeout(function () {
      if (div.parentNode) div.remove();
    }, 300);
  }, duration);
}

/* ============================================================
4. FORM ERROR HANDLING
============================================================ */

function showFieldError (id, message) {
  var el = $(id);
  if (!el) return;

  el.textContent = message;
  el.classList.add('show');

  var inputId = id.replace(/^err-/, 'res-');
  var input = $(inputId);

  if (input) input.classList.add('error');
}

function clearFormErrors () {
  document.querySelectorAll('.form-error').forEach(function (el) {
    el.textContent = '';
    el.classList.remove('show');
  });

  document.querySelectorAll('.form-input.error, .form-select.error')
    .forEach(function (el) {
      el.classList.remove('error');
    });
}

/* ============================================================
5. SIDEBAR
============================================================ */

function toggleSidebar () {
  var sidebar = $('sidebar');
  var overlay = $('sidebar-overlay');

  var isOpen = sidebar && sidebar.classList.contains('open');

  if (isOpen) {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
  } else {
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('show');
  }
}

function initSidebarOverlay () {
  if (!$('sidebar-overlay')) {
    var el = document.createElement('div');
    el.id = 'sidebar-overlay';
    el.onclick = toggleSidebar;
    document.body.appendChild(el);
  }
}

/* ============================================================
6. KEYBOARD SHORTCUTS
============================================================ */

function initKeyboardShortcuts () {
  document.addEventListener('keydown', function (e) {

    if (e.key === 'Escape') {

      // Close modals
      document.querySelectorAll('.modal-overlay.open')
        .forEach(function (m) {
          m.classList.remove('open');
        });

      // Close notif dropdown
      var nd = $('notif-dropdown');
      if (nd) nd.classList.remove('open');
    }
  });
}

/* ============================================================
7. DROPDOWN (NOTIFICATION)
============================================================ */

function toggleNotifDropdown (e) {
  if (e && e.stopPropagation) e.stopPropagation();

  var nd = $('notif-dropdown');
  if (!nd) return;

  nd.classList.toggle('open');
}

function closeNotifHandler (e) {
  var nd  = $('notif-dropdown');
  var btn = $('notif-btn');

  if (!nd) return;

  if (nd.contains(e.target)) return;
  if (btn && btn.contains(e.target)) return;

  nd.classList.remove('open');
}

/* ============================================================
8. SMALL UI HELPERS
============================================================ */

/**
 * Smooth scroll to top
 */
function scrollTopSmooth () {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/**
 * Confirm dialog wrapper
 */
function confirmAction (msg) {
  return window.confirm(msg);
}

/* ============================================================
9. SAFE GUARD
============================================================ */
(function () {
  try {
    if (!document.body) {
      console.warn('[Proserva] DOM belum siap untuk UI helpers');
    }
  } catch (e) {
    console.error('[Proserva] UI helpers init error:', e);
  }
})();