import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Decks table schema
 */
export const decks = sqliteTable('decks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

/**
 * Cards table schema
 */
export const cards = sqliteTable('cards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  frontText: text('front_text').notNull(),
  backText: text('back_text').notNull(),
  deckId: integer('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

/**
 * Card attempts table schema - tracks each practice attempt
 */
export const cardAttempts = sqliteTable('card_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: integer('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  correct: integer('correct', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

/**
 * Card schedule table schema - manages spaced repetition scheduling
 */
export const cardSchedule = sqliteTable('card_schedule', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: integer('card_id').notNull().unique().references(() => cards.id, { onDelete: 'cascade' }),
  nextReviewDate: text('next_review_date').notNull(),
  intervalDays: integer('interval_days').default(1),
  easeFactor: real('ease_factor').default(2.5),
  repetitions: integer('repetitions').default(0),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});
