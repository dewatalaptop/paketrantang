'use strict';

/* ============================================================
APP.CONTROLLER.JS — PROSERVA CORE (FINAL STABLE + COMPLETE)
Fix Wizard Step 2 + Step 3 (Lokasi & Menu)
============================================================ */

const App = (function () {

  /* ============================================================
  1. BOOT
  ============================================================ */

  function boot () {
    try {

      document.body.classList.add('has-banner');

      TRIAL?.checkAndEnforce?.();

      const isSetup = DB?.get?.(KEYS.SETUP_DONE);

      toggleSetup(!isSetup);

      initGlobalUI();

      if (isSetup) initApp();

      TRIAL?.startTicker?.();

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
  6. WIZARD (🔥 FULL FIX)
  ============================================================ */

  function initWizard () {

    const inputName = $('wz-biz-name');

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


    /* ---------- STEP 2 (LOKASI) ---------- */

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


    /* ---------- STEP 3 (🔥 MENU FIX) ---------- */

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


    /* ---------- NAV ---------- */

    $('btn-wizard-next-2')?.addEventListener('click', () => {
      goStep(3);
      renderWizardMenus();
    });

    $('btn-wizard-back-1')?.addEventListener('click', () => goStep(1));
    $('btn-wizard-back-2')?.addEventListener('click', () => goStep(2));

    $('btn-wizard-finish')?.addEventListener('click', finishSetup);
  }


  /* ============================================================
  7. WIZARD RENDER
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
        <span>${menu.name} - Rp${formatRupiah(menu.price)}</span>
        <button onclick="removeWizardMenu('${menu.id}')">
          <i class="fas fa-trash"></i>
        </button>
      `;

      container.appendChild(div);
    });
  }


  /* ============================================================
  8. REMOVE HANDLERS
  ============================================================ */

  window.removeWizardLocation = function (id) {
    state.locations = state.locations.filter(l => l.id !== id);
    renderWizardLocations();
  };

  window.removeWizardMenu = function (id) {
    state.menus = state.menus.filter(m => m.id !== id);
    renderWizardMenus();
  };


  /* ============================================================
  9. STEP CONTROL
  ============================================================ */

  function goStep (step) {
    document.querySelectorAll('.wizard-step')
      .forEach(el => el.classList.remove('active'));

    $('wizard-' + step)?.classList.add('active');
  }


  /* ============================================================
  10. FINISH
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
  11. GLOBAL INIT
  ============================================================ */

  function initGlobalUI () {
    initModalOverlayClose?.();
    initKeyboardShortcuts?.();
    initSidebarOverlay?.();

    initWizard();
    initNav();
    initTopbar();
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
  12. HELPERS
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