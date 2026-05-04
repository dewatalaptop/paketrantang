'use strict';

/* ============================================================
UI.HELPERS.JS — PROSERVA CORE (FINAL FIXED)
Safe • Dropdown Ready • Modal Integrated
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

/* ============================================================
2. 🔥 SAFE ARRAY (ANTI CRASH CORE)
============================================================ */

function safeArray (val) {
  if (Array.isArray(val)) return val;
  if (val && typeof val === 'object') return Object.values(val);
  return [];
}

/* ============================================================
3. ESCAPE HTML
============================================================ */

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
4. 🔥 DROPDOWN ENGINE (CRITICAL FIX)
============================================================ */

function renderDropdownOptions () {

  try {

    /* ---------- LOKASI ---------- */

    const locSelect = $('res-tempat');

    if (locSelect) {

      const locations = safeArray(window.state?.locations);

      if (!locations.length) {
        locSelect.innerHTML = `<option value="">Belum ada lokasi</option>`;
      } else {
        locSelect.innerHTML = locations.map(loc =>
          `<option value="${escapeHtml(loc.name)}">
            ${escapeHtml(loc.name)} (${loc.capacity || 0})
          </option>`
        ).join('');
      }
    }


    /* ---------- MENU ---------- */

    const menuContainer = $('res-menu-container');

    if (menuContainer) {

      const menus = safeArray(window.state?.menus);

      if (!menus.length) {
        menuContainer.innerHTML = `
          <div class="empty">Belum ada menu</div>
        `;
      } else {

        menuContainer.innerHTML = menus.map(m => `
          <div class="menu-item">
            <label>
              <input type="checkbox" data-menu-id="${m.id}">
              ${escapeHtml(m.name)} - Rp${m.price || 0}
            </label>
          </div>
        `).join('');
      }
    }

  } catch (e) {
    console.error('[Dropdown Render Error]', e);
  }
}

/* ============================================================
5. MODAL SYSTEM (🔥 INJECT DROPDOWN)
============================================================ */

function openModal (id) {
  const el = $(id);
  if (!el) return;

  el.classList.add('open');
  document.body.style.overflow = 'hidden';

  // 🔥 FIX: inject dropdown saat buka modal
  if (id === 'modal-reservation') {
    renderDropdownOptions();
  }
}

function closeModal (id) {
  const el = $(id);
  if (!el) return;

  el.classList.remove('open');

  if (!document.querySelector('.modal-overlay.open')) {
    document.body.style.overflow = '';
  }
}

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
6. TOAST
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
7. FORM ERROR
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
8. SIDEBAR
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
9. KEYBOARD
============================================================ */

function initKeyboardShortcuts () {
  document.addEventListener('keydown', e => {

    if (e.key === 'Escape') {

      document.querySelectorAll('.modal-overlay.open')
        .forEach(m => m.classList.remove('open'));

      document.body.style.overflow = '';

      $('notif-dropdown')?.classList.remove('open');
    }
  });
}

/* ============================================================
10. SMALL HELPERS
============================================================ */

function scrollTopSmooth () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmAction (msg) {
  return window.confirm(msg);
}

/* ============================================================
11. SAFE GUARD
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