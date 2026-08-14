import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPlaces, categoryDefinitions, guideRecommendations, masterPlaces } from "../outputs/desert-insider/guide-model.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../outputs/desert-insider");
const read = (relative) => fs.readFile(path.join(root, relative), "utf8");

if (categoryDefinitions.length !== 6) throw new Error(`Expected 6 primary categories, found ${categoryDefinitions.length}.`);
if (allPlaces.length !== 65) throw new Error(`Expected 65 source recommendations and utility resources, found ${allPlaces.length}.`);

const slugs = new Set(allPlaces.map((place) => place.slug));
const ids = new Set(allPlaces.map((place) => place.placeId));
if (slugs.size !== allPlaces.length) throw new Error("Recommendation slugs must be unique.");
if (ids.size !== allPlaces.length) throw new Error("Place IDs must be unique.");
if (masterPlaces.length !== guideRecommendations.length || guideRecommendations.some((recommendation) => !ids.has(recommendation.placeId))) {
  throw new Error("Master-place and guide-recommendation relationships are invalid.");
}

const homepage = await read("index.html");
const homepageApp = await read("app.js");
const homepageData = await read("data.js");
const homepageStyles = await read("styles.css");
const directoryStyles = await read("directory.css");
const dashboardStyles = await read("admin/analytics-dashboard.css");
for (const marker of ["The Desert", "my-desert-guide-hero-darcey.png", "Start With What You Need"]) {
  if (!`${homepage}\n${homepageApp}\n${homepageData}`.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Homepage preservation marker is missing: ${marker}`);
}
for (const marker of [
  '--font-display: "Libre Bodoni"',
  '--font-sans: "Montserrat"',
  "--type-page-title:",
  "--type-section-title:",
  "--type-card-title:",
  "--leading-body:",
]) {
  if (!homepageStyles.includes(marker) || !directoryStyles.includes(marker)) {
    throw new Error(`Shared typography token is missing: ${marker}`);
  }
}
for (const marker of [
  ".hero-live-copy h1",
  "font-size: clamp(3.2rem, 7.3vw, 7.1rem)",
  "letter-spacing: -0.02em",
  ".hero-description",
  "font-family: var(--font-editorial)",
]) {
  if (!homepageStyles.includes(marker)) throw new Error(`Approved hero typography marker is missing: ${marker}`);
}
for (const marker of ["--font-display:", "--font-sans:", "--type-page-title:", "--type-section-title:"]) {
  if (!dashboardStyles.includes(marker)) throw new Error(`Dashboard typography token is missing: ${marker}`);
}
if (/Montserrat[^\n]*(700|800|900)/.test(homepage) || /Montserrat[^\n]*(700|800|900)/.test(homepageApp)) {
  throw new Error("Homepage loads an unneeded heavy Montserrat weight.");
}
const homepageRender = homepageApp.slice(homepageApp.indexOf("function render()"), homepageApp.indexOf("const legacyCategoryRoutes"));
for (const legacyHash of ["#guide", "#golf", "#things-to-do", "#shopping", "#utilities", "#professionals"]) {
  if (homepageRender.includes(`href="${legacyHash}"`)) throw new Error(`Homepage still renders legacy category navigation: ${legacyHash}`);
}
for (const removedSection of ['id="guide"', 'id="golf"', 'id="things-to-do"', 'id="shopping"', 'id="utilities"', 'id="professionals"', 'id="map"']) {
  if (homepageRender.includes(removedSection)) throw new Error(`Homepage still renders retired directory section: ${removedSection}`);
}
for (const marker of [
  'href="#browse-guide"',
  "curatedFavoritesSection()",
  "Spencer's",
  "The Classic Club",
  "The Living Desert",
  "World Market",
  "home-install-card",
  "Love Where You Live",
  "real-estate-cta",
  "real_estate_cta_impression",
  "real_estate_home_search_click",
  "home-footer",
  "hero-curator",
  "realtorProfile.curatorLabel",
  "realtorProfile.professionalIdentifier",
]) {
  if (!homepageApp.includes(marker)) throw new Error(`Hybrid homepage marker is missing: ${marker}`);
}
if (!homepageData.includes("Pinnacle Realty Advisors") || !homepageData.includes("CA DRE 02220139")) {
  throw new Error("Homepage real-estate brokerage disclosure is missing.");
}
if (!homepageData.includes("Curated by") || !homepageData.includes("Palm Springs & Coachella Valley Realtor®")) {
  throw new Error("Homepage Realtor identifier profile data is missing.");
}
for (const category of categoryDefinitions) {
  if (!homepageData.includes(`/${category.slug}/`)) throw new Error(`Homepage gateway is missing: /${category.slug}/`);
  if (!homepageApp.includes(`/${category.slug}/`)) throw new Error(`Homepage navigation is missing: /${category.slug}/`);
  const html = await read(`${category.slug}/index.html`);
  for (const marker of ["<h1>", "rel=\"canonical\"", "application/ld+json", category.slug === "utilities" ? "data-utility-provider-grid" : "data-category-grid"]) {
    if (!html.includes(marker)) throw new Error(`${category.slug} is missing ${marker}.`);
  }
  for (const marker of ["Love Where You Live", "Thinking about making the desert home?", "https://darceydeetz.com/home-search/listings", "real_estate_contact_click"]) {
    if (!html.includes(marker)) throw new Error(`${category.slug} is missing real-estate footer marker: ${marker}`);
  }
  for (const marker of ["Darcey Deetz", "CA DRE 01374659", "Pinnacle Realty Advisors", "CA DRE 02220139"]) {
    if (!html.includes(marker)) throw new Error(`${category.slug} is missing real-estate legal marker: ${marker}`);
  }
  if (html.includes("Need Darcey's help?")) throw new Error(`${category.slug} still contains the retired footer.`);
}

const utilitiesPage = await read("utilities/index.html");
for (const marker of ["Where is your home?", "data-utility-city-select", "Palm Springs", "Thermal / Mecca", "Service provider may vary by property address", "Darceys-Coachella-Valley-Utility-Guide.pdf", "utility_guide_download"]) {
  if (!utilitiesPage.includes(marker)) throw new Error(`Utilities concierge is missing: ${marker}`);
}

const bumpAndGrindPage = await read("place/bump-and-grind-trail/index.html");
for (const marker of ["4 miles", "Moderate", "About 2 hours", "February 1–April 30", "main lower loop", "Get Directions", "More Trail Info"]) {
  if (!bumpAndGrindPage.includes(marker)) throw new Error(`Bump and Grind Trail is missing: ${marker}`);
}
if (bumpAndGrindPage.includes("Darcey's Take")) throw new Error("Bump and Grind Trail must not include an invented Darcey's Take.");
const hikingPicks = [
  ["indian-canyons", ["Andreas Canyon", "Murray Canyon", "Palm Canyon", "Official Website"]],
  ["tahquitz-canyon", ["About 2 miles", "Water is required", "60-foot waterfall", "Official Website"]],
  ["bump-and-grind-trail", ["February 1–April 30", "More Trail Info"]],
  ["araby-trail", ["About 3.4 miles", "Challenging", "More Info"]],
  ["palm-springs-aerial-tramway", ["About 1.5 miles", "High elevation", "Tram Info"]],
];
for (const [slug, markers] of hikingPicks) {
  const html = await read(`place/${slug}/index.html`);
  for (const marker of markers) {
    if (!html.includes(marker)) throw new Error(`${slug} is missing hiking marker: ${marker}`);
  }
  if (html.includes("Darcey's Take")) throw new Error(`${slug} must not include an invented Darcey's Take.`);
}
const thingsToDoPage = await read("things-to-do/index.html");
for (const marker of [
  "What are you in the mood for?", "Hiking &amp; Outdoors", "Arts &amp; Culture", "Desert Experiences", "Entertainment", "Markets &amp; Local Life", "Darcey&#39;s Favorites",
  "Darcey's Desert Picks", "VillageFest", "Indian Canyons", "The Living Desert", "Palm Springs Art Museum", "Coachella Valley Firebirds", "Sunnylands",
  "Explore More", "data-filter-value=\"Outdoors\"", "data-filter-value=\"Family\"", "All Desert", "Hike the Desert", "Explore Hiking", "explore_hiking_clicked",
]) {
  if (!thingsToDoPage.includes(marker)) throw new Error(`Things to Do discovery page is missing: ${marker}`);
}
const coffeePicks = [
  ["koffi", ["Palm Springs Classic", "View All Locations", "Get Directions"]],
  ["ernest-coffee", ["Uptown Favorite", "1101 N Palm Canyon Dr", "Visit Website"]],
  ["varraco-coffee-roasters", ["Coffee Lover&#39;s Pick", "73891 Highway 111", "Official Instagram"]],
  ["iw-coffee", ["Easy Morning Stop", "74995 Highway 111", "Indian Wells"]],
  ["everbloom-coffee", ["East Valley Favorite", "81730 Highway 111", "Midtown Indio"]],
  ["starbucks", ["Familiar Favorite", "Find a Starbucks", "find_starbucks_click"]],
];
for (const [slug, markers] of coffeePicks) {
  const html = await read(`place/${slug}/index.html`);
  for (const marker of markers) {
    if (!html.includes(marker)) throw new Error(`${slug} is missing coffee marker: ${marker}`);
  }
  if (html.includes("Darcey's Take")) throw new Error(`${slug} must not include an invented Darcey's Take.`);
}
const foodDrinkPage = await read("food-drink/index.html");
for (const marker of [
  "What are you in the mood for?", "Dinner", "Happy Hour", "Brunch", "Coffee", "Darcey&#39;s Favorites", "Patio Dining",
  "Darcey's Desert Picks", "Lulu", "Spencer&#39;s", "Cheeky&#39;s", "Las Casuelas Terraza", "Cactus Jack&#39;s", "Mitch&#39;s",
  "Explore Food &amp; Drink", "data-filter-value=\"Coffee\"", "data-filter-value=\"Casual\"", "More Filters", "All Desert",
  "Coffee in the Desert", "Explore Coffee", "explore_coffee_clicked", "Palm Springs Classic", "Uptown Favorite", "Coffee Lover&#39;s Pick", "Find a Starbucks",
]) {
  if (!foodDrinkPage.includes(marker)) throw new Error(`Food & Drink discovery page is missing: ${marker}`);
}
if ((foodDrinkPage.match(/data-guide-place="Starbucks"/g) || []).length !== 1) throw new Error("Starbucks should appear exactly once on Food & Drink.");
if ((foodDrinkPage.match(/specialized_collection_recommendation_clicked/g) || []).length !== 3) throw new Error("Food & Drink should preview exactly three Coffee recommendations.");
if ((thingsToDoPage.match(/specialized_collection_recommendation_clicked/g) || []).length !== 3) throw new Error("Things to Do should preview exactly three Hiking recommendations.");
for (const place of allPlaces.filter((place) => ["food-drink", "things-to-do"].includes(place.categorySlug))) {
  if (!Array.isArray(place.experienceTypes) || !place.experienceTypes.length) throw new Error(`${place.slug} is missing normalized experience types.`);
  if (!Array.isArray(place.attributes) || !Array.isArray(place.editorialLabels)) throw new Error(`${place.slug} is missing normalized discovery metadata.`);
}
for (const providerName of ["Southern California Edison", "Imperial Irrigation District", "SoCalGas", "Desert Water Agency", "Coachella Valley Water District", "Mission Springs Water District", "Indio Water Authority", "Myoma Dunes Water Company", "City of Coachella Water Department", "Spectrum", "Frontier Communications", "AT&amp;T Internet", "T-Mobile Home Internet"]) {
  if (!utilitiesPage.includes(providerName)) throw new Error(`Utilities concierge is missing provider: ${providerName}`);
}

for (const place of allPlaces) {
  const html = await read(`place/${place.slug}/index.html`);
  for (const marker of ["<h1>", "rel=\"canonical\"", "application/ld+json", place.placeId, "data-favorite-slug"]) {
    if (!html.includes(marker)) throw new Error(`${place.slug} is missing ${marker}.`);
  }
  for (const marker of ["Darcey Deetz", "CA DRE 01374659", "Pinnacle Realty Advisors", "CA DRE 02220139"]) {
    if (!html.includes(marker)) throw new Error(`${place.slug} is missing real-estate legal marker: ${marker}`);
  }
  if (place.darceysTake && !html.includes("Darcey's Take")) throw new Error(`${place.slug} is missing Darcey's Take.`);
}

const savedPage = await read("saved/index.html");
for (const marker of ["Darcey Deetz", "CA DRE 01374659", "Pinnacle Realty Advisors", "CA DRE 02220139"]) {
  if (!savedPage.includes(marker)) throw new Error(`Saved page is missing real-estate legal marker: ${marker}`);
}

const manifest = JSON.parse(await read("manifest.webmanifest"));
if (manifest.name !== "Darcey's Guide" || manifest.start_url !== "/" || manifest.scope !== "/") {
  throw new Error("Manifest app identity or navigation scope is incorrect.");
}

const serviceWorker = await read("sw.js");
if (!serviceWorker.includes("event.request.mode === \"navigate\"")) throw new Error("Service worker navigation handling is missing.");

const sitemap = await read("sitemap.xml");
const sitemapUrls = sitemap.match(/<loc>/g)?.length || 0;
if (sitemapUrls !== 1 + categoryDefinitions.length + allPlaces.length) throw new Error(`Sitemap contains ${sitemapUrls} URLs.`);

const robots = await read("robots.txt");
if (!robots.includes("Sitemap: https://mydesertguide.com/sitemap.xml") || !robots.includes("Disallow: /admin/")) {
  throw new Error("robots.txt does not expose the sitemap or protect admin routes.");
}

console.log(`Validated 6 categories, ${allPlaces.length} recommendation pages, utilities concierge, favorites, PWA navigation, robots.txt and ${sitemapUrls} sitemap URLs.`);
