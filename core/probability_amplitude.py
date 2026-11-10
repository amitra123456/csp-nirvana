"""
Probability of Success (PoS) and Move Amplitude Model
======================================================
Calculates:
1. Black-Scholes Baseline PoS (1 - |Delta|)
2. Structural SMC PoS (accounting for institutional demand floors)
3. Probability of Early 50% Take-Profit (PoS 50% TP)
4. Market-Implied 1-Sigma Expected Move and Volatility Floor
5. Upside Mean-Reversion Target Amplitude (to 20 EMA, 50 SMA, and Equilibrium)
6. Expected Velocity (Days to 50% Profit Target)
"""

from __future__ import annotations
import math
from typing import Dict, Any
import numpy as np
import pandas as pd
from scipy.stats import norm

def calculate_parkinson_volatility(df: pd.DataFrame, window: int = 20) -> float:
    """Computes Parkinson extreme-value volatility based on High/Low prices."""
    if len(df) < window:
        return 0.30
    recent = df.iloc[-window:]
    hl = np.log(recent['High'] / recent['Low'])
    pv = np.sqrt((1.0 / (4.0 * math.log(2) * window)) * np.sum(hl ** 2)) * math.sqrt(252)
    return float(pv)

def compute_probability_and_amplitude(
    spot: float,
    strike: float,
    bid: float,
    dte: int,
    iv: float,
    df: pd.DataFrame,
    smc: Dict[str, Any],
    dp: Dict[str, Any] = None,
    r: float = 0.045
) -> Dict[str, Any]:
    """
    Computes analytical & empirical PoS, dark pool alignment, and projected move amplitude.
    """
    T = max(1, dte) / 365.0
    sigma = iv if iv > 0.10 else calculate_parkinson_volatility(df)

    # 1. Theoretical Black-Scholes d1, d2
    d1 = (math.log(spot / strike) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    bs_delta = -norm.cdf(-d1)
    bs_pos_otm = norm.cdf(d2) * 100.0  # P(S_T > K)
    prob_of_touch = min(99.0, 2.0 * abs(bs_delta) * 100.0)

    # 2. Structural & SMC Adjustment Factors
    cost_basis = strike - bid
    structural_boost = 0.0
    if strike <= smc['sma50']:
        structural_boost += 3.0
    if strike <= smc['anchored_vwap']:
        structural_boost += 3.5
    if smc['ote_786'] <= cost_basis <= smc['ote_618'] or cost_basis < smc['ote_786']:
        structural_boost += 4.5

    # Dark Pool Telemetry Boost
    if dp:
        if dp.get('is_accumulating', False):
            structural_boost += 3.5
        if strike <= dp.get('dark_pool_shelf_price', spot):
            structural_boost += 2.5

    # Volume spike check (capitulation wash)
    if len(df) >= 20:
        vol_ratio = df['Volume'].iloc[-1] / df['Volume'].iloc[-20:].mean()
        if vol_ratio >= 2.0:
            structural_boost += 4.0
        elif vol_ratio >= 1.5:
            structural_boost += 2.0

    empirical_pos_otm = min(98.5, max(50.0, bs_pos_otm + structural_boost))

    # 3. Probability of Hitting 50% Take-Profit Early
    prob_50_tp = min(96.0, empirical_pos_otm * 1.08)

    # 4. Implied 1-Sigma Expected Move
    implied_move_dollar = spot * sigma * math.sqrt(T)
    implied_move_pct = (implied_move_dollar / spot) * 100.0
    one_sigma_lower = spot - implied_move_dollar
    one_sigma_upper = spot + implied_move_dollar

    # 5. Bullish Mean-Reversion Target Amplitude
    ema20 = float(df['Close'].ewm(span=20).mean().iloc[-1]) if len(df) >= 20 else spot
    sma50 = smc['sma50'] if not math.isnan(smc['sma50']) else spot
    eq_target = smc['equilibrium']

    amp_to_ema20 = ((ema20 - spot) / spot) * 100.0
    amp_to_sma50 = ((sma50 - spot) / spot) * 100.0
    amp_to_eq = ((eq_target - spot) / spot) * 100.0

    # 6. Downside Cushions
    downside_to_strike = -((spot - strike) / spot) * 100.0
    downside_to_basis = -((spot - cost_basis) / spot) * 100.0
    downside_to_floor = -((spot - smc['swing_low']) / spot) * 100.0

    # 7. Estimated Velocity in Trading Days
    est_days_to_50tp = max(3, int(dte * 0.38))

    return {
        'bs_delta': float(bs_delta),
        'bs_pos_otm': float(bs_pos_otm),
        'empirical_pos_otm': float(empirical_pos_otm),
        'prob_of_touch': float(prob_of_touch),
        'prob_50_tp': float(prob_50_tp),
        'sigma_annual': float(sigma * 100.0),
        'implied_move_dollar': float(implied_move_dollar),
        'implied_move_pct': float(implied_move_pct),
        'one_sigma_lower': float(one_sigma_lower),
        'one_sigma_upper': float(one_sigma_upper),
        'upside_targets': {
            'ema20': {'price': ema20, 'amp_pct': amp_to_ema20},
            'sma50': {'price': sma50, 'amp_pct': amp_to_sma50},
            'equilibrium': {'price': eq_target, 'amp_pct': amp_to_eq}
        },
        'downside_cushions': {
            'strike_cushion_pct': downside_to_strike,
            'basis_cushion_pct': downside_to_basis,
            'structural_floor_pct': downside_to_floor
        },
        'est_days_to_50tp': est_days_to_50tp
    }
