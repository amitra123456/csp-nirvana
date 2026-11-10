"""
Smart Money Concepts (SMC) & S/R Structural Calculation Engine
=============================================================
Calculates multi-timeframe dealing ranges, 50% equilibrium, ICT OTE
(0.618-0.786), Anchored VWAP, 50/200 SMAs, and Fair Value Gaps (FVGs).
"""

from __future__ import annotations
import math
import logging
from typing import Dict, Any, Optional, List
import pandas as pd
import yfinance as yf

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ALPACA_DATA_DIR = PROJECT_ROOT / "data" / "daily"

logging.getLogger("yfinance").setLevel(logging.CRITICAL)

def fetch_ohlcv(ticker: str, lookback_days: int = 250) -> Optional[pd.DataFrame]:
    """
    Fetches clean daily OHLCV bars.
    Prioritizes local Alpaca data warehouse for instantaneous execution,
    falling back to yfinance if not locally cached.
    """
    sym = ticker.strip().upper()
    csv_path = ALPACA_DATA_DIR / f"{sym}.csv"
    if csv_path.exists():
        try:
            df = pd.read_csv(csv_path)
            # Ensure standard column capitalization
            col_rename = {c: c.capitalize() for c in df.columns if c.lower() in ['open', 'high', 'low', 'close', 'volume', 'vwap', 'timestamp']}
            df.rename(columns=col_rename, inplace=True)
            time_col = 'Timestamp' if 'Timestamp' in df.columns else ('timestamp' if 'timestamp' in df.columns else df.columns[0])
            df.index = pd.to_datetime(df[time_col])
            if not df.empty and len(df) >= 50:
                df.dropna(subset=['Close', 'High', 'Low', 'Volume'], inplace=True)
                return df
        except Exception:
            pass

    try:
        df = yf.download(sym, period=f"{lookback_days}d", interval="1d", progress=False)
        if df.empty or len(df) < 50:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df.dropna(subset=['Close', 'High', 'Low', 'Volume'], inplace=True)
        return df
    except Exception:
        return None

def compute_smc_structure(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes SMC dealing ranges, equilibrium, OTE, Anchored VWAP, and FVGs.
    """
    close = float(df['Close'].iloc[-1])
    prev_close = float(df['Close'].iloc[-2]) if len(df) >= 2 else close
    day_pct_change = ((close - prev_close) / prev_close) * 100.0

    # Moving Averages
    sma50 = float(df['Close'].rolling(50).mean().iloc[-1]) if len(df) >= 50 else float('nan')
    sma200 = float(df['Close'].rolling(200).mean().iloc[-1]) if len(df) >= 200 else float('nan')

    # HTF Dealing Range (Last 60 trading bars)
    recent = df.iloc[-60:]
    swing_high = float(recent['High'].max())
    swing_low = float(recent['Low'].min())
    swing_low_idx = recent['Low'].idxmin()

    dealing_range = swing_high - swing_low
    equilibrium = swing_low + 0.5 * dealing_range

    # ICT OTE (Optimal Trade Entry) Retracement levels from swing high to swing low
    ote_618 = swing_high - 0.618 * dealing_range
    ote_705 = swing_high - 0.705 * dealing_range
    ote_786 = swing_high - 0.786 * dealing_range

    # Anchored VWAP from the major swing low anchor
    df_anchor = df[df.index >= swing_low_idx].copy()
    if not df_anchor.empty and df_anchor['Volume'].sum() > 0:
        typical_price = (df_anchor['High'] + df_anchor['Low'] + df_anchor['Close']) / 3.0
        avwap = (typical_price * df_anchor['Volume']).cumsum() / df_anchor['Volume'].cumsum()
        latest_avwap = float(avwap.iloc[-1])
    else:
        latest_avwap = sma50 if not math.isnan(sma50) else close

    # Recent Bullish Fair Value Gaps (FVG)
    fvgs = []
    for i in range(len(df) - 20, len(df)):
        if i >= 2:
            c1_high = float(df['High'].iloc[i - 2])
            c3_low = float(df['Low'].iloc[i])
            if c3_low > c1_high:
                fvgs.append({
                    'date': df.index[i - 1].strftime('%Y-%m-%d'),
                    'bottom': c1_high,
                    'top': c3_low
                })

    return {
        'current_price': close,
        'day_pct_change': day_pct_change,
        'is_red_day': day_pct_change < 0.0,
        'sma50': sma50,
        'sma200': sma200,
        'swing_high': swing_high,
        'swing_low': swing_low,
        'equilibrium': equilibrium,
        'ote_618': ote_618,
        'ote_705': ote_705,
        'ote_786': ote_786,
        'anchored_vwap': latest_avwap,
        'recent_fvgs': fvgs
    }
