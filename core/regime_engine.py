"""
Market Regime Classification & Volatility Dynamics Engine
=========================================================
Classifies stock price action into 5 systematic market regimes:
1. Super Bull Breakout (Trend Impulse)
2. Bull Retracement / Dip (Ideal CSP Entry Zone)
3. Dead Chop / Rangebound (High Theta Decay Efficiency)
4. Sweet Spot Springboard (200 SMA Support Test)
5. Secular Bear / Breakdown (Elevated Downside Risk - Requires >=12% Cushion)

Uses:
- EMAs (10, 30), SMAs (50, 200)
- Average Directional Index ADX(14), +DI, -DI
- Choppiness Index CI(14)
- 20-Day Parkinson Volatility & 252D Bollinger Band Width Percentile
"""

from __future__ import annotations
import math
from typing import Dict, Any
import numpy as np
import pandas as pd

def compute_market_regime(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes trend strength (ADX), consolidation (CI), moving average alignment,
    and classifies the current market regime for systematic CSP execution.
    """
    if df is None or len(df) < 30:
        return {
            "regime_id": 2,
            "regime_name": "Neutral Consolidation",
            "regime_badge": "🟡 Neutral",
            "regime_color": "#F59E0B",
            "adx_14": 18.0,
            "plus_di": 20.0,
            "minus_di": 20.0,
            "ci_14": 50.0,
            "trend_strength_desc": "Moderate / Neutral",
            "is_bear_or_breakdown": False,
            "recommended_min_cushion": 7.0,
            "ema10": float("nan"),
            "ema30": float("nan"),
            "sma50": float("nan"),
            "sma200": float("nan"),
            "summary": "Insufficient price history for complete regime classification."
        }

    c = df["Close"]
    h = df["High"]
    l = df["Low"]

    spot = float(c.iloc[-1])

    # 1. Moving Averages
    ema10 = float(c.ewm(span=10, adjust=False).mean().iloc[-1])
    ema30 = float(c.ewm(span=30, adjust=False).mean().iloc[-1])
    sma50 = float(c.rolling(50).mean().iloc[-1]) if len(c) >= 50 else float(c.mean())
    sma200 = float(c.rolling(200).mean().iloc[-1]) if len(c) >= 200 else float(c.mean())

    # 2. True Range & Directional Movement (ADX 14)
    tr1 = h - l
    tr2 = (h - c.shift(1)).abs()
    tr3 = (l - c.shift(1)).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr14 = tr.ewm(alpha=1/14, adjust=False).mean()

    up = h - h.shift(1)
    dn = l.shift(1) - l
    p_dm = np.where((up > dn) & (up > 0), up, 0.0)
    m_dm = np.where((dn > up) & (dn > 0), dn, 0.0)

    p_di_series = 100.0 * (pd.Series(p_dm, index=c.index).ewm(alpha=1/14, adjust=False).mean() / atr14)
    m_di_series = 100.0 * (pd.Series(m_dm, index=c.index).ewm(alpha=1/14, adjust=False).mean() / atr14)
    dx = 100.0 * ((p_di_series - m_di_series).abs() / (p_di_series + m_di_series + 1e-9))
    adx_series = dx.ewm(alpha=1/14, adjust=False).mean()

    adx_val = float(adx_series.iloc[-1])
    p_di = float(p_di_series.iloc[-1])
    m_di = float(m_di_series.iloc[-1])

    # 3. Choppiness Index (14)
    # CI = 100 * LOG10( SUM(ATR(1), 14) / (MaxHigh(14) - MinLow(14)) ) / LOG10(14)
    sum_tr14 = tr.rolling(14).sum().iloc[-1]
    max_h14 = h.rolling(14).max().iloc[-1]
    min_l14 = l.rolling(14).min().iloc[-1]
    denom = max(1e-6, max_h14 - min_l14)
    ci_val = float(100.0 * (math.log10(sum_tr14 / denom) / math.log10(14)))
    ci_val = max(0.0, min(100.0, ci_val))

    # 4. Volatility Percentile (20-day BB Width)
    std20 = float(c.rolling(20).std().iloc[-1]) if len(c) >= 20 else 1.0
    sma20 = float(c.rolling(20).mean().iloc[-1]) if len(c) >= 20 else spot
    bb_width = (4.0 * std20) / max(0.01, sma20)

    # 5. Regime Classification Logic
    # Check 200 SMA proximity
    dist_to_sma200_pct = ((spot - sma200) / sma200) * 100.0 if not math.isnan(sma200) else 0.0

    is_bear = False
    if not math.isnan(sma200) and spot < sma200:
        if (not math.isnan(sma50) and sma50 < sma200) or spot < ema30 or (adx_val > 25.0 and m_di > p_di):
            is_bear = True

    if is_bear:
        regime_id = 5
        regime_name = "Secular Bear / Breakdown"
        regime_badge = "🔴 Secular Bear"
        regime_color = "#EF4444"
        is_bear_or_breakdown = True
        recommended_min_cushion = 12.0
        summary = "Asset trading beneath 200 SMA in negative trend. Elevated downside tail risk; requires ≥12% defensive cushion."
    elif not math.isnan(sma200) and abs(dist_to_sma200_pct) <= 3.5 and spot >= sma200 * 0.96:
        regime_id = 4
        regime_name = "Sweet Spot Springboard (200 SMA Test)"
        regime_badge = "🔵 Springboard (200 MA)"
        regime_color = "#38BDF8"
        is_bear_or_breakdown = False
        recommended_min_cushion = 8.0
        summary = "Price retesting 200 SMA institutional demand shelf. Strong bounce candidate; short put strike anchored under 200 MA."
    elif adx_val < 20.0 or ci_val > 61.8:
        regime_id = 3
        regime_name = "Dead Chop / Rangebound"
        regime_badge = "🟡 Dead Chop"
        regime_color = "#EAB308"
        is_bear_or_breakdown = False
        recommended_min_cushion = 7.0
        summary = "Low directional energy with horizontal mean-reversion. Premium decays rapidly; high win rate environment for CSPs."
    elif spot > ema10 and ema10 > ema30 and (math.isnan(sma200) or spot > sma200) and adx_val >= 22.0 and p_di > m_di:
        regime_id = 1
        regime_name = "Super Bull Breakout"
        regime_badge = "🟢 Super Bull"
        regime_color = "#10B981"
        is_bear_or_breakdown = False
        recommended_min_cushion = 7.0
        summary = "Strong upward momentum and institutional order flow. High baseline PoS, but option IV may be compressed."
    else:
        # Pullback in bull or neutral market - The ideal CSP setup
        regime_id = 2
        regime_name = "Bull Retracement / Dip"
        regime_badge = "💎 Bull Retrace"
        regime_color = "#06B6D4"
        is_bear_or_breakdown = False
        recommended_min_cushion = 7.0
        summary = "Macro bull asset pulling back into institutional discount zone. Volatility expands on the dip, providing peak CSP yield."

    # Trend Strength Interpretation
    if adx_val >= 30.0:
        trend_strength_desc = f"Strong Trending ({'Bull' if p_di > m_di else 'Bear'})"
    elif adx_val >= 20.0:
        trend_strength_desc = f"Moderate Trending ({'Bull' if p_di > m_di else 'Bear'})"
    else:
        trend_strength_desc = "Non-Trending / Chop (ADX < 20)"

    return {
        "regime_id": regime_id,
        "regime_name": regime_name,
        "regime_badge": regime_badge,
        "regime_color": regime_color,
        "adx_14": round(adx_val, 1),
        "plus_di": round(p_di, 1),
        "minus_di": round(m_di, 1),
        "ci_14": round(ci_val, 1),
        "bb_width": round(bb_width, 3),
        "trend_strength_desc": trend_strength_desc,
        "is_bear_or_breakdown": is_bear_or_breakdown,
        "recommended_min_cushion": recommended_min_cushion,
        "ema10": round(ema10, 2),
        "ema30": round(ema30, 2),
        "sma50": round(sma50, 2),
        "sma200": round(sma200, 2),
        "dist_to_sma200_pct": round(dist_to_sma200_pct, 1),
        "summary": summary
    }
