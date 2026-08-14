(() => {
  const measurementId = window.DARCEY_GA_MEASUREMENT_ID;

  if (measurementId && /^G-[A-Z0-9]+$/.test(measurementId)) {
    const gtagScript = document.createElement("script");
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(gtagScript);

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };

    window.gtag("js", new Date());
    window.gtag("config", measurementId);
  }

  if (window.location.pathname.startsWith("/admin")) return;

  const endpoint = "/api/analytics/collect";
  const visitorKey = "mdg_visitor_id";
  const sessionKey = "mdg_session_id";
  const placeViewsSent = new Set();
  let observer = null;
  let bindTimer = null;

  function randomId(prefix) {
    if (!window.crypto?.getRandomValues) {
      return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    }

    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return `${prefix}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }

  function storageId(storage, key, prefix) {
    try {
      let value = storage.getItem(key);
      if (!value) {
        value = randomId(prefix);
        storage.setItem(key, value);
      }
      return value;
    } catch {
      return randomId(prefix);
    }
  }

  const visitorId = storageId(window.localStorage, visitorKey, "visitor");
  const sessionId = storageId(window.sessionStorage, sessionKey, "session");

  function sectionFromHash(hash = window.location.hash) {
    const id = hash.replace(/^#/, "");
    const sections = {
      "browse-guide": "Browse Guide",
      guide: "Food & Drink",
      "date-night": "Date Night",
      "happy-hour": "Happy Hour",
      golf: "Golf",
      "things-to-do": "Things To Do",
      shopping: "Shopping",
      utilities: "Local Utilities",
      professionals: "Darcey's Trusted Professionals",
      map: "Map",
      contact: "Contact",
    };
    return sections[id] || "Guide";
  }

  function cardPayload(element) {
    const card = element?.closest?.("[data-guide-place]");
    if (card) {
      return {
        placeName: card.dataset.guidePlace,
        category: card.dataset.guideCategory,
        placeType: card.dataset.guideType,
        image: card.dataset.guideImage,
        rating: card.dataset.guideRating,
      };
    }

    const mapDetail = document.querySelector("#map-detail");
    if (mapDetail?.contains(element)) {
      return {
        placeName: mapDetail.querySelector("h3")?.textContent?.trim() || "",
        category: "Map",
        placeType: "Map",
      };
    }

    return {};
  }

  function send(eventName, details = {}) {
    const payload = {
      eventName,
      visitorId,
      sessionId,
      url: window.location.href,
      path: window.location.pathname,
      hash: window.location.hash,
      title: document.title,
      referrer: document.referrer,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...details,
    };

    if (window.gtag) {
      window.gtag("event", eventName, {
        event_category: "my_desert_guide",
        event_label: payload.placeName || payload.category || undefined,
      });
    }

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }

  function classifyLink(anchor) {
    const href = anchor.getAttribute("href") || "";
    const text = anchor.textContent.toLowerCase();
    const payload = cardPayload(anchor);

    if (href.startsWith("tel:") && href.replace(/\D/g, "").includes("17608081449")) {
      return ["darcey_call_click", payload];
    }

    if (href.startsWith("sms:")) return ["darcey_text_click", payload];

    if (href.startsWith("mailto:")) {
      const email = href.toLowerCase();
      if (email.includes("darcey@darceydeetz.com")) return ["darcey_email_click", payload];
      if (email.includes("john@darceydeetz.com")) {
        return ["darcey_email_click", { ...payload, category: payload.category || "Contact" }];
      }
      return ["business_website_click", payload];
    }

    let url;
    try {
      url = new URL(anchor.href);
    } catch {
      return null;
    }

    const host = url.hostname.replace(/^www\./, "");
    if (host.endsWith("darceydeetz.com")) return ["darcey_website_click", payload];
    if (text.includes("menu")) return ["menu_click", payload];
    if (host.includes("maps.google.") || url.href.includes("google.com/maps")) {
      return ["maps_click", payload];
    }
    if (url.origin !== window.location.origin) return ["business_website_click", payload];
    return null;
  }

  function bindPlaceObserver() {
    if (observer) observer.disconnect();
    if (!("IntersectionObserver" in window)) return;

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const payload = cardPayload(entry.target);
          if (!payload.placeName) return;

          const key = `${payload.placeName}|${payload.category}|${payload.placeType}`;
          if (placeViewsSent.has(key)) {
            observer.unobserve(entry.target);
            return;
          }

          placeViewsSent.add(key);
          send("place_view", payload);
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -20% 0px", threshold: 0.35 },
    );

    document.querySelectorAll("[data-guide-place]").forEach((card) => observer.observe(card));
  }

  function scheduleBinding() {
    window.clearTimeout(bindTimer);
    bindTimer = window.setTimeout(bindPlaceObserver, 250);
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest("a[href]");
    if (anchor) {
      const classified = classifyLink(anchor);
      if (classified) {
        const [eventName, payload] = classified;
        send(eventName, {
          ...payload,
          actionUrl: anchor.href,
          actionText: anchor.textContent.trim().slice(0, 80),
        });
      }
    }

    const filter = event.target.closest(".filter-chip");
    if (filter?.dataset.filter) {
      send("category_view", { category: filter.dataset.filter });
    }

    const categoryTile = event.target.closest(".category-tile");
    if (categoryTile) {
      send("category_view", { category: categoryTile.textContent.trim() });
    }

    const mapButton = event.target.closest(".map-place-button");
    if (mapButton?.dataset.mapPlace) {
      send("place_view", {
        placeName: mapButton.dataset.mapPlace,
        category: "Map",
        placeType: "Map",
      });
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("#mobile-filter-select")) {
      send("category_view", { category: event.target.value });
    }
  });

  window.addEventListener("hashchange", () => {
    send("category_view", { category: sectionFromHash() });
    scheduleBinding();
  });

  const mutationObserver = new MutationObserver(scheduleBinding);
  mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("load", () => {
    send("guide_view", { category: sectionFromHash() });
    scheduleBinding();
  });
})();
