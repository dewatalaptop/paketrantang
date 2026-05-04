'use strict';

/* ============================================================
CALENDAR.UI.JS — PROSERVA CORE (HARDENED)
Stable • Defensive • Safe binding
============================================================ */

(function () {

  console.log('[Calendar] module init');

  /* ============================================================
  SAFE HELPERS
  ============================================================ */

  function safe$(id) {
    return document.getElementById(id);
  }

  function safeToday() {
    return window.todayStr ? todayStr() : null;
  }

  function safeGetRes(dateStr) {
    try {
      return window.getResForDate ? getResForDate(dateStr) : [];
    } catch (e) {
      console.error('[Calendar] getRes error', e);
      return [];
    }
  }

  function safeBuildDate(y, m, d) {
    return window.buildDateStr
      ? buildDateStr(y, m, d)
      : `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }


  /* ============================================================
  CORE
  ============================================================ */

  const Calendar = {

    render () {
      try {

        if (!window.state) {
          console.warn('[Calendar] state not ready');
          return;
        }

        // HARDEN state
        state.currentYear  ??= new Date().getFullYear();
        state.currentMonth ??= new Date().getMonth();

        this.renderHeader();
        this.renderGrid();

      } catch (e) {
        console.error('[Calendar.render]', e);
      }
    },


    /* ============================================================
    HEADER
    ============================================================ */

    renderHeader () {
      const label = safe$('cal-month-label');
      if (!label) return;

      try {
        label.textContent =
          MONTHS_ID?.[state.currentMonth] + ' ' + state.currentYear;
      } catch {
        label.textContent = `${state.currentMonth + 1}/${state.currentYear}`;
      }
    },


    /* ============================================================
    NAVIGATION
    ============================================================ */

    prevMonth () {
      state.currentMonth--;

      if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
      }

      this.render();
    },

    nextMonth () {
      state.currentMonth++;

      if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
      }

      this.render();
    },

    goToday () {
      const now = new Date();
      state.currentYear  = now.getFullYear();
      state.currentMonth = now.getMonth();
      this.render();
    },


    /* ============================================================
    GRID
    ============================================================ */

    renderGrid () {

      const grid = safe$('cal-days');
      if (!grid) return;

      grid.innerHTML = '';

      const year  = state.currentYear;
      const month = state.currentMonth;

      const firstDay    = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today       = safeToday();

      // empty
      for (let i = 0; i < firstDay; i++) {
        const div = document.createElement('div');
        div.className = 'cal-day empty';
        grid.appendChild(div);
      }

      // days
      for (let d = 1; d <= daysInMonth; d++) {

        const dateStr = safeBuildDate(year, month + 1, d);
        const resList = safeGetRes(dateStr);

        grid.appendChild(
          this.createDayCell(d, dateStr, resList, today)
        );
      }
    },


    /* ============================================================
    CELL
    ============================================================ */

    createDayCell (day, dateStr, reservations, today) {

      const div = document.createElement('div');
      div.className = 'cal-day';

      if (dateStr === today) {
        div.classList.add('today');
      }

      div.onclick = () => window.selectDate?.(dateStr);

      const num = document.createElement('div');
      num.className = 'cal-day-num';
      num.textContent = day;
      div.appendChild(num);

      if (reservations.length > 0) {

        const pill = document.createElement('div');
        pill.className = 'cal-res-pill';
        pill.innerHTML = `<i class="fas fa-users"></i> ${reservations.length}`;
        div.appendChild(pill);

        const wrap = document.createElement('div');
        wrap.className = 'cal-mini-names';

        reservations.slice(0, 3).forEach(r => {
          const name = document.createElement('div');
          name.className = 'cal-mini-name';
          name.textContent = r.nama;
          wrap.appendChild(name);
        });

        div.appendChild(wrap);
      }

      return div;
    },


    /* ============================================================
    DETAIL
    ============================================================ */

    renderDetailList (list) {

      const container = safe$('detail-list');
      if (!container) return;

      container.innerHTML = '';

      if (!list || list.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-check"></i>
            <div>Belum ada reservasi</div>
          </div>
        `;
        return;
      }

      list.sort((a,b) => (a.jam||'').localeCompare(b.jam||''));

      list.forEach(r => {
        const el = document.createElement('div');
        el.className = 'res-card';
        el.innerHTML = `
          <div class="rc-name">${r.nama}</div>
          <div>${r.jam} • ${r.tempat} • ${r.jumlah} org</div>
        `;
        container.appendChild(el);
      });
    }

  };


  /* ============================================================
  GLOBAL SAFE EXPORT
  ============================================================ */

  window.Calendar = Calendar;

  window.prevMonth = () => Calendar.prevMonth();
  window.nextMonth = () => Calendar.nextMonth();
  window.goToday   = () => Calendar.goToday();

  window.renderDetailList = (list) =>
    Calendar.renderDetailList(list);


  /* ============================================================
  SAFE GUARD
  ============================================================ */

  if (!window.getResForDate) {
    console.warn('[Calendar] reservation.data.js belum siap');
  }

})();