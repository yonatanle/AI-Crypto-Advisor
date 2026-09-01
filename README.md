# AI Crypto Advisor

A personalized crypto investor dashboard: users sign up, complete a short onboarding quiz, and get a daily dashboard with market news, live coin prices, an AI-generated market insight, and a fun meme — each with thumbs up/down voting.

Built for the Moveo coding assignment.

## Stack

- **Frontend:** React (Vite) + React Router
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`)
- **Auth:** JWT (email + password, bcrypt-hashed)
- **External APIs:** CoinGecko (prices, free, no key needed), NewsData.io (news, free tier, optional key — CryptoPanic was considered but its API is not free), OpenRouter (AI insight, free tier, optional key), meme-api.com (memes, free, no key needed — pulls from crypto meme subreddits)

## Project structure

```
server/   Express API + SQLite DB
client/   React frontend (Vite)
```

## Running locally

### 1. Backend

```bash
cd server
cp .env.example .env   # fill in JWT_SECRET (required) and API keys (optional)
npm install
npm run dev             # http://localhost:4000
```

### 2. Frontend

```bash
cd client
cp .env.example .env    # VITE_API_URL defaults to http://localhost:4000/api
npm install
npm run dev              # http://localhost:5173
```

Open `http://localhost:5173`, register an account, complete onboarding, and view the dashboard.

## Environment variables

### `server/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | API port, defaults to 4000 |
| `JWT_SECRET` | yes | Secret used to sign JWTs |
| `OPENROUTER_API_KEY` | no | Free key from [openrouter.ai](https://openrouter.ai) for real AI-generated insights. Without it, a templated fallback insight is used. |
| `NEWSDATA_API_KEY` | no | Free key from [newsdata.io](https://newsdata.io) (200 credits/day free, no credit card) for live crypto news via their `/api/1/crypto` endpoint. Without it, a static fallback news list is used. |

CryptoPanic (the API suggested in the assignment) does not offer a free tier, so per the assignment's explicit "CryptoPanic API **or** static fallback" allowance, this project uses NewsData.io's genuinely free tier instead.

### `client/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | no | Backend API base URL, defaults to `http://localhost:4000/api` |

## API overview

- `POST /api/auth/register` — email, name, password
- `POST /api/auth/login` — email, password
- `GET /api/preferences` — current user's onboarding answers
- `POST /api/preferences` — save onboarding answers (assets, investorType, contentTypes)
- `GET /api/dashboard` — the 4 personalized sections (requires onboarding to be completed)
- `POST /api/votes` — upsert a thumbs up/down vote for a dashboard item

## Database access

SQLite file lives at `server/data/app.sqlite` (created automatically on first run). Inspect it with:

```bash
sqlite3 server/data/app.sqlite
.tables
select * from users;
select * from preferences;
select * from votes;
```

Tables: `users`, `preferences`, `votes`.

## Deployment

- **Frontend:** deploy `client/` to Vercel or Netlify. Set `VITE_API_URL` to the deployed backend URL.
- **Backend:** deploy `server/` to Render or Railway. Set `JWT_SECRET` and optionally `OPENROUTER_API_KEY` / `NEWSDATA_API_KEY` as environment variables. Note: SQLite persists to local disk — on Render use a persistent disk, or swap in Postgres for production durability.

Deployed app URL: _TODO after deployment_
GitHub repo: _TODO_

## Bonus: feedback → model improvement (design suggestion, not implemented)

The `votes` table already captures `(user_id, section, item_key, vote, created_at)` for every dashboard item. A future training loop could work like this:

1. **Aggregate signal per item type.** For `aiInsight`, join votes with the prompt/context that generated that insight (investor type, assets, content preferences) to build a labeled dataset of (prompt context → generated text → 👍/👎).
2. **Preference dataset for fine-tuning/RLHF-style tuning.** Thumbs-up insights become positive examples, thumbs-down become negative examples for a preference-pair dataset (similar to DPO training), keyed by user segment (investor type × asset interest).
3. **Lightweight first step — re-ranking/prompt-tuning before full fine-tuning.** Before investing in fine-tuning, use vote aggregates to adjust prompts per segment (e.g., if "Day Trader" users downvote long-term-oriented insights, bias the prompt template toward short-term framing for that segment).
4. **Cold-start handling.** For new users/segments with little vote history, fall back to global aggregate preferences, then personalize as their own vote history grows.
5. **Feedback loop cadence.** Periodically (e.g. weekly) export votes to a training pipeline; retrain/update prompt templates or a small ranking model; deploy; monitor thumbs-up rate as the core offline/online metric.
6. **Extending to news/memes.** The same vote table can train a content recommender (e.g. collaborative filtering on which news sources/meme styles get upvoted per user) to reorder future content, not just judge the AI insight.

## AI tool usage summary

This project was built with Claude Code (Anthropic's CLI coding agent). Summary of the collaboration:

- Provided the assignment PDF; Claude read and extracted the requirements (auth, onboarding, 4-section dashboard, voting, deployment, deliverables).
- Discussed and chose the stack (React + Node/Express + SQLite) and AI provider (OpenRouter) interactively before any code was written.
- Claude scaffolded the full backend (Express routes for auth/preferences/dashboard/votes, SQLite schema, JWT middleware, and service modules for CoinGecko/NewsData.io/OpenRouter/meme-api.com with graceful fallbacks when API keys are absent or calls fail) and the full frontend (React Router pages for login/register/onboarding/dashboard, auth context, API client, styling).
- Claude ran the backend and frontend locally, smoke-tested every API endpoint via curl (register, login, preferences, dashboard, voting) and verified a clean production build of the frontend.
- Lower-level implementation details (fallback behavior, DB schema, route design) were made by Claude within constraints set by the user, who reviewed and steered scope via direct questions rather than reviewing code line-by-line during generation.
- Several material, user-driven decisions shaped the project directly: the user rejected CryptoPanic as a news source once it was confirmed not free, evaluated alternatives Claude proposed (CoinMarketCap, freecryptoapi.com) and rejected both on verified pricing grounds, and picked NewsData.io as the replacement; and the user chose meme-api.com over Claude's suggested static-only approach for live meme content, after also evaluating and rejecting Apify as disproportionate for the use case. The OpenRouter free-model fix (switching from a deprecated pinned model ID to the auto-routing free endpoint) was diagnosed and applied by Claude, at the user's direction to investigate why AI Insight was falling back to templated text.
