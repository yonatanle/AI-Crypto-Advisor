const fetch = require("node-fetch");

const FALLBACK_NEWS = [
  {
    id: "static-1",
    title: "Bitcoin holds above key support as institutional interest grows",
    url: "https://www.coindesk.com/",
    source: "Static Fallback",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "static-2",
    title: "Ethereum layer-2 activity hits new highs amid lower gas fees",
    url: "https://www.theblock.co/",
    source: "Static Fallback",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "static-3",
    title: "Regulators signal clearer crypto framework for 2026",
    url: "https://www.reuters.com/",
    source: "Static Fallback",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "static-4",
    title: "NFT trading volumes tick up as new marketplaces launch",
    url: "https://decrypt.co/",
    source: "Static Fallback",
    publishedAt: new Date().toISOString(),
  },
];

async function getMarketNews() {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  if (!apiKey) return FALLBACK_NEWS;

  try {
    const url = `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&public=true`;
    const resp = await fetch(url, { timeout: 8000 });
    if (!resp.ok) throw new Error(`CryptoPanic error ${resp.status}`);
    const data = await resp.json();

    const results = (data.results || []).slice(0, 6).map((post) => ({
      id: String(post.id),
      title: post.title,
      url: post.url,
      source: post.source?.title || "CryptoPanic",
      publishedAt: post.published_at,
    }));

    return results.length ? results : FALLBACK_NEWS;
  } catch (err) {
    console.error("CryptoPanic fetch failed, using fallback:", err.message);
    return FALLBACK_NEWS;
  }
}

module.exports = { getMarketNews };
