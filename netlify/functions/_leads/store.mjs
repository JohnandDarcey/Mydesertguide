import { getStore } from "@netlify/blobs";

const store = getStore({ name: "my-desert-guide-leads" });

export async function saveLead(lead) {
  const key = `leads/${lead.submittedAt.slice(0, 10)}/${Date.parse(lead.submittedAt)}-${lead.id}.json`;
  await store.setJSON(key, lead);
  return { key, lead };
}

export async function updateLead(key, lead) {
  await store.setJSON(key, lead);
  return lead;
}

export async function recentLeads(limit = 20) {
  const result = await store.list({ prefix: "leads/" });
  const keys = result.blobs
    .map((blob) => blob.key)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, Math.max(1, Math.min(50, limit)));
  const leads = await Promise.all(keys.map((key) => store.get(key, { type: "json" })));
  return leads.filter(Boolean);
}
