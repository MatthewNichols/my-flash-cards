import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * User interface
 */
export interface User {
  id: number;
  email: string;
  name: string | null;
}

/**
 * Store for managing authentication state
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string>('');

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = computed((): boolean => {
    return user.value !== null;
  });

  /**
   * Register a new user account
   */
  async function register(email: string, password: string, name?: string): Promise<void> {
    loading.value = true;
    error.value = '';

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register');
      }

      const data = await response.json();
      user.value = data.user;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Login with email and password
   */
  async function login(email: string, password: string): Promise<void> {
    loading.value = true;
    error.value = '';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to login');
      }

      const data = await response.json();
      user.value = data.user;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Logout and clear session
   */
  async function logout(): Promise<void> {
    loading.value = true;
    error.value = '';

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      user.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Check current authentication status
   */
  async function checkAuth(): Promise<void> {
    loading.value = true;
    error.value = '';

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        user.value = data.user;
      } else {
        user.value = null;
      }
    } catch (err) {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    checkAuth
  };
});
