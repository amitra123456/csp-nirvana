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

try:
    from dotenv import load_dotenv
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
    for env_path in [PROJECT_ROOT.parent / ".env", PROJECT_ROOT / ".env"]:
        if env_path.exists():
            load_dotenv(env_path)
except ImportError:
    pass

# Also check Streamlit secrets if running on Streamlit Cloud
try:
    import streamlit as st
    if hasattr(st, "secrets"):
        for k in ["ALPACA_API_KEY", "APCA_API_KEY_ID", "ALPACA_SECRET_KEY", "APCA_API_SECRET_KEY"]:
            if k in st.secrets and k not in os.environ:
                os.environ[k] = st.secrets[k]
except Exception:
    pass

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
    'investigation', 'investigations', 'delay', 'delays', 'delayed', 'plunge',
    'plunges', 'plunging', 'drop', 'drops', 'dropping', 'fall', 'falls', 'falling',
    'sell-off', 'selloff', 'bust', 'crash', 'crashes', 'downgrade', 'downgrades',
    'downgraded', 'loss', 'losses', 'warns', 'warned', 'warning', 'warnings',
    'lawsuit', 'lawsuits', 'antitrust', 'bearish', 'cut', 'cuts', 'cutting',
    'recession', 'headwind', 'headwinds', 'slump', 'slumps', 'miss', 'misses',
    'missed', 'default', 'fraud', 'layoff', 'layoffs', 'downside', 'weak',
    'weakness', 'decline', 'scandal', 'scandals', 'affair', 'affairs',
    'allegation', 'allegations', 'scrutiny', 'sued', 'misleading', 'oversold',
    'sanction', 'sanctions', 'ban', 'banned', 'breach'
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

