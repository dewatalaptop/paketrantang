'use strict';

/* ============================================================
UI.HELPERS.JS — PROSERVA CORE FINAL REWRITE
PART 1 / 3
Foundation • Safe Helpers • Namespace • Lifecycle
============================================================ */

/* ============================================================
1. GLOBAL UI NAMESPACE
============================================================ */

window.UI = window.UI || {};

/* ============================================================
2. UI INTERNAL STATE
============================================================ */

UI.state = {

  initialized: false,

  eventsBound: false,

  keyboardInitialized: false,

  modalOpen: false,

  sidebarOpen: false,

  activeModal: null
};

/* ============================================================
3. DOM HELPERS
============================================================ */

function $(id) {

  if (!id) {
    return null;
  }

  return document.getElementById(id);
}

function setText(id, value) {

  const el = $(id);

  if (!el) {

    console.warn(
      '[setText] element tidak ditemukan:',
      id
    );

    return false;
  }

  el.textContent = value ?? '';

  return true;
}

function setHTML(id, html) {

  const el = $(id);

  if (!el) {

    console.warn(
      '[setHTML] element tidak ditemukan:',
      id
    );

    return false;
  }

  el.innerHTML = html ?? '';

  return true;
}

/* ============================================================
4. SAFE COMPATIBILITY HELPERS
============================================================ */

function setTextSafe(id, value) {

  return setText(id, value);

}

function setHTMLSafe(id, html) {

  return setHTML(id, html);

}

/* ============================================================
5. SAFE ARRAY
============================================================ */

function safeArray(val) {

  if (Array.isArray(val)) {

    return val.filter(Boolean);

  }

  if (
    val &&
    typeof val === 'object'
  ) {

    return Object
      .values(val)
      .filter(Boolean);

  }

  return [];
}

/* ============================================================
6. SAFE OBJECT
============================================================ */

function safeObject(val) {

  if (
    !val ||
    typeof val !== 'object'
  ) {

    return {};
  }

  return val;
}

/* ============================================================
7. ESCAPE HTML
============================================================ */

