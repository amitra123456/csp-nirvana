import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface ApprovalRecord {
  status: "approved" | "disapproved" | "none";
  comment: string;
  updated_at?: string;
}

export interface ApprovalsData {
  approved: string[];
  disapproved?: string[];
  records?: Record<string, ApprovalRecord>;
}

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

function loadApprovals(): ApprovalsData {
  const filePath = getApprovalsPath();
  if (!fs.existsSync(filePath)) {
    return { approved: [], disapproved: [], records: {} };
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    const approved = Array.isArray(parsed.approved) ? parsed.approved : [];
    const disapproved = Array.isArray(parsed.disapproved) ? parsed.disapproved : [];
    const records = parsed.records && typeof parsed.records === "object" ? parsed.records : {};
    
    // Ensure all items in approved/disapproved have a record
    for (const sym of approved) {
      if (!records[sym]) {
        records[sym] = { status: "approved", comment: "" };
      } else {
        records[sym].status = "approved";
      }
    }
    for (const sym of disapproved) {
      if (!records[sym]) {
        records[sym] = { status: "disapproved", comment: "" };
      } else {
        records[sym].status = "disapproved";
      }
    }

    return { approved, disapproved, records };
  } catch (e) {
    return { approved: [], disapproved: [], records: {} };
  }
}

export async function GET() {
  try {
    const data = loadApprovals();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ approved: [], disapproved: [], records: {}, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, status, approved, comment } = body;
    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
    }

    const sym = ticker.toUpperCase();
    const filePath = getApprovalsPath();
    const data = loadApprovals();

    const approvedSet = new Set((data.approved || []).map((s) => s.toUpperCase()));
    const disapprovedSet = new Set((data.disapproved || []).map((s) => s.toUpperCase()));
    const records = data.records || {};

    // Determine target status
    let targetStatus: "approved" | "disapproved" | "none" = records[sym]?.status || "none";
    if (status) {
      targetStatus = status;
    } else if (approved === true) {
      targetStatus = "approved";
    } else if (approved === false) {
      targetStatus = "none";
    }

    if (targetStatus === "approved") {
      approvedSet.add(sym);
      disapprovedSet.delete(sym);
    } else if (targetStatus === "disapproved") {
      disapprovedSet.add(sym);
      approvedSet.delete(sym);
    } else {
      approvedSet.delete(sym);
      disapprovedSet.delete(sym);
    }

    // Update record
    records[sym] = {
      status: targetStatus,
      comment: comment !== undefined ? String(comment) : (records[sym]?.comment || ""),
      updated_at: new Date().toISOString(),
    };

    const finalApproved = Array.from(approvedSet).sort();
    const finalDisapproved = Array.from(disapprovedSet).sort();

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const outputData: ApprovalsData = {
      approved: finalApproved,
      disapproved: finalDisapproved,
      records: records,
    };

    fs.writeFileSync(filePath, JSON.stringify(outputData, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      ticker: sym,
      ...outputData,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
