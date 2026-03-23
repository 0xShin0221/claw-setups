import { NextRequest, NextResponse } from "next/server";
import { getSetupBySlug } from "@/lib/setups";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const setup = getSetupBySlug(params.id);
  if (!setup) return NextResponse.json({ error: "Setup not found" }, { status: 404 });
  return NextResponse.json(setup);
}
