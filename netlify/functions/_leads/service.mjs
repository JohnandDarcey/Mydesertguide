import crypto from "node:crypto";
import { GUIDE_CONFIG } from "../_analytics/config.mjs";
import { sendEmail } from "../_analytics/email-provider.mjs";
import { recordEvent } from "../_analytics/metrics.mjs";
import { saveLead, updateLead } from "./store.mjs";

const INTERESTS = {
  buying: "Buying a desert home",
  selling: "Selling a desert home",
  relocating: "Relocating to the desert",
  exploring: "Just exploring",
  general: "A general real estate question",
};
const TIMEFRAMES = {
  now: "As soon as possible",
  "3-months": "Within 3 months",
  "6-months": "Within 6 months",
  "12-months": "Within a year",
  researching: "Still researching",
};
const BUYER_GUIDE_PATH = "/assets/downloads/darcey-first-time-homebuyer-2026.pdf";

function clean(value, max = 200) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 180;
}

function validPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function safeAttribution(value = {}) {
  const recentPages = Array.isArray(value.recentPages)
    ? value.recentPages.slice(-5).map((item) => ({
      path: clean(item?.path, 180),
      title: clean(item?.title, 160),
      category: clean(item?.category, 80),
      placeName: clean(item?.placeName, 120),
    }))
    : [];
  return {
    source: clean(value.source || "Direct", 80),
    medium: clean(value.medium, 80),
    campaign: clean(value.campaign, 100),
    content: clean(value.content, 100),
    referrerHost: clean(value.referrerHost, 120),
    landingPath: clean(value.landingPath || "/", 180),
    recentPages,
  };
}

function notificationEmail(lead) {
  const recent = lead.attribution.recentPages.length
    ? lead.attribution.recentPages.map((page) => `${page.placeName || page.title || page.path} (${page.path})`).join("\n")
    : "No prior guide pages recorded";
  const source = [lead.attribution.source, lead.attribution.medium].filter(Boolean).join(" / ") || "Direct";
  const campaign = lead.attribution.campaign || "None";
  const guideRequest = lead.buyerGuideRequested ? "Yes" : "No";
  const rows = [
    ["Interest", lead.interestLabel],
    ["Timeframe", lead.timeframeLabel],
    ["Name", lead.name],
    ["Email", lead.email || "Not provided"],
    ["Phone", lead.phone || "Not provided"],
    ["First-time buyer guide", guideRequest],
    ["Source", source],
    ["Campaign", campaign],
    ["Landing page", lead.attribution.landingPath],
  ];
  const htmlRows = rows.map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;color:#756d63;font:600 11px Arial;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;color:#111;font:15px Arial;">${escapeHtml(value)}</td></tr>`).join("");
  const html = `<!doctype html><html><body style="margin:0;background:#eee7dd;padding:24px 10px;"><div style="max-width:680px;margin:auto;background:#fffdf8;border-radius:18px;overflow:hidden;"><div style="background:#050505;color:#fff;padding:30px;"><div style="font:600 11px Arial;letter-spacing:2px;text-transform:uppercase;color:#d9ccbc;">My Desert Guide</div><h1 style="font:400 38px Georgia;margin:8px 0 0;">New confirmed inquiry</h1></div><div style="padding:26px 30px;"><table style="border-collapse:collapse;width:100%;">${htmlRows}</table><div style="border-top:1px solid #dfd4c5;margin-top:18px;padding-top:18px;"><div style="font:600 11px Arial;letter-spacing:1px;text-transform:uppercase;color:#756d63;">Message</div><p style="font:16px/1.6 Georgia;color:#111;white-space:pre-wrap;">${escapeHtml(lead.message || "No message provided")}</p></div><div style="border-top:1px solid #dfd4c5;margin-top:18px;padding-top:18px;"><div style="font:600 11px Arial;letter-spacing:1px;text-transform:uppercase;color:#756d63;">Recent guide activity</div><p style="font:14px/1.6 Arial;color:#333;white-space:pre-wrap;">${escapeHtml(recent)}</p></div><p style="font:12px/1.5 Arial;color:#756d63;margin-top:24px;">Lead ID: ${escapeHtml(lead.id)} · Submitted ${escapeHtml(lead.submittedAt)}</p></div></div></body></html>`;
  const text = [
    "NEW MY DESERT GUIDE INQUIRY",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    `Message: ${lead.message || "No message provided"}`,
    "Recent guide activity:",
    recent,
    `Lead ID: ${lead.id}`,
  ].join("\n");
  return { html, text };
}

