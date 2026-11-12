import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  const token = process.env.GITHUB_TOKEN;
  const repo = "amitra123456/csp-nirvana";

  // If in local dev or token not set, try local python script trigger
  if (!token) {
    try {
      const scriptPath = path.resolve(process.cwd(), "../scripts/daily_335pm_update.py");
      exec(`python "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error("Local pipeline exec error:", error);
        } else {
          console.log("Local pipeline output:", stdout);
        }
      });
      return NextResponse.json({ status: "queued", mode: "local" });
    } catch (e) {
      return NextResponse.json({ status: "queued", mode: "fallback" });
    }
  }

  // Trigger GitHub Actions workflow_dispatch
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/snapshot.yml/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CSP-Nirvana-Web",
      },
      body: JSON.stringify({ ref: "main", inputs: { force_run: true } }),
    });

    if (res.ok) {
      return NextResponse.json({ status: "ok", message: "Workflow dispatched" });
    }
    return NextResponse.json({ status: "error", message: `GitHub API status ${res.status}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e.message }, { status: 500 });
  }
}
