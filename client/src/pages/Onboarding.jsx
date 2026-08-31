import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const ASSET_OPTIONS = ["BTC", "ETH", "SOL", "ADA", "DOGE", "XRP", "MATIC", "DOT"];
const INVESTOR_TYPES = ["HODLer", "Day Trader", "NFT Collector", "Swing Trader"];
const CONTENT_OPTIONS = ["Market News", "Charts", "Social", "Fun"];

function toggle(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function Onboarding() {
  const [assets, setAssets] = useState([]);
  const [investorType, setInvestorType] = useState("");
  const [contentTypes, setContentTypes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!assets.length || !investorType || !contentTypes.length) {
      setError("Please answer all questions");
      return;
    }
    setLoading(true);
    try {
      await api.savePreferences({ assets, investorType, contentTypes }, token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding-page">
      <form className="onboarding-card" onSubmit={handleSubmit}>
        <h1>Let's personalize your dashboard</h1>

        <fieldset>
          <legend>What crypto assets are you interested in?</legend>
          <div className="chip-group">
            {ASSET_OPTIONS.map((asset) => (
              <button
                type="button"
                key={asset}
                className={`chip ${assets.includes(asset) ? "selected" : ""}`}
                onClick={() => setAssets(toggle(assets, asset))}
              >
                {asset}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>What type of investor are you?</legend>
          <div className="chip-group">
            {INVESTOR_TYPES.map((type) => (
              <button
                type="button"
                key={type}
                className={`chip ${investorType === type ? "selected" : ""}`}
                onClick={() => setInvestorType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>What kind of content would you like to see?</legend>
          <div className="chip-group">
            {CONTENT_OPTIONS.map((content) => (
              <button
                type="button"
                key={content}
                className={`chip ${contentTypes.includes(content) ? "selected" : ""}`}
                onClick={() => setContentTypes(toggle(contentTypes, content))}
              >
                {content}
              </button>
            ))}
          </div>
        </fieldset>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Continue to dashboard"}
        </button>
      </form>
    </div>
  );
}
