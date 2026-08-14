import { GUIDE_CONFIG } from "./_analytics/config.mjs";
import {
  jsonResponse,
  optionsResponse,
  readJson,
  requireAdmin,
} from "./_analytics/http.mjs";
import { previousCompletedLocalDate } from "./_analytics/time.mjs";
import { sendDailyReport } from "./_analytics/report-service.mjs";

export default async function handler(request) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  const authorization = requireAdmin(request);
  if (!authorization.ok) return authorization.response;

  const body = await readJson(request);
  const date = body.date || previousCompletedLocalDate(new Date());
  const recipient = body.recipient || GUIDE_CONFIG.recipient;

  try {
    const result = await sendDailyReport({
      date,
      recipient,
      test: true,
      force: true,
    });
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    console.error("analytics-send-report failed", error);
    return jsonResponse({ ok: false, error: error.message }, 500);
  }
}
