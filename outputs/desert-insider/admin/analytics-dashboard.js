(() => {
  const $ = (selector) => document.querySelector(selector);
  const tokenKey = "mdg_admin_analytics_token";
  const nf = new Intl.NumberFormat("en-US");
  const state = { data: null, range: "30" };

  const elements = {
    tokenForm: $("#token-form"), tokenInput: $("#token-input"), clearToken: $("#clear-token"),
    status: $("#status"), access: $("#access-panel"), summary: $("#summary"),
    activity: $("#activity-chart"), donut: $("#visitor-donut"), visitorDetails: $("#visitor-details"),
    categories: $("#category-bars"), places: $("#popular-places"), contactCards: $("#contact-cards"),
    contactTotal: $("#contact-total"), contactTrend: $("#contact-trend"),
    realEstatePanel: $("#real-estate-panel"), realEstateContent: $("#real-estate-content"),
    appPanel: $("#app-panel"), appContent: $("#app-content"), refresh: $("#refresh"),
    preview: $("#preview-report"), sendTest: $("#send-test"), rangeSelector: $("#range-selector"),
  };

  const number = (value) => nf.format(Number(value || 0));
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const token = () => localStorage.getItem(tokenKey) || "";
  const headers = () => ({ authorization: `Bearer ${token()}`, "content-type": "application/json" });
  const contactTotal = (totals = {}) => Number(totals.darceyTextClicks || 0) + Number(totals.darceyCallClicks || 0) + Number(totals.darceyEmailClicks || 0);
  const imageUrl = (path = "") => path.startsWith("./") ? `/${path.slice(2)}` : path;

  function setStatus(message, error = false) {
    elements.status.textContent = message;
    elements.status.classList.toggle("error", error);
  }

  function comparison(current, previous) {
    current = Number(current || 0); previous = Number(previous || 0);
    if (!previous) return current ? "New activity in this period" : "Ready for new activity";
    const change = Math.round(((current - previous) / previous) * 100);
    if (!change) return "Even with the previous period";
    return `${change > 0 ? "↑" : "↓"} ${Math.abs(change)}% from previous period`;
  }

  function sparkline(trend, key) {
    const values = trend.map((item) => Number(item[key] || 0));
    const max = Math.max(1, ...values); const width = 120; const height = 34;
    const points = values.map((value, index) => `${values.length === 1 ? width : Math.round((index / (values.length - 1)) * width)},${height - Math.round((value / max) * (height - 4))}`).join(" ");
    return `<svg class="sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Metric trend"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" /></svg>`;
  }

  function kpi(label, value, previous, trend, key) {
    return `<article class="kpi-card"><div class="kpi-top"><span>${escapeHtml(label)}</span>${sparkline(trend, key)}</div><strong>${number(value)}</strong><small>${escapeHtml(comparison(value, previous))}</small></article>`;
  }

  function lineChart(trend = []) {
    if (!trend.length) return `<p class="empty">Activity will appear here as visitors use the guide.</p>`;
    const width = 900; const height = 260; const pad = 34;
    const max = Math.max(1, ...trend.flatMap((item) => [Number(item.guideViews || 0), Number(item.uniqueVisitors || 0)]));
    const points = (key) => trend.map((item, index) => {
      const x = pad + (index / Math.max(1, trend.length - 1)) * (width - pad * 2);
      const y = height - pad - (Number(item[key] || 0) / max) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const labels = trend.map((item, index) => {
      const step = Math.max(1, Math.ceil(trend.length / 6));
      if (index % step && index !== trend.length - 1) return "";
      const x = pad + (index / Math.max(1, trend.length - 1)) * (width - pad * 2);
      const date = new Date(`${item.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      return `<text x="${x}" y="252" text-anchor="middle">${date}</text>`;
    }).join("");
    return `<div class="chart-legend"><span><i class="views"></i>Guide views</span><span><i class="visitors"></i>Visitors</span></div><svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Guide views and visitors over time"><line x1="${pad}" y1="${height-pad}" x2="${width-pad}" y2="${height-pad}" class="axis"/><polyline points="${points("guideViews")}" class="views-line"/><polyline points="${points("uniqueVisitors")}" class="visitor-line"/>${labels}</svg>`;
  }

  function renderVisitors(totals = {}) {
    const total = Number(totals.uniqueVisitors || 0);
    const returning = Math.min(total, Number(totals.returningVisitors || 0));
    const fresh = Math.max(0, total - returning);
    const returningPercent = total ? Math.round((returning / total) * 100) : 0;
    elements.donut.style.setProperty("--returning", `${returningPercent}%`);
    elements.donut.innerHTML = `<strong>${returningPercent}%</strong><span>returning</span>`;
    elements.visitorDetails.innerHTML = `<div><i class="new"></i><span>New visitors</span><strong>${number(fresh)}</strong></div><div><i class="returning"></i><span>Returning visitors</span><strong>${number(returning)}</strong></div><p>${total ? "A returning audience means people are using the guide as an ongoing local resource." : "Visitor loyalty will appear as people return to the guide."}</p>`;
  }

  function renderCategories(items = []) {
    const allowed = ["Food & Drink", "Golf", "Things To Do", "Shopping"];
    const normalized = Object.fromEntries(allowed.map((name) => [name, 0]));
    items.forEach((item) => { if (Object.hasOwn(normalized, item.name)) normalized[item.name] += Number(item.views || 0); });
    const total = Object.values(normalized).reduce((sum, value) => sum + value, 0);
    elements.categories.innerHTML = Object.entries(normalized).map(([name, value]) => {
      const percent = total ? Math.round((value / total) * 100) : 0;
      return `<div class="category-row"><div><strong>${name.replace("Things To Do", "Things to Do")}</strong><span>${percent}%</span></div><div class="bar"><i style="width:${percent}%"></i></div><small>${number(value)} explorations</small></div>`;
    }).join("");
  }

  function renderPlaces(items = []) {
    if (!items.length) { elements.places.innerHTML = `<p class="empty">Popular recommendations will appear once visitors begin opening places.</p>`; return; }
    const max = Math.max(1, ...items.map((item) => Number(item.views || 0)));
    elements.places.innerHTML = items.slice(0, 8).map((item, index) => `<article class="place-row"><span class="place-rank">${index + 1}</span><img src="${escapeHtml(imageUrl(item.image))}" alt="" loading="lazy"><div class="place-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category || item.type || "Guide")}</small><div class="place-bar"><i style="width:${Math.round((Number(item.views || 0) / max) * 100)}%"></i></div></div><span class="place-views">${number(item.views)}<small>views</small></span></article>`).join("");
  }

  function renderContacts(totals = {}, trend = []) {
    const items = [["Texts", totals.darceyTextClicks, "Message"], ["Calls", totals.darceyCallClicks, "Phone"], ["Emails", totals.darceyEmailClicks, "Envelope"]];
    elements.contactCards.innerHTML = items.map(([label, value, icon]) => `<article><span>${icon}</span><strong>${number(value)}</strong><small>${label}</small></article>`).join("");
    const total = contactTotal(totals);
    elements.contactTotal.innerHTML = `<strong>${number(total)}</strong><span>Total contact actions</span>`;
    const max = Math.max(1, ...trend.map((item) => Number(item.contactActions || 0)));
    elements.contactTrend.innerHTML = trend.slice(-14).map((item) => `<i title="${item.date}: ${item.contactActions || 0}" style="height:${Math.max(4, Math.round((Number(item.contactActions || 0) / max) * 54))}px"></i>`).join("");
  }

  function renderOpportunities(totals = {}) {
    const realEstate = Number(totals.darceyWebsiteClicks || 0);
    elements.realEstatePanel.hidden = !realEstate;
    elements.realEstateContent.innerHTML = `<strong class="opportunity-number">${number(realEstate)}</strong><p>visits to Darcey's real estate website from the guide.</p>`;
    const interest = Number(totals.installCtaClicked || 0); const installs = Number(totals.pwaInstallConfirmed || 0); const launches = Number(totals.pwaStandaloneLaunches || 0);
    elements.appPanel.hidden = !(interest || installs || launches);
    elements.appContent.innerHTML = `<div class="app-stats"><div><strong>${number(interest)}</strong><span>Add-to-phone interest</span></div><div><strong>${number(installs)}</strong><span>Confirmed installs</span></div><div><strong>${number(launches)}</strong><span>Standalone app launches</span></div></div>`;
  }

  function localPreviewData() {
    const trend = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(); date.setUTCDate(date.getUTCDate() - 29 + index);
      const guideViews = [8, 11, 9, 14, 12, 17, 15][index % 7] + Math.floor(index / 8);
      return { date: date.toISOString().slice(0, 10), guideViews, uniqueVisitors: Math.max(3, guideViews - 4), placeViews: guideViews + 6, contactActions: index % 5 === 0 ? 2 : index % 3 === 0 ? 1 : 0 };
    });
    const current = {
      totals: { guideViews: 324, uniqueVisitors: 218, returningVisitors: 61, placeViews: 487, darceyTextClicks: 4, darceyCallClicks: 3, darceyEmailClicks: 5, darceyWebsiteClicks: 9, pwaInstallConfirmed: 3, pwaStandaloneLaunches: 21 },
      topCategories: [{ name: "Food & Drink", views: 166 }, { name: "Things To Do", views: 90 }, { name: "Golf", views: 65 }, { name: "Shopping", views: 39 }],
      topPlaces: [
        { name: "Spencer's Restaurant", category: "Food & Drink", views: 42, image: "./assets/restaurants/spencers-patio.png" },
        { name: "The Living Desert", category: "Things To Do", views: 35, image: "./assets/things-to-do/the-living-desert.png" },
        { name: "Desert Willow Golf Resort", category: "Golf", views: 29, image: "./assets/golf/desert-willow-web.jpg" },
        { name: "Lulu California Bistro", category: "Food & Drink", views: 24, image: "./assets/restaurants/lulu.png" },
        { name: "Palm Springs Aerial Tramway", category: "Things To Do", views: 19, image: "./assets/things-to-do/palm-springs-aerial-tram.png" },
      ],
    };
    const previous = { totals: { guideViews: 275, uniqueVisitors: 194, placeViews: 421, darceyTextClicks: 3, darceyCallClicks: 2, darceyEmailClicks: 4 } };
    const selected = { current, previous, trend };
    return { ok: true, generatedAt: new Date().toISOString(), ranges: { "7": selected, "30": selected, "90": selected, all: { ...selected, previous: null } } };
  }

  function render() {
    if (!state.data) return;
    const selected = state.data.ranges?.[state.range] || state.data.ranges?.["30"];
    const current = selected.current || {}; const previous = selected.previous || {};
    const totals = current.totals || {}; const previousTotals = previous?.totals || {}; const trend = selected.trend || [];
    elements.summary.innerHTML = [
      kpi("Guide Views", totals.guideViews, previousTotals.guideViews, trend, "guideViews"),
      kpi("Visitors", totals.uniqueVisitors, previousTotals.uniqueVisitors, trend, "uniqueVisitors"),
      kpi("Recommendations Viewed", totals.placeViews, previousTotals.placeViews, trend, "placeViews"),
      kpi("Darcey Contact Actions", contactTotal(totals), contactTotal(previousTotals), trend, "contactActions"),
    ].join("");
    elements.activity.innerHTML = lineChart(trend);
    renderVisitors(totals); renderCategories(current.topCategories || []); renderPlaces(current.topPlaces || []);
    renderContacts(totals, trend); renderOpportunities(totals);
  }

  async function loadDashboard() {
    if (!token()) {
      if (["localhost", "127.0.0.1"].includes(location.hostname)) {
        state.data = localPreviewData(); render(); setStatus("Local visual preview using sample data.");
      } else {
        setStatus("Enter the private access token to view Darcey's analytics.");
      }
      return;
    }
    setStatus("Loading Darcey's guide performance…");
    try {
      const response = await fetch("/api/analytics/summary", { headers: headers() });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not load analytics.");
      state.data = data; render(); elements.access.classList.add("authenticated");
      setStatus(`Updated ${new Date(data.generatedAt).toLocaleString()}.`);
    } catch (error) { setStatus(error.message, true); }
  }

  async function previewReport() {
    if (!token()) return setStatus("Enter the private access token before previewing the report.", true);
    elements.preview.disabled = true; elements.preview.textContent = "Preparing Preview…";
    try {
      const response = await fetch("/api/analytics/preview-report", { headers: headers() });
      const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || "Preview failed.");
      const preview = window.open("", "mdg-report-preview");
      if (!preview) throw new Error("Allow pop-ups to open the report preview.");
      preview.document.open(); preview.document.write(data.html); preview.document.close();
      setStatus(`Preview opened for ${data.date}.`);
    } catch (error) { setStatus(error.message, true); }
    finally { elements.preview.disabled = false; elements.preview.textContent = "Preview Daily Report"; }
  }

  async function sendTestReport() {
    if (!token()) return setStatus("Enter the private access token before sending a test report.", true);
    elements.sendTest.disabled = true; elements.sendTest.textContent = "Sending…"; setStatus("Sending Darcey's test report…");
    try {
      const response = await fetch("/api/analytics/send-test-report", { method: "POST", headers: headers(), body: "{}" });
      const data = await response.json(); if (!response.ok || !data.ok) throw new Error(data.error || "Test report failed.");
      setStatus(`Test report sent to ${data.recipient}.`);
    } catch (error) { setStatus(error.message, true); }
    finally { elements.sendTest.disabled = false; elements.sendTest.textContent = "Send Test Report"; }
  }

  elements.tokenInput.value = token();
  elements.tokenForm.addEventListener("submit", (event) => { event.preventDefault(); localStorage.setItem(tokenKey, elements.tokenInput.value.trim()); loadDashboard(); });
  elements.clearToken.addEventListener("click", () => { localStorage.removeItem(tokenKey); elements.tokenInput.value = ""; elements.access.classList.remove("authenticated"); setStatus("Saved access token cleared."); });
  elements.rangeSelector.addEventListener("click", (event) => { const button = event.target.closest("button[data-range]"); if (!button) return; state.range = button.dataset.range; elements.rangeSelector.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button)); render(); });
  elements.refresh.addEventListener("click", loadDashboard); elements.preview.addEventListener("click", previewReport); elements.sendTest.addEventListener("click", sendTestReport);
  loadDashboard();
})();
