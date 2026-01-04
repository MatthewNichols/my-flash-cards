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
const quizSize = ref<number | null>(null);
const selectedTags = ref<string>('');
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
 * Start practice session with all cards in selected deck
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
    let cards: Card[] = await response.json();

    if (cards.length === 0) {
      error.value = 'This deck has no cards';
      return;
    }

    // Filter by tags if selected
    if (selectedTags.value.trim()) {
      const filterTags = selectedTags.value.split(',').map(t => t.trim().toLowerCase());
      cards = cards.filter(card => {
        if (!card.tags) return false;
        const cardTags = card.tags.split(',').map(t => t.trim().toLowerCase());
        return filterTags.some(filterTag => cardTags.includes(filterTag));
      });

      if (cards.length === 0) {
        error.value = `No cards found with tags: ${selectedTags.value}`;
        return;
      }
    }

    // If quiz size is selected, randomly select that many cards
    if (quizSize.value && quizSize.value < cards.length) {
      cards = shuffleArray(cards).slice(0, quizSize.value);
    }

    sessionStore.startSession(cards, selectedDirection.value);
    router.push({ name: 'PracticeSession', params: { deckId: selectedDeckId.value } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Start review session with only due cards
 */
async function startReview(): Promise<void> {
  if (!selectedDeckId.value) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/decks/${selectedDeckId.value}/due-cards`);
    if (!response.ok) {
      throw new Error('Failed to fetch due cards');
    }
    let cards: Card[] = await response.json();

    if (cards.length === 0) {
      error.value = 'No cards are due for review yet! Great job keeping up!';
      return;
    }

    // Filter by tags if selected
    if (selectedTags.value.trim()) {
      const filterTags = selectedTags.value.split(',').map(t => t.trim().toLowerCase());
      cards = cards.filter(card => {
        if (!card.tags) return false;
        const cardTags = card.tags.split(',').map(t => t.trim().toLowerCase());
        return filterTags.some(filterTag => cardTags.includes(filterTag));
      });

      if (cards.length === 0) {
        error.value = `No due cards found with tags: ${selectedTags.value}`;
        return;
      }
    }

    // If quiz size is selected, randomly select that many cards
    if (quizSize.value && quizSize.value < cards.length) {
      cards = shuffleArray(cards).slice(0, quizSize.value);
    }

    sessionStore.startSession(cards, selectedDirection.value);
    router.push({ name: 'PracticeSession', params: { deckId: selectedDeckId.value } });
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Fisher-Yates shuffle algorithm to randomize array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

onMounted(() => {
  fetchDecks();
});
</script>

<template>
  <div class="deck-list-container">
    <header class="header">
      <h1>My Flash Cards</h1>
      <div class="header-buttons">
        <button @click="router.push({ name: 'Progress' })" class="progress-button">
          Progress
        </button>
        <button @click="router.push({ name: 'DeckManagement' })" class="manage-button">
          Manage Decks
        </button>
      </div>
    </header>

    <main class="main-content">
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="deck-selection">
        <h2>Select a Deck</h2>

        <div v-if="decks.length === 0" class="empty-state">
          <p>No decks available</p>
          <button @click="router.push({ name: 'DeckManagement' })" class="create-deck-button">
            Create Your First Deck
          </button>
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
            <p class="card-count">{{ deck.cardCount || 0 }} cards</p>
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
            <label class="direction-option">
              <input
                type="radio"
                v-model="selectedDirection"
                value="random"
              />
              <span>🎲 Random (changes each card)</span>
            </label>
          </div>

          <h3>Quick Quiz (Optional)</h3>
          <div class="quiz-size-options">
            <label class="quiz-option">
              <input
                type="radio"
                v-model="quizSize"
                :value="null"
              />
              <span>All Cards</span>
            </label>
            <label class="quiz-option">
              <input
                type="radio"
                v-model="quizSize"
                :value="1"
              />
              <span>1 Card</span>
            </label>
            <label class="quiz-option">
              <input
                type="radio"
                v-model="quizSize"
                :value="3"
              />
              <span>3 Cards</span>
            </label>
            <label class="quiz-option">
              <input
                type="radio"
                v-model="quizSize"
                :value="5"
              />
              <span>5 Cards</span>
            </label>
          </div>

          <h3>Filter by Tags (Optional)</h3>
          <div class="tags-filter">
            <input
              v-model="selectedTags"
              type="text"
              placeholder="e.g., food, verbs (comma-separated)"
              class="tags-input"
            />
            <small class="hint">Enter tags to practice only matching cards</small>
          </div>

          <div class="practice-buttons">
            <button
              class="start-button review"
              @click="startReview"
              :disabled="loading"
            >
              {{ quizSize ? `Quick Review (${quizSize})` : 'Review Due Cards' }}
            </button>
            <button
              class="start-button practice"
              @click="startPractice"
              :disabled="loading"
            >
              {{ quizSize ? `Quick Practice (${quizSize})` : 'Practice All Cards' }}
            </button>
          </div>
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
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    font-size: 2rem;
    font-weight: 600;
  }

  .header-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .progress-button,
  .manage-button {
    padding: 0.625rem 1.25rem;
    background-color: #34495e;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #2c3e50;
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

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
}

.error {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #e74c3c;
}

.empty-state {
  text-align: center;
  padding: 2rem;

  p {
    font-size: 1.2rem;
    color: #7f8c8d;
    margin-bottom: 1.5rem;
  }

  .create-deck-button {
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
    margin-bottom: 0.5rem;
  }

  .card-count {
    font-size: 0.9rem;
    color: #7f8c8d;
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

.quiz-size-options {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.quiz-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.5rem 0.75rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e9ecef;
  }

  input[type="radio"] {
    width: 1.1rem;
    height: 1.1rem;
    cursor: pointer;
  }
}

.tags-filter {
  margin-bottom: 2rem;

  .tags-input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 6px;
    transition: border-color 0.2s ease;
    margin-bottom: 0.5rem;

    &:focus {
      outline: none;
      border-color: #3498db;
    }

    &::placeholder {
      color: #bdc3c7;
    }
  }

  .hint {
    display: block;
    font-size: 0.8rem;
    color: #7f8c8d;
  }
}

.practice-buttons {
  display: flex;
  gap: 1rem;
}

.start-button {
  flex: 1;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.review {
    background-color: #27ae60;

    &:hover:not(:disabled) {
      background-color: #229954;
    }
  }

  &.practice {
    background-color: #3498db;

    &:hover:not(:disabled) {
      background-color: #2980b9;
    }
  }

  &:disabled {
    background-color: #bdc3c7;
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

    .header-buttons {
      width: 100%;
      flex-direction: column;
    }

    .progress-button,
    .manage-button {
      width: 100%;
    }
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

  .quiz-size-options {
    flex-direction: column;
  }

  .practice-buttons {
    flex-direction: column;
  }
}
</style>
