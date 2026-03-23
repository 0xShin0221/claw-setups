import { NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { generateXVerifyCode } from "@/lib/keyStore";

export async function POST() {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = await generateXVerifyCode(user.id);
  return NextResponse.json({ ok: true, code });
}
