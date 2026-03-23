import { NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { getUserKey } from "@/lib/keyStore";

export async function GET() {
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

  const keyRecord = await getUserKey(user.id);
  return NextResponse.json({
    hasKey: !!keyRecord,
    keyRecord: keyRecord || null,
    user: {
      name: user.user_metadata?.full_name || user.user_metadata?.user_name,
      username: user.user_metadata?.user_name,
      avatar: user.user_metadata?.avatar_url,
    },
  });
}
