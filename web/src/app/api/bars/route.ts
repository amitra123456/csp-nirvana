import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "NXPI").toUpperCase();

  // Try possible paths for data/daily
  const possiblePaths = [
    path.join(process.cwd(), "data", "daily", `${ticker}.csv`),
    path.join(process.cwd(), "..", "data", "daily", `${ticker}.csv`),
    path.join(process.cwd(), "csp_nirvana", "data", "daily", `${ticker}.csv`),
  ];

  let csvPath = possiblePaths.find((p) => fs.existsSync(p));
  if (!csvPath) {
    return NextResponse.json({ error: `Ticker CSV not found: ${ticker}` }, { status: 404 });
  }

  try {
    const raw = fs.readFileSync(csvPath, "utf-8");
    const lines = raw.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ ticker, bars: [] });
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const timeIdx = headers.findIndex((h) => h.toLowerCase() === "timestamp");
    const openIdx = headers.findIndex((h) => h.toLowerCase() === "open");
    const highIdx = headers.findIndex((h) => h.toLowerCase() === "high");
    const lowIdx = headers.findIndex((h) => h.toLowerCase() === "low");
    const closeIdx = headers.findIndex((h) => h.toLowerCase() === "close");
    const volIdx = headers.findIndex((h) => h.toLowerCase() === "volume");

    const bars = [];
    // Take the most recent 252 bars (1 full trading year)
    const dataLines = lines.slice(1);
    const startIdx = Math.max(0, dataLines.length - 252);

    for (let i = startIdx; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;
      const parts = line.split(",");
      const rawTime = parts[timeIdx]?.trim() || "";
      const dateStr = rawTime.slice(0, 10); // YYYY-MM-DD
      const open = parseFloat(parts[openIdx]);
      const high = parseFloat(parts[highIdx]);
      const low = parseFloat(parts[lowIdx]);
      const close = parseFloat(parts[closeIdx]);
      const volume = parseFloat(parts[volIdx]) || 0;

      if (dateStr && !isNaN(close)) {
        bars.push({
          time: dateStr,
          open: !isNaN(open) ? open : close,
          high: !isNaN(high) ? high : close,
          low: !isNaN(low) ? low : close,
          close: close,
          volume: volume,
        });
      }
    }

    return NextResponse.json({
      ticker,
      count: bars.length,
      bars,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