function escapeHtml(str) {

  if (
    str === null ||
    str === undefined
  ) {

    return '';
  }

  str = String(str);

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================================
8. SAFE EVENT BINDER
🔥 ANTI DUPLICATE BIND
============================================================ */

function bindClick(id, handler) {

  const el = $(id);

  if (!el) {

    console.warn(
      '[bindClick] element tidak ditemukan:',
      id
    );

    return false;
  }

  if (typeof handler !== 'function') {

    console.warn(
      '[bindClick] handler invalid:',
      id
    );

    return false;
  }

  const bindKey =
  'bind_' + id.replace(/[^a-zA-Z0-9]/g, '');

if (
  el.dataset[bindKey] === '1'
) {

  return true;
}

el.dataset[bindKey] = '1';

  el.addEventListener(
    'click',
    handler
  );

  return true;
}

/* ============================================================
9. SAFE CLASS HELPERS
============================================================ */

function addClass(id, className) {

  const el =
    typeof id === 'string'
      ? $(id)
      : id;

  if (!el) {
    return false;
  }

  el.classList.add(className);

  return true;
}

function removeClass(id, className) {

  const el =
    typeof id === 'string'
      ? $(id)
      : id;

  if (!el) {
    return false;
  }

  el.classList.remove(className);

  return true;
}

function toggleClass(
  id,
  className,
  force
) {

  const el =
    typeof id === 'string'
      ? $(id)
      : id;

  if (!el) {
    return false;
  }

  el.classList.toggle(
    className,
    force
  );

  return true;
}

/* ============================================================
10. VISIBILITY HELPERS
============================================================ */

function showElement(
  id,
  display = 'block'
) {

  const el =
    typeof id === 'string'
      ? $(id)
      : id;

  if (!el) {
    return false;
  }

  el.style.display = display;

  return true;
}

function hideElement(id) {

  const el =
    typeof id === 'string'
      ? $(id)
      : id;

  if (!el) {
    return false;
  }

  el.style.display = 'none';

  return true;
}

/* ============================================================
11. SMALL HELPERS
============================================================ */

function scrollTopSmooth() {

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}

function confirmAction(message) {

  return window.confirm(message);

}

/* ============================================================
12. GLOBAL UI INIT
🔥 CRITICAL FIX
============================================================ */

function initGlobalUI() {

  try {

    if (UI.state.initialized) {

      console.warn(
        '[UI] already initialized'
      );

      return true;
    }

    console.log(
      '[UI] initializing...'
    );

    /* =========================
       SAFE SINGLE INIT
    ========================= */

    if (!UI.state.eventsBound) {

      initModalOverlayClose?.();

      initSidebarOverlay?.();

      initKeyboardShortcuts?.();

      initGlobalModalButtons?.();

      initGlobalNavigation?.();

      UI.state.eventsBound = true;
    }

    UI.state.initialized = true;

    console.log(
      '[UI] initialized'
    );

    return true;

  } catch (e) {

    console.error(
      '[UI INIT ERROR]',
      e
    );

    return false;
  }
}


/* ============================================================
UI.HELPERS.JS — PROSERVA CORE FINAL REWRITE
PART 2 / 3
Navigation • Modal • Dropdown • Form Lifecycle
============================================================ */

/* ============================================================
13. GLOBAL NAVIGATION
============================================================ */

function initGlobalNavigation() {

  document
    .querySelectorAll('.nav-item')
    .forEach(function (item) {

      if (item.dataset.navBound === '1') {
        return;
      }

      item.dataset.navBound = '1';

      item.addEventListener(
        'click',
        function () {

          const view =
            item.dataset.view;

          if (!view) {
            return;
          }

          if (
            window.App &&
            typeof window.App.showView === 'function'
          ) {

            window.App.showView(view);

          }

        }
      );

    });

}

/* ============================================================
14. GLOBAL MODAL BUTTONS
🔥 SAFE BINDING
============================================================ */

function initGlobalModalButtons() {

  /* =========================
     RESERVATION
  ========================= */

  bindClick(
    'btn-add-res',
    function () {

      openModal(
        'modal-reservation'
      );

    }
  );

  bindClick(
    'btn-close-res-modal',
    function () {

      closeModal(
        'modal-reservation'
      );

    }
  );

  bindClick(
    'btn-cancel-res',
    function () {

      closeModal(
        'modal-reservation'
      );

    }
  );

  /* =========================
     MENU
  ========================= */

  bindClick(
    'btn-open-menu-modal',
    function () {

      openModal(
        'modal-menu'
      );

    }
  );

  bindClick(
    'btn-close-menu-modal',
    function () {

      closeModal(
        'modal-menu'
      );

    }
  );

  bindClick(
    'btn-cancel-menu',
    function () {

      closeModal(
        'modal-menu'
      );

    }
  );

  /* =========================
     LOCATION
  ========================= */

  bindClick(
    'btn-open-location-modal',
    function () {

      openModal(
        'modal-location'
      );

    }
  );

  bindClick(
    'btn-close-location-modal',
    function () {

      closeModal(
        'modal-location'
      );

    }
  );

  bindClick(
    'btn-cancel-location',
    function () {

      closeModal(
        'modal-location'
      );

    }
  );

  /* =========================
     EXPORT
  ========================= */

  bindClick(
    'btn-export',
    function () {

      openModal(
        'modal-export'
      );

    }
  );

  bindClick(
    'btn-close-export',
    function () {

      closeModal(
        'modal-export'
      );

    }
  );

}

/* ============================================================
15. DROPDOWN ENGINE
============================================================ */

function renderDropdownOptions() {

  try {

    /* =========================
       LOCATION SELECT
    ========================= */

    const locSelect =
      $('res-tempat');

    if (locSelect) {

      const locations =
        safeArray(
          window.state?.locations
        );

      if (!locations.length) {

        locSelect.innerHTML = `
          <option value="">
            Belum ada lokasi
          </option>
        `;

      } else {

        locSelect.innerHTML = `
          <option value="">
            Pilih lokasi
          </option>
        `;

        locations.forEach(
          function (loc) {

            const option =
              document.createElement(
                'option'
              );

            option.value =
  loc.name || '';

            option.textContent =
              `${loc.name || 'Tanpa Nama'} (${loc.capacity || 0})`;

            locSelect.appendChild(
              option
            );

          }
        );

      }

    }

    /* =========================
       MENU CHECKBOX
    ========================= */

    const menuContainer =
      $('res-menu-container');

    if (menuContainer) {

      const menus =
        safeArray(
          window.state?.menus
        );

      if (!menus.length) {

        menuContainer.innerHTML = `
          <div class="empty">
            Belum ada menu tersedia
          </div>
        `;

      } else {

        menuContainer.innerHTML =
          '';

        menus.forEach(
          function (menu) {

            const wrapper =
              document.createElement(
                'div'
              );

            wrapper.className =
              'menu-item';

            wrapper.innerHTML = `
              <label>

                <input
                  type="checkbox"
                  data-menu-id="${escapeHtml(menu.id || '')}"
                >

                ${escapeHtml(menu.name || 'Tanpa Nama')}
                - Rp${Number(menu.price || 0).toLocaleString('id-ID')}

              </label>
            `;

            menuContainer.appendChild(
              wrapper
            );

          }
        );

      }

    }

  } catch (e) {

    console.error(
      '[Dropdown ERROR]',
      e
    );

  }

}

/* ============================================================
16. RESERVATION FORM RESET
🔥 ANTI PHANTOM EDIT
============================================================ */

function resetReservationForm() {

  const fields = [

    'res-edit-id',
    'res-nama',
    'res-hp',
    'res-jam',
    'res-jumlah',
    'res-dp',
    'res-tambahan'
  ];

  fields.forEach(function (id) {

    const el = $(id);

    if (!el) {
      return;
    }

    el.value = '';

  });

  const tempat =
    $('res-tempat');

  if (tempat) {

    tempat.selectedIndex = 0;

  }

  const tipeDp =
    $('res-tipe-dp');

  if (tipeDp) {

    tipeDp.selectedIndex = 0;

  }

  document
    .querySelectorAll(
      '[data-menu-id]'
    )
    .forEach(function (cb) {

      cb.checked = false;

    });

  clearFormErrors?.();

}

/* ============================================================
17. MODAL SYSTEM
============================================================ */

function openModal(id) {

  try {

    const modal = $(id);

    if (!modal) {

      console.warn(
        '[openModal] modal tidak ditemukan:',
        id
      );

      return false;
    }

    modal.classList.add('open');

    document.body.style.overflow =
      'hidden';

    UI.state.modalOpen = true;

    UI.state.activeModal = id;

    /* =========================
       RESERVATION INIT
    ========================= */

    if (
      id ===
      'modal-reservation'
    ) {

      renderDropdownOptions?.();

    }

    return true;

  } catch (e) {

    console.error(
      '[openModal ERROR]',
      e
    );

    return false;
  }
}

function closeModal(id) {

  try {

    const modal = $(id);

    if (!modal) {
      return false;
    }

    modal.classList.remove(
      'open'
    );

    /* =========================
       CLEANUP RESERVATION
    ========================= */

    if (
      id ===
      'modal-reservation'
    ) {

      resetReservationForm?.();

    }

    const stillOpen =
      document.querySelector(
        '.modal-overlay.open'
      );

    if (!stillOpen) {

      document.body.style.overflow =
        '';

      UI.state.modalOpen =
        false;

      UI.state.activeModal =
        null;
    }

    return true;

  } catch (e) {

    console.error(
      '[closeModal ERROR]',
      e
    );

    return false;
  }
}

/* ============================================================
18. MODAL OVERLAY CLOSE
============================================================ */

function initModalOverlayClose() {

  document
    .querySelectorAll(
      '.modal-overlay'
    )
    .forEach(function (overlay) {

      if (
        overlay.dataset.overlayBound ===
        '1'
      ) {

        return;
      }

      overlay.dataset.overlayBound =
        '1';

      overlay.addEventListener(
        'click',
        function (e) {

          if (e.target === overlay) {

            closeModal(
              overlay.id
            );

          }

        }
      );

    });

}


/* ============================================================
UI.HELPERS.JS — PROSERVA CORE FINAL REWRITE
PART 3 / 3
Toast • Sidebar • Keyboard • Public API • Compatibility
============================================================ */

/* ============================================================
19. TOAST SYSTEM
============================================================ */

const TOAST_ICONS = {

  success:
    'fas fa-check-circle',

  error:
    'fas fa-times-circle',

  warning:
    'fas fa-exclamation-triangle',

  info:
    'fas fa-info-circle'
};

const MAX_TOAST = 4;

function showToast(
  message,
  type = 'success',
  duration = 3000
) {

  try {

    const container =
      $('toast-container');

    if (!container) {

      console.warn(
        '[Toast] container tidak ditemukan'
      );

      return false;
    }

    /* =========================
       LIMIT TOAST
    ========================= */

    while (
      container.children.length >=
      MAX_TOAST
    ) {

      container.removeChild(
        container.firstChild
      );

    }

    /* =========================
       CREATE TOAST
    ========================= */

    const toast =
      document.createElement('div');

    toast.className =
      `toast toast-${type}`;

    toast.innerHTML = `
      <i class="${TOAST_ICONS[type] || TOAST_ICONS.success}"></i>

      <span>
        ${escapeHtml(message)}
      </span>
    `;

    container.appendChild(
      toast
    );

    /* =========================
       SAFE ANIMATION
    ========================= */

    if (
      typeof requestAnimationFrame ===
      'function'
    ) {

      requestAnimationFrame(
        function () {

          toast.classList.add(
            'show'
          );

        }
      );

    } else {

      setTimeout(
        function () {

          toast.classList.add(
            'show'
          );

        },
        10
      );

    }

    /* =========================
       AUTO REMOVE
    ========================= */

    setTimeout(
      function () {

        toast.classList.remove(
          'show'
        );

        setTimeout(
          function () {

            toast.remove();

          },
          300
        );

      },
      duration
    );

    return true;

  } catch (e) {

    console.error(
      '[Toast ERROR]',
      e
    );

    return false;
  }
}

/* ============================================================
20. FORM ERROR SYSTEM
============================================================ */

function showFieldError(
  id,
  message
) {

  const el = $(id);

  if (!el) {

    return false;
  }

  el.textContent =
    message || '';

  el.classList.add(
    'show'
  );

  const inputId =
    id.replace(
      /^err-/,
      'res-'
    );

  const input =
    $(inputId);

  if (input) {

    input.classList.add(
      'error'
    );

  }

  return true;
}

function clearFormErrors() {

  document
    .querySelectorAll(
      '.form-error'
    )
    .forEach(function (el) {

      el.textContent = '';

      el.classList.remove(
        'show'
      );

    });

  document
    .querySelectorAll(
      '.form-input.error, .form-select.error'
    )
    .forEach(function (el) {

      el.classList.remove(
        'error'
      );

    });

}

/* ============================================================
21. SIDEBAR SYSTEM
============================================================ */

function toggleSidebar() {

  const sidebar =
    $('sidebar');

  const overlay =
    $('sidebar-overlay');

  if (!sidebar) {

    return false;
  }

  const isOpen =
    sidebar.classList.contains(
      'open'
    );

  sidebar.classList.toggle(
    'open',
    !isOpen
  );

  overlay?.classList.toggle(
    'show',
    !isOpen
  );

  UI.state.sidebarOpen =
    !isOpen;

  return true;
}

function initSidebarOverlay() {

  const overlay =
    $('sidebar-overlay');

  if (!overlay) {
    return;
  }

  if (
    overlay.dataset.bound ===
    '1'
  ) {

    return;
  }

  overlay.dataset.bound = '1';

  overlay.addEventListener(
  'click',
  toggleSidebar
);

  bindClick(
    'btn-sidebar-toggle',
    toggleSidebar
  );
}

/* ============================================================
22. KEYBOARD SHORTCUTS
🔥 ANTI MULTI INIT
============================================================ */

function initKeyboardShortcuts() {

  if (
    UI.state.keyboardInitialized
  ) {

    return;
  }

  UI.state.keyboardInitialized =
    true;

  document.addEventListener(
    'keydown',
    function (e) {

      /* =====================
         ESC CLOSE MODAL
      ===================== */

      if (
        e.key === 'Escape'
      ) {

        document
  .querySelectorAll(
    '.modal-overlay.open'
  )
  .forEach(function (modal) {

    closeModal(modal.id);

  });
        document.body.style.overflow =
          '';

        UI.state.modalOpen =
          false;

        UI.state.activeModal =
          null;
      }

    }
  );

}

/* ============================================================
23. UI PUBLIC API
============================================================ */

UI.helpers = {

  $,

  setText,
  setHTML,

  setTextSafe,
  setHTMLSafe,

  safeArray,
  safeObject,

  escapeHtml,

  bindClick,

  addClass,
  removeClass,
  toggleClass,

  showElement,
  hideElement
};

UI.modal = {

  open: openModal,

  close: closeModal
};

UI.toast = {

  show: showToast
};

UI.init =
  initGlobalUI;

/* ============================================================
24. BACKWARD COMPATIBILITY EXPORT
🔥 WAJIB UNTUK FILE LAMA
============================================================ */

window.$ = $;

window.setText =
  setText;

window.setHTML =
  setHTML;

window.setTextSafe =
  setTextSafe;

window.setHTMLSafe =
  setHTMLSafe;

window.safeArray =
  safeArray;

window.safeObject =
  safeObject;

window.escapeHtml =
  escapeHtml;

window.openModal =
  openModal;

window.closeModal =
  closeModal;

window.showToast =
  showToast;

window.showFieldError =
  showFieldError;

window.clearFormErrors =
  clearFormErrors;

window.toggleSidebar =
  toggleSidebar;

window.scrollTopSmooth =
  scrollTopSmooth;

window.confirmAction =
  confirmAction;

window.renderDropdownOptions =
  renderDropdownOptions;

window.resetReservationForm =
  resetReservationForm;

window.initGlobalUI =
  initGlobalUI;

/* ============================================================
25. FINAL SAFE GUARD
============================================================ */

(function () {

  try {

    console.log(
      '[UI] helpers loaded'
    );

    if (!document.body) {

      console.warn(
        '[UI] body belum siap'
      );

    }

  } catch (e) {

    console.error(
      '[UI BOOT ERROR]',
      e
    );

  }

})();