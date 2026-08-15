import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../outputs/desert-insider");
const htmlFiles = [];

async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.name === "index.html") htmlFiles.push(target);
  }
}

await walk(root);
const urls = new Set();
for (const file of htmlFiles) {
  const html = await fs.readFile(file, "utf8");
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1], "https://mydesertguide.com/");
      if (["http:", "https:"].includes(url.protocol) && url.origin !== "https://mydesertguide.com") urls.add(url.href);
    } catch { /* Invalid links are reported by the page inventory's internal-link check. */ }
  }
}

async function check(url) {
  const options = { method: "HEAD", redirect: "follow", headers: { "user-agent": "Mozilla/5.0 MyDesertGuide link audit" }, signal: AbortSignal.timeout(12000) };
  try {
    let response = await fetch(url, options);
    if (response.status === 405) response = await fetch(url, { ...options, method: "GET" });
    return { url, status: response.status, finalUrl: response.url };
  } catch (error) {
    return { url, status: 0, error: error.name };
  }
}

const list = [...urls];
const results = [];
for (let index = 0; index < list.length; index += 10) results.push(...await Promise.all(list.slice(index, index + 10).map(check)));

const broken = results.filter(({ status }) => status === 404 || status === 410);
const blockedOrUnavailable = results.filter(({ status }) => status === 0 || status === 401 || status === 403 || status === 429 || status >= 500);
console.log(JSON.stringify({ tested: results.length, broken, blockedOrUnavailable: blockedOrUnavailable.length }, null, 2));
if (broken.length) process.exitCode = 1;
