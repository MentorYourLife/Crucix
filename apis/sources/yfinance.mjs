// Yahoo Finance — Live market quotes (no API key required)
// Provides real-time prices for stocks, ETFs, crypto, commodities
// Replaces the need for Alpaca or any paid market data provider

import { safeFetch } from '../utils/fetch.mjs';

const BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// Symbols to track — 台股 + 美股科技 + 加密貨幣 + 大宗商品
const SYMBOLS = {
  // === 美國指數 ===
  '^GSPC': 'S&P 500',
  '^IXIC': 'Nasdaq Composite',
  '^DJI': 'Dow Jones',
  // === 🇹🇼 台灣市場 ===
  '^TWII':  '加權指數',
  '2330.TW': '台積電',
  '2454.TW': '聯發科',
  '2317.TW': '鴻海',
  '2308.TW': '台達電',
  // === 🚀 美股科技 (馬斯克概念) ===
  'TSLA': '特斯拉',
  'NVDA': '輝達',
  'AAPL': '蘋果',
  'MSFT': '微軟',
  'AMZN': '亞馬遜',
  // === 大宗商品 ===
  'GC=F': 'Gold',
  'SI=F': 'Silver',
  'CL=F': 'WTI Crude',
  'BZ=F': 'Brent Crude',
  'NG=F': 'Natural Gas',
  // === 💰 加密貨幣 (完整版) ===
  'BTC-USD':  'Bitcoin',
  'ETH-USD':  'Ethereum',
  'BNB-USD':  'BNB',
  'SOL-USD':  'Solana',
  'XRP-USD':  'XRP',
  'DOGE-USD': 'Dogecoin',
  'WLD-USD':  'Worldcoin',
  // === 波動率 ===
  '^VIX': 'VIX',
};

async function fetchQuote(symbol) {
  try {
    const url = `${BASE}/${encodeURIComponent(symbol)}?range=5d&interval=1d&includePrePost=false`;
    const data = await safeFetch(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const quotes = result.indicators?.quote?.[0] || {};
    const closes = quotes.close || [];
    const timestamps = result.timestamp || [];

    // Get current price and previous close
    const price = meta.regularMarketPrice ?? closes[closes.length - 1];
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? closes[closes.length - 2];
    const change = price && prevClose ? price - prevClose : 0;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    // Build 5-day history
    const history = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null) {
        history.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          close: Math.round(closes[i] * 100) / 100,
        });
      }
    }

    return {
      symbol,
      name: SYMBOLS[symbol] || meta.shortName || symbol,
      price: Math.round(price * 100) / 100,
      prevClose: Math.round((prevClose || 0) * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePct: Math.round(changePct * 100) / 100,
      currency: meta.currency || 'USD',
      exchange: meta.exchangeName || '',
      marketState: meta.marketState || 'UNKNOWN',
      history,
    };
  } catch (e) {
    return { symbol, name: SYMBOLS[symbol] || symbol, error: e.message };
  }
}

export async function briefing() {
  return collect();
}

export async function collect() {
  const symbols = Object.keys(SYMBOLS);
  const results = await Promise.allSettled(
    symbols.map(s => fetchQuote(s))
  );

  const quotes = {};
  let ok = 0;
  let failed = 0;

  for (const r of results) {
    const q = r.status === 'fulfilled' ? r.value : null;
    if (q && !q.error) {
      quotes[q.symbol] = q;
      ok++;
    } else {
      failed++;
      const sym = q?.symbol || 'unknown';
      quotes[sym] = q || { symbol: sym, error: 'fetch failed' };
    }
  }

  // Categorize for easy dashboard consumption
  return {
    quotes,
    summary: {
      totalSymbols: symbols.length,
      ok,
      failed,
      timestamp: new Date().toISOString(),
    },
    indexes:    pickGroup(quotes, ['^GSPC', '^IXIC', '^DJI']),
    taiwan:     pickGroup(quotes, ['^TWII', '2330.TW', '2454.TW', '2317.TW', '2308.TW']),
    usTech:     pickGroup(quotes, ['TSLA', 'NVDA', 'AAPL', 'MSFT', 'AMZN']),
    commodities:pickGroup(quotes, ['GC=F', 'SI=F', 'CL=F', 'BZ=F', 'NG=F']),
    crypto:     pickGroup(quotes, ['BTC-USD', 'ETH-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD', 'WLD-USD']),
    volatility: pickGroup(quotes, ['^VIX']),
  };
}

function pickGroup(quotes, symbols) {
  return symbols.map(s => quotes[s]).filter(Boolean);
}
