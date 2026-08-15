import { jsonResponse, optionsResponse, readJson, requireAdmin } from "./_analytics/http.mjs";
import { setLeadStatus } from "./_leads/store.mjs";

export default async function handler(request) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  const authorization = requireAdmin(request);
  if (!authorization.ok) return authorization.response;
  try {
    const payload = await readJson(request);
    const leadId = String(payload.leadId || "").trim();
    const status = payload.status === "Contacted" ? "Contacted" : "";
    if (!leadId || !status) return jsonResponse({ ok: false, error: "A valid lead and status are required." }, 400);
    const lead = await setLeadStatus(leadId, status);
    if (!lead) return jsonResponse({ ok: false, error: "Lead not found." }, 404);
    return jsonResponse({ ok: true, lead });
  } catch (error) {
    console.error("lead-status failed", error);
    return jsonResponse({ ok: false, error: "The lead status could not be updated." }, 500);
  }
}
