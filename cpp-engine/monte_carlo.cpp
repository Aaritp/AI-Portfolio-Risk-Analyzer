// monte_carlo.cpp — Monte Carlo portfolio simulation engine (GBM, correlated assets)
//
// C++17 port of monte_carlo_simulation() from backend/quant.py.
// Standard library only. Parallelized with std::thread.
//
// Build:
//   g++ -O3 -march=native -ffast-math -std=c++17 -pthread monte_carlo.cpp -o monte_carlo
//
// Usage:
//   ./monte_carlo prices.csv [n_simulations=10000] [seed=42]
//
// CSV format: header "Date,TICKER1,TICKER2,...", one row per trading day.

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <random>
#include <sstream>
#include <stdexcept>
#include <string>
#include <thread>
#include <vector>

namespace {

constexpr int    kTradingDays  = 252;
constexpr double kInitialValue = 10000.0;

struct PriceData {
    std::vector<std::string>         tickers;
    std::vector<std::vector<double>> prices;  // [day][asset]
};

// ── CSV loading ────────────────────────────────────────────────────────────

PriceData load_csv(const std::string& path) {
    std::ifstream file(path);
    if (!file) throw std::runtime_error("cannot open file: " + path);

    PriceData data;
    std::string line;

    if (!std::getline(file, line)) throw std::runtime_error("empty CSV: " + path);
    if (!line.empty() && line.back() == '\r') line.pop_back();

    std::stringstream header(line);
    std::string cell;
    std::getline(header, cell, ',');  // skip "Date"
    while (std::getline(header, cell, ','))
        data.tickers.push_back(cell);
    if (data.tickers.empty()) throw std::runtime_error("no ticker columns in header");

    const size_t n_assets = data.tickers.size();
    size_t line_no = 1;
    while (std::getline(file, line)) {
        ++line_no;
        if (!line.empty() && line.back() == '\r') line.pop_back();
        if (line.empty()) continue;

        std::stringstream row(line);
        std::getline(row, cell, ',');  // skip date
        std::vector<double> vals;
        vals.reserve(n_assets);
        while (std::getline(row, cell, ','))
            vals.push_back(std::stod(cell));
        if (vals.size() != n_assets)
            throw std::runtime_error("row " + std::to_string(line_no) + " has " +
                                     std::to_string(vals.size()) + " values, expected " +
                                     std::to_string(n_assets));
        data.prices.push_back(std::move(vals));
    }
    if (data.prices.size() < 2)
        throw std::runtime_error("need at least 2 price rows to compute returns");
    return data;
}

// ── Statistics ─────────────────────────────────────────────────────────────

// Daily log returns: ln(P_t / P_{t-1})
std::vector<std::vector<double>> log_returns(const std::vector<std::vector<double>>& prices) {
    const size_t n_days = prices.size() - 1, n_assets = prices[0].size();
    std::vector<std::vector<double>> ret(n_days, std::vector<double>(n_assets));
    for (size_t t = 0; t < n_days; ++t)
        for (size_t a = 0; a < n_assets; ++a)
            ret[t][a] = std::log(prices[t + 1][a] / prices[t][a]);
    return ret;
}

std::vector<double> mean_vector(const std::vector<std::vector<double>>& ret) {
    const size_t n = ret.size(), m = ret[0].size();
    std::vector<double> mu(m, 0.0);
    for (const auto& row : ret)
        for (size_t a = 0; a < m; ++a) mu[a] += row[a];
    for (auto& v : mu) v /= static_cast<double>(n);
    return mu;
}

// Sample covariance with n-1 denominator (matches pandas .cov()).
std::vector<std::vector<double>> covariance_matrix(const std::vector<std::vector<double>>& ret,
                                                   const std::vector<double>& mu) {
    const size_t n = ret.size(), m = ret[0].size();
    if (n < 2) throw std::runtime_error("need >= 2 return rows for covariance");
    std::vector<std::vector<double>> cov(m, std::vector<double>(m, 0.0));
    for (const auto& row : ret)
        for (size_t i = 0; i < m; ++i)
            for (size_t j = i; j < m; ++j)
                cov[i][j] += (row[i] - mu[i]) * (row[j] - mu[j]);
    for (size_t i = 0; i < m; ++i)
        for (size_t j = i; j < m; ++j) {
            cov[i][j] /= static_cast<double>(n - 1);
            cov[j][i] = cov[i][j];
        }
    return cov;
}

// Cholesky decomposition A = L·Lᵀ, L lower triangular.
// Throws if the matrix is not positive-definite.
std::vector<std::vector<double>> cholesky(const std::vector<std::vector<double>>& A) {
    const size_t n = A.size();
    std::vector<std::vector<double>> L(n, std::vector<double>(n, 0.0));
    for (size_t i = 0; i < n; ++i) {
        for (size_t j = 0; j <= i; ++j) {
            double sum = A[i][j];
            for (size_t k = 0; k < j; ++k) sum -= L[i][k] * L[j][k];
            if (i == j) {
                if (sum <= 0.0)
                    throw std::runtime_error("covariance matrix is not positive-definite");
                L[i][i] = std::sqrt(sum);
            } else {
                L[i][j] = sum / L[j][j];
            }
        }
    }
    return L;
}

// ── Percentiles (NumPy default: linear interpolation) ──────────────────────

// Expects `sorted_vals` ascending. q in [0, 100].
double percentile_sorted(const std::vector<double>& sorted_vals, double q) {
    const size_t n = sorted_vals.size();
    if (n == 1) return sorted_vals[0];
    const double pos = q / 100.0 * static_cast<double>(n - 1);
    const size_t lo = static_cast<size_t>(pos);
    if (lo >= n - 1) return sorted_vals[n - 1];
    const double frac = pos - static_cast<double>(lo);
    return sorted_vals[lo] + frac * (sorted_vals[lo + 1] - sorted_vals[lo]);
}

// ── Simulation ─────────────────────────────────────────────────────────────

// GBM with Itô correction, correlated across assets via Cholesky factor L:
//   S_a(t+1) = S_a(t) * exp( (mu_a - cov_aa/2) + (L·z)_a ),  z ~ N(0,I)
// Each worker owns a deterministically seeded mt19937_64 and writes final
// portfolio values into its own disjoint slice — no synchronization needed.
void simulate_range(int sim_begin, int sim_end, int n_days, uint64_t seed,
                    const std::vector<double>& drift,          // mu - diag(cov)/2
                    const std::vector<std::vector<double>>& L,
                    const std::vector<double>& weights,
                    std::vector<double>& final_values) {
    const size_t n_assets = drift.size();
    std::mt19937_64 rng(seed);
    std::normal_distribution<double> normal(0.0, 1.0);

    std::vector<double> z(n_assets), rel_price(n_assets);

    for (int s = sim_begin; s < sim_end; ++s) {
        std::fill(rel_price.begin(), rel_price.end(), 1.0);
        for (int t = 0; t < n_days; ++t) {
            for (size_t a = 0; a < n_assets; ++a) z[a] = normal(rng);
            for (size_t a = 0; a < n_assets; ++a) {
                double shock = 0.0;  // (L·z)_a — L is lower triangular
                for (size_t k = 0; k <= a; ++k) shock += L[a][k] * z[k];
                rel_price[a] *= std::exp(drift[a] + shock);
            }
        }
        double portfolio = 0.0;
        for (size_t a = 0; a < n_assets; ++a) portfolio += rel_price[a] * weights[a];
        final_values[s] = portfolio * kInitialValue;
    }
}

}  // namespace

