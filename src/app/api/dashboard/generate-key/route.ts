import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateKey, storeKey, revokeKey } from "@/lib/keyStore";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubId = session.user.id;
  const githubUsername =
    session.user.name || session.user.email || githubId;

  // Revoke existing key first
  await revokeKey(githubId);

  // Generate new key
  const newKey = generateKey();
  const record = await storeKey(githubId, githubUsername, newKey);

  // Return the full key ONCE
  return NextResponse.json({
    ok: true,
    key: newKey,
    prefix: record.keyPrefix,
    createdAt: record.createdAt,
  });
}
