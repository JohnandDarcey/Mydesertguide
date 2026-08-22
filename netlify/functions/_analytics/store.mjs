import { getStore } from "@netlify/blobs";

const store = getStore({
  name: "my-desert-guide-analytics",
  consistency: "strong",
});

const MAX_UPDATE_ATTEMPTS = 12;

function fallbackValue(fallback) {
  const value = typeof fallback === "function" ? fallback() : fallback;
  return value == null ? value : structuredClone(value);
}

function retryDelay(attempt) {
  return new Promise((resolve) => setTimeout(resolve, Math.min(10 * 2 ** attempt, 250)));
}

export async function getJSON(key, fallback) {
  const value = await store.get(key, { type: "json", consistency: "strong" });
  if (value == null) {
    return fallbackValue(fallback);
  }
  return value;
}

export async function updateJSON(key, fallback, update) {
  for (let attempt = 0; attempt < MAX_UPDATE_ATTEMPTS; attempt += 1) {
    const entry = await store.getWithMetadata(key, {
      type: "json",
      consistency: "strong",
    });
    const current = entry == null ? fallbackValue(fallback) : entry.data;
    const next = await update(current);
    const result = entry?.etag
      ? await store.setJSON(key, next, { onlyIfMatch: entry.etag })
      : await store.setJSON(key, next, { onlyIfNew: true });

    if (result.modified) return next;
    await retryDelay(attempt);
  }

  throw new Error(`Could not update analytics blob after ${MAX_UPDATE_ATTEMPTS} attempts: ${key}`);
}

export async function setJSON(key, value) {
  await store.setJSON(key, value);
  return value;
}

export async function putReportHistory(key, value) {
  return setJSON(`reports/${key}`, value);
}

export async function getReportHistory(key) {
  return getJSON(`reports/${key}`, null);
}
