const SECTIONS = {
  MARKET_NEWS: "marketNews",
  COIN_PRICES: "coinPrices",
  AI_INSIGHT: "aiInsight",
  MEME: "meme",
};

const VALID_SECTIONS = new Set(Object.values(SECTIONS));

module.exports = { SECTIONS, VALID_SECTIONS };
