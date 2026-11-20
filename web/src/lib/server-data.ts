import { Snapshot } from "@/types/snapshot";
import fs from "fs";
import path from "path";

const GITHUB_RAW_URL = "https://raw.githubusercontent.com/amitra123456/csp-nirvana/main/data/snapshots/latest.json";

/** Read a JSON file from the repo (e.g. "data/sim_closed_trades.json"); fall back to GitHub raw. */
export async function readRepoJson<T = unknown>(relPath: string): Promise<T | null> {
  for (const base of [path.resolve(process.cwd(), ".."), process.cwd()]) {
    try {
      const p = path.join(base, relPath);
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
    } catch (e) {
      // try the next location
    }
  }
  try {
    const res = await fetch(`https://raw.githubusercontent.com/amitra123456/csp-nirvana/main/${relPath}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) return (await res.json()) as T;
  } catch (e) {
    console.error(`Failed to fetch ${relPath} from GitHub raw:`, e);
  }
  return null;
}

export async function getSnapshot(): Promise<Snapshot | null> {
  // 1. First check local file system (for local dev & server build)
  try {
    const localPath = path.resolve(process.cwd(), "../data/snapshots/latest.json");
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, "utf-8");
      return JSON.parse(content) as Snapshot;
    }
    const directPath = path.resolve(process.cwd(), "data/snapshots/latest.json");
    if (fs.existsSync(directPath)) {
      const content = fs.readFileSync(directPath, "utf-8");
      return JSON.parse(content) as Snapshot;
    }
  } catch (e) {
    // Proceed to network fetch
  }

  // 2. Fetch from GitHub raw with 5-minute revalidation
  try {
    const res = await fetch(GITHUB_RAW_URL, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      return (await res.json()) as Snapshot;
    }
  } catch (e) {
    console.error("Failed to fetch snapshot from GitHub raw URL:", e);
  }

  return null;
}
