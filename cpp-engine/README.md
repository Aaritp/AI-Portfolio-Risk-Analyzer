# cpp-engine — Monte Carlo simulation in C++

A standalone C++17 port of the Monte Carlo engine from `backend/quant.py`
(`monte_carlo_simulation()`). Simulates 10,000 correlated portfolio price paths
over 252 trading days using Geometric Brownian Motion with the Itô correction:

```
S(t+1) = S(t) · exp( (μ − σ²/2) + L·z ),   z ~ N(0, I)
```

where `L` is the Cholesky factor of the daily-return covariance matrix
(implemented from scratch — no Eigen, standard library only). Simulations run
in parallel across all hardware threads with `std::thread`; each thread owns a
deterministically seeded `std::mt19937_64`.

Reported metrics: median / 5th / 95th percentile outcomes, VaR 95% / 99%,
CVaR 95%, probability of loss, and simulation wall time.

## Files

| File | Purpose |
|---|---|
| `monte_carlo.cpp` | The C++ engine (single file, C++17, std-lib only) |
| `benchmark_py.py` | NumPy twin of the same simulation, for fair benchmarking |
| `export_prices.py` | Downloads 1y of adjusted closes via yfinance → `prices.csv` |

## Build

Requires GCC (MinGW-w64 on Windows — e.g.
`winget install BrechtSanders.WinLibs.POSIX.UCRT`; use a POSIX-threads build
for `std::thread` support).

```bash
g++ -O3 -march=native -ffast-math -std=c++17 -pthread monte_carlo.cpp -o monte_carlo
```

Note: `-ffast-math` relaxes strict IEEE semantics for speed; for this
statistical workload the effect on results is far below Monte Carlo noise.

## Usage

```bash
# 1. Get data (real market data, needs network)
python export_prices.py AAPL MSFT GOOGL JPM

# 2. Run the C++ engine
./monte_carlo prices.csv              # 10,000 sims, seed 42
./monte_carlo prices.csv 50000 7     # custom sim count and seed
```

CSV input format: `Date,TICKER1,TICKER2,...` header, one row per trading day,
adjusted close prices.

## Benchmark: C++ vs Python

`benchmark_py.py` runs the *identical* simulation (same CSV, same estimation,
same metrics, same output format) using vectorized NumPy — the same approach
as `backend/quant.py`:

```bash
./monte_carlo prices.csv 10000 42
python benchmark_py.py prices.csv 10000 42
```

Compare the two printed blocks side by side:

- **Risk metrics** (median, percentiles, VaR, CVaR, prob. of loss) will agree
  within Monte Carlo sampling noise (~±1% of portfolio value at 10,000 paths),
  but not bit-for-bit — `std::mt19937_64` and NumPy's PCG64 produce different
  random streams, which is expected and does not affect the statistics.
- **`simulation time`** is the fair comparison number: both measure only the
  simulation loop (path generation → final values), not CSV parsing or metric
  computation.

To reduce noise when benchmarking, run each binary a few times and take the
best; increase the path count (e.g. `100000`) to make the C++ advantage and
the metric agreement both more visible.
