import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { eq, sql, and } from 'drizzle-orm';
import { db } from './db.js';
import { decks, cards, cardAttempts, cardSchedule, users, sessions } from './schema.js';
import type { DeckResponse, CardResponse } from './types.js';
import { calculateNextReview, initializeSchedule, isCardDue } from './spacedRepetition.js';
import { hashPassword, verifyPassword, generateSessionId, getSessionExpiration } from './auth.js';

type Variables = {
  userId?: number;
};

const app = new Hono<{ Variables: Variables }>();

/**
 * Enable CORS for local development with credentials support
 */
app.use('/*', cors({
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

/**
 * Authentication middleware - extract user from session cookie
 */
async function authMiddleware(c: any, next: any) {
  const sessionId = getCookie(c, 'session_id');

  if (sessionId) {
    const now = new Date();

    const sessionResult = await db.select({
      userId: sessions.userId,
      expiresAt: sessions.expiresAt
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

    if (sessionResult.length > 0 && sessionResult[0].expiresAt > now) {
      c.set('userId', sessionResult[0].userId);
    }
  }

  await next();
}

app.use('/*', authMiddleware);

/**
 * POST /api/auth/register
 * Register a new user account
 */
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return c.json({ error: 'Valid email is required' }, 400);
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userResult = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name: name || null
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name
    });

    const user = userResult[0];

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = getSessionExpiration();

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt
    });

    // Set session cookie
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    }, 201);
  } catch (error) {
    console.error('Error registering user:', error);
    return c.json({ error: 'Failed to register user' }, 500);
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Find user by email
    const userResult = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (userResult.length === 0) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const user = userResult[0];

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = getSessionExpiration();

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt
    });

    // Set session cookie
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'Lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return c.json({ error: 'Failed to login' }, 500);
  }
});

/**
 * POST /api/auth/logout
 * Logout and destroy session
 */
app.post('/api/auth/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id');

  if (sessionId) {
    try {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  deleteCookie(c, 'session_id', { path: '/' });

  return c.json({ success: true });
});

/**
 * GET /api/auth/me
 * Get current user information
 */
app.get('/api/auth/me', async (c) => {
  const userId = c.get('userId');

  if (!userId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  try {
    const userResult = await db.select({
      id: users.id,
      email: users.email,
      name: users.name
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    if (userResult.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: userResult[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

/**
 * GET /api/decks
 * Retrieve all decks for the current user with card counts
 */
app.get('/api/decks', async (c) => {
  const userId = c.get('userId');

  try {
    // Get all decks for user (or all decks if no user - backward compatibility)
    const allDecks = await db.select({
      id: decks.id,
      name: decks.name
    })
    .from(decks)
    .where(userId ? eq(decks.userId, userId) : sql`1=1`);

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
 * Create a new deck for the current user
 */
app.post('/api/decks', async (c) => {
  const userId = c.get('userId');

  try {
    const body = await c.req.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return c.json({ error: 'Deck name is required' }, 400);
    }

    const result = await db.insert(decks).values({
      name: name.trim(),
      userId: userId || null // Allow null for backward compatibility
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
          updatedAt: new Date()
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

  try {
    const now = new Date();

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

  try {
    const now = new Date();

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
 * Import a deck from JSON data for the current user
 */
app.post('/api/decks/import', async (c) => {
  const userId = c.get('userId');

  try {
    const body = await c.req.json();
    const { deck } = body;

    if (!deck || !deck.name || !Array.isArray(deck.cards)) {
      return c.json({ error: 'Invalid import format' }, 400);
    }

    // Create the deck
    const deckResult = await db.insert(decks).values({
      name: deck.name.trim(),
      userId: userId || null // Allow null for backward compatibility
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

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  app.use('/*', serveStatic({ root: './public' }));
}

const port = parseInt(process.env.PORT || '3001');

serve({
  fetch: app.fetch,
  port,
}, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

export default app;
