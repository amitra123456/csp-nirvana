try:
    from config.settings import (
        CORE_TRIO,
        TIER_1_BLUE_CHIPS,
        TIER_2_HIGH_BETA,
        DEFAULT_UNIVERSE,
        DEFAULTS,
        BANNER_CREED,
        PROJECT_ROOT,
        TICKERS_FILE
    )
except (ImportError, ModuleNotFoundError):
    from csp_nirvana.config.settings import (
        CORE_TRIO,
        TIER_1_BLUE_CHIPS,
        TIER_2_HIGH_BETA,
        DEFAULT_UNIVERSE,
        DEFAULTS,
        BANNER_CREED,
        PROJECT_ROOT,
        TICKERS_FILE
    )
