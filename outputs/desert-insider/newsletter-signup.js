const DISMISSED_UNTIL_KEY = "mdg_updates_dismissed_until";
const SUBSCRIBED_KEY = "mdg_updates_subscribed";
const SESSION_SHOWN_KEY = "mdg_updates_popup_shown";
const SESSION_PAGES_KEY = "mdg_updates_pages";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
let popupOpen = false;

function track(eventName, formLocation = "") {
  document.dispatchEvent(new CustomEvent("mdg:analytics", {
    detail: { eventName, details: { category: "My Desert Guide Updates", formLocation } },
  }));
}

function storageGet(storage, key) {
  try { return storage.getItem(key); } catch { return null; }
}

function storageSet(storage, key, value) {
  try { storage.setItem(key, value); } catch {}
}

function isSubscribed() {
  return storageGet(localStorage, SUBSCRIBED_KEY) === "true";
}

function formMarkup(location) {
  return `
    <form class="newsletter-form" data-newsletter-form data-form-location="${location}" novalidate>
      <div class="newsletter-fields">
        <label><span>First Name</span><input name="firstName" type="text" autocomplete="given-name" maxlength="80" required></label>
        <label><span>Email Address</span><input name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" required></label>
      </div>
      <label class="newsletter-honeypot" aria-hidden="true">Company<input name="company" type="text" tabindex="-1" autocomplete="off"></label>
      <button class="newsletter-submit" type="submit">Send Me the Monthly Update</button>
      <p class="newsletter-privacy">One email a month. No spam. Unsubscribe anytime.</p>
      <p class="newsletter-status" data-newsletter-status role="status" aria-live="polite"></p>
    </form>
    <div class="newsletter-success" data-newsletter-success hidden tabindex="-1">
      <h3>You're on the list 🌴</h3>
      <p>Thanks, <span data-newsletter-name>friend</span>. Darcey will send you one short update each month with what's new in My Desert Guide.</p>
    </div>`;
}

function footerSignup() {
  const footer = document.querySelector(".home-footer, .site-footer, .ask-footer");
  if (!footer || footer.querySelector("[data-newsletter-footer]")) return;
  const section = document.createElement("section");
  section.className = "newsletter-footer";
  section.dataset.newsletterFooter = "true";
  section.setAttribute("aria-labelledby", "newsletter-footer-title");
  section.innerHTML = `
    <div class="newsletter-footer-copy">
      <p class="newsletter-eyebrow">My Desert Guide Updates</p>
      <h2 id="newsletter-footer-title">Stay in the Know About the Desert 🌴</h2>
      <p>Get Darcey's latest additions to My Desert Guide once a month.</p>
    </div>
    <div class="newsletter-footer-form">${formMarkup("footer")}</div>`;
  const legal = footer.querySelector(".home-footer-legal, .footer-legal, :scope > p:last-child");
  footer.insertBefore(section, legal || footer.firstChild);
  if (isSubscribed()) showSuccess(section, storageGet(localStorage, "mdg_updates_first_name") || "friend");
}

function modalElement() {
  let dialog = document.querySelector("[data-newsletter-dialog]");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.className = "newsletter-dialog";
  dialog.dataset.newsletterDialog = "true";
  dialog.setAttribute("aria-labelledby", "newsletter-dialog-title");
  dialog.innerHTML = `
    <div class="newsletter-modal-card">
      <button class="newsletter-close" type="button" data-newsletter-close aria-label="Close signup">×</button>
      <p class="newsletter-eyebrow">A Monthly Note from Darcey</p>
      <h2 id="newsletter-dialog-title">Enjoying My Desert Guide? 🌴</h2>
      <p class="newsletter-modal-copy">Get Darcey's latest additions to My Desert Guide once a month — new restaurants, local finds, homeowner resources, trusted professionals, golf, things to do and other useful Coachella Valley updates.</p>
      ${formMarkup("popup")}
      <p class="newsletter-secondary">Already subscribed? Just keep exploring.</p>
    </div>`;
  document.body.append(dialog);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dismissPopup(dialog);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-newsletter-close]")) dismissPopup(dialog);
  });
  return dialog;
}

