import { pgTable, serial, text, integer, boolean, real, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users table schema
 */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * Sessions table schema
 */
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * Decks table schema
 */
export const decks = pgTable('decks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * Cards table schema
 */
export const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  frontText: text('front_text').notNull(),
  backText: text('back_text').notNull(),
  deckId: integer('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  tags: text('tags').default(''),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * Card attempts table schema - tracks each practice attempt
 */
export const cardAttempts = pgTable('card_attempts', {
  id: serial('id').primaryKey(),
  cardId: integer('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  correct: boolean('correct').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

/**
 * Card schedule table schema - manages spaced repetition scheduling
 */
export const cardSchedule = pgTable('card_schedule', {
  id: serial('id').primaryKey(),
  cardId: integer('card_id').notNull().unique().references(() => cards.id, { onDelete: 'cascade' }),
  nextReviewDate: timestamp('next_review_date').notNull(),
  intervalDays: integer('interval_days').default(1),
  easeFactor: real('ease_factor').default(2.5),
  repetitions: integer('repetitions').default(0),
  updatedAt: timestamp('updated_at').defaultNow()
});
