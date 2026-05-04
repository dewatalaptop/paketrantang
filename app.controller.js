'use strict';

/* ============================================================
APP.CONTROLLER.JS — PROSERVA CORE (FINAL HARDENED)
PART 1: BOOT → ROUTER → WIZARD → GLOBAL INIT → SAVE CORE
============================================================ */

const App = (function () {

  /* ============================================================
  1. BOOT
  ============================================================ */

  function boot () {
    try {

      document.body.classList.add('has-banner');

      // 🔥 SAFE TRIAL
      if (typeof window.TRIAL !== 'undefined') {
        window.TRIAL.checkAndEnforce?.();
      }

      const isSetup = DB?.get?.(KEYS.SETUP_DONE);

      toggleSetup(!isSetup);

      initGlobalUI();

      if (isSetup) initApp();

      if (typeof window.TRIAL !== 'undefined') {
        window.TRIAL.startTicker?.();
      }

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

      // 🔥 HARD NORMALIZATION (ANTI BUG GLOBAL)
      state.menus     = Array.isArray(state.menus) ? state.menus : Object.values(state.menus || {});
      state.locations = Array.isArray(state.locations) ? state.locations : Object.values(state.locations || {});

      state.reservations =
        (state.reservations && typeof state.reservations === 'object')
          ? state.reservations
          : {};

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

      case 'calendar':
        window.Calendar?.render?.();
        break;

      case 'customers':
        window.Customers?.render?.();
        break;

      case 'analysis':
        window.Analysis?.init?.();
        break;

      case 'menus':
        renderMenusTable?.();
        break;

      case 'locations':
        renderLocationsTable?.();
        break;

      case 'broadcast':
        loadBroadcastView?.();
        break;
    }
  }


  /* ============================================================
  5. CALENDAR FLOW
  ============================================================ */

  function selectDate (dateStr) {
    if (!dateStr) return;

    state.selectedDate = dateStr;

    setTextSafe(
      'detail-title',
      formatDateDisplay?.(dateStr) || dateStr
    );

    Router.show('detail');

    try {
      renderDetailList?.(getResForDate?.(dateStr) || []);
    } catch (e) {
      console.error('[DETAIL ERROR]', e);
    }

    scrollTopSmooth?.();
  }

  function backToCalendar () {
    state.selectedDate = null;
    Router.show('calendar');
  }


  /* ============================================================
  6. CALENDAR CONTROL (SAFE)
  ============================================================ */

  function initCalendarControls () {

    const prev  = $('btn-prev-month');
    const next  = $('btn-next-month');
    const today = $('btn-today');

    if (!prev && !next && !today) {
      console.warn('[CalendarControls] tombol tidak ditemukan');
      return;
    }

    prev?.addEventListener('click', () => {
      window.Calendar?.prevMonth?.();
    });

    next?.addEventListener('click', () => {
      window.Calendar?.nextMonth?.();
    });

    today?.addEventListener('click', () => {
      window.Calendar?.goToday?.();
    });
  }


  /* ============================================================
  7. WIZARD (FULL HARDENED)
  ============================================================ */

  function initWizard () {

    const inputName = $('wz-biz-name');

    state.locations = Array.isArray(state.locations) ? state.locations : [];
    state.menus     = Array.isArray(state.menus) ? state.menus : [];

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


    /* ---------- LOKASI ---------- */

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


    /* ---------- MENU ---------- */

    $('btn-add-menu')?.addEventListener('click', () => {

      const name   = $('wz-menu-name')?.value?.trim();
      const price  = parseInt($('wz-menu-price')?.value, 10);
      const detail = $('wz-menu-detail')?.value?.trim();

      if (!name) return alert('Nama menu wajib');
      if (!price || price <= 0) return alert('Harga tidak valid');

      state.menus.push({
        id: genId?.(),
        name,
        price,
        details: detail ? [detail] : []
      });

      $('wz-menu-name').value   = '';
      $('wz-menu-price').value  = '';
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
  🔥 CRITICAL FIX: FORM COLLECTOR (ANTI NULL ERROR)
  ============================================================ */

  function collectReservationForm () {

    return {
      id: $('res-edit-id')?.value || null,
      date: state.selectedDate || todayStr?.(),

      nama: $('res-nama')?.value?.trim() || '',
      nomorHp: normalizePhone?.($('res-hp')?.value) || '',

      jam: $('res-jam')?.value || '',
      jumlah: parseInt($('res-jumlah')?.value, 10) || 1,
      tempat: $('res-tempat')?.value || '',

      dp: parseInt($('res-dp')?.value, 10) || 0,
      tipeDp: $('res-tipe-dp')?.value || '',

      tambahan: $('res-tambahan')?.value?.trim() || '',

      menus: collectSelectedMenus()
    };
  }

  function collectSelectedMenus () {

    const checkboxes = document.querySelectorAll('[data-menu-id]');
    const menus = [];

    checkboxes.forEach(cb => {
      if (cb.checked) {
        const id = cb.dataset.menuId;
        const menu = state.menus.find(m => m.id === id);

        if (menu) {
          menus.push({
            id: menu.id,
            name: menu.name,
            quantity: 1
          });
        }
      }
    });

    return menus;
  }


  /* ============================================================
  EXPORT
  ============================================================ */

  return {
    showView: Router.show,
    selectDate,
    backToCalendar,
    saveReservation // lanjut di part 2
  };

})();
/* ============================================================
APP.CONTROLLER.JS — PART 2
SAVE FLOW • GLOBAL BINDING • FINAL HARDENING
============================================================ */

/* ============================================================
1. VALIDATION (ANTI SILENT FAIL)
============================================================ */

function validateReservationForm (d) {

  let valid = true;

  if (!d.nama) {
    showFieldError?.('err-nama', 'Nama wajib diisi');
    valid = false;
  }

  if (!d.jam) {
    showFieldError?.('err-jam', 'Jam wajib diisi');
    valid = false;
  }

  if (!d.jumlah || d.jumlah < 1) {
    showFieldError?.('err-jumlah', 'Minimal 1 orang');
    valid = false;
  }

  if (!d.tempat) {
    showFieldError?.('err-tempat', 'Pilih lokasi');
    valid = false;
  }

  if (!valid) {
    console.warn('[VALIDATION FAILED]', d);
  }

  return valid;
}


/* ============================================================
2. 🔥 SAVE RESERVATION (CORE FIX)
============================================================ */

function saveReservation () {

  try {

    clearFormErrors?.();

    const data = collectReservationForm?.();

    if (!data) {
      console.error('[SAVE] form kosong');
      return;
    }

    if (!validateReservationForm(data)) return;

    let success = false;

    if (data.id) {

      success = updateReservation?.(data);

      if (success) {
        showToast?.('Reservasi diperbarui');
      }

    } else {

      data.id = genId?.();
      data.createdAt = Date.now();
      data.thankYouSent = false;

      success = addReservation?.(data);

      if (success) {
        showToast?.('Reservasi ditambahkan 🎉');
      }
    }

    if (!success) {
      showToast?.('Gagal menyimpan data', 'error');
      return;
    }

    closeModal?.('modal-reservation');

    refreshAfterSave();

  } catch (e) {
    console.error('[SAVE ERROR]', e);
    showToast?.('Terjadi error saat menyimpan', 'error');
  }
}


/* ============================================================
3. 🔥 REFRESH UI (ANTI STALE VIEW)
============================================================ */

function refreshAfterSave () {

  try {

    window.Calendar?.render?.();

    if (window.state?.selectedDate) {
      renderDetailList?.(
        getResForDate?.(state.selectedDate) || []
      );
    }

  } catch (e) {
    console.error('[REFRESH ERROR]', e);
  }
}


/* ============================================================
4. DELETE HANDLER
============================================================ */

window.handleDeleteReservation = function (id) {

  try {

    if (!confirmAction?.('Hapus reservasi ini?')) return;

    const ok = deleteReservation?.(id);

    if (ok) {
      showToast?.('Reservasi dihapus', 'info');
      refreshAfterSave();
    }

  } catch (e) {
    console.error('[DELETE ERROR]', e);
  }
};


/* ============================================================
5. WHATSAPP HANDLER
============================================================ */

window.handleSendConfirmation = function (id) {
  try {
    if (!sendConfirmation?.(id)) {
      showToast?.('Nomor tidak tersedia', 'error');
    }
  } catch (e) {
    console.error('[WA CONFIRM ERROR]', e);
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
    console.error('[WA THANKYOU ERROR]', e);
  }
};


/* ============================================================
6. GLOBAL SAVE BINDING (🔥 WAJIB)
============================================================ */

(function bindSaveButton () {

  const btn = $('btn-save-res');

  if (!btn) {
    console.warn('[SAVE BTN] tidak ditemukan');
    return;
  }

  btn.addEventListener('click', function () {
    saveReservation();
  });

})();


/* ============================================================
7. GLOBAL EXPORT (FINAL)
============================================================ */

window.saveReservation = saveReservation;


/* ============================================================
8. STATE NORMALIZATION (ANTI BUG LEGACY DATA)
============================================================ */

(function normalizeStateDeep () {
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

    // reservations
    if (!state.reservations || typeof state.reservations !== 'object') {
      state.reservations = {};
    }

  } catch (e) {
    console.warn('[STATE NORMALIZE ERROR]', e);
  }
})();