'use strict';

/* ============================================================
APP.CONTROLLER.JS — PROSERVA CORE
Main Orchestrator (UI ↔ Data ↔ Service)
============================================================ */

/* ============================================================
1. BOOT
============================================================ */

function boot () {

  document.body.classList.add('has-banner');

  // Trial check (kalau masih pakai)
  if (window.TRIAL && TRIAL.checkAndEnforce) {
    TRIAL.checkAndEnforce();
  }

  if (DB.get(KEYS.SETUP_DONE)) {

    $('setup-wizard').style.display = 'none';
    $('app-shell').style.display    = 'block';

    initApp();

  } else {

    $('setup-wizard').style.display = 'block';
    $('app-shell').style.display    = 'none';
  }

  initModalOverlayClose();
  initKeyboardShortcuts();
  initSidebarOverlay();

  if (window.TRIAL && TRIAL.startTicker) {
    TRIAL.startTicker();
  }
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();

/* ============================================================
2. INIT APP
============================================================ */

function initApp () {
  loadState();

  renderHeader();
  showView('calendar');

  NOTIFICATION.start();
}

/* ============================================================
3. HEADER
============================================================ */

function renderHeader () {
  var name = state.biz?.name || 'Usaha Saya';

  setText('cal-biz-name', name);
  setText('sidebar-biz-name', name);

  var sub = $('cal-subtitle');
  if (sub) {
    sub.textContent = 'Kelola reservasi ' + name + ' dengan mudah.';
  }
}

/* ============================================================
4. VIEW ROUTER
============================================================ */

function showView (name) {

  // Hide all
  document.querySelectorAll('#content .view')
    .forEach(function (v) {
      v.style.display = 'none';
      v.classList.remove('active-view');
    });

  // Show target
  var el = $('view-' + name);
  if (el) {
    el.style.display = 'block';
    el.classList.add('active-view');
  }

  // Sidebar active
  document.querySelectorAll('.nav-item')
    .forEach(function (n) {
      n.classList.toggle('active', n.dataset.view === name);
    });

  handleViewInit(name);
}

/* ============================================================
5. VIEW INIT LOGIC
============================================================ */

function handleViewInit (name) {

  if (name === 'calendar') renderCalendar();

  if (name === 'menus')     renderMenusTable();
  if (name === 'locations') renderLocationsTable();
  if (name === 'customers') renderCustomersTable();

  if (name === 'analysis') {
    setupAnalysisSelectors();
    runAnalysis();
  }

  if (name === 'broadcast') {
    loadBroadcastView();
  }
}

/* ============================================================
6. CALENDAR ACTIONS
============================================================ */

function selectDate (dateStr) {
  state.selectedDate = dateStr;

  setText('detail-title', formatDateDisplay(dateStr));

  showView('detail');
  renderDetailList(getResForDate(dateStr));

  scrollTopSmooth();
}

function backToCalendar () {
  state.selectedDate = null;
  showView('calendar');
}

/* ============================================================
7. RESERVATION ACTIONS
============================================================ */

function handleSaveReservation () {

  clearFormErrors();

  var data = collectReservationForm();

  if (!validateReservationForm(data)) return;

  if (data.id) {

    updateReservation(data);
    showToast('Reservasi diperbarui');

  } else {

    data.id = genId();
    data.createdAt = Date.now();
    data.thankYouSent = false;

    addReservation(data);
    showToast('Reservasi ditambahkan 🎉');
  }

  closeModal('modal-reservation');

  refreshAfterReservationChange();
}

/**
 * Collect form values
 */
function collectReservationForm () {
  return {
    id: $('res-edit-id').value || null,
    date: state.selectedDate || todayStr(),
    nama: $('res-nama').value.trim(),
    nomorHp: normalizePhone($('res-hp').value),
    jam: $('res-jam').value,
    jumlah: parseInt($('res-jumlah').value, 10),
    tempat: $('res-tempat').value,
    dp: parseInt($('res-dp').value, 10) || 0,
    tipeDp: $('res-tipe-dp').value,
    tambahan: $('res-tambahan').value.trim(),
    menus: collectMenuRows()
  };
}

/**
 * Validate form
 */
function validateReservationForm (d) {
  var valid = true;

  if (!d.nama) {
    showFieldError('err-nama', 'Nama wajib');
    valid = false;
  }

  if (!d.jam) {
    showFieldError('err-jam', 'Jam wajib');
    valid = false;
  }

  if (!d.jumlah || d.jumlah < 1) {
    showFieldError('err-jumlah', 'Minimal 1 orang');
    valid = false;
  }

  if (!d.tempat) {
    showFieldError('err-tempat', 'Pilih lokasi');
    valid = false;
  }

  return valid;
}

/**
 * Refresh UI after CRUD
 */
function refreshAfterReservationChange () {
  renderCalendar();

  if (state.selectedDate) {
    renderDetailList(getResForDate(state.selectedDate));
  }
}

/* ============================================================
8. WHATSAPP ACTIONS
============================================================ */

function handleSendConfirmation (id) {
  if (!sendConfirmation(id)) {
    showToast('Nomor tidak tersedia', 'error');
  }
}

function handleSendThankYou (id) {
  if (!sendThankYou(id)) {
    showToast('Gagal kirim', 'error');
  } else {
    showToast('Ucapan terkirim 🎉');
  }
}

/* ============================================================
9. DELETE ACTION
============================================================ */

function handleDeleteReservation (id) {

  if (!confirmAction('Hapus reservasi ini?')) return;

  deleteReservation(id);

  showToast('Reservasi dihapus', 'info');

  refreshAfterReservationChange();
}

/* ============================================================
10. SAFE GUARD
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