'use strict';

/* ============================================================
APP.CONTROLLER.JS — PROSERVA CORE FINAL REWRITE
PART 1 / 4
Boot • Lifecycle • Router • State Safety
Compatible with:
- ui.helpers.js
- state.js
- storage.js
============================================================ */

/* ============================================================
1. APP MODULE
============================================================ */

const App = (function () {

  /* ============================================================
  2. INTERNAL STATE
  ============================================================ */

  const APP_STATE = {

    booted: false,

    initialized: false,

    currentView: null,

    calendarBound: false,

    wizardBound: false
    
    globalBound: false,
  };

  /* ============================================================
  3. BOOT
  ============================================================ */

  function boot() {

    try {

      if (APP_STATE.booted) {

        console.warn(
          '[APP] already booted'
        );

        return true;
      }

      APP_STATE.booted = true;

      console.log(
        '[APP] booting...'
      );

      safeBodyInit();

      initGlobalUI?.();

      loadStateSafe();

      initCoreModules();

      const isSetup =
        DB?.get?.(
          KEYS.SETUP_DONE,
          false
        );

      toggleSetup(!isSetup);

      if (isSetup) {

        initApp();

      } else {

        initWizard?.();

      }

      /* =========================
         SAFE TRIAL START
      ========================= */

      if (
        typeof window.TRIAL !==
        'undefined'
      ) {

        window.TRIAL
          ?.checkAndEnforce?.();

        window.TRIAL
          ?.startTicker?.();
      }

      console.log(
        '[APP] boot success'
      );

      return true;

    } catch (err) {

      console.error(
        '[BOOT ERROR]',
        err
      );

      alert(
        'Terjadi error saat memulai aplikasi'
      );

      return false;
    }
  }

  /* ============================================================
  4. SAFE BODY INIT
  ============================================================ */

  function safeBodyInit() {

    try {

      if (!document.body) {
        return;
      }

      document.body.classList.add(
        'has-banner'
      );

    } catch (e) {

      console.warn(
        '[BODY INIT ERROR]',
        e
      );

    }
  }

  /* ============================================================
  5. CORE MODULE INIT
  ============================================================ */

  function initCoreModules() {

    try {

      initCalendarControls?.();

    } catch (e) {

      console.warn(
        '[CalendarControl INIT ERROR]',
        e
      );

    }

  }

  /* ============================================================
  6. SETUP TOGGLE
  ============================================================ */

  function toggleSetup(showSetup) {

    const wizard =
      $('setup-wizard');

    const shell =
      $('app-shell');

    if (!wizard || !shell) {

      console.warn(
        '[toggleSetup] element missing'
      );

      return false;
    }

    wizard.style.display =
      showSetup
        ? 'block'
        : 'none';

    shell.style.display =
      showSetup
        ? 'none'
        : 'block';

    return true;
  }

  /* ============================================================
  7. INIT APP
  ============================================================ */

  function initApp() {

    try {

      if (APP_STATE.initialized) {

        console.warn(
          '[APP] already initialized'
        );

        return true;
      }

      APP_STATE.initialized = true;

      normalizeAppState();

      renderHeader();

      Router.show('calendar');

      NOTIFICATION?.start?.();

      console.log(
        '[APP] initialized'
      );

      return true;

    } catch (err) {

      console.error(
        '[INIT ERROR]',
        err
      );

      return false;
    }
  }

  /* ============================================================
  8. LOAD STATE SAFE
  ============================================================ */

  function loadStateSafe() {

    try {

      loadState?.();

      if (!window.state) {

        window.state = {};

      }

      normalizeAppState();

      return true;

    } catch (e) {

      console.warn(
        '[STATE FALLBACK]',
        e
      );

      window.state = {

        biz: {
          name: 'Usaha Saya',
          type: 'restoran'
        },

        menus: [],

        locations: [],

        reservations: {},

        selectedDate: null
      };

      return false;
    }
  }

  /* ============================================================
  9. NORMALIZE APP STATE
  ============================================================ */

  function normalizeAppState() {

    if (!window.state) {

      window.state = {};

    }

    /* =========================
       BIZ
    ========================= */

    state.biz =
      safeObject(state.biz);

    state.biz.name =
      state.biz.name ||
      'Usaha Saya';

    state.biz.type =
      state.biz.type ||
      'restoran';

    /* =========================
       MENUS
    ========================= */

    state.menus =
      safeArray(state.menus);

    /* =========================
       LOCATIONS
    ========================= */

    state.locations =
      safeArray(state.locations);

    /* =========================
       RESERVATIONS
    ========================= */

    if (
      !state.reservations ||
      typeof state.reservations !==
      'object'
    ) {

      state.reservations = {};
    }

    /* =========================
       SELECTED DATE
    ========================= */

    state.selectedDate =
      state.selectedDate || null;
  }

  /* ============================================================
  10. HEADER RENDER
  ============================================================ */

  function renderHeader() {

    const bizName =
      state?.biz?.name ||
      'Usaha Saya';

    setTextSafe(
      'cal-biz-name',
      bizName
    );

    setTextSafe(
      'sidebar-biz-name',
      bizName
    );
  }

  /* ============================================================
  11. ROUTER
  ============================================================ */

  const Router = {

    show(name) {

      try {

        if (!name) {

          console.warn(
            '[Router] invalid view'
          );

          return false;
        }

        APP_STATE.currentView =
          name;

        /* =====================
           HIDE ALL
        ===================== */

        document
          .querySelectorAll(
            '#content .view'
          )
          .forEach(function (view) {

            view.style.display =
              'none';

            view.classList.remove(
              'active-view'
            );

          });

        /* =====================
           SHOW TARGET
        ===================== */

        const target =
          $('view-' + name);

        if (!target) {

          console.warn(
            '[Router] view not found:',
            name
          );

          return false;
        }

        target.style.display =
          'block';

        target.classList.add(
          'active-view'
        );

        /* =====================
           NAV ACTIVE
        ===================== */

        document
          .querySelectorAll(
            '.nav-item'
          )
          .forEach(function (nav) {

            nav.classList.toggle(
              'active',
              nav.dataset.view ===
              name
            );

          });

        handleViewInit(name);

        return true;

      } catch (e) {

        console.error(
          '[ROUTER ERROR]',
          e
        );

        return false;
      }
    }
  };

  /* ============================================================
  12. VIEW INITIALIZER
  ============================================================ */

  function handleViewInit(name) {

    try {

      switch (name) {

        case 'calendar':

          window.Calendar
            ?.render?.();

          break;

        case 'customers':

          window.Customers
            ?.render?.();

          break;

        case 'analysis':

          window.Analysis
            ?.init?.();

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

        case 'detail':

          if (
            state.selectedDate
          ) {

            renderDetailList?.(
              getResForDate?.(
                state.selectedDate
              ) || []
            );

          }

          break;
      }

    } catch (e) {

      console.error(
        '[VIEW INIT ERROR]',
        name,
        e
      );

    }
  }
    /* ============================================================
  13. CALENDAR FLOW
  ============================================================ */

  function selectDate(dateStr) {

    try {

      if (!dateStr) {

        console.warn(
          '[selectDate] invalid date'
        );

        return false;
      }

      state.selectedDate =
        dateStr;

      setTextSafe(
        'detail-title',
        formatDateDisplay?.(
          dateStr
        ) || dateStr
      );

      Router.show('detail');

      try {

        renderDetailList?.(
          getResForDate?.(
            dateStr
          ) || []
        );

      } catch (e) {

        console.error(
          '[DETAIL RENDER ERROR]',
          e
        );

      }

      scrollTopSmooth?.();

      return true;

    } catch (e) {

      console.error(
        '[SELECT DATE ERROR]',
        e
      );

      return false;
    }
  }

  function backToCalendar() {

    try {

      state.selectedDate =
        null;

      Router.show('calendar');

      return true;

    } catch (e) {

      console.error(
        '[BACK CALENDAR ERROR]',
        e
      );

      return false;
    }
  }

  /* ============================================================
  14. CALENDAR CONTROLS
  🔥 ANTI DUPLICATE BIND
  ============================================================ */

  function initCalendarControls() {

    try {

      if (
        APP_STATE.calendarBound
      ) {

        return true;
      }

      APP_STATE.calendarBound =
        true;

      const prev =
        $('btn-prev-month');

      const next =
        $('btn-next-month');

      const today =
        $('btn-today');

      if (
        !prev &&
        !next &&
        !today
      ) {

        console.warn(
          '[CalendarControls] tombol tidak ditemukan'
        );

        return false;
      }

      bindClick(
        'btn-prev-month',
        function () {

          window.Calendar
            ?.prevMonth?.();

        }
      );

      bindClick(
        'btn-next-month',
        function () {

          window.Calendar
            ?.nextMonth?.();

        }
      );

      bindClick(
        'btn-today',
        function () {

          window.Calendar
            ?.goToday?.();

        }
      );

      return true;

    } catch (e) {

      console.error(
        '[CALENDAR CONTROL ERROR]',
        e
      );

      return false;
    }
  }

  /* ============================================================
  15. WIZARD INIT
  🔥 FULL HARDENED
  ============================================================ */

  function initWizard() {

    try {

      if (
        APP_STATE.wizardBound
      ) {

        return true;
      }

      APP_STATE.wizardBound =
        true;

      normalizeAppState();

      const inputName =
        $('wz-biz-name');

      /* =========================
         BIZ INPUT
      ========================= */

      if (inputName) {

        if (
          inputName.dataset.bound !==
          '1'
        ) {

          inputName.dataset.bound =
            '1';

          inputName.addEventListener(
            'input',
            function () {

              inputName.classList.remove(
                'error'
              );

            }
          );

        }

      }

      /* =========================
         STEP 1
      ========================= */

      bindClick(
        'btn-wizard-next-1',
        function () {

          const name =
            inputName
              ?.value
              ?.trim();

          if (!name) {

            inputName?.classList.add(
              'error'
            );

            inputName?.focus?.();

            return;
          }

          state.biz.name =
            name;

          goStep?.(2);

          renderWizardLocations?.();

        }
      );

      /* =========================
         ADD LOCATION
      ========================= */

      bindClick(
        'btn-add-location',
        function () {

          const locName =
            $('wz-loc-name')
              ?.value
              ?.trim();

          const cap =
            parseInt(
              $('wz-loc-cap')
                ?.value,
              10
            );

          if (!locName) {

            alert(
              'Nama lokasi wajib'
            );

            return;
          }

          if (
            !cap ||
            cap < 1
          ) {

            alert(
              'Kapasitas minimal 1'
            );

            return;
          }

          state.locations.push({

            id:
              genId?.(),

            name:
              locName,

            capacity:
              cap
          });

          const locInput =
            $('wz-loc-name');

          const capInput =
            $('wz-loc-cap');

          if (locInput) {
            locInput.value = '';
          }

          if (capInput) {
            capInput.value = '';
          }

          renderWizardLocations?.();

        }
      );

      /* =========================
         ADD MENU
      ========================= */

      bindClick(
        'btn-add-menu',
        function () {

          const menuName =
            $('wz-menu-name')
              ?.value
              ?.trim();

          const price =
            parseInt(
              $('wz-menu-price')
                ?.value,
              10
            );

          const detail =
            $('wz-menu-detail')
              ?.value
              ?.trim();

          if (!menuName) {

            alert(
              'Nama menu wajib'
            );

            return;
          }

          if (
            !price ||
            price <= 0
          ) {

            alert(
              'Harga tidak valid'
            );

            return;
          }

          state.menus.push({

            id:
              genId?.(),

            name:
              menuName,

            price:
              price,

            details:
              detail
                ? [detail]
                : []
          });

          const menuInput =
            $('wz-menu-name');

          const priceInput =
            $('wz-menu-price');

          const detailInput =
            $('wz-menu-detail');

          if (menuInput) {
            menuInput.value = '';
          }

          if (priceInput) {
            priceInput.value = '';
          }

          if (detailInput) {
            detailInput.value = '';
          }

          renderWizardMenus?.();

        }
      );

      /* =========================
         STEP NAVIGATION
      ========================= */

      bindClick(
        'btn-wizard-next-2',
        function () {

          goStep?.(3);

          renderWizardMenus?.();

        }
      );

      bindClick(
        'btn-wizard-back-1',
        function () {

          goStep?.(1);

        }
      );

      bindClick(
        'btn-wizard-back-2',
        function () {

          goStep?.(2);

        }
      );

      /* =========================
         FINISH
      ========================= */

      bindClick(
        'btn-wizard-finish',
        finishSetup
      );

      return true;

    } catch (e) {

      console.error(
        '[WIZARD INIT ERROR]',
        e
      );

      return false;
    }
  }

  /* ============================================================
  16. FORM COLLECTOR
  🔥 ANTI NULL / LEGACY BUG
  ============================================================ */

  function collectReservationForm() {

    try {

      return {

        id:
          $('res-edit-id')
            ?.value || null,

        date:
          state.selectedDate ||
          todayStr?.(),

        nama:
          $('res-nama')
            ?.value
            ?.trim() || '',

        nomorHp:
          normalizePhone?.(
            $('res-hp')
              ?.value
          ) || '',

        jam:
          $('res-jam')
            ?.value || '',

        jumlah:
          parseInt(
            $('res-jumlah')
              ?.value,
            10
          ) || 1,

        tempat:
          $('res-tempat')
            ?.value || '',

        dp:
          parseInt(
            $('res-dp')
              ?.value,
            10
          ) || 0,

        tipeDp:
          $('res-tipe-dp')
            ?.value || '',

        tambahan:
          $('res-tambahan')
            ?.value
            ?.trim() || '',

        menus:
          collectSelectedMenus()
      };

    } catch (e) {

      console.error(
        '[FORM COLLECT ERROR]',
        e
      );

      return null;
    }
  }

  /* ============================================================
  17. SELECTED MENUS
  ============================================================ */

  function collectSelectedMenus() {

    try {

      const menus = [];

      document
        .querySelectorAll(
          '[data-menu-id]'
        )
        .forEach(function (cb) {

          if (!cb.checked) {
            return;
          }

          const id =
            cb.dataset.menuId;

          const menu =
            state.menus.find(
              function (m) {

                return (
                  m.id === id
                );

              }
            );

          if (!menu) {
            return;
          }

          menus.push({

            id:
              menu.id,

            name:
              menu.name,

            quantity: 1
          });

        });

      return menus;

    } catch (e) {

      console.error(
        '[MENU COLLECT ERROR]',
        e
      );

      return [];
    }
  }
    /* ============================================================
  18. VALIDATION
  🔥 ANTI SILENT FAIL
  ============================================================ */

  function validateReservationForm(data) {

    try {

      let valid = true;

      clearFormErrors?.();

      /* =========================
         NAMA
      ========================= */

      if (!data.nama) {

        showFieldError?.(
          'err-nama',
          'Nama wajib diisi'
        );

        valid = false;
      }

      /* =========================
         JAM
      ========================= */

      if (!data.jam) {

        showFieldError?.(
          'err-jam',
          'Jam wajib diisi'
        );

        valid = false;
      }

      /* =========================
         JUMLAH
      ========================= */

      if (
        !data.jumlah ||
        data.jumlah < 1
      ) {

        showFieldError?.(
          'err-jumlah',
          'Minimal 1 orang'
        );

        valid = false;
      }

      /* =========================
         TEMPAT
      ========================= */

      if (!data.tempat) {

        showFieldError?.(
          'err-tempat',
          'Pilih lokasi'
        );

        valid = false;
      }

      /* =========================
         RESULT
      ========================= */

      if (!valid) {

        console.warn(
          '[VALIDATION FAILED]',
          data
        );

      }

      return valid;

    } catch (e) {

      console.error(
        '[VALIDATION ERROR]',
        e
      );

      return false;
    }
  }

  /* ============================================================
  19. SAVE RESERVATION
  🔥 CORE SAVE ENGINE
  ============================================================ */

  function saveReservation() {

    try {

      const data =
        collectReservationForm?.();

      if (!data) {

        console.error(
          '[SAVE] form kosong'
        );

        showToast?.(
          'Form tidak valid',
          'error'
        );

        return false;
      }

      if (
        !validateReservationForm(
          data
        )
      ) {

        return false;
      }

      let success =
        false;

      /* =========================
         UPDATE MODE
      ========================= */

      if (data.id) {

        success =
          updateReservation?.(
            data
          );

        if (success) {

          showToast?.(
            'Reservasi diperbarui'
          );

        }

      } else {

        /* =========================
           CREATE MODE
        ========================= */

        data.id =
          genId?.();

        data.createdAt =
          Date.now();

        data.thankYouSent =
          false;

        success =
          addReservation?.(
            data
          );

        if (success) {

          showToast?.(
            'Reservasi ditambahkan 🎉'
          );

        }
      }

      /* =========================
         SAVE FAILED
      ========================= */

      if (!success) {

        showToast?.(
          'Gagal menyimpan data',
          'error'
        );

        return false;
      }

      /* =========================
         CLOSE MODAL
      ========================= */

      closeModal?.(
        'modal-reservation'
      );

      refreshAfterSave();

      return true;

    } catch (e) {

      console.error(
        '[SAVE ERROR]',
        e
      );

      showToast?.(
        'Terjadi error saat menyimpan',
        'error'
      );

      return false;
    }
  }

  /* ============================================================
  20. REFRESH UI
  🔥 ANTI STALE VIEW
  ============================================================ */

  function refreshAfterSave() {

    try {

      /* =========================
         CALENDAR
      ========================= */

      window.Calendar
        ?.render?.();

      /* =========================
         DETAIL VIEW
      ========================= */

      if (
        window.state
          ?.selectedDate
      ) {

        renderDetailList?.(
          getResForDate?.(
            state.selectedDate
          ) || []
        );

      }

      /* =========================
         TABLES
      ========================= */

      renderMenusTable?.();

      renderLocationsTable?.();

      return true;

    } catch (e) {

      console.error(
        '[REFRESH ERROR]',
        e
      );

      return false;
    }
  }

  /* ============================================================
  21. DELETE HANDLER
  ============================================================ */

  function handleDeleteReservation(id) {

    try {

      if (
        !confirmAction?.(
          'Hapus reservasi ini?'
        )
      ) {

        return false;
      }

      const ok =
        deleteReservation?.(
          id
        );

      if (!ok) {

        showToast?.(
          'Gagal menghapus',
          'error'
        );

        return false;
      }

      showToast?.(
        'Reservasi dihapus',
        'info'
      );

      refreshAfterSave();

      return true;

    } catch (e) {

      console.error(
        '[DELETE ERROR]',
        e
      );

      return false;
    }
  }

  /* ============================================================
  22. WHATSAPP HANDLER
  ============================================================ */

  function handleSendConfirmation(id) {

    try {

      const sent =
        sendConfirmation?.(
          id
        );

      if (!sent) {

        showToast?.(
          'Nomor tidak tersedia',
          'error'
        );

        return false;
      }

      return true;

    } catch (e) {

      console.error(
        '[WA CONFIRM ERROR]',
        e
      );

      return false;
    }
  }

  function handleSendThankYou(id) {

    try {

      const sent =
        sendThankYou?.(
          id
        );

      if (!sent) {

        showToast?.(
          'Gagal kirim',
          'error'
        );

        return false;
      }

      showToast?.(
        'Ucapan terkirim 🎉'
      );

      return true;

    } catch (e) {

      console.error(
        '[WA THANKYOU ERROR]',
        e
      );

      return false;
    }
  }

  /* ============================================================
  23. GLOBAL BINDING
  🔥 SAFE SINGLE BIND
  ============================================================ */

  function bindGlobalActions() {

    try {

      if (
        APP_STATE.globalBound
      ) {

        return true;
      }

      APP_STATE.globalBound =
        true;

      bindClick(
        'btn-save-res',
        saveReservation
      );

      return true;

    } catch (e) {

      console.error(
        '[GLOBAL BIND ERROR]',
        e
      );

      return false;
    }
  }

  /* ============================================================
  24. START INITIALIZERS
  ============================================================ */

  bindGlobalActions();

  /* ============================================================
  25. EXPORT PUBLIC API
  ============================================================ */

  return {

  boot,

  initApp,

  toggleSetup,

  renderHeader,

  showView:
    Router.show,

  selectDate,

  backToCalendar,

  saveReservation,

  refreshAfterSave,

  collectReservationForm,

  validateReservationForm,

  handleDeleteReservation,

  handleSendConfirmation,

  handleSendThankYou
};

})();

