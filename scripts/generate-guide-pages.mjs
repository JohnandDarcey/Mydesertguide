import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPlaces, categoryDefinitions, guideProfile, guideRecommendations, masterPlaces, slugify, utilityDirectory } from "../outputs/desert-insider/guide-model.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../outputs/desert-insider");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function pageHead({ title, description, canonical, image, type = "website", noindex = false, schema }) {
  const absoluteImage = image.startsWith("http") ? image : `${guideProfile.siteUrl}${image}`;
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    ${noindex ? '<meta name="robots" content="noindex,follow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${absoluteImage}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:type" content="${type}">
    <meta property="og:site_name" content="My Desert Guide">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${absoluteImage}">
    <meta name="theme-color" content="#f7f5f0">
    <meta name="application-name" content="Darcey's Guide">
    <meta name="apple-mobile-web-app-title" content="Darcey's Guide">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png">
    <link rel="manifest" href="/manifest.webmanifest">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400&family=Cormorant+Garamond:ital,wght@1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/directory.css?v=20260814-heading-scale-72">
    ${schema ? `<script type="application/ld+json">${jsonLd(schema)}</script>` : ""}`;
}

function header() {
  return `<header class="site-header">
    <a class="site-brand" href="/">My Desert Guide <span>♥</span></a>
    <nav class="site-nav" aria-label="Guide navigation">
      <a href="/#browse-guide">Explore</a>
      <a href="/saved/">Saved ♡</a>
      <a class="site-contact" href="/#contact">Darcey</a>
    </nav>
  </header>`;
}

function footer() {
  return `<footer class="site-footer" id="darcey" aria-label="Coachella Valley real estate with Darcey">
    <div class="footer-real-estate-copy">
      <p class="eyebrow">Love Where You Live</p>
      <h2>Thinking about making the desert home?</h2>
      <p>Whether you're buying, selling, or simply exploring what's possible, Darcey can help you navigate Coachella Valley real estate with the same local knowledge behind this guide.</p>
    </div>
    <div class="footer-real-estate-actions">
      <a class="button footer-homes-button" href="${guideProfile.homeSearchUrl}" target="_blank" rel="noreferrer">Explore Desert Homes</a>
      <a class="footer-talk-link" href="/#contact" data-analytics-event="real_estate_contact_click" data-analytics-label="Talk With Darcey">Talk With Darcey <span aria-hidden="true">→</span></a>
    </div>
    <p class="footer-legal">${guideProfile.realtorName} · ${guideProfile.realtorDre} · ${guideProfile.brokerage} · ${guideProfile.brokerageDre}</p>
  </footer>`;
}

function scripts() {
  return `<script src="/analytics-config.js?v=20260814-guide-architecture"></script>
    <script src="/analytics.js?v=20260814-utility-concierge"></script>
    <script type="module" src="/directory.js?v=20260814-category-discovery"></script>
    <script type="module" src="/site-features.js?v=20260814-hybrid-homepage"></script>`;
}

function favoriteButton(place, className = "") {
  return `<button class="favorite-button ${className}" type="button" data-favorite-slug="${place.slug}" data-favorite-name="${escapeHtml(place.name)}" aria-pressed="false" aria-label="Save ${escapeHtml(place.name)}">♡${className ? '<span data-favorite-label>Save</span>' : ""}</button>`;
}

function tags(place, limit = 3) {
  return place.tags.slice(0, limit).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
}

function card(place, { editorialLabel = "", analyticsEvent = "", showTags = true } = {}) {
  const search = [place.name, place.city, place.category, place.subcategory, place.description, place.darceysTake, ...(place.aliases || []), ...(place.serviceAreas || []), ...place.tags].join(" ").toLowerCase();
  const topLabel = editorialLabel || place.hikingPickLabel || place.coffeePickLabel || place.familiarFavoriteLabel;
  return `<article class="recommendation-card" data-recommendation-card data-guide-place="${escapeHtml(place.name)}" data-guide-slug="${place.slug}" data-guide-category="${escapeHtml(place.category)}" data-guide-type="${escapeHtml(place.schemaType)}" data-place-id="${place.placeId}" data-city="${escapeHtml(place.city)}" data-tags="${escapeHtml(place.tags.join("|"))}" data-experiences="${escapeHtml((place.experienceTypes || []).join("|"))}" data-search="${escapeHtml(search)}">
    <a class="card-link" href="${place.url}" aria-label="Open ${escapeHtml(place.name)}"${analyticsEvent ? ` data-analytics-event="${escapeHtml(analyticsEvent)}" data-analytics-label="${escapeHtml(place.name)}"` : ""}></a>
    <div class="card-media"><img src="${place.image}" alt="${escapeHtml(place.imageAlt)}" loading="lazy" decoding="async">${favoriteButton(place)}</div>
    <div class="card-body">
      <div class="card-topline">${topLabel ? `<span>${escapeHtml(topLabel)}</span><span>${escapeHtml(place.city)}</span>` : `${escapeHtml(place.city)} · ${escapeHtml(place.subcategory || place.category)}`}</div>
      <h2>${escapeHtml(place.name)}</h2>
      <p>${escapeHtml(place.cardDescription || place.description)}</p>
      ${place.isFavorite ? '<div class="favorite-mark">♡ Darcey&#39;s Favorite</div>' : ""}
      ${showTags ? `<div class="tag-list">${tags(place)}</div>` : ""}
    </div>
  </article>`;
}

function familiarFavoriteCard(place, analyticsEvent = "") {
  const search = [place.name, place.city, place.category, place.subcategory, place.description, ...(place.serviceAreas || []), ...place.tags].join(" ").toLowerCase();
  return `<article class="recommendation-card familiar-favorite-card" data-recommendation-card data-guide-place="${escapeHtml(place.name)}" data-guide-slug="${place.slug}" data-guide-category="${escapeHtml(place.category)}" data-guide-type="${escapeHtml(place.schemaType)}" data-place-id="${place.placeId}" data-city="${escapeHtml(place.city)}" data-tags="${escapeHtml(place.tags.join("|"))}" data-experiences="${escapeHtml((place.experienceTypes || []).join("|"))}" data-search="${escapeHtml(search)}">
    <div class="card-media"><a href="${place.url}" aria-label="Open ${escapeHtml(place.name)}"${analyticsEvent ? ` data-analytics-event="${escapeHtml(analyticsEvent)}" data-analytics-label="${escapeHtml(place.name)}"` : ""}><img src="${place.image}" alt="${escapeHtml(place.imageAlt)}" loading="lazy" decoding="async"></a>${favoriteButton(place)}</div>
    <div class="card-body"><div class="card-topline"><span>${escapeHtml(place.familiarFavoriteLabel)}</span><span>${escapeHtml(place.city)}</span></div><h2><a href="${place.url}"${analyticsEvent ? ` data-analytics-event="${escapeHtml(analyticsEvent)}" data-analytics-label="${escapeHtml(place.name)}"` : ""}>${escapeHtml(place.name)}</a></h2><p>${escapeHtml(place.cardDescription || place.description)}</p><div class="tag-list">${tags(place)}</div><a class="button dark familiar-action" href="${escapeHtml(place.website)}" target="_blank" rel="noreferrer" data-analytics-event="${escapeHtml(place.websiteAnalyticsEvent || "recommendation_external_click")}" data-analytics-label="${escapeHtml(`${place.websiteLabel} - ${place.name}`)}">${escapeHtml(place.websiteLabel || "Website")}</a></div>
  </article>`;
}

const categoryLandingConfigs = {
  "food-drink": {
    discoveryTiles: [
      ["Dinner", "Dinner", "spencers"],
      ["Happy Hour", "Happy Hour", "las-casuelas-terraza"],
      ["Brunch", "Brunch", "cheekys"],
      ["Coffee", "Coffee", "koffi"],
      ["Darcey's Favorites", "Darcey's Favorites", "lulu"],
      ["Patio Dining", "Patio Dining", "mitchs"],
    ],
    picks: [
      ["lulu", "Palm Springs Staple"],
      ["spencers", "Dinner Under the Palms"],
      ["cheekys", "Brunch Favorite"],
      ["las-casuelas-terraza", "Margaritas + Patio"],
      ["cactus-jacks", "Desert Institution"],
      ["mitchs", "El Paseo Night Out"],
    ],
    picksCopy: "Some of my favorite places to eat, drink and enjoy the desert.",
    exploreEyebrow: "Explore Food & Drink",
    exploreTitle: "Find the right table.",
    primaryFilters: ["All", "Dinner", "Happy Hour", "Brunch", "Coffee", "Casual", "Darcey's Favorites"],
    secondaryFilters: ["Date Night", "Patio", "Live Music", "Hidden Gem", "Fine Dining", "Italian", "Mexican", "American"],
    teaser: {
      eyebrow: "Coffee in the Desert",
      title: "A great cup, wherever the day takes you.",
      copy: "From Palm Springs classics to specialty roasters, discover some of our favorite places for a great cup.",
      slugs: ["koffi", "ernest-coffee", "varraco-coffee-roasters"],
      filter: "Coffee",
      action: "Explore Coffee",
      analyticsEvent: "explore_coffee_clicked",
    },
  },
  "things-to-do": {
    discoveryTiles: [
      ["Hiking & Outdoors", "Outdoors", "indian-canyons"],
      ["Arts & Culture", "Arts & Culture", "palm-springs-art-museum"],
      ["Desert Experiences", "Desert Experiences", "the-living-desert"],
      ["Entertainment", "Entertainment", "coachella-valley-firebirds"],
      ["Markets & Local Life", "Markets & Local Life", "villagefest"],
      ["Darcey's Favorites", "Darcey's Favorites", "sunnylands"],
    ],
    picks: [
      ["villagefest", "Thursday Night Street Fair"],
      ["indian-canyons", "Palm Oasis"],
      ["the-living-desert", "Zoo & Gardens"],
      ["palm-springs-art-museum", "Arts & Culture"],
      ["coachella-valley-firebirds", "Sports & Entertainment"],
      ["sunnylands", "Gardens & Architecture"],
    ],
    picksCopy: "Some of my favorite ways to experience the desert.",
    exploreEyebrow: "Explore More",
    exploreTitle: "Make a desert day your own.",
    primaryFilters: ["All", "Outdoors", "Arts & Culture", "Entertainment", "Family", "Darcey's Favorites"],
    secondaryFilters: [],
    teaser: {
      eyebrow: "Hike the Desert",
      title: "Oases, waterfalls and mountain views.",
      copy: "From palm oases and waterfalls to mountain views, discover some of our favorite ways to explore the desert on foot.",
      slugs: ["indian-canyons", "tahquitz-canyon", "bump-and-grind-trail"],
      filter: "Outdoors",
      action: "Explore Hiking",
      analyticsEvent: "explore_hiking_clicked",
    },
  },
  shopping: {
    discoveryEyebrow: "Find your kind of shopping",
    discoveryTitle: "What are you shopping for?",
    discoveryAnalyticsEvent: "shopping_experience_tile_selected",
    discoveryTiles: [
      ["Fashion", "Fashion", "frenchys-palm-springs"],
      ["Gifts + Palm Springs", "Gifts", "destination-psp"],
      ["Home + Design", "Home + Design", "the-shops-at-thirteen-forty-five"],
      ["Art + Vintage", "Art + Vintage", "the-shag-store"],
      ["Golf + Sport", "Golf + Sport", "pga-tour-superstore"],
      ["Luxury", "Luxury", "saks-fifth-avenue"],
    ],
    picksTitle: "Darcey's Desert Shopping Picks",
    picksAnalyticsEvent: "shopping_pick_clicked",
    picks: [
      ["the-shag-store", "Iconic Palm Springs"],
      ["pga-tour-superstore", "For the Golfer"],
      ["destination-psp", "Take Palm Springs Home"],
      ["the-shops-at-thirteen-forty-five", "Design Lover's Pick"],
      ["brandini-toffee", "Sweet Desert Favorite"],
      ["el-paseo-shopping-district", "The Desert's Shopping Street"],
    ],
    picksCopy: "A few favorite places to shop, browse and bring a little desert style home.",
    exploreEyebrow: "Explore Shopping",
    exploreTitle: "Great places to shop around the desert.",
    primaryFilters: ["All", "Fashion", "Gifts", "Home + Design", "Art + Vintage", "Golf + Sport", "Luxury", "Familiar Favorites"],
    secondaryFilters: [],
  },
};

function placeBySlug(category, slug) {
  const place = category.places.find((candidate) => candidate.slug === slug);
  if (!place) throw new Error(`Missing ${category.slug} recommendation: ${slug}`);
  return place;
}

function filteredUrl(category, experience) {
  return `/${category.slug}/?experience=${encodeURIComponent(experience)}#explore-${category.slug}`;
}

function experienceDiscovery(category, config) {
  return `<section class="experience-discovery" aria-labelledby="${category.slug}-mood-title">
    <div class="editorial-heading"><p class="eyebrow">${escapeHtml(config.discoveryEyebrow || "Start with the feeling")}</p><h2 id="${category.slug}-mood-title">${escapeHtml(config.discoveryTitle || "What are you in the mood for?")}</h2></div>
    <div class="experience-tile-grid">${config.discoveryTiles.map(([label, filter, slug]) => {
      const place = placeBySlug(category, slug);
      return `<a class="experience-tile" href="${filteredUrl(category, filter)}" data-analytics-event="${escapeHtml(config.discoveryAnalyticsEvent || "experience_tile_clicked")}" data-analytics-label="${escapeHtml(`${category.label} - ${label}`)}"><img src="${place.image}" alt="${escapeHtml(place.imageAlt)}" loading="lazy" decoding="async"><span>${escapeHtml(label)}</span></a>`;
    }).join("")}</div>
  </section>`;
}

function curatedPicks(category, config) {
  return `<section class="curated-picks" aria-labelledby="${category.slug}-picks-title">
    <div class="editorial-heading"><p class="eyebrow">Curated for You</p><h2 id="${category.slug}-picks-title">${config.picksTitle ? escapeHtml(config.picksTitle) : "Darcey's Desert Picks"}</h2><p>${escapeHtml(config.picksCopy)}</p></div>
    <div class="recommendation-grid curated-picks-grid">${config.picks.map(([slug, label]) => card(placeBySlug(category, slug), { editorialLabel: label, analyticsEvent: config.picksAnalyticsEvent || "darceys_desert_pick_clicked", showTags: false })).join("")}</div>
  </section>`;
}

function filterButton(label, kind = "experience") {
  return `<button class="tag-filter${label === "All" ? " active" : ""}" type="button" data-filter-button data-filter-kind="${kind}" data-filter-value="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
}

function browseCollection(category, config) {
  const cities = [...new Set(category.places.map((place) => place.city).filter(Boolean))].sort();
  return `<section class="explore-collection" id="explore-${category.slug}" aria-labelledby="explore-${category.slug}-title">
    <div class="editorial-heading"><p class="eyebrow">${escapeHtml(config.exploreEyebrow)}</p><h2 id="explore-${category.slug}-title">${escapeHtml(config.exploreTitle)}</h2></div>
    <div class="browse-controls" aria-label="Filter ${escapeHtml(category.label)} recommendations">
      <div class="discovery-tools"><label class="search-field"><span aria-hidden="true">⌕</span><input type="search" data-category-search placeholder="Search ${escapeHtml(category.label.toLowerCase())}, places or interests…" aria-label="Search recommendations"></label><label class="location-field"><span>Location</span><select data-location-filter><option value="All">All Desert</option>${cities.map((city) => `<option>${escapeHtml(city)}</option>`).join("")}</select></label></div>
      <div class="primary-filters" aria-label="Primary experience filters">${config.primaryFilters.map((label) => filterButton(label)).join("")}</div>
      ${config.secondaryFilters.length ? `<details class="more-filters"><summary>More Filters</summary><div class="secondary-filters">${config.secondaryFilters.map((label) => filterButton(label, "tag")).join("")}</div></details>` : ""}
      <p class="results-summary" data-results-summary></p>
    </div>
    <div data-category-grid><div class="recommendation-grid" data-card-section>${category.places.map((place) => place.familiarFavoriteLabel ? familiarFavoriteCard(place, "recommendation_clicked") : card(place, { analyticsEvent: "recommendation_clicked", showTags: false })).join("")}</div></div>
    <div class="empty-state" data-empty-results hidden>No recommendations match those filters yet. Try another location or interest.</div>
  </section>`;
}

function specializedTeaser(category, config) {
  const teaser = config.teaser;
  return `<section class="specialized-teaser" aria-labelledby="${category.slug}-teaser-title">
    <div class="specialized-teaser-heading"><div><p class="eyebrow">${escapeHtml(teaser.eyebrow)}</p><h2 id="${category.slug}-teaser-title">${escapeHtml(teaser.title)}</h2><p>${escapeHtml(teaser.copy)}</p></div><a class="button dark" href="${filteredUrl(category, teaser.filter)}" data-analytics-event="${escapeHtml(teaser.analyticsEvent)}" data-analytics-label="${escapeHtml(teaser.action)}">${escapeHtml(teaser.action)} <span aria-hidden="true">→</span></a></div>
    <div class="recommendation-grid teaser-grid">${teaser.slugs.map((slug) => card(placeBySlug(category, slug), { analyticsEvent: "specialized_collection_recommendation_clicked", showTags: false })).join("")}</div>
  </section>`;
}

function editorialCategoryLanding(category, config) {
  return `${experienceDiscovery(category, config)}${curatedPicks(category, config)}${browseCollection(category, config)}${config.teaser ? specializedTeaser(category, config) : ""}`;
}

function installCard() {
  return `<section class="install-card" data-install-card hidden>
    <div><p class="eyebrow">Take Darcey's Guide With You ♡</p><h2>Add the guide to your phone.</h2><p>Keep Darcey's favorite places and trusted local resources close whenever you need them.</p></div>
    <button class="button dark" type="button" data-install-button>Add to My Phone</button>
  </section>`;
}

const utilityGroups = [
  { key: "electric", label: "Electric", icon: "electric" },
  { key: "gas", label: "Gas", icon: "gas" },
  { key: "water", label: "Water", icon: "water" },
  { key: "internet", label: "Internet & Cable", icon: "internet" },
];

function utilityProviderCard(provider, context = "browse") {
  const primaryUrl = provider.startServiceUrl || provider.availabilityUrl || provider.website;
  const primaryEvent = provider.startServiceUrl ? "utility_start_service_click" : provider.availabilityUrl ? "utility_check_availability_click" : "utility_provider_website_click";
  const primaryLabel = provider.primaryAction || (provider.startServiceUrl ? "Start Service" : provider.availabilityUrl ? "Check Availability" : "Visit Provider");
  const search = [provider.name, provider.subcategory, provider.description, ...(provider.aliases || []), ...(provider.serviceAreas || [])].join(" ").toLowerCase();
  return `<article class="utility-provider-card" data-utility-provider-card data-track-impression="true" data-place-view-event="utility_provider_view" data-guide-place="${escapeHtml(provider.name)}" data-guide-slug="${provider.slug}" data-place-id="${provider.placeId}" data-guide-category="Utilities Setup" data-guide-type="UtilityProvider" data-utility-type="${escapeHtml(provider.subcategory)}" data-search="${escapeHtml(search)}" data-utility-context="${escapeHtml(context)}">
    <div class="utility-provider-identity"><img src="${provider.image}" alt="${escapeHtml(provider.name)} logo or ${provider.subcategory.toLowerCase()} service icon" loading="lazy" decoding="async"><div><p>${escapeHtml(provider.subcategory)}</p><h3><a href="${provider.url}" data-analytics-event="utility_provider_click" data-analytics-label="${escapeHtml(provider.name)}">${escapeHtml(provider.name)}</a></h3></div></div>
    <p class="utility-provider-description">${escapeHtml(provider.detail || provider.description)}</p>
    <div class="utility-provider-actions">
      ${primaryUrl ? `<a class="button dark" href="${escapeHtml(primaryUrl)}" target="_blank" rel="noreferrer" data-analytics-event="${primaryEvent}" data-analytics-label="${escapeHtml(`${primaryLabel} - ${provider.name}`)}">${escapeHtml(primaryLabel)}</a>` : ""}
      ${provider.phone ? `<a class="button" href="tel:${provider.phone.replace(/\D/g, "")}" data-analytics-event="utility_phone_click" data-analytics-label="Call ${escapeHtml(provider.name)}">Call <span class="utility-phone">${escapeHtml(provider.phone)}</span></a>` : ""}
      ${provider.website && provider.website !== primaryUrl ? `<a class="utility-text-link" href="${escapeHtml(provider.website)}" target="_blank" rel="noreferrer" data-analytics-event="utility_provider_website_click" data-analytics-label="Website - ${escapeHtml(provider.name)}">Website →</a>` : ""}
    </div>
  </article>`;
}

function utilityConcierge(category) {
  const byId = new Map(category.places.map((provider) => [provider.providerId, provider]));
  const cityPanels = utilityDirectory.cities.map((city) => {
    const relationship = utilityDirectory.serviceAreas[city];
    return `<section class="utility-city-panel" data-utility-city-panel="${escapeHtml(city)}" hidden aria-live="polite">
      <div class="utility-city-heading"><p class="eyebrow">Your ${escapeHtml(city)} utilities</p><h2>${escapeHtml(city)}</h2>${relationship.note ? `<p class="utility-address-warning"><strong>Service provider may vary by property address.</strong> ${escapeHtml(relationship.note)}</p>` : ""}</div>
      <div class="utility-city-groups">${utilityGroups.map((group) => `<section class="utility-result-group" aria-labelledby="utility-${slugify(city)}-${group.key}"><div class="utility-group-title"><img src="/assets/services/icon-${group.icon}.svg" alt="" aria-hidden="true"><h3 id="utility-${slugify(city)}-${group.key}">${group.label}</h3></div><div class="utility-provider-list">${(relationship[group.key] || []).map((id) => utilityProviderCard(byId.get(id), `city:${city}`)).join("")}</div></section>`).join("")}</div>
    </section>`;
  }).join("");
  const browseCards = category.places.map((provider) => utilityProviderCard(provider)).join("");
  return `<section class="utility-concierge" data-utility-concierge data-analytics-impression="utilities_page_viewed" data-analytics-category="Utilities Setup">
    <div class="utility-intro"><div><p class="eyebrow">Moving to the desert?</p><h2>Getting settled should be easy.</h2><p>Choose your city and we'll help you find the utility providers you'll likely need to get started.</p></div><div class="utility-city-picker"><label for="utility-city-select">Where is your home?</label><p>Choose your city to see the utility providers that typically serve your area.</p><select id="utility-city-select" data-utility-city-select><option value="">Select your city or area</option>${utilityDirectory.cities.map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`).join("")}</select></div></div>
    <p class="utility-disclaimer">Utility service areas can vary by property address. Please confirm availability directly with the provider before establishing service.</p>
    <div class="utility-city-results" data-utility-city-results hidden>${cityPanels}</div>
  </section>
  <section class="utility-browse" aria-labelledby="browse-utilities-title"><div class="section-heading"><div><p class="eyebrow">Browse by utility</p><h2 id="browse-utilities-title">Every provider, one easy place.</h2></div></div><div class="utility-tabs" role="group" aria-label="Filter providers by utility type"><button class="active" type="button" data-utility-filter="All">All</button>${["Electric", "Gas", "Water", "Internet & Cable"].map((label) => `<button type="button" data-utility-filter="${escapeHtml(label)}">${escapeHtml(label)}</button>`).join("")}</div><div class="utility-provider-grid" data-utility-provider-grid>${browseCards}</div><p class="empty-state" data-utility-empty hidden>No providers match this utility category.</p></section>
  <section class="utility-download"><div><p class="eyebrow">Need a printable copy?</p><h2>Coachella Valley Utility Guide</h2><p>Prefer having everything in one place? Download Darcey's printable guide for quick reference.</p></div><div class="utility-download-actions"><a class="button dark" href="/downloads/Darceys-Coachella-Valley-Utility-Guide.pdf" target="_blank" data-analytics-event="utility_guide_download" data-analytics-label="Download Utility Guide">Download Utility Guide</a><a class="utility-text-link" href="/downloads/Darceys-Coachella-Valley-Utility-Guide.png" download data-analytics-event="utility_guide_download" data-analytics-label="Download Original Utility Guide">Original image →</a></div></section>`;
}

function categoryPage(category) {
  const canonical = `${guideProfile.siteUrl}/${category.slug}/`;
  const title = `${category.label} in the Coachella Valley | My Desert Guide`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: category.intro,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: guideProfile.siteName, url: guideProfile.siteUrl },
    hasPart: category.places.map((place) => ({ "@type": "WebPage", name: place.name, url: `${guideProfile.siteUrl}${place.url}` })),
  };
  const cities = [...new Set(category.places.map((place) => place.city).filter(Boolean))].sort();
  const tagCounts = new Map();
  category.places.flatMap((place) => place.tags).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
  const hiddenTags = category.slug === "trusted-professionals"
    ? new Set(["beautifully designed desserts", "custom cakes", "custom cakes & desserts"])
    : new Set();
  const supportedTags = [...tagCounts.entries()].filter(([tag, count]) => count >= 1 && !hiddenTags.has(tag.toLowerCase())).sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([tag]) => tag);
  const isUtilities = category.slug === "utilities";
  const editorialConfig = categoryLandingConfigs[category.slug];
  const discovery = isUtilities ? utilityConcierge(category) : editorialConfig ? editorialCategoryLanding(category, editorialConfig) : `<section aria-label="Filter ${escapeHtml(category.label)} recommendations">
        <div class="discovery-tools"><label class="search-field"><span aria-hidden="true">⌕</span><input type="search" data-category-search placeholder="Search ${escapeHtml(category.label.toLowerCase())}, tags or Darcey's notes…" aria-label="Search recommendations"></label><label class="location-field"><span>Location</span><select data-location-filter><option>All</option>${cities.map((city) => `<option>${escapeHtml(city)}</option>`).join("")}</select></label></div>
        <div class="tag-filters" aria-label="Recommendation filters"><button class="tag-filter active" type="button" data-tag-filter="All">All</button>${supportedTags.map((tag) => `<button class="tag-filter" type="button" data-tag-filter="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}</div>
        <p class="results-summary" data-results-summary></p>
      </section>
      <div data-category-grid>
        <section class="recommendation-grid" data-card-section>${category.places.map((place) => card(place)).join("")}</section>
      </div>
      <div class="empty-state" data-empty-results hidden>No recommendations match those filters yet. Try another location or interest.</div>`;

  return `<!doctype html><html lang="en"><head>${pageHead({ title, description: category.intro, canonical, image: category.image, schema })}</head>
  <body data-page-kind="category" data-guide-id="${guideProfile.guideId}" data-profile-id="${guideProfile.profileId}" data-category="${escapeHtml(category.label)}" data-category-slug="${category.slug}">
    ${header()}<main class="page-shell">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><span aria-current="page">${escapeHtml(category.label)}</span></nav>
      <section class="category-hero"><div class="category-hero-copy"><p class="eyebrow">${escapeHtml(category.eyebrow)}</p><h1>${escapeHtml(category.label)}</h1><p>${escapeHtml(category.intro)}</p></div><div class="category-hero-media"><img src="${category.image}" alt="${escapeHtml(category.imageAlt)}" fetchpriority="high"></div></section>
      ${discovery}
      ${installCard()}
    </main>${footer()}${scripts()}
  </body></html>`;
}

function detailRows(place) {
  const standardRows = [
    ["Location", place.city], ["Category", place.subcategory || place.category], ["Address", place.address], ["Phone", place.phone], ["Hours", place.hours], ["Best For", place.bestFor], ["Favorite Dish", place.favoriteDish], ["Happy Hour", place.happyHour], ["Details", place.detail || place.restaurant],
  ];
  const rows = (place.quickInfo?.length ? place.quickInfo : standardRows).filter(([, value]) => value);
  return rows.map(([label,value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}

function actionLinks(place) {
  const links = [
    place.startServiceUrl && `<a class="button dark" href="${escapeHtml(place.startServiceUrl)}" target="_blank" rel="noreferrer" data-analytics-event="utility_start_service_click" data-analytics-label="Start Service - ${escapeHtml(place.name)}">Start Service</a>`,
    place.availabilityUrl && `<a class="button dark" href="${escapeHtml(place.availabilityUrl)}" target="_blank" rel="noreferrer" data-analytics-event="utility_check_availability_click" data-analytics-label="Check Availability - ${escapeHtml(place.name)}">Check Availability</a>`,
    place.website && `<a class="button${place.startServiceUrl || place.availabilityUrl ? "" : " dark"}" href="${escapeHtml(place.website)}" target="_blank" rel="noreferrer"${place.categorySlug === "utilities" ? ` data-analytics-event="utility_provider_website_click" data-analytics-label="Website - ${escapeHtml(place.name)}"` : place.websiteLabel ? ` data-analytics-event="${escapeHtml(place.websiteAnalyticsEvent || "recommendation_external_click")}" data-analytics-label="${escapeHtml(`${place.websiteLabel} - ${place.name}`)}"` : ""}>${escapeHtml(place.websiteLabel || "Website")}</a>`,
    place.menu && `<a class="button" href="${escapeHtml(place.menu)}" target="_blank" rel="noreferrer">Menu</a>`,
    place.teeTime && `<a class="button" href="${escapeHtml(place.teeTime)}" target="_blank" rel="noreferrer">Book Tee Time</a>`,
    place.directions && `<a class="button" href="${escapeHtml(place.directions)}" target="_blank" rel="noreferrer"${place.directionsLabel ? ` data-analytics-event="recommendation_directions_click" data-analytics-label="Directions - ${escapeHtml(place.name)}"` : ""}>${escapeHtml(place.directionsLabel || "Directions")}</a>`,
    place.phone && `<a class="button" href="tel:${place.phone.replace(/\D/g,"")}"${place.categorySlug === "utilities" ? ` data-analytics-event="utility_phone_click" data-analytics-label="Call ${escapeHtml(place.name)}"` : ""}>Call</a>`,
    place.email && `<a class="button" href="mailto:${escapeHtml(place.email)}">Email</a>`,
  ].filter(Boolean);
  if (place.hikingPickLabel || place.coffeePickLabel || place.categorySlug === "shopping") {
    const directionsIndex = links.findIndex((link) => link.includes('data-analytics-event="recommendation_directions_click"'));
    const websiteIndex = links.findIndex((link) => link.includes('data-analytics-event="recommendation_external_click"'));
    if (directionsIndex > websiteIndex && websiteIndex >= 0) {
      const [directions] = links.splice(directionsIndex, 1);
      links.splice(websiteIndex, 0, directions);
    }
  }
  return links.join("");
}

function placeSchema(place) {
  const schema = {
    "@context": "https://schema.org", "@type": place.schemaType, name: place.name,
    description: place.description, image: `${guideProfile.siteUrl}${place.image}`, url: `${guideProfile.siteUrl}${place.url}`,
    address: place.address ? { "@type": "PostalAddress", streetAddress: place.address, addressLocality: place.city, addressRegion: "CA" } : place.city ? { "@type": "PostalAddress", addressLocality: place.city, addressRegion: "CA" } : undefined,
    telephone: place.phone || undefined, sameAs: place.website || undefined,
    geo: place.latitude != null && place.longitude != null ? { "@type": "GeoCoordinates", latitude: place.latitude, longitude: place.longitude } : undefined,
  };
  return Object.fromEntries(Object.entries(schema).filter(([,value]) => value !== undefined));
}

function placePage(place) {
  const category = categoryDefinitions.find((item) => item.slug === place.categorySlug);
  const related = category.places.filter((item) => item.slug !== place.slug).slice(0, 3);
  const canonical = `${guideProfile.siteUrl}${place.url}`;
  const description = `${place.description} ${place.darceysTake ? `Read Darcey's personal take on ${place.name}.` : ""}`.trim();
  return `<!doctype html><html lang="en"><head>${pageHead({ title: `${place.name} | Darcey's My Desert Guide`, description, canonical, image: place.image, type: "article", schema: placeSchema(place) })}</head>
  <body data-page-kind="place" data-guide-id="${place.guideId}" data-profile-id="${place.profileId}" data-category="${escapeHtml(place.category)}" data-category-slug="${place.categorySlug}" data-place-id="${place.placeId}" data-place-slug="${place.slug}" data-place-name="${escapeHtml(place.name)}" data-place-type="${place.schemaType}">
    ${header()}<main class="page-shell">
      <nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/${place.categorySlug}/">${escapeHtml(place.category)}</a><span>/</span><span aria-current="page">${escapeHtml(place.name)}</span></nav>
      <article class="place-hero"><div class="place-media"><img src="${place.image}" alt="${escapeHtml(place.imageAlt)}" fetchpriority="high">${place.photoCredit ? `<a class="photo-credit" href="${escapeHtml(place.photoCredit.url)}" target="_blank" rel="noreferrer">${escapeHtml(place.photoCredit.label)}</a>` : ""}</div><div class="place-copy"><p class="eyebrow">${escapeHtml(place.city)} · ${escapeHtml(place.coffeePickLabel || place.familiarFavoriteLabel || place.subcategory || place.category)}</p><h1>${escapeHtml(place.name)}</h1><p class="place-deck">${escapeHtml(place.description)}</p><div class="tag-list place-tags">${tags(place,5)}</div>${place.isFavorite && place.categorySlug !== "utilities" ? '<div class="favorite-mark">♡ Darcey&#39;s Favorite</div>' : ""}<div class="place-actions">${place.categorySlug === "utilities" ? "" : favoriteButton(place,"place-save")} ${actionLinks(place)}</div></div></article>
      <div class="place-content">
        ${place.darceysTake ? `<section class="place-section darcey-take"><p class="eyebrow">♡ Darcey's Take</p><blockquote>“${escapeHtml(place.darceysTake)}”</blockquote></section>` : ""}${place.goodToKnow ? `<section class="place-section good-to-know"><p class="eyebrow">Good to Know</p><p>${escapeHtml(place.goodToKnow)}</p></section>` : ""}
        ${detailRows(place) ? `<section class="place-section"><p class="eyebrow">Plan Your Visit</p><h2>Useful details.</h2><dl class="detail-list">${detailRows(place)}</dl></section>` : ""}
      </div>
      <section class="related-section"><div class="section-heading"><div><p class="eyebrow">Keep Exploring</p><h2>Related recommendations.</h2></div></div><div class="recommendation-grid">${related.map(card).join("")}</div></section>
      ${installCard()}
    </main>${footer()}${scripts()}
  </body></html>`;
}

function savedPage() {
  const canonical = `${guideProfile.siteUrl}/saved/`;
  return `<!doctype html><html lang="en"><head>${pageHead({ title: "My Desert List | My Desert Guide", description: "Your saved recommendations from Darcey's My Desert Guide.", canonical, image: "/assets/my-desert-guide-hero-1536.jpg", noindex: true })}</head><body data-page-kind="saved" data-guide-id="${guideProfile.guideId}" data-profile-id="${guideProfile.profileId}">${header()}<main class="page-shell"><section class="saved-hero"><p class="eyebrow">Your Personal Collection</p><h1>My Desert List ♡</h1><p>All the places you save across Darcey's Guide, together in one easy list on this device.</p></section><section class="recommendation-grid" data-saved-grid></section>${installCard()}</main>${footer()}${scripts()}</body></html>`;
}

