import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { verifyXByCode } from "@/lib/keyStore";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { xUsername, code } = await req.json();
  if (!xUsername || !code) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Normalize: strip @ prefix
  const username = xUsername.replace(/^@/, "").trim();
  if (!username) return NextResponse.json({ error: "Invalid username" }, { status: 400 });

  const ok = await verifyXByCode(user.id, username, code);
  if (!ok) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  return NextResponse.json({ ok: true, xUsername: username });
}
