import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSetupBySlug } from "@/lib/setups";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// POST: increment view count
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const setup = getSetupBySlug(params.id);
  if (!setup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: true, count: 1 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.rpc("increment_view", {
    p_setup_id: params.id,
  });

  if (error) {
    // Fallback: manual upsert if function doesn't exist yet
    await supabase.from("setup_views").upsert(
      {
        setup_id: params.id,
        view_count: 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "setup_id", ignoreDuplicates: false }
    );
    return NextResponse.json({ ok: true, count: 1 });
  }

  return NextResponse.json({ ok: true, count: data ?? 1 });
}

// GET: fetch view count
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const setup = getSetupBySlug(params.id);
  if (!setup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ count: 0 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("setup_views")
    .select("view_count")
    .eq("setup_id", params.id)
    .maybeSingle();

  return NextResponse.json({ count: data?.view_count ?? 0 });
}
