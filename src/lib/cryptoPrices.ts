// CoinGecko public API for crypto prices
// Free tier: no API key needed, 10-30 calls/min

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const CACHE_KEY = "crypto_prices_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface PriceCache {
  data: Record<string, { brl: number; usd: number }>;
  timestamp: number;
}

function getCache(): PriceCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: PriceCache = JSON.parse(raw);
    if (Date.now() - cache.timestamp > CACHE_TTL) return null;
    return cache;
  } catch {
    return null;
  }
}

function setCache(data: PriceCache["data"]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
}

/**
 * Fetch prices for multiple cryptos at once.
 * Returns { [cryptoId]: { brl: number, usd: number } }
 */
export async function fetchCryptoPrices(
  cryptoIds: string[]
): Promise<Record<string, { brl: number; usd: number }>> {
  if (cryptoIds.length === 0) return {};

  // Check cache first
  const cache = getCache();
  const missingIds = cryptoIds.filter(id => !cache?.data[id]);

  if (missingIds.length === 0 && cache) {
    return cache.data;
  }

  try {
    const ids = cryptoIds.join(",");
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${ids}&vs_currencies=brl,usd`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      // Rate limited or error - return cache if available
      if (cache) return cache.data;
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();

    // Merge with existing cache
    const merged = { ...(cache?.data || {}), ...data };
    setCache(merged);
    return merged;
  } catch (err) {
    // Fallback to cache
    if (cache) return cache.data;
    console.warn("Failed to fetch crypto prices:", err);
    return {};
  }
}

/**
 * Format crypto quantity with appropriate decimals.
 */
export function formatCryptoQuantity(quantity: number, symbol: string): string {
  const stablecoins = ["USDT", "USDC", "DAI", "BUSD"];
  if (stablecoins.includes(symbol.toUpperCase())) {
    return quantity.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (quantity >= 1) {
    return quantity.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }
  return quantity.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 8 });
}

/**
 * Format price in the specified currency.
 */
export function formatCryptoValue(value: number, currency: "BRL" | "USD" = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
