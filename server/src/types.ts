/**
 * Cloudflare Workers environment bindings
 */
export interface Env {
  DB: D1Database;
}

/**
 * API response types
 */
export interface DeckResponse {
  id: number;
  name: string;
}

export interface CardResponse {
  id: number;
  frontText: string;
  backText: string;
  deckId: number;
}
