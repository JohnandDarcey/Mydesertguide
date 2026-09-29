import { jsonResponse, optionsResponse, readJson } from "./_analytics/http.mjs";
import { registerNewsletterSignup } from "./_newsletter/follow-up-boss.mjs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value, limit) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function allowedOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    const configuredHost = process.env.URL ? new URL(process.env.URL).hostname.toLowerCase() : "";
    return host === "mydesertguide.com" || host === "www.mydesertguide.com" || host === configuredHost || host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return optionsResponse();
  if (request.method !== "POST") return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  if (!allowedOrigin(request)) return jsonResponse({ ok: false, error: "Request not allowed." }, 403);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 8_000) return jsonResponse({ ok: false, error: "Submission is too large." }, 413);

  const payload = await readJson(request);
  if (clean(payload.company, 120)) return jsonResponse({ ok: true });

  const firstName = clean(payload.firstName, 80);
  const email = clean(payload.email, 254).toLowerCase();
  if (!firstName || !EMAIL_PATTERN.test(email)) {
    return jsonResponse({ ok: false, error: "Please enter your first name and a valid email address." }, 400);
  }

  try {
    await registerNewsletterSignup({ firstName, email });
    return jsonResponse({ ok: true, firstName });
  } catch (error) {
    console.error("newsletter signup failed", { code: error?.code || "UNKNOWN", status: error?.status || 500 });
    return jsonResponse(
      { ok: false, error: "We couldn't add you right now. Please try again in a moment." },
      error?.status === 503 ? 503 : 502,
    );
  }
}
