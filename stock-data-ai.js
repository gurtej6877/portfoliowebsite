/* Stock Data AI: client-side Finnhub dashboard. API keys are browser-local by design. */
document.addEventListener("DOMContentLoaded", () => {
  const storageKey = "stock-data-ai-finnhub-key";
  const form = document.querySelector("#stock-form");
  const input = document.querySelector("#stock-input");
  const results = document.querySelector("#app-results");
  const keyForm = document.querySelector("#key-form");
  const keyInput = document.querySelector("#api-key");
  const clearKey = document.querySelector("#clear-key");
  const status = document.querySelector("#key-status");
  const indicator = document.querySelector("#key-indicator");
  let apiKey = localStorage.getItem(storageKey) || "";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#039;", '"':"&quot;" })[char]);
  const number = (value, decimals = 2, suffix = "") => Number.isFinite(Number(value)) ? `${Number(value).toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}` : "—";
  const currency = (value) => Number.isFinite(Number(value)) ? `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}` : "—";
  const compactMoney = (value) => Number.isFinite(Number(value)) ? `$${new Intl.NumberFormat(undefined, { notation:"compact", maximumFractionDigits:2 }).format(Number(value))}` : "—";
  const updateKeyState = () => { const ready = Boolean(apiKey); status.textContent = ready ? "Key saved in this browser." : "No key saved."; indicator.textContent = ready ? "API KEY READY" : "API KEY REQUIRED"; indicator.style.color = ready ? "var(--lime)" : ""; keyInput.value = ""; };
  updateKeyState();

  keyForm.addEventListener("submit", (event) => { event.preventDefault(); const candidate = keyInput.value.trim(); if (!candidate) return; apiKey = candidate; localStorage.setItem(storageKey, apiKey); updateKeyState(); });
  clearKey.addEventListener("click", () => { apiKey = ""; localStorage.removeItem(storageKey); updateKeyState(); });
  form.addEventListener("submit", async (event) => { event.preventDefault(); const query = input.value.trim(); if (!apiKey) { results.innerHTML = '<div class="empty-state"><span>!</span><p>Add your free Finnhub API key below first. It remains on this device.</p></div>'; keyInput.focus(); return; } if (query) await loadStock(query); });

  async function request(path) {
    const response = await fetch(`https://finnhub.io/api/v1/${path}${path.includes("?") ? "&" : "?"}token=${encodeURIComponent(apiKey)}`);
    if (!response.ok) throw new Error(`Data request failed (${response.status}). Check your API key and try again.`);
    return response.json();
  }
  async function loadStock(query) {
    results.innerHTML = '<div class="loading"><i></i><i></i><i></i> Retrieving market data</div>';
    try {
      const search = await request(`search?q=${encodeURIComponent(query)}`);
      const match = search.result?.find((item) => item.type === "Common Stock") || search.result?.[0];
      if (!match?.symbol) throw new Error(`No listed company found for “${query}”. Try a ticker such as MSFT or NVDA.`);
      const ticker = match.symbol;
      const [quote, profile, metricResult] = await Promise.all([
        request(`quote?symbol=${encodeURIComponent(ticker)}`), request(`stock/profile2?symbol=${encodeURIComponent(ticker)}`), request(`stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`)
      ]);
      if (!Number.isFinite(Number(quote.c)) && !profile.name) throw new Error("No usable market data was returned for this security.");
      renderDashboard(ticker, quote, profile, metricResult.metric || {});
    } catch (error) { results.innerHTML = `<div class="empty-state"><span>×</span><p>${escapeHtml(error.message || "Something went wrong. Please try again.")}</p></div>`; }
  }
  function opinion(metric) {
    let score = 0; const points = [];
    const beta = Number(metric.beta); const pe = Number(metric.peTTM); const yieldPct = Number(metric.dividendYieldIndicatedAnnual);
    if (Number.isFinite(beta)) { if (beta >= .5 && beta <= 1.5) { score++; points.push(`Beta of ${number(beta)} indicates moderate volatility.`); } else if (beta > 1.5) { points.push(`Beta of ${number(beta)} signals above-market volatility.`); } else { points.push(`Beta of ${number(beta)} signals lower volatility.`); } }
    if (Number.isFinite(pe)) { if (pe >= 15 && pe <= 30) { score++; points.push(`P/E of ${number(pe)} falls within this model’s neutral valuation range.`); } else if (pe > 30) { points.push(`P/E of ${number(pe)} is elevated; future growth expectations may be priced in.`); } else if (pe > 0) { points.push(`P/E of ${number(pe)} is low, which can indicate value or risk.`); } } else { points.push("No positive P/E is available for this model."); }
    if (Number.isFinite(yieldPct)) { if (yieldPct >= 2 && yieldPct <= 6) { score++; points.push(`Dividend yield of ${number(yieldPct)}% supports shareholder income.`); } else if (yieldPct > 6) { score--; points.push(`Dividend yield of ${number(yieldPct)}% may warrant payout-sustainability review.`); } else { points.push(`Dividend yield of ${number(yieldPct)}% suggests a growth-led return profile.`); } }
    const result = score >= 2 ? ["BUY", "buy"] : score <= 0 ? ["SELL", "sell"] : ["HOLD", "hold"];
    return { label:result[0], style:result[1], points };
  }
  function renderDashboard(ticker, quote, profile, metric) {
    const change = Number(quote.dp); const direction = change >= 0 ? "positive" : "negative"; const changeLabel = Number.isFinite(change) ? `${change >= 0 ? "+" : ""}${number(change)}%` : "—";
    const view = opinion(metric); const company = profile.name || ticker;
    const values = [["Market cap", compactMoney(Number(profile.marketCapitalization) * 1e6)], ["52-week high", currency(metric["52WeekHigh"])], ["52-week low", currency(metric["52WeekLow"])], ["EPS (TTM)", currency(metric.epsTTM)], ["Revenue / share", currency(metric.revenuePerShareTTM)], ["Book value / share", currency(metric.bookValuePerShareQuarterly)]];
    results.innerHTML = `
      <div class="stock-header"><div><p>${escapeHtml(ticker)} · ${escapeHtml(profile.exchange || "US listed")}</p><h2>${escapeHtml(company)}</h2></div>${profile.logo ? `<img class="stock-logo" src="${escapeHtml(profile.logo)}" alt="${escapeHtml(company)} logo" onerror="this.remove()">` : ""}</div>
      <div class="metric-grid"><div class="metric"><span>Current price</span><strong>${currency(quote.c)}</strong><small class="${direction}">${changeLabel}</small></div><div class="metric"><span>Beta</span><strong>${number(metric.beta)}</strong></div><div class="metric"><span>P/E · TTM</span><strong>${number(metric.peTTM)}</strong></div><div class="metric"><span>Dividend yield</span><strong>${number(metric.dividendYieldIndicatedAnnual, 2, "%")}</strong></div></div>
      <div class="fundamentals"><h3>KEY FUNDAMENTALS</h3><div class="fundamental-grid">${values.map(([label, value]) => `<div class="fundamental"><span>${label}</span><b>${value}</b></div>`).join("")}</div></div>
      <div class="opinion"><span class="opinion-badge ${view.style}">${view.label}</span><div><h3>RULE-BASED OPINION</h3><ul>${view.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul><p class="disclaimer">Educational only. This lightweight model uses limited inputs and is not investment advice.</p></div></div>`;
  }
});
