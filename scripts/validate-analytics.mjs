import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["netlify/functions", "outputs/desert-insider"];
const files = [];

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return collect(path);
      if (/\.(mjs|js)$/.test(entry.name)) files.push(path);
    }),
  );
}

for (const root of roots) {
  await collect(root);
}

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status);
}

console.log(`Checked ${files.length} JavaScript files.`);

const { renderDailyReportEmail } = await import("../netlify/functions/_analytics/email-template.mjs");
const totals = {
  guideViews: 42,
  uniqueVisitors: 31,
  returningVisitors: 8,
  placeViews: 76,
  darceyTextClicks: 2,
  darceyCallClicks: 1,
  darceyEmailClicks: 1,
  darceyWebsiteClicks: 3,
  realEstateHomeSearchClicks: 3,
  leadSubmissions: 2,
};
const report = {
  date: "2026-08-13",
  day: {
    totals,
    topCategories: [{ name: "Food & Drink", views: 18 }],
    topPlaces: [{ name: "Spencer's", category: "Food & Drink", views: 9 }],
  },
  previousDay: { totals: { guideViews: 34 } },
  last7: { totals: { guideViews: 238 }, sources: {} },
  lifetime: { totals: { guideViews: 900, uniqueVisitors: 420 } },
  trend: Array.from({ length: 7 }, (_, index) => ({
    date: `2026-08-${String(7 + index).padStart(2, "0")}`,
    guideViews: 20 + index * 3,
  })),
};
const rendered = renderDailyReportEmail(report);
if (!rendered.subject.startsWith("Your Desert Guide Daily Report —")) {
  throw new Error("Daily report subject is incorrect.");
}
for (const required of ["Good morning, Darcey.", "People Connected With You", "Confirmed Leads", "View Full Analytics"]) {
  if (!rendered.html.includes(required)) throw new Error(`Daily report is missing: ${required}`);
}
const quietRendered = renderDailyReportEmail({
  ...report,
  day: { totals: {}, topCategories: [], topPlaces: [] },
  last7: { totals: {}, sources: {} },
  trend: report.trend.map((item) => ({ ...item, guideViews: 0 })),
});
if (!quietRendered.html.includes("record visitor activity yesterday")) {
  throw new Error("Quiet-day report copy is missing.");
}
console.log("Validated active and quiet daily report templates.");
