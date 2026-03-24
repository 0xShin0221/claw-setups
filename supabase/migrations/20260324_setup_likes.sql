-- Setup Likes Table
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS setup_likes (
  setup_id TEXT NOT NULL,
  user_hash TEXT NOT NULL,  -- SHA-256 of IP+UA (privacy-safe fingerprint)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (setup_id, user_hash)
);

-- Like count view (fast reads)
CREATE OR REPLACE VIEW setup_like_counts AS
  SELECT setup_id, COUNT(*) as like_count
  FROM setup_likes
  GROUP BY setup_id;

-- Index for fast per-setup queries
CREATE INDEX IF NOT EXISTS idx_setup_likes_setup_id ON setup_likes(setup_id);
