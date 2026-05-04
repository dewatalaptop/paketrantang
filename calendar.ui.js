'use strict';

/* ============================================================
CALENDAR.UI.JS — PROSERVA CORE (PRO CALENDAR ENGINE)
Heatmap • Smart Indicators • Fast Rendering
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
      renderStats(year, month); // 🔥 NEW

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
  4. GRID (HEATMAP)
  ============================================================ */

  function renderGrid (year, month) {

    const grid = $('cal-days');
    if (!grid) return;

    grid.innerHTML = '';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayStr?.();

    // kosong
    for (let i = 0; i < firstDay; i++) {
      grid.appendChild(createEmptyCell());
    }

    // isi hari
    for (let d = 1; d <= daysInMonth; d++) {

      const dateStr = buildDateStr(year, month + 1, d);
      const summary = getDaySummary?.(dateStr) || {};

      grid.appendChild(
        createDayCell(d, dateStr, summary, today)
      );
    }
  }


  /* ============================================================
  5. CELL (SMART VISUAL)
  ============================================================ */

  function createEmptyCell () {
    const div = document.createElement('div');
    div.className = 'cal-day empty';
    return div;
  }

  function createDayCell (day, dateStr, summary, today) {

    const div = document.createElement('div');
    div.className = 'cal-day';

    // 🔥 HEATMAP CLASS
    const level = getHeatLevel(summary.total);
    if (level) div.classList.add(level);

    // today
    if (dateStr === today) {
      div.classList.add('today');
    }

    div.onclick = () => window.selectDate?.(dateStr);

    /* === NUMBER === */
    const num = document.createElement('div');
    num.className = 'cal-day-num';
    num.textContent = day;
    div.appendChild(num);

    /* === SUMMARY === */
    if (summary.total > 0) {

      const badge = document.createElement('div');
      badge.className = 'cal-badge';
      badge.innerHTML = `
        <i class="fas fa-users"></i> ${summary.total}
      `;
      div.appendChild(badge);

      /* === PAX === */
      const pax = document.createElement('div');
      pax.className = 'cal-pax';
      pax.textContent = summary.pax + ' org';
      div.appendChild(pax);

      /* === STATUS === */
      const status = getDayStatus(summary);
      if (status) {
        const st = document.createElement('div');
        st.className = 'cal-status ' + status.class;
        st.textContent = status.label;
        div.appendChild(st);
      }
    }

    return div;
  }


  /* ============================================================
  6. 🔥 MONTH STATS (TOP CARDS)
  ============================================================ */

  function renderStats (year, month) {

    const list = getResForMonth?.(year, month) || [];

    let total = list.length;
    let pax   = 0;
    let dp    = 0;
    let map   = {};

    list.forEach(r => {
      pax += Number(r.jumlah) || 0;
      dp  += Number(r.dp) || 0;

      map[r.date] = (map[r.date] || 0) + 1;
    });

    // busiest day
    let busiest = '—';
    let max = 0;

    Object.keys(map).forEach(date => {
      if (map[date] > max) {
        max = map[date];
        busiest = date;
      }
    });

    setText('stat-total', total);
    setText('stat-pax', pax);
    setText('stat-dp', 'Rp' + formatRupiah(dp));
    setText('stat-busiest',
      busiest !== '—' ? formatDateDisplay(busiest) : '—'
    );
  }


  /* ============================================================
  7. DETAIL VIEW
  ============================================================ */

  function renderDetailList (list) {

    const container = $('detail-list');
    if (!container) return;

    container.innerHTML = '';

    if (!list || list.length === 0) {
      container.innerHTML = emptyState();
      return;
    }

    list.sort((a, b) => (a.jam || '').localeCompare(b.jam || ''));

    list.forEach(r => {
      container.appendChild(createCard(r));
    });
  }


  /* ============================================================
  8. CARD
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

      <div class="rc-footer">

        <button onclick="handleSendConfirmation('${r.id}')">
          <i class="fab fa-whatsapp"></i>
        </button>

        <button onclick="handleSendThankYou('${r.id}')">
          ❤️
        </button>

        <button onclick="handleDeleteReservation('${r.id}')">
          🗑
        </button>

      </div>
    `;

    return div;
  }


  /* ============================================================
  9. HEATMAP LOGIC
  ============================================================ */

  function getHeatLevel (total) {
    if (!total) return '';

    if (total >= 10) return 'heat-max';
    if (total >= 6)  return 'heat-high';
    if (total >= 3)  return 'heat-mid';
    return 'heat-low';
  }

  function getDayStatus (summary) {

    if (summary.total >= 10) {
      return { label: 'Penuh', class: 'full' };
    }

    if (summary.total >= 6) {
      return { label: 'Ramai', class: 'busy' };
    }

    return null;
  }


  /* ============================================================
  10. HELPERS
  ============================================================ */

  function initial (name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function emptyState () {
    return `
      <div class="empty-state">
        <i class="fas fa-calendar"></i>
        <div>Belum ada reservasi</div>
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
    if (!window.getDaySummary) {
      console.warn('[Calendar] Smart engine belum aktif');
    }
  } catch (e) {
    console.error('[Calendar] Init error:', e);
  }
})();