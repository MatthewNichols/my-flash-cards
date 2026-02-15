<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);

onMounted(() => {
  if (authStore.user) {
    name.value = authStore.user.name || '';
    email.value = authStore.user.email;
  }
});

async function handleSave(): Promise<void> {
  error.value = '';
  success.value = '';

  if (newPassword.value && newPassword.value !== confirmPassword.value) {
    error.value = 'New passwords do not match';
    return;
  }

  if (newPassword.value && newPassword.value.length < 8) {
    error.value = 'New password must be at least 8 characters';
    return;
  }

  if (newPassword.value && !currentPassword.value) {
    error.value = 'Current password is required to set a new password';
    return;
  }

  loading.value = true;

  try {
    const data: Record<string, string> = {};

    if (email.value !== authStore.user?.email) {
      data.email = email.value;
    }
    if (name.value !== (authStore.user?.name || '')) {
      data.name = name.value;
    }
    if (newPassword.value) {
      data.currentPassword = currentPassword.value;
      data.newPassword = newPassword.value;
    }

    if (Object.keys(data).length === 0) {
      error.value = 'No changes to save';
      return;
    }

    await authStore.updateProfile(data);
    success.value = 'Profile updated successfully';
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update profile';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1>My Profile</h1>
      <p class="subtitle">Update your account information</p>

      <div v-if="success" class="success">{{ success }}</div>
      <div v-if="error" class="error">{{ error }}</div>

      <form @submit.prevent="handleSave" class="profile-form">
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Your name"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Your email"
            required
            :disabled="loading"
          />
        </div>

        <h2>Change Password</h2>
        <p class="hint">Leave blank to keep current password</p>

        <div class="form-group">
          <label for="currentPassword">Current Password</label>
          <input
            id="currentPassword"
            v-model="currentPassword"
            type="password"
            placeholder="Enter current password"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            placeholder="Enter new password"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            :disabled="loading"
          />
        </div>

        <button type="submit" class="save-button" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>

      <button @click="router.push({ name: 'DeckList' })" class="back-button">
        Back to Decks
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.profile-card {
  background-color: white;
  border-radius: 12px;
  padding: 3rem 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 480px;

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

  h2 {
    font-size: 1.25rem;
    color: #2c3e50;
    margin-top: 1.5rem;
    margin-bottom: 0.25rem;
  }

  .hint {
    font-size: 0.85rem;
    color: #7f8c8d;
    margin-bottom: 1rem;
  }
}

.profile-form {
  margin-bottom: 1.5rem;
}

.success {
  background-color: #d5f5e3;
  color: #1e8449;
  padding: 0.875rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
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
  margin-bottom: 1.25rem;

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

.save-button {
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
  margin-top: 0.5rem;

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

.back-button {
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #667eea;
    color: #667eea;
  }
}

@media (max-width: 600px) {
  .profile-card {
    padding: 2rem 1.5rem;

    h1 {
      font-size: 1.75rem;
    }
  }
}
</style>
