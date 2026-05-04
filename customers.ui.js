'use strict';

window.Customers = (function () {

  function render () {

    const tbody = document.getElementById('customers-tbody');
    if (!tbody) return;

    const list = build();

    if (!list.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;">
            Belum ada pelanggan
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(row).join('');
  }

  function build () {
    const map = {};

    (getAllReservations?.() || []).forEach(r => {

      if (!r.nama) return;

      if (!map[r.nama]) {
        map[r.nama] = {
          nama: r.nama,
          hp: r.nomorHp,
          total: 0,
          last: r.date
        };
      }

      map[r.nama].total++;

      if (r.date > map[r.nama].last) {
        map[r.nama].last = r.date;
      }
    });

    return Object.values(map);
  }

  function row (c) {
    return `
      <tr>
        <td>${c.nama}</td>
        <td>${c.hp || '-'}</td>
        <td>${c.total}</td>
        <td>${formatDateDisplay?.(c.last) || c.last}</td>
        <td>-</td>
      </tr>
    `;
  }

  return { render };

})();