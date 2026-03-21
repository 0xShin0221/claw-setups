import { NextResponse } from "next/server";
import { getSetupBySlug } from "@/lib/setups";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const setup = getSetupBySlug(params.slug);
  if (!setup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(setup);
}
