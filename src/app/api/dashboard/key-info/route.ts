import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserKey } from "@/lib/keyStore";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const record = await getUserKey(session.user.id);
    if (!record || record.revoked) {
      return NextResponse.json({ key: null });
    }
    return NextResponse.json({
      key: {
        prefix: record.keyPrefix,
        createdAt: record.createdAt,
        lastUsedAt: record.lastUsedAt,
        submissionCount: record.submissionCount,
        revoked: record.revoked,
      },
    });
  } catch {
    return NextResponse.json({ key: null });
  }
}
