<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsersStore } from '@/store/users';
import { useAuthStore } from '@/store/auth';
import type { ManagedUser } from '@/types';

const router = useRouter();
const usersStore = useUsersStore();
const authStore = useAuthStore();

const selectedUser = ref<ManagedUser | null>(null);
const isCreating = ref(false);
const panelOpen = ref(false);

// Form fields
const formName = ref('');
const formEmail = ref('');
const formPassword = ref('');
const formRole = ref<'admin' | 'user'>('user');
const formError = ref('');
const formLoading = ref(false);
const showDeleteConfirm = ref(false);

onMounted(() => {
  usersStore.fetchUsers();
});

function openCreatePanel() {
  selectedUser.value = null;
  isCreating.value = true;
  formName.value = '';
  formEmail.value = '';
  formPassword.value = '';
  formRole.value = 'user';
  formError.value = '';
  showDeleteConfirm.value = false;
  panelOpen.value = true;
}

function openEditPanel(user: ManagedUser) {
  selectedUser.value = user;
  isCreating.value = false;
  formName.value = user.name || '';
  formEmail.value = user.email;
  formPassword.value = '';
  formRole.value = user.role;
  formError.value = '';
  showDeleteConfirm.value = false;
  panelOpen.value = true;
}

function closePanel() {
  panelOpen.value = false;
  selectedUser.value = null;
  isCreating.value = false;
  showDeleteConfirm.value = false;
}

async function handleSave(): Promise<void> {
  formError.value = '';
  formLoading.value = true;

  try {
    if (isCreating.value) {
      if (!formEmail.value || !formPassword.value) {
        formError.value = 'Email and password are required';
        return;
      }
      await usersStore.createUser({
        email: formEmail.value,
        password: formPassword.value,
        name: formName.value || undefined,
        role: formRole.value
      });
      closePanel();
    } else if (selectedUser.value) {
      const data: Record<string, any> = {};
      if (formEmail.value !== selectedUser.value.email) data.email = formEmail.value;
      if (formName.value !== (selectedUser.value.name || '')) data.name = formName.value;
      if (formPassword.value) data.password = formPassword.value;
      if (formRole.value !== selectedUser.value.role) data.role = formRole.value;

      if (Object.keys(data).length === 0) {
        formError.value = 'No changes to save';
        return;
      }

      await usersStore.updateUser(selectedUser.value.id, data);
      closePanel();
    }
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    formLoading.value = false;
  }
}

async function handleDelete(): Promise<void> {
  if (!selectedUser.value) return;
  formLoading.value = true;
  formError.value = '';

  try {
    await usersStore.deleteUser(selectedUser.value.id);
    closePanel();
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    formLoading.value = false;
  }
}

function isSelf(user: ManagedUser): boolean {
  return user.id === authStore.user?.id;
}
</script>

<template>
  <div class="user-management-container">
    <header class="header">
      <h1>User Management</h1>
      <div class="header-buttons">
        <button @click="router.push({ name: 'DeckList' })" class="back-button">
          Back to Decks
        </button>
      </div>
    </header>

    <main class="main-content">
      <div class="toolbar">
        <button @click="openCreatePanel" class="create-button">
          + New User
        </button>
      </div>

      <div v-if="usersStore.loading" class="loading">Loading users...</div>
      <div v-else-if="usersStore.error" class="error">{{ usersStore.error }}</div>

      <div v-else class="user-list">
        <div
          v-for="user in usersStore.userList"
          :key="user.id"
          class="user-item"
          :class="{ selected: selectedUser?.id === user.id }"
          @click="openEditPanel(user)"
        >
          <div class="user-info">
            <div class="user-name">{{ user.name || 'No name' }}</div>
            <div class="user-email">{{ user.email }}</div>
          </div>
          <div class="user-meta">
            <span class="role-badge" :class="user.role">{{ user.role }}</span>
            <span v-if="isSelf(user)" class="you-badge">you</span>
          </div>
        </div>
      </div>

      <!-- Overlay -->
      <transition name="fade">
        <div v-if="panelOpen" class="panel-overlay" @click="closePanel" />
      </transition>

      <!-- Slide-in detail panel -->
      <transition name="slide">
        <div v-if="panelOpen" class="detail-panel">
          <div class="panel-header">
            <h2>{{ isCreating ? 'Create User' : 'Edit User' }}</h2>
            <button @click="closePanel" class="close-button">&times;</button>
          </div>

          <div v-if="formError" class="panel-error">{{ formError }}</div>

          <form @submit.prevent="handleSave" class="panel-form">
            <div class="form-group">
              <label for="form-name">Name</label>
              <input
                id="form-name"
                v-model="formName"
                type="text"
                placeholder="User's name"
                :disabled="formLoading"
              />
            </div>

            <div class="form-group">
              <label for="form-email">Email</label>
              <input
                id="form-email"
                v-model="formEmail"
                type="email"
                placeholder="user@example.com"
                required
                :disabled="formLoading"
              />
            </div>

            <div class="form-group">
              <label for="form-password">
                Password
                <span v-if="!isCreating" class="optional">(leave blank to keep current)</span>
              </label>
              <input
                id="form-password"
                v-model="formPassword"
                type="password"
                :placeholder="isCreating ? 'Minimum 8 characters' : 'New password (optional)'"
                :required="isCreating"
                :disabled="formLoading"
              />
            </div>

            <div class="form-group">
              <label for="form-role">Role</label>
              <select
                id="form-role"
                v-model="formRole"
                :disabled="formLoading || (!!selectedUser && isSelf(selectedUser))"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="panel-actions">
              <button type="submit" class="save-button" :disabled="formLoading">
                {{ formLoading ? 'Saving...' : (isCreating ? 'Create User' : 'Save Changes') }}
              </button>
              <button type="button" @click="closePanel" class="cancel-button" :disabled="formLoading">
                Cancel
              </button>
            </div>
          </form>

          <div v-if="!isCreating && selectedUser && !isSelf(selectedUser)" class="danger-zone">
            <template v-if="!showDeleteConfirm">
              <button @click="showDeleteConfirm = true" class="delete-button" :disabled="formLoading">
                Delete User
              </button>
            </template>
            <template v-else>
              <p class="delete-confirm-text">Are you sure? This cannot be undone.</p>
              <div class="delete-confirm-actions">
                <button @click="handleDelete" class="delete-confirm-button" :disabled="formLoading">
                  {{ formLoading ? 'Deleting...' : 'Yes, Delete' }}
                </button>
                <button @click="showDeleteConfirm = false" class="cancel-delete-button" :disabled="formLoading">
                  No, Cancel
                </button>
              </div>
            </template>
          </div>
        </div>
      </transition>
    </main>
  </div>
