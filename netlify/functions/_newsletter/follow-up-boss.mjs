const FUB_API_BASE = "https://api.followupboss.com/v1";
export const NEWSLETTER_TAG = "My Desert Guide Updates";

export class FollowUpBossError extends Error {
  constructor(code, status = 500) {
    super(code);
    this.name = "FollowUpBossError";
    this.code = code;
    this.status = status;
  }
}

function credentials(env = process.env) {
  const apiKey = String(env.FUB_API_KEY || "").trim();
  const system = String(env.FUB_X_SYSTEM || "My Desert Guide").trim();
  const systemKey = String(env.FUB_X_SYSTEM_KEY || "").trim();

  if (!apiKey) {
    throw new FollowUpBossError("FUB_NOT_CONFIGURED", 503);
  }

  return { apiKey, system, systemKey };
}

function requestHeaders(config) {
  const headers = {
    accept: "application/json",
    authorization: `Basic ${Buffer.from(`${config.apiKey}:`).toString("base64")}`,
    "content-type": "application/json",
    "x-system": config.system,
  };
  if (config.systemKey) headers["x-system-key"] = config.systemKey;
  return headers;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function fubRequest(path, options, fetchImpl, config) {
  let response;
  try {
    response = await fetchImpl(`${FUB_API_BASE}${path}`, {
      ...options,
      headers: { ...requestHeaders(config), ...(options.headers || {}) },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new FollowUpBossError("FUB_TIMEOUT", 504);
    }
    throw new FollowUpBossError("FUB_UNAVAILABLE", 502);
  }

  const body = await parseJson(response);
  if (!response.ok) {
    throw new FollowUpBossError("FUB_REQUEST_FAILED", 502);
  }
  return { status: response.status, body };
}

function personIdFrom(body) {
  const value = body?.id ?? body?.person?.id ?? body?.personId;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function registerNewsletterSignup({ firstName, email }, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const config = credentials(options.env || process.env);
  const event = await fubRequest(
    "/events",
    {
      method: "POST",
      body: JSON.stringify({
        source: "mydesertguide.com",
        system: "My Desert Guide",
        type: "Registration",
        message: "Subscribed to My Desert Guide monthly updates",
        person: {
          firstName,
          emails: [{ value: email }],
        },
      }),
    },
    fetchImpl,
    config,
  );

  if (event.status === 204) throw new FollowUpBossError("FUB_EVENT_IGNORED", 502);
  const personId = personIdFrom(event.body);
  if (!personId) throw new FollowUpBossError("FUB_PERSON_MISSING", 502);

  await fubRequest(
    `/people/${personId}?mergeTags=true`,
    {
      method: "PUT",
      body: JSON.stringify({ tags: [NEWSLETTER_TAG] }),
    },
    fetchImpl,
    config,
  );

  return { personId, created: event.status === 201 };
}
