import twilio from "twilio";
import { sql } from "@/lib/db";
import { auditLog } from "@/lib/audit";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM = process.env.TWILIO_FROM_NUMBER!;

/**
 * Send an outbound SMS to a patient via Twilio.
 * Logs the message in outreach_messages and audit_log.
 */
export async function sendSms(opts: {
  patientId: string;
  orderId: string;
  appointmentId?: string;
  phone: string;
  body: string;
  purpose: string;
}) {
  if (!process.env.TWILIO_ACCOUNT_SID || !FROM) {
    console.warn("Twilio not configured; logging stub SMS");

    await sql`
      insert into outreach_messages
        (patient_id, order_id, appointment_id, channel, direction, purpose, body, provider_ref)
      values (
        ${opts.patientId}::uuid,
        ${opts.orderId}::uuid,
        ${opts.appointmentId ?? null}::uuid,
        'sms', 'outbound', ${opts.purpose},
        ${opts.body},
        'stub_no_twilio'
      )`;

    return { stubbed: true };
  }

  const msg = await client.messages.create({
    to: opts.phone,
    from: FROM,
    body: opts.body,
  });

  await sql`
    insert into outreach_messages
      (patient_id, order_id, appointment_id, channel, direction, purpose, body, provider_ref)
    values (
      ${opts.patientId}::uuid,
      ${opts.orderId}::uuid,
      ${opts.appointmentId ?? null}::uuid,
      'sms', 'outbound', ${opts.purpose},
      ${opts.body},
      ${msg.sid}
    )`;

  await auditLog("system", "sms_sent", "outreach_messages", opts.patientId, {
    purpose: opts.purpose,
    sid: msg.sid,
  });

  return { sid: msg.sid };
}
