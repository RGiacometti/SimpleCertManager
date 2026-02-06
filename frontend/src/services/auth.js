import pb from './pocketbase';

const authService = {
  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      return authData;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Logout current user
   */
  logout() {
    pb.authStore.clear();
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return pb.authStore.model;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return pb.authStore.isValid;
  },

  /**
   * Get auth token
   */
  getToken() {
    return pb.authStore.token;
  },

  /**
   * Refresh authentication
   */
  async refresh() {
    try {
      await pb.collection('users').authRefresh();
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Register new user (if enabled)
   */
  async register(email, password, passwordConfirm, name) {
    try {
      const data = {
        email,
        password,
        passwordConfirm,
        name,
      };
      const record = await pb.collection('users').create(data);
      return record;
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      await pb.collection('users').requestPasswordReset(email);
      return true;
    } catch (error) {
      throw new Error(error.message || 'Password reset request failed');
    }
  },

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(token, password, passwordConfirm) {
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm);
      return true;
    } catch (error) {
      throw new Error(error.message || 'Password reset failed');
    }
  },
};

export default authService;