def fetch_articles_alpaca(
    ticker: str,
    start_days_ago: float = 21.0,
    end_days_ago: float = 0.0,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """Fetches articles for a symbol from Alpaca News API within a specific chronological window."""
    key = os.getenv("ALPACA_API_KEY") or os.getenv("APCA_API_KEY_ID")
    sec = os.getenv("ALPACA_SECRET_KEY") or os.getenv("APCA_API_SECRET_KEY")
    if not key or not sec:
        return []

    try:
        from alpaca.data.historical.news import NewsClient
        from alpaca.data.requests import NewsRequest

        client = NewsClient(api_key=key, secret_key=sec)
        now = datetime.now()
        start_dt = now - timedelta(days=start_days_ago)
        end_dt = now - timedelta(days=end_days_ago) if end_days_ago > 0 else now

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
        elif hasattr(news_set, 'news'):
            articles_raw = getattr(news_set, 'news', [])

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

def fetch_articles_rss(ticker: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Fetches real-time financial headlines via institutional RSS feeds (CNBC, Yahoo, Bloomberg, Reuters)."""
    import urllib.request
    import xml.etree.ElementTree as ET
    from email.utils import parsedate_to_datetime

    sym = ticker.strip().upper()
    url = f"https://news.google.com/rss/search?q={sym}+stock&hl=en-US&gl=US&ceid=US:en"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    cleaned = []
    try:
        resp = urllib.request.urlopen(req, timeout=5)
        root = ET.fromstring(resp.read())
        for it in root.findall(".//item")[:limit]:
            title = it.find("title").text if it.find("title") is not None else ""
            pub_str = it.find("pubDate").text if it.find("pubDate") is not None else ""
            link = it.find("link").text if it.find("link") is not None else ""
            src = it.find("source").text if it.find("source") is not None else "Institutional Wire"
            dt = datetime.now()
            if pub_str:
                try:
                    dt = parsedate_to_datetime(pub_str).replace(tzinfo=None)
                except Exception:
                    pass
            cleaned.append({
                "headline": title,
                "summary": title,
                "created_at": dt,
                "source": src,
                "url": link
            })
    except Exception as e:
        logger.warning(f"RSS fetch error for {ticker}: {e}")
    return cleaned

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
    is_accumulating: bool = False,
    force_refresh: bool = False
) -> Dict[str, Any]:
    """
    Computes 5-Day, 10-Day, and 21-Day news sentiment scores (-100 to +100),
    identifies headline catalysts, and evaluates the Sentiment vs. Dark Pool Divergence.
    Queries distinct chronological windows to prevent single-batch flooding on high-volume symbols.
    """
    sym = ticker.strip().upper()
    now = datetime.now()

    # Check cache (only if non-empty and valid)
    if not force_refresh and sym in _SENTIMENT_CACHE:
        cached_time = _CACHE_TIMESTAMP.get(sym)
        if cached_time and (now - cached_time).total_seconds() < CACHE_TTL_MINUTES * 60:
            cached_res = _SENTIMENT_CACHE[sym]
            if cached_res.get("recent_headlines"):
                return cached_res

    # 1. Fetch Window 1 (Acute Recent: 0 to 5 days ago)
    w1_articles = fetch_articles_alpaca(sym, start_days_ago=5.0, end_days_ago=0.0, limit=50)
    # 2. Fetch Window 2 (Intermediate Horizon: 5 to 10 days ago)
    w2_articles = fetch_articles_alpaca(sym, start_days_ago=10.0, end_days_ago=5.0, limit=50)
    # 3. Fetch Window 3 (Baseline Horizon: 10 to 21 days ago)
    w3_articles = fetch_articles_alpaca(sym, start_days_ago=21.0, end_days_ago=10.0, limit=50)

    # If Alpaca has sparse or no data, fallback to RSS / YFinance
    if (len(w1_articles) + len(w2_articles) + len(w3_articles)) < 5:
        fallback_articles = fetch_articles_rss(sym, limit=60)
        if not fallback_articles:
            fallback_articles = fetch_articles_yfinance(sym)
        for a in fallback_articles:
            dt = a.get("created_at", now)
            days_ago = (now - dt).total_seconds() / 86400.0
            if days_ago <= 5.0:
                w1_articles.append(a)
            elif days_ago <= 10.0:
                w2_articles.append(a)
            elif days_ago <= 21.0:
                w3_articles.append(a)

    s1_scores = [score_financial_text(f"{a['headline']} {a.get('summary', '')}") for a in w1_articles]
    s2_scores = [score_financial_text(f"{a['headline']} {a.get('summary', '')}") for a in w2_articles]
    s3_scores = [score_financial_text(f"{a['headline']} {a.get('summary', '')}") for a in w3_articles]

    def calc_horizon_score(scores: List[float]) -> float:
        if not scores:
            return 0.0
        mean_score = sum(scores) / len(scores)
        scaled = mean_score * 100.0
        return max(-100.0, min(100.0, round(scaled, 1)))

    score_5d = calc_horizon_score(s1_scores)
    # 10D rolling horizon includes window 1 (0-5d) + window 2 (5-10d)
    score_10d = calc_horizon_score(s1_scores + s2_scores)
    # 21D rolling horizon includes window 1 + 2 + 3
    score_21d = calc_horizon_score(s1_scores + s2_scores + s3_scores)

    # Narrative Inflection Delta (5D vs 21D)
    momentum_delta = round(score_5d - score_21d, 1)
    if momentum_delta >= 15.0:
        trend_desc = f"Rapidly Improving (+{momentum_delta:.1f} pts)"
    elif momentum_delta <= -15.0:
        trend_desc = f"Sharp Deterioration ({momentum_delta:.1f} pts)"
    else:
        trend_desc = "Stable Narrative Drift"

    # Headline catalyst selection: prioritize high-impact breaking catalysts
    CATALYST_KEYS = {
        'probe', 'spy', 'scandal', 'investig', 'affair', 'alleg', 'lawsuit',
        'sec', 'doj', 'fbi', 'jensen', 'huang', 'drop', 'fall', 'plunge',
        'slump', 'crash', 'downgrade', 'antitrust', 'subpoena', 'fraud',
        'tariff', 'ban', 'sanction', 'ai', 'blackwell', 'surge', 'rally', 'beat'
    }

    all_recent = w1_articles if w1_articles else (w2_articles + w3_articles)
    scored_headlines = []
    seen_titles = set()

    for a in all_recent:
        title = a.get("headline", "").strip()
        if not title or title.lower() in seen_titles:
            continue
        seen_titles.add(title.lower())
        score = score_financial_text(f"{title} {a.get('summary', '')}")
        # Count catalyst keyword occurrences
        title_lower = title.lower()
        cat_matches = sum(1 for k in CATALYST_KEYS if k in title_lower)
        scored_headlines.append({
            "dt": a.get("created_at", now),
            "headline": title,
            "score": score,
            "cat_matches": cat_matches
        })

    # Sort so that catalyst matches are at the top, then by absolute sentiment impact
    scored_headlines.sort(key=lambda x: (x["cat_matches"] > 0, x["cat_matches"], abs(x["score"])), reverse=True)

    recent_headlines = []
    for item in scored_headlines[:4]:
        dt = item["dt"]
        sc = item["score"]
        pol = "Bullish" if sc > 0.1 else ("Bearish" if sc < -0.1 else "Neutral")
        col = "#10B981" if sc > 0.1 else ("#EF4444" if sc < -0.1 else "#94A3B8")
        recent_headlines.append({
            "date": dt.strftime("%b %d, %H:%M") if hasattr(dt, "strftime") else str(dt),
            "headline": item["headline"],
            "polarity": pol,
            "color": col
        })

    # Sentiment vs. Dark Pool Divergence Evaluation
    # This is the core quantitative alpha signal: strictly requires net dark pool accumulation
    if score_5d <= -10.0 and dark_pool_ratio_pct >= 45.0 and is_accumulating is True:
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
        "article_count_5d": len(s1_scores),
        "article_count_21d": len(s1_scores + s2_scores + s3_scores),
        "divergence_signal": divergence_signal,
        "divergence_badge": divergence_badge,
        "divergence_color": divergence_color,
        "divergence_desc": divergence_desc,
        "recent_headlines": recent_headlines
    }

    _SENTIMENT_CACHE[sym] = result
    _CACHE_TIMESTAMP[sym] = now
    return result
