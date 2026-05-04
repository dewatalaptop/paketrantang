'use strict';

/* ============================================================
CALENDAR.UI.JS — PROSERVA CORE (FINAL STABLE)
Modular • Safe • App.controller compatible
============================================================ */

window.Calendar = (function () {

  /* ============================================================
  1. MAIN RENDER
  ============================================================ */

  function render () {
    try {
      if (!window.state) return;

      const year  = state.currentYear;
      const month = state.currentMonth;

      renderHeader(year, month);
      renderGrid(year, month);

    } catch (e) {
      console.error('[Calendar.render]', e);
    }
  }


  /* ============================================================
  2. HEADER
  ============================================================ */

  function renderHeader (year, month) {
    const label = $('cal-month-label');
    if (label) {
      label.textContent = formatMonthYearSafe(year, month);
    }
  }


  /* ============================================================
  3. NAVIGATION
  ============================================================ */

  function prevMonth () {
    state.currentMonth--;

    if (state.currentMonth < 0) {
      state.currentMonth = 11;
      state.currentYear--;
    }

    render();
  }

  function nextMonth () {
    state.currentMonth++;

    if (state.currentMonth > 11) {
      state.currentMonth = 0;
      state.currentYear++;
    }

    render();
  }

  function goToday () {
    const now = new Date();

    state.currentYear  = now.getFullYear();
    state.currentMonth = now.getMonth();

    render();
  }


  /* ============================================================
  4. GRID
  ============================================================ */

  function renderGrid (year, month) {

    const grid = $('cal-days'); // ✅ FIXED
    if (!grid) return;

    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayStr?.();

    // empty cells
    for (let i = 0; i < firstDay; i++) {
      grid.appendChild(createEmptyCell());
    }

    // days
    for (let d = 1; d <= daysInMonth; d++) {

      const dateStr = buildDateStr(year, month + 1, d);

      let resList = [];
      try {
        resList = getResForDate?.(dateStr) || [];
      } catch (e) {}

      grid.appendChild(
        createDayCell(d, dateStr, resList, today)
      );
    }
  }


  /* ============================================================
  5. CELL
  ============================================================ */

  function createEmptyCell () {
    const div = document.createElement('div');
    div.className = 'cal-day empty';
    return div;
  }

  function createDayCell (day, dateStr, reservations, today) {

    const div = document.createElement('div');
    div.className = 'cal-day';

    if (dateStr === today) {
      div.classList.add('today');
    }

    div.onclick = () => window.selectDate?.(dateStr);

    // number
    const num = document.createElement('div');
    num.className = 'cal-day-num';
    num.textContent = day;
    div.appendChild(num);

    if (reservations.length > 0) {

      // pill
      const pill = document.createElement('div');
      pill.className = 'cal-res-pill';
      pill.innerHTML = `<i class="fas fa-users"></i> ${reservations.length}`;
      div.appendChild(pill);

      // names
      const wrap = document.createElement('div');
      wrap.className = 'cal-mini-names';

      reservations
        .slice(0, 3)
        .forEach(r => {
          const name = document.createElement('div');
          name.className = 'cal-mini-name';
          name.textContent = r.nama;
          wrap.appendChild(name);
        });

      div.appendChild(wrap);
    }

    return div;
  }


  /* ============================================================
  6. DETAIL VIEW
  ============================================================ */

  function renderDetailList (list) {

    const container = $('detail-list');
    if (!container) return;

    container.innerHTML = '';

    if (!list || list.length === 0) {
      container.innerHTML = emptyState();
      return;
    }

    // sort by time
    list.sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));

    list.forEach(r => {
      container.appendChild(createCard(r));
    });
  }


  /* ============================================================
  7. CARD
  ============================================================ */

  function createCard (r) {

    const div = document.createElement('div');
    div.className = 'res-card';

    div.innerHTML = `
      <div class="rc-top">
        <div class="rc-name">
          <div class="rc-avatar">${initial(r.nama)}</div>
          ${r.nama}
        </div>

        <div class="rc-badges">
          <span class="badge badge-orange">${r.jam}</span>
          <span class="badge badge-gray">${r.tempat}</span>
          <span class="badge badge-blue">${r.jumlah} org</span>
        </div>
      </div>

      <div class="rc-body">

        ${
          r.menus?.length
            ? `
          <div class="rc-section-title">Pesanan</div>
          ${r.menus.map(m => `
            <div class="rc-menu-item">
              ${m.quantity}x ${m.name}
            </div>
          `).join('')}
        `
            : ''
        }

        ${r.tambahan ? `<div class="rc-menu-sub">${r.tambahan}</div>` : ''}

      </div>

      <div class="rc-footer">

        <button class="btn-success-soft"
          onclick="handleSendConfirmation('${r.id}')">
          <i class="fab fa-whatsapp"></i>
        </button>

        <button class="btn-info-soft"
          onclick="handleSendThankYou('${r.id}')">
          <i class="fas fa-heart"></i>
        </button>

        <button class="btn-danger-soft"
          onclick="handleDeleteReservation('${r.id}')">
          <i class="fas fa-trash"></i>
        </button>

      </div>
    `;

    return div;
  }


  /* ============================================================
  8. HELPERS
  ============================================================ */

  function initial (name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function emptyState () {
    return `
      <div class="empty-state">
        <div class="es-icon">
          <i class="fas fa-calendar-check"></i>
        </div>
        <div class="es-title">Belum ada reservasi</div>
      </div>
    `;
  }

  function formatMonthYearSafe (year, month) {
    try {
      return MONTHS_ID[month] + ' ' + year;
    } catch {
      return `${month + 1}/${year}`;
    }
  }


  /* ============================================================
  EXPORT
  ============================================================ */

  return {
    render,
    prevMonth,
    nextMonth,
    goToday,
    renderDetailList
  };

})();


/* ============================================================
GLOBAL BINDING
============================================================ */

window.prevMonth = Calendar.prevMonth;
window.nextMonth = Calendar.nextMonth;
window.goToday   = Calendar.goToday;
window.renderDetailList = Calendar.renderDetailList;


/* ============================================================
SAFE GUARD
============================================================ */

(function () {
  try {
    if (!window.getResForDate) {
      console.warn('[Calendar] reservation.data.js belum load');
    }
  } catch (e) {
    console.error('[Calendar] Init error:', e);
  }
})();