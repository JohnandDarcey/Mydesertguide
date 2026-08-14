import { jsonResponse } from "./_analytics/http.mjs";
import {
  previousCompletedLocalDate,
  shouldRunPacificMorning,
} from "./_analytics/time.mjs";
import { sendDailyReport } from "./_analytics/report-service.mjs";

export const config = {
  // Netlify cron uses UTC. 15:00 UTC is 8 AM Pacific during daylight time,
  // and 16:00 UTC is 8 AM Pacific during standard time.
  schedule: "0 15,16 * * *",
};

export default async function handler() {
  const now = new Date();
  if (!shouldRunPacificMorning(now)) {
    return jsonResponse({
      ok: true,
      skipped: true,
      reason: "not-8am-pacific",
      checkedAt: now.toISOString(),
    });
  }

  const date = previousCompletedLocalDate(now);
  try {
    const result = await sendDailyReport({ date });
    return jsonResponse({ ok: true, ...result });
  } catch (error) {
    console.error("analytics-daily-report failed", error);
    return jsonResponse({ ok: false, error: error.message }, 500);
  }
}
