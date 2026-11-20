"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getFreshness } from "@/lib/data";
import { formatCountdown, formatScanDate, minutesUntilNextScan, nextScanDate } from "@/lib/schedule";
import { useEffect, useState } from "react";

interface HeaderProps {
  asOfEt?: string;
  itmCount?: number;
}

/** Shows when the next scheduled scan runs (NYSE trading days, 3:35 PM ET). */
function NextScanBox() {
  // Rendered only after mount so server and browser clocks never disagree during hydration
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const date = now ? nextScanDate(now) : null;
  return (
    <div
      className="flex min-h-[44px] flex-col justify-center rounded-control border border-desk-border bg-desk-card px-3.5 py-1.5 leading-tight"
      title="The scan runs automatically on NYSE trading days at 3:35 PM Eastern."
    >
      <span className="text-[11px] uppercase tracking-wider text-desk-tertiary">Next scan</span>
      <span className="font-mono text-xs font-semibold text-desk-text whitespace-nowrap">
        {date ? (
          <>
            {formatScanDate(date)} · 3:35 PM ET
            <span className="ml-1.5 font-normal text-desk-secondary">({formatCountdown(minutesUntilNextScan(now!))})</span>
          </>
        ) : (
          "3:35 PM ET"
        )}
      </span>
    </div>
  );
}

export function Header({ asOfEt = "", itmCount = 0 }: HeaderProps) {
  const pathname = usePathname();
  const freshness = getFreshness(asOfEt);

  const navLinks: { href: string; label: string; badge?: string }[] = [
    { href: "/", label: "Signals" },
    { href: "/admin", label: "Admin" },
    { href: "/evidence", label: "Historical Analysis" },
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
                  // /admin is password-protected (see middleware.ts); prefetching it only produces 401s
                  prefetch={link.href === "/admin" ? false : undefined}
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

          <NextScanBox />
        </div>
      </div>
    </header>
  );
}

export default Header;
