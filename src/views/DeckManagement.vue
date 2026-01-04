<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Deck } from '@/types';

const router = useRouter();

const decks = ref<Deck[]>([]);
const loading = ref<boolean>(false);
const error = ref<string>('');
const showCreateForm = ref<boolean>(false);
const newDeckName = ref<string>('');

/**
 * Fetch all decks
 */
async function fetchDecks(): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('/api/decks');
    if (!response.ok) {
      throw new Error('Failed to fetch decks');
    }
    decks.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Create a new deck
 */
async function createDeck(): Promise<void> {
  if (!newDeckName.value.trim()) {
    error.value = 'Deck name is required';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('/api/decks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newDeckName.value.trim() })
    });

    if (!response.ok) {
      throw new Error('Failed to create deck');
    }

    const newDeck = await response.json();
    decks.value.push(newDeck);
    newDeckName.value = '';
    showCreateForm.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Delete a deck
 */
async function deleteDeck(deckId: number): Promise<void> {
  if (!confirm('Are you sure you want to delete this deck? All cards in this deck will also be deleted.')) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/decks/${deckId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete deck');
    }

    decks.value = decks.value.filter(d => d.id !== deckId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Navigate to card browser for a deck
 */
function browseDeck(deckId: number): void {
  router.push({ name: 'CardBrowser', params: { deckId } });
}

onMounted(() => {
  fetchDecks();
});
</script>

<template>
  <div class="deck-management-container">
    <header class="header">
      <h1>Manage Decks</h1>
      <button @click="router.push({ name: 'DeckList' })" class="back-button">
        ← Back to Practice
      </button>
    </header>

    <main class="main-content">
      <div v-if="error" class="error">{{ error }}</div>

      <div class="actions">
        <button
          v-if="!showCreateForm"
          @click="showCreateForm = true"
          class="create-button"
        >
          + Create New Deck
        </button>

        <div v-if="showCreateForm" class="create-form">
          <input
            v-model="newDeckName"
            type="text"
            placeholder="Enter deck name..."
            @keyup.enter="createDeck"
            @keyup.escape="showCreateForm = false; newDeckName = ''"
            class="deck-name-input"
          />
          <div class="form-buttons">
            <button @click="createDeck" :disabled="loading" class="save-button">
              Create
            </button>
            <button
              @click="showCreateForm = false; newDeckName = ''"
              class="cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading && decks.length === 0" class="loading">Loading...</div>

      <div v-else-if="decks.length === 0" class="empty-state">
        No decks yet. Create your first deck to get started!
      </div>

      <div v-else class="deck-list">
        <div
          v-for="deck in decks"
          :key="deck.id"
          class="deck-card"
        >
          <div class="deck-info">
            <h3>{{ deck.name }}</h3>
            <p class="card-count">{{ deck.cardCount || 0 }} cards</p>
          </div>
          <div class="deck-actions">
            <button @click="browseDeck(deck.id)" class="browse-button">
              Manage Cards
            </button>
            <button
              @click="deleteDeck(deck.id)"
              :disabled="loading"
              class="delete-button"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.deck-management-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  background-color: #2c3e50;
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    font-size: 1.75rem;
    font-weight: 600;
  }

  .back-button {
    padding: 0.5rem 1rem;
    background-color: #34495e;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;

    &:hover {
      background-color: #2c3e50;
    }
  }
}

.main-content {
  flex: 1;
  padding: 2rem 1rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.error {
  background-color: #fadbd8;
  color: #c0392b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.actions {
  margin-bottom: 2rem;
}

.create-button {
  padding: 1rem 2rem;
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

.create-form {
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.deck-name-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
}

.form-buttons {
  display: flex;
  gap: 0.75rem;
}

.save-button {
  flex: 1;
  padding: 0.75rem;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: #229954;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
}

.cancel-button {
  flex: 1;
  padding: 0.75rem;
  background-color: #ecf0f1;
  color: #2c3e50;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #d5dbdb;
  }
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.deck-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.deck-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.deck-info {
  flex: 1;

  h3 {
    font-size: 1.25rem;
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }

  .card-count {
    color: #7f8c8d;
    font-size: 0.9rem;
  }
}

.deck-actions {
  display: flex;
  gap: 0.75rem;
}

.browse-button {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2980b9;
  }
}

.delete-button {
  padding: 0.75rem 1.5rem;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #c0392b;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
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

  .deck-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .deck-actions {
    width: 100%;
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>
