-- Add tags column to cards table
-- Tags are stored as comma-separated values (e.g., "food,vegetables,beginner")

ALTER TABLE cards ADD COLUMN tags TEXT DEFAULT '';

-- Add index for better tag search performance
CREATE INDEX idx_cards_tags ON cards(tags);
