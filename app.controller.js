'use strict';

/* ============================================================
APP.CONTROLLER.JS — PROSERVA CORE (FINAL STABLE + HARDENED)
PART 1: BOOT → ROUTER → CALENDAR CONTROL
============================================================ */

const App = (function () {

  /* ============================================================
  1. BOOT
  ============================================================ */

  function boot () {
    try {

      document.body.classList.add('has-banner');

      // 🔥 FIX: TRIAL SAFE ACCESS (ANTI CRASH)
      if (typeof window.TRIAL !== 'undefined') {
        window.TRIAL.checkAndEnforce?.();
      }

      const isSetup = DB?.get?.(KEYS.SETUP_DONE);

      toggleSetup(!isSetup);

      initGlobalUI();

      if (isSetup) initApp();

      // 🔥 FIX: TRIAL SAFE ACCESS
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

      // 🔥 HARDEN ARRAY STRUCTURE
      state.menus = Array.isArray(state.menus) ? state.menus : [];
      state.locations = Array.isArray(state.locations) ? state.locations : [];

      // 🔥 HARDEN OBJECT STRUCTURE
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
        // 🔥 SAFE CALL
        if (window.Calendar?.render) {
          window.Calendar.render();
        } else {
          console.warn('[Calendar] module belum siap');
        }
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
  6. 🔥 CALENDAR CONTROL (FIX UTAMA)
  ============================================================ */

  function initCalendarControls () {

    const prev  = $('btn-prev-month');
    const next  = $('btn-next-month');
    const today = $('btn-today');

    // 🔥 GUARD: element harus ada
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
  7. WIZARD (FULL FIX + HARDENED)
  ============================================================ */

  function initWizard () {

    const inputName = $('wz-biz-name');

    // 🔥 HARDEN STATE (WAJIB)
    state.locations = Array.isArray(state.locations) ? state.locations : [];
    state.menus     = Array.isArray(state.menus) ? state.menus : [];

    /* ---------- STEP 1 VALIDATION ---------- */

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


    /* ---------- STEP 2: TAMBAH LOKASI ---------- */

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


    /* ---------- STEP 3: TAMBAH MENU ---------- */

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


    /* ---------- NAVIGATION ---------- */

    $('btn-wizard-next-2')?.addEventListener('click', () => {
      goStep(3);
      renderWizardMenus();
    });

    $('btn-wizard-back-1')?.addEventListener('click', () => goStep(1));
    $('btn-wizard-back-2')?.addEventListener('click', () => goStep(2));

    $('btn-wizard-finish')?.addEventListener('click', finishSetup);
  }


  /* ============================================================
  8. WIZARD RENDER
  ============================================================ */

  function renderWizardLocations () {

    const container = $('wz-locations-list');
    if (!container) return;

    container.innerHTML = '';

    if (!state.locations.length) {
      container.innerHTML = `<div class="empty">Belum ada lokasi</div>`;
      return;
    }

    state.locations.forEach(loc => {

      const div = document.createElement('div');
      div.className = 'wz-item';

      div.innerHTML = `
        <span>${loc.name} (${loc.capacity})</span>
        <button onclick="removeWizardLocation('${loc.id}')">
          <i class="fas fa-trash"></i>
        </button>
      `;

      container.appendChild(div);
    });
  }


  function renderWizardMenus () {

    const container = $('wz-menus-list');
    if (!container) return;

    container.innerHTML = '';

    if (!state.menus.length) {
      container.innerHTML = `<div class="empty">Belum ada menu</div>`;
      return;
    }

    state.menus.forEach(menu => {

      const div = document.createElement('div');
      div.className = 'wz-item';

      div.innerHTML = `
        <span>${menu.name} - Rp${formatRupiah?.(menu.price) || menu.price}</span>
        <button onclick="removeWizardMenu('${menu.id}')">
          <i class="fas fa-trash"></i>
        </button>
      `;

      container.appendChild(div);
    });
  }


  /* ============================================================
  9. REMOVE HANDLER (GLOBAL SAFE)
  ============================================================ */

  window.removeWizardLocation = function (id) {
    try {
      state.locations = state.locations.filter(l => l.id !== id);
      renderWizardLocations();
    } catch (e) {
      console.error('[RemoveLocation]', e);
    }
  };

  window.removeWizardMenu = function (id) {
    try {
      state.menus = state.menus.filter(m => m.id !== id);
      renderWizardMenus();
    } catch (e) {
      console.error('[RemoveMenu]', e);
    }
  };


  /* ============================================================
  10. STEP CONTROL
  ============================================================ */

  function goStep (step) {
    document.querySelectorAll('.wizard-step')
      .forEach(el => el.classList.remove('active'));

    $('wizard-' + step)?.classList.add('active');
  }


  /* ============================================================
  11. FINISH SETUP
  ============================================================ */

  function finishSetup () {

    const name = $('wz-biz-name')?.value?.trim();

    if (!name || name.length < 2) {
      alert('Nama usaha minimal 2 karakter');
      return;
    }

    state.biz = {
      name,
      type: $('wz-biz-type')?.value || 'restoran'
    };

    saveBiz?.();
    saveLocations?.();
    saveMenus?.();

    DB.set(KEYS.SETUP_DONE, true);

    location.reload();
  }


  /* ============================================================
  12. GLOBAL INIT
  ============================================================ */

  function initGlobalUI () {
    initModalOverlayClose?.();
    initKeyboardShortcuts?.();
    initSidebarOverlay?.();

    initWizard();
    initNav();
    initTopbar();
    initCalendarControls();
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
  13. HELPERS
  ============================================================ */

  function setTextSafe (id, val) {
    const el = $(id);
    if (el) el.textContent = val;
  }


  /* ============================================================
  14. 🔥 RESERVATION SAVE (FIX HILANG)
  ============================================================ */

  function saveReservation () {
    try {

      clearFormErrors?.();

      const data = collectReservationForm?.();

      if (!validateReservationForm?.(data)) return;

      if (data.id) {
        updateReservation?.(data);
        showToast?.('Reservasi diperbarui');
      } else {
        data.id = genId?.();
        data.createdAt = Date.now();
        data.thankYouSent = false;

        addReservation?.(data);
        showToast?.('Reservasi ditambahkan 🎉');
      }

      closeModal?.('modal-reservation');

      Calendar?.render?.();

    } catch (e) {
      console.error('[SaveReservation]', e);
      showToast?.('Gagal menyimpan', 'error');
    }
  }


  /* ============================================================
  EXPORT
  ============================================================ */

  return {
    showView: Router.show,
    selectDate,
    backToCalendar,
    saveReservation // 🔥 FIX WAJIB
  };

})();