window.App = App;

/* ============================================================
26. GLOBAL HANDLERS
🔥 LEGACY COMPATIBILITY
============================================================ */

window.saveReservation =
  App.saveReservation;

window.handleDeleteReservation =
  App.handleDeleteReservation;

window.handleSendConfirmation =
  App.handleSendConfirmation;

window.handleSendThankYou =
  App.handleSendThankYou;

/* ============================================================
27. STATE NORMALIZATION
🔥 ANTI LEGACY BUG
============================================================ */

(function normalizeStateDeep() {

  try {

    if (!window.state) {
      return;
    }

    /* =========================
       LOCATIONS
    ========================= */

    if (
      !Array.isArray(
        state.locations
      )
    ) {

      state.locations =
        Object.values(
          state.locations || {}
        );

    }

    /* =========================
       MENUS
    ========================= */

    if (
      !Array.isArray(
        state.menus
      )
    ) {

      state.menus =
        Object.values(
          state.menus || {}
        );

    }

    /* =========================
       RESERVATIONS
    ========================= */

    if (
      !state.reservations ||
      typeof state.reservations !==
        'object'
    ) {

      state.reservations = {};

    }

  } catch (e) {

    console.warn(
      '[STATE NORMALIZE ERROR]',
      e
    );

  }

})();
'use strict';

