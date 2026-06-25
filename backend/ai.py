"""
ai.py — LLM-powered portfolio risk commentary

Sends quantitative metrics to an LLM and gets back a plain-English
risk summary formatted the way a quant analyst would write it.
"""

import os
import json
import httpx
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=ENV_PATH)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")


async def generate_risk_summary(tickers: list,
                                 stock_metrics: dict,
                                 port_metrics: dict,
                                 weights: list) -> str:
    if not OPENROUTER_API_KEY:
        return "AI summary unavailable — set OPENROUTER_API_KEY in your .env file."

    weight_str = ", ".join(
        f"{tickers[i]} ({weights[i]:.1%})" for i in range(len(tickers))
    )

    stock_summary = {}
    for ticker, m in stock_metrics.items():
        stock_summary[ticker] = {
            "annual_return": f"{m['return']:.1%}",
            "volatility":    f"{m['volatility']:.1%}",
            "sharpe":        f"{m['sharpe']:.2f}",
            "max_drawdown":  f"{m['max_drawdown']:.1%}",
            "var_95":        f"{m['var_95']:.2%} daily",
        }

    prompt = f"""You are a quantitative analyst at a hedge fund. Provide a concise, professional risk assessment.

Portfolio: {weight_str}

Portfolio Metrics:
  Annualized Return:  {port_metrics['return']:.1%}
  Annualized Vol:     {port_metrics['volatility']:.1%}
  Sharpe Ratio:       {port_metrics['sharpe']:.2f}
  VaR (95%):          {port_metrics['var_95']:.2%} daily
  VaR (99%):          {port_metrics['var_99']:.2%} daily

Individual Stocks:
{json.dumps(stock_summary, indent=2)}

Write 3-4 sentences covering:
1. Overall risk profile (conservative / moderate / aggressive)
2. Diversification quality
3. Standout risk or return characteristics
4. One actionable observation

Be direct and quantitative. No fluff."""

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":      "google/gemini-2.5-flash",
                    "max_tokens": 350,
                    "messages":   [{"role": "user", "content": prompt}],
                },
            )
            data = response.json()
            if response.status_code != 200:
                error = data.get("error") if isinstance(data, dict) else None
                if isinstance(error, dict):
                    code = error.get("code")
                    message = error.get("message", response.text)
                    if code == 402:
                        return f"AI summary unavailable: insufficient OpenRouter credits. {message}"
                    return f"AI summary unavailable: {message}"
                return f"AI summary unavailable: {response.text}"

            choices = data.get("choices") if isinstance(data, dict) else None
            if not choices or not isinstance(choices, list):
                return "AI summary unavailable: unexpected OpenRouter response format."

            message = choices[0].get("message") if isinstance(choices[0], dict) else None
            content = message.get("content") if isinstance(message, dict) else None
            if not content:
                return "AI summary unavailable: missing content in OpenRouter response."

            return content
    except Exception as e:
        return f"AI summary unavailable: {str(e)}"
