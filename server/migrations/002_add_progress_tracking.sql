-- Create card_attempts table to track each practice attempt
CREATE TABLE IF NOT EXISTS card_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create card_schedule table for spaced repetition
CREATE TABLE IF NOT EXISTS card_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL UNIQUE,
  next_review_date DATETIME NOT NULL,
  interval_days INTEGER DEFAULT 1,
  ease_factor REAL DEFAULT 2.5,
  repetitions INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- Create indices for faster lookups
CREATE INDEX IF NOT EXISTS idx_card_attempts_card_id ON card_attempts(card_id);
CREATE INDEX IF NOT EXISTS idx_card_attempts_created_at ON card_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_card_schedule_card_id ON card_schedule(card_id);
CREATE INDEX IF NOT EXISTS idx_card_schedule_next_review ON card_schedule(next_review_date);
