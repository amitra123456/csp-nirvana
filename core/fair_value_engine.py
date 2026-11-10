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

    dp_shelf = dp.get("dark_pool_shelf_price", spot) if dp else spot
    dp_diff_pct = ((spot - dp_shelf) / dp_shelf) * 100.0 if dp_shelf > 0 else 0.0
    strike_vs_dp_pct = ((dp_shelf - strike) / dp_shelf) * 100.0 if dp_shelf > 0 else 0.0

    dpi = dp.get("dark_pool_ratio_pct", 0.0) if dp else 0.0
    is_accumulating = dp.get("is_accumulating", False) if dp else False

    # Exact Protection Evaluation
    below_avwap = strike <= avwap
    below_dp = strike <= dp_shelf

    if below_avwap:
        strike_vs_avwap_pct = ((avwap - strike) / avwap) * 100.0
        strike_avwap_val_str = f"{strike_vs_avwap_pct:.1f}% Below"
        strike_avwap_role_str = f"Strike (${strike:.2f}) sits {strike_vs_avwap_pct:.1f}% safely below institutional AVWAP (${avwap:.2f})."
    else:
        diff_above_pct = ((strike - avwap) / avwap) * 100.0
        strike_avwap_val_str = f"+{diff_above_pct:.1f}% Above"
        strike_avwap_role_str = f"Strike (${strike:.2f}) sits ${strike - avwap:.2f} (+{diff_above_pct:.1f}%) above AVWAP (${avwap:.2f}); unshielded by AVWAP."

    if below_dp:
        strike_dp_val_str = f"{strike_vs_dp_pct:.1f}% Below"
        strike_dp_role_str = f"Strike (${strike:.2f}) sits {strike_vs_dp_pct:.1f}% below Dark Pool volume shelf (${dp_shelf:.2f})."
    else:
        diff_dp_above = ((strike - dp_shelf) / dp_shelf) * 100.0
        strike_dp_val_str = f"+{diff_dp_above:.1f}% Above"
        strike_dp_role_str = f"Strike (${strike:.2f}) sits ${strike - dp_shelf:.2f} (+{diff_dp_above:.1f}%) above Dark Pool shelf (${dp_shelf:.2f})."

    # Multi-barrier confluence determination
    if below_avwap and below_dp:
        protection_badge = "🛡️ Dual Whale Shield"
        protection_desc = f"Strike (${strike:.2f}) sits safely protected beneath BOTH AVWAP (${avwap:.2f}) and Dark Pool shelf (${dp_shelf:.2f})."
    elif below_dp and not below_avwap:
        protection_badge = "🛡️ Dark Pool Shelf Shield"
        protection_desc = f"Strike (${strike:.2f}) sits protected beneath Dark Pool shelf (${dp_shelf:.2f}), but sits ${strike - avwap:.2f} above AVWAP (${avwap:.2f})."
    elif below_avwap and not below_dp:
        protection_badge = "🛡️ AVWAP Shield"
        protection_desc = f"Strike (${strike:.2f}) sits protected beneath AVWAP (${avwap:.2f}), but sits ${strike - dp_shelf:.2f} above Dark Pool shelf (${dp_shelf:.2f})."
    else:
        protection_badge = "⚠️ Inside Range (Unshielded)"
        protection_desc = f"Strike (${strike:.2f}) sits above both AVWAP (${avwap:.2f}) and Dark Pool shelf (${dp_shelf:.2f}). No volume barrier defense."

    return {
        "anchored_vwap": round(avwap, 2),
        "avwap_diff_pct": round(avwap_diff_pct, 1),
        "below_avwap": below_avwap,
        "strike_avwap_val_str": strike_avwap_val_str,
        "strike_avwap_role_str": strike_avwap_role_str,
        "dark_pool_shelf": round(dp_shelf, 2),
        "dp_diff_pct": round(dp_diff_pct, 1),
        "below_dp": below_dp,
        "strike_dp_val_str": strike_dp_val_str,
        "strike_dp_role_str": strike_dp_role_str,
        "dark_pool_index_pct": round(dpi, 1),
        "is_accumulating": is_accumulating,
        "protection_badge": protection_badge,
        "protection_desc": protection_desc
    }
