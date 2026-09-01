const fetch = require("node-fetch");

const STATIC_NEWS = [
  {
    id: "static-1",
    title: "Bitcoin holds above key support as institutional interest grows",
    url: "https://www.coindesk.com/",
    source: "CoinDesk",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "static-2",
    title: "Ethereum layer-2 activity hits new highs amid lower gas fees",
    url: "https://www.theblock.co/",
    source: "The Block",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "static-3",
    title: "Regulators signal clearer crypto framework for 2026",
    url: "https://www.reuters.com/",
    source: "Reuters",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "static-4",
    title: "NFT trading volumes tick up as new marketplaces launch",
    url: "https://decrypt.co/",
    source: "Decrypt",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "static-5",
    title: "DeFi total value locked climbs as yields stabilize",
    url: "https://cointelegraph.com/",
    source: "Cointelegraph",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "static-6",
    title: "Major exchange expands staking options for altcoins",
    url: "https://www.coindesk.com/",
    source: "CoinDesk",
    publishedAt: new Date().toISOString(),
  },
];

async function getMarketNews() {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) return STATIC_NEWS;

  try {
    const url = `https://newsdata.io/api/1/crypto?apikey=${apiKey}&language=en`;
    const resp = await fetch(url, { timeout: 8000 });
    if (!resp.ok) throw new Error(`NewsData.io error ${resp.status}`);
    const data = await resp.json();

    // NewsData's language=en filter still lets non-English titles through
    // occasionally; this ASCII check is a cheap second pass to catch them.
    const isLikelyEnglish = (text) => /^[\x00-\x7F\s]*$/.test(text || "");

    const results = (data.results || [])
      .filter((article) => isLikelyEnglish(article.title))
      .slice(0, 6)
      .map((article, i) => ({
        id: article.article_id || `newsdata-${i}`,
        title: article.title,
        url: article.link,
        source: article.source_id || article.source_name || "NewsData.io",
        publishedAt: article.pubDate || new Date().toISOString(),
      }));

    return results.length ? results : STATIC_NEWS;
  } catch (err) {
    console.error("NewsData.io fetch failed, using static fallback:", err.message);
    return STATIC_NEWS;
  }
}

module.exports = { getMarketNews };
