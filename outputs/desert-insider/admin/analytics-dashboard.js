(() => {
  const tokenForm = document.querySelector("#token-form");
  const tokenInput = document.querySelector("#token-input");
  const clearTokenButton = document.querySelector("#clear-token");
  const status = document.querySelector("#status");
  const summary = document.querySelector("#summary");
  const trendChart = document.querySelector("#trend-chart");
  const topCategories = document.querySelector("#top-categories");
  const topPlaces = document.querySelector("#top-places");
  const actions = document.querySelector("#actions");
  const sources = document.querySelector("#sources");
  const refreshButton = document.querySelector("#refresh");
  const sendTestButton = document.querySelector("#send-test");
  const tokenKey = "mdg_admin_analytics_token";

  const nf = new Intl.NumberFormat("en-US");

  function formatNumber(value) {
    return nf.format(Number(value || 0));
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
  }

  function token() {
    return localStorage.getItem(tokenKey) || "";
  }

  function authHeaders() {
    return {
      authorization: `Bearer ${token()}`,
      "content-type": "application/json",
    };
  }

  function periodCard(title, period) {
    const totals = period?.totals || {};
    return `
      <article class="period-card">
        <p class="eyebrow">${title}</p>
        <h2>${formatNumber(totals.guideViews)} guide views</h2>
        <div class="metric-line"><span>Unique Visitors</span><strong>${formatNumber(
          totals.uniqueVisitors,
        )}</strong></div>
        <div class="metric-line"><span>Returning Visitors</span><strong>${formatNumber(
          totals.returningVisitors,
        )}</strong></div>
        <div class="metric-line"><span>Client Engagements</span><strong>${formatNumber(
          totals.clientEngagements,
        )}</strong></div>
      </article>
    `;
  }

  function renderTrend(trend = []) {
    const max = Math.max(1, ...trend.map((item) => Number(item.guideViews || 0)));
    trendChart.innerHTML = trend
      .map((item) => {
        const height = Math.max(8, Math.round((Number(item.guideViews || 0) / max) * 150));
        const date = new Date(`${item.date}T12:00:00Z`);
        const label = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
        return `
          <div class="trend-day">
            <div class="trend-bar-wrap">
              <div class="trend-bar" style="height:${height}px"></div>
            </div>
            <div class="trend-value">${formatNumber(item.guideViews)}</div>
            <div class="trend-label">${label}</div>
          </div>
        `;
      })
      .join("");
  }

  function renderRankList(element, items = [], emptyText) {
    if (!items.length) {
      element.innerHTML = `<p>${emptyText}</p>`;
      return;
    }

    element.innerHTML = items
      .slice(0, 6)
      .map(
        (item) => `
          <div class="rank-item">
            <div>
              <strong>${item.name}</strong>
              <small>${item.category || item.type || "Guide"}${item.actions ? ` · ${formatNumber(item.actions)} actions` : ""}</small>
            </div>
            <div class="rank-value">${formatNumber(item.views)}</div>
          </div>
        `,
      )
      .join("");
  }

  function renderActions(totals = {}) {
    const contactActions =
      Number(totals.darceyCallClicks || 0) +
      Number(totals.darceyTextClicks || 0) +
      Number(totals.darceyEmailClicks || 0);

    const items = [
      ["Directions Clicks", totals.mapsClicks],
      ["Business Website Clicks", totals.businessWebsiteClicks],
      ["Menu Clicks", totals.menuClicks],
      ["Darcey Website Clicks", totals.darceyWebsiteClicks],
      ["Contact Actions", contactActions],
      ["Client Engagements", totals.clientEngagements],
    ];

    actions.innerHTML = items
      .map(
        ([label, value]) => `
          <div class="action-card">
            <strong>${formatNumber(value)}</strong>
            <span>${label}</span>
          </div>
        `,
      )
      .join("");
  }

  function renderSources(sourceMap = {}) {
    const entries = Object.entries(sourceMap)
      .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
      .slice(0, 6);
    const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);

    if (!total) {
      sources.innerHTML = "<p>No referral source data yet.</p>";
      return;
    }

    sources.innerHTML = entries
      .map(([source, value]) => {
        const percent = Math.round((Number(value || 0) / total) * 100);
        return `
          <div class="source-item">
            <div>
              <strong>${source}</strong>
              <div class="source-bar"><span style="width:${percent}%"></span></div>
            </div>
            <div class="rank-value">${percent}%</div>
          </div>
        `;
      })
      .join("");
  }

  function render(data) {
    summary.innerHTML = [
      periodCard("Today", data.today),
      periodCard("Yesterday", data.yesterday),
      periodCard("Last 7 Days", data.last7),
      periodCard("Last 30 Days", data.last30),
    ].join("");

    renderTrend(data.trend);
    renderRankList(topCategories, data.last7.topCategories, "No category activity yet.");
    renderRankList(topPlaces, data.last7.topPlaces, "No place views yet.");
    renderActions(data.last7.totals);
    renderSources(data.last7.sources);
  }

  async function loadDashboard() {
    if (!token()) {
      setStatus("Paste the private admin token to load analytics.");
      return;
    }

    setStatus("Loading analytics...");
    const response = await fetch("/api/analytics/summary", {
      headers: authHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setStatus(data.error || "Could not load analytics.", true);
      return;
    }

    render(data);
    setStatus(`Updated ${new Date(data.generatedAt).toLocaleString()}.`);
  }

  async function sendTestReport() {
    if (!token()) {
      setStatus("Paste the private admin token before sending a test report.", true);
      return;
    }

    sendTestButton.disabled = true;
    sendTestButton.textContent = "Sending...";
    setStatus("Sending test Daily Pulse email...");

    try {
      const response = await fetch("/api/analytics/send-test-report", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Test report failed.");
      setStatus(`Test report sent to ${data.recipient}. Message ID: ${data.messageId || "pending"}.`);
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      sendTestButton.disabled = false;
      sendTestButton.textContent = "Send Test Report";
    }
  }

  tokenInput.value = token();

  tokenForm.addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem(tokenKey, tokenInput.value.trim());
    loadDashboard();
  });

  clearTokenButton.addEventListener("click", () => {
    localStorage.removeItem(tokenKey);
    tokenInput.value = "";
    summary.innerHTML = "";
    trendChart.innerHTML = "";
    topCategories.innerHTML = "";
    topPlaces.innerHTML = "";
    actions.innerHTML = "";
    sources.innerHTML = "";
    setStatus("Saved token cleared.");
  });

  refreshButton.addEventListener("click", loadDashboard);
  sendTestButton.addEventListener("click", sendTestReport);
  loadDashboard();
})();
