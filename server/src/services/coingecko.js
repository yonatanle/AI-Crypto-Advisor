const fetch = require("node-fetch");

// CoinGecko's price endpoint keys results by its own slug ids, not ticker
// symbols (e.g. "bitcoin", not "BTC") — this maps the symbols collected
// during onboarding to the ids the API expects, and back again for display.
const SYMBOL_TO_ID = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  ADA: "cardano",
  DOGE: "dogecoin",
  XRP: "ripple",
  MATIC: "matic-network",
  DOT: "polkadot",
  LTC: "litecoin",
  AVAX: "avalanche-2",
};

const FALLBACK_PRICES = [
  { id: "bitcoin", symbol: "BTC", price: 60000, change24h: 0 },
  { id: "ethereum", symbol: "ETH", price: 3000, change24h: 0 },
  { id: "solana", symbol: "SOL", price: 140, change24h: 0 },
];

async function getCoinPrices(assets = []) {
  const ids = assets
    .map((a) => SYMBOL_TO_ID[a.toUpperCase()] || a.toLowerCase())
    .filter(Boolean);
  const uniqueIds = [...new Set(ids.length ? ids : ["bitcoin", "ethereum", "solana"])];

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds.join(
      ","
    )}&vs_currencies=usd&include_24hr_change=true`;
    const resp = await fetch(url, { timeout: 8000 });
    if (!resp.ok) throw new Error(`CoinGecko error ${resp.status}`);
    const data = await resp.json();

    const idToSymbol = Object.fromEntries(
      Object.entries(SYMBOL_TO_ID).map(([sym, id]) => [id, sym])
    );

    return uniqueIds.map((id) => ({
      id,
      symbol: idToSymbol[id] || id.toUpperCase(),
      price: data[id]?.usd ?? null,
      change24h: data[id]?.usd_24h_change ?? null,
    }));
  } catch (err) {
    console.error("CoinGecko fetch failed, using fallback:", err.message);
    return FALLBACK_PRICES;
  }
}

module.exports = { getCoinPrices };
