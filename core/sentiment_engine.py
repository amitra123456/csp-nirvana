"""
Multi-Horizon News Sentiment & Divergence Engine (5D / 10D / 21D)
=================================================================
Ingests news articles via Alpaca News API (with yfinance fallback),
scores financial sentiment using the Loughran-McDonald institutional lexicon,
and evaluates retail media fear vs. off-exchange Dark Pool whale accumulation.
"""

from __future__ import annotations
import os
import re
import math
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
for env_path in [PROJECT_ROOT.parent / ".env", PROJECT_ROOT / ".env"]:
    if env_path.exists():
        load_dotenv(env_path)

logger = logging.getLogger("SentimentEngine")

# ---------------------------------------------------------------------------
# Loughran-McDonald & Financial Domain-Specific Lexicon
# ---------------------------------------------------------------------------
FIN_POS_WORDS = {
    'beat', 'beats', 'beating', 'record', 'records', 'surge', 'surges', 'surging',
    'upgrade', 'upgrades', 'upgraded', 'outperform', 'buy', 'growth', 'grow',
    'profit', 'profits', 'profitable', 'expansion', 'expand', 'expands',
    'rally', 'rallies', 'rallying', 'soar', 'soars', 'bullish', 'dividend',
    'hike', 'high', 'highs', 'gain', 'gains', 'gaining', 'boost', 'boosts',
    'breakthrough', 'milestone', 'accretive', 'strong', 'strength', 'upside',
    'outpace', 'outpaces', 'buyback', 'repurchase', 'accelerate', 'innovation'
}

FIN_NEG_WORDS = {
    'subpoena', 'subpoenas', 'probe', 'probes', 'investigate', 'investigates',
    'investigation', 'delay', 'delays', 'delayed', 'plunge', 'plunges', 'plunging',
    'drop', 'drops', 'dropping', 'fall', 'falls', 'falling', 'sell-off', 'selloff',
    'bust', 'crash', 'crashes', 'downgrade', 'downgrades', 'downgraded',
    'loss', 'losses', 'warns', 'warned', 'warning', 'warnings', 'lawsuit',
    'antitrust', 'bearish', 'cut', 'cuts', 'cutting', 'recession', 'headwind',
    'headwinds', 'slump', 'slumps', 'miss', 'misses', 'missed', 'default',
    'fraud', 'layoff', 'layoffs', 'downside', 'weak', 'weakness', 'decline'
}

_SENTIMENT_CACHE: Dict[str, Dict[str, Any]] = {}
_CACHE_TIMESTAMP: Dict[str, datetime] = {}
CACHE_TTL_MINUTES = 15

def clean_text_tokens(text: str) -> List[str]:
    """Tokenizes text into clean lower-case alphanumeric words."""
    clean = re.sub(r'[^a-zA-Z0-9\s-]', ' ', text.lower())
    return clean.replace('-', ' ').split()

def score_financial_text(text: str) -> float:
    """Scores a single article text snippet using financial lexicon polarity."""
    tokens = set(clean_text_tokens(text))
    if not tokens:
        return 0.0
    pos_count = sum(1 for w in tokens if w in FIN_POS_WORDS)
    neg_count = sum(1 for w in tokens if w in FIN_NEG_WORDS)
    denom = pos_count + neg_count
    if denom == 0:
        return 0.0
    return (pos_count - neg_count) / float(denom)

