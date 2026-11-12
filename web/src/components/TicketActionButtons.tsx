"use client";

import Link from "next/link";
import { useState } from "react";

interface TicketActionButtonsProps {
  ticker: string;
  expiry: string;
  strike: number;
  bid: number;
  tp50: number;
  tp60: number;
}

export function TicketActionButtons({
  ticker,
  expiry,
  strike,
  bid,
  tp50,
  tp60,
}: TicketActionButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [stagedMsg, setStagedMsg] = useState<string | null>(null);

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(
        `SELL TO OPEN 1 ${ticker} ${expiry} $${strike} PUT @ $${bid.toFixed(2)}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleStageExits = () => {
    setStagedMsg(`Staging exit orders: GTC limit buy at $${tp50.toFixed(2)} (50% TP) and $${tp60.toFixed(2)} (60% TP)`);
    setTimeout(() => setStagedMsg(null), 4000);
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleCopy}
          className="min-h-[44px] rounded-control bg-desk-accent px-4 py-2 text-xs font-bold text-desk-bg hover:opacity-90 active:scale-98 transition-all"
        >
          {copied ? "✓ Copied to clipboard!" : "Copy order"}
        </button>
        <button
          onClick={handleStageExits}
          className="min-h-[44px] rounded-control bg-desk-raised px-4 py-2 text-xs font-semibold text-desk-text border border-desk-border hover:bg-desk-border active:scale-98 transition-all"
        >
          Stage exits at TP50 / TP60
        </button>
        <Link
          href="/"
          className="min-h-[44px] flex items-center rounded-control bg-transparent px-4 py-2 text-xs font-semibold text-desk-secondary hover:text-desk-text transition-colors"
        >
          Compare strikes →
        </Link>
      </div>
      {stagedMsg && (
        <div className="rounded-control bg-desk-raised border border-desk-border px-3 py-1.5 text-xs font-mono text-desk-accent">
          {stagedMsg}
        </div>
      )}
    </div>
  );
}

export default TicketActionButtons;
