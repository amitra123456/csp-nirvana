"""
Fair Value Triangulation Engine: Fundamental (Lens 1) & Microstructure (Lens 2)
================================================================================
Calculates:
1. Lens 1: Fundamental Intrinsic Fair Value
   - Free Cash Flow (FCF) Yield %
   - Reverse DCF: Market-Implied 5-Year FCF Growth Rate
   - Intrinsic Valuation & Margin of Safety vs. Analyst Consensus Target
   - Trailing and Forward P/E Valuation Multiples
2. Lens 2: Institutional Microstructure Fair Value
   - Anchored VWAP (AVWAP) from major swing low accumulation anchor
   - Dark Pool Volume-Weighted POC Shelf
   - Dark Pool Index (DPI %) & Block Order Accumulation Status
   - Strike Microstructure Shield (Distance from strike to institutional cost bases)
"""

from __future__ import annotations
import math
import logging
from typing import Dict, Any, Optional
import yfinance as yf

logging.getLogger("yfinance").setLevel(logging.CRITICAL)

_FUNDAMENTALS_CACHE: Dict[str, Dict[str, Any]] = {}

def solve_reverse_dcf(fcf: float, mcap: float, r: float = 0.095, g_term: float = 0.03, years: int = 5) -> Optional[float]:
    """
    Solves for the implied 5-year FCF compound annual growth rate (CAGR)
    priced in by the current market capitalization via a 2-stage DCF model.
    """
    if not fcf or not mcap or fcf <= 0 or mcap <= 0:
        return None
    low, high = -0.30, 1.50
    for _ in range(50):
        mid = (low + high) / 2.0
        pv = 0.0
        for t in range(1, years + 1):
            pv += (fcf * ((1.0 + mid) ** t)) / ((1.0 + r) ** t)
        term_val = (fcf * ((1.0 + mid) ** years) * (1.0 + g_term)) / (r - g_term)
        pv += term_val / ((1.0 + r) ** years)
        if pv < mcap:
            low = mid
        else:
            high = mid
    return round(mid * 100.0, 1)

def compute_lens1_fundamentals(ticker: str, spot: float) -> Dict[str, Any]:
    """
    Computes Lens 1: Fundamental Intrinsic Fair Value and Reverse DCF metrics.
    Uses in-memory caching to avoid repeat network overhead.
    """
    sym = ticker.strip().upper()
    if sym in _FUNDAMENTALS_CACHE:
        return _FUNDAMENTALS_CACHE[sym]

    try:
        t = yf.Ticker(sym)
        info = t.info or {}
    except Exception:
        info = {}

    mcap = info.get("marketCap") or 0
    fcf = info.get("freeCashflow") or info.get("operatingCashflow") or 0
    pe_trail = info.get("trailingPE")
    pe_fwd = info.get("forwardPE")
    analyst_target = info.get("targetMeanPrice")

    # Format scale
    if mcap >= 1e12:
        mcap_str = f"${mcap / 1e12:.2f}T"
    elif mcap >= 1e9:
        mcap_str = f"${mcap / 1e9:.1f}B"
    else:
        mcap_str = f"${mcap / 1e6:.0f}M" if mcap > 0 else "-"

    if fcf >= 1e9:
        fcf_str = f"${fcf / 1e9:.2f}B"
    elif fcf >= 1e6:
        fcf_str = f"${fcf / 1e6:.0f}M"
    else:
        fcf_str = "-"

    fcf_yield = (fcf / mcap * 100.0) if (mcap > 0 and fcf > 0) else 0.0
    implied_growth = solve_reverse_dcf(fcf, mcap)

    if analyst_target and spot > 0:
        target_upside = ((analyst_target - spot) / spot) * 100.0
        target_str = f"${analyst_target:.2f} ({target_upside:+.1f}% upside)"
    else:
        target_str = "N/A"
        target_upside = 0.0

    # Assessment
    if target_upside >= 25.0 or fcf_yield >= 4.0:
        assessment = "Significant Margin of Safety vs. Intrinsic / Consensus Value"
    elif target_upside >= 10.0 or fcf_yield >= 2.5:
        assessment = "Moderate Undervaluation / Favorable Risk-Reward"
    else:
        assessment = "Fairly Valued / Growth Fully Priced"

    res = {
        "market_cap_str": mcap_str,
        "fcf_str": fcf_str,
        "fcf_yield_pct": round(fcf_yield, 2),
        "reverse_dcf_growth_pct": implied_growth,
        "analyst_target_str": target_str,
        "analyst_upside_pct": round(target_upside, 1),
        "pe_trailing": round(pe_trail, 1) if pe_trail else "N/A",
        "pe_forward": round(pe_fwd, 1) if pe_fwd else "N/A",
        "assessment": assessment
    }
    _FUNDAMENTALS_CACHE[sym] = res
    return res

def compute_lens2_microstructure(
    spot: float,
    strike: float,
    smc: Dict[str, Any],
    dp: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Computes Lens 2: Institutional Microstructure Fair Value and strike protection levels.
    """
    avwap = smc.get("anchored_vwap", spot)
    avwap_diff_pct = ((spot - avwap) / avwap) * 100.0 if avwap > 0 else 0.0
    strike_vs_avwap_pct = ((avwap - strike) / avwap) * 100.0 if avwap > 0 else 0.0

    dp_shelf = dp.get("dark_pool_shelf_price", spot) if dp else spot
    dp_diff_pct = ((spot - dp_shelf) / dp_shelf) * 100.0 if dp_shelf > 0 else 0.0
    strike_vs_dp_pct = ((dp_shelf - strike) / dp_shelf) * 100.0 if dp_shelf > 0 else 0.0

    dpi = dp.get("dark_pool_ratio_pct", 0.0) if dp else 0.0
    is_accumulating = dp.get("is_accumulating", False) if dp else False

    # Protection evaluation
    below_avwap = strike <= avwap
    below_dp = strike <= dp_shelf

    if below_avwap and below_dp:
        protection_badge = "🛡️ Dual Whale Shield"
        protection_desc = "Strike sits safely beneath BOTH Anchored VWAP and the Dark Pool Block Shelf."
    elif below_avwap:
        protection_badge = "🛡️ AVWAP Shield"
        protection_desc = "Strike sits beneath Anchored VWAP institutional cost basis."
    elif below_dp:
        protection_badge = "🛡️ Dark Pool Shelf Shield"
        protection_desc = "Strike sits beneath off-exchange whale accumulation floor."
    else:
        protection_badge = "⚠️ Inside Institutional Range"
        protection_desc = "Strike sits close to volume anchors; monitor price action."

    return {
        "anchored_vwap": round(avwap, 2),
        "avwap_diff_pct": round(avwap_diff_pct, 1),
        "strike_vs_avwap_pct": round(strike_vs_avwap_pct, 1),
        "dark_pool_shelf": round(dp_shelf, 2),
        "dp_diff_pct": round(dp_diff_pct, 1),
        "strike_vs_dp_pct": round(strike_vs_dp_pct, 1),
        "dark_pool_index_pct": round(dpi, 1),
        "is_accumulating": is_accumulating,
        "protection_badge": protection_badge,
        "protection_desc": protection_desc
    }
