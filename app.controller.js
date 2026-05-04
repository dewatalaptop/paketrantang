'use strict';

/* ============================================================
APP.CONTROLLER.JS — PROSERVA CORE (REWRITE)
Stable, Defensive, Modular
============================================================ */

const App = (function () {

  /* ============================================================
  1. BOOTSTRAP
  ============================================================ */

  function boot () {
    try {

      document.body.classList.add('has-banner');

      if (window.TRIAL?.checkAndEnforce) {
        TRIAL.checkAndEnforce();
      }

      const isSetup = DB?.get?.(KEYS.SETUP_DONE);

      toggleSetup(!isSetup);

      if (isSetup) initApp();

      initGlobalUI();

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

      NOTIFICATION?.start?.();

    } catch (err) {
      console.error('[INIT ERROR]', err);
    }
  }

  function loadStateSafe () {
    try {
      loadState?.();
    } catch (e) {
      console.warn('State gagal load, reset...');
      window.state = {};
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
  4. ROUTER (CLEAN)
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
        renderCalendarSafe();
        break;

      case 'menus':
        renderMenusTable?.();
        break;

      case 'locations':
        renderLocationsTable?.();
        break;

      case 'customers':
        renderCustomersTable?.();
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

  function renderCalendarSafe () {
    try {
      renderCalendar?.();
    } catch (e) {
      console.error('Calendar render error', e);
    }
  }


  /* ============================================================
  6. CALENDAR FLOW
  ============================================================ */

  function selectDate (dateStr) {
    if (!dateStr) return;

    state.selectedDate = dateStr;

    setTextSafe('detail-title', formatDateDisplay?.(dateStr) || dateStr);

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
  7. RESERVATION FLOW (IMPROVED)
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
      console.error('Save reservation error', err);
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
    renderCalendarSafe();

    if (state.selectedDate) {
      renderDetailList?.(getResForDate?.(state.selectedDate) || []);
    }
  }


  /* ============================================================
  8. WHATSAPP
  ============================================================ */

  function sendConfirmationHandler (id) {
    if (!sendConfirmation?.(id)) {
      showToast('Nomor tidak tersedia', 'error');
    }
  }

  function sendThankYouHandler (id) {
    if (!sendThankYou?.(id)) {
      showToast('Gagal kirim', 'error');
    } else {
      showToast('Ucapan terkirim 🎉');
    }
  }


  /* ============================================================
  9. DELETE
  ============================================================ */

  function deleteReservationHandler (id) {

    if (!confirmAction?.('Hapus reservasi ini?')) return;

    try {
      deleteReservation?.(id);
      showToast('Reservasi dihapus', 'info');
      refreshAfterReservationChange();
    } catch (e) {
      console.error('Delete error', e);
    }
  }


  /* ============================================================
  10. GLOBAL UI INIT
  ============================================================ */

  function initGlobalUI () {
    initModalOverlayClose?.();
    initKeyboardShortcuts?.();
    initSidebarOverlay?.();
  }


  /* ============================================================
  11. SAFE HELPERS
  ============================================================ */

  function setTextSafe (id, val) {
    const el = $(id);
    if (el) el.textContent = val;
  }


  /* ============================================================
  EXPORT (IMPORTANT)
  ============================================================ */

  return {
    showView: Router.show,
    selectDate,
    backToCalendar,
    saveReservation,
    deleteReservation: deleteReservationHandler,
    sendConfirmation: sendConfirmationHandler,
    sendThankYou: sendThankYouHandler
  };

})();


/* ============================================================
GLOBAL BINDING (for HTML inline handlers)
============================================================ */

window.showView = App.showView;
window.selectDate = App.selectDate;
window.backToCalendar = App.backToCalendar;
window.saveReservation = App.saveReservation;
window.handleDeleteReservation = App.deleteReservation;
window.handleSendConfirmation = App.sendConfirmation;
window.handleSendThankYou = App.sendThankYou;


/* ============================================================
SAFE GUARD
============================================================ */

(function () {
  try {
    if (!window.DB || !window.state) {
      console.warn('[Proserva] Core belum lengkap');
    }
  } catch (e) {
    console.error('[Proserva] App controller error:', e);
  }
})();