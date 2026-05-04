'use strict';

/* ============================================================
APP.CONTROLLER.JS — PROSERVA CORE (FINAL STABLE + CALENDAR FIX)
============================================================ */

const App = (function () {

  /* ============================================================
  1. BOOT
  ============================================================ */

  function boot () {
    try {

      document.body.classList.add('has-banner');

      window.TRIAL?.checkAndEnforce?.();

      const isSetup = DB?.get?.(KEYS.SETUP_DONE);

      toggleSetup(!isSetup);

      initGlobalUI();

      if (isSetup) initApp();

      window.TRIAL?.startTicker?.();

    } catch (err) {
      console.error('[BOOT ERROR]', err);
      alert('Terjadi error saat memulai aplikasi');
    }
  }

  function toggleSetup (showSetup) {
    const wizard = $('setup-wizard');
    const shell  = $('app-shell');

    if (!wizard || !shell) return;

    wizard.style.display = showSetup ? 'block' : 'none';
    shell.style.display  = showSetup ? 'none'  : 'block';
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();


  /* ============================================================
  2. INIT APP
  ============================================================ */

  function initApp () {
    try {

      loadStateSafe();
      renderHeader();

      Router.show('calendar');

      NOTIFICATION?.start?.();

    } catch (err) {
      console.error('[INIT ERROR]', err);
    }
  }

  function loadStateSafe () {
    try {
      loadState?.();

      if (!window.state) window.state = {};

      state.biz = state.biz || { name: 'Usaha Saya', type: 'restoran' };
      state.menus = state.menus || [];
      state.locations = state.locations || [];
      state.reservations = state.reservations || {};

    } catch (e) {
      console.warn('[STATE FALLBACK]');
      window.state = {
        biz: { name: 'Usaha Saya', type: 'restoran' },
        menus: [],
        locations: [],
        reservations: {}
      };
    }
  }


  /* ============================================================
  3. HEADER
  ============================================================ */

  function renderHeader () {
    const name = state?.biz?.name || 'Usaha Saya';

    setTextSafe('cal-biz-name', name);
    setTextSafe('sidebar-biz-name', name);
  }


  /* ============================================================
  4. ROUTER
  ============================================================ */

  const Router = {
    show (name) {

      document.querySelectorAll('#content .view').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active-view');
      });

      const el = $('view-' + name);
      if (el) {
        el.style.display = 'block';
        el.classList.add('active-view');
      }

      document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.view === name);
      });

      handleViewInit(name);
    }
  };

  function handleViewInit (name) {
    switch (name) {
      case 'calendar': Calendar?.render?.(); break;
      case 'customers': Customers?.render?.(); break;
      case 'analysis': Analysis?.init?.(); break;
      case 'menus': renderMenusTable?.(); break;
      case 'locations': renderLocationsTable?.(); break;
      case 'broadcast': loadBroadcastView?.(); break;
    }
  }


  /* ============================================================
  5. CALENDAR FLOW
  ============================================================ */

  function selectDate (dateStr) {
    if (!dateStr) return;

    state.selectedDate = dateStr;

    setTextSafe('detail-title',
      formatDateDisplay?.(dateStr) || dateStr
    );

    Router.show('detail');

    renderDetailList?.(getResForDate?.(dateStr) || []);
    scrollTopSmooth?.();
  }

  function backToCalendar () {
    state.selectedDate = null;
    Router.show('calendar');
  }


  /* ============================================================
  6. 🔥 CALENDAR CONTROL (FIX UTAMA)
  ============================================================ */

  function initCalendarControls () {

    const prev  = $('btn-prev-month');
    const next  = $('btn-next-month');
    const today = $('btn-today');

    prev?.addEventListener('click', () => {
      Calendar?.prevMonth?.();
    });

    next?.addEventListener('click', () => {
      Calendar?.nextMonth?.();
    });

    today?.addEventListener('click', () => {
      Calendar?.goToday?.();
    });
  }


  /* ============================================================
  7. WIZARD (UNCHANGED)
  ============================================================ */

  function initWizard () {

    const inputName = $('wz-biz-name');

    inputName?.addEventListener('input', () => {
      inputName.classList.remove('error');
    });

    $('btn-wizard-next-1')?.addEventListener('click', () => {

      const name = inputName?.value?.trim();

      if (!name) {
        inputName.classList.add('error');
        inputName.focus();
        return;
      }

      goStep(2);
      renderWizardLocations();
    });

    $('btn-add-location')?.addEventListener('click', () => {

      const name = $('wz-loc-name')?.value?.trim();
      const cap  = parseInt($('wz-loc-cap')?.value, 10);

      if (!name) return alert('Nama lokasi wajib');
      if (!cap || cap < 1) return alert('Kapasitas minimal 1');

      state.locations.push({
        id: genId?.(),
        name,
        capacity: cap
      });

      $('wz-loc-name').value = '';
      $('wz-loc-cap').value  = '';

      renderWizardLocations();
    });

    $('btn-add-menu')?.addEventListener('click', () => {

      const name  = $('wz-menu-name')?.value?.trim();
      const price = parseInt($('wz-menu-price')?.value, 10);
      const detail = $('wz-menu-detail')?.value?.trim();

      if (!name) return alert('Nama menu wajib');
      if (!price || price <= 0) return alert('Harga tidak valid');

      state.menus.push({
        id: genId?.(),
        name,
        price,
        details: detail ? [detail] : []
      });

      $('wz-menu-name').value = '';
      $('wz-menu-price').value = '';
      $('wz-menu-detail').value = '';

      renderWizardMenus();
    });

    $('btn-wizard-next-2')?.addEventListener('click', () => {
      goStep(3);
      renderWizardMenus();
    });

    $('btn-wizard-back-1')?.addEventListener('click', () => goStep(1));
    $('btn-wizard-back-2')?.addEventListener('click', () => goStep(2));

    $('btn-wizard-finish')?.addEventListener('click', finishSetup);
  }


  /* ============================================================
  8. GLOBAL INIT
  ============================================================ */

  function initGlobalUI () {
    initModalOverlayClose?.();
    initKeyboardShortcuts?.();
    initSidebarOverlay?.();

    initWizard();
    initNav();
    initTopbar();
    initCalendarControls(); // 🔥 FIX DI SINI
  }


  function initNav () {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const view = el.dataset.view;
        if (view) Router.show(view);
      });
    });
  }

  function initTopbar () {
    $('btn-add-res')?.addEventListener('click', () => {
      openModal?.('modal-reservation');
    });

    $('btn-sidebar-toggle')?.addEventListener('click', toggleSidebar);
  }


  /* ============================================================
  HELPERS
  ============================================================ */

  function setTextSafe (id, val) {
    const el = $(id);
    if (el) el.textContent = val;
  }


  /* ============================================================
  EXPORT
  ============================================================ */

  return {
    showView: Router.show,
    selectDate,
    backToCalendar
  };

})();


