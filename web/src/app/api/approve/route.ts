import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Find data directory
function getApprovalsPath(): string {
  const possiblePaths = [
    path.join(process.cwd(), "data", "approvals.json"),
    path.join(process.cwd(), "..", "data", "approvals.json"),
    path.join(process.cwd(), "csp_nirvana", "data", "approvals.json"),
  ];

  let found = possiblePaths.find((p) => fs.existsSync(p));
  if (found) return found;

  // Default to creating inside first valid data directory
  const dataDir = possiblePaths.map((p) => path.dirname(p)).find((d) => fs.existsSync(d));
  if (dataDir) {
    return path.join(dataDir, "approvals.json");
  }
  return path.join(process.cwd(), "data", "approvals.json");
}

export async function GET() {
  try {
    const filePath = getApprovalsPath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ approved: [] });
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ approved: Array.isArray(data.approved) ? data.approved : [] });
  } catch (err: any) {
    return NextResponse.json({ approved: [], error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, approved } = body;
    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    const sym = ticker.toUpperCase();
    const filePath = getApprovalsPath();

    let approvedList: string[] = [];
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.approved)) {
          approvedList = parsed.approved;
        }
      } catch (e) {
        approvedList = [];
      }
    }

    const set = new Set(approvedList.map((s) => s.toUpperCase()));
    if (approved) {
      set.add(sym);
    } else {
      set.delete(sym);
    }

    const updated = Array.from(set).sort();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify({ approved: updated }, null, 2), "utf-8");

    return NextResponse.json({ approved: updated, ticker: sym, status: approved ? "approved" : "unapproved" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
