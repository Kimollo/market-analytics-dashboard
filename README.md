# CryptoPulse - Real-Time Market Analytics Dashboard

Live cryptocurrency market dashboard. It summarizes global market health, charts an asset across multiple timeframes, and lets you search the top 20 coins by market cap.

**Live demo:** [https://market-analytics-dashboard-three.vercel.app/](https://market-analytics-dashboard-three.vercel.app/)

![React 18](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2.x-22B5BF)
![CoinGecko REST API](https://img.shields.io/badge/CoinGecko-REST_API-8DC647)

No API key is required. Data comes from the public CoinGecko REST API.

## Features

- **Live KPI metrics.** Global market cap, 24h trading volume, and Bitcoin dominance come from `/global`. The trending-coin count comes from `/search/trending`, because the global endpoint does not include that figure.
- **Historical price charts.** An interactive Recharts area chart covers 24 hours, 7 days, 30 days, and 1 year. The tooltip shows a formatted date and the exact USD price, and the panel reports open, high, low, and close for the selected range.
- **Interactive top-20 market table.** Rank, name, icon, price, color-coded 24h change, volume, market cap, and a 7-day sparkline. A search box filters by coin name or symbol as you type. Selecting a row updates the chart.
- **Rate-limit resilience with auto-retry.** Identical in-flight requests are joined, successful responses are cached for 60 seconds, and a `429` is retried once after a short delay (or the `Retry-After` hint, when it is brief). If CoinGecko is still limiting requests, the screen keeps the last good data when it has some and shows a manual **Retry** button.

The interface is a dark slate/zinc layout with skeleton placeholders, and it stacks cleanly on small screens. The market table scrolls horizontally on mobile.

## Deployment

The production app is hosted on Vercel:

[https://market-analytics-dashboard-three.vercel.app/](https://market-analytics-dashboard-three.vercel.app/)

Vercel builds the Vite app with `npm run build` and serves the `dist` output. CoinGecko is called from the browser, so no server environment variables are required.

## Local setup

Requirements: Node.js 18 or newer.

```bash
npm install && npm run dev
```

Vite prints a local URL, usually `http://localhost:5173`. If that port is already in use, it picks the next free port.

Other scripts:

```bash
npm run build    # typecheck and production build
npm run preview  # serve the production build
```

## Architecture

Market data is loaded in the browser. There is no backend in this repo.

```
src/lib/api.ts          CoinGecko client, cache, dedupe, 429 retry, response mapping
src/hooks/useQuery.ts   loading / error / data state, stale-response guards, manual retry
src/hooks/useMarketData.ts
                        overview, top markets, and price history queries
src/components/         KPI cards, price chart, market table, empty and error states
```

`api.ts` wraps Axios with a small `getJson` helper:

1. A 60-second in-memory cache serves repeat reads, including timeframe toggles you have already opened.
2. Calls to the same URL that are already in flight share one promise, so React Strict Mode and parallel sections do not multiply requests.
3. On HTTP 429, the helper waits and retries that request once. A second failure becomes an `ApiError` with status `429`.
4. **Refresh** bumps a cache epoch and forces a new fetch. Each section can also retry on its own.

`useQuery` keeps the previous payload on screen during a refresh, drops it when the query key changes (a different coin or timeframe), and ignores responses that belong to an older request. The three dashboard queries run from that hook:

| View | Endpoint |
| --- | --- |
| KPI summary | `GET /global`, then `GET /search/trending` |
| Top 20 table | `GET /coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true` |
| Price chart | `GET /coins/{id}/market_chart?vs_currency=usd&days={1\|7\|30\|365}` |

Components stay presentational. Search is client-side over the 20 rows already loaded. Sparklines are drawn as small SVGs from `sparkline_in_7d` so the table does not mount a chart instance per row.

CoinGecko's public API is rate limited. The cache, dedupe, and single automatic retry are there to stay under that limit. Prices can be delayed, and a sustained limit still needs the on-screen **Retry** action.
