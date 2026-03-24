import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { getSetupBySlug } from "@/lib/setups";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getUserHash(req: NextRequest, setupId: string): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${ip}:${ua}:${setupId}`)
    .digest("hex")
    .slice(0, 32);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const setup = getSetupBySlug(params.id);
  if (!setup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Graceful degradation: if no Supabase configured, return mock
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      ok: true,
      liked: true,
      count: (setup.likes ?? 0) + 1,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const userHash = getUserHash(req, params.id);

  // Toggle: check if already liked
  const { data: existing } = await supabase
    .from("setup_likes")
    .select("setup_id")
    .eq("setup_id", params.id)
    .eq("user_hash", userHash)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    // Unlike
    await supabase
      .from("setup_likes")
      .delete()
      .eq("setup_id", params.id)
      .eq("user_hash", userHash);
    liked = false;
  } else {
    // Like
    await supabase
      .from("setup_likes")
      .insert({ setup_id: params.id, user_hash: userHash });
    liked = true;
  }

  // Get updated count
  const { count } = await supabase
    .from("setup_likes")
    .select("*", { count: "exact", head: true })
    .eq("setup_id", params.id);

  return NextResponse.json({ ok: true, liked, count: count ?? 0 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const setup = getSetupBySlug(params.id);
  if (!setup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ count: setup.likes ?? 0, liked: false });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const userHash = getUserHash(req, params.id);

  const [{ count }, { data: existing }] = await Promise.all([
    supabase
      .from("setup_likes")
      .select("*", { count: "exact", head: true })
      .eq("setup_id", params.id),
    supabase
      .from("setup_likes")
      .select("setup_id")
      .eq("setup_id", params.id)
      .eq("user_hash", userHash)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    count: count ?? setup.likes ?? 0,
    liked: !!existing,
  });
}
