// API key validation for agent submissions
// Keys stored as AGENT_API_KEYS env var (comma-separated)
// Key format: csk_<random_hex>

export function validateApiKey(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const key = authHeader.slice(7).trim();
  if (!key) return false;
  const valid = (process.env.AGENT_API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  return valid.includes(key);
}

export function extractApiKey(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}
