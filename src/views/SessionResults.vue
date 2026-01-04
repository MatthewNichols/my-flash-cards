<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/store/session';

const router = useRouter();
const sessionStore = useSessionStore();

/**
 * Calculate success percentage
 */
const successPercentage = computed((): number => {
  if (sessionStore.stats.totalCards === 0) return 0;
  return Math.round((sessionStore.stats.correctCount / sessionStore.stats.totalCards) * 100);
});

/**
 * Get encouragement message based on performance
 */
const encouragementMessage = computed((): string => {
  const percentage = successPercentage.value;
  if (percentage === 100) return 'Perfect! Outstanding work!';
  if (percentage >= 80) return 'Excellent! Keep it up!';
  if (percentage >= 60) return 'Good job! You\'re making progress!';
  if (percentage >= 40) return 'Keep practicing, you\'re improving!';
  return 'Don\'t give up! Practice makes perfect!';
});

/**
 * Return to deck list
 */
function returnToDeckList(): void {
  sessionStore.reset();
  router.push({ name: 'DeckList' });
}

/**
 * Practice again with same deck
 */
function practiceAgain(): void {
  router.push({ name: 'DeckList' });
}
</script>

<template>
  <div class="session-results-container">
    <header class="header">
      <h1>Session Complete!</h1>
    </header>

    <main class="main-content">
      <div class="results-card">
        <div class="encouragement">
          {{ encouragementMessage }}
        </div>

        <div class="score-circle">
          <svg viewBox="0 0 200 200" class="circle-svg">
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#e0e0e0"
              stroke-width="12"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#3498db"
              stroke-width="12"
              :stroke-dasharray="`${successPercentage * 5.65} 565`"
              stroke-linecap="round"
              transform="rotate(-90 100 100)"
            />
          </svg>
          <div class="score-text">
            <div class="percentage">{{ successPercentage }}%</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item total">
            <div class="stat-value">{{ sessionStore.stats.totalCards }}</div>
            <div class="stat-label">Total Cards</div>
          </div>
          <div class="stat-item correct">
            <div class="stat-value">{{ sessionStore.stats.correctCount }}</div>
            <div class="stat-label">Correct</div>
          </div>
          <div class="stat-item missed">
            <div class="stat-value">{{ sessionStore.stats.missedCount }}</div>
            <div class="stat-label">Missed</div>
          </div>
        </div>

        <div class="action-buttons">
          <button @click="practiceAgain" class="action-button primary">
            Practice Again
          </button>
          <button @click="returnToDeckList" class="action-button secondary">
            Back to Decks
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.session-results-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.results-card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 3rem 2rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

.encouragement {
  font-size: 1.5rem;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.score-circle {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 2.5rem;

  .circle-svg {
    width: 100%;
    height: 100%;
  }

  .score-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    .percentage {
      font-size: 3rem;
      font-weight: 700;
      color: #3498db;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-item {
  padding: 1.5rem 1rem;
  border-radius: 12px;

  &.total {
    background-color: #ecf0f1;
  }

  &.correct {
    background-color: #d5f4e6;
  }

  &.missed {
    background-color: #fadbd8;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &.total .stat-value {
    color: #34495e;
  }

  &.correct .stat-value {
    color: #27ae60;
  }

  &.missed .stat-value {
    color: #e74c3c;
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-direction: column;
}

.action-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.primary {
    background-color: #3498db;
    color: white;

    &:hover {
      background-color: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
  }

  &.secondary {
    background-color: #ecf0f1;
    color: #2c3e50;

    &:hover {
      background-color: #d5dbdb;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
}

@media (max-width: 600px) {
  .header h1 {
    font-size: 1.5rem;
  }

  .results-card {
    padding: 2rem 1.5rem;
  }

  .encouragement {
    font-size: 1.25rem;
  }

  .score-circle {
    width: 160px;
    height: 160px;

    .percentage {
      font-size: 2.5rem;
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-item {
    padding: 1rem;

    .stat-value {
      font-size: 2rem;
    }
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .results-card {
    padding: 2.5rem 2rem;
  }

  .stats-grid {
    gap: 1.25rem;
  }
}
</style>
