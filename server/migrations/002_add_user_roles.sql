-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Index for role lookups (finding admins on startup)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
