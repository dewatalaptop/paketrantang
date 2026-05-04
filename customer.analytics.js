'use strict';

/* ============================================================
CUSTOMER.ANALYTICS.JS — PROSERVA CORE
Customer Intelligence + Analytics Engine
============================================================ */

/* ============================================================
1. CUSTOMER BUILDER
Deduplicate customers from reservations
============================================================ */

/**
 * Build unique customer list
 * Key priority: phone → fallback name
 */
function buildCustomerList () {
  var all = getAllReservations();
  var map = {};

  all.forEach(function (r) {
    var key = r.nomorHp
      ? r.nomorHp
      : ('__nop__' + (r.nama || '').toLowerCase().trim());

    if (!map[key]) {
      map[key] = {
        nama:      r.nama || 'Tanpa Nama',
        nomorHp:   r.nomorHp || null,
        count:     0,
        totalPax:  0,
        firstDate: r.date || '',
        lastDate:  r.date || ''
      };
    }

    map[key].count++;
    map[key].totalPax += parseInt(r.jumlah, 10) || 0;

    if (r.date < map[key].firstDate) {
      map[key].firstDate = r.date;
    }

    if (r.date > map[key].lastDate) {
      map[key].lastDate = r.date;
    }
  });

  return Object.values(map).sort(function (a, b) {
    return a.nama.localeCompare(b.nama);
  });
}

/* ============================================================
2. BASIC STATS
============================================================ */

/**
 * Compute summary stats
 */
function computeStats (reservations) {
  reservations = reservations || [];

  var count    = reservations.length;
  var totalPax = 0;
  var totalDp  = 0;

  reservations.forEach(function (r) {
    totalPax += parseInt(r.jumlah, 10) || 0;
    totalDp  += parseInt(r.dp, 10) || 0;
  });

  return {
    count:    count,
    totalPax: totalPax,
    totalDp:  totalDp,
    avgPax:   count > 0 ? (totalPax / count).toFixed(1) : '0'
  };
}

/* ============================================================
3. GENERIC COUNTER
============================================================ */

/**
 * Count by key function
 */
function countBy (arr, keyFn) {
  var map = {};

  arr.forEach(function (item) {
    var k = keyFn(item);
    if (k !== null && k !== undefined) {
      map[k] = (map[k] || 0) + 1;
    }
  });

  return Object.entries(map)
    .map(function (e) {
      return { key: e[0], count: e[1] };
    })
    .sort(function (a, b) {
      return b.count - a.count;
    });
}

/* ============================================================
4. MENU ANALYTICS
============================================================ */

/**
 * Count menu popularity
 */
function countMenus (reservations) {
  var map = {};

  reservations.forEach(function (r) {
    if (!Array.isArray(r.menus)) return;

    r.menus.forEach(function (m) {
      map[m.name] = (map[m.name] || 0) +
        (parseInt(m.quantity, 10) || 1);
    });
  });

  return Object.entries(map)
    .map(function (e) {
      return { key: e[0], count: e[1] };
    })
    .sort(function (a, b) {
      return b.count - a.count;
    });
}

/* ============================================================
5. TIME-BASED ANALYTICS
============================================================ */

/**
 * Reservation count by day of week
 */
function countByDayOfWeek (reservations) {
  return countBy(reservations, function (r) {
    if (!r.date) return null;

    var d = new Date(r.date + 'T12:00:00');
    return DAYS_ID[d.getDay()];
  });
}

/**
 * Reservation count by hour
 */
function countByHour (reservations) {
  return countBy(reservations, function (r) {
    return r.jam || null;
  });
}

/* ============================================================
6. INSIGHT ENGINE (LIGHTWEIGHT AI)
============================================================ */

/**
 * Generate simple business insights
 */
function generateInsights (reservations, stats) {
  if (!reservations.length) {
    return ['Belum ada data pada periode ini.'];
  }

  var insights = [];

  /* ---------- BUSIEST DAY ---------- */
  var byDay = countByDayOfWeek(reservations);
  if (byDay.length) {
    insights.push('Hari tersibuk: ' + byDay[0].key);
  }

  /* ---------- BUSIEST HOUR ---------- */
  var byHour = countByHour(reservations);
  if (byHour.length) {
    insights.push('Jam tersibuk: ' + byHour[0].key);
  }

  /* ---------- TOP MENU ---------- */
  var menus = countMenus(reservations);
  if (menus.length) {
    insights.push('Menu favorit: ' + menus[0].key);
  }

  /* ---------- HIGH VALUE CUSTOMER ---------- */
  var customers = buildCustomerList()
    .sort(function (a, b) {
      return b.totalPax - a.totalPax;
    });

  if (customers.length) {
    insights.push('Pelanggan paling sering: ' + customers[0].nama);
  }

  /* ---------- AVG SIZE ---------- */
  if (stats.avgPax > 5) {
    insights.push('Mayoritas reservasi grup besar (avg > 5 orang)');
  }

  return insights;
}

/* ============================================================
7. CHART DATA BUILDER
============================================================ */

/**
 * Build chart data (month or day)
 */
function buildChartData (arr, mode, year, monthIdx) {

  var labels = [];
  var data   = [];

  if (mode === 'month') {

    var counts = Array(12).fill(0);

    arr.forEach(function (r) {
      if (!r.date) return;

      var parts = r.date.split('-');
      var m = parseInt(parts[1], 10) - 1;

      counts[m]++;
    });

    labels = MONTHS_SHORT;
    data   = counts;

  } else {

    var daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    var counts = Array(daysInMonth).fill(0);

    arr.forEach(function (r) {
      if (!r.date) return;

      var parts = r.date.split('-');
      var d = parseInt(parts[2], 10) - 1;

      counts[d]++;
    });

    labels = counts.map(function (_, i) {
      return String(i + 1);
    });

    data = counts;
  }

  return { labels: labels, data: data };
}

/* ============================================================
8. TOP ENTITIES HELPERS
============================================================ */

/**
 * Top customers by visit count
 */
function getTopCustomers (reservations, limit) {
  limit = limit || 5;

  var map = {};

  reservations.forEach(function (r) {
    if (!r.nomorHp) return;

    if (!map[r.nomorHp]) {
      map[r.nomorHp] = {
        name: r.nama,
        count: 0
      };
    }

    map[r.nomorHp].count++;
  });

  return Object.values(map)
    .sort(function (a, b) { return b.count - a.count; })
    .slice(0, limit);
}

/**
 * Top menus
 */
function getTopMenus (reservations, limit) {
  return countMenus(reservations).slice(0, limit || 5);
}

/* ============================================================
9. SAFE GUARD
============================================================ */
(function () {
  try {
    if (!window.getAllReservations) {
      console.warn('[Proserva] reservation.data.js belum dimuat');
    }
  } catch (e) {
    console.error('[Proserva] Analytics init error:', e);
  }
})();