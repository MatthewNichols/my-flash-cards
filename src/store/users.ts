import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ManagedUser } from '@/types';

export const useUsersStore = defineStore('users', () => {
  const userList = ref<ManagedUser[]>([]);
  const loading = ref(false);
  const error = ref('');

  async function fetchUsers(): Promise<void> {
    loading.value = true;
    error.value = '';
    try {
      const response = await fetch('/api/admin/users', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      userList.value = await response.json();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred';
    } finally {
      loading.value = false;
    }
  }

  async function createUser(data: {
    email: string; password: string; name?: string; role?: string;
  }): Promise<ManagedUser> {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const d = await response.json();
      throw new Error(d.error || 'Failed to create user');
    }
    const newUser = await response.json();
    userList.value.push(newUser);
    return newUser;
  }

  async function updateUser(userId: number, data: Record<string, any>): Promise<ManagedUser> {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const d = await response.json();
      throw new Error(d.error || 'Failed to update user');
    }
    const updated = await response.json();
    const idx = userList.value.findIndex(u => u.id === userId);
    if (idx !== -1) userList.value[idx] = updated;
    return updated;
  }

  async function deleteUser(userId: number): Promise<void> {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      const d = await response.json();
      throw new Error(d.error || 'Failed to delete user');
    }
    userList.value = userList.value.filter(u => u.id !== userId);
  }

  return { userList, loading, error, fetchUsers, createUser, updateUser, deleteUser };
});
