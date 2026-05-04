'use strict';

/* ============================================================
CATALOG.DATA.JS — PROSERVA CORE
Menu & Location Data Layer (CRUD + Query)
============================================================ */

/* ============================================================
1. MENUS — GETTERS
============================================================ */

/**
 * Get all menus as [{id, ...data}] sorted by name
 */
function getMenusSorted () {
  return Object.entries(state.menus || {})
    .map(function (e) {
      return Object.assign({ id: e[0] }, e[1]);
    })
    .sort(function (a, b) {
      return (a.name || '').localeCompare(b.name || '');
    });
}

/**
 * Find menu by exact name
 */
function getMenuByName (name) {
  if (!name) return null;

  return Object.values(state.menus || {}).find(function (m) {
    return m.name === name;
  }) || null;
}

/* ============================================================
2. MENUS — MUTATIONS
============================================================ */

/**
 * Add new menu
 */
function addMenu (data) {
  if (!data || !data.name) return false;

  var id = genId();

  state.menus[id] = {
    name: data.name,
    price: parseInt(data.price, 10) || 0,
    details: Array.isArray(data.details) ? data.details : []
  };

  saveMenus();
  return id;
}

/**
 * Update menu by id
 */
function updateMenu (id, data) {
  if (!id || !state.menus[id]) return false;

  state.menus[id] = {
    name: data.name,
    price: parseInt(data.price, 10) || 0,
    details: Array.isArray(data.details) ? data.details : []
  };

  saveMenus();
  return true;
}

/**
 * Delete menu
 */
function deleteMenuById (id) {
  if (!id || !state.menus[id]) return false;

  delete state.menus[id];
  saveMenus();

  return true;
}

/* ============================================================
3. LOCATIONS — GETTERS
============================================================ */

/**
 * Get all locations sorted
 */
function getLocationsSorted () {
  return Object.entries(state.locations || {})
    .map(function (e) {
      return Object.assign({ id: e[0] }, e[1]);
    })
    .sort(function (a, b) {
      return (a.name || '').localeCompare(b.name || '');
    });
}

/**
 * Find location by name
 */
function getLocationByName (name) {
  if (!name) return null;

  return Object.values(state.locations || {}).find(function (l) {
    return l.name === name;
  }) || null;
}

/* ============================================================
4. LOCATIONS — MUTATIONS
============================================================ */

/**
 * Add location
 */
function addLocation (data) {
  if (!data || !data.name) return false;

  var id = genId();

  state.locations[id] = {
    name: data.name,
    capacity: parseInt(data.capacity, 10) || 0
  };

  saveLocations();
  return id;
}

/**
 * Update location
 */
function updateLocation (id, data) {
  if (!id || !state.locations[id]) return false;

  state.locations[id] = {
    name: data.name,
    capacity: parseInt(data.capacity, 10) || 0
  };

  saveLocations();
  return true;
}

/**
 * Delete location
 */
function deleteLocationById (id) {
  if (!id || !state.locations[id]) return false;

  delete state.locations[id];
  saveLocations();

  return true;
}

/* ============================================================
5. VALIDATION HELPERS (OPTIONAL SHARED)
============================================================ */

/**
 * Check duplicate menu name (case-insensitive)
 */
function isMenuNameExists (name, excludeId) {
  if (!name) return false;

  name = name.toLowerCase();

  return Object.entries(state.menus || {}).some(function (e) {
    return e[1].name.toLowerCase() === name && e[0] !== excludeId;
  });
}

/**
 * Check duplicate location name
 */
function isLocationNameExists (name, excludeId) {
  if (!name) return false;

  name = name.toLowerCase();

  return Object.entries(state.locations || {}).some(function (e) {
    return e[1].name.toLowerCase() === name && e[0] !== excludeId;
  });
}

/* ============================================================
6. SAFE GUARD
============================================================ */
(function () {
  try {
    if (!window.state) {
      console.warn('[Proserva] state belum tersedia sebelum catalog.data.js');
    }
  } catch (e) {
    console.error('[Proserva] Catalog data init error:', e);
  }
})();