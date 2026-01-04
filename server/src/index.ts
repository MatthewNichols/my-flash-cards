import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { decks, cards } from './schema';
import type { Env, DeckResponse, CardResponse } from './types';

const app = new Hono<{ Bindings: Env }>();

/**
 * Enable CORS for local development
 */
app.use('/*', cors());

/**
 * GET /api/decks
 * Retrieve all available decks with card counts
 */
app.get('/api/decks', async (c) => {
  const db = drizzle(c.env.DB);

  try {
    const allDecks = await db.select({
      id: decks.id,
      name: decks.name,
      cardCount: sql<number>`(SELECT COUNT(*) FROM ${cards} WHERE ${cards.deckId} = ${decks.id})`
    }).from(decks);

    const response: DeckResponse[] = allDecks.map(deck => ({
      id: deck.id,
      name: deck.name,
      cardCount: deck.cardCount
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

/**
 * POST /api/decks
 * Create a new deck
 */
app.post('/api/decks', async (c) => {
  const db = drizzle(c.env.DB);

  try {
    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Deck name is required' }, 400);
    }

    const result = await db.insert(decks).values({
      name: name.trim()
    }).returning({
      id: decks.id,
      name: decks.name
    });

    return c.json(result[0], 201);
  } catch (error) {
    console.error('Error creating deck:', error);
    return c.json({ error: 'Failed to create deck' }, 500);
  }
});

/**
 * POST /api/decks/:deckId/cards
 * Create a new card in a deck
 */
app.post('/api/decks/:deckId/cards', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));

  if (isNaN(deckId)) {
    return c.json({ error: 'Invalid deck ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    const body = await c.req.json();
    const { frontText, backText } = body;

    if (!frontText || typeof frontText !== 'string' || frontText.trim().length === 0) {
      return c.json({ error: 'Front text is required' }, 400);
    }

    if (!backText || typeof backText !== 'string' || backText.trim().length === 0) {
      return c.json({ error: 'Back text is required' }, 400);
    }

    const result = await db.insert(cards).values({
      frontText: frontText.trim(),
      backText: backText.trim(),
      deckId
    }).returning({
      id: cards.id,
      frontText: cards.frontText,
      backText: cards.backText,
      deckId: cards.deckId
    });

    return c.json(result[0], 201);
  } catch (error) {
    console.error('Error creating card:', error);
    return c.json({ error: 'Failed to create card' }, 500);
  }
});

/**
 * PUT /api/cards/:cardId
 * Update an existing card
 */
app.put('/api/cards/:cardId', async (c) => {
  const cardId = parseInt(c.req.param('cardId'));

  if (isNaN(cardId)) {
    return c.json({ error: 'Invalid card ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    const body = await c.req.json();
    const { frontText, backText } = body;

    if (!frontText || typeof frontText !== 'string' || frontText.trim().length === 0) {
      return c.json({ error: 'Front text is required' }, 400);
    }

    if (!backText || typeof backText !== 'string' || backText.trim().length === 0) {
      return c.json({ error: 'Back text is required' }, 400);
    }

    const result = await db.update(cards)
      .set({
        frontText: frontText.trim(),
        backText: backText.trim()
      })
      .where(eq(cards.id, cardId))
      .returning({
        id: cards.id,
        frontText: cards.frontText,
        backText: cards.backText,
        deckId: cards.deckId
      });

    if (result.length === 0) {
      return c.json({ error: 'Card not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('Error updating card:', error);
    return c.json({ error: 'Failed to update card' }, 500);
  }
});

/**
 * DELETE /api/cards/:cardId
 * Delete a card
 */
app.delete('/api/cards/:cardId', async (c) => {
  const cardId = parseInt(c.req.param('cardId'));

  if (isNaN(cardId)) {
    return c.json({ error: 'Invalid card ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    const result = await db.delete(cards)
      .where(eq(cards.id, cardId))
      .returning({ id: cards.id });

    if (result.length === 0) {
      return c.json({ error: 'Card not found' }, 404);
    }

    return c.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error deleting card:', error);
    return c.json({ error: 'Failed to delete card' }, 500);
  }
});

/**
 * PUT /api/decks/:deckId
 * Update a deck's name
 */
app.put('/api/decks/:deckId', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));

  if (isNaN(deckId)) {
    return c.json({ error: 'Invalid deck ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Deck name is required' }, 400);
    }

    const result = await db.update(decks)
      .set({
        name: name.trim()
      })
      .where(eq(decks.id, deckId))
      .returning({
        id: decks.id,
        name: decks.name
      });

    if (result.length === 0) {
      return c.json({ error: 'Deck not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('Error updating deck:', error);
    return c.json({ error: 'Failed to update deck' }, 500);
  }
});

/**
 * DELETE /api/decks/:deckId
 * Delete a deck and all its cards
 */
app.delete('/api/decks/:deckId', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));

  if (isNaN(deckId)) {
    return c.json({ error: 'Invalid deck ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    const result = await db.delete(decks)
      .where(eq(decks.id, deckId))
      .returning({ id: decks.id });

    if (result.length === 0) {
      return c.json({ error: 'Deck not found' }, 404);
    }

    return c.json({ success: true, id: result[0].id });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return c.json({ error: 'Failed to delete deck' }, 500);
  }
});

export default app;
