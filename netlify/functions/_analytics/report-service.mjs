import { GUIDE_CONFIG } from "./config.mjs";
import { renderDailyReportEmail } from "./email-template.mjs";
import { sendEmail } from "./email-provider.mjs";
import { getReportHistory, putReportHistory } from "./store.mjs";
import { getReportMetrics } from "./metrics.mjs";

function reportHistoryKey(date, recipient) {
  const recipientKey = (Array.isArray(recipient) ? recipient : [recipient])
    .map((email) => String(email).trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(",")
    .replace(/[^a-z0-9@._,-]/g, "-");
  return `${GUIDE_CONFIG.guideId}/${date}/${recipientKey}.json`;
}

export async function buildDailyReport(date) {
  const metrics = await getReportMetrics(date);
  const email = renderDailyReportEmail(metrics);
  return { metrics, email };
}

export async function sendDailyReport({
  date,
  recipient = GUIDE_CONFIG.recipient,
  test = false,
  force = false,
} = {}) {
  if (!date) throw new Error("A report date is required.");

  const key = test
    ? `tests/${date}/${Date.now()}-${reportHistoryKey(date, recipient)}`
    : reportHistoryKey(date, recipient);
  const existing = await getReportHistory(key);
  if (!test && !force && existing?.status === "sent") {
    return {
      ok: true,
      skipped: true,
      reason: "already-sent",
      reportDate: date,
      recipient,
      history: existing,
    };
  }

  await putReportHistory(key, {
    guide_id: GUIDE_CONFIG.guideId,
    profile_id: GUIDE_CONFIG.profileId,
    report_date: date,
    recipient,
    generated_at: new Date().toISOString(),
    status: test ? "test_generating" : "generating",
  });

  const { email } = await buildDailyReport(date);
  const subject = test ? `[Test] ${email.subject}` : email.subject;

  try {
    const providerResponse = await sendEmail({
      from: GUIDE_CONFIG.fromEmail,
      to: recipient,
      subject,
      html: email.html,
      text: email.text,
    });

    const history = {
      guide_id: GUIDE_CONFIG.guideId,
      profile_id: GUIDE_CONFIG.profileId,
      report_date: date,
      recipient,
      generated_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      status: test ? "test_sent" : "sent",
      email_provider: "resend",
      email_provider_message_id: providerResponse?.id || null,
      subject,
    };
    await putReportHistory(key, history);

    return {
      ok: true,
      skipped: false,
      reportDate: date,
      recipient,
      messageId: providerResponse?.id || null,
      subject,
    };
  } catch (error) {
    await putReportHistory(key, {
      guide_id: GUIDE_CONFIG.guideId,
      profile_id: GUIDE_CONFIG.profileId,
      report_date: date,
      recipient,
      generated_at: new Date().toISOString(),
      failed_at: new Date().toISOString(),
      status: test ? "test_failed" : "failed",
      error: error.message,
      subject,
    });
    throw error;
  }
}
