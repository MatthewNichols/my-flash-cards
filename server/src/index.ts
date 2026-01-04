import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { decks, cards } from './schema';
import type { Env, DeckResponse, CardResponse } from './types';

const app = new Hono<{ Bindings: Env }>();

/**
 * Enable CORS for local development
 */
app.use('/*', cors());

/**
 * GET /api/decks
 * Retrieve all available decks
 */
app.get('/api/decks', async (c) => {
  const db = drizzle(c.env.DB);

  try {
    const allDecks = await db.select({
      id: decks.id,
      name: decks.name
    }).from(decks);

    const response: DeckResponse[] = allDecks.map(deck => ({
      id: deck.id,
      name: deck.name
    }));

    return c.json(response);
  } catch (error) {
    console.error('Error fetching decks:', error);
    return c.json({ error: 'Failed to fetch decks' }, 500);
  }
});

/**
 * GET /api/decks/:deckId/cards
 * Retrieve all cards for a specific deck
 */
app.get('/api/decks/:deckId/cards', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));

  if (isNaN(deckId)) {
    return c.json({ error: 'Invalid deck ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    const deckCards = await db.select({
      id: cards.id,
      frontText: cards.frontText,
      backText: cards.backText,
      deckId: cards.deckId
    })
    .from(cards)
    .where(eq(cards.deckId, deckId));

    const response: CardResponse[] = deckCards.map(card => ({
      id: card.id,
      frontText: card.frontText,
      backText: card.backText,
      deckId: card.deckId
    }));

    return c.json(response);
  } catch (error) {
    console.error('Error fetching cards:', error);
    return c.json({ error: 'Failed to fetch cards' }, 500);
  }
});

export default app;
