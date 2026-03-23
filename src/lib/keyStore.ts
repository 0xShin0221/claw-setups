import { kv } from "@vercel/kv";
import { createHash, randomBytes } from "crypto";

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateKey(): string {
  return "csk_" + randomBytes(24).toString("hex");
}

export interface KeyRecord {
  keyHash: string;
  keyPrefix: string; // first 16 chars for display
  githubId: string;
  githubUsername: string;
  createdAt: string;
  lastUsedAt: string | null;
  submissionCount: number;
  revoked: boolean;
}

// Store key record for a user
export async function storeKey(
  githubId: string,
  githubUsername: string,
  key: string
): Promise<KeyRecord> {
  const keyHash = hashKey(key);
  const record: KeyRecord = {
    keyHash,
    keyPrefix: key.slice(0, 16) + "...",
    githubId,
    githubUsername,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    submissionCount: 0,
    revoked: false,
  };
  // Store by user: user:<githubId>:key -> record
  await kv.set(`user:${githubId}:key`, record);
  // Store hash lookup: keyHash:<hash> -> githubId (for validation)
  await kv.set(`keyHash:${keyHash}`, githubId);
  return record;
}

// Get key record for a user
export async function getUserKey(
  githubId: string
): Promise<KeyRecord | null> {
  return kv.get<KeyRecord>(`user:${githubId}:key`);
}

// Validate a key (returns githubId if valid, null if invalid/revoked)
export async function validateKeyFromStore(
  key: string
): Promise<string | null> {
  const keyHash = hashKey(key);
  const githubId = await kv.get<string>(`keyHash:${keyHash}`);
  if (!githubId) return null;
  const record = await kv.get<KeyRecord>(`user:${githubId}:key`);
  if (!record || record.revoked || record.keyHash !== keyHash) return null;
  return githubId;
}

// Revoke a user key
export async function revokeKey(githubId: string): Promise<void> {
  const record = await kv.get<KeyRecord>(`user:${githubId}:key`);
  if (!record) return;
  // Remove hash lookup
  await kv.del(`keyHash:${record.keyHash}`);
  // Mark as revoked
  await kv.set(`user:${githubId}:key`, { ...record, revoked: true });
}

// Update last used / increment counter
export async function recordKeyUsage(githubId: string): Promise<void> {
  const record = await kv.get<KeyRecord>(`user:${githubId}:key`);
  if (!record) return;
  await kv.set(`user:${githubId}:key`, {
    ...record,
    lastUsedAt: new Date().toISOString(),
    submissionCount: record.submissionCount + 1,
  });
}
