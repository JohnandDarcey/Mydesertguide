import { getStore } from "@netlify/blobs";

const store = getStore({ name: "my-desert-guide-analytics" });

export async function getJSON(key, fallback) {
  const value = await store.get(key, { type: "json" });
  if (value == null) {
    return typeof fallback === "function" ? fallback() : structuredClone(fallback);
  }
  return value;
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
