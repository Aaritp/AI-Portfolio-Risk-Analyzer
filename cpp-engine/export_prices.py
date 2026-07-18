"""
export_prices.py — download 1 year of adjusted close prices to prices.csv

Usage:
    python export_prices.py AAPL MSFT GOOGL JPM

Writes prices.csv with header Date,TICKER1,TICKER2,... — the input format
expected by monte_carlo.cpp and benchmark_py.py.
"""

import sys

import yfinance as yf


def main() -> None:
    tickers = [t.upper() for t in sys.argv[1:]]
    if len(tickers) < 2:
        sys.exit(f"usage: python {sys.argv[0]} TICKER1 TICKER2 [...]")

    data = yf.download(tickers, period="1y", auto_adjust=True, progress=False)
    prices = data["Close"][tickers].dropna()
    if prices.empty:
        sys.exit("no price data returned — check ticker symbols")

    prices.index = prices.index.strftime("%Y-%m-%d")
    prices.index.name = "Date"
    prices.to_csv("prices.csv", float_format="%.6f")
    print(f"wrote prices.csv: {len(prices)} rows, {len(tickers)} assets "
          f"({', '.join(tickers)})")


if __name__ == "__main__":
    main()
