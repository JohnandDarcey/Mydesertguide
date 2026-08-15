import { dashboardUrl, GUIDE_CONFIG } from "./config.mjs";
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

function number(value = 0) {
  return nf.format(Number(value || 0));
}

function contactTotal(totals = {}) {
  return Number(totals.darceyTextClicks || 0) +
    Number(totals.darceyCallClicks || 0) +
    Number(totals.darceyEmailClicks || 0);
}

function metric(value, label) {
  return `<td class="metric" width="50%" style="padding:7px;">
    <div style="background:#fffdf8;border:1px solid #dfd4c5;border-radius:14px;padding:22px 18px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:42px;font-weight:400;color:#111111;">${number(value)}</div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;text-transform:uppercase;letter-spacing:1.6px;color:#756d63;margin-top:7px;">${escapeHtml(label)}</div>
    </div>
  </td>`;
}

function trendChart(trend = []) {
  const max = Math.max(1, ...trend.map((item) => Number(item.guideViews || 0)));
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
    <tr>${trend.map((item) => {
      const height = Math.max(6, Math.round((Number(item.guideViews || 0) / max) * 78));
      return `<td valign="bottom" style="height:92px;padding:0 4px;text-align:center;">
        <div style="display:inline-block;width:100%;max-width:30px;height:${height}px;background:#b18b62;border-radius:5px 5px 2px 2px;"></div>
      </td>`;
    }).join("")}</tr>
    <tr>${trend.map((item) => `<td style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#81786d;text-align:center;padding-top:7px;">${weekdayLabel(item.date)}</td>`).join("")}</tr>
  </table>`;
}

function categoryBars(categories = []) {
  const items = categories.slice(0, 4);
  const max = Math.max(1, ...items.map((item) => Number(item.views || 0)));
  if (!items.length) return `<p style="font-family:Arial,Helvetica,sans-serif;color:#756d63;margin:0;">No category activity was recorded.</p>`;
  return items.map((item) => {
    const width = Math.max(4, Math.round((Number(item.views || 0) / max) * 100));
    return `<div style="margin-top:15px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2e2925;">${escapeHtml(item.name)}</td>
        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2e2925;">${number(item.views)}</td>
      </tr></table>
      <div style="height:8px;background:#ebe3d8;border-radius:4px;overflow:hidden;margin-top:7px;"><div style="height:8px;width:${width}%;background:#111111;border-radius:4px;"></div></div>
    </div>`;
  }).join("");
}

function placeList(places = []) {
  if (!places.length) return `<p style="font-family:Arial,Helvetica,sans-serif;color:#756d63;margin:0;">Individual recommendations will appear here as visitors explore them.</p>`;
  return places.slice(0, 3).map((place, index) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:${index ? "1px solid #e7dfd4" : "0"};">
    <tr>
      <td style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#b18b62;width:34px;padding:13px 0;">${index + 1}</td>
      <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#25211e;padding:13px 8px;"><strong>${escapeHtml(place.name)}</strong><br><span style="font-size:11px;color:#81786d;">${escapeHtml(place.category || "Guide")}</span></td>
      <td align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#111111;padding:13px 0;">${number(place.views)}</td>
    </tr>
  </table>`).join("");
}

function quietMessage(report) {
  const totals = report.day.totals;
  const topCategory = report.day.topCategories[0];
  if (!totals.guideViews && !totals.placeViews && !contactTotal(totals) && !Number(totals.leadSubmissions || 0)) {
    return "Your guide didn't record visitor activity yesterday, but we're continuing to track its performance.";
  }
  if (Number(totals.guideViews || 0) < 10) {
    return `Your guide had a quieter day with ${number(totals.guideViews)} visit${totals.guideViews === 1 ? "" : "s"} and ${number(totals.uniqueVisitors)} visitor${totals.uniqueVisitors === 1 ? "" : "s"}.${topCategory ? ` ${topCategory.name} was the most explored section.` : ""}`;
  }
  return `Your guide welcomed ${number(totals.uniqueVisitors)} visitor${totals.uniqueVisitors === 1 ? "" : "s"} and recorded ${number(totals.placeViews)} recommendation view${totals.placeViews === 1 ? "" : "s"} yesterday.`;
}