function suppressPopup() {
  if (isSubscribed()) return true;
  if (storageGet(sessionStorage, SESSION_SHOWN_KEY) === "true") return true;
  return Number(storageGet(localStorage, DISMISSED_UNTIL_KEY) || 0) > Date.now();
}

function showPopup() {
  if (popupOpen || suppressPopup()) return;
  const dialog = modalElement();
  popupOpen = true;
  storageSet(sessionStorage, SESSION_SHOWN_KEY, "true");
  track("popup_shown", "popup");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  window.setTimeout(() => dialog.querySelector("input")?.focus(), 50);
}

function dismissPopup(dialog) {
  if (!popupOpen && !dialog.open) return;
  popupOpen = false;
  storageSet(localStorage, DISMISSED_UNTIL_KEY, String(Date.now() + THIRTY_DAYS));
  track("popup_dismissed", "popup");
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function showSuccess(container, firstName) {
  container.querySelector("[data-newsletter-form]")?.setAttribute("hidden", "");
  const success = container.querySelector("[data-newsletter-success]");
  if (!success) return;
  success.hidden = false;
  const name = success.querySelector("[data-newsletter-name]");
  if (name) name.textContent = firstName;
  success.focus({ preventScroll: true });
}

async function submitSignup(form) {
  if (form.dataset.submitting === "true") return;
  const status = form.querySelector("[data-newsletter-status]");
  const button = form.querySelector("button[type='submit']");
  const firstName = form.elements.firstName.value.trim();
  const email = form.elements.email.value.trim();

  form.elements.firstName.value = firstName;
  form.elements.email.value = email;
  status.textContent = "";
  status.classList.remove("error");
  if (!firstName || !email || !form.elements.email.validity.valid) {
    status.textContent = "Please enter your first name and a valid email address.";
    status.classList.add("error");
    form.reportValidity();
    return;
  }

  const location = form.dataset.formLocation;
  track("signup_submitted", location);
  if (location === "footer") track("footer_signup_submitted", location);
  form.dataset.submitting = "true";
  button.disabled = true;
  button.textContent = "Sending…";

  try {
    const response = await fetch("/api/newsletter/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ firstName, email, company: form.elements.company.value, formLocation: location }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error("signup failed");

    storageSet(localStorage, SUBSCRIBED_KEY, "true");
    storageSet(localStorage, "mdg_updates_first_name", firstName);
    storageSet(sessionStorage, SESSION_SHOWN_KEY, "true");
    track("signup_success", location);
    if (location === "footer") track("footer_signup_success", location);
    document.querySelectorAll("[data-newsletter-footer], [data-newsletter-dialog]").forEach((container) => showSuccess(container, firstName));
  } catch {
    track("signup_failure", location);
    status.textContent = "We couldn't add you right now. Please try again in a moment.";
    status.classList.add("error");
    form.dataset.submitting = "false";
    button.disabled = false;
    button.textContent = "Send Me the Monthly Update";
  }
}

function recordPageVisit() {
  let pages = [];
  try { pages = JSON.parse(storageGet(sessionStorage, SESSION_PAGES_KEY) || "[]"); } catch {}
  if (!Array.isArray(pages)) pages = [];
  const path = window.location.pathname;
  if (!pages.includes(path)) pages.push(path);
  storageSet(sessionStorage, SESSION_PAGES_KEY, JSON.stringify(pages.slice(-10)));
  return pages.length;
}

function schedulePopup() {
  if (suppressPopup()) return;
  const pageCount = recordPageVisit();
  if (pageCount >= 2) window.setTimeout(showPopup, 1500);
  window.setTimeout(showPopup, 50_000);

  const onScroll = () => {
    const available = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const progress = (window.scrollY + window.innerHeight) / available;
    if (progress >= 0.65) {
      window.removeEventListener("scroll", onScroll);
      showPopup();
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-newsletter-form]");
  if (!form) return;
  event.preventDefault();
  submitSignup(form);
});

footerSignup();
schedulePopup();
