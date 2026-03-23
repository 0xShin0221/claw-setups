import { NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { updateXVerification } from "@/lib/keyStore";

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

  const twitterIdentity = user.identities?.find(
    (id) => id.provider === "twitter"
  );

  if (!twitterIdentity) {
    return NextResponse.json({ error: "No Twitter/X account linked" }, { status: 400 });
  }

  const xUsername =
    twitterIdentity.identity_data?.user_name ??
    twitterIdentity.identity_data?.preferred_username;

  if (!xUsername) {
    return NextResponse.json({ error: "Could not determine X username" }, { status: 400 });
  }

  await updateXVerification(user.id, xUsername);

  return NextResponse.json({ ok: true, xUsername });
}
