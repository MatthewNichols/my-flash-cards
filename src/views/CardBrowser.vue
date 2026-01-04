<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import CardEditor from '@/components/CardEditor.vue';
import type { Card, Deck } from '@/types';

const router = useRouter();
const route = useRoute();

const deckId = computed(() => parseInt(route.params.deckId as string));
const deck = ref<Deck | null>(null);
const cards = ref<Card[]>([]);
const loading = ref<boolean>(false);
const error = ref<string>('');
const showCreateForm = ref<boolean>(false);
const editingCard = ref<Card | null>(null);

/**
 * Fetch deck information
 */
async function fetchDeck(): Promise<void> {
  try {
    const response = await fetch('/api/decks');
    if (!response.ok) {
      throw new Error('Failed to fetch decks');
    }
    const allDecks: Deck[] = await response.json();
    deck.value = allDecks.find(d => d.id === deckId.value) || null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  }
}

/**
 * Fetch all cards for this deck
 */
async function fetchCards(): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/decks/${deckId.value}/cards`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards');
    }
    cards.value = await response.json();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Create a new card
 */
async function createCard(cardData: { frontText: string; backText: string }): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/decks/${deckId.value}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardData)
    });

    if (!response.ok) {
      throw new Error('Failed to create card');
    }

    const newCard = await response.json();
    cards.value.push(newCard);
    showCreateForm.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Update an existing card
 */
async function updateCard(cardData: { frontText: string; backText: string }): Promise<void> {
  if (!editingCard.value) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/cards/${editingCard.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cardData)
    });

    if (!response.ok) {
      throw new Error('Failed to update card');
    }

    const updatedCard = await response.json();
    const index = cards.value.findIndex(c => c.id === updatedCard.id);
    if (index !== -1) {
      cards.value[index] = updatedCard;
    }
    editingCard.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Delete a card
 */
async function deleteCard(cardId: number): Promise<void> {
  if (!confirm('Are you sure you want to delete this card?')) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`/api/cards/${cardId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete card');
    }

    cards.value = cards.value.filter(c => c.id !== cardId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

/**
 * Start editing a card
 */
function startEditing(card: Card): void {
  editingCard.value = card;
  showCreateForm.value = false;
}

/**
 * Cancel editing or creating
 */
function cancelEdit(): void {
  editingCard.value = null;
  showCreateForm.value = false;
}

onMounted(async () => {
  await fetchDeck();
  await fetchCards();
});
</script>

<template>
  <div class="card-browser-container">
    <header class="header">
      <div>
        <h1>{{ deck?.name || 'Deck' }}</h1>
        <p class="card-count">{{ cards.length }} cards</p>
      </div>
      <button @click="router.push({ name: 'DeckManagement' })" class="back-button">
        ← Back to Decks
      </button>
    </header>

    <main class="main-content">
      <div v-if="error" class="error">{{ error }}</div>

      <div class="actions">
        <button
          v-if="!showCreateForm && !editingCard"
          @click="showCreateForm = true"
          class="add-button"
        >
          + Add New Card
        </button>
      </div>

      <CardEditor
        v-if="showCreateForm"
        :deck-id="deckId"
        @save="createCard"
        @cancel="cancelEdit"
      />

      <CardEditor
        v-if="editingCard"
        :card="editingCard"
        :deck-id="deckId"
        @save="updateCard"
        @cancel="cancelEdit"
      />

      <div v-if="loading && cards.length === 0" class="loading">Loading...</div>

      <div v-else-if="cards.length === 0" class="empty-state">
        No cards yet. Add your first card to get started!
      </div>

      <div v-else class="card-list">
        <div
          v-for="card in cards"
          :key="card.id"
          class="card-item"
        >
          <div class="card-content">
            <div class="card-side">
              <span class="card-label">Spanish</span>
              <span class="card-text">{{ card.frontText }}</span>
            </div>
            <div class="card-divider">→</div>
            <div class="card-side">
              <span class="card-label">English</span>
              <span class="card-text">{{ card.backText }}</span>
            </div>
          </div>
          <div v-if="card.tags" class="card-tags">
            <span
              v-for="tag in card.tags.split(',').filter(t => t.trim())"
              :key="tag"
              class="tag"
            >
              {{ tag.trim() }}
            </span>
          </div>
          <div class="card-actions">
            <button
              @click="startEditing(card)"
              :disabled="loading || !!editingCard || showCreateForm"
              class="edit-button"
            >
              Edit
            </button>
            <button
              @click="deleteCard(card.id)"
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
.card-browser-container {
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
    margin-bottom: 0.25rem;
  }

  .card-count {
    font-size: 0.9rem;
    opacity: 0.9;
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
  max-width: 1000px;
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

.add-button {
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

.loading,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-item {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.card-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.card-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .card-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #7f8c8d;
    letter-spacing: 0.5px;
  }

  .card-text {
    font-size: 1.1rem;
    color: #2c3e50;
    font-weight: 500;
  }
}

.card-divider {
  font-size: 1.5rem;
  color: #bdc3c7;
  font-weight: 300;
}

.card-tags {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #ecf0f1;

  .tag {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background-color: #e3f2fd;
    color: #1976d2;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
  }
}

.card-actions {
  display: flex;
  gap: 0.75rem;
}

.edit-button {
  padding: 0.625rem 1.25rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
}

.delete-button {
  padding: 0.625rem 1.25rem;
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

  .card-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-content {
    width: 100%;
    flex-direction: column;
    gap: 1rem;
  }

  .card-divider {
    transform: rotate(90deg);
  }

  .card-actions {
    width: 100%;
    flex-direction: column;

    button {
      width: 100%;
    }
  }
}
</style>
