import { jsonResponse, optionsResponse, readJson } from "./_analytics/http.mjs";
import { submitLead } from "./_leads/service.mjs";

export default async function handler(request, context) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 25_000) return jsonResponse({ ok: false, error: "Submission is too large." }, 413);
  try {
    const result = await submitLead(await readJson(request), request, context);
    if (!result.ok) return jsonResponse({ ok: false, error: result.error }, result.status || 400);
    return jsonResponse(result);
  } catch (error) {
    console.error("lead-submit failed", error);
    return jsonResponse({ ok: false, error: "Your inquiry could not be saved. Please call or text Darcey at 760-808-1449." }, 500);
  }
}