def fetch_articles_alpaca(ticker: str, lookback_days: int = 21, limit: int = 50) -> List[Dict[str, Any]]:
    """Fetches articles for a symbol from Alpaca News API."""
    key = os.getenv("ALPACA_API_KEY") or os.getenv("APCA_API_KEY_ID")
    sec = os.getenv("ALPACA_SECRET_KEY") or os.getenv("APCA_API_SECRET_KEY")
    if not key or not sec:
        return []

    try:
        from alpaca.data.historical.news import NewsClient
        from alpaca.data.requests import NewsRequest

        client = NewsClient(api_key=key, secret_key=sec)
        end_dt = datetime.now()
        start_dt = end_dt - timedelta(days=lookback_days)

        req = NewsRequest(symbols=ticker.upper(), start=start_dt, end=end_dt, limit=limit)
        news_set = client.get_news(req)
        articles_raw = []
        if hasattr(news_set, 'data') and isinstance(news_set.data, dict) and 'news' in news_set.data:
            articles_raw = news_set.data['news']
        elif hasattr(news_set, '__getitem__'):
            try:
                articles_raw = news_set['news']
            except Exception:
                pass

        cleaned = []
        for a in articles_raw:
            if isinstance(a, dict):
                h = a.get("headline", "")
                s = a.get("summary", "") or ""
                dt = a.get("created_at")
                if isinstance(dt, datetime):
                    dt = dt.replace(tzinfo=None)
                elif isinstance(dt, str):
                    try:
                        dt = datetime.fromisoformat(dt.replace('Z', '+00:00')).replace(tzinfo=None)
                    except Exception:
                        dt = datetime.now()
                else:
                    dt = datetime.now()
                src = a.get("source", "Alpaca Institutional Feed")
                url = a.get("url", "")
            else:
                h = getattr(a, "headline", "")
                s = getattr(a, "summary", "") or ""
                dt = getattr(a, "created_at", datetime.now())
                if isinstance(dt, datetime):
                    dt = dt.replace(tzinfo=None)
                src = getattr(a, "source", "Alpaca Institutional Feed")
                url = getattr(a, "url", "")

            cleaned.append({
                "headline": h,
                "summary": s,
                "created_at": dt,
                "source": src,
                "url": url
            })
        return cleaned
    except Exception as e:
        logger.warning(f"Alpaca News error for {ticker}: {e}")
        return []

def fetch_articles_yfinance(ticker: str) -> List[Dict[str, Any]]:
    """Fallback article fetcher using yfinance."""
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        raw = t.news
        if not raw:
            return []
        cleaned = []
        for item in raw:
            title = item.get("title", "")
            pub_time = item.get("providerPublishTime")
            dt = datetime.fromtimestamp(pub_time) if pub_time else datetime.now()
            cleaned.append({
                "headline": title,
                "summary": item.get("summary", ""),
                "created_at": dt,
                "source": item.get("publisher", "Yahoo Finance"),
                "url": item.get("link", "")
            })
        return cleaned
    except Exception:
        return []

