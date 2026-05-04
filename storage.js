'use strict';

/* ============================================================
STORAGE.JS — PROSERVA CORE
Storage Keys + Safe LocalStorage Adapter
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
  INSTALL_DATE: 'proserva_install_date'
};

/* ============================================================
2. STORAGE ADAPTER
Safe wrapper for localStorage
============================================================ */
var DB = {

  /**
   * Get value from localStorage
   * @param {string} key
   * @param {*} fallback
   */
  get: function (key, fallback) {
    if (fallback === undefined) fallback = null;

    try {
      var raw = localStorage.getItem(key);

      if (raw === null) return fallback;

      return JSON.parse(raw);

    } catch (e) {
      console.warn('[DB.get] Parse error:', key, e);
      return fallback;
    }
  },

  /**
   * Save value to localStorage
   * @param {string} key
   * @param {*} value
   */
  set: function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;

    } catch (e) {
      console.error('[DB.set] Write error:', key, e);
      return false;
    }
  },

  /**
   * Remove single key
   */
  remove: function (key) {
    try {
      localStorage.removeItem(key);
      return true;

    } catch (e) {
      console.warn('[DB.remove] Failed:', key);
      return false;
    }
  },

  /**
   * Clear only Proserva keys (safe clear)
   */
  clear: function () {
    try {
      Object.values(KEYS).forEach(function (k) {
        localStorage.removeItem(k);
      });

      return true;

    } catch (e) {
      console.error('[DB.clear] Failed', e);
      return false;
    }
  }

};

/* ============================================================
3. SAFE GUARD (DEV CHECK)
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