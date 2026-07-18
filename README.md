# PlanATrip

A personal trip-planning dashboard: flight prices, weather/monsoon risk, public holidays,
timezone conversion, and known airline sale windows — for a route and dates you pick. See
[PLANNING.md](./PLANNING.md) for the full product/technical scope.

- **Trip Dashboard** (`/`) — search a route + dates, see price, weather outlook, holidays at
  both ends, times converted to Malaysia time, relevant promos, and alternate date/destination
  suggestions if the pick looks bad.
- **Budget Matcher** (`/budget`) — set a budget and a date window, get ranked destination/date
  combinations.

## Running locally

```bash
npm install
npm run dev
```

## How the data works

- **Currency conversion, weather forecasts, and public holidays** are fetched live from the
  browser (Frankfurter, Open-Meteo, Nager.Date — all free, no API key, CORS-friendly).
- **Flight prices** can't be fetched live client-side without exposing a paid API key, so they
  come from `src/data/flights.sample.json`, refreshed periodically by a GitHub Actions job
  (`.github/workflows/refresh-flights.yml`) calling the Amadeus API. Until that's configured
  (see below), the app falls back to a deterministic distance-based fare estimate so every
  route/date still shows a usable price — offers based on this fallback are labeled
  "estimated fare" in the UI.
- **Weather beyond ~15 days out** can't be a real forecast (no service predicts that far
  ahead) — it falls back to a historical-averages estimate (last 3 years, same calendar date)
  combined with a curated seasonal monsoon/typhoon table (`src/data/monsoonSeasons.json`).
- **Promotions/sales** (`src/data/promos.json`) are a curated, manually-maintained list for
  now, not live-scraped.

## One-time setup to go live

1. **Enable GitHub Pages**: repo Settings → Pages → Source → "GitHub Actions". The
   `deploy.yml` workflow then publishes the site on every push to `main`, at
   `https://<your-username>.github.io/PlanATrip/`.
2. **(Optional) Enable real flight prices**: sign up for a free key at
   [developers.amadeus.com](https://developers.amadeus.com), then add `AMADEUS_CLIENT_ID` and
   `AMADEUS_CLIENT_SECRET` as repo secrets (Settings → Secrets and variables → Actions). Run
   the "Refresh flight prices" workflow manually (Actions tab → Refresh flight prices →
   Run workflow) to test it, then uncomment the `schedule` block in
   `.github/workflows/refresh-flights.yml` to have it run automatically every 6 hours.
   Tracked routes live in `scripts/routes.config.json` — edit that list to match the trips
   you actually care about (the free Amadeus tier is rate-limited, so this stays a curated
   list rather than arbitrary global search).

## Project structure

```
src/
  data/         curated static data: airports, monsoon seasons, promos, sample flights
  lib/          all data-fetching + business logic (currency, weather, holidays, flights,
                timezone conversion, alternate-date/destination suggestions, budget matching)
  components/   presentational + form components
  pages/        Dashboard and BudgetMatcher routes
scripts/
  fetch-flights.mjs      Amadeus fetch job, run by the refresh-flights workflow
  routes.config.json     which routes/date-offsets that job tracks
.github/workflows/
  deploy.yml              builds and publishes to GitHub Pages
  refresh-flights.yml     refreshes src/data/flights.sample.json from Amadeus
```
