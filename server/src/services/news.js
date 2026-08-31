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
  return STATIC_NEWS;
}

module.exports = { getMarketNews };
