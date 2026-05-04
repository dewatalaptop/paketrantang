'use strict';

/* ============================================================
NOTIFICATION.WHATSAPP.SERVICE.JS — PROSERVA CORE
WA Gateway + Notification Engine
============================================================ */

/* ============================================================
1. WHATSAPP GATEWAY (ABSTRACTION LAYER)
============================================================ */

/**
 * Open WhatsApp chat (current: wa.me)
 * Future: replace with API (Fonnte / Twilio / WA Business)
 */
function sendWhatsApp (phone, message) {
  if (!phone) return;

  var formatted = normalizePhone(phone);

  var url = 'https://wa.me/' + formatted +
            '?text=' + encodeURIComponent(message || '');

  window.open(url, '_blank', 'noopener');
}

/* ============================================================
2. MESSAGE BUILDERS
============================================================ */

/**
 * Reservation confirmation message
 */
function buildConfirmationMsg (r) {
  var menuList = '*(tidak ada)*';

  if (Array.isArray(r.menus) && r.menus.length > 0) {
    menuList = r.menus.map(function (item) {
      var md = getMenuByName(item.name);
      var details = md && md.details ? md.details : [];

      return (
        '  • *' + item.quantity + 'x ' + item.name + '*' +
        (details.length ? '\n    ' + details.join(', ') : '')
      );
    }).join('\n');
  }

  return (
    'Halo Kak *' + r.nama + '* 👋\n\n' +
    'Kami dari *' + state.biz.name + '* ingin konfirmasi reservasi:\n\n' +
    '🗓 *Tanggal:* ' + formatDateFull(r.date) + '\n' +
    '⏰ *Jam:* ' + r.jam + '\n' +
    '📍 *Tempat:* ' + r.tempat + '\n' +
    '👥 *Jumlah:* ' + r.jumlah + ' orang\n\n' +
    '🍽 *Pesanan:*\n' + menuList + '\n\n' +
    (r.dp > 0
      ? '💰 *DP:* Rp' + formatRupiah(r.dp) + '\n\n'
      : '') +
    (r.tambahan
      ? '📝 *Catatan:* ' + r.tambahan + '\n\n'
      : '') +
    'Mohon konfirmasi ya 🙏'
  );
}

/**
 * Thank you message
 */
function buildThankYouMsg (r) {
  return (
    'Halo Kak *' + r.nama + '* 👋\n\n' +
    'Terima kasih sudah berkunjung ke *' + state.biz.name + '* 🙏\n\n' +
    'Semoga pengalaman Kakak menyenangkan 😊\n\n' +
    'Kami tunggu kedatangannya kembali ✨'
  );
}

/**
 * Daily summary message
 */
function buildDailySummaryMsg (dateStr, reservations) {

  var msg =
    '*📋 LAPORAN RESERVASI*\n' +
    '*' + state.biz.name + '*\n\n' +
    '📅 ' + formatDateFull(dateStr) + '\n' +
    '────────────────────────\n\n';

  if (!reservations.length) {
    return msg + '*Tidak ada reservasi.*';
  }

  reservations
    .sort(function (a, b) {
      return (a.jam || '').localeCompare(b.jam || '');
    })
    .forEach(function (r, i) {

      msg +=
        '*' + (i + 1) + '. ' + r.nama + '*\n' +
        '⏰ ' + r.jam + ' | 📍 ' + r.tempat + ' | 👥 ' + r.jumlah + '\n\n';
    });

  return msg;
}

/* ============================================================
3. ACTION HELPERS
============================================================ */

/**
 * Send confirmation
 */
function sendConfirmation (id) {
  var r = findReservationById(id);
  if (!r || !r.nomorHp) return false;

  sendWhatsApp(r.nomorHp, buildConfirmationMsg(r));
  return true;
}

/**
 * Send thank you + update state
 */
function sendThankYou (id) {
  var r = findReservationById(id);
  if (!r || !r.nomorHp) return false;

  sendWhatsApp(r.nomorHp, buildThankYouMsg(r));

  var updated = Object.assign({}, r, {
    thankYouSent: true
  });

  updateReservation(updated);

  return true;
}

/* ============================================================
4. NOTIFICATION ENGINE
============================================================ */

var NOTIFICATION = {

  interval: null,

  /**
   * Get reservations needing thank-you
   */
  getPendingThankYous: function () {
    var now = Date.now();
    var today = todayStr();

    return getAllReservations().filter(function (r) {

      if (!r.date || r.date > today) return false;
      if (r.thankYouSent) return false;
      if (!r.nomorHp || !r.jam) return false;

      var resTime = new Date(r.date + 'T' + r.jam).getTime();

      return now > resTime + (3 * 60 * 60 * 1000);
    });
  },

  /**
   * Start polling
   */
  start: function () {
    var self = this;

    if (self.interval) {
      clearInterval(self.interval);
    }

    self.interval = setInterval(function () {
      var pending = self.getPendingThankYous();

      if (pending.length > 0) {
        console.log('[NOTIF] Pending thank-you:', pending.length);
      }

    }, 2 * 60 * 1000);
  }

};

/* ============================================================
5. BROADCAST SERVICE
============================================================ */

function sendBroadcast (phone, name, template) {
  if (!phone || !template) return;

  var msg = template.replace(/\bkak\b/gi, 'Kak *' + name + '*');

  sendWhatsApp(phone, msg);
}

/* ============================================================
6. SAFE GUARD
============================================================ */
(function () {
  try {
    if (!window.findReservationById) {
      console.warn('[Proserva] reservation.data.js belum load');
    }
  } catch (e) {
    console.error('[Proserva] Notification service error:', e);
  }
})();