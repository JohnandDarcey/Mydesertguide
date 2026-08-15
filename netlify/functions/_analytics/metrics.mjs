import crypto from "node:crypto";
import {
  CLIENT_ENGAGEMENT_EVENTS,
  EVENT_TOTAL_KEYS,
  GUIDE_CONFIG,
  TRACKED_EVENTS,
} from "./config.mjs";
import { datesEnding, localDateString } from "./time.mjs";
import { getJSON, setJSON } from "./store.mjs";

const MAX_LABEL_LENGTH = 120;

function blankTotals() {
  return {
    guideViews: 0,
    uniqueVisitors: 0,
    returningVisitors: 0,
    sessions: 0,
    categoryViews: 0,
    homepageCategoryClicks: 0,
    curatedFavoriteClicks: 0,
    exploreDesertClicks: 0,
    placeViews: 0,
    clientEngagements: 0,
    darceyWebsiteClicks: 0,
    realEstateContactClicks: 0,
    darceyCallClicks: 0,
    darceyTextClicks: 0,
    darceyEmailClicks: 0,
    mapsClicks: 0,
    businessWebsiteClicks: 0,
    menuClicks: 0,
    favoriteSaves: 0,
    installCtaDisplayed: 0,
    installCtaClicked: 0,
    iosInstructionsOpened: 0,
    nativePromptOpened: 0,
    nativePromptAccepted: 0,
    nativePromptDismissed: 0,
    pwaInstallConfirmed: 0,
    pwaStandaloneLaunches: 0,
  };
}

function blankDay(date) {
  return {
    guideId: GUIDE_CONFIG.guideId,
    profileId: GUIDE_CONFIG.profileId,
    date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totals: blankTotals(),
    eventCounts: {},
    categories: {},
    places: {},
    sources: {},
    devices: {},
    countries: {},
    visitorHashes: [],
    returningVisitorHashes: [],
    sessionKeys: [],
    hours: {},
  };
}

function blankHour(hourStart) {
  return {
    hourStart,
    totals: blankTotals(),
    eventCounts: {},
    categories: {},
    places: {},
    sources: {},
    devices: {},
    countries: {},
    visitorHashes: [],
    returningVisitorHashes: [],
    sessionKeys: [],
  };
}

function blankLifetime() {
  return {
    guideId: GUIDE_CONFIG.guideId,
    profileId: GUIDE_CONFIG.profileId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totals: blankTotals(),
    categories: {},
    places: {},
    uniqueVisitorHashes: [],
  };
}

function sanitize(value, fallback = "") {
  const clean = String(value ?? fallback)
    .replace(/\s+/g, " ")
    .trim();
  return clean.slice(0, MAX_LABEL_LENGTH);
}

function toArraySet(values = []) {
  return new Set(Array.isArray(values) ? values : []);
}

function hashVisitorId(visitorId = "") {
  const salt = process.env.ANALYTICS_HASH_SALT || process.env.SITE_ID || "my-desert-guide";
  return crypto.createHash("sha256").update(`${salt}:${visitorId}`).digest("hex");
}

function looksLikeBot(userAgent = "") {
  return /bot|crawler|spider|preview|facebookexternalhit|slurp|curl|wget|uptime|monitor|lighthouse|pagespeed/i.test(
    userAgent,
  );
}

