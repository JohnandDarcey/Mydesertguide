import assert from "node:assert/strict";
import { NEWSLETTER_TAG, registerNewsletterSignup } from "../netlify/functions/_newsletter/follow-up-boss.mjs";

const env = {
  FUB_API_KEY: "test-api-key",
  FUB_X_SYSTEM: "test-system",
  FUB_X_SYSTEM_KEY: "test-system-key",
};

const requests = [];
async function fetchImpl(url, options) {
  requests.push({ url, options });
  if (url.endsWith("/events")) {
    return new Response(JSON.stringify({ id: 7123, firstName: "Jane" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ id: 7123, tags: ["Existing Tag", NEWSLETTER_TAG] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const result = await registerNewsletterSignup(
  { firstName: "Jane", email: "jane@example.com" },
  { env, fetchImpl },
);

assert.deepEqual(result, { personId: 7123, created: false });
assert.equal(requests.length, 2);
assert.equal(requests[0].url, "https://api.followupboss.com/v1/events");
assert.equal(requests[0].options.method, "POST");
assert.equal(requests[0].options.headers["x-system"], env.FUB_X_SYSTEM);
assert.equal(requests[0].options.headers["x-system-key"], env.FUB_X_SYSTEM_KEY);
assert.equal(requests[0].options.headers.authorization, `Basic ${Buffer.from(`${env.FUB_API_KEY}:`).toString("base64")}`);
assert.deepEqual(JSON.parse(requests[0].options.body), {
  source: "mydesertguide.com",
  system: "My Desert Guide",
  type: "Registration",
  message: "Subscribed to My Desert Guide monthly updates",
  person: { firstName: "Jane", emails: [{ value: "jane@example.com" }] },
});
assert.equal(requests[1].url, "https://api.followupboss.com/v1/people/7123?mergeTags=true");
assert.equal(requests[1].options.method, "PUT");
assert.deepEqual(JSON.parse(requests[1].options.body), { tags: [NEWSLETTER_TAG] });

const requestsWithoutSystemKey = [];
await registerNewsletterSignup(
  { firstName: "Sam", email: "sam@example.com" },
  {
    env: { FUB_API_KEY: "another-test-key" },
    fetchImpl: async (url, options) => {
      requestsWithoutSystemKey.push({ url, options });
      return new Response(JSON.stringify({ id: 8124 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  },
);
assert.equal(requestsWithoutSystemKey[0].options.headers["x-system"], "My Desert Guide");
assert.equal("x-system-key" in requestsWithoutSystemKey[0].options.headers, false);

console.log("Validated Follow Up Boss registration, deduplication identity, authentication headers and merge-tag update.");
