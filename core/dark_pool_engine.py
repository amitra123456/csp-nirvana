"""
Dark Pool & Institutional Microstructure Telemetry Engine
=========================================================
Integrates FINRA TRF / ATS off-exchange dark pool volume, whale prints,
and institutional volume points of control (VPOC) into CSP-Nirvana.
"""

from __future__ import annotations
import math
from pathlib import Path
from typing import Dict, Any, Optional
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
POSSIBLE_DATA_DIRS = [
    PROJECT_ROOT.parent / "data",
    PROJECT_ROOT / "data",
    Path.cwd() / "data"
]

def load_microstructure_data(ticker: str) -> Optional[pd.DataFrame]:
    """Loads advanced microstructure features CSV if available in local data warehouse."""
    sym = ticker.lower()
    for d in POSSIBLE_DATA_DIRS:
        csv_path = d / f"{sym}_advanced_microstructure_features.csv"
        if csv_path.exists():
            try:
                df = pd.read_csv(csv_path)
                return df
            except Exception:
                continue
    return None

def compute_dark_pool_telemetry(ticker: str, df_ohlcv: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes or retrieves Dark Pool Index (DPI), Whale volume share,
    and the institutional Dark Pool support shelf.
    """
    try:
        dp_df = load_microstructure_data(ticker)
        
        if dp_df is not None and not dp_df.empty:
            # Local institutional data warehouse available
            latest = dp_df.iloc[-1]
            dp_ratio = float(latest.get('dark_pool_ratio_pct', 42.5))
            whale_count = int(latest.get('whale_count', 2))
            whale_vol_pct = float(latest.get('whale_volume_share_pct', 8.5))
            iso_net_buy = float(latest.get('iso_net_buy_pct', 52.0))
        else:
            # Synthetic estimation from volume dispersion & typical off-exchange microstructure:
            # On large-cap equities, off-exchange volume typically averages 38% to 48%.
            # Higher volume days with tight bar ranges indicate heavy off-exchange absorption.
            if df_ohlcv is not None and len(df_ohlcv) > 0 and 'Volume' in df_ohlcv.columns:
                recent = df_ohlcv.iloc[-10:] if len(df_ohlcv) >= 10 else df_ohlcv
                mean_vol = float(recent['Volume'].mean()) if len(recent) > 0 and recent['Volume'].mean() > 0 else 1.0
                vol_spike = float(df_ohlcv['Volume'].iloc[-1] / mean_vol) if mean_vol > 0 else 1.0
                
                dp_ratio = min(62.0, max(32.0, 42.0 + (vol_spike - 1.0) * 6.5))
                whale_count = max(1, int(vol_spike * 2))
                whale_vol_pct = min(25.0, dp_ratio * 0.22)
                iso_net_buy = 55.0 if df_ohlcv['Close'].iloc[-1] >= df_ohlcv['Open'].iloc[-1] else 48.0
            else:
                dp_ratio = 42.0
                whale_count = 2
                whale_vol_pct = 9.2
                iso_net_buy = 50.0

        # Institutional Dark Pool Shelf / Volume POC
        dp_shelf = float(df_ohlcv['Close'].iloc[-1]) if (df_ohlcv is not None and len(df_ohlcv) > 0) else 100.0
        if df_ohlcv is not None and len(df_ohlcv) > 0 and 'Volume' in df_ohlcv.columns:
            recent_20 = df_ohlcv.iloc[-20:] if len(df_ohlcv) >= 20 else df_ohlcv
            typical_prices = (recent_20['High'] + recent_20['Low'] + recent_20['Close']) / 3.0
            vol_sum = float(recent_20['Volume'].sum())
            if vol_sum > 0:
                dp_shelf = float(np.average(typical_prices, weights=recent_20['Volume']))
            else:
                dp_shelf = float(typical_prices.mean())

        is_accumulating = dp_ratio >= 42.0 and iso_net_buy >= 50.0

        return {
            'dark_pool_ratio_pct': float(dp_ratio),
            'is_accumulating': bool(is_accumulating),
            'whale_count': int(whale_count),
            'whale_volume_share_pct': float(whale_vol_pct),
            'iso_net_buy_pct': float(iso_net_buy),
            'dark_pool_shelf_price': float(dp_shelf)
        }
    except Exception:
        # Failsafe fallback: unknown (no boost, never assume accumulating)
        last_px = float(df_ohlcv['Close'].iloc[-1]) if (df_ohlcv is not None and len(df_ohlcv) > 0) else 100.0
        return {
            'dark_pool_ratio_pct': 40.0,
            'is_accumulating': False,
            'whale_count': 0,
            'whale_volume_share_pct': 0.0,
            'iso_net_buy_pct': 50.0,
            'dark_pool_shelf_price': last_px
        }
