import { NextResponse } from "next/server";
import { readRepoJson } from "@/lib/server-data";

export const dynamic = "force-dynamic";

/** Every simulated closed trade (written by the daily pipeline), for the Signals equity curve. */
export async function GET() {
  const data = await readRepoJson("data/sim_closed_trades.json");
  if (!data) return NextResponse.json({ error: "No simulated trades file yet" }, { status: 404 });
  return NextResponse.json(data);
}