/* ============================================================
GLOBAL
============================================================ */

window.showView = App.showView;
window.selectDate = App.selectDate;
window.backToCalendar = App.backToCalendar;

/* ============================================================
RESTORE MISSING GLOBAL FUNCTIONS (SAFE PATCH)
============================================================ */

/* ---------- RESERVATION ACTIONS ---------- */

window.handleDeleteReservation = function (id) {
  try {
    if (!confirmAction?.('Hapus reservasi ini?')) return;

    deleteReservation?.(id);
    showToast?.('Reservasi dihapus', 'info');

    Calendar?.render?.();

    if (window.state?.selectedDate) {
      renderDetailList?.(
        getResForDate?.(state.selectedDate) || []
      );
    }

  } catch (e) {
    console.error('[DeleteReservation]', e);
  }
};

window.handleSendConfirmation = function (id) {
  try {
    if (!sendConfirmation?.(id)) {
      showToast?.('Nomor tidak tersedia', 'error');
    }
  } catch (e) {
    console.error('[SendConfirmation]', e);
  }
};

window.handleSendThankYou = function (id) {
  try {
    if (!sendThankYou?.(id)) {
      showToast?.('Gagal kirim', 'error');
    } else {
      showToast?.('Ucapan terkirim 🎉');
    }
  } catch (e) {
    console.error('[SendThankYou]', e);
  }
};


/* ---------- SAVE RESERVATION BRIDGE ---------- */

window.saveReservation = function () {
  try {
    App?.saveReservation?.();
  } catch (e) {
    console.error('[SaveReservation]', e);
  }
};


/* ============================================================
STATE NORMALIZATION (ANTI BUG OBJECT vs ARRAY)
============================================================ */

(function normalizeState () {
  try {

    if (!window.state) return;

    // locations
    if (!Array.isArray(state.locations)) {
      state.locations = Object.values(state.locations || {});
    }

    // menus
    if (!Array.isArray(state.menus)) {
      state.menus = Object.values(state.menus || {});
    }

    // reservations (harus object)
    if (!state.reservations || typeof state.reservations !== 'object') {
      state.reservations = {};
    }

  } catch (e) {
    console.warn('[StateNormalize]', e);
  }
})();