import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(repoRoot, "outputs/desert-insider");
const siteUrl = "https://mydesertguide.com";
const runLive = process.argv.includes("--live");

const decode = (value = "") => String(value)
  .replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'")
  .replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&nbsp;", " ");
const clean = (value = "") => decode(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
const attr = (tag, name) => decode(tag.match(new RegExp(`\\s${name}=["']([^"']*)["']`, "i"))?.[1] || "");
const meta = (html, key, value) => {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  return attr(tags.find((tag) => attr(tag, key).toLowerCase() === value.toLowerCase()) || "", "content");
};
const link = (html, rel) => {
  const tags = html.match(/<link\b[^>]*>/gi) || [];
  return attr(tags.find((tag) => attr(tag, "rel").toLowerCase().split(/\s+/).includes(rel)) || "", "href");
};
const matches = (html, regex) => [...html.matchAll(regex)].map((match) => match[1]);
const table = (value) => String(value || "—").replaceAll("|", "\\|").replaceAll("\n", " ");
const sameUrl = (a, b) => a.replace(/\/$/, "") === b.replace(/\/$/, "");

function routeFile(url) {
  const pathname = new URL(url).pathname;
  return pathname === "/" ? path.join(publicRoot, "index.html") : path.join(publicRoot, pathname, "index.html");
}

function purposeFor(url, h1) {
  const pathname = new URL(url).pathname;
  if (pathname === "/") return "Homepage and entry point to Darcey's Coachella Valley guide";
  if (pathname === "/ask-darcey/") return "Real-estate questions and lead contact page";
  if (pathname === "/saved/") return "Private-on-device list of a visitor's saved recommendations";
  if (pathname.startsWith("/place/")) return `Curated recommendation detail for ${h1}`;
  return `${h1} category directory`;
}

function inspect(html, url, sitemapSet) {
  const title = clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
  const description = meta(html, "name", "description");
  const robots = meta(html, "name", "robots").toLowerCase();
  const canonical = link(html, "canonical");
  const h1s = matches(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi).map(clean);
  const ogTitle = meta(html, "property", "og:title");
  const ogDescription = meta(html, "property", "og:description");
  const ogImage = meta(html, "property", "og:image");
  const ogUrl = meta(html, "property", "og:url");
  const twitterCard = meta(html, "name", "twitter:card");
  const twitterTitle = meta(html, "name", "twitter:title");
  const twitterDescription = meta(html, "name", "twitter:description");
  const twitterImage = meta(html, "name", "twitter:image");
  const ogImageAlt = meta(html, "property", "og:image:alt");
  const twitterImageAlt = meta(html, "name", "twitter:image:alt");
  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  const missingAlt = imageTags.filter((tag) => !/\saria-hidden=["']true["']/i.test(tag) && !/\salt=["'][^"']+["']/i.test(tag)).length;
  const schemaTags = matches(html, /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const schemaTypes = [];
  let schemaError = false;
  for (const text of schemaTags) {
    try {
      const data = JSON.parse(text);
      const nodes = data["@graph"] || [data];
      for (const node of nodes) if (node?.["@type"]) schemaTypes.push(...(Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]));
    } catch { schemaError = true; }
  }
  const indexable = !robots.includes("noindex");
  const issues = [];
  if (!title) issues.push("Missing title");
  else if (title.length > 65) issues.push(`Long title (${title.length})`);
  else if (title.length < 25) issues.push(`Short title (${title.length})`);
  if (!description) issues.push("Missing meta description");
  else if (indexable && description.length > 170) issues.push(`Long description (${description.length})`);
  else if (indexable && description.length < 70) issues.push(`Short description (${description.length})`);
  if (h1s.length !== 1) issues.push(`${h1s.length} H1 elements`);
  if (!canonical) issues.push("Missing canonical");
  else if (!sameUrl(canonical, url)) issues.push("Canonical mismatch");
  if (canonical && !canonical.startsWith(`${siteUrl}/`)) issues.push("Canonical not on preferred HTTPS domain");
  if (indexable && !sitemapSet.has(url)) issues.push("Indexable page missing from sitemap");
  if (!indexable && sitemapSet.has(url)) issues.push("Noindex page included in sitemap");
  if (!ogTitle || !ogDescription || !ogImage || !ogUrl) issues.push("Incomplete Open Graph metadata");
  if (!twitterCard || !twitterTitle || !twitterDescription || !twitterImage) issues.push("Incomplete Twitter metadata");
  if (!ogImageAlt || !twitterImageAlt) issues.push("Missing social image alt text");
  if (indexable && !schemaTags.length) issues.push("Missing structured data");
  if (schemaError) issues.push("Invalid JSON-LD");
  if (url !== `${siteUrl}/` && indexable && !schemaTypes.includes("BreadcrumbList")) issues.push("Missing BreadcrumbList schema");
  if (missingAlt) issues.push(`${missingAlt} image(s) missing useful alt text`);
  const textOnly = clean(html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " "));
  const wordCount = textOnly.split(/\s+/).filter(Boolean).length;
  if (indexable && wordCount < 100) issues.push(`Thin rendered HTML (${wordCount} words)`);
  const recommendation = issues.length ? issues.map((issue) => {
    if (issue.includes("BreadcrumbList")) return "Add breadcrumb structured data";
    if (issue.includes("title")) return "Refine the SEO title";
    if (issue.includes("description")) return "Refine the meta description";
    if (issue.includes("Thin")) return "Add concise, original local context";
    return `Resolve: ${issue}`;
  }).join("; ") : "No change required";
  return { url, title, description, h1: h1s.join(" / "), robots, canonical, indexable, issues, recommendation, schemaTypes: [...new Set(schemaTypes)], wordCount, imageTags };
}

async function fetchCheck(url) {
  try {
    const response = await fetch(url, { headers: { "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)" }, redirect: "follow" });
    return { status: response.status, finalUrl: response.url, xRobots: response.headers.get("x-robots-tag") || "" };
  } catch (error) { return { status: 0, finalUrl: "", xRobots: "", error: error.message }; }
}

const sitemapXml = await fs.readFile(path.join(publicRoot, "sitemap.xml"), "utf8");
const sitemapUrls = matches(sitemapXml, /<loc>([^<]+)<\/loc>/g).map(decode);
const sitemapSet = new Set(sitemapUrls);
const inventoryUrls = [...sitemapUrls, `${siteUrl}/saved/`];
const pages = [];
for (const url of inventoryUrls) {
  const html = await fs.readFile(routeFile(url), "utf8");
  pages.push({ ...inspect(html, url, sitemapSet), html });
}

const duplicate = (key) => {
  const map = new Map();
  for (const page of pages.filter((item) => item.indexable)) {
    const value = page[key];
    if (!value) continue;
    map.set(value, [...(map.get(value) || []), page.url]);
  }
  return [...map.entries()].filter(([, urls]) => urls.length > 1);
};
const duplicateTitles = duplicate("title");
const duplicateDescriptions = duplicate("description");

const knownRoutes = new Set(inventoryUrls.map((url) => new URL(url).pathname));
const internalLinkProblems = [];
const assetPaths = new Set();
for (const page of pages) {
  const hrefs = (page.html.match(/<a\b[^>]*href=["'][^"']+["'][^>]*>/gi) || []).map((tag) => attr(tag, "href"));
  for (const href of hrefs) {
    if (!href || href.startsWith("#") || /^(mailto:|tel:|sms:|javascript:)/i.test(href)) continue;
    const resolved = new URL(href, page.url);
    if (resolved.origin !== siteUrl) continue;
    const pathname = resolved.pathname.endsWith("/") || path.extname(resolved.pathname) ? resolved.pathname : `${resolved.pathname}/`;
    if (!knownRoutes.has(pathname) && !pathname.startsWith("/assets/") && !pathname.startsWith("/downloads/") && !pathname.startsWith("/.netlify/")) internalLinkProblems.push(`${page.url} → ${pathname}`);
  }
  const assetTags = page.html.match(/<(?:img|script|link)\b[^>]*>/gi) || [];
  for (const tag of assetTags) {
    const source = attr(tag, "src") || attr(tag, "href");
    if (!source || source.startsWith("http") || source.startsWith("data:")) continue;
    const resolved = new URL(source, page.url);
    const original = resolved.pathname === "/.netlify/images" ? resolved.searchParams.get("url") : resolved.pathname;
    if (original && (/^\/(assets|downloads)\//.test(original) || /\.(css|js|webmanifest)$/i.test(original))) assetPaths.add(original);
  }
}

const missingAssets = [];
for (const assetPath of assetPaths) {
  try { await fs.access(path.join(publicRoot, assetPath)); }
  catch { missingAssets.push(assetPath); }
}

const liveResults = new Map();
if (runLive) {
  for (let index = 0; index < inventoryUrls.length; index += 8) {
    const batch = inventoryUrls.slice(index, index + 8);
    const results = await Promise.all(batch.map(fetchCheck));
    batch.forEach((url, offset) => liveResults.set(url, results[offset]));
  }
}

const reportLines = [
  "# MyDesertGuide.com Technical SEO Audit",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "## Audit summary",
  "",
  `- Sitemap URLs: ${sitemapUrls.length}`,
  `- Public routes inventoried: ${pages.length}`,
  `- Indexable public routes: ${pages.filter((page) => page.indexable).length}`,
  `- Noindex public utility routes: ${pages.filter((page) => !page.indexable).length}`,
  `- Duplicate SEO titles: ${duplicateTitles.length}`,
  `- Duplicate meta descriptions: ${duplicateDescriptions.length}`,
  `- Internal link target problems: ${new Set(internalLinkProblems).size}`,
  `- Missing local assets: ${missingAssets.length}`,
  `- Live non-200 pages: ${runLive ? [...liveResults.values()].filter((result) => result.status !== 200).length : "not tested"}`,
  "",
  "## Public page inventory",
  "",
  "| URL | Page purpose | SEO title | Meta description | H1 | Indexable | Issue found | Recommended improvement |",
  "|---|---|---|---|---|---:|---|---|",
];
for (const page of pages) {
  const live = liveResults.get(page.url);
  const issues = [...page.issues];
  if (live && live.status !== 200) issues.push(`Live HTTP ${live.status}`);
  if (live?.xRobots && /noindex/i.test(live.xRobots) && page.indexable) issues.push(`Blocking X-Robots-Tag: ${live.xRobots}`);
  reportLines.push(`| ${table(page.url)} | ${table(purposeFor(page.url, page.h1))} | ${table(page.title)} | ${table(page.description)} | ${table(page.h1)} | ${page.indexable ? "Yes" : "No"} | ${table(issues.join("; ") || "None found")} | ${table(page.recommendation)} |`);
}
reportLines.push("", "## Duplicate metadata", "", duplicateTitles.length ? duplicateTitles.map(([value, urls]) => `- Title \`${value}\`: ${urls.join(", ")}`).join("\n") : "- No duplicate titles.", "", duplicateDescriptions.length ? duplicateDescriptions.map(([value, urls]) => `- Description \`${value}\`: ${urls.join(", ")}`).join("\n") : "- No duplicate descriptions.", "", "## Internal-link problems", "", ...([...new Set(internalLinkProblems)].length ? [...new Set(internalLinkProblems)].map((item) => `- ${item}`) : ["- No unresolved internal page links found."]), "", "## Missing local assets", "", ...(missingAssets.length ? missingAssets.map((item) => `- ${item}`) : ["- No missing local image, stylesheet, script, download, icon or manifest assets found."]), "");

await fs.writeFile(path.join(repoRoot, "SEO_AUDIT_REPORT.md"), `${reportLines.join("\n")}\n`);
console.log(JSON.stringify({ pages: pages.length, sitemapUrls: sitemapUrls.length, indexable: pages.filter((page) => page.indexable).length, pagesWithIssues: pages.filter((page) => page.issues.length).length, duplicateTitles: duplicateTitles.length, duplicateDescriptions: duplicateDescriptions.length, internalLinkProblems: new Set(internalLinkProblems).size, missingAssets: missingAssets.length, liveNon200: runLive ? [...liveResults.values()].filter((result) => result.status !== 200).length : null }, null, 2));
