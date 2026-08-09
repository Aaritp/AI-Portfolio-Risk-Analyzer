"""
ai.py — LLM-powered portfolio risk commentary

Sends quantitative metrics to an LLM and gets back a plain-English
risk summary formatted the way a quant analyst would write it.
"""

import os
import re
import json
import httpx
from dotenv import load_dotenv

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=ENV_PATH)
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")


# The frontend renders this string as plain text, so any markup the model
# emits is shown to the reader literally. The model reaches for LaTeX around
# percentages unprompted — "$31.8\%$" — so say plainly that it must not.
SYSTEM_PROMPT = r"""You are a quantitative analyst at a hedge fund writing risk commentary for a web dashboard.

Your output is inserted into a web page as raw text. It is not passed through a LaTeX, Markdown, or HTML renderer, so any markup you emit is displayed literally to the reader and looks like a bug.

Formatting rules — all mandatory:
- Write plain prose only. No LaTeX under any circumstances.
- No math delimiters: no $ ... $, no $$ ... $$, no \( ... \), no \[ ... \].
- No escaped characters. Write % not \%, & not \&, # not \#, _ not \_.
- No LaTeX commands such as \text{}, \times, \approx, or \mathrm{}.
- No Markdown: no **bold**, no *italics*, no # headings, no bullet or numbered lists.
- Write every figure as ordinary text: "-3.5% return", "31.8% volatility", "a Sharpe of 0.63", "$1,000".

Return continuous prose sentences and nothing else."""


# ── Output sanitisation ───────────────────────────────────────────────────
# Backstop for when the model ignores the instruction above. Cheap to run and
# it means a formatting slip degrades to correct prose rather than reaching
# the reader as "$ -3.5\%$".

_DISPLAY_MATH = re.compile(r"\$\$(.+?)\$\$", re.S)
_INLINE_MATH  = re.compile(r"\$(.+?)\$", re.S)
_TEX_DELIMS   = re.compile(r"\\[()\[\]]")
# Any \command{...} wrapper: \text{}, \num{} and \SI{} from siunitx, \mathrm{}.
_TEX_WRAPPER  = re.compile(r"\\[a-zA-Z]+\s*\{([^{}]*)\}")
_TEX_COMMAND  = re.compile(r"\\[a-zA-Z]+")
_QUANTITY     = re.compile(r"^[\d\s.,%+\-–—×*/()\[\]^_{}:=<>~]*$")

_ESCAPES = (
    (r"\%", "%"), (r"\&", "&"), (r"\#", "#"),
    (r"\_", "_"), (r"\{", "{"), (r"\}", "}"), (r"\$", "$"),
)


def _unwrap_tex(text: str) -> str:
    """Replace \\cmd{x} with x, repeatedly, so nested wrappers fully unwind."""
    for _ in range(5):
        unwrapped = _TEX_WRAPPER.sub(r"\1", text)
        if unwrapped == text:
            break
        text = unwrapped
    return text


def _is_quantity(inner: str) -> bool:
    """Whether the span between two $ is a figure rather than running prose.

    This guards the currency case: the app talks about money, so a summary
    reading "$1,000 and $2,000" must not be treated as one math span and lose
    both dollar signs. Prose between two real currency amounts contains words
    and spaces; a math span does not.

    Known trade-off: a hyphenated currency range written as "$1,000-$2,000"
    has no spaces between the delimiters, so it is read as math and loses its
    dollar signs. Accepted because the metrics sent to the model are all
    percentages and ratios — no dollar figures are supplied — while unmatched
    "$0.63$" style artifacts are the failure actually being fixed.
    """
    bare = _TEX_COMMAND.sub("", inner).replace("\\", "")
    if not bare.strip():
        return False
    return bool(_QUANTITY.match(bare)) or not any(c.isspace() for c in bare.strip())


def sanitize_summary(text: str) -> str:
    """Strip LaTeX artifacts from model output, leaving the prose intact."""
    if not text:
        return text

    # Unwrap \cmd{...} first: a wrapper inside a math span would otherwise
    # make the span look like prose, and the $ would survive the pass below.
    text = _TEX_DELIMS.sub("", text)
    text = _unwrap_tex(text)

    text = _DISPLAY_MATH.sub(lambda m: m.group(1).strip(), text)
    text = _INLINE_MATH.sub(
        lambda m: m.group(1).strip() if _is_quantity(m.group(1)) else m.group(0),
        text,
    )

    for escaped, plain in _ESCAPES:
        text = text.replace(escaped, plain)

    # Any bare \command left over. A backslash never appears in the prose we
    # want, so removing these cannot damage legitimate text.
    text = _TEX_COMMAND.sub("", text)

    # Stripping delimiters can leave doubled spaces mid-sentence.
    text = re.sub(r"[ \t]{2,}", " ", text)
    return text.strip()


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
                    "messages":   [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": prompt},
                    ],
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

            return sanitize_summary(content)
    except Exception as e:
        return f"AI summary unavailable: {str(e)}"
