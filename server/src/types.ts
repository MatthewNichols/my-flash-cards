/**
 * API response types
 */
export interface DeckResponse {
  id: number;
  name: string;
  cardCount?: number;
}

export interface CardResponse {
  id: number;
  frontText: string;
  backText: string;
  deckId: number;
  tags?: string;
}
