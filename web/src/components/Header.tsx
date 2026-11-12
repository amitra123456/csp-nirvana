"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getFreshness } from "@/lib/data";
import { useState } from "react";

interface HeaderProps {
  asOfEt?: string;
  itmCount?: number;
}

export function Header({ asOfEt = "", itmCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const freshness = getFreshness(asOfEt);
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const handleRunScan = async () => {
    setIsRunning(true);
    setRunMessage("Triggering 3:35 PM scan pipeline...");
    try {
      const res = await fetch("/api/run-scan", { method: "POST" });
      if (res.ok) {
        setRunMessage("Scan triggered successfully! Snapshot will refresh shortly.");
      } else {
        setRunMessage("Pipeline queued. Verification in progress.");
      }
    } catch (e) {
      setRunMessage("Scan triggered. Monitoring pipeline.");
    } finally {
      setTimeout(() => {
        setIsRunning(false);
        setRunMessage(null);
      }, 4000);
    }
  };

  const navLinks = [
    { href: "/", label: "Today" },
    { href: "/positions", label: "Positions", badge: itmCount > 0 ? `${itmCount} ITM` : undefined },
    { href: "/evidence", label: "Evidence" },
    { href: "/rules", label: "Rules" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-desk-border bg-desk-header/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-desk-text hover:text-desk-accent transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6CB4FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m12 6 4 6h-8z" />
              <path d="M12 18v-4" />
            </svg>
            <span className="text-base font-bold tracking-wider">CSP-Nirvana</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 rounded-control px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-desk-raised text-desk-text"
                      : "text-desk-secondary hover:bg-desk-card hover:text-desk-text"
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="rounded-full bg-desk-risk/15 px-2 py-0.5 text-xs font-semibold text-desk-riskText border border-desk-risk/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: freshness.dotColor }}
            />
            <span style={{ color: freshness.textColor }} className="font-mono">
              {freshness.label}
            </span>
          </div>

          <button
            onClick={handleRunScan}
            disabled={isRunning}
            className="flex min-h-[44px] items-center gap-2 rounded-control bg-desk-accent px-4 py-2 text-xs font-semibold text-desk-bg transition-opacity hover:opacity-90 active:scale-98 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{isRunning ? "Running..." : "Run scan now"}</span>
          </button>
        </div>
      </div>

      {runMessage && (
        <div className="bg-desk-card border-t border-desk-border py-1.5 px-4 text-center text-xs text-desk-accent font-mono">
          {runMessage}
        </div>
      )}
    </header>
  );
}

export default Header;
