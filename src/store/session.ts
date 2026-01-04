import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Card, CardDirection, CardResult, SessionStats } from '@/types';

/**
 * Store for managing practice session state
 */
export const useSessionStore = defineStore('session', () => {
  const cards = ref<Card[]>([]);
  const direction = ref<CardDirection>('spanish-to-english');
  const currentCardIndex = ref<number>(0);
  const results = ref<CardResult[]>([]);

  /**
   * Get the current card being practiced
   */
  const currentCard = computed((): Card | null => {
    if (currentCardIndex.value >= cards.value.length) {
      return null;
    }
    return cards.value[currentCardIndex.value];
  });

  /**
   * Get the front text based on current direction
   */
  const frontText = computed((): string => {
    if (!currentCard.value) return '';
    return direction.value === 'spanish-to-english'
      ? currentCard.value.frontText
      : currentCard.value.backText;
  });

  /**
   * Get the back text based on current direction
   */
  const backText = computed((): string => {
    if (!currentCard.value) return '';
    return direction.value === 'spanish-to-english'
      ? currentCard.value.backText
      : currentCard.value.frontText;
  });

  /**
   * Check if session is complete
   */
  const isSessionComplete = computed((): boolean => {
    return currentCardIndex.value >= cards.value.length;
  });

  /**
   * Get session statistics
   */
  const stats = computed((): SessionStats => {
    const correctCount = results.value.filter(r => r.correct).length;
    return {
      totalCards: results.value.length,
      correctCount,
      missedCount: results.value.length - correctCount
    };
  });

  /**
   * Initialize a new practice session
   */
  function startSession(sessionCards: Card[], sessionDirection: CardDirection): void {
    cards.value = [...sessionCards];
    direction.value = sessionDirection;
    currentCardIndex.value = 0;
    results.value = [];
  }

  /**
   * Record result for current card and move to next
   */
  function recordResult(correct: boolean): void {
    if (!currentCard.value) return;

    results.value.push({
      cardId: currentCard.value.id,
      correct
    });

    currentCardIndex.value++;
  }

  /**
   * Reset the session store
   */
  function reset(): void {
    cards.value = [];
    direction.value = 'spanish-to-english';
    currentCardIndex.value = 0;
    results.value = [];
  }

  return {
    cards,
    direction,
    currentCardIndex,
    results,
    currentCard,
    frontText,
    backText,
    isSessionComplete,
    stats,
    startSession,
    recordResult,
    reset
  };
});
