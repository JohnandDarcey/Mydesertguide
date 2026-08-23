(() => {
  const $ = (selector) => document.querySelector(selector);
  const tokenKey = "mdg_admin_analytics_token";
  const nf = new Intl.NumberFormat("en-US");
  const state = { data: null, leads: [], range: "30" };

  const elements = {
    tokenForm: $("#token-form"), tokenInput: $("#token-input"), clearToken: $("#clear-token"),
    status: $("#status"), access: $("#access-panel"), summary: $("#summary"),
    categories: $("#category-bars"), places: $("#popular-places"), contactCards: $("#contact-cards"),
    contactTotal: $("#contact-total"), contactTrend: $("#contact-trend"),
    realEstatePanel: $("#real-estate-panel"), realEstateContent: $("#real-estate-content"),
    appPanel: $("#app-panel"), appContent: $("#app-content"), refresh: $("#refresh"),
    preview: $("#preview-report"), sendTest: $("#send-test"), rangeSelector: $("#range-selector"),
    leadTotal: $("#lead-total"), leadContent: $("#lead-content"), leadPages: $("#lead-pages"), recentLeads: $("#recent-leads"),
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
    elements.places.innerHTML = items.slice(0, 8).map((item, index) => `<article class="place-row"><span class="place-rank">${index + 1}</span><img src="${escapeHtml(imageUrl(item.image))}" alt="" loading="lazy"><div class="place-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category || item.type || "Guide")}</small><div class="place-bar"><i style="width:${Math.round((Number(item.views || 0) / max) * 100)}%"></i></div></div><span class="place-views">${number(item.views)}<small>tracked opens</small></span></article>`).join("");
  }

  function renderContacts(totals = {}, trend = []) {
    const items = [["Text app opens", totals.darceyTextClicks, "Message"], ["Phone link clicks", totals.darceyCallClicks, "Phone"], ["Email app opens", totals.darceyEmailClicks, "Envelope"]];
    elements.contactCards.innerHTML = items.map(([label, value, icon]) => `<article><span>${icon}</span><strong>${number(value)}</strong><small>${label}</small></article>`).join("");
    const total = contactTotal(totals);
    elements.contactTotal.innerHTML = `<strong>${number(total)}</strong><span>Total contact actions</span>`;
    const max = Math.max(1, ...trend.map((item) => Number(item.contactActions || 0)));
    elements.contactTrend.innerHTML = trend.slice(-14).map((item) => `<i title="${item.date}: ${item.contactActions || 0}" style="height:${Math.max(4, Math.round((Number(item.contactActions || 0) / max) * 54))}px"></i>`).join("");
  }

  function renderLeads(current = {}) {
    const totals = current.totals || {};
    const leads = Number(totals.leadSubmissions || 0);
    const starts = Number(totals.leadFormStarts || 0);
    const startRate = starts ? Math.round((leads / starts) * 100) : 0;
    const typeLabels = { buying: "Buying", selling: "Selling", relocating: "Relocating", exploring: "Just Exploring", general: "General Question" };
    const sourceLabels = { Search: "Organic Search", Direct: "Direct", Instagram: "Social · Instagram", Facebook: "Social · Facebook", "DarceyDeetz.com": "Referral · DarceyDeetz.com" };
    const breakdown = Object.entries(current.leadTypes || {}).sort((a, b) => b[1] - a[1]);
    const sources = Object.entries(current.leadSources || {}).sort((a, b) => b[1] - a[1]);
    elements.leadTotal.innerHTML = `<strong>${number(leads)}</strong><span>confirmed in this period</span>`;
    elements.leadContent.innerHTML = `<div class="lead-summary-cards"><article><strong>${number(totals.realEstateContactClicks || 0)}</strong><span>Ask Darcey CTA clicks</span></article><article><strong>${number(totals.realEstateHomeSearchClicks || 0)}</strong><span>Explore homes clicks</span></article><article><strong>${number(totals.askDarceyPageViews || 0)}</strong><span>Ask Darcey page visits</span></article><article><strong>${number(starts)}</strong><span>Forms started</span></article><article><strong>${number(leads)}</strong><span>Confirmed leads</span></article><article><strong>${number(startRate)}%</strong><span>Form-start conversion</span></article><article><strong>${number(totals.buyerGuideRequests || 0)}</strong><span>Buyer guides requested</span></article></div><div class="lead-breakdowns"><div><h3>Lead Type</h3>${breakdown.length ? breakdown.map(([name, value]) => `<p><span>${escapeHtml(typeLabels[name] || name)}</span><strong>${number(value)}</strong></p>`).join("") : `<p class="empty">Lead types will appear after the first confirmed inquiry.</p>`}</div><div><h3>Lead Source</h3>${sources.length ? sources.map(([name, value]) => `<p><span>${escapeHtml(sourceLabels[name] || name)}</span><strong>${number(value)}</strong></p>`).join("") : `<p class="empty">Sources will appear after the first confirmed inquiry.</p>`}</div></div>`;

    const contributingPages = (current.realEstatePages || []).filter((page) => page.ctaClicks || page.leads).slice(0, 12);
    elements.leadPages.innerHTML = contributingPages.length ? `<div class="lead-pages-table-wrap"><table><thead><tr><th>Source Page</th><th>Ask Darcey Clicks</th><th>Confirmed Leads</th></tr></thead><tbody>${contributingPages.map((page) => `<tr><td><a href="${escapeHtml(page.name)}" target="_blank">${escapeHtml(page.name)}</a></td><td>${number(page.ctaClicks)}</td><td>${number(page.leads)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="empty">Pages will appear here after visitors use an Ask Darcey link or submit an inquiry.</p>`;

    if (!state.leads.length) {
      elements.recentLeads.innerHTML = `<p class="empty">No confirmed inquiries yet. New leads will appear here and will also be emailed to John and Darcey.</p>`;
      return;
    }
    elements.recentLeads.innerHTML = `<div class="lead-table-wrap"><table class="lead-table"><thead><tr><th>Date</th><th>Name & Email</th><th>Phone</th><th>Lead Type</th><th>Message</th><th>Source Page</th><th>Lead Source</th><th>Status</th></tr></thead><tbody>${state.leads.map((lead) => {
      const source = [lead.attribution?.source, lead.attribution?.medium].filter(Boolean).join(" / ") || "Direct";
      const leadStatus = lead.status || "New";
      const phoneHref = String(lead.phone || "").replace(/[^+\d]/g, "");
      return `<tr><td data-label="Date">${new Date(lead.submittedAt).toLocaleString()}</td><td data-label="Name & Email"><strong>${escapeHtml(lead.name)}</strong><a href="mailto:${encodeURIComponent(lead.email)}">${escapeHtml(lead.email)}</a></td><td data-label="Phone">${lead.phone ? `<a href="tel:${escapeHtml(phoneHref)}">${escapeHtml(lead.phone)}</a>` : "—"}</td><td data-label="Lead Type">${escapeHtml(typeLabels[lead.interest] || lead.interestLabel || lead.interest || "Question")}</td><td data-label="Message"><span class="lead-message-preview">${escapeHtml(lead.message || "—")}</span></td><td data-label="Source Page"><a href="${escapeHtml(lead.sourcePage || lead.attribution?.landingPath || "/")}" target="_blank">${escapeHtml(lead.sourcePage || lead.attribution?.landingPath || "/")}</a></td><td data-label="Lead Source">${escapeHtml(sourceLabels[lead.attribution?.source] || source)}</td><td data-label="Status"><span class="lead-status ${leadStatus.toLowerCase()}">${escapeHtml(leadStatus)}</span><div class="lead-actions"><a href="mailto:${encodeURIComponent(lead.email)}">Email</a>${lead.phone ? `<a href="tel:${escapeHtml(phoneHref)}">Call</a>` : ""}${leadStatus !== "Contacted" ? `<button type="button" data-mark-contacted="${escapeHtml(lead.id)}">Mark Contacted</button>` : ""}</div></td></tr>`;
    }).join("")}</tbody></table></div>`;
  }

  function renderOpportunities(totals = {}) {
    const homeSearches = Number(totals.realEstateHomeSearchClicks || totals.darceyWebsiteClicks || 0);
    const talkClicks = Number(totals.realEstateContactClicks || 0);
    const confirmedLeads = Number(totals.leadSubmissions || 0);
    const realEstate = homeSearches + talkClicks + confirmedLeads;
    elements.realEstatePanel.hidden = !realEstate;
    elements.realEstateContent.innerHTML = `<strong class="opportunity-number">${number(realEstate)}</strong><p>real-estate interest actions from the guide: ${number(homeSearches)} home-search clicks, ${number(talkClicks)} conversation CTA clicks, and ${number(confirmedLeads)} confirmed lead${confirmedLeads === 1 ? "" : "s"}.</p>`;
    const interest = Number(totals.installCtaClicked || 0); const installs = Number(totals.pwaInstallConfirmed || 0); const launches = Number(totals.pwaStandaloneLaunches || 0);
    elements.appPanel.hidden = !(interest || installs || launches);
    elements.appContent.innerHTML = `<div class="app-stats"><div><strong>${number(interest)}</strong><span>Add-to-phone interest</span></div><div><strong>${number(installs)}</strong><span>Confirmed installs</span></div><div><strong>${number(launches)}</strong><span>Standalone app launches</span></div></div>`;
  }

  function localPreviewData() {
    const trend = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(); date.setUTCDate(date.getUTCDate() - 29 + index);
      const placeViews = [14, 17, 15, 20, 18, 23, 21][index % 7] + Math.floor(index / 8);
      return { date: date.toISOString().slice(0, 10), placeViews, contactActions: index % 5 === 0 ? 2 : index % 3 === 0 ? 1 : 0 };
    });
    const current = {
      totals: { placeViews: 487, darceyTextClicks: 4, darceyCallClicks: 3, darceyEmailClicks: 5, realEstateContactClicks: 12, realEstateHomeSearchClicks: 9, askDarceyPageViews: 7, leadFormStarts: 5, leadSubmissions: 3, buyerGuideRequests: 2, pwaInstallConfirmed: 3, pwaStandaloneLaunches: 21 },
      leadTypes: { buying: 2, relocating: 1 },
      leadSources: { Google: 2, Instagram: 1 },
      realEstatePages: [{ name: "/golf/", views: 65, ctaClicks: 5, leads: 2 }, { name: "/things-to-do/", views: 90, ctaClicks: 4, leads: 1 }, { name: "/", views: 124, ctaClicks: 3, leads: 0 }],
      topCategories: [{ name: "Food & Drink", views: 166 }, { name: "Things To Do", views: 90 }, { name: "Golf", views: 65 }, { name: "Shopping", views: 39 }],
      topPlaces: [
        { name: "Spencer's Restaurant", category: "Food & Drink", views: 42, image: "./assets/restaurants/spencers-patio.png" },
        { name: "The Living Desert", category: "Things To Do", views: 35, image: "./assets/things-to-do/the-living-desert.png" },
        { name: "Desert Willow Golf Resort", category: "Golf", views: 29, image: "./assets/golf/desert-willow-web.jpg" },
        { name: "Lulu California Bistro", category: "Food & Drink", views: 24, image: "./assets/restaurants/lulu.png" },
        { name: "Palm Springs Aerial Tramway", category: "Things To Do", views: 19, image: "./assets/things-to-do/palm-springs-aerial-tram.png" },
      ],
    };
    const previous = { totals: { placeViews: 421, darceyTextClicks: 3, darceyCallClicks: 2, darceyEmailClicks: 4 } };
    const selected = { current, previous, trend };
    return { ok: true, generatedAt: new Date().toISOString(), ranges: { "24h": selected, "7": selected, "30": selected, "90": selected, all: { ...selected, previous: null } } };
  }

  function render() {
    if (!state.data) return;
    const selected = state.data.ranges?.[state.range] || state.data.ranges?.["30"];
    const current = selected.current || {}; const previous = selected.previous || {};
    const totals = current.totals || {}; const previousTotals = previous?.totals || {}; const trend = selected.trend || [];
    elements.summary.innerHTML = [
      kpi("Recommendations Viewed", totals.placeViews, previousTotals.placeViews, trend, "placeViews"),
      kpi("Darcey Contact Actions", contactTotal(totals), contactTotal(previousTotals), trend, "contactActions"),
      kpi("Confirmed Leads", totals.leadSubmissions, previousTotals.leadSubmissions, trend, "leadSubmissions"),
    ].join("");
    renderCategories(current.topCategories || []); renderPlaces(current.topPlaces || []);
    renderContacts(totals, trend); renderLeads(current); renderOpportunities(totals);
  }

  async function loadDashboard() {
    if (!token()) {
      if (["localhost", "127.0.0.1"].includes(location.hostname)) {
        state.leads = [{ id: "preview-lead-1", submittedAt: new Date().toISOString(), name: "Sample Buyer", email: "buyer@example.com", phone: "760-555-0100", interest: "buying", message: "We're considering a move to Palm Desert and would love some neighborhood guidance.", sourcePage: "/golf/", status: "New", attribution: { source: "Search", medium: "organic" } }, { id: "preview-lead-2", submittedAt: new Date(Date.now() - 86400000).toISOString(), name: "Sample Relocation Lead", email: "relocating@example.com", phone: "", interest: "relocating", message: "Planning a move this winter.", sourcePage: "/things-to-do/", status: "Contacted", attribution: { source: "Instagram", medium: "social" } }];
        state.data = localPreviewData(); render(); setStatus("Local visual preview using sample data.");
      } else {
        setStatus("Enter the private access token to view Darcey's analytics.");
      }
      return;
    }
    setStatus("Loading Darcey's guide performance…");
    try {
      const [summaryResponse, leadsResponse] = await Promise.all([
        fetch("/api/analytics/summary", { headers: headers() }),
        fetch("/api/leads/recent", { headers: headers() }),
      ]);
      const data = await summaryResponse.json();
      if (!summaryResponse.ok || !data.ok) throw new Error(data.error || "Could not load analytics.");
      const leadData = await leadsResponse.json().catch(() => ({ ok: false }));
      state.leads = leadsResponse.ok && leadData.ok ? leadData.leads || [] : [];
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

  async function markLeadContacted(button) {
    if (!token()) return setStatus("Enter the private access token before updating a lead.", true);
    const leadId = button.dataset.markContacted;
    button.disabled = true;
    button.textContent = "Updating…";
    try {
      const response = await fetch("/api/leads/status", { method: "POST", headers: headers(), body: JSON.stringify({ leadId, status: "Contacted" }) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "The lead could not be updated.");
      state.leads = state.leads.map((lead) => lead.id === leadId ? data.lead : lead);
      render();
      setStatus(`${data.lead.name} marked Contacted.`);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Mark Contacted";
      setStatus(error.message, true);
    }
  }

  elements.tokenInput.value = token();
  elements.tokenForm.addEventListener("submit", (event) => { event.preventDefault(); localStorage.setItem(tokenKey, elements.tokenInput.value.trim()); loadDashboard(); });
  elements.clearToken.addEventListener("click", () => { localStorage.removeItem(tokenKey); elements.tokenInput.value = ""; elements.access.classList.remove("authenticated"); setStatus("Saved access token cleared."); });
  elements.rangeSelector.addEventListener("click", (event) => { const button = event.target.closest("button[data-range]"); if (!button) return; state.range = button.dataset.range; elements.rangeSelector.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button)); render(); });
  elements.recentLeads.addEventListener("click", (event) => { const button = event.target.closest("button[data-mark-contacted]"); if (button) markLeadContacted(button); });
  elements.refresh.addEventListener("click", loadDashboard); elements.preview.addEventListener("click", previewReport); elements.sendTest.addEventListener("click", sendTestReport);
  loadDashboard();
})();