function classifyDevice(userAgent = "") {
  if (/ipad|tablet/i.test(userAgent)) return "Tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

function classifySource(referrer = "") {
  if (!referrer) return "Direct";

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("google.")) return "Google/Search";
    if (host.includes("bing.")) return "Google/Search";
    if (host.includes("yahoo.")) return "Google/Search";
    if (host.includes("duckduckgo.")) return "Google/Search";
    if (host.includes("facebook.") || host.includes("fb.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("mail.") || host.includes("sendgrid") || host.includes("resend")) return "Email";
    if (host.includes("darceydeetz.com")) return "DarceyDeetz.com";
    return "Other Referral";
  } catch {
    return "Direct";
  }
}

function countryFromContext(context) {
  return (
    context?.geo?.country?.name ||
    context?.geo?.country?.code ||
    context?.geo?.country ||
    "Unknown"
  );
}

function normalizeCategory(payload) {
  const type = sanitize(payload.placeType || payload.type);
  const category = sanitize(payload.category);

  if (type === "Restaurant") return "Food & Drink";
  if (type === "Golf") return "Golf";
  if (type === "Thing To Do") return "Things To Do";
  if (type === "Shopping") return "Shopping";
  if (type === "Service") return category || "Local Services";
  if (category) return category;

  const hash = sanitize(payload.hash).replace(/^#/, "");
  const hashCategories = {
    guide: "Food & Drink",
    "browse-guide": "Browse Guide",
    golf: "Golf",
    "things-to-do": "Things To Do",
    shopping: "Shopping",
    utilities: "Local Utilities",
    professionals: "Darcey's Trusted Professionals",
    map: "Map",
    contact: "Contact",
    "date-night": "Date Night",
    "happy-hour": "Happy Hour",
  };

  return hashCategories[hash] || "Guide";
}

function ensureCounter(collection, key, defaults = {}) {
  if (!key) return null;
  if (!collection[key]) collection[key] = { name: key, views: 0, actions: 0, ...defaults };
  return collection[key];
}

function incrementTotal(totals, key, amount = 1) {
  totals[key] = Number(totals[key] || 0) + amount;
}

function recordHourlyEvent(hour, {
  eventName, payload, visitorHash, sessionKey, isKnownVisitor, source, device, country,
}) {
  const visitorHashes = toArraySet(hour.visitorHashes);
  const returningHashes = toArraySet(hour.returningVisitorHashes);
  const sessionKeys = toArraySet(hour.sessionKeys);

  if (!visitorHashes.has(visitorHash)) {
    visitorHashes.add(visitorHash);
    hour.visitorHashes = Array.from(visitorHashes);
    hour.totals.uniqueVisitors = visitorHashes.size;
    if (isKnownVisitor) {
      returningHashes.add(visitorHash);
      hour.returningVisitorHashes = Array.from(returningHashes);
      hour.totals.returningVisitors = returningHashes.size;
    }
    hour.sources[source] = Number(hour.sources[source] || 0) + 1;
    hour.devices[device] = Number(hour.devices[device] || 0) + 1;
    hour.countries[country] = Number(hour.countries[country] || 0) + 1;
  }

  if (sessionKey && !sessionKeys.has(sessionKey)) {
    sessionKeys.add(sessionKey);
    hour.sessionKeys = Array.from(sessionKeys);
    hour.totals.sessions = sessionKeys.size;
  }

  const totalKey = EVENT_TOTAL_KEYS[eventName];
  if (totalKey) incrementTotal(hour.totals, totalKey);
  hour.eventCounts[eventName] = Number(hour.eventCounts[eventName] || 0) + 1;
  if (CLIENT_ENGAGEMENT_EVENTS.has(eventName)) incrementTotal(hour.totals, "clientEngagements");

  const category = normalizeCategory(payload);
  if (eventName === "category_view" || eventName === "homepage_category_click" || eventName === "place_view") {
    const categoryRecord = ensureCounter(hour.categories, category, { image: sanitize(payload.image) });
    if (categoryRecord) {
      categoryRecord.views += 1;
      if (payload.image && !categoryRecord.image) categoryRecord.image = sanitize(payload.image);
    }
  }

  const placeName = sanitize(payload.placeName);
  if (placeName) {
    const place = ensureCounter(hour.places, placeName, {
      placeId: sanitize(payload.placeId), category, categorySlug: sanitize(payload.categorySlug),
      type: sanitize(payload.placeType || payload.type), image: sanitize(payload.image), rating: sanitize(payload.rating),
    });
    if (eventName === "place_view") place.views += 1;
    if (CLIENT_ENGAGEMENT_EVENTS.has(eventName) || eventName === "business_website_click" || eventName === "menu_click" || eventName === "curated_favorite_click") place.actions += 1;
    place.lastEventAt = new Date().toISOString();
  }
}

async function loadVisitorProfile(visitorHash) {
  return getJSON(`visitors/${visitorHash}`, null);
}

async function saveVisitorProfile(visitorHash, profile) {
  return setJSON(`visitors/${visitorHash}`, profile);
}

export async function getDay(date) {
  return getJSON(`daily/${date}`, () => blankDay(date));
}

async function saveDay(day) {
  day.updatedAt = new Date().toISOString();
  return setJSON(`daily/${day.date}`, day);
}

async function getLifetime() {
  return getJSON("lifetime", blankLifetime);
}

async function saveLifetime(lifetime) {
  lifetime.updatedAt = new Date().toISOString();
  return setJSON("lifetime", lifetime);
}

export async function recordEvent(payload = {}, request, context) {
  const eventName = sanitize(payload.eventName);
  if (!TRACKED_EVENTS.has(eventName)) return { stored: false, reason: "untracked-event" };

  const path = sanitize(payload.path || new URL(request.url).pathname);
  if (path.startsWith("/admin")) return { stored: false, reason: "admin-path" };

  const userAgent = request.headers.get("user-agent") || "";
  if (looksLikeBot(userAgent)) return { stored: false, reason: "bot" };

  const visitorId = sanitize(payload.visitorId);
  if (!visitorId || visitorId.length < 12) return { stored: false, reason: "missing-visitor" };

  const eventTime = new Date();
  const date = localDateString(eventTime);
  const hourStart = `${eventTime.toISOString().slice(0, 13)}:00:00.000Z`;
  const visitorHash = hashVisitorId(visitorId);
  const sessionId = sanitize(payload.sessionId);
  const sessionKey = sessionId ? `${visitorHash}:${sessionId}` : "";
  const day = await getDay(date);
  const lifetime = await getLifetime();
  lifetime.categories ||= {};
  lifetime.places ||= {};
  const visitorProfile = await loadVisitorProfile(visitorHash);
  const isKnownVisitor = Boolean(visitorProfile?.firstSeen);
  day.hours ||= {};
  const hour = day.hours[hourStart] || blankHour(hourStart);

  const visitorHashes = toArraySet(day.visitorHashes);
  const returningHashes = toArraySet(day.returningVisitorHashes);
  const sessionKeys = toArraySet(day.sessionKeys);
  const lifetimeVisitors = toArraySet(lifetime.uniqueVisitorHashes);
  const isNewForDay = !visitorHashes.has(visitorHash);

  if (isNewForDay) {
    visitorHashes.add(visitorHash);
    day.visitorHashes = Array.from(visitorHashes);
    day.totals.uniqueVisitors = visitorHashes.size;

    if (isKnownVisitor && visitorProfile.firstSeen !== date) {
      returningHashes.add(visitorHash);
      day.returningVisitorHashes = Array.from(returningHashes);
      day.totals.returningVisitors = returningHashes.size;
    }

    const source = classifySource(payload.referrer);
    const device = classifyDevice(userAgent);
    const country = countryFromContext(context);
    day.sources[source] = Number(day.sources[source] || 0) + 1;
    day.devices[device] = Number(day.devices[device] || 0) + 1;
    day.countries[country] = Number(day.countries[country] || 0) + 1;
  }

  if (sessionKey && !sessionKeys.has(sessionKey)) {
    sessionKeys.add(sessionKey);
    day.sessionKeys = Array.from(sessionKeys);
    day.totals.sessions = sessionKeys.size;
  }

  if (!lifetimeVisitors.has(visitorHash)) {
    lifetimeVisitors.add(visitorHash);
    lifetime.uniqueVisitorHashes = Array.from(lifetimeVisitors);
    lifetime.totals.uniqueVisitors = lifetimeVisitors.size;
  }

  const totalKey = EVENT_TOTAL_KEYS[eventName];
  if (totalKey) {
    incrementTotal(day.totals, totalKey);
    incrementTotal(lifetime.totals, totalKey);
  }
  day.eventCounts[eventName] = Number(day.eventCounts[eventName] || 0) + 1;

  if (CLIENT_ENGAGEMENT_EVENTS.has(eventName)) {
    incrementTotal(day.totals, "clientEngagements");
    incrementTotal(lifetime.totals, "clientEngagements");
  }

  const category = normalizeCategory(payload);
  if (eventName === "category_view" || eventName === "homepage_category_click" || eventName === "place_view") {
    const categoryRecord = ensureCounter(day.categories, category, {
      image: sanitize(payload.image),
    });
    const lifetimeCategory = ensureCounter(lifetime.categories, category, {
      image: sanitize(payload.image),
    });
    if (categoryRecord) {
      categoryRecord.views += 1;
      if (payload.image && !categoryRecord.image) categoryRecord.image = sanitize(payload.image);
    }
    if (lifetimeCategory) {
      lifetimeCategory.views += 1;
      if (payload.image && !lifetimeCategory.image) lifetimeCategory.image = sanitize(payload.image);
    }
  }

  const placeName = sanitize(payload.placeName);
  if (placeName) {
    const place = ensureCounter(day.places, placeName, {
      placeId: sanitize(payload.placeId),
      category,
      categorySlug: sanitize(payload.categorySlug),
      type: sanitize(payload.placeType || payload.type),
      image: sanitize(payload.image),
      rating: sanitize(payload.rating),
    });
    const lifetimePlace = ensureCounter(lifetime.places, placeName, {
      placeId: sanitize(payload.placeId),
      category,
      categorySlug: sanitize(payload.categorySlug),
      type: sanitize(payload.placeType || payload.type),
      image: sanitize(payload.image),
      rating: sanitize(payload.rating),
    });

    if (place) {
      if (eventName === "place_view") place.views += 1;
      if (CLIENT_ENGAGEMENT_EVENTS.has(eventName) || eventName === "business_website_click" || eventName === "menu_click" || eventName === "curated_favorite_click") {
        place.actions += 1;
      }
      if (!place.image && payload.image) place.image = sanitize(payload.image);
      if (!place.rating && payload.rating) place.rating = sanitize(payload.rating);
      place.lastEventAt = new Date().toISOString();
    }
    if (lifetimePlace) {
      if (eventName === "place_view") lifetimePlace.views += 1;
      if (CLIENT_ENGAGEMENT_EVENTS.has(eventName) || eventName === "business_website_click" || eventName === "menu_click" || eventName === "curated_favorite_click") {
        lifetimePlace.actions += 1;
      }
      if (!lifetimePlace.image && payload.image) lifetimePlace.image = sanitize(payload.image);
      if (!lifetimePlace.rating && payload.rating) lifetimePlace.rating = sanitize(payload.rating);
      lifetimePlace.lastEventAt = new Date().toISOString();
    }
  }

  recordHourlyEvent(hour, {
    eventName,
    payload,
    visitorHash,
    sessionKey,
    isKnownVisitor,
    source: classifySource(payload.referrer),
    device: classifyDevice(userAgent),
    country: countryFromContext(context),
  });
  day.hours[hourStart] = hour;

  await saveVisitorProfile(visitorHash, {
    guideId: GUIDE_CONFIG.guideId,
    profileId: GUIDE_CONFIG.profileId,
    firstSeen: visitorProfile?.firstSeen || date,
    lastSeen: date,
    lastEventAt: new Date().toISOString(),
  });
  await saveDay(day);
  await saveLifetime(lifetime);

  return { stored: true };
}

function mergeRanked(target, source, key = "views") {
  Object.values(source || {}).forEach((item) => {
    if (!item?.name) return;
    if (!target[item.name]) target[item.name] = { ...item, [key]: 0, actions: 0 };
    target[item.name].views = Number(target[item.name].views || 0) + Number(item.views || 0);
    target[item.name].actions = Number(target[item.name].actions || 0) + Number(item.actions || 0);
    target[item.name].image = target[item.name].image || item.image;
    target[item.name].rating = target[item.name].rating || item.rating;
    target[item.name].category = target[item.name].category || item.category;
    target[item.name].type = target[item.name].type || item.type;
  });
}

function topEntries(collection, metric = "views", limit = 5) {
  return Object.values(collection || {})
    .sort((a, b) => Number(b[metric] || 0) - Number(a[metric] || 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function sumNumberMap(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    target[key] = Number(target[key] || 0) + Number(value || 0);
  });
}

export function rollup(days) {
  const visitorHashes = new Set();
  const returningHashes = new Set();
  const sessionKeys = new Set();
  const totals = blankTotals();
  const categories = {};
  const places = {};
  const sources = {};
  const devices = {};
  const countries = {};

  days.forEach((day) => {
    Object.entries(day?.totals || {}).forEach(([key, value]) => {
      if (key === "uniqueVisitors" || key === "returningVisitors" || key === "sessions") return;
      incrementTotal(totals, key, Number(value || 0));
    });
    (day?.visitorHashes || []).forEach((hash) => visitorHashes.add(hash));
    (day?.returningVisitorHashes || []).forEach((hash) => returningHashes.add(hash));
    (day?.sessionKeys || []).forEach((key) => sessionKeys.add(key));
    mergeRanked(categories, day?.categories);
    mergeRanked(places, day?.places);
    sumNumberMap(sources, day?.sources);
    sumNumberMap(devices, day?.devices);
    sumNumberMap(countries, day?.countries);
  });

  totals.uniqueVisitors = visitorHashes.size;
  totals.returningVisitors = returningHashes.size;
  totals.sessions = sessionKeys.size;

  return {
    totals,
    topCategories: topEntries(categories, "views", 8),
    topPlaces: topEntries(places, "views", 8),
    sources,
    devices,
    countries,
  };
}

export async function getDashboardSummary() {
  const now = new Date();
  const todayDate = localDateString(now);
  const last180Dates = datesEnding(todayDate, 180);
  const yesterdayDate = last180Dates.at(-2);
  const last7Dates = last180Dates.slice(-7);
  const previous7Dates = last180Dates.slice(-14, -7);
  const last30Dates = last180Dates.slice(-30);
  const previous30Dates = last180Dates.slice(-60, -30);
  const last90Dates = last180Dates.slice(-90);
  const previous90Dates = last180Dates.slice(0, 90);
  const dayEntries = await Promise.all(last180Dates.map(async (date) => [date, await getDay(date)]));
  const dayMap = Object.fromEntries(dayEntries);
  const lifetime = await getLifetime();

  const currentHourStart = new Date(now);
  currentHourStart.setUTCMinutes(0, 0, 0);
  const hourKey = (hoursAgo) => new Date(currentHourStart.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();
  const current24Keys = Array.from({ length: 24 }, (_, index) => hourKey(23 - index));
  const previous24Keys = Array.from({ length: 24 }, (_, index) => hourKey(47 - index));
  const hourMap = Object.fromEntries(last180Dates.flatMap((date) => Object.entries(dayMap[date]?.hours || {})));
  const trendForHours = (keys) => keys.map((key) => {
    const hour = hourMap[key];
    return {
      date: key,
      guideViews: Number(hour?.totals?.guideViews || 0),
      uniqueVisitors: Number(hour?.totals?.uniqueVisitors || 0),
      placeViews: Number(hour?.totals?.placeViews || 0),
      contactActions: Number(hour?.totals?.darceyCallClicks || 0) + Number(hour?.totals?.darceyTextClicks || 0) + Number(hour?.totals?.darceyEmailClicks || 0),
    };
  });

  const trendFor = (dates) =>
    dates.map((date) => ({
      date,
      guideViews: Number(dayMap[date]?.totals?.guideViews || 0),
      uniqueVisitors: Number(dayMap[date]?.totals?.uniqueVisitors || 0),
      placeViews: Number(dayMap[date]?.totals?.placeViews || 0),
      contactActions:
        Number(dayMap[date]?.totals?.darceyCallClicks || 0) +
        Number(dayMap[date]?.totals?.darceyTextClicks || 0) +
        Number(dayMap[date]?.totals?.darceyEmailClicks || 0),
    }));

  const range = (dates, previousDates) => ({
    current: rollup(dates.map((date) => dayMap[date])),
    previous: rollup(previousDates.map((date) => dayMap[date])),
    trend: trendFor(dates),
  });

  const last90 = rollup(last90Dates.map((date) => dayMap[date]));
  const allTime = {
    ...last90,
    totals: {
      ...last90.totals,
      ...(lifetime.totals || blankTotals()),
      returningVisitors: last90.totals.returningVisitors,
      sessions: Math.max(
        Number(last90.totals.sessions || 0),
        Number(lifetime.totals?.sessions || 0),
      ),
    },
    topCategories: lifetime.categories && Object.keys(lifetime.categories).length
      ? topEntries(lifetime.categories, "views", 8)
      : last90.topCategories,
    topPlaces: lifetime.places && Object.keys(lifetime.places).length
      ? topEntries(lifetime.places, "views", 8)
      : last90.topPlaces,
  };

  return {
    ok: true,
    guideId: GUIDE_CONFIG.guideId,
    profileId: GUIDE_CONFIG.profileId,
    generatedAt: new Date().toISOString(),
    todayDate,
    yesterdayDate,
    today: rollup([dayMap[todayDate]]),
    yesterday: rollup([dayMap[yesterdayDate]]),
    last7: rollup(last7Dates.map((date) => dayMap[date])),
    last30: rollup(last30Dates.map((date) => dayMap[date])),
    lifetime: {
      totals: lifetime.totals || blankTotals(),
      createdAt: lifetime.createdAt,
    },
    trend: trendFor(last7Dates),
    ranges: {
      "24h": {
        current: rollup(current24Keys.map((key) => hourMap[key])),
        previous: rollup(previous24Keys.map((key) => hourMap[key])),
        trend: trendForHours(current24Keys),
      },
      "7": range(last7Dates, previous7Dates),
      "30": range(last30Dates, previous30Dates),
      "90": range(last90Dates, previous90Dates),
      all: {
        current: allTime,
        previous: null,
        trend: trendFor(last90Dates),
      },
    },
  };
}

export async function getReportMetrics(reportDate) {
  const last7Dates = datesEnding(reportDate, 7);
  const dayEntries = await Promise.all(last7Dates.map(async (date) => [date, await getDay(date)]));
  const dayMap = Object.fromEntries(dayEntries);
  const lifetime = await getLifetime();
  const previousDate = datesEnding(reportDate, 2)[0];

  return {
    guideId: GUIDE_CONFIG.guideId,
    profileId: GUIDE_CONFIG.profileId,
    date: reportDate,
    day: rollup([dayMap[reportDate]]),
    previousDay: rollup([dayMap[previousDate]]),
    last7: rollup(last7Dates.map((date) => dayMap[date])),
    lifetime: {
      totals: lifetime.totals || blankTotals(),
      createdAt: lifetime.createdAt,
    },
    trend: last7Dates.map((date) => ({
      date,
      guideViews: Number(dayMap[date]?.totals?.guideViews || 0),
      uniqueVisitors: Number(dayMap[date]?.totals?.uniqueVisitors || 0),
      clientEngagements: Number(dayMap[date]?.totals?.clientEngagements || 0),
    })),
  };
}
