'use strict';

window.Analysis = (function () {

  function init () {
    setupSelectors();
    render();
  }

  function setupSelectors () {

    const yearEl  = document.getElementById('anl-year');
    const monthEl = document.getElementById('anl-month');

    if (!yearEl || !monthEl) return;

    const currentYear = new Date().getFullYear();

    // isi tahun (±5 tahun)
    yearEl.innerHTML = '';
    for (let y = currentYear - 3; y <= currentYear + 1; y++) {
      yearEl.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // isi bulan
    monthEl.innerHTML = MONTHS_ID
      .map((m, i) => `<option value="${i}">${m}</option>`)
      .join('');

    yearEl.value  = state.currentYear;
    monthEl.value = state.currentMonth;

    yearEl.onchange  = render;
    monthEl.onchange = render;
  }

  function render () {

    const year  = parseInt(document.getElementById('anl-year')?.value);
    const month = parseInt(document.getElementById('anl-month')?.value);

    const list = getResForMonth?.(year, month) || [];

    renderStats(list);
    renderChart(list);
  }

  function renderStats (list) {

    const el = document.getElementById('anl-stats');
    if (!el) return;

    let total = list.length;
    let pax   = 0;
    let dp    = 0;

    list.forEach(r => {
      pax += Number(r.jumlah) || 0;
      dp  += Number(r.dp) || 0;
    });

    el.innerHTML = `
      <div class="stat-card">Reservasi: ${total}</div>
      <div class="stat-card">Tamu: ${pax}</div>
      <div class="stat-card">DP: Rp${formatRupiah(dp)}</div>
    `;
  }

  function renderChart (list) {

    const ctx = document.getElementById('anl-chart');
    if (!ctx || !window.Chart) return;

    const map = {};

    list.forEach(r => {
      map[r.date] = (map[r.date] || 0) + 1;
    });

    const labels = Object.keys(map);
    const data   = Object.values(map);

    if (state.anlChart) {
      state.anlChart.destroy();
    }

    state.anlChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Reservasi',
          data
        }]
      }
    });
  }

  return { init };

})();