<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Deck } from '@/types';

const router = useRouter();

interface DeckStats {
  deckId: number;
  deckName: string;
  totalCards: number;
  dueCards: number;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
}

const deckStats = ref<DeckStats[]>([]);
const loading = ref<boolean>(false);
const error = ref<string>('');

/**
 * Fetch progress stats for all decks
 */
async function fetchAllStats(): Promise<void> {
  loading.value = true;
  error.value = '';

  try {
    // First get all decks
    const decksResponse = await fetch('/api/decks');
    if (!decksResponse.ok) {
      throw new Error('Failed to fetch decks');
    }
    const decks: Deck[] = await decksResponse.json();

    // Then fetch stats for each deck
    const statsPromises = decks.map(async (deck) => {
      const statsResponse = await fetch(`/api/decks/${deck.id}/stats`);
      if (!statsResponse.ok) {
        throw new Error(`Failed to fetch stats for deck ${deck.id}`);
      }
      const stats = await statsResponse.json();
      return {
        deckId: deck.id,
        deckName: deck.name,
        ...stats
      };
    });

    deckStats.value = await Promise.all(statsPromises);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchAllStats();
});
</script>

<template>
  <div class="progress-container">
    <header class="header">
      <h1>Your Progress</h1>
      <button @click="router.push({ name: 'DeckList' })" class="back-button">
        ← Back to Decks
      </button>
    </header>

    <main class="main-content">
      <div v-if="loading" class="loading">Loading stats...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else-if="deckStats.length === 0" class="empty-state">
        No decks found. Create a deck to start tracking your progress!
      </div>

      <div v-else class="stats-grid">
        <div
          v-for="stats in deckStats"
          :key="stats.deckId"
          class="deck-stats-card"
        >
          <h2 class="deck-name">{{ stats.deckName }}</h2>

          <div class="stats-row">
            <div class="stat-box total">
              <div class="stat-value">{{ stats.totalCards }}</div>
              <div class="stat-label">Total Cards</div>
            </div>
            <div class="stat-box due">
              <div class="stat-value">{{ stats.dueCards }}</div>
              <div class="stat-label">Due for Review</div>
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-box attempts">
              <div class="stat-value">{{ stats.totalAttempts }}</div>
              <div class="stat-label">Total Attempts</div>
            </div>
            <div class="stat-box accuracy">
              <div class="stat-value">{{ stats.accuracy }}%</div>
              <div class="stat-label">Accuracy</div>
            </div>
          </div>

          <button
            v-if="stats.dueCards > 0"
            @click="router.push({ name: 'DeckList' })"
            class="review-button"
          >
            Review {{ stats.dueCards }} Card{{ stats.dueCards > 1 ? 's' : '' }}
          </button>
          <div v-else class="all-caught-up">
            All caught up!
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.progress-container {
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
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.loading,
.error,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  font-size: 1.1rem;
  color: #7f8c8d;
}

.error {
  color: #e74c3c;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.deck-stats-card {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .deck-name {
    font-size: 1.5rem;
    color: #2c3e50;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 0.75rem;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-box {
  padding: 1.25rem;
  border-radius: 8px;
  text-align: center;

  &.total {
    background-color: #ecf0f1;
  }

  &.due {
    background-color: #fff3cd;
  }

  &.attempts {
    background-color: #d1ecf1;
  }

  &.accuracy {
    background-color: #d4edda;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-size: 0.85rem;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &.total .stat-value {
    color: #34495e;
  }

  &.due .stat-value {
    color: #f39c12;
  }

  &.attempts .stat-value {
    color: #3498db;
  }

  &.accuracy .stat-value {
    color: #27ae60;
  }
}

.review-button {
  width: 100%;
  padding: 1rem;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 1rem;

  &:hover {
    background-color: #229954;
  }
}

.all-caught-up {
  text-align: center;
  padding: 1rem;
  color: #27ae60;
  font-weight: 600;
  font-size: 1.1rem;
  margin-top: 1rem;
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

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
