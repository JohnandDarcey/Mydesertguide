import {
  categoryImage,
  dashboardUrl,
  GUIDE_CONFIG,
  imageUrl,
} from "./config.mjs";
import { formatDisplayDate, shortDisplayDate, weekdayLabel } from "./time.mjs";

const nf = new Intl.NumberFormat("en-US");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value = 0) {
  return nf.format(Number(value || 0));
}

function changeLine(current = 0, previous = 0) {
  if (!previous && !current) return "No change from the day before";
  if (!previous && current) return "New activity vs. the day before";

  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return "Even with the day before";
  return `${percent > 0 ? "Up" : "Down"} ${Math.abs(percent)}% vs. the day before`;
}

function buildInsight(report) {
  const totals = report.day.totals;
  const topCategory = report.day.topCategories[0];
  const topPlace = report.day.topPlaces[0];
  const previousViews = report.previousDay.totals.guideViews;

  if (!totals.guideViews) {
    return `No guide visits were recorded on ${formatDisplayDate(report.date)}. The 7-day view stays useful for context.`;
  }

  if (topCategory && topPlace) {
    return `${topCategory.name} drove the most activity, with ${topPlace.name} leading all individual place views.`;
  }

  if (totals.darceyWebsiteClicks) {
    return `Darcey's real estate website received ${formatNumber(
      totals.darceyWebsiteClicks,
    )} click${totals.darceyWebsiteClicks === 1 ? "" : "s"} from the guide.`;
  }

  if (totals.mapsClicks) {
    return `Visitors used the guide for directions ${formatNumber(
      totals.mapsClicks,
    )} time${totals.mapsClicks === 1 ? "" : "s"}, a good sign they are acting on Darcey's recommendations.`;
  }

  if (totals.guideViews > previousViews) {
    return `Guide views increased from the day before, with ${formatNumber(
      totals.guideViews,
    )} total view${totals.guideViews === 1 ? "" : "s"}.`;
  }

  return `The guide recorded ${formatNumber(totals.guideViews)} view${
    totals.guideViews === 1 ? "" : "s"
  } and ${formatNumber(totals.clientEngagements)} client engagement${
    totals.clientEngagements === 1 ? "" : "s"
  }.`;
}

function metricCard(value, label, accent = "#111111") {
  return `
    <td class="metric-cell" width="50%" style="padding:8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#fbf7ef;border:1px solid #e4dbcc;border-radius:18px;">
        <tr>
          <td style="padding:22px 20px 20px;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:42px;line-height:44px;font-weight:700;color:${accent};letter-spacing:-1px;">${formatNumber(
              value,
            )}</div>
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;text-transform:uppercase;letter-spacing:1.8px;color:#6f675b;margin-top:8px;">${escapeHtml(
              label,
            )}</div>
          </td>
        </tr>
      </table>
    </td>
  `;
}

function compactStat(value, label) {
  return `
    <td width="33.33%" style="padding:0 8px 8px 0;">
      <div style="background:#ffffff;border:1px solid #e7dfd5;border-radius:14px;padding:16px 14px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:30px;color:#111111;font-weight:700;">${formatNumber(
          value,
        )}</div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.4px;color:#7c756d;margin-top:6px;">${escapeHtml(
          label,
        )}</div>
      </div>
    </td>
  `;
}

function trendChart(trend = []) {
  const max = Math.max(1, ...trend.map((item) => Number(item.guideViews || 0)));
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tr>
        ${trend
          .map((item) => {
            const height = Math.max(8, Math.round((Number(item.guideViews || 0) / max) * 92));
            return `
              <td valign="bottom" style="height:118px;padding:0 3px;text-align:center;">
                <div title="${escapeHtml(shortDisplayDate(item.date))}: ${formatNumber(
                  item.guideViews,
                )} views" style="display:inline-block;width:100%;max-width:34px;height:${height}px;background:#111111;border-radius:999px 999px 4px 4px;"></div>
              </td>
            `;
          })
          .join("")}
      </tr>
      <tr>
        ${trend
          .map(
            (item) => `
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:14px;color:#857d72;text-align:center;padding-top:8px;">${escapeHtml(
                weekdayLabel(item.date),
              )}</td>
            `,
          )
          .join("")}
      </tr>
    </table>
  `;
}

function sourceBars(sources = {}) {
  const entries = Object.entries(sources)
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, 4);
  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  if (!total) return "";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:12px;">
      ${entries
        .map(([source, value]) => {
          const percent = Math.round((Number(value || 0) / total) * 100);
          return `
            <tr>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#2f2b26;padding:7px 0;width:120px;">${escapeHtml(
                source,
              )}</td>
              <td style="padding:7px 10px;">
                <div style="height:8px;background:#e6ddd0;border-radius:999px;overflow:hidden;">
                  <div style="width:${percent}%;height:8px;background:#111111;border-radius:999px;"></div>
                </div>
              </td>
              <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#2f2b26;text-align:right;width:44px;">${percent}%</td>
            </tr>
          `;
        })
        .join("")}
    </table>
  `;
}

