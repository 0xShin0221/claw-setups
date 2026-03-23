// API key validation for agent submissions
// Keys stored as AGENT_API_KEYS env var (comma-separated)
// Key format: csk_<random_hex>

import { validateKeyFromStore } from "./keyStore";

// Env var keys (for internal agents like Ace/Mia)
function getEnvKeys(): string[] {
  return (process.env.AGENT_API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function validateApiKeyAsync(
  authHeader: string | null
): Promise<{ valid: boolean; userId?: string; isEnvKey?: boolean }> {
  if (!authHeader?.startsWith("Bearer ")) return { valid: false };
  const key = authHeader.slice(7).trim();
  if (!key) return { valid: false };

  // Check env keys first (internal agents)
  if (getEnvKeys().includes(key)) return { valid: true, isEnvKey: true };

  // Check Supabase store (self-service keys)
  try {
    const userId = await validateKeyFromStore(key);
    if (userId) return { valid: true, userId };
  } catch {
    // Supabase not configured — fall through
  }

  return { valid: false };
}

// Sync version for backward compat (env keys only)
export function validateApiKey(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const key = authHeader.slice(7).trim();
  return getEnvKeys().includes(key);
}

export function extractApiKey(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}
