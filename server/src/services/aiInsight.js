const fetch = require("node-fetch");

// Used whenever there's no OpenRouter key or the API call fails, so the
// dashboard's AI Insight section always has content instead of an error.
// Several templates + a random pick avoid showing the identical fallback
// sentence on every reload during an outage.
const FALLBACK_TEMPLATES = [
  "Markets are consolidating today. For {investorType}s interested in {assets}, it's a good time to review your thesis rather than chase short-term moves.",
  "Volatility remains a defining feature of crypto. As a {investorType} focused on {assets}, keep an eye on macro news and avoid overexposure to any single asset.",
  "Sentiment is mixed across the market. {investorType}s watching {assets} should focus on fundamentals over daily price swings.",
];

function buildFallbackInsight({ investorType, assets }) {
  const template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
  return template
    .replace("{investorType}", investorType || "investor")
    .replace("{assets}", (assets && assets.length ? assets : ["crypto"]).join(", "));
}

async function getAiInsight({ investorType, assets, contentTypes }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { text: buildFallbackInsight({ investorType, assets }), source: "fallback" };
  }

  try {
    // Folds the user's onboarding answers directly into the prompt so the
    // insight reads as personalized without needing per-segment prompt
    // templates or a fine-tuned model.
    const prompt = `You are a crypto market assistant. Write a concise (2-3 sentences), friendly "AI Insight of the Day" for a user who is a ${
      investorType || "crypto investor"
    }, interested in ${
      (assets && assets.length ? assets : ["general crypto"]).join(", ")
    }, and prefers content like ${
      (contentTypes && contentTypes.length ? contentTypes : ["market news"]).join(", ")
    }. Keep it actionable and avoid financial advice disclaimers.`;

    // "openrouter/free" auto-routes to whichever free-tier model is
    // currently available. A pinned free model id (e.g. a specific
    // Llama variant) was tried first but 404'd once that model was
    // deprecated/removed from OpenRouter's free tier; auto-routing avoids
    // depending on any single model's lifetime.
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
      }),
      timeout: 15000,
    });

    if (!resp.ok) throw new Error(`OpenRouter error ${resp.status}`);
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response from OpenRouter");

    return { text, source: "openrouter" };
  } catch (err) {
    console.error("OpenRouter fetch failed, using fallback:", err.message);
    return { text: buildFallbackInsight({ investorType, assets }), source: "fallback" };
  }
}

module.exports = { getAiInsight };
