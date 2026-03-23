import { createHash, randomBytes } from "crypto";
import { createServiceClient } from "./supabase";

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function generateKey(): string {
  return "csk_" + randomBytes(24).toString("hex");
}

export interface KeyRecord {
  keyHash: string;
  keyPrefix: string;
  githubUsername: string;
  createdAt: string;
  lastUsedAt: string | null;
  submissionCount: number;
  revoked: boolean;
}

export async function storeKey(userId: string, githubUsername: string, key: string): Promise<KeyRecord> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase not configured");
  const keyHash = hashKey(key);
  const keyPrefix = key.slice(0, 16) + "...";

  // Delete existing key for this user
  await supabase.from("api_keys").delete().eq("user_id", userId);

  const { error } = await supabase.from("api_keys").insert({
    user_id: userId,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    github_username: githubUsername,
    revoked: false,
    submission_count: 0,
  });

  if (error) throw new Error(`Failed to store key: ${error.message}`);

  return {
    keyHash,
    keyPrefix,
    githubUsername,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    submissionCount: 0,
    revoked: false,
  };
}

export async function getUserKey(userId: string): Promise<KeyRecord | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .eq("revoked", false)
    .single();

  if (error || !data) return null;

  return {
    keyHash: data.key_hash,
    keyPrefix: data.key_prefix,
    githubUsername: data.github_username,
    createdAt: data.created_at,
    lastUsedAt: data.last_used_at,
    submissionCount: data.submission_count,
    revoked: data.revoked,
  };
}

export async function validateKeyFromStore(key: string): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;
  const keyHash = hashKey(key);

  const { data, error } = await supabase
    .from("api_keys")
    .select("user_id, revoked")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data || data.revoked) return null;
  return data.user_id;
}

export async function revokeKey(userId: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Supabase not configured");
  await supabase.from("api_keys").update({ revoked: true }).eq("user_id", userId);
}

export async function recordKeyUsage(userId: string): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;
  const { data } = await supabase
    .from("api_keys")
    .select("submission_count")
    .eq("user_id", userId)
    .single();

  if (data) {
    await supabase
      .from("api_keys")
      .update({
        last_used_at: new Date().toISOString(),
        submission_count: (data.submission_count || 0) + 1,
      })
      .eq("user_id", userId);
  }
}
