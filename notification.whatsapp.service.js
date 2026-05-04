'use strict';

/* ============================================================
NOTIFICATION.WHATSAPP.SERVICE.JS — PROSERVA CORE (REWRITE)
Robust • Safe • Scalable
============================================================ */

/* ============================================================
1. WHATSAPP GATEWAY
============================================================ */

function sendWhatsApp (phone, message) {
  if (!phone) return false;

  const formatted = normalizePhone(phone);

  if (!formatted || formatted.length < 10) {
    console.warn('[WA] Invalid phone:', phone);
    return false;
  }

  const url = 'https://wa.me/' + formatted +
              '?text=' + encodeURIComponent(message || '');

  try {
    const win = window.open(url, '_blank', 'noopener');

    if (!win) {
      showToast('Popup diblokir browser 😢', 'error');
      return false;
    }

    return true;

  } catch (e) {
    console.error('[WA] open failed', e);
    return false;
  }
}

/* ============================================================
2. MESSAGE BUILDERS (SANITIZED)
============================================================ */

function safeText (val) {
  return sanitizeText(val || '', 120);
}

function buildConfirmationMsg (r) {

  const menuList = (Array.isArray(r.menus) && r.menus.length)
    ? r.menus.map(item => {
        const md = getMenuByName(item.name);
        const details = md?.details || [];

        return (
          '  • *' + item.quantity + 'x ' + safeText(item.name) + '*' +
          (details.length
            ? '\n    ' + details.join(', ')
            : '')
        );
      }).join('\n')
    : '*(tidak ada)*';

  return (
`Halo Kak *${safeText(r.nama)}* 👋

Kami dari *${safeText(state.biz.name)}* ingin konfirmasi reservasi:

🗓 *Tanggal:* ${formatDateFull(r.date)}
⏰ *Jam:* ${r.jam}
📍 *Tempat:* ${safeText(r.tempat)}
👥 *Jumlah:* ${r.jumlah} orang

🍽 *Pesanan:*
${menuList}

${r.dp > 0 ? `💰 *DP:* Rp${formatRupiah(r.dp)}\n\n` : ''}
${r.tambahan ? `📝 *Catatan:* ${safeText(r.tambahan)}\n\n` : ''}

Mohon konfirmasi ya 🙏`
  );
}

function buildThankYouMsg (r) {
  return (
`Halo Kak *${safeText(r.nama)}* 👋

Terima kasih sudah berkunjung ke *${safeText(state.biz.name)}* 🙏

Semoga pengalaman Kakak menyenangkan 😊

Kami tunggu kedatangannya kembali ✨`
  );
}

function buildDailySummaryMsg (dateStr, reservations) {

  let msg =
`📋 *LAPORAN RESERVASI*
*${safeText(state.biz.name)}*

📅 ${formatDateFull(dateStr)}
────────────────────────

`;

  if (!reservations.length) {
    return msg + '*Tidak ada reservasi.*';
  }

  reservations
    .sort((a, b) => (a.jam || '').localeCompare(b.jam || ''))
    .forEach((r, i) => {

      msg +=
`*${i + 1}. ${safeText(r.nama)}*
⏰ ${r.jam} | 📍 ${safeText(r.tempat)} | 👥 ${r.jumlah}

`;
    });

  return msg;
}

/* ============================================================
3. ACTION HELPERS
============================================================ */

function sendConfirmation (id) {
  const r = findReservationById(id);

  if (!r || !r.nomorHp) {
    showToast('Nomor tidak tersedia', 'error');
    return false;
  }

  return sendWhatsApp(r.nomorHp, buildConfirmationMsg(r));
}

function sendThankYou (id) {
  const r = findReservationById(id);

  if (!r || !r.nomorHp) return false;

  const ok = sendWhatsApp(r.nomorHp, buildThankYouMsg(r));

  if (ok) {
    const updated = { ...r, thankYouSent: true };
    updateReservation(updated);
  }

  return ok;
}

/* ============================================================
4. NOTIFICATION ENGINE (UPGRADED)
============================================================ */

var NOTIFICATION = {

  interval: null,

  getPendingThankYous: function () {
    const now = Date.now();

    return getAllReservations().filter(r => {

      if (!r.date || !r.jam) return false;
      if (r.thankYouSent) return false;
      if (!r.nomorHp) return false;

      // FIX timezone bug
      const [y, m, d] = r.date.split('-').map(Number);
      const [hh, mm] = r.jam.split(':').map(Number);

      const resTime = new Date(y, m - 1, d, hh, mm).getTime();

      return now > resTime + (3 * 60 * 60 * 1000);
    });
  },

  updateUI: function (pending) {
    const dot = $('notif-dot');
    const list = $('notif-list');

    if (!dot || !list) return;

    if (pending.length === 0) {
      dot.style.display = 'none';
      list.innerHTML = '<div class="nd-empty">Semua beres 🎉</div>';
      return;
    }

    dot.style.display = 'block';

    list.innerHTML = pending.map(r => `
      <div class="notif-item">
        <div class="ni-name">${safeText(r.nama)}</div>
        <div class="ni-date">${formatDateFull(r.date)} • ${r.jam}</div>
      </div>
    `).join('');
  },

  start: function () {
    if (this.interval) clearInterval(this.interval);

    const run = () => {
      const pending = this.getPendingThankYous();
      this.updateUI(pending);
    };

    run(); // initial

    this.interval = setInterval(run, 2 * 60 * 1000);
  }
};

/* ============================================================
5. BROADCAST
============================================================ */

function sendBroadcast (phone, name, template) {
  if (!phone || !template) return false;

  const msg = template.replace(/\bkak\b/gi, `Kak *${safeText(name)}*`);

  return sendWhatsApp(phone, msg);
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
    console.error('[Proserva] Notification error:', e);
  }
})();