'use strict';

/* ============================================================
STORAGE.JS — PROSERVA CORE (REWRITE)
Safe • Versioned • Recoverable
============================================================ */

/* ============================================================
1. STORAGE KEYS
============================================================ */

var KEYS = {
  BIZ:          'proserva_biz',
  MENUS:        'proserva_menus',
  LOCATIONS:    'proserva_locations',
  RESERVATIONS: 'proserva_reservations',
  SETUP_DONE:   'proserva_setup_done',
  BC_MSG:       'proserva_bc_msg',
  TRIAL_START:  'proserva_trial_start',
  INSTALL_DATE: 'proserva_install_date',

  // internal
  BACKUP:       'proserva_backup_v1',
  VERSION:      'proserva_version'
};

/* ============================================================
2. STORAGE ADAPTER
============================================================ */

var DB = {

  /* =========================
     GET (SAFE + RECOVERY)
  ========================= */
  get: function (key, fallback) {
    if (fallback === undefined) fallback = null;

    try {
      var raw = localStorage.getItem(key);

      if (raw === null) return fallback;

      return safeParse(raw, fallback);

    } catch (e) {
      console.warn('[DB.get] error:', key, e);

      // try recovery from backup
      var backup = DB._getBackup();
      if (backup && key in backup) {
        console.warn('[DB.get] recovered from backup:', key);
        return backup[key];
      }

      return fallback;
    }
  },

  /* =========================
     SET (SAFE + BACKUP)
  ========================= */
  set: function (key, value) {
    try {

      var str = JSON.stringify(value);

      localStorage.setItem(key, str);

      DB._saveToBackup(key, value);

      return true;

    } catch (e) {

      console.error('[DB.set] write failed:', key, e);

      // fallback strategy: try cleanup
      DB._handleQuota();

      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e2) {
        console.error('[DB.set] retry failed:', key);
        return false;
      }
    }
  },

  /* =========================
     REMOVE
  ========================= */
  remove: function (key) {
    try {
      localStorage.removeItem(key);
      DB._removeFromBackup(key);
      return true;
    } catch (e) {
      console.warn('[DB.remove] failed:', key);
      return false;
    }
  },

  /* =========================
     CLEAR (SAFE NAMESPACE)
  ========================= */
  clear: function () {
    try {

      Object.values(KEYS).forEach(function (k) {
        localStorage.removeItem(k);
      });

      return true;

    } catch (e) {
      console.error('[DB.clear] failed', e);
      return false;
    }
  },

  /* ============================================================
  3. BACKUP SYSTEM
  ============================================================ */

  _getBackup: function () {
    try {
      var raw = localStorage.getItem(KEYS.BACKUP);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  _saveToBackup: function (key, value) {
    try {
      var backup = DB._getBackup();
      backup[key] = value;
      localStorage.setItem(KEYS.BACKUP, JSON.stringify(backup));
    } catch (e) {
      console.warn('[DB.backup] failed');
    }
  },

  _removeFromBackup: function (key) {
    try {
      var backup = DB._getBackup();
      delete backup[key];
      localStorage.setItem(KEYS.BACKUP, JSON.stringify(backup));
    } catch (e) {}
  },

  /* ============================================================
  4. QUOTA HANDLER (IMPORTANT FOR IOS)
  ============================================================ */

  _handleQuota: function () {
    try {
      console.warn('[DB] quota exceeded → cleaning old data');

      // remove non-critical keys first
      localStorage.removeItem(KEYS.BC_MSG);

    } catch (e) {
      console.error('[DB] quota cleanup failed');
    }
  }
};

/* ============================================================
5. SAFE JSON PARSE
============================================================ */

function safeParse (str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('[JSON parse error]');
    return fallback;
  }
}

/* ============================================================
6. VERSIONING (FUTURE READY)
============================================================ */

(function () {
  try {

    var version = DB.get(KEYS.VERSION, 1);

    if (version !== 1) {
      console.warn('[Proserva] version mismatch → future migration needed');
    }

    DB.set(KEYS.VERSION, 1);

  } catch (e) {
    console.error('[Proserva] version init error:', e);
  }
})();

/* ============================================================
7. DEV GUARD
============================================================ */

(function () {
  try {

    if (!window.localStorage) {
      console.warn('[Proserva] localStorage not supported');
    }

  } catch (e) {
    console.error('[Proserva] Storage init error:', e);
  }
})();