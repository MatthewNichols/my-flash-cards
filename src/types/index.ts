/**
 * Represents a flash card deck
 */
export interface Deck {
  id: number;
  name: string;
}

/**
 * Represents a single flash card
 */
export interface Card {
  id: number;
  frontText: string;
  backText: string;
  deckId: number;
}

/**
 * Direction of card practice
 */
export type CardDirection = 'spanish-to-english' | 'english-to-spanish';

/**
 * Result of a single card attempt
 */
export interface CardResult {
  cardId: number;
  correct: boolean;
}

/**
 * Session statistics
 */
export interface SessionStats {
  totalCards: number;
  correctCount: number;
  missedCount: number;
}
