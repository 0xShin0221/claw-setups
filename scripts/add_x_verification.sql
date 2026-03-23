ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS x_username text, ADD COLUMN IF NOT EXISTS x_verified boolean default false;