int main(int argc, char** argv) {
    if (argc < 2) {
        std::cerr << "usage: " << argv[0] << " <prices.csv> [n_simulations=10000] [seed=42]\n";
        return 1;
    }
    try {
        const int      n_sims = argc > 2 ? std::stoi(argv[2]) : 10000;
        const uint64_t seed   = argc > 3 ? std::stoull(argv[3]) : 42;
        if (n_sims <= 0) throw std::runtime_error("n_simulations must be positive");

        const PriceData data     = load_csv(argv[1]);
        const size_t    n_assets = data.tickers.size();

        const auto returns = log_returns(data.prices);
        const auto mu      = mean_vector(returns);
        const auto cov     = covariance_matrix(returns, mu);
        const auto L       = cholesky(cov);

        std::vector<double> drift(n_assets);
        for (size_t a = 0; a < n_assets; ++a) drift[a] = mu[a] - 0.5 * cov[a][a];

        const std::vector<double> weights(n_assets, 1.0 / static_cast<double>(n_assets));

        // Partition simulations across hardware threads.
        unsigned n_threads = std::thread::hardware_concurrency();
        if (n_threads == 0) n_threads = 1;
        n_threads = std::min<unsigned>(n_threads, static_cast<unsigned>(n_sims));

        std::vector<double> final_values(n_sims);
        std::vector<std::thread> workers;
        workers.reserve(n_threads);

        const auto t0 = std::chrono::steady_clock::now();
        const int per_thread = n_sims / static_cast<int>(n_threads);
        const int remainder  = n_sims % static_cast<int>(n_threads);
        int begin = 0;
        for (unsigned w = 0; w < n_threads; ++w) {
            const int count = per_thread + (static_cast<int>(w) < remainder ? 1 : 0);
            workers.emplace_back(simulate_range, begin, begin + count, kTradingDays,
                                 seed + w, std::cref(drift), std::cref(L),
                                 std::cref(weights), std::ref(final_values));
            begin += count;
        }
        for (auto& t : workers) t.join();
        const auto t1 = std::chrono::steady_clock::now();
        const double elapsed_ms =
            std::chrono::duration<double, std::milli>(t1 - t0).count();

        // ── Risk metrics ──────────────────────────────────────────────────
        std::vector<double> sorted_finals = final_values;
        std::sort(sorted_finals.begin(), sorted_finals.end());

        std::vector<double> sorted_returns(sorted_finals.size());
        for (size_t i = 0; i < sorted_finals.size(); ++i)
            sorted_returns[i] = (sorted_finals[i] - kInitialValue) / kInitialValue;

        const double p5     = percentile_sorted(sorted_finals, 5.0);
        const double median = percentile_sorted(sorted_finals, 50.0);
        const double p95    = percentile_sorted(sorted_finals, 95.0);
        const double var95  = percentile_sorted(sorted_returns, 5.0);
        const double var99  = percentile_sorted(sorted_returns, 1.0);

        // CVaR 95: mean of returns at or below the VaR-95 cutoff.
        double tail_sum = 0.0;
        size_t tail_n   = 0;
        for (double r : sorted_returns) {
            if (r > var95) break;
            tail_sum += r;
            ++tail_n;
        }
        const double cvar95 = tail_n ? tail_sum / static_cast<double>(tail_n) : var95;

        size_t losses = 0;
        for (double v : sorted_finals)
            if (v < kInitialValue) ++losses; else break;
        const double prob_loss = static_cast<double>(losses) / sorted_finals.size();

        std::cout << "Monte Carlo simulation (C++)\n";
        std::cout << "  assets:        " << n_assets << " (";
        for (size_t a = 0; a < n_assets; ++a)
            std::cout << data.tickers[a] << (a + 1 < n_assets ? ", " : ")\n");
        std::cout << "  paths x days:  " << n_sims << " x " << kTradingDays
                  << "   threads: " << n_threads << "   seed: " << seed << "\n";
        std::cout << std::fixed << std::setprecision(2);
        std::cout << "  initial value: $" << kInitialValue << "\n\n";
        std::cout << "  median outcome:        $" << median << "\n";
        std::cout << "  5th percentile:        $" << p5 << "\n";
        std::cout << "  95th percentile:       $" << p95 << "\n";
        std::cout << std::setprecision(4);
        std::cout << "  VaR 95%:               " << var95 << "\n";
        std::cout << "  VaR 99%:               " << var99 << "\n";
        std::cout << "  CVaR 95%:              " << cvar95 << "\n";
        std::cout << "  probability of loss:   " << prob_loss << "\n";
        std::cout << std::setprecision(1);
        std::cout << "  simulation time:       " << elapsed_ms << " ms\n";
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "error: " << e.what() << "\n";
        return 1;
    }
}
