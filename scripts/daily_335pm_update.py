"""
Daily 3:35 PM EST Automated Data Download & Quantitative Engine Pipeline
========================================================================
Executes at 3:35 PM EST (Monday - Friday):
1. Ingests latest daily bars from Alpaca API for all 108 institutional stocks.
2. Runs the candle-by-candle simulation across the entire population to determine:
   - All historical closed trades (open date, close date, outcome, profit %, loss tracking).
   - Current active open signals (live mark, profit captured, 50% TP progress).
3. Pre-computes screener setups and exports verified cache for the Web UI.
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd
from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

DATA_DIR = PROJECT_ROOT / "data" / "daily"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Load environment
for env_path in [PROJECT_ROOT.parent / ".env", PROJECT_ROOT / ".env"]:
    if env_path.exists():
        load_dotenv(env_path)

from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame

from config.settings import ALL_108_CANDIDATES, DEFAULTS
from core.portfolio_tracker import run_candle_by_candle_population_sim
from core.options_scanner import run_screener

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def download_alpaca_daily():
    """Fetches daily bars from Alpaca for all 108 tickers."""
    key = os.getenv("ALPACA_API_KEY") or os.getenv("APCA_API_KEY_ID")
    sec = os.getenv("ALPACA_SECRET_KEY") or os.getenv("APCA_API_SECRET_KEY")

    if not key or not sec:
        logging.warning("Alpaca credentials missing; proceeding with existing local warehouse data.")
        return False

    client = StockHistoricalDataClient(api_key=key, secret_key=sec)
    end_dt = datetime.now()
    start_dt = end_dt - timedelta(days=730)

    logging.info(f"Downloading latest daily bars from Alpaca for {len(ALL_108_CANDIDATES)} tickers...")
    
    # Process in batches of 25
    batch_size = 25
    success_count = 0
    for i in range(0, len(ALL_108_CANDIDATES), batch_size):
        batch = ALL_108_CANDIDATES[i:i + batch_size]
        try:
            req = StockBarsRequest(
                symbol_or_symbols=batch,
                timeframe=TimeFrame.Day,
                start=start_dt,
                end=end_dt
            )
            bars = client.get_stock_bars(req)
            if hasattr(bars, "df") and not bars.df.empty:
                df = bars.df.reset_index()
                for sym in batch:
                    sym_df = df[df["symbol"] == sym].copy()
                    if not sym_df.empty:
                        # Normalize column names to Title Case
                        col_map = {c: c.capitalize() for c in sym_df.columns if c.lower() in ['open', 'high', 'low', 'close', 'volume', 'vwap']}
                        sym_df.rename(columns=col_map, inplace=True)
                        out_file = DATA_DIR / f"{sym}.csv"
                        sym_df.to_csv(out_file, index=False)
                        success_count += 1
        except Exception as e:
            logging.error(f"Error downloading batch {batch}: {e}")

    logging.info(f"Successfully updated Alpaca data for {success_count} tickers.")
    return True

def run_daily_pipeline():
    """Runs the full 3:35 PM calculation pipeline."""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S EST")
    logging.info(f"=== Starting CSP-Nirvana Daily 3:35 PM Engine Pipeline at {now_str} ===")

    # Step 1: Download latest Alpaca data
    download_alpaca_daily()

    # Step 2: Candle-by-candle simulation across the entire population
    logging.info("Executing candle-by-candle simulation across 108-stock population...")
    sim_results = run_candle_by_candle_population_sim(DATA_DIR)
    
    sim_cache_file = PROJECT_ROOT / "data" / "daily_sim_results.json"
    with open(sim_cache_file, "w", encoding="utf-8") as f:
        json.dump(sim_results, f, indent=2, default=str)
    logging.info(f"Saved candle simulation: {len(sim_results['active_signals'])} active positions, {len(sim_results['closed_trades'])} closed trades.")

    # Step 3: Run full universe live scan
    logging.info("Pre-computing screener scan for full universe...")
    scan_results, _ = run_screener(
        tickers=ALL_108_CANDIDATES,
        target_dte=DEFAULTS["target_dte"],
        cushion_pct=DEFAULTS["cushion_pct"],
        min_premium=DEFAULTS["min_premium"],
        min_roc_pct=DEFAULTS["min_roc_pct"]
    )

    clean_scan = []
    for r in scan_results:
        item = dict(r)
        if 'all_ladder_strikes' in item:
            item['all_ladder_strikes'] = [
                {k: v for k, v in l.items() if k != 'all_ladder_strikes'}
                for l in item['all_ladder_strikes']
            ]
        clean_scan.append(item)

    scan_cache_file = PROJECT_ROOT / "data" / "latest_scan_results.json"
    with open(scan_cache_file, "w", encoding="utf-8") as f:
        json.dump(clean_scan, f, indent=2, default=str)
    logging.info(f"Saved screener scan: {len(clean_scan)} qualified setups found.")

    # Step 4: Write timestamp and status metadata
    meta = {
        "last_updated": datetime.now().strftime("%Y-%m-%d 15:35:00 EST"),
        "timestamp_raw": datetime.now().isoformat(),
        "status": "SUCCESS",
        "total_population": len(ALL_108_CANDIDATES),
        "qualified_setups_count": len(scan_results),
        "active_positions_count": len(sim_results["active_signals"]),
        "closed_trades_count": len(sim_results["closed_trades"]),
        "next_scheduled_run": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d 15:35:00 EST")
    }

    meta_file = PROJECT_ROOT / "data" / "last_update.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    logging.info("=== 3:35 PM Daily Pipeline Completed Successfully ===")

if __name__ == "__main__":
    run_daily_pipeline()
