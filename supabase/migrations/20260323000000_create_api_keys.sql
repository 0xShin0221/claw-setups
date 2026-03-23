create table if not exists api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  key_hash text unique not null,
  key_prefix text not null,
  github_username text,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  submission_count int default 0,
  revoked boolean default false
);

alter table api_keys enable row level security;

create policy "Users manage own keys" on api_keys
  for all using (auth.uid() = user_id);