/* ============================================================
APP.CONTROLLER.JS — PART 4 / 4
Wizard Renderer • Setup Finish • Final Hardening
============================================================ */

/* ============================================================
28. WIZARD LOCATION RENDER
============================================================ */

function renderWizardLocations() {

  try {

    const container =
      $('wizard-location-list');

    if (!container) {

      console.warn(
        '[Wizard] location container tidak ditemukan'
      );

      return false;
    }

    const locations =
      safeArray(
        window.state?.locations
      );

    /* =========================
       EMPTY STATE
    ========================= */

    if (!locations.length) {

      container.innerHTML = `
        <div class="empty">
          Belum ada lokasi ditambahkan
        </div>
      `;

      return true;
    }

    /* =========================
       RENDER LIST
    ========================= */

    container.innerHTML = '';

    locations.forEach(
      function (loc, index) {

        const item =
          document.createElement(
            'div'
          );

        item.className =
          'wizard-item';

        item.innerHTML = `
          <div class="wizard-item-content">

            <div class="wizard-item-title">
              ${escapeHtml(loc.name || 'Tanpa Nama')}
            </div>

            <div class="wizard-item-sub">
              Kapasitas:
              ${Number(loc.capacity || 0)}
              orang
            </div>

          </div>

          <button
            class="btn-delete-mini"
            data-wz-loc-delete="${escapeHtml(loc.id || '')}"
          >
            Hapus
          </button>
        `;

        container.appendChild(
          item
        );

      }
    );

    /* =========================
       DELETE BIND
    ========================= */

    container
      .querySelectorAll(
        '[data-wz-loc-delete]'
      )
      .forEach(function (btn) {

        btn.onclick =
          function () {

            const id =
              btn.dataset
                .wzLocDelete;

            state.locations =
              safeArray(
                state.locations
              ).filter(
                function (loc) {

                  return (
                    loc.id !== id
                  );

                }
              );

            renderWizardLocations();

          };

      });

    return true;

  } catch (e) {

    console.error(
      '[Wizard Location ERROR]',
      e
    );

    return false;
  }
}

