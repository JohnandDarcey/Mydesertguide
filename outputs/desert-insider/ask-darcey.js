const form = document.querySelector("#lead-form");
form.elements.startedAt.value = String(Date.now());
const status = document.querySelector("#lead-form-status");
const buyerGuideOption = document.querySelector("#buyer-guide-option");
let started = false;

function track(eventName, details = {}) {
  document.dispatchEvent(new CustomEvent("mdg:analytics", { detail: { eventName, details: { category: "Real Estate", ...details } } }));
}

function sameSiteReferrerPath() {
  try {
    const referrer = new URL(document.referrer);
    return referrer.origin === window.location.origin ? `${referrer.pathname}${referrer.search}${referrer.hash}` : "";
  } catch {
    return "";
  }
}

function sourcePage() {
  const querySource = new URLSearchParams(window.location.search).get("from");
  if (querySource?.startsWith("/")) return querySource.slice(0, 180);
  try {
    const stored = JSON.parse(sessionStorage.getItem("mdg_real_estate_source_page") || "null");
    if (stored?.path?.startsWith("/")) return String(stored.path).slice(0, 180);
  } catch {
    // A same-site referrer remains available when session storage is blocked.
  }
  return sameSiteReferrerPath() || "/ask-darcey/";
}

track("ask_darcey_page_view", { sourcePage: sourcePage() });

form.addEventListener("input", (event) => {
  if (!started) {
    started = true;
    track("lead_form_started", { sourcePage: sourcePage() });
  }
  if (event.target.name === "interest") buyerGuideOption.hidden = event.target.value !== "buying";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.classList.remove("error");
  if (!form.reportValidity()) {
    track("lead_form_error", { errorType: "validation" });
    return;
  }

  const data = new FormData(form);
  const submitButton = form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Sending…";
  status.textContent = "Saving your inquiry securely…";
  const leadContext = window.MDG_LEAD_CONTEXT || {};
  const buyerGuideRequested = data.get("buyerGuideRequested") === "on" && data.get("interest") === "buying";

  try {
    const response = await fetch("/api/leads/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        startedAt: Number(data.get("startedAt")), company: data.get("company"), interest: data.get("interest"),
        name: data.get("name"), email: String(data.get("email") || "").trim(), phone: String(data.get("phone") || "").trim(),
        message: data.get("message"), consent: data.get("consent") === "on", buyerGuideRequested, sourcePage: sourcePage(),
        visitorId: leadContext.visitorId || "", sessionId: leadContext.sessionId || "", attribution: leadContext.attribution?.() || {},
        path: window.location.pathname, referrer: document.referrer,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || "Your inquiry could not be sent.");
    form.hidden = true;
    const success = document.querySelector("#lead-success");
    const successDetail = document.querySelector("#lead-success-detail");
    const guideDownload = document.querySelector("#buyer-guide-download");
    if (buyerGuideRequested) {
      guideDownload.hidden = false;
      successDetail.textContent = result.resourceStatus === "sent"
        ? "Your inquiry is saved, and the buyer guide is on its way to your email. You can also open it below."
        : "Your inquiry is saved. You can open your buyer guide below.";
    }
    success.hidden = false;
    success.focus();
  } catch (error) {
    track("lead_form_error", { errorType: "submission" });
    status.textContent = error.message;
    status.classList.add("error");
    submitButton.disabled = false;
    submitButton.textContent = "Send to Darcey";
  }
});
