# Frontier — Portfolio Risk Engine (Frontend)

React + Vite + Tailwind frontend for the Portfolio Risk Analyzer.

## Setup

```bash
cd frontend
npm install

cp .env.example .env
# Edit .env if your backend isn't on http://localhost:8000

npm run dev
```

Opens at http://localhost:5173 — make sure the FastAPI backend is running
on http://localhost:8000 (or update `VITE_API_URL` in `.env`).

## Build for production

```bash
npm run build
npm run preview   # serve the production build locally
```

Output goes to `dist/`.

## Design system

| Token | Value | Use |
|---|---|---|
| `ink-900` | `#0B1220` | Page background |
| `paper` | `#F7F2E7` | Card backgrounds |
| `brass` | `#CFA248` | Primary accent, Monte Carlo paths |
| `forest` | `#3C8C6E` | Positive values, max-Sharpe marker |
| `terracotta` | `#B6533C` | Negative values, current portfolio marker |
| `teal` | `#5FA8A0` | Min-volatility marker |

Fonts: **Fraunces** (display/headings), **Inter** (body/UI), **IBM Plex Mono**
(all numeric data — tickers, percentages, table figures).

## Structure

```
src/
├── App.jsx                  # Layout, state, data flow
├── api.js                   # Backend fetch wrapper
├── colors.js                # Shared palette + number formatters
├── index.css                # Tailwind + base styles
└── components/
    ├── Header.jsx
    ├── Footer.jsx
    ├── Section.jsx           # Numbered section wrapper
    ├── TickerForm.jsx        # Holdings input, weights, period
    ├── PortfolioSummary.jsx  # Top-level metric cards
    ├── PerformanceChart.jsx  # Normalized price line chart
    ├── AssetTable.jsx        # Per-ticker metrics table
    ├── EfficientFrontierChart.jsx
    ├── CorrelationHeatmap.jsx
    ├── MonteCarloChart.jsx   # Signature fan chart (custom SVG)
    └── AISummary.jsx
```
