import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, lte, and } from 'drizzle-orm';
import { decks, cards, cardAttempts, cardSchedule } from './schema';
import type { Env, DeckResponse, CardResponse } from './types';
import { calculateNextReview, initializeSchedule, isCardDue } from './spacedRepetition';

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
    // Get all decks
    const allDecks = await db.select({
      id: decks.id,
      name: decks.name
    }).from(decks);

    // Get card counts for each deck
    const response: DeckResponse[] = await Promise.all(
      allDecks.map(async (deck) => {
        const countResult = await db.select({
          count: sql<number>`count(*)`
        })
        .from(cards)
        .where(eq(cards.deckId, deck.id));

        return {
          id: deck.id,
          name: deck.name,
          cardCount: countResult[0]?.count || 0
        };
      })
    );

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
      deckId: cards.deckId,
      tags: cards.tags
    })
    .from(cards)
    .where(eq(cards.deckId, deckId));

    const response: CardResponse[] = deckCards.map(card => ({
      id: card.id,
      frontText: card.frontText,
      backText: card.backText,
      deckId: card.deckId,
      tags: card.tags || ''
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
    const { frontText, backText, tags } = body;

    if (!frontText || typeof frontText !== 'string' || frontText.trim().length === 0) {
      return c.json({ error: 'Front text is required' }, 400);
    }

    if (!backText || typeof backText !== 'string' || backText.trim().length === 0) {
      return c.json({ error: 'Back text is required' }, 400);
    }

    const result = await db.insert(cards).values({
      frontText: frontText.trim(),
      backText: backText.trim(),
      deckId,
      tags: tags ? tags.trim() : ''
    }).returning({
      id: cards.id,
      frontText: cards.frontText,
      backText: cards.backText,
      deckId: cards.deckId,
      tags: cards.tags
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
    const { frontText, backText, tags } = body;

    if (!frontText || typeof frontText !== 'string' || frontText.trim().length === 0) {
      return c.json({ error: 'Front text is required' }, 400);
    }

    if (!backText || typeof backText !== 'string' || backText.trim().length === 0) {
      return c.json({ error: 'Back text is required' }, 400);
    }

    const result = await db.update(cards)
      .set({
        frontText: frontText.trim(),
        backText: backText.trim(),
        tags: tags !== undefined ? tags.trim() : undefined
      })
      .where(eq(cards.id, cardId))
      .returning({
        id: cards.id,
        frontText: cards.frontText,
        backText: cards.backText,
        deckId: cards.deckId,
        tags: cards.tags
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

/**
 * POST /api/attempts
 * Record a card attempt and update schedule
 */
app.post('/api/attempts', async (c) => {
  const db = drizzle(c.env.DB);

  try {
    const body = await c.req.json();
    const { cardId, correct } = body;

    if (typeof cardId !== 'number' || typeof correct !== 'boolean') {
      return c.json({ error: 'Invalid request body' }, 400);
    }

    // Record the attempt
    await db.insert(cardAttempts).values({
      cardId,
      correct
    });

    // Get or create schedule for this card
    const existingSchedule = await db.select()
      .from(cardSchedule)
      .where(eq(cardSchedule.cardId, cardId))
      .limit(1);

    const currentSchedule = existingSchedule[0] || {
      intervalDays: 1,
      easeFactor: 2.5,
      repetitions: 0
    };

    // Calculate next review using SM-2 algorithm
    const newSchedule = calculateNextReview(
      correct,
      currentSchedule.intervalDays || 1,
      currentSchedule.easeFactor || 2.5,
      currentSchedule.repetitions || 0
    );

    // Update or insert schedule
    if (existingSchedule.length > 0) {
      await db.update(cardSchedule)
        .set({
          ...newSchedule,
          updatedAt: new Date().toISOString()
        })
        .where(eq(cardSchedule.cardId, cardId));
    } else {
      await db.insert(cardSchedule).values({
        cardId,
        ...newSchedule
      });
    }

    return c.json({ success: true, schedule: newSchedule }, 201);
  } catch (error) {
    console.error('Error recording attempt:', error);
    return c.json({ error: 'Failed to record attempt' }, 500);
  }
});

/**
 * GET /api/decks/:deckId/due-cards
 * Get cards that are due for review in a deck
 */
app.get('/api/decks/:deckId/due-cards', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));

  if (isNaN(deckId)) {
    return c.json({ error: 'Invalid deck ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    const now = new Date().toISOString();

    // Get all cards in the deck with their schedule info
    const deckCards = await db.select({
      id: cards.id,
      frontText: cards.frontText,
      backText: cards.backText,
      deckId: cards.deckId,
      tags: cards.tags,
      nextReviewDate: cardSchedule.nextReviewDate,
      intervalDays: cardSchedule.intervalDays,
      repetitions: cardSchedule.repetitions
    })
    .from(cards)
    .leftJoin(cardSchedule, eq(cards.id, cardSchedule.cardId))
    .where(eq(cards.deckId, deckId));

    // Filter for cards that are due (or have never been reviewed)
    const dueCards = deckCards.filter(card =>
      !card.nextReviewDate || card.nextReviewDate <= now
    );

    const response: CardResponse[] = dueCards.map(card => ({
      id: card.id,
      frontText: card.frontText,
      backText: card.backText,
      deckId: card.deckId,
      tags: card.tags || ''
    }));

    return c.json(response);
  } catch (error) {
    console.error('Error fetching due cards:', error);
    return c.json({ error: 'Failed to fetch due cards' }, 500);
  }
});

/**
 * GET /api/decks/:deckId/stats
 * Get progress statistics for a deck
 */
app.get('/api/decks/:deckId/stats', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));

  if (isNaN(deckId)) {
    return c.json({ error: 'Invalid deck ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    const now = new Date().toISOString();

    // Get total cards in deck
    const totalCardsResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(cards)
    .where(eq(cards.deckId, deckId));

    const totalCards = totalCardsResult[0]?.count || 0;

    // Get cards due for review
    const dueCardsResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(cards)
    .leftJoin(cardSchedule, eq(cards.id, cardSchedule.cardId))
    .where(
      and(
        eq(cards.deckId, deckId),
        sql`(${cardSchedule.nextReviewDate} IS NULL OR ${cardSchedule.nextReviewDate} <= ${now})`
      )
    );

    const dueCards = dueCardsResult[0]?.count || 0;

    // Get total attempts for this deck
    const attemptsResult = await db.select({
      count: sql<number>`count(*)`,
      correct: sql<number>`sum(case when ${cardAttempts.correct} then 1 else 0 end)`
    })
    .from(cardAttempts)
    .innerJoin(cards, eq(cardAttempts.cardId, cards.id))
    .where(eq(cards.deckId, deckId));

    const totalAttempts = attemptsResult[0]?.count || 0;
    const correctAttempts = attemptsResult[0]?.correct || 0;
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    return c.json({
      totalCards,
      dueCards,
      totalAttempts,
      correctAttempts,
      accuracy
    });
  } catch (error) {
    console.error('Error fetching deck stats:', error);
    return c.json({ error: 'Failed to fetch deck stats' }, 500);
  }
});

/**
 * GET /api/decks/:deckId/export
 * Export a deck with all its cards as JSON
 */
app.get('/api/decks/:deckId/export', async (c) => {
  const deckId = parseInt(c.req.param('deckId'));

  if (isNaN(deckId)) {
    return c.json({ error: 'Invalid deck ID' }, 400);
  }

  const db = drizzle(c.env.DB);

  try {
    // Get deck info
    const deckResult = await db.select({
      id: decks.id,
      name: decks.name
    })
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1);

    if (deckResult.length === 0) {
      return c.json({ error: 'Deck not found' }, 404);
    }

    // Get all cards in the deck
    const deckCards = await db.select({
      frontText: cards.frontText,
      backText: cards.backText,
      tags: cards.tags
    })
    .from(cards)
    .where(eq(cards.deckId, deckId));

    const exportData = {
      version: '1.0',
      deck: {
        name: deckResult[0].name,
        cards: deckCards.map(card => ({
          frontText: card.frontText,
          backText: card.backText,
          tags: card.tags || ''
        }))
      },
      exportedAt: new Date().toISOString()
    };

    return c.json(exportData);
  } catch (error) {
    console.error('Error exporting deck:', error);
    return c.json({ error: 'Failed to export deck' }, 500);
  }
});

/**
 * POST /api/decks/import
 * Import a deck from JSON data
 */
app.post('/api/decks/import', async (c) => {
  const db = drizzle(c.env.DB);

  try {
    const body = await c.req.json();
    const { deck } = body;

    if (!deck || !deck.name || !Array.isArray(deck.cards)) {
      return c.json({ error: 'Invalid import format' }, 400);
    }

    // Create the deck
    const deckResult = await db.insert(decks).values({
      name: deck.name.trim()
    }).returning({
      id: decks.id,
      name: decks.name
    });

    const newDeckId = deckResult[0].id;

    // Import all cards
    if (deck.cards.length > 0) {
      const cardValues = deck.cards.map((card: any) => ({
        frontText: card.frontText.trim(),
        backText: card.backText.trim(),
        deckId: newDeckId,
        tags: card.tags ? card.tags.trim() : ''
      }));

      await db.insert(cards).values(cardValues);
    }

    return c.json({
      success: true,
      deck: {
        id: newDeckId,
        name: deckResult[0].name,
        cardCount: deck.cards.length
      }
    }, 201);
  } catch (error) {
    console.error('Error importing deck:', error);
    return c.json({ error: 'Failed to import deck' }, 500);
  }
});

export default app;
