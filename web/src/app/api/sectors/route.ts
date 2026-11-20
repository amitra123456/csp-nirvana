import { NextResponse } from "next/server";
import { readRepoJson } from "@/lib/server-data";

export const dynamic = "force-dynamic";

/** The 10 largest S&P 500 companies in each GICS sector (config/sp500_sector_top10.json). */
export async function GET() {
  const data = await readRepoJson("config/sp500_sector_top10.json");
  if (!data) return NextResponse.json({ error: "Sector list not found" }, { status: 404 });
  return NextResponse.json(data);
}
