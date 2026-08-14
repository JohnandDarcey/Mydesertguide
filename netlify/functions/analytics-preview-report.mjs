import { jsonResponse, optionsResponse, requireAdmin } from "./_analytics/http.mjs";
import { previousCompletedLocalDate } from "./_analytics/time.mjs";
import { buildDailyReport } from "./_analytics/report-service.mjs";

export default async function handler(request) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  const authorization = requireAdmin(request);
  if (!authorization.ok) return authorization.response;

  const url = new URL(request.url);
  const date = url.searchParams.get("date") || previousCompletedLocalDate(new Date());

  try {
    const { email } = await buildDailyReport(date);
    return jsonResponse({
      ok: true,
      date,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  } catch (error) {
    console.error("analytics-preview-report failed", error);
    return jsonResponse({ ok: false, error: error.message }, 500);
  }
}
