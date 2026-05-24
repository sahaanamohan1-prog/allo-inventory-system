import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { releaseExpiredReservations } = await import("@/lib/expiry");
    const released = await releaseExpiredReservations();
    return NextResponse.json({ released });
  } catch (e) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}