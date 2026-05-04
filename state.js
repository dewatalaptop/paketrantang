'use strict';

/* ============================================================
STATE.JS — PROSERVA CORE
Central App State + Persistence Layer
============================================================ */

/* ============================================================
1. GLOBAL STATE (Single Source of Truth)
============================================================ */
var state = {

  /* ===== BUSINESS ===== */
  biz: {
    name: 'Usaha Saya',
    type: 'restoran'
  },

  /* ===== MASTER DATA ===== */
  menus: {},
  locations: {},

  /* ===== TRANSACTION ===== */
  reservations: {},

  /* ===== CALENDAR ===== */
  currentMonth: new Date().getMonth(),
  currentYear:  new Date().getFullYear(),
  selectedDate: null,

  /* ===== ANALYSIS ===== */
  anlChart: null,

  /* ===== BROADCAST ===== */
  bcList: [],

  /* ===== SYSTEM ===== */
  notifInterval: null
};

/* ============================================================
2. LOAD STATE FROM STORAGE
============================================================ */
function loadState () {

  state.biz = DB.get(KEYS.BIZ, {
    name: 'Usaha Saya',
    type: 'restoran'
  });

  state.menus = DB.get(KEYS.MENUS, {});
  state.locations = DB.get(KEYS.LOCATIONS, {});
  state.reservations = DB.get(KEYS.RESERVATIONS, {});
}

/* ============================================================
3. SAVE HELPERS (Granular)
============================================================ */

/**
 * Save business info
 */
function saveBiz () {
  DB.set(KEYS.BIZ, state.biz);
}

/**
 * Save menus
 */
function saveMenus () {
  DB.set(KEYS.MENUS, state.menus);
}

/**
 * Save locations
 */
function saveLocations () {
  DB.set(KEYS.LOCATIONS, state.locations);
}

/**
 * Save reservations
 */
function saveReservations () {
  DB.set(KEYS.RESERVATIONS, state.reservations);
}

/* ============================================================
4. RESET STATE (Used by trial / logout)
============================================================ */
function resetState () {

  state.biz = {
    name: 'Usaha Saya',
    type: 'restoran'
  };

  state.menus = {};
  state.locations = {};
  state.reservations = {};

  state.selectedDate = null;
  state.bcList = [];

  saveBiz();
  saveMenus();
  saveLocations();
  saveReservations();
}

/* ============================================================
5. SAFE GUARD (DEV CHECK)
============================================================ */
(function () {
  try {
    if (!window.DB || !window.KEYS) {
      console.warn('[Proserva] storage.js belum dimuat sebelum state.js');
    }
  } catch (e) {
    console.error('[Proserva] State init error:', e);
  }
})();