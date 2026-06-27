# Portfolio Risk Analyzer — Backend

Quantitative portfolio analysis API built with FastAPI, NumPy, Pandas, and SciPy.

## Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Open .env and add your OpenRouter API key

# Run the server
python main.py
```

Server runs at http://localhost:8000
Auto-generated API docs at http://localhost:8000/docs

## Environment Variables

| Variable | Description |
|---|---|
| `OPENROUTER_API_KEY` | From openrouter.ai — used for AI risk summary |

**Never commit `.env`** — it's in `.gitignore`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/analyze` | Full portfolio analysis |
| GET | `/api/search/{ticker}` | Ticker info lookup |

### POST /api/analyze

```json
{
  "tickers": ["AAPL", "MSFT", "GOOGL"],
  "weights": [0.4, 0.35, 0.25],
  "period": "1y",
  "risk_free_rate": 0.05
}
```

`weights` is optional — defaults to equal weight.
`period` options: `1mo`, `3mo`, `6mo`, `ytd`, `1y`, `2y`, `5y`, `max`