function topPlaceList(places = []) {
  if (!places.length) {
    return `
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#6a6258;margin:0;">
        No individual place views were recorded for this day yet.
      </p>
    `;
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      ${places
        .slice(0, 3)
        .map((place) => {
          const src = imageUrl(place.image || categoryImage(place.category), 120, 120);
          return `
            <tr>
              <td width="56" style="padding:0 14px 12px 0;">
                <img src="${escapeHtml(src)}" alt="${escapeHtml(
                  place.name,
                )}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border-radius:12px;" />
              </td>
              <td style="padding:0 0 12px;">
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:21px;color:#111111;font-weight:700;">${escapeHtml(
                  place.name,
                )}</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#7a7167;">${formatNumber(
                  place.views,
                )} view${place.views === 1 ? "" : "s"}</div>
              </td>
            </tr>
          `;
        })
        .join("")}
    </table>
  `;
}

function featuredCard(label, title, value, image, alt, supporting) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e4dbcc;border-radius:22px;overflow:hidden;">
      <tr>
        <td>
          <img src="${escapeHtml(image)}" alt="${escapeHtml(
            alt,
          )}" width="640" style="display:block;width:100%;max-height:260px;object-fit:cover;" />
        </td>
      </tr>
      <tr>
        <td style="padding:22px 22px 24px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.9px;color:#857d72;">${escapeHtml(
            label,
          )}</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:34px;color:#111111;font-weight:700;margin-top:8px;">${escapeHtml(
            title,
          )}</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#2f2b26;margin-top:8px;"><strong>${escapeHtml(
            value,
          )}</strong></div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#6a6258;margin-top:10px;">${escapeHtml(
            supporting,
          )}</div>
        </td>
      </tr>
    </table>
  `;
}

export function renderDailyReportEmail(report) {
  const totals = report.day.totals;
  const topCategory = report.day.topCategories[0];
  const topPlace = report.day.topPlaces[0];
  const insight = buildInsight(report);
  const categoryTitle = topCategory?.name || "Guide Activity";
  const categoryViews = topCategory?.views || totals.categoryViews || totals.guideViews;
  const topPlaceTitle = topPlace?.name || "No place leader yet";
  const topPlaceViews = topPlace?.views || 0;
  const contactActions =
    Number(totals.darceyCallClicks || 0) +
    Number(totals.darceyTextClicks || 0) +
    Number(totals.darceyEmailClicks || 0);
  const displayDate = formatDisplayDate(report.date);
  const sevenDayChange = changeLine(
    totals.guideViews,
    report.previousDay.totals.guideViews,
  );
  const categoryFeature = featuredCard(
    "Most Popular Yesterday",
    categoryTitle,
    `${formatNumber(categoryViews)} view${categoryViews === 1 ? "" : "s"}`,
    imageUrl(topCategory?.image || categoryImage(categoryTitle), 900, 520),
    categoryTitle,
    topCategory
      ? `${categoryTitle} was the most explored section of Darcey's guide.`
      : "The guide is ready for the next wave of visitors.",
  );
  const placeFeature = topPlace
    ? featuredCard(
        "Most Viewed Place",
        topPlaceTitle,
        `${formatNumber(topPlaceViews)} view${topPlaceViews === 1 ? "" : "s"} yesterday${
          topPlace.rating ? ` · Darcey Rating ${topPlace.rating}` : ""
        }`,
        imageUrl(topPlace.image || categoryImage(topPlace.category), 900, 520),
        topPlaceTitle,
        "A real place people explored inside the guide.",
      )
    : `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e4dbcc;border-radius:22px;">
        <tr>
          <td style="padding:28px 24px;">
            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.9px;color:#857d72;">Most Viewed Place</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:32px;color:#111111;font-weight:700;margin-top:8px;">No place leader yet</div>
            <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#6a6258;margin:10px 0 0;">When visitors start opening individual recommendations, the top place will appear here with its guide image.</p>
          </td>
        </tr>
      </table>
    `;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(GUIDE_CONFIG.reportName)}</title>
    <style>
      @media only screen and (max-width: 640px) {
        .email-wrap { width: 100% !important; }
        .metric-cell { display: block !important; width: 100% !important; box-sizing: border-box !important; }
        .feature-column { display: block !important; width: 100% !important; box-sizing: border-box !important; padding-right: 0 !important; padding-left: 0 !important; }
        .mobile-stack { display: block !important; width: 100% !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#f2ece3;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(GUIDE_CONFIG.reportSubheading)} for ${escapeHtml(displayDate)}.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2ece3;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:24px 10px;">
          <table class="email-wrap" role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:680px;max-width:680px;border-collapse:separate;border-spacing:0;background:#fffaf2;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="background:#050505;padding:34px 30px 32px;text-align:center;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;letter-spacing:3px;text-transform:uppercase;color:#e8dfd3;">MY DESERT GUIDE</div>
                <div style="font-family:Georgia,'Times New Roman',serif;font-size:48px;line-height:52px;color:#ffffff;font-weight:700;margin-top:8px;">Daily Pulse</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#d8cebf;margin-top:12px;">${escapeHtml(
                  displayDate,
                )}</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#bfb3a3;margin-top:8px;">Here's how Darcey's guide performed yesterday.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 22px 10px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    ${metricCard(totals.guideViews, "Guide Views")}
                    ${metricCard(totals.uniqueVisitors, "Unique Visitors")}
                  </tr>
                  <tr>
                    ${metricCard(totals.clientEngagements, "Client Engagements")}
                    ${metricCard(totals.returningVisitors, "Returning Visitors")}
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 30px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e4dbcc;border-radius:22px;">
                  <tr>
                    <td style="padding:24px 22px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td>
                            <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.9px;color:#857d72;">7-Day View Trend</div>
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:30px;color:#111111;font-weight:700;margin-top:6px;">${escapeHtml(
                              sevenDayChange,
                            )}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top:18px;">
                            ${trendChart(report.trend)}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 24px;">
                ${categoryFeature}
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 24px;">
                ${placeFeature}
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e4dbcc;border-radius:22px;">
                  <tr>
                    <td style="padding:24px 22px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.9px;color:#857d72;">Trending Places</div>
                      <div style="height:14px;"></div>
                      ${topPlaceList(report.day.topPlaces)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#111111;border-radius:22px;">
                  <tr>
                    <td style="padding:24px 22px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.9px;color:#d8cebf;">What Visitors Did</div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px;">
                        <tr>
                          <td class="mobile-stack" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:0 12px 12px 0;width:25%;">
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:32px;font-weight:700;">${formatNumber(
                              totals.mapsClicks,
                            )}</div>
                            <div style="font-size:12px;line-height:18px;color:#d8cebf;margin-top:6px;">Directions Clicks</div>
                          </td>
                          <td class="mobile-stack" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:0 12px 12px 0;width:25%;">
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:32px;font-weight:700;">${formatNumber(
                              totals.businessWebsiteClicks,
                            )}</div>
                            <div style="font-size:12px;line-height:18px;color:#d8cebf;margin-top:6px;">Business Website Clicks</div>
                          </td>
                          <td class="mobile-stack" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:0 12px 12px 0;width:25%;">
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:32px;font-weight:700;">${formatNumber(
                              totals.darceyWebsiteClicks,
                            )}</div>
                            <div style="font-size:12px;line-height:18px;color:#d8cebf;margin-top:6px;">Darcey Website Clicks</div>
                          </td>
                          <td class="mobile-stack" style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;padding:0 0 12px;width:25%;">
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:32px;font-weight:700;">${formatNumber(
                              contactActions,
                            )}</div>
                            <div style="font-size:12px;line-height:18px;color:#d8cebf;margin-top:6px;">Contact Actions</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#fbf7ef;border:1px solid #e4dbcc;border-radius:22px;">
                  <tr>
                    <td style="padding:24px 22px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.9px;color:#857d72;">Yesterday's Insight</div>
                      <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:32px;color:#111111;margin:10px 0 0;">${escapeHtml(
                        insight,
                      )}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #e4dbcc;border-radius:22px;">
                  <tr>
                    <td style="padding:24px 22px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.9px;color:#857d72;">Last 7 Days</div>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px;">
                        <tr>
                          ${compactStat(report.last7.totals.guideViews, "Guide Views")}
                          ${compactStat(report.last7.totals.uniqueVisitors, "Unique Visitors")}
                          ${compactStat(report.last7.totals.clientEngagements, "Client Engagements")}
                        </tr>
                      </table>
                      ${sourceBars(report.last7.sources)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 30px 30px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#6a6258;padding-bottom:20px;text-align:center;">
                      Since analytics began: <strong style="color:#111111;">${formatNumber(
                        report.lifetime.totals.guideViews,
                      )}</strong> total guide views and <strong style="color:#111111;">${formatNumber(
                        report.lifetime.totals.uniqueVisitors,
                      )}</strong> unique visitors.
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="${escapeHtml(
                        dashboardUrl(),
                      )}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;padding:16px 28px;border-radius:999px;">View Full Analytics</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;color:#8a8177;padding-top:18px;text-align:center;">
                      ${escapeHtml(GUIDE_CONFIG.realtorName)} · ${escapeHtml(GUIDE_CONFIG.realtorDre)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `${GUIDE_CONFIG.reportName}`,
    `${GUIDE_CONFIG.reportSubheading}`,
    displayDate,
    "",
    `Guide Views: ${formatNumber(totals.guideViews)}`,
    `Unique Visitors: ${formatNumber(totals.uniqueVisitors)}`,
    `Client Engagements: ${formatNumber(totals.clientEngagements)}`,
    `Returning Visitors: ${formatNumber(totals.returningVisitors)}`,
    "",
    `Insight: ${insight}`,
    "",
    `Top Category: ${categoryTitle} (${formatNumber(categoryViews)} views)`,
    topPlace ? `Top Place: ${topPlaceTitle} (${formatNumber(topPlaceViews)} views)` : "Top Place: none yet",
    "",
    `View Full Analytics: ${dashboardUrl()}`,
  ].join("\n");

  return {
    subject: `${GUIDE_CONFIG.reportName}: ${shortDisplayDate(report.date)}`,
    html,
    text,
    insight,
  };
}
