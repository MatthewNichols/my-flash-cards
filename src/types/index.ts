/**
 * Represents a flash card deck
 */
export interface Deck {
  id: number;
  name: string;
  cardCount?: number;
}

/**
 * Represents a single flash card
 */
export interface Card {
  id: number;
  frontText: string;
  backText: string;
  deckId: number;
  tags?: string;
}

/**
 * Direction of card practice
 */
export type CardDirection = 'spanish-to-english' | 'english-to-spanish' | 'random';

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

/**
 * User roles
 */
export type UserRole = 'admin' | 'user';

/**
 * Represents a user in the admin management context
 */
export interface ManagedUser {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
}