function buyerGuideEmail(name) {
  const url = `${GUIDE_CONFIG.siteUrl}${BUYER_GUIDE_PATH}`;
  const firstName = clean(name, 80).split(" ")[0] || "there";
  const html = `<!doctype html><html><body style="margin:0;background:#eee7dd;padding:24px 10px;"><div style="max-width:640px;margin:auto;background:#fffdf8;border-radius:18px;overflow:hidden;"><div style="background:#050505;color:#fff;padding:30px;"><div style="font:600 11px Arial;letter-spacing:2px;text-transform:uppercase;color:#d9ccbc;">Darcey Deetz · My Desert Guide</div><h1 style="font:400 38px Georgia;margin:8px 0 0;">Your First-Time Homebuyer Guide</h1></div><div style="padding:28px 30px;font:15px/1.65 Arial;color:#2e2925;"><p>Hi ${escapeHtml(firstName)},</p><p>Here is the first-time homebuyer guide you requested. It covers the major steps, common questions, and a practical roadmap to homeownership.</p><p><a href="${escapeHtml(url)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 20px;border-radius:8px;font:600 12px Arial;letter-spacing:1px;text-transform:uppercase;">Open Your Buyer Guide</a></p><p>If you have questions about buying in Palm Springs or anywhere in the Coachella Valley, just reply to this email or call me at 760-808-1449.</p><p>Darcey Deetz<br>Palm Springs &amp; Coachella Valley Realtor®<br>CA DRE 01374659</p></div></div></body></html>`;
  const text = `Hi ${firstName},\n\nHere is the first-time homebuyer guide you requested:\n${url}\n\nIf you have questions about buying in Palm Springs or anywhere in the Coachella Valley, reply to this email or call 760-808-1449.\n\nDarcey Deetz\nCA DRE 01374659`;
  return { html, text, url };
}

export async function submitLead(payload, request, context) {
  if (clean(payload.company, 100)) return { ok: true, accepted: true };
  const startedAt = Number(payload.startedAt || 0);
  if (!startedAt || Date.now() - startedAt < 800 || Date.now() - startedAt > 24 * 60 * 60 * 1000) {
    return { ok: false, status: 400, error: "Please refresh the page and try again." };
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 180).toLowerCase();
  const phone = clean(payload.phone, 40);
  const interest = Object.hasOwn(INTERESTS, payload.interest) ? payload.interest : "";
  const timeframe = Object.hasOwn(TIMEFRAMES, payload.timeframe) ? payload.timeframe : "researching";
  if (name.length < 2) return { ok: false, status: 400, error: "Please enter your name." };
  if (!interest) return { ok: false, status: 400, error: "Please tell us how Darcey can help." };
  if (!email && !phone) return { ok: false, status: 400, error: "Please provide an email address or phone number." };
  if (email && !validEmail(email)) return { ok: false, status: 400, error: "Please enter a valid email address." };
  if (phone && !validPhone(phone)) return { ok: false, status: 400, error: "Please enter a valid phone number." };
  if (payload.consent !== true) return { ok: false, status: 400, error: "Please confirm that Darcey may contact you." };

  const submittedAt = new Date().toISOString();
  const lead = {
    id: crypto.randomUUID(),
    guideId: GUIDE_CONFIG.guideId,
    profileId: GUIDE_CONFIG.profileId,
    submittedAt,
    name,
    email,
    phone,
    interest,
    interestLabel: INTERESTS[interest],
    timeframe,
    timeframeLabel: TIMEFRAMES[timeframe],
    message: clean(payload.message, 1500),
    buyerGuideRequested: Boolean(payload.buyerGuideRequested && email && interest === "buying"),
    attribution: safeAttribution(payload.attribution),
    notificationStatus: "pending",
    resourceStatus: "not_requested",
  };

  const stored = await saveLead(lead);
  const analyticsVisitorId = clean(payload.visitorId, 120) || `lead_${lead.id}`;
  await recordEvent({
    eventName: "lead_form_submitted",
    visitorId: analyticsVisitorId,
    sessionId: clean(payload.sessionId, 120),
    path: clean(payload.path || "/", 180),
    referrer: clean(payload.referrer, 300),
    leadType: interest,
    leadSource: lead.attribution.source,
    leadOrigin: lead.attribution.landingPath,
    category: "Real Estate",
  }, request, context).catch((error) => console.error("lead analytics failed", error));

  const notification = notificationEmail(lead);
  try {
    const sent = await sendEmail({
      from: GUIDE_CONFIG.fromEmail,
      to: GUIDE_CONFIG.leadRecipient,
      replyTo: email || undefined,
      subject: `New My Desert Guide lead — ${lead.interestLabel} — ${lead.name}`,
      html: notification.html,
      text: notification.text,
    });
    lead.notificationStatus = "sent";
    lead.notificationMessageId = sent?.id || null;
    lead.notifiedAt = new Date().toISOString();
  } catch (error) {
    lead.notificationStatus = "failed";
    lead.notificationError = clean(error.message, 300);
    console.error("lead notification failed", error);
  }

  let resourceUrl = "";
  if (lead.buyerGuideRequested) {
    const resource = buyerGuideEmail(name);
    resourceUrl = resource.url;
    try {
      const sent = await sendEmail({
        from: GUIDE_CONFIG.fromEmail,
        to: email,
        replyTo: "darcey@darceydeetz.com",
        subject: "Your First-Time Homebuyer Guide from Darcey Deetz",
        html: resource.html,
        text: resource.text,
      });
      lead.resourceStatus = "sent";
      lead.resourceMessageId = sent?.id || null;
      await recordEvent({
        eventName: "buyer_guide_requested",
        visitorId: analyticsVisitorId,
        sessionId: clean(payload.sessionId, 120),
        path: clean(payload.path || "/", 180),
        category: "Real Estate",
      }, request, context).catch((error) => console.error("buyer guide analytics failed", error));
    } catch (error) {
      lead.resourceStatus = "failed";
      lead.resourceError = clean(error.message, 300);
      console.error("buyer guide email failed", error);
    }
  }

  await updateLead(stored.key, lead);
  return {
    ok: true,
    accepted: true,
    leadId: lead.id,
    notificationStatus: lead.notificationStatus,
    resourceStatus: lead.resourceStatus,
    resourceUrl,
  };
}
