'use strict';

/* ============================================================
CALENDAR.UI.JS — PROSERVA CORE
Calendar Rendering + Interaction Engine
============================================================ */

/* ============================================================
1. RENDER CALENDAR
============================================================ */

function renderCalendar () {
  if (!window.state) return;

  var year  = state.currentYear;
  var month = state.currentMonth;

  renderCalendarHeader(year, month);
  renderCalendarGrid(year, month);
}

/* ============================================================
2. HEADER (MONTH NAVIGATION)
============================================================ */

function renderCalendarHeader (year, month) {
  var label = $('cal-month-label');
  if (label) {
    label.textContent = formatMonthYear(year, month);
  }
}

/**
 * Prev month
 */
function prevMonth () {
  state.currentMonth--;

  if (state.currentMonth < 0) {
    state.currentMonth = 11;
    state.currentYear--;
  }

  renderCalendar();
}

/**
 * Next month
 */
function nextMonth () {
  state.currentMonth++;

  if (state.currentMonth > 11) {
    state.currentMonth = 0;
    state.currentYear++;
  }

  renderCalendar();
}

/**
 * Back to today
 */
function goToday () {
  var now = new Date();

  state.currentYear  = now.getFullYear();
  state.currentMonth = now.getMonth();

  renderCalendar();
}

/* ============================================================
3. GRID RENDER
============================================================ */

function renderCalendarGrid (year, month) {
  var grid = $('cal-grid');
  if (!grid) return;

  grid.innerHTML = '';

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month + 1, 0).getDate();

  var today = todayStr();

  /* === EMPTY CELLS (leading) === */
  for (var i = 0; i < firstDay; i++) {
    grid.appendChild(createEmptyCell());
  }

  /* === DAYS === */
  for (var d = 1; d <= daysInMonth; d++) {

    var dateStr = buildDateStr(year, month + 1, d);
    var resList = getResForDate(dateStr);

    var cell = createDayCell(d, dateStr, resList, today);

    grid.appendChild(cell);
  }
}

/* ============================================================
4. CELL BUILDERS
============================================================ */

function createEmptyCell () {
  var div = document.createElement('div');
  div.className = 'cal-day empty';
  return div;
}

function createDayCell (day, dateStr, reservations, today) {

  var div = document.createElement('div');
  div.className = 'cal-day';

  if (dateStr === today) {
    div.classList.add('today');
  }

  div.onclick = function () {
    selectDate(dateStr);
  };

  /* === DAY NUMBER === */
  var num = document.createElement('div');
  num.className = 'cal-day-num';
  num.textContent = day;
  div.appendChild(num);

  /* === RESERVATION COUNT === */
  if (reservations.length > 0) {

    var pill = document.createElement('div');
    pill.className = 'cal-res-pill';
    pill.innerHTML =
      '<i class="fas fa-users"></i> ' + reservations.length;

    div.appendChild(pill);

    /* === MINI NAMES (max 3) === */
    var wrap = document.createElement('div');
    wrap.className = 'cal-mini-names';

    reservations.slice(0, 3).forEach(function (r) {
      var name = document.createElement('div');
      name.className = 'cal-mini-name';
      name.textContent = r.nama;
      wrap.appendChild(name);
    });

    div.appendChild(wrap);
  }

  return div;
}

/* ============================================================
5. DETAIL VIEW RENDER
============================================================ */

function renderDetailList (list) {
  var container = $('detail-list');
  if (!container) return;

  container.innerHTML = '';

  if (!list || list.length === 0) {
    container.innerHTML = buildEmptyState();
    return;
  }

  list.forEach(function (r) {
    container.appendChild(createReservationCard(r));
  });
}

/* ============================================================
6. RESERVATION CARD
============================================================ */

function createReservationCard (r) {

  var div = document.createElement('div');
  div.className = 'res-card';

  div.innerHTML = `
    <div class="rc-top">
      <div class="rc-name">
        <div class="rc-avatar">${getInitial(r.nama)}</div>
        ${r.nama}
      </div>

      <div class="rc-badges">
        <span class="badge badge-orange">
          ${r.jam}
        </span>
        <span class="badge badge-gray">
          ${r.tempat}
        </span>
        <span class="badge badge-blue">
          ${r.jumlah} org
        </span>
      </div>
    </div>

    <div class="rc-body">

      ${
        r.menus && r.menus.length
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

      ${
        r.tambahan
          ? `<div class="rc-menu-sub">${r.tambahan}</div>`
          : ''
      }

    </div>

    <div class="rc-footer">

      <button class="btn-success-soft"
        onclick="handleSendConfirmation('${r.id}')">
        <i class="fab fa-whatsapp"></i> Konfirmasi
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
7. HELPERS
============================================================ */

function getInitial (name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function buildEmptyState () {
  return `
    <div class="empty-state">
      <div class="es-icon">
        <i class="fas fa-calendar-check"></i>
      </div>
      <div class="es-title">Belum ada reservasi</div>
      <div class="es-sub">
        Tambahkan reservasi pertama untuk tanggal ini
      </div>
    </div>
  `;
}

/* ============================================================
8. GLOBAL BINDING
============================================================ */

window.prevMonth = prevMonth;
window.nextMonth = nextMonth;
window.goToday   = goToday;
window.renderCalendar = renderCalendar;
window.renderDetailList = renderDetailList;

/* ============================================================
9. SAFE GUARD
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