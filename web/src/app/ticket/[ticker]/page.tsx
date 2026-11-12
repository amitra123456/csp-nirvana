import Link from "next/link";
import { notFound } from "next/navigation";
import { getSnapshot } from "@/lib/server-data";
import { formatCurrency, formatPercent } from "@/lib/data";

interface PageProps {
  params: { ticker: string };
}

export default async function TradeTicketPage({ params }: PageProps) {
  const snapshot = await getSnapshot();
  const tickerUpper = params.ticker.toUpperCase();
  const setup = snapshot?.setups?.find((s) => s.ticker.toUpperCase() === tickerUpper);

  if (!setup) {
    // If not in current qualified setups, check if in snapshot held_back or positions
    const pos = snapshot?.positions?.find((p) => p.ticker.toUpperCase() === tickerUpper);
    if (!pos && !setup) {
      notFound();
    }
  }

  // Rank in population
  const rank = snapshot?.setups?.findIndex((s) => s.ticker.toUpperCase() === tickerUpper) ?? -1;
  const rankStr = rank >= 0 ? `#${rank + 1} of ${snapshot?.setups?.length || 0}` : "Tracked Position";

  // Score parts keys & labels
  const scoreLabels: Record<string, string> = {
    cushion: "Strike Cushion",
    valuation: "Intrinsic Valuation (FCF)",
    levels: "Technical Support / S/R",
    news_flow: "Catalyst & News Flow",
    candles: "Candlestick Reversal",
    probability: "Statistical Market Odds",
    yield: "Return on Capital",
  };

  // Price Ladder calculation: determine vertical positioning for scale
  const spot = setup?.spot || 100;
  const strike = setup?.strike || 88;
  const costBasis = setup?.cost_basis || (strike - (setup?.bid || 2));
  const oneSigmaLow = setup?.one_sigma_low || (spot * 0.85);

  const levels = setup?.levels || { sma50: null, sma200: null, avwap: null, vwap20: null, ote_618: null, ote_786: null };

  const ladderPoints = [
    { label: "Current Spot", price: spot, color: "#6CB4FF", isLine: true, isDashed: false },
    { label: "Strike Price", price: strike, color: "#FFFFFF", isLine: true, isDashed: false },
    { label: "Net Cost Basis", price: costBasis, color: "#A3AEBC", isLine: true, isDashed: true },
    { label: "1σ Expected Move Low", price: oneSigmaLow, color: "#F2B24C", isLine: true, isDashed: true },
    ...(levels.sma50 ? [{ label: "50-Day SMA", price: levels.sma50, color: "#8792A2", isLine: false, isDashed: false }] : []),
    ...(levels.sma200 ? [{ label: "200-Day SMA", price: levels.sma200, color: "#8792A2", isLine: false, isDashed: false }] : []),
    ...(levels.avwap ? [{ label: "Anchored VWAP", price: levels.avwap, color: "#8792A2", isLine: false, isDashed: false }] : []),
    ...(levels.vwap20 ? [{ label: "20-Day VWAP", price: levels.vwap20, color: "#8792A2", isLine: false, isDashed: false }] : []),
    ...(levels.ote_618 ? [{ label: "OTE 61.8% Retracement", price: levels.ote_618, color: "#8792A2", isLine: false, isDashed: false }] : []),
    ...(levels.ote_786 ? [{ label: "OTE 78.6% Retracement", price: levels.ote_786, color: "#8792A2", isLine: false, isDashed: false }] : []),
  ].sort((a, b) => b.price - a.price);

  const maxPrice = Math.max(...ladderPoints.map((p) => p.price)) * 1.05;
  const minPrice = Math.min(...ladderPoints.map((p) => p.price)) * 0.95;
  const priceRange = maxPrice - minPrice;

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-desk-secondary hover:text-desk-accent transition-colors">
          ← Back to Today's setups
        </Link>
      </div>

      {/* Title Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-desk-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl font-bold font-mono text-desk-text">{setup?.ticker}</h1>
              <span className="text-lg text-desk-secondary font-sans">{setup?.name}</span>
              <span className="rounded-control bg-desk-border px-2 py-0.5 text-xs font-semibold uppercase text-desk-secondary">
                {setup?.trend}
              </span>
              {setup?.held_position && (
                <span className="rounded-control bg-desk-accent/15 border border-desk-accent/30 px-2 py-0.5 text-xs font-semibold text-desk-accent">
                  Hold ${setup.held_position.strike} Put · {setup.held_position.expiry}
                </span>
              )}
            </div>
            <div className="text-sm font-mono text-desk-secondary mt-1">
              Spot: <strong className="text-desk-accent">${setup?.spot.toFixed(2)}</strong> (recorded at {setup?.spot_ts.replace("T", " ").slice(0, 16)})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-desk-tertiary block">Nirvana Score</span>
            <span className="text-2xl font-bold font-mono text-desk-text">{setup?.score.toFixed(1)}</span>
          </div>
          <div className="rounded-control bg-desk-raised px-3 py-1.5 text-xs font-mono text-desk-secondary">
            {rankStr}
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Trade + Ladder + Plan) vs Right (Odds + Score Parts + Watchouts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trade Card */}
          <div className="rounded-card border border-desk-border bg-desk-card p-6 space-y-5">
            <div className="text-lg font-bold text-desk-text border-b border-desk-border/60 pb-3">
              Sell 1 put · {setup?.expiry} · ${setup?.strike.toFixed(2)} strike · for ${setup?.bid.toFixed(2)}
            </div>

            {/* 4 Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
              <div className="rounded-control bg-desk-bg p-3 border border-desk-border">
                <span className="text-[11px] text-desk-secondary block">Cash to set aside</span>
                <span className="text-base font-bold text-desk-text">{formatCurrency(setup?.collateral)}</span>
              </div>
              <div className="rounded-control bg-desk-bg p-3 border border-desk-border">
                <span className="text-[11px] text-desk-secondary block">Return / cycle</span>
                <span className="text-base font-bold text-desk-accent">{setup?.roc_cycle_pct.toFixed(2)}%</span>
                <span className="text-[10px] text-desk-tertiary block font-sans">({setup?.roc_annual_pct.toFixed(1)}% Ann.)</span>
              </div>
              <div className="rounded-control bg-desk-bg p-3 border border-desk-border">
                <span className="text-[11px] text-desk-secondary block">Strike cushion</span>
                <span className="text-base font-bold text-desk-text">{setup?.cushion_pct.toFixed(1)}%</span>
                <span className="text-[10px] text-desk-tertiary block font-sans">Below spot</span>
              </div>
              <div className="rounded-control bg-desk-bg p-3 border border-desk-border">
                <span className="text-[11px] text-desk-secondary block">Cost if assigned</span>
                <span className="text-base font-bold text-desk-text">${setup?.cost_basis.toFixed(2)}</span>
                <span className="text-[10px] text-desk-tertiary block font-sans">Net of credit</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (typeof navigator !== "undefined") {
                    navigator.clipboard.writeText(
                      `SELL TO OPEN 1 ${setup?.ticker} ${setup?.expiry} $${setup?.strike} PUT @ $${setup?.bid}`
                    );
                    alert("Order copied to clipboard!");
                  }
                }}
                className="min-h-[44px] rounded-control bg-desk-accent px-4 py-2 text-xs font-bold text-desk-bg hover:opacity-90 transition-opacity"
              >
                Copy order
              </button>
              <button
                onClick={() => alert(`Staging exit orders: GTC limit buy at $${setup?.plan.tp50.toFixed(2)} (50% TP) and $${setup?.plan.tp60.toFixed(2)} (60% TP)`)}
                className="min-h-[44px] rounded-control bg-desk-raised px-4 py-2 text-xs font-semibold text-desk-text border border-desk-border hover:bg-desk-border transition-colors"
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
          </div>

          {/* Price Ladder Card */}
          <div className="rounded-card border border-desk-border bg-desk-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-desk-border/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-desk-text">Price Ladder & Level Structure</h2>
                <span className="text-xs text-desk-secondary">Vertical distance from current spot to S/R supports and strike floor.</span>
              </div>
              {strike > oneSigmaLow && (
                <div className="rounded-control bg-desk-caution/15 border border-desk-caution/40 px-2.5 py-1 text-xs text-desk-cautionText font-semibold">
                  ⚠️ Strike is above 1σ expected low
                </div>
              )}
            </div>

            {/* Ladder Container */}
            <div className="relative py-4 px-2 space-y-2.5 font-mono text-xs">
              {ladderPoints.map((p, idx) => {
                const isSpot = p.label.includes("Spot");
                const isStrike = p.label.includes("Strike");
                const isBasis = p.label.includes("Basis");
                const isSigma = p.label.includes("1σ");

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-control border transition-all ${
                      isSpot
                        ? "bg-desk-accent/10 border-desk-accent/40 font-bold"
                        : isStrike
                        ? "bg-desk-raised border-white/40 font-bold text-white"
                        : isBasis
                        ? "bg-desk-bg border-desk-border/80 text-desk-secondary"
                        : isSigma
                        ? "bg-desk-caution/10 border-dashed border-desk-caution/50 text-desk-cautionText"
                        : "bg-desk-bg/50 border-desk-border/30 text-desk-tertiary"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-sans text-xs">{p.label}</span>
                    </div>
                    <span className="font-bold">${p.price.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Cushion Bracket Visual */}
            <div className="rounded-control bg-desk-raised/60 p-3 flex items-center justify-between text-xs text-desk-secondary">
              <span>Safety Cushion Distance</span>
              <span className="font-mono font-bold text-desk-text">${(spot - strike).toFixed(2)} ({setup?.cushion_pct.toFixed(1)}% buffer)</span>
            </div>
          </div>

          {/* Plan Card */}
          <div className="rounded-card border border-desk-border bg-desk-card p-6 space-y-4">
            <h2 className="text-base font-bold text-desk-text border-b border-desk-border/60 pb-3">
              Systematic Trade & Exit Plan
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="rounded-control bg-desk-bg p-3.5 border border-desk-border space-y-1">
                <span className="text-desk-secondary block font-sans font-medium">50% Take-Profit Target</span>
                <span className="text-base font-bold text-desk-accent">${setup?.plan.tp50.toFixed(2)}</span>
                <p className="text-[11px] text-desk-tertiary font-sans">Close automatically when remaining option price decays to 50%.</p>
              </div>

              <div className="rounded-control bg-desk-bg p-3.5 border border-desk-border space-y-1">
                <span className="text-desk-secondary block font-sans font-medium">60% Take-Profit Target</span>
                <span className="text-base font-bold text-desk-accent">${setup?.plan.tp60.toFixed(2)}</span>
                <p className="text-[11px] text-desk-tertiary font-sans">Secondary target for accelerated theta capture.</p>
              </div>

              <div className="rounded-control bg-desk-bg p-3.5 border border-desk-border space-y-1">
                <span className="text-desk-secondary block font-sans font-medium">Defensive Roll Trigger</span>
                <span className="text-base font-bold text-desk-cautionText">${setup?.plan.roll_trigger_price.toFixed(2)}</span>
                <p className="text-[11px] text-desk-tertiary font-sans">If spot drops to 2% above strike, execute net-credit defensive roll.</p>
              </div>

              <div className="rounded-control bg-desk-bg p-3.5 border border-desk-border space-y-1">
                <span className="text-desk-secondary block font-sans font-medium">30% Market Stress Test</span>
                <span className="text-base font-bold text-desk-riskText">{setup?.plan.stress_loss !== 0 ? formatCurrency(setup?.plan.stress_loss) : "$0"}</span>
                <p className="text-[11px] text-desk-tertiary font-sans">Estimated loss if underlying suffers an immediate 30% collapse.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Odds Card */}
          <div className="rounded-card border border-desk-border bg-desk-card p-5 space-y-3">
            <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider">
              Mathematical Odds
            </h2>

            <div className="space-y-3 font-mono">
              <div className="rounded-control bg-desk-bg p-3 border border-desk-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-desk-secondary font-sans">Market Implied Win Rate</span>
                  <span className="text-base font-bold text-desk-text">{setup?.odds_otm_market_pct.toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-desk-raised rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-desk-accent rounded-full" style={{ width: `${setup?.odds_otm_market_pct}%` }} />
                </div>
                <span className="text-[10px] text-desk-tertiary block font-sans mt-1">Based on option Delta and real-time chain pricing.</span>
              </div>

              <div className="rounded-control bg-desk-bg p-3 border border-desk-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-desk-secondary font-sans">Chance of Touching Strike</span>
                  <span className="text-sm font-bold text-desk-cautionText">{setup?.odds_touch_market_pct.toFixed(1)}%</span>
                </div>
              </div>

              <div className="rounded-control bg-desk-bg p-3 border border-desk-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-desk-secondary font-sans">Model PoS (not validated)</span>
                  <span className="text-sm font-bold text-desk-secondary">{setup?.odds_model_pct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Why It Scores X (7 Bars) */}
          <div className="rounded-card border border-desk-border bg-desk-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-desk-border/60 pb-2">
              <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider">
                Why it scores {setup?.score.toFixed(1)}
              </h2>
              <span className="text-xs text-desk-tertiary font-mono">Max 100</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {Object.entries(setup?.score_parts || {}).map(([key, [val, maxVal]]) => {
                const label = scoreLabels[key] || key;
                const pct = (val / maxVal) * 100;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between font-sans text-xs">
                      <span className="text-desk-secondary">{label}</span>
                      <span className="font-mono font-bold text-desk-text">{val.toFixed(1)} / {maxVal.toFixed(0)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-desk-bg rounded-full overflow-hidden">
                      <div className="h-full bg-desk-accent rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Watchouts List */}
          <div className="rounded-card border border-desk-border bg-desk-card p-5 space-y-3">
            <h2 className="text-sm font-bold text-desk-text uppercase tracking-wider">
              Watch-outs & Event Radar
            </h2>

            <div className="space-y-2.5">
              {(!setup?.watchouts || setup.watchouts.length === 0) ? (
                <div className="rounded-control bg-desk-bg p-3 text-xs text-desk-secondary border border-desk-border">
                  ✅ No high-severity risk watchouts detected.
                </div>
              ) : (
                setup.watchouts.map((w, idx) => (
                  <div
                    key={idx}
                    className={`rounded-control p-3 border text-xs space-y-1 ${
                      w.severity === "high"
                        ? "bg-desk-risk/10 border-desk-risk/30 text-desk-riskText"
                        : "bg-desk-caution/10 border-desk-caution/30 text-desk-cautionText"
                    }`}
                  >
                    <div className="font-bold uppercase tracking-wide flex items-center justify-between">
                      <span>{w.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-desk-card">{w.severity}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">{w.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
