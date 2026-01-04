<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/store/session';
import type { Deck, Card, CardDirection } from '@/types';

const router = useRouter();
const sessionStore = useSessionStore();

const decks = ref<Deck[]>([]);
const selectedDeckId = ref<number | null>(null);
const selectedDirection = ref<CardDirection>('spanish-to-english');
const loading = ref<boolean>(false);
const error = ref<string>('');

/**
 * Fetch available decks from API
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
 * Start practice session with selected deck and direction
 */
async function startPractice(): Promise<void> {
  if (!selectedDeckId.value) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/decks/${selectedDeckId.value}/cards`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards');
    }
    const cards: Card[] = await response.json();

    if (cards.length === 0) {
      error.value = 'This deck has no cards';
      return;
    }

    sessionStore.startSession(cards, selectedDirection.value);
    router.push({ name: 'PracticeSession', params: { deckId: selectedDeckId.value } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchDecks();
});
</script>

<template>
  <div class="deck-list-container">
    <header class="header">
      <h1>My Flash Cards</h1>
    </header>

    <main class="main-content">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="deck-selection">
        <h2>Select a Deck</h2>

        <div v-if="decks.length === 0" class="empty-state">
          No decks available
        </div>

        <div v-else class="deck-list">
          <div
            v-for="deck in decks"
            :key="deck.id"
            class="deck-item"
            :class="{ selected: selectedDeckId === deck.id }"
            @click="selectedDeckId = deck.id"
          >
            <h3>{{ deck.name }}</h3>
          </div>
        </div>

        <div v-if="selectedDeckId" class="direction-selection">
          <h3>Choose Direction</h3>
          <div class="direction-options">
            <label class="direction-option">
              <input
                type="radio"
                v-model="selectedDirection"
                value="spanish-to-english"
              />
              <span>Spanish → English</span>
            </label>
            <label class="direction-option">
              <input
                type="radio"
                v-model="selectedDirection"
                value="english-to-spanish"
              />
              <span>English → Spanish</span>
            </label>
          </div>

          <button
            class="start-button"
            @click="startPractice"
            :disabled="loading"
          >
            Start Practice
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.deck-list-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #2c3e50;
  color: white;
  padding: 1.5rem;
  text-align: center;

  h1 {
    font-size: 2rem;
    font-weight: 600;
  }
}

.main-content {
  flex: 1;
  padding: 2rem 1rem;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.loading,
.error,
.empty-state {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  color: #e74c3c;
}

.deck-selection {
  h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: #2c3e50;
  }
}

.deck-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.deck-item {
  background-color: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &.selected {
    border-color: #3498db;
    background-color: #ebf5fb;
  }

  h3 {
    font-size: 1.25rem;
    color: #2c3e50;
  }
}

.direction-selection {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 1.25rem;
    margin-bottom: 1rem;
    color: #2c3e50;
  }
}

.direction-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.direction-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 1.1rem;

  input[type="radio"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }
}

.start-button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background-color: #3498db;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }
}

@media (max-width: 600px) {
  .header h1 {
    font-size: 1.5rem;
  }

  .main-content {
    padding: 1rem 0.5rem;
  }

  .deck-item {
    padding: 1rem;
  }

  .direction-selection {
    padding: 1.5rem;
  }
}
</style>
