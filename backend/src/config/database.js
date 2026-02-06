const PocketBase = require('pocketbase/cjs');
const { POCKETBASE_URL } = require('./constants');

// Create PocketBase client instance
const pb = new PocketBase(POCKETBASE_URL);

// Disable auto cancellation
pb.autoCancellation(false);

/**
 * Initialize PocketBase connection
 */
async function initializeDatabase() {
  try {
    // Test connection
    await pb.health.check();
    console.log('✓ PocketBase connection established');
    return true;
  } catch (error) {
    console.error('✗ PocketBase connection failed:', error.message);
    return false;
  }
}

/**
 * Authenticate admin user
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 */
async function authenticateAdmin(email, password) {
  try {
    const authData = await pb.admins.authWithPassword(email, password);
    return authData;
  } catch (error) {
    throw new Error(`Admin authentication failed: ${error.message}`);
  }
}

/**
 * Authenticate regular user
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function authenticateUser(email, password) {
  try {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return authData;
  } catch (error) {
    throw new Error(`User authentication failed: ${error.message}`);
  }
}

/**
 * Get current authenticated user
 */
function getCurrentUser() {
  return pb.authStore.model;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return pb.authStore.isValid;
}

/**
 * Logout current user
 */
function logout() {
  pb.authStore.clear();
}

module.exports = {
  pb,
  initializeDatabase,
  authenticateAdmin,
  authenticateUser,
  getCurrentUser,
  isAuthenticated,
  logout
};
