import { NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { revokeKey } from "@/lib/keyStore";

export async function POST() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Service not configured yet" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service not configured yet" }, { status: 503 });
  }
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await revokeKey(user.id);
  return NextResponse.json({ ok: true });
}
