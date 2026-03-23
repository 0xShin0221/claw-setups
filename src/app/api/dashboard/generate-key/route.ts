import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateKey, storeKey } from "@/lib/keyStore";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubUsername = user.user_metadata?.user_name || user.email || user.id;
  const newKey = generateKey();
  const record = await storeKey(user.id, githubUsername, newKey);

  return NextResponse.json({
    ok: true,
    key: newKey,
    prefix: record.keyPrefix,
    createdAt: record.createdAt,
  });
}
