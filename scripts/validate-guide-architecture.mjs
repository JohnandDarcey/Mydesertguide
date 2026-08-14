import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allPlaces, categoryDefinitions, guideRecommendations, masterPlaces } from "../outputs/desert-insider/guide-model.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../outputs/desert-insider");
const read = (relative) => fs.readFile(path.join(root, relative), "utf8");

if (categoryDefinitions.length !== 6) throw new Error(`Expected 6 primary categories, found ${categoryDefinitions.length}.`);
if (allPlaces.length !== 46) throw new Error(`Expected 46 source recommendations, found ${allPlaces.length}.`);

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
for (const marker of ["The Desert", "my-desert-guide-hero-darcey.png", "Start With What You Need"]) {
  if (!`${homepage}\n${homepageApp}\n${homepageData}`.toLowerCase().includes(marker.toLowerCase())) throw new Error(`Homepage preservation marker is missing: ${marker}`);
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
  "home-footer",
]) {
  if (!homepageApp.includes(marker)) throw new Error(`Hybrid homepage marker is missing: ${marker}`);
}
for (const category of categoryDefinitions) {
  if (!homepageData.includes(`/${category.slug}/`)) throw new Error(`Homepage gateway is missing: /${category.slug}/`);
  if (!homepageApp.includes(`/${category.slug}/`)) throw new Error(`Homepage navigation is missing: /${category.slug}/`);
  const html = await read(`${category.slug}/index.html`);
  for (const marker of ["<h1>", "rel=\"canonical\"", "application/ld+json", "data-category-grid"]) {
    if (!html.includes(marker)) throw new Error(`${category.slug} is missing ${marker}.`);
  }
  for (const marker of ["Love Where You Live", "Thinking about making the desert home?", "https://darceydeetz.com/home-search/listings", "real_estate_contact_click"]) {
    if (!html.includes(marker)) throw new Error(`${category.slug} is missing real-estate footer marker: ${marker}`);
  }
  if (html.includes("Need Darcey's help?")) throw new Error(`${category.slug} still contains the retired footer.`);
}

for (const place of allPlaces) {
  const html = await read(`place/${place.slug}/index.html`);
  for (const marker of ["<h1>", "rel=\"canonical\"", "application/ld+json", place.placeId, "data-favorite-slug"]) {
    if (!html.includes(marker)) throw new Error(`${place.slug} is missing ${marker}.`);
  }
  if (place.darceysTake && !html.includes("Darcey's Take")) throw new Error(`${place.slug} is missing Darcey's Take.`);
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

console.log(`Validated 6 categories, 46 recommendation pages, favorites, PWA navigation, robots.txt and ${sitemapUrls} sitemap URLs.`);
