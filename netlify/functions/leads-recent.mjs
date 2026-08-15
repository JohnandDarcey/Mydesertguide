import { jsonResponse, optionsResponse, requireAdmin } from "./_analytics/http.mjs";
import { recentLeads } from "./_leads/store.mjs";

export default async function handler(request) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "GET") return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  const authorization = requireAdmin(request);
  if (!authorization.ok) return authorization.response;
  try {
    return jsonResponse({ ok: true, leads: await recentLeads(20) });
  } catch (error) {
    console.error("leads-recent failed", error);
    return jsonResponse({ ok: false, error: "Recent leads could not be loaded." }, 500);
  }
}