def compute_multi_horizon_sentiment(
    ticker: str,
    dark_pool_ratio_pct: float = 40.0,
    is_accumulating: bool = False
) -> Dict[str, Any]:
    """
    Computes 5-Day, 10-Day, and 21-Day news sentiment scores (-100 to +100),
    identifies headline catalysts, and evaluates the Sentiment vs. Dark Pool Divergence.
    """
    sym = ticker.strip().upper()
    now = datetime.now()

    # Check cache
    if sym in _SENTIMENT_CACHE:
        cached_time = _CACHE_TIMESTAMP.get(sym)
        if cached_time and (now - cached_time).total_seconds() < CACHE_TTL_MINUTES * 60:
            return _SENTIMENT_CACHE[sym]

    articles = fetch_articles_alpaca(sym, lookback_days=21, limit=50)
    if not articles:
        articles = fetch_articles_yfinance(sym)

    s5_scores, s10_scores, s21_scores = [], [], []
    recent_headlines = []

    for a in articles:
        dt = a["created_at"]
        days_ago = (now - dt).total_seconds() / 86400.0
        text = f"{a['headline']} {a['summary']}"
        score = score_financial_text(text)

        if days_ago <= 5.0:
            s5_scores.append(score)
            if len(recent_headlines) < 4:
                recent_headlines.append({
                    "date": dt.strftime("%b %d, %H:%M"),
                    "headline": a["headline"],
                    "polarity": "Bullish" if score > 0.1 else ("Bearish" if score < -0.1 else "Neutral"),
                    "color": "#10B981" if score > 0.1 else ("#EF4444" if score < -0.1 else "#94A3B8")
                })
        if days_ago <= 10.0:
            s10_scores.append(score)
        if days_ago <= 21.0:
            s21_scores.append(score)

    def calc_horizon_score(scores: List[float]) -> float:
        if not scores:
            return 0.0
        # Normalize to -100 to +100
        mean_score = sum(scores) / len(scores)
        scaled = mean_score * 100.0
        return max(-100.0, min(100.0, round(scaled, 1)))

    score_5d = calc_horizon_score(s5_scores)
    score_10d = calc_horizon_score(s10_scores)
    score_21d = calc_horizon_score(s21_scores)

    # Narrative Inflection Delta (5D vs 21D)
    momentum_delta = round(score_5d - score_21d, 1)
    if momentum_delta >= 15.0:
        trend_desc = f"Rapidly Improving (+{momentum_delta:.1f} pts)"
    elif momentum_delta <= -15.0:
        trend_desc = f"Sharp Deterioration ({momentum_delta:.1f} pts)"
    else:
        trend_desc = "Stable Narrative Drift"

    # Sentiment vs. Dark Pool Divergence Evaluation
    # This is the core quantitative alpha signal
    if score_5d <= -10.0 and dark_pool_ratio_pct >= 45.0:
        divergence_signal = "💎 Whale Absorption of FUD"
        divergence_badge = "💎 Whale Absorption"
        divergence_color = "#06B6D4"
        divergence_desc = (
            f"Negative media headlines ({score_5d:+.1f} 5D Sentiment) are inflating option IV to peak prices, "
            f"while institutional whales are aggressively soaking up shares off-exchange ({dark_pool_ratio_pct:.1f}% DPI). "
            f"Textbook high-conviction CSP entry setup."
        )
    elif score_5d >= 20.0 and dark_pool_ratio_pct < 35.0:
        divergence_signal = "⚠️ Retail Hype / Whale Distribution"
        divergence_badge = "⚠️ Retail FOMO Trap"
        divergence_color = "#F59E0B"
        divergence_desc = (
            f"Media headlines are overly euphoric ({score_5d:+.1f} 5D Sentiment), but off-exchange institutional buying is weak "
            f"({dark_pool_ratio_pct:.1f}% DPI). High risk of cycle exhaustion."
        )
    elif score_5d <= -25.0 and dark_pool_ratio_pct < 35.0:
        divergence_signal = "🔴 Real Breakdown / Liquidation"
        divergence_badge = "🔴 Institutional Liquidation"
        divergence_color = "#EF4444"
        divergence_desc = (
            f"Severe negative news sentiment ({score_5d:+.1f}) combined with low off-exchange absorption ({dark_pool_ratio_pct:.1f}% DPI). "
            f"Enforce mandatory ≥12% defensive cushion."
        )
    else:
        divergence_signal = "⚖️ Balanced Sentiment & Flow"
        divergence_badge = "⚖️ Balanced Flow"
        divergence_color = "#38BDF8"
        divergence_desc = (
            f"5D sentiment ({score_5d:+.1f}) aligns normally with institutional volume ({dark_pool_ratio_pct:.1f}% DPI). "
            f"Standard systematic parameters apply."
        )

    result = {
        "score_5d": score_5d,
        "score_10d": score_10d,
        "score_21d": score_21d,
        "momentum_delta": momentum_delta,
        "trend_desc": trend_desc,
        "article_count_5d": len(s5_scores),
        "article_count_21d": len(articles),
        "divergence_signal": divergence_signal,
        "divergence_badge": divergence_badge,
        "divergence_color": divergence_color,
        "divergence_desc": divergence_desc,
        "recent_headlines": recent_headlines
    }

    _SENTIMENT_CACHE[sym] = result
    _CACHE_TIMESTAMP[sym] = now
    return result
