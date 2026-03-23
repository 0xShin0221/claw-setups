import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { revokeKey } from "@/lib/keyStore";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await revokeKey(session.user.id);
  return NextResponse.json({ ok: true });
}
