import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { revokeKey } from "@/lib/keyStore";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await revokeKey(user.id);
  return NextResponse.json({ ok: true });
}
