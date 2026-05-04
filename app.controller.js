'use strict';

/* ============================================================
APP.CONTROLLER.JS — PROSERVA CORE (STABLE FINAL)
Modular • Defensive • Production Ready
============================================================ */

const App = (function () {

  /* ============================================================
  1. BOOT
  ============================================================ */

  function boot () {
    try {

      document.body.classList.add('has-banner');

      if (window.TRIAL?.checkAndEnforce) {
        TRIAL.checkAndEnforce();
      }

      const isSetup = DB?.get?.(KEYS.SETUP_DONE);

      toggleSetup(!isSetup);

      initGlobalUI();

      if (isSetup) initApp();

      if (window.TRIAL?.startTicker) {
        TRIAL.startTicker();
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

      if (!window.Calendar) {
        console.warn('[Calendar] belum terload');
      }

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
      console.warn('State fallback digunakan');

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

    const sub = $('cal-subtitle');
    if (sub) {
      sub.textContent = `Kelola reservasi ${name} dengan mudah.`;
    }
  }


  /* ============================================================
  4. ROUTER
  ============================================================ */

  const Router = {

    show (name) {

      hideAllViews();

      const el = $('view-' + name);
      if (el) {
        el.style.display = 'block';
        el.classList.add('active-view');
      }

      setActiveNav(name);
      handleViewInit(name);
    }
  };

  function hideAllViews () {
    document.querySelectorAll('#content .view').forEach(v => {
      v.style.display = 'none';
      v.classList.remove('active-view');
    });
  }

  function setActiveNav (name) {
    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.view === name);
    });
  }


  /* ============================================================
  5. VIEW HANDLER
  ============================================================ */

  function handleViewInit (name) {

    switch (name) {

      case 'calendar':
        Calendar?.render?.();
        break;

      case 'detail':
        break;

      case 'menus':
        renderMenusTable?.();
        break;

      case 'locations':
        renderLocationsTable?.();
        break;

      case 'customers':
  Customers?.render?.();
  break;

      case 'analysis':
        setupAnalysisSelectors?.();
        runAnalysis?.();
        break;

      case 'broadcast':
        loadBroadcastView?.();
        break;
    }
  }


  /* ============================================================
  6. CALENDAR FLOW
  ============================================================ */

  function selectDate (dateStr) {
    if (!dateStr) return;

    state.selectedDate = dateStr;

    setTextSafe('detail-title',
      formatDateDisplay?.(dateStr) || dateStr
    );

    Router.show('detail');

    try {
      renderDetailList?.(getResForDate?.(dateStr) || []);
    } catch (e) {
      console.error('Detail render error', e);
    }

    scrollTopSmooth?.();
  }

  function backToCalendar () {
    state.selectedDate = null;
    Router.show('calendar');
  }


  /* ============================================================
  7. RESERVATION FLOW
  ============================================================ */

  function saveReservation () {

    clearFormErrors?.();

    const data = collectReservationForm();

    if (!validateReservationForm(data)) return;

    try {

      if (data.id) {
        updateReservation?.(data);
        showToast('Reservasi diperbarui');
      } else {
        data.id = genId?.();
        data.createdAt = Date.now();
        data.thankYouSent = false;

        addReservation?.(data);
        showToast('Reservasi ditambahkan 🎉');
      }

      closeModal?.('modal-reservation');

      refreshAfterReservationChange();

    } catch (err) {
      console.error('Save error', err);
      showToast('Gagal menyimpan data', 'error');
    }
  }

  function collectReservationForm () {
    return {
      id: $('res-edit-id')?.value || null,
      date: state.selectedDate || todayStr?.(),
      nama: $('res-nama')?.value?.trim() || '',
      nomorHp: normalizePhone?.($('res-hp')?.value) || '',
      jam: $('res-jam')?.value,
      jumlah: parseInt($('res-jumlah')?.value, 10),
      tempat: $('res-tempat')?.value,
      dp: parseInt($('res-dp')?.value, 10) || 0,
      tipeDp: $('res-tipe-dp')?.value,
      tambahan: $('res-tambahan')?.value?.trim(),
      menus: collectMenuRows?.() || []
    };
  }

  function validateReservationForm (d) {

    let valid = true;

    if (!d.nama) {
      showFieldError?.('err-nama', 'Nama wajib');
      valid = false;
    }

    if (!d.jam) {
      showFieldError?.('err-jam', 'Jam wajib');
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

    return valid;
  }

  function refreshAfterReservationChange () {
    Calendar?.render?.();

    if (state.selectedDate) {
      renderDetailList?.(
        getResForDate?.(state.selectedDate) || []
      );
    }
  }


  /* ============================================================
  8. WIZARD
  ============================================================ */

  function initWizard () {

    $('btn-wizard-next-1')?.addEventListener('click', () => goStep(2));
    $('btn-wizard-next-2')?.addEventListener('click', () => goStep(3));

    $('btn-wizard-back-1')?.addEventListener('click', () => goStep(1));
    $('btn-wizard-back-2')?.addEventListener('click', () => goStep(2));

    $('btn-wizard-finish')?.addEventListener('click', finishSetup);
  }

  function goStep (step) {
    document.querySelectorAll('.wizard-step')
      .forEach(el => el.classList.remove('active'));

    $('wizard-' + step)?.classList.add('active');
  }

  function finishSetup () {

    const name = $('wz-biz-name')?.value?.trim();

    if (!name) {
      alert('Nama usaha wajib diisi');
      return;
    }

    state.biz = {
      name: name,
      type: $('wz-biz-type')?.value || 'restoran'
    };

    state.locations = state.locations || [];
    state.menus = state.menus || [];

    saveBiz?.();
    saveLocations?.();
    saveMenus?.();

    DB.set(KEYS.SETUP_DONE, true);

    location.reload();
  }


  /* ============================================================
  9. NAV + TOPBAR
  ============================================================ */

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
  10. GLOBAL INIT
  ============================================================ */

  function initGlobalUI () {
    initModalOverlayClose?.();
    initKeyboardShortcuts?.();
    initSidebarOverlay?.();

    initWizard();
    initNav();
    initTopbar();
  }


  /* ============================================================
  11. HELPERS
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
    backToCalendar,
    saveReservation
  };

})();


/* ============================================================
GLOBAL BINDING
============================================================ */

window.showView = App.showView;
window.selectDate = App.selectDate;
window.backToCalendar = App.backToCalendar;
window.saveReservation = App.saveReservation;


/* ============================================================
SAFE GUARD
============================================================ */

(function () {
  try {
    if (!window.DB || !window.state) {
      console.warn('[Proserva] Core belum lengkap');
    }
  } catch (e) {
    console.error('[Proserva] App error:', e);
  }
})();