</template>

<style scoped lang="scss">
.user-management-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #2c3e50;
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    font-size: 2rem;
    font-weight: 600;
  }

  .back-button {
    padding: 0.625rem 1.25rem;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    background-color: #34495e;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #4a6274;
    }
  }
}

.main-content {
  flex: 1;
  padding: 2rem 1rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.toolbar {
  margin-bottom: 1.5rem;
}

.create-button {
  padding: 0.75rem 1.5rem;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #229954;
  }
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #7f8c8d;
}

.error {
  background-color: #fadbd8;
  color: #c0392b;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  background-color: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: #667eea;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.selected {
    border-color: #667eea;
    background-color: #f0f2ff;
  }
}

.user-info {
  .user-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.25rem;
  }

  .user-email {
    font-size: 0.9rem;
    color: #7f8c8d;
  }
}

.user-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.admin {
    background-color: #eee5ff;
    color: #667eea;
  }

  &.user {
    background-color: #ecf0f1;
    color: #7f8c8d;
  }
}

.you-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: #d5f5e3;
  color: #1e8449;
}

/* Slide-in panel */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
}

.detail-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 420px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  padding: 2rem;
  z-index: 100;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    color: #2c3e50;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 2rem;
    color: #7f8c8d;
    cursor: pointer;
    line-height: 1;
    padding: 0;

    &:hover {
      color: #2c3e50;
    }
  }
}

.panel-error {
  background-color: #fadbd8;
  color: #c0392b;
  padding: 0.875rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.panel-form {
  .form-group {
    margin-bottom: 1.25rem;

    label {
      display: block;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;

      .optional {
        font-weight: 400;
        color: #7f8c8d;
        font-size: 0.85rem;
      }
    }

    input, select {
      width: 100%;
      padding: 0.875rem;
      font-size: 1rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      transition: border-color 0.2s ease;
      background-color: white;

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
}

.panel-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.save-button {
  flex: 1;
  padding: 0.875rem;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #229954;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.cancel-button {
  padding: 0.875rem 1.5rem;
  background-color: #ecf0f1;
  color: #7f8c8d;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #d5dbdb;
  }
}

.danger-zone {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #ecf0f1;
}

.delete-button {
  width: 100%;
  padding: 0.875rem;
  background-color: white;
  color: #e74c3c;
  border: 2px solid #e74c3c;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #e74c3c;
    color: white;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.delete-confirm-text {
  color: #e74c3c;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.delete-confirm-actions {
  display: flex;
  gap: 0.75rem;
}

.delete-confirm-button {
  flex: 1;
  padding: 0.875rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #c0392b;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.cancel-delete-button {
  flex: 1;
  padding: 0.875rem;
  background-color: #ecf0f1;
  color: #7f8c8d;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #d5dbdb;
  }
}

/* Transitions */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;

    h1 {
      font-size: 1.5rem;
    }
  }

  .main-content {
    padding: 1rem 0.5rem;
  }

  .detail-panel {
    width: 100%;
  }

  .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
