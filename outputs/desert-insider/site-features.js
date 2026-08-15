const FAVORITES_KEY = "mdg_favorites_v1";
const INSTALLED_KEY = "mdg_installed_v1";
const INSTALL_DISMISSED_KEY = "mdg_install_dismissed_session";
const INSTALL_DISMISSED_UNTIL_KEY = "mdg_install_dismissed_until";
let deferredInstallPrompt = null;

function emitAnalytics(eventName, details = {}) {
  document.dispatchEvent(new CustomEvent("mdg:analytics", { detail: { eventName, details } }));
}

function readFavorites() {
  try {
    const value = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    if (Array.isArray(value) && value.length) return new Set(value);
  } catch {}
  try {
    const cookie = document.cookie.split("; ").find((item) => item.startsWith(`${FAVORITES_KEY}=`));
    const value = cookie ? JSON.parse(decodeURIComponent(cookie.split("=").slice(1).join("="))) : [];
    return new Set(Array.isArray(value) ? value : []);
  } catch { return new Set(); }
}

function writeFavorites(favorites) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  } catch {}
  try {
    document.cookie = `${FAVORITES_KEY}=${encodeURIComponent(JSON.stringify([...favorites]))}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {}
}

function updateFavoriteButtons() {
  const favorites = readFavorites();
  document.querySelectorAll("[data-favorite-slug]").forEach((button) => {
    const saved = favorites.has(button.dataset.favoriteSlug);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", saved ? `Remove ${button.dataset.favoriteName} from saved places` : `Save ${button.dataset.favoriteName}`);
    const label = button.querySelector("[data-favorite-label]");
    if (label) label.textContent = saved ? "Saved" : "Save";
  });
}

function favoriteButton(slug, name, extraClass = "") {
  return `<button class="favorite-button ${extraClass}" type="button" data-favorite-slug="${slug}" data-favorite-name="${name.replaceAll('"', '&quot;')}" aria-pressed="false" aria-label="Save ${name.replaceAll('"', '&quot;')}">♡</button>`;
}

function enhanceHomepageRecommendations() {
  if (document.body.dataset.pageKind !== "home") return;

  document.querySelectorAll("[data-guide-place][data-guide-slug]").forEach((card) => {
    if (card.querySelector("[data-place-actions]")) return;
    const slug = card.dataset.guideSlug;
    const name = card.dataset.guidePlace;
    const target = card.querySelector(".listing-body, .featured-content, .category-featured-content") || card;
    const actions = document.createElement("div");
    actions.className = "place-actions-inline";
    actions.dataset.placeActions = "true";
    actions.innerHTML = `${favoriteButton(slug, name)}<a href="/place/${slug}/">View recommendation</a>`;
    if (card.closest(".home-curated")) {
      const recommendationLink = actions.querySelector("a");
      recommendationLink.dataset.analyticsEvent = "curated_favorite_click";
      recommendationLink.dataset.analyticsCategory = card.dataset.guideCategory || "Curated Favorites";
      recommendationLink.dataset.analyticsLabel = name;
    }
    target.append(actions);
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-favorite-slug]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();

  const favorites = readFavorites();
  const slug = button.dataset.favoriteSlug;
  const wasSaved = favorites.has(slug);
  if (wasSaved) favorites.delete(slug);
  else favorites.add(slug);
  writeFavorites(favorites);
  updateFavoriteButtons();

  if (!wasSaved) {
    emitAnalytics("favorite_save", {
      placeId: `place-${slug}`,
      placeName: button.dataset.favoriteName,
      category: document.body.dataset.category || "Saved Places",
    });
  }

  if (document.body.dataset.pageKind === "saved") renderSavedPlaces();
});

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function markInstalled() {
  try { localStorage.setItem(INSTALLED_KEY, "true"); } catch {}
  document.querySelectorAll("[data-install-card], [data-install-dialog]").forEach((element) => element.hidden = true);
}

function shouldHideInstall() {
  let remembered = false;
  let dismissed = false;
  let dismissedUntil = 0;
  try {
    remembered = localStorage.getItem(INSTALLED_KEY) === "true";
    dismissed = sessionStorage.getItem(INSTALL_DISMISSED_KEY) === "true";
    dismissedUntil = Number(localStorage.getItem(INSTALL_DISMISSED_UNTIL_KEY) || 0);
  } catch {}
  return isStandalone() || remembered || dismissed || dismissedUntil > Date.now();
}

function rememberInstallDismissal() {
  try {
    sessionStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    localStorage.setItem(INSTALL_DISMISSED_UNTIL_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  } catch {}
}

function showInstallCards() {
  if (shouldHideInstall()) return;
  document.querySelectorAll("[data-install-card]").forEach((card) => {
    if (!card.hidden) return;
    card.hidden = false;
    emitAnalytics("install_cta_displayed", { category: "Guide App", installMethod: isIOS() ? "ios-instructions" : "native-prompt" });
  });
}

function installDialog() {
  let dialog = document.querySelector("[data-install-dialog]");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.className = "install-dialog";
  dialog.dataset.installDialog = "true";
  dialog.innerHTML = `
    <div class="install-dialog-inner">
      <p class="eyebrow">Take Darcey's Guide With You</p>
      <h2>Add Darcey's Guide to your iPhone</h2>
      <ol>
        <li>Tap the <strong>Share</strong> icon in Safari.</li>
        <li>Choose <strong>Add to Home Screen</strong>.</li>
        <li>Tap <strong>Add</strong>.</li>
      </ol>
      <p>Darcey's Guide will appear on your Home Screen for quick access whenever you need it.</p>
      <div class="install-dialog-actions">
        <button class="button dark" type="button" data-close-install>Got It</button>
        <button class="button" type="button" data-dismiss-install>Not Now</button>
      </div>
    </div>`;
  document.body.append(dialog);
  return dialog;
}

document.addEventListener("click", async (event) => {
  const installButton = event.target.closest("[data-install-button]");
  if (installButton) {
    emitAnalytics("install_cta_clicked", { category: "Guide App", installMethod: isIOS() ? "ios-instructions" : "native-prompt" });
    if (isIOS()) {
      const dialog = installDialog();
      emitAnalytics("ios_instructions_opened", { category: "Guide App" });
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      return;
    }
    if (!deferredInstallPrompt) return;
    emitAnalytics("native_prompt_opened", { category: "Guide App" });
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    emitAnalytics(choice.outcome === "accepted" ? "native_prompt_accepted" : "native_prompt_dismissed", { category: "Guide App" });
    deferredInstallPrompt = null;
    if (choice.outcome === "accepted") markInstalled();
    else {
      rememberInstallDismissal();
      document.querySelectorAll("[data-install-card]").forEach((card) => card.hidden = true);
    }
  }

  if (event.target.closest("[data-close-install]")) {
    const dialog = event.target.closest("dialog");
    if (dialog?.close) dialog.close();
    else dialog?.removeAttribute("open");
  }

  if (event.target.closest("[data-dismiss-install]")) {
    rememberInstallDismissal();
    const dialog = event.target.closest("dialog");
    if (dialog?.close) dialog.close();
    else dialog?.removeAttribute("open");
    document.querySelectorAll("[data-install-card]").forEach((card) => card.hidden = true);
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  showInstallCards();
});

window.addEventListener("appinstalled", markInstalled);

function mobileNavigation() {
  if (document.body.dataset.pageKind === "home" || document.querySelector(".mobile-bottom-nav")) return;
  document.body.classList.add("has-mobile-nav");
  document.body.insertAdjacentHTML("beforeend", `
    <nav class="mobile-bottom-nav" aria-label="Guide shortcuts">
      <a href="/"><span>⌂</span>Home</a>
      <a href="/#browse-guide"><span>⌕</span>Explore</a>
      <a href="/saved/"><span>♡</span>Saved</a>
      <a href="/ask-darcey/"><span>◇</span>Ask Darcey</a>
    </nav>`);
}

function savedCard(place) {
  const tags = (place.tags || []).slice(0, 3).map((tag) => `<span>${tag}</span>`).join("");
  return `
    <article class="recommendation-card" data-saved-card="${place.slug}">
      <a class="card-link" href="${place.url}" aria-label="Open ${place.name}"></a>
      <div class="card-media"><img src="${place.image}" alt="${place.imageAlt}" loading="lazy">${favoriteButton(place.slug, place.name)}</div>
      <div class="card-body">
        <div class="card-topline">${place.city} · ${place.category}</div>
        <h2>${place.name}</h2>
        <p>${place.description}</p>
        <div class="tag-list">${tags}</div>
      </div>
    </article>`;
}

async function renderSavedPlaces() {
  const grid = document.querySelector("[data-saved-grid]");
  if (!grid) return;
  const favorites = readFavorites();
  try {
    const response = await fetch("/data/places.json?v=20260814-guide-architecture-v2");
    const places = await response.json();
    const saved = places.filter((place) => favorites.has(place.slug));
    grid.innerHTML = saved.length
      ? saved.map(savedCard).join("")
      : `<div class="empty-state">Your saved places will appear here. Tap the heart on any recommendation to begin your Desert List.</div>`;
    updateFavoriteButtons();
  } catch {
    grid.innerHTML = `<div class="empty-state">Your saved places could not be loaded right now. Please try again.</div>`;
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  try { await navigator.serviceWorker.register("/sw.js", { scope: "/" }); } catch {}
}

enhanceHomepageRecommendations();
updateFavoriteButtons();
mobileNavigation();
renderSavedPlaces();
registerServiceWorker();
if (isIOS()) showInstallCards();
if (isStandalone()) markInstalled();
