-- Setup Views Table
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS setup_views (
  setup_id TEXT PRIMARY KEY,
  view_count BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast upsert function
CREATE OR REPLACE FUNCTION increment_view(p_setup_id TEXT)
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  INSERT INTO setup_views (setup_id, view_count, updated_at)
  VALUES (p_setup_id, 1, NOW())
  ON CONFLICT (setup_id) DO UPDATE
    SET view_count = setup_views.view_count + 1,
        updated_at = NOW()
  RETURNING view_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;
