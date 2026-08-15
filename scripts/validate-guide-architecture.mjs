import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPlaces, categoryDefinitions, guideRecommendations, masterPlaces } from "../outputs/desert-insider/guide-model.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../outputs/desert-insider");
const read = (relative) => fs.readFile(path.join(root, relative), "utf8");

if (categoryDefinitions.length !== 7) throw new Error(`Expected 7 primary categories, found ${categoryDefinitions.length}.`);
if (allPlaces.length !== 80) throw new Error(`Expected 80 source recommendations and utility resources, found ${allPlaces.length}.`);

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
const homepageServiceWorker = await read("sw.js");
const directoryStyles = await read("directory.css");
const dashboardStyles = await read("admin/analytics-dashboard.css");
for (const marker of ["The Desert", "my-desert-guide-hero-darcey.png", "Start With What You Need"]) {
  if (!`${homepage}\n${homepageApp}\n${homepageData}`.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Homepage preservation marker is missing: ${marker}`);
}
for (const marker of [
  '--font-display: "Didot"',
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
if (!homepageStyles.includes("h4,\nh5,\nh6") || !homepageStyles.includes("text-transform: uppercase")) {
  throw new Error("Homepage uppercase heading treatment is missing.");
}
if (!directoryStyles.includes("h1, h2, h3, h4, h5, h6") || !directoryStyles.includes("text-transform: uppercase")) {
  throw new Error("Directory uppercase heading treatment is missing.");
}
for (const stylesheet of [homepageStyles, directoryStyles]) {
  if (!stylesheet.includes('"Didot", "Bodoni 72", "Bodoni Moda"')) {
    throw new Error("Hero-matched Didot/Bodoni display stack is missing.");
  }
}
for (const marker of [
  "--type-page-title: clamp(2.35rem",
  "--type-section-title: clamp(1.81rem",
  "--type-subsection-title: clamp(1.45rem",
  "--type-card-title: clamp(1.09rem",
]) {
  if (!homepageStyles.includes(marker) || !directoryStyles.includes(marker)) {
    throw new Error(`Reduced global heading scale is missing: ${marker}`);
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
  'href="/ask-darcey/"',
  "Ask Darcey",
]) {
  if (!homepageApp.includes(marker)) throw new Error(`Hybrid homepage marker is missing: ${marker}`);
}
if (!homepageData.includes("Pinnacle Realty Advisors") || !homepageData.includes("CA DRE 02220139")) {
  throw new Error("Homepage real-estate brokerage disclosure is missing.");
}
if (!homepageData.includes("Curated by") || !homepageData.includes("Palm Springs & Coachella Valley Realtor®")) {
  throw new Error("Homepage Realtor identifier profile data is missing.");
}
if (!homepage.includes("app.js?v=20260815-simple-lead-funnel") || !homepageApp.includes("data.js?v=20260814-spa-beauty-v2")) {
  throw new Error("Homepage lead-engine or Spa & Beauty cache-busting versions are missing.");
}
if (!homepage.includes("styles.css?v=20260815-real-estate-layout-fix") || !homepageServiceWorker.includes("darceys-guide-v20-real-estate-layout-fix")) {
  throw new Error("Homepage real-estate layout cache-busting versions are missing.");
}
if (!homepageStyles.includes(".darcey-cta-photo") || !homepageStyles.includes("position: absolute")) {
  throw new Error("Homepage real-estate portrait sizing guard is missing.");
}

const askDarceyPage = await read("ask-darcey/index.html");
for (const marker of ["Thinking About Making the Desert Home?", 'id="lead-form"', "I'm interested in", "Send to Darcey", "No automated sales pitch. Just Darcey."]) {
  if (!askDarceyPage.includes(marker)) throw new Error(`Ask Darcey page is missing: ${marker}`);
}
const askDarceyScript = await read("ask-darcey.js");
for (const marker of ["/api/leads/submit", "ask_darcey_page_view", "lead_form_started", "sourcePage"]) {
  if (!askDarceyScript.includes(marker)) throw new Error(`Ask Darcey lead flow is missing: ${marker}`);
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
const shoppingPage = await read("shopping/index.html");
for (const marker of [
  "What are you shopping for?", "Fashion", "Gifts + Palm Springs", "Home + Design", "Art + Vintage", "Golf + Sport", "Luxury",
  "Darcey&#39;s Desert Shopping Picks", "The Shag Store", "PGA TOUR Superstore", "Destination PSP", "The Shops at Thirteen Forty Five", "Brandini Toffee", "El Paseo Shopping District", "Tommy Bahama Home",
  "Explore Shopping", "Familiar Favorites", "All Desert", "Palm Springs", "Rancho Mirage", "Palm Desert", "shopping_experience_tile_selected", "shopping_pick_clicked",
]) {
  if (!shoppingPage.includes(marker)) throw new Error(`Shopping discovery page is missing: ${marker}`);
}
if (homepageData.includes("Trina Turk") || shoppingPage.includes("Trina Turk")) throw new Error("Trina Turk must not be added to this Shopping collection.");
const shoppingRecommendations = [
  ["the-shag-store", ["745 N Palm Canyon Dr", "Get Directions", "Visit Website"]],
  ["pga-tour-superstore", ["72280 Highway 111", "760-601-3450", "Get Directions", "Visit Website"]],
  ["destination-psp", ["170 N Palm Canyon Dr", "Get Directions", "Visit Website"]],
  ["just-fabulous", ["515 N Palm Canyon Dr", "Get Directions", "Visit Website"]],
  ["the-shops-at-thirteen-forty-five", ["1345 N Palm Canyon Dr", "Get Directions", "Visit Website"]],
  ["brandini-toffee", ["132 S Palm Canyon Dr", "42250 Bob Hope Dr", "Get Directions", "Visit Website"]],
  ["frenchys-palm-springs", ["136 N Palm Canyon Dr", "women&#39;s fashion", "Get Directions", "Visit Website"]],
  ["saks-fifth-avenue", ["73555 El Paseo", "Get Directions", "Visit Website"]],
  ["macys", ["72780 Highway 111", "Get Directions", "Visit Website"]],
  ["el-paseo-shopping-district", ["Highway 74 and Portola Ave", "Get Directions", "Explore El Paseo"]],
  ["tommy-bahama-home", ["73540 El Paseo", "442-256-8199", "Get Directions", "Visit Store Website"]],
];
for (const [slug, markers] of shoppingRecommendations) {
  const html = await read(`place/${slug}/index.html`);
  for (const marker of markers) {
    if (!html.includes(marker)) throw new Error(`${slug} is missing Shopping marker: ${marker}`);
  }
  if (html.includes("Darcey's Take")) throw new Error(`${slug} must not include an invented Darcey's Take.`);
}
for (const [slug, credit] of [
  ["the-shag-store", "Photo courtesy of The Shag Store"],
  ["the-shops-at-thirteen-forty-five", "Photo provided for My Desert Guide"],
  ["pga-tour-superstore", "Palm Desert storefront photo via Loc8NearMe"],
  ["destination-psp", "Photo courtesy of Destination PSP"],
  ["just-fabulous", "Photo courtesy of Visit Greater Palm Springs / Just Fabulous"],
  ["brandini-toffee", "Photo courtesy of Brandini Toffee"],
  ["saks-fifth-avenue", "Photo courtesy of Visit Greater Palm Springs"],
  ["macys", "Palm Desert store photo via Foursquare"],
  ["el-paseo-shopping-district", "Photo courtesy of El Paseo Catalogue"],
  ["tommy-bahama-home", "Photo courtesy of Tommy Bahama Home"],
]) {
  const html = await read(`place/${slug}/index.html`);
  if (!html.includes(credit)) throw new Error(`${slug} is missing its real-world photo credit.`);
}

const spaBeautyPage = await read("spa-beauty/index.html");
for (const marker of ["Spa &amp; Beauty", "Sunstone Spa at Agua Caliente", "The Spa at Séc-he", "Eden Nails", "Josh Fuller at Salon Jarick"]) {
  if (!spaBeautyPage.includes(marker)) throw new Error(`Spa & Beauty is missing: ${marker}`);
}
for (const [slug, markers] of [
  ["sunstone-spa-at-agua-caliente", ["32250 Bob Hope Dr", "760-202-2121", "Explore the Spa"]],
  ["the-spa-at-sec-he", ["200 E Tahquitz Canyon Way", "866-777-3243", "Explore the Spa"]],
  ["eden-nails", ["1751 N Sunrise Way", "760-416-2426", "View Salon Info"]],
  ["josh-fuller-at-salon-jarick", ["333 S Indian Canyon Dr", "305-301-3191", "Contact Josh"]],
]) {
  const html = await read(`place/${slug}/index.html`);
  for (const marker of markers) {
    if (!html.includes(marker)) throw new Error(`${slug} is missing Spa & Beauty marker: ${marker}`);
  }
  if (html.includes("Darcey's Take")) throw new Error(`${slug} must not include an invented Darcey's Take.`);
}
const joshFullerPage = await read("place/josh-fuller-at-salon-jarick/index.html");
if (!joshFullerPage.includes("Photo courtesy of Salon Jarick") || !joshFullerPage.includes(encodeURIComponent("/assets/spa-beauty/josh-fuller.jpg"))) {
  throw new Error("Josh Fuller must use the official Salon Jarick interior photo.");
}

const professionalsPage = await read("trusted-professionals/index.html");
if (!professionalsPage.includes(encodeURIComponent("/assets/services/mr-beez-pest-control.png"))) throw new Error("Trusted Professionals must use the Mr. Beez category image.");
for (const removedFilter of ["beautifully designed desserts", "custom cakes"]) {
  if (professionalsPage.toLowerCase().includes(`data-tag-filter=\"${removedFilter}`)) throw new Error(`Trusted Professionals still exposes removed navigation filter: ${removedFilter}`);
}
for (const place of allPlaces.filter((place) => ["food-drink", "things-to-do", "shopping"].includes(place.categorySlug))) {
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
if (sitemapUrls !== 2 + categoryDefinitions.length + allPlaces.length) throw new Error(`Sitemap contains ${sitemapUrls} URLs.`);

const robots = await read("robots.txt");
if (!robots.includes("Sitemap: https://mydesertguide.com/sitemap.xml") || !robots.includes("Disallow: /admin/")) {
  throw new Error("robots.txt does not expose the sitemap or protect admin routes.");
}

console.log(`Validated 7 categories, ${allPlaces.length} recommendation pages, utilities concierge, favorites, PWA navigation, robots.txt and ${sitemapUrls} sitemap URLs.`);