/* ============================================================
29. WIZARD MENU RENDER
============================================================ */

function renderWizardMenus() {

  try {

    const container =
      $('wizard-menu-list');

    if (!container) {

      console.warn(
        '[Wizard] menu container tidak ditemukan'
      );

      return false;
    }

    const menus =
      safeArray(
        window.state?.menus
      );

    /* =========================
       EMPTY STATE
    ========================= */

    if (!menus.length) {

      container.innerHTML = `
        <div class="empty">
          Belum ada menu ditambahkan
        </div>
      `;

      return true;
    }

    /* =========================
       RENDER MENU
    ========================= */

    container.innerHTML = '';

    menus.forEach(
      function (menu) {

        const item =
          document.createElement(
            'div'
          );

        item.className =
          'wizard-item';

        item.innerHTML = `
          <div class="wizard-item-content">

            <div class="wizard-item-title">
              ${escapeHtml(menu.name || 'Tanpa Nama')}
            </div>

            <div class="wizard-item-sub">
              Rp${Number(menu.price || 0).toLocaleString('id-ID')}
            </div>

          </div>

          <button
            class="btn-delete-mini"
            data-wz-menu-delete="${escapeHtml(menu.id || '')}"
          >
            Hapus
          </button>
        `;

        container.appendChild(
          item
        );

      }
    );

    /* =========================
       DELETE BIND
    ========================= */

    container
      .querySelectorAll(
        '[data-wz-menu-delete]'
      )
      .forEach(function (btn) {

        btn.onclick =
          function () {

            const id =
              btn.dataset
                .wzMenuDelete;

            state.menus =
              safeArray(
                state.menus
              ).filter(
                function (menu) {

                  return (
                    menu.id !== id
                  );

                }
              );

            renderWizardMenus();

          };

      });

    return true;

  } catch (e) {

    console.error(
      '[Wizard Menu ERROR]',
      e
    );

    return false;
  }
}

