<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref<string>('');
const password = ref<string>('');
const confirmPassword = ref<string>('');
const name = ref<string>('');
const error = ref<string>('');
const loading = ref<boolean>(false);

/**
 * Handle register form submission
 */
async function handleRegister(): Promise<void> {
  error.value = '';

  if (!email.value || !password.value) {
    error.value = 'Please enter both email and password';
    return;
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters';
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match';
    return;
  }

  loading.value = true;

  try {
    await authStore.register(email.value, password.value, name.value || undefined);
    router.push({ name: 'DeckList' });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Registration failed';
  } finally {
    loading.value = false;
  }
}

/**
 * Navigate to login page
 */
function goToLogin(): void {
  router.push({ name: 'Login' });
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h1>Create Account</h1>
      <p class="subtitle">Start building your flash card collection</p>

      <form @submit.prevent="handleRegister" class="register-form">
        <div v-if="error" class="error">{{ error }}</div>

        <div class="form-group">
          <label for="name">Name (optional)</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Enter your name"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="At least 8 characters"
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            required
            :disabled="loading"
          />
        </div>

        <button type="submit" class="register-button" :disabled="loading">
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
      </form>

      <div class="login-link">
        Already have an account?
        <button @click="goToLogin" class="link-button">Login here</button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.register-card {
  background-color: white;
  border-radius: 12px;
  padding: 3rem 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 420px;

  h1 {
    font-size: 2rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .subtitle {
    color: #7f8c8d;
    text-align: center;
    margin-bottom: 2rem;
  }
}

.register-form {
  margin-bottom: 1.5rem;
}

.error {
  background-color: #fadbd8;
  color: #c0392b;
  padding: 0.875rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
  }

  input {
    width: 100%;
    padding: 0.875rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: #667eea;
    }

    &:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    &::placeholder {
      color: #bdc3c7;
    }
  }
}

.register-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.login-link {
  text-align: center;
  color: #7f8c8d;
  font-size: 0.95rem;

  .link-button {
    background: none;
    border: none;
    color: #667eea;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
    margin-left: 0.25rem;

    &:hover {
      color: #764ba2;
    }
  }
}

@media (max-width: 600px) {
  .register-card {
    padding: 2rem 1.5rem;

    h1 {
      font-size: 1.75rem;
    }
  }
}
</style>
