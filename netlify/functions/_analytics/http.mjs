export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export function requireAdmin(request) {
  const configuredToken = process.env.ANALYTICS_ADMIN_TOKEN;
  if (!configuredToken) {
    return {
      ok: false,
      response: jsonResponse(
        {
          ok: false,
          error: "ANALYTICS_ADMIN_TOKEN is not configured in Netlify.",
        },
        503,
      ),
    };
  }

  const authorization = request.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (token !== configuredToken) {
    return {
      ok: false,
      response: jsonResponse({ ok: false, error: "Unauthorized." }, 401),
    };
  }

  return { ok: true };
}
