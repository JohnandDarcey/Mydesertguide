import { dashboardUrl } from "./_analytics/config.mjs";
import { jsonResponse, optionsResponse, requireAdmin } from "./_analytics/http.mjs";
import { getDashboardSummary } from "./_analytics/metrics.mjs";

export default async function handler(request) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "GET") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  const authorization = requireAdmin(request);
  if (!authorization.ok) return authorization.response;

  try {
    const summary = await getDashboardSummary();
    return jsonResponse({
      ...summary,
      dashboardUrl: dashboardUrl(),
      clientEngagementDefinition: [
        "Darcey website clicks",
        "Darcey call clicks",
        "Darcey text clicks",
        "Darcey email/contact clicks",
        "Google Maps/directions clicks",
        "Favorites saved if that feature exists later",
      ],
    });
  } catch (error) {
    console.error("analytics-summary failed", error);
    return jsonResponse({ ok: false, error: "Analytics summary could not be loaded." }, 500);
  }
}
