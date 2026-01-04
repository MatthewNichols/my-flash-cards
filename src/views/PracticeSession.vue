<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/store/session';

const router = useRouter();
const sessionStore = useSessionStore();

const isFlipped = ref<boolean>(false);
const isTransitioning = ref<boolean>(false);

/**
 * Progress percentage for visual feedback
 */
const progressPercentage = computed((): number => {
  if (sessionStore.cards.length === 0) return 0;
  return (sessionStore.currentCardIndex / sessionStore.cards.length) * 100;
});

/**
 * Cards remaining count
 */
const cardsRemaining = computed((): number => {
  return sessionStore.cards.length - sessionStore.currentCardIndex;
});

/**
 * Flip the current card
 */
function flipCard(): void {
  isFlipped.value = !isFlipped.value;
}

/**
 * Record answer and move to next card
 */
async function answerCard(correct: boolean): Promise<void> {
  const currentCard = sessionStore.currentCard;
  if (!currentCard) return;

  // Start transition - fade out content
  isTransitioning.value = true;

  // Flip card back first
  isFlipped.value = false;

  // Record attempt to database (async, don't wait for it)
  recordAttemptToDatabase(currentCard.id, correct);

  // Wait for flip animation to complete, then move to next card
  setTimeout(() => {
    sessionStore.recordResult(correct);

    if (sessionStore.isSessionComplete) {
      router.push({ name: 'SessionResults' });
    } else {
      // Fade content back in
      setTimeout(() => {
        isTransitioning.value = false;
      }, 50);
    }
  }, 300);
}

/**
 * Record card attempt to database for spaced repetition tracking
 */
async function recordAttemptToDatabase(cardId: number, correct: boolean): Promise<void> {
  try {
    await fetch('/api/attempts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cardId, correct })
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.error('Failed to record attempt:', error);
  }
}
</script>

<template>
  <div class="practice-session-container">
    <header class="header">
      <h1>Practice Session</h1>
      <div class="progress-info">
        <span>{{ cardsRemaining }} cards remaining</span>
      </div>
    </header>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
    </div>

    <main class="main-content">
      <div v-if="!sessionStore.currentCard" class="no-card">
        <p>No card available</p>
        <button @click="router.push({ name: 'DeckList' })" class="back-button">
          Back to Decks
        </button>
      </div>

      <div v-else class="card-container">
        <div class="card" :class="{ flipped: isFlipped }" @click="flipCard">
          <div class="card-face card-front">
            <div class="card-content" :class="{ 'fade-out': isTransitioning }">
              <div class="card-label">
                {{ sessionStore.direction === 'spanish-to-english' ? 'Spanish' : 'English' }}
              </div>
              <div class="card-text">
                {{ sessionStore.frontText }}
              </div>
              <div class="card-hint">Click to reveal</div>
            </div>
          </div>
          <div class="card-face card-back">
            <div class="card-content" :class="{ 'fade-out': isTransitioning }">
              <div class="card-label">
                {{ sessionStore.direction === 'spanish-to-english' ? 'English' : 'Spanish' }}
              </div>
              <div class="card-text">
                {{ sessionStore.backText }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="isFlipped" class="answer-buttons">
          <button @click.stop="answerCard(false)" class="answer-button missed">
            Missed It
          </button>
          <button @click.stop="answerCard(true)" class="answer-button correct">
            Got It
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.practice-session-container {
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
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .progress-info {
    font-size: 1rem;
    opacity: 0.9;
  }
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  position: relative;

  .progress-fill {
    height: 100%;
    background-color: #3498db;
    transition: width 0.3s ease;
  }
}

.main-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.no-card {
  text-align: center;

  p {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: #666;
  }

  .back-button {
    padding: 0.75rem 2rem;
    font-size: 1rem;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background-color: #2980b9;
    }
  }
}

.card-container {
  width: 100%;
  max-width: 600px;
}

.card {
  position: relative;
  width: 100%;
  min-height: 400px;
  cursor: pointer;
  perspective: 1000px;
  margin-bottom: 2rem;

  .card-face {
    position: absolute;
    width: 100%;
    min-height: 400px;
    background-color: white;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    backface-visibility: hidden;
    transition: transform 0.6s;
  }

  .card-front {
    transform: rotateY(0deg);
  }

  .card-back {
    transform: rotateY(180deg);
  }

  &.flipped {
    .card-front {
      transform: rotateY(-180deg);
    }

    .card-back {
      transform: rotateY(0deg);
    }
  }

  .card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    opacity: 1;
    transition: opacity 0.2s ease;

    &.fade-out {
      opacity: 0;
    }
  }

  .card-label {
    font-size: 0.9rem;
    text-transform: uppercase;
    color: #7f8c8d;
    margin-bottom: 1.5rem;
    letter-spacing: 1px;
  }

  .card-text {
    font-size: 2.5rem;
    font-weight: 500;
    color: #2c3e50;
    text-align: center;
    word-wrap: break-word;
  }

  .card-hint {
    margin-top: 2rem;
    font-size: 0.9rem;
    color: #95a5a6;
    font-style: italic;
  }
}

.answer-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.answer-button {
  flex: 1;
  max-width: 200px;
  padding: 1.25rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;

  &.missed {
    background-color: #e74c3c;

    &:hover {
      background-color: #c0392b;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
    }
  }

  &.correct {
    background-color: #27ae60;

    &:hover {
      background-color: #229954;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
    }
  }
}

@media (max-width: 600px) {
  .header h1 {
    font-size: 1.5rem;
  }

  .main-content {
    padding: 1rem 0.5rem;
  }

  .card {
    min-height: 350px;

    .card-face {
      min-height: 350px;
      padding: 2rem 1.5rem;
    }

    .card-text {
      font-size: 2rem;
    }
  }

  .answer-buttons {
    flex-direction: column;
    gap: 0.75rem;
  }

  .answer-button {
    max-width: 100%;
  }
}

@media (min-width: 601px) and (max-width: 900px) {
  .card {
    min-height: 380px;

    .card-face {
      min-height: 380px;
    }

    .card-text {
      font-size: 2.25rem;
    }
  }
}
</style>