/* ============================================================
30. WIZARD STEP CONTROL
============================================================ */

function goStep(step) {

  try {

    document
      .querySelectorAll(
        '.wizard-step'
      )
      .forEach(function (el) {

        el.style.display =
          'none';

      });

    const target =
      $(
        'wizard-step-' + step
      );

    if (!target) {

      console.warn(
        '[Wizard] step tidak ditemukan:',
        step
      );

      return false;
    }

    target.style.display =
      'block';

    scrollTopSmooth?.();

    return true;

  } catch (e) {

    console.error(
      '[Wizard Step ERROR]',
      e
    );

    return false;
  }
}

/* ============================================================
31. FINISH SETUP
🔥 CRITICAL FLOW
============================================================ */

function finishSetup() {

  try {

    const bizName =
      $('wz-biz-name')
        ?.value
        ?.trim();

    if (!bizName) {

      showToast?.(
        'Nama usaha wajib diisi',
        'error'
      );

      goStep?.(1);

      return false;
    }

    /* =========================
       SAVE BIZ
    ========================= */

    state.biz = {

      name: bizName,

      type: 'restoran'
    };

    /* =========================
       ENSURE SAFE ARRAY
    ========================= */

    state.locations =
      safeArray(
        state.locations
      );

    state.menus =
      safeArray(
        state.menus
      );

    /* =========================
       SAVE ALL
    ========================= */

    persistAll?.();

    DB?.set?.(
      KEYS.SETUP_DONE,
      true
    );

    /* =========================
       UI TRANSITION
    ========================= */

    App?.toggleSetup?.(false);

    App?.renderHeader?.();

    App?.toggleSetup?.(false);

App?.renderHeader?.();

App?.showView?.('calendar');

window.Calendar?.render?.();

NOTIFICATION?.start?.();

    window.Calendar
      ?.render?.();

    showToast?.(
      'Setup berhasil 🎉'
    );

    return true;

  } catch (e) {

    console.error(
      '[FINISH SETUP ERROR]',
      e
    );

    showToast?.(
      'Terjadi error saat setup',
      'error'
    );

    return false;
  }
}

/* ============================================================
32. FINAL SAFE BOOT CHECK
============================================================ */

(function finalControllerGuard() {

  try {

    console.log(
      '[APP] controller loaded'
    );

    /* =========================
       REQUIRED CHECK
    ========================= */

    if (!window.DB) {

      console.warn(
        '[APP] DB belum tersedia'
      );

    }

    if (!window.state) {

      console.warn(
        '[APP] state belum tersedia'
      );

    }

    if (!window.UI) {

      console.warn(
        '[APP] UI belum tersedia'
      );

    }

    /* =========================
       SAFE APP EXPORT
    ========================= */

    if (!window.App) {

      console.warn(
        '[APP] App export gagal'
      );

    }

  } catch (e) {

    console.error(
      '[APP FINAL GUARD ERROR]',
      e
    );

  }

})();