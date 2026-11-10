try:
    from core.smc_engine import fetch_ohlcv, compute_smc_structure
    from core.probability_amplitude import compute_probability_and_amplitude, calculate_parkinson_volatility
    from core.options_scanner import scan_single_ticker, run_screener
    from core.dark_pool_engine import compute_dark_pool_telemetry
except (ImportError, ModuleNotFoundError):
    from csp_nirvana.core.smc_engine import fetch_ohlcv, compute_smc_structure
    from csp_nirvana.core.probability_amplitude import compute_probability_and_amplitude, calculate_parkinson_volatility
    from csp_nirvana.core.options_scanner import scan_single_ticker, run_screener
    from csp_nirvana.core.dark_pool_engine import compute_dark_pool_telemetry
