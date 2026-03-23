#!/usr/bin/env bash
# setup-supabase.sh — Fully automated Supabase + Vercel setup for claw-setups
# Usage: bash scripts/setup-supabase.sh
# Requires: supabase CLI, vercel CLI, gh CLI

set -e

echo "🦞 claw-setups Supabase setup"
echo "================================"

# 1. Get Supabase Access Token
echo ""
echo "📋 Step 1: Supabase Access Token"
echo "Get it from: https://app.supabase.com/account/tokens"
read -s -p "Paste your Supabase Access Token: " SUPABASE_TOKEN
echo ""

# 2. Login to Supabase CLI
echo "🔐 Logging in to Supabase CLI..."
supabase login --token "$SUPABASE_TOKEN"

# 3. Create Supabase project
echo ""
echo "📋 Step 2: Create Supabase project"
read -p "Project name [claw-setups]: " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-claw-setups}
read -s -p "DB password (min 8 chars): " DB_PASSWORD
echo ""
read -p "Region [ap-northeast-1 (Tokyo)]: " REGION
REGION=${REGION:-ap-northeast-1}
ORG_ID=$(supabase orgs list --json 2>/dev/null | python3 -c "import json,sys; orgs=json.load(sys.stdin); print(orgs[0]['id'])" 2>/dev/null || echo "")
if [ -z "$ORG_ID" ]; then
  echo "Orgs:"
  supabase orgs list
  read -p "Enter org ID: " ORG_ID
fi

echo "Creating project $PROJECT_NAME in $REGION..."
PROJECT_REF=$(supabase projects create "$PROJECT_NAME" \
  --db-password "$DB_PASSWORD" \
  --region "$REGION" \
  --org-id "$ORG_ID" \
  --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])" 2>/dev/null)

if [ -z "$PROJECT_REF" ]; then
  echo "⚠️  Could not auto-detect project ref. List your projects:"
  supabase projects list
  read -p "Enter project ref: " PROJECT_REF
fi

echo "✅ Project created: $PROJECT_REF"
echo "⏳ Waiting 15s for project to initialize..."
sleep 15

# 4. Get API keys
echo ""
echo "📋 Step 3: Fetching API keys..."
KEYS=$(supabase projects api-keys --project-ref "$PROJECT_REF" --json 2>/dev/null)
ANON_KEY=$(echo "$KEYS" | python3 -c "import json,sys; keys=json.load(sys.stdin); print(next(k['api_key'] for k in keys if k['name']=='anon'))" 2>/dev/null)
SERVICE_KEY=$(echo "$KEYS" | python3 -c "import json,sys; keys=json.load(sys.stdin); print(next(k['api_key'] for k in keys if k['name']=='service_role'))" 2>/dev/null)
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo "URL: $SUPABASE_URL"
echo "Anon key: ${ANON_KEY:0:20}..."

# 5. GitHub OAuth setup
echo ""
echo "📋 Step 4: GitHub OAuth App"
echo "Create at: https://github.com/settings/applications/new"
echo "  Homepage URL: https://claw-setups.vercel.app"
echo "  Callback URL: https://claw-setups.vercel.app/auth/callback"
read -s -p "GitHub OAuth Client ID: " GH_CLIENT_ID
echo ""
read -s -p "GitHub OAuth Client Secret: " GH_CLIENT_SECRET
echo ""

# Enable GitHub OAuth via Management API
echo "Enabling GitHub OAuth in Supabase..."
curl -s -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"external_github_enabled\": true,
    \"external_github_client_id\": \"$GH_CLIENT_ID\",
    \"external_github_secret\": \"$GH_CLIENT_SECRET\",
    \"site_url\": \"https://claw-setups.vercel.app\",
    \"additional_redirect_urls\": [\"https://claw-setups.vercel.app/auth/callback\", \"http://localhost:3000/auth/callback\"]
  }" | python3 -c "import json,sys; d=json.load(sys.stdin); print('✅ OAuth configured' if 'external_github_enabled' in d else f'⚠️ Response: {d}')"

# 6. Run database migration
echo ""
echo "📋 Step 5: Creating api_keys table..."
cd "$(dirname "$0")/.."
supabase db push --project-ref "$PROJECT_REF" --db-url "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" 2>/dev/null || \
  psql "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" -c "
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
    create policy if not exists \"Users manage own keys\" on api_keys for all using (auth.uid() = user_id);
  " 2>/dev/null || echo "⚠️ Could not auto-run migration. Run manually in Supabase SQL Editor."

# 7. Set Vercel env vars
echo ""
echo "📋 Step 6: Setting Vercel environment variables..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
echo "$ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force
echo "$SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force

echo ""
echo "✅ All done! Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Setup complete!"
echo "Dashboard: https://claw-setups.vercel.app/dashboard"
echo "MCP: https://claw-setups.vercel.app/api/mcp"
