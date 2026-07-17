# PlanATrip — Product & Technical Scope

Decisions locked in so far:
- **Hosting:** GitHub Pages (static site, publicly reachable at a permanent URL)
- **Live-data model:** GitHub Actions runs on a schedule, fetches flight/weather/holiday/promo data, writes it to static JSON in the repo, which the site reads. No user request hits a live API directly.
- **Flight data:** Amadeus Self-Service API (free tier)
- **Frontend:** React + Vite, built as static files
- **Build order:** full breadth first (every feature working end-to-end, simplified), then deepen each piece

---

## 1. The two pages

### Page A — Trip Dashboard
Input: free-text origin (resolved to nearest airport(s)), destination, date range.

Output:
- Flight price, default **MYR**, currency selector for display
- Departure/arrival times in **destination local time**, with a parallel **Malaysia-time** conversion shown alongside
- Weather forecast for the dates: temperature range, conditions, and a monsoon/severe-weather risk flag
- Public holiday flag for **origin** and for **destination** on the selected dates
- If the dates look bad (weather risk, holiday-driven price spike, etc.) → **alternate date suggestions** at the bottom
- Known/likely flight promotions or sales for that route (e.g. ANA Blue Ribbon) shown below the fare
- If the destination itself looks like a bad call for that period → **alternate destination suggestions** at the bottom

### Page B — Budget Matcher
Input: budget range (in selected currency), one or more candidate destinations, date range (or flexible window).

Output: ranked list of best-fit trips scoring on price-within-budget, weather suitability, and holiday overlap (origin/destination), reusing the same underlying data as Page A.

---

## 2. Architecture

```
GitHub Actions (cron, e.g. every 6h)
  → Amadeus API           (flight prices)
  → Open-Meteo API        (weather forecast, free, no key)
  → Nager.Date API        (public holidays, free, no key)
  → curated promo list / scraper (airline sale pages)
      ↓
  writes /data/*.json into the repo
      ↓
GitHub Pages (static React/Vite build)
  reads /data/*.json at page load
  + client-side calls (no secret needed, CORS-friendly):
      - Frankfurter API (currency conversion, live)
      - static airport/timezone table bundled in the repo (no API — computed locally)
```

Nothing in the browser ever holds a paid API key — only the Actions job does, stored as a GitHub secret.

---

## 3. Data sources per feature

| Feature | Source | Notes |
|---|---|---|
| Flight prices | Amadeus Flight Offers Search | Free tier is a **test environment** — data is real but not full production coverage/pricing accuracy. Upgradeable later. |
| Weather (≤16 days out) | Open-Meteo forecast API | Free, no key, real forecast. |
| Weather/monsoon (>16 days out) | Open-Meteo climate/historical + a curated seasonal table (e.g. "SE Asia monsoon: Jun–Sep", "Japan typhoon season: Aug–Oct") | No API can forecast exact weather months ahead — this will be **climatological risk**, not a precise prediction. Framed as such in the UI. |
| Public holidays | Nager.Date API | Free, covers ~100 countries. Countries outside coverage need a manual fallback list. |
| Currency conversion | Frankfurter API | Free, no key, live client-side lookup. |
| Timezones / airport resolution | Static OpenFlights airport dataset bundled in repo | Origin free-text matched to nearest airport(s) by name/city; timezone math done locally, no API. |
| Promotions/sales | Curated list to start (MVP), optional scraper for a handful of airline promo pages in Phase 2 | Scraping airline promo pages is fragile (HTML changes often) — starting with a manually maintained/seeded list is far more reliable than building a scraper first. |

---

## 4. Phase 1 (MVP) — full breadth, simplified depth

- [ ] Repo scaffolding: React + Vite app, GitHub Actions workflows, Pages deploy
- [ ] Origin free-text → airport resolution (static dataset)
- [ ] Amadeus integration (Actions job → `/data/flights.json` for a small pre-selected set of routes+date windows to start, since Amadeus test tier is rate-limited)
- [ ] Open-Meteo integration → `/data/weather.json`
- [ ] Nager.Date integration → `/data/holidays.json`
- [ ] Currency conversion (live, client-side)
- [ ] Timezone display + Malaysia-time conversion (client-side)
- [ ] Dashboard page wired to all the above, with alternate-date and alternate-destination suggestions (simple heuristic: cheaper/clearer nearby dates, similar-region alternate destinations)
- [ ] Curated promo list (manually seeded JSON, e.g. 5–10 known recurring airline sales with typical timing)
- [ ] Budget Matcher page, ranking against the same data

## 5. Phase 2 — depth

- Real scraper for select airline promo pages (with graceful fallback if a page's layout changes)
- Expand Amadeus coverage / move off test tier if useful
- Better alternate-date/destination scoring (weight price + weather + holidays together, not just heuristics)
- Broader holiday-country fallback coverage
- UI polish, caching/perf, mobile layout

---

## 6. What I need from you before Phase 1 can go live end-to-end

1. **Amadeus API key** — free sign-up at developers.amadeus.com, then the client ID/secret get added as GitHub Actions secrets (I can walk you through this, but you need to create the account since it's tied to your email).
2. Confirm this repo (`caidenlemiha/planatrip`) is fine to be **publicly readable** — GitHub Pages sites are public by URL even if the repo is private, so no secrets or personal data should end up in `/data/*.json`.
3. A short list of routes/destinations you actually care about first (e.g. "KUL → NRT, KUL → CDG, KUL → BKK") — since Amadeus's free tier is rate-limited, Phase 1 will track a curated set of routes rather than arbitrary global search, and I can widen it later.

---

## 7. Known limitations (being upfront)

- Flight prices refresh on a schedule (e.g. every few hours), not instantly on every keystroke.
- Weather beyond ~16 days is a seasonal/historical risk estimate, not a precise forecast — no service can truly "predict" a monsoon 3 months out.
- Promotions list starts curated/manual, not live-scraped, in Phase 1.
- Amadeus free tier ≠ full production flight data; prices may not always match what you'd see on Google Flights.

---

## Next step

If this scope looks right, I'll start Phase 1: scaffold the repo, get the static data pipeline running with placeholder/sample data first so you can see the full UI immediately, then swap in live Amadeus/Open-Meteo/Nager.Date calls once wired up.
