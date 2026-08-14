import { jsonResponse, optionsResponse, readJson } from "./_analytics/http.mjs";
import { recordEvent } from "./_analytics/metrics.mjs";

export default async function handler(request, context) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  const payload = await readJson(request);
  try {
    const result = await recordEvent(payload, request, context);
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    console.error("analytics-collect failed", error);
    return jsonResponse({ ok: false, error: "Analytics event could not be stored." }, 500);
  }
}