export function renderDailyReportEmail(report) {
  const totals = report.day.totals;
  const displayDate = formatDisplayDate(report.date, true);
  const contacts = contactTotal(totals);
  const confirmedLeads = Number(totals.leadSubmissions || 0);
  const recentAverage = Math.round(Number(report.last7.totals.guideViews || 0) / 7);
  const isSilent = !totals.guideViews && !totals.placeViews && !contacts && !confirmedLeads;
  const homeSearches = Number(totals.realEstateHomeSearchClicks || totals.darceyWebsiteClicks || 0);
  const talkClicks = Number(totals.realEstateContactClicks || 0);
  const realEstate = homeSearches + talkClicks;
  const subject = `Your Desert Guide Daily Report — ${displayDate}`;

  const detailSections = isSilent ? "" : `
    <tr><td style="padding:0 28px 22px;"><div style="background:#ffffff;border:1px solid #dfd4c5;border-radius:16px;padding:22px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.7px;text-transform:uppercase;color:#81786d;">Yesterday's Activity</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:32px;color:#111111;margin-top:7px;">${number(totals.guideViews)} views yesterday <span style="color:#b18b62;">·</span> 7-day average ${number(recentAverage)}</div>
      <div style="margin-top:16px;">${trendChart(report.trend)}</div>
    </div></td></tr>
    <tr><td style="padding:0 28px 22px;"><div style="background:#ffffff;border:1px solid #dfd4c5;border-radius:16px;padding:22px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.7px;text-transform:uppercase;color:#81786d;">What People Loved</div>
      ${categoryBars(report.day.topCategories)}
    </div></td></tr>
    <tr><td style="padding:0 28px 22px;"><div style="background:#ffffff;border:1px solid #dfd4c5;border-radius:16px;padding:22px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.7px;text-transform:uppercase;color:#81786d;">Most Popular Places Yesterday</div>
      <div style="margin-top:8px;">${placeList(report.day.topPlaces)}</div>
    </div></td></tr>
    <tr><td style="padding:0 28px 22px;"><div style="background:#111111;border-radius:16px;padding:22px;color:#ffffff;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.7px;text-transform:uppercase;color:#d9ccbc;">People Connected With You</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;"><tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;">Text Darcey<br><strong style="font-family:Georgia,serif;font-size:28px;font-weight:400;">${number(totals.darceyTextClicks)}</strong></td>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;">Call Darcey<br><strong style="font-family:Georgia,serif;font-size:28px;font-weight:400;">${number(totals.darceyCallClicks)}</strong></td>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#ffffff;">Email Darcey<br><strong style="font-family:Georgia,serif;font-size:28px;font-weight:400;">${number(totals.darceyEmailClicks)}</strong></td>
      </tr></table>
      <div style="border-top:1px solid #4b4540;margin-top:15px;padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#d9ccbc;"><strong style="color:#ffffff;">${number(contacts)}</strong> total contact action${contacts === 1 ? "" : "s"}</div>
    </div></td></tr>
    ${(realEstate || confirmedLeads) ? `<tr><td style="padding:0 28px 22px;"><div style="background:#f2e7d7;border:1px solid #d8c5aa;border-radius:16px;padding:22px;"><div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.7px;text-transform:uppercase;color:#756d63;">Real Estate Results</div><div style="font-family:Georgia,serif;font-size:25px;line-height:32px;margin-top:8px;">${number(confirmedLeads)} confirmed lead${confirmedLeads === 1 ? "" : "s"}, ${number(homeSearches)} home-search click${homeSearches === 1 ? "" : "s"}, and ${number(talkClicks)} conversation CTA click${talkClicks === 1 ? "" : "s"}</div></div></td></tr>` : ""}
  `;

  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
    @media (max-width:620px){.wrap{width:100%!important}.metric{display:block!important;width:100%!important}.pad{padding-left:16px!important;padding-right:16px!important}}
  </style></head><body style="margin:0;background:#eee7dd;padding:0;">
    <div style="display:none;max-height:0;overflow:hidden;">Here's how your Desert Guide performed yesterday.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eee7dd;"><tr><td align="center" style="padding:22px 8px;">
      <table class="wrap" role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:680px;max-width:680px;background:#fbf7ef;border-collapse:separate;border-spacing:0;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#050505;padding:34px 28px;text-align:center;color:#ffffff;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#d9ccbc;">My Desert Guide</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:42px;line-height:48px;font-weight:400;margin-top:7px;">Good morning, Darcey.</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#d9ccbc;margin-top:10px;">Here's how your Desert Guide performed yesterday.<br>${escapeHtml(displayDate)}</div>
        </td></tr>
        <tr><td class="pad" style="padding:25px 21px 10px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${metric(totals.guideViews,"Guide Views")}${metric(totals.uniqueVisitors,"Visitors")}</tr><tr>${metric(totals.placeViews,"Places Viewed")}${metric(confirmedLeads,"Confirmed Leads")}</tr></table></td></tr>
        <tr><td style="padding:5px 28px 22px;"><div style="background:#f2e7d7;border-left:3px solid #b18b62;padding:18px 19px;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:29px;color:#2e2925;">${escapeHtml(quietMessage(report))}</div></td></tr>
        ${detailSections}
        <tr><td style="padding:4px 28px 32px;text-align:center;"><a href="${escapeHtml(dashboardUrl())}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;padding:15px 24px;border-radius:8px;">View Full Analytics</a><div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:16px;color:#81786d;margin-top:18px;">${escapeHtml(GUIDE_CONFIG.realtorName)} · ${escapeHtml(GUIDE_CONFIG.realtorDre)}</div></td></tr>
      </table>
    </td></tr></table>
  </body></html>`;

  const text = [
    `Good morning, Darcey.`,
    `Here's how your Desert Guide performed yesterday — ${displayDate}.`,
    "",
    `Guide Views: ${number(totals.guideViews)}`,
    `Visitors: ${number(totals.uniqueVisitors)}`,
    `Places Viewed: ${number(totals.placeViews)}`,
    `People Connected: ${number(contacts)}`,
    `Confirmed Leads: ${number(confirmedLeads)}`,
    "",
    quietMessage(report),
    ...report.day.topPlaces.slice(0, 3).map((place, index) => `${index + 1}. ${place.name} — ${number(place.views)} views`),
    "",
    `Text Darcey: ${number(totals.darceyTextClicks)}`,
    `Call Darcey: ${number(totals.darceyCallClicks)}`,
    `Email Darcey: ${number(totals.darceyEmailClicks)}`,
    `View Full Analytics: ${dashboardUrl()}`,
  ].join("\n");

  return { subject, html, text, insight: quietMessage(report) };
}
