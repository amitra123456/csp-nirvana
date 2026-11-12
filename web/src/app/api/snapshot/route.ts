import { NextResponse } from "next/server";
import { getSnapshot } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getSnapshot();
  if (!snapshot) {
    return NextResponse.json({ error: "No snapshot available" }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}