async function write(relative, content) {
  const target = path.join(root, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content.replace(/[ \t]+$/gm, ""));
}

await fs.rm(path.join(root, "place"), { recursive: true, force: true });
for (const category of categoryDefinitions) await write(`${category.slug}/index.html`, categoryPage(category));
for (const place of allPlaces) await write(`place/${place.slug}/index.html`, placePage(place));
const validPlaceSlugs = new Set(allPlaces.map((place) => place.slug));
for (const entry of await fs.readdir(path.join(root, "place"), { withFileTypes: true })) {
  if (!entry.isDirectory() || validPlaceSlugs.has(entry.name)) continue;
  const extraPath = path.join(root, "place", entry.name);
  if ((await fs.readdir(extraPath)).length === 0) await fs.rmdir(extraPath);
}
await write("saved/index.html", savedPage());
await write("data/places.json", `${JSON.stringify(allPlaces, null, 2)}\n`);
await write("data/catalog.json", `${JSON.stringify({ guide: guideProfile, places: masterPlaces, recommendations: guideRecommendations }, null, 2)}\n`);

const urls = [
  `${guideProfile.siteUrl}/`,
  ...categoryDefinitions.map((category) => `${guideProfile.siteUrl}/${category.slug}/`),
  ...allPlaces.map((place) => `${guideProfile.siteUrl}${place.url}`),
];
await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url.replaceAll("&","&amp;")}</loc></url>`).join("\n")}\n</urlset>\n`);
await write("robots.txt", `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${guideProfile.siteUrl}/sitemap.xml\n`);

console.log(`Generated ${categoryDefinitions.length} category pages, ${allPlaces.length} recommendation pages, saved places, sitemap and robots.txt.`